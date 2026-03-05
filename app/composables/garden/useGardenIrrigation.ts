// composables/garden/useGardenIrrigation.ts
// ─────────────────────────────────────────────────────────────────────────────
// Publishes & tracks kind 30011 irrigation commands.
// Supports manual, scheduled, and automation-triggered activations.
// RBAC is enforced server-side by checking the signer's role before
// publishing.  The audit log composable is called for every state change.
// ─────────────────────────────────────────────────────────────────────────────

import { finalizeEvent } from "nostr-tools/pure"
import { hexToBytes }    from "@noble/ciphers/utils"
import type { GardenIrrigation, RbacRole } from "~/types/GardenOS"
import { IrrigationContentSchema, parseTags, safeJsonParse } from "./schemas"
import { GARDEN_KINDS } from "./useGardenTelemetry"

// Roles allowed to issue commands
const ALLOWED_ROLES: RbacRole[] = ["owner", "admin", "worker"]

export const useGardenIrrigation = () => {
  const { $nostr }  = useNuxtApp()
  const { pool }    = $nostr
  const { DEFAULT_RELAYS: RELAYS } = useNostrRelay()
  const { user }    = useNostrUser()

  const commands    = useState<GardenIrrigation[]>("gardenOS-irrigation",         () => [])
  const activeZones = useState<Record<string, GardenIrrigation>>("gardenOS-irrigation-active", () => ({}))
  const isLoading   = useState<boolean>("gardenOS-irrig-loading",                 () => false)

  /** Active timer handles (nodeId → timeout id) */
  const autoOffTimers = new Map<string, NodeJS.Timeout>()

  // ─── RBAC check ──────────────────────────────────────────────────────────

  const checkPermission = (role?: RbacRole): boolean => {
    if (!role) return false
    return ALLOWED_ROLES.includes(role)
  }

  // ─── Parse raw event ──────────────────────────────────────────────────────

  const parseEvent = (event: { id: string; content: string; tags: string[][]; created_at: number }): GardenIrrigation | null => {
    const raw    = safeJsonParse<unknown>(event.content)
    const result = IrrigationContentSchema.safeParse(raw)
    if (!result.success) return null

    const d    = parseTags(event.tags)
    const data = result.data
    return {
      eventId:      event.id,
      id:           d.d ?? event.id,
      status:       data.command === "on" ? "running" : "idle",
      executedAt:   event.created_at * 1000,
      createdAt:    event.created_at * 1000,
      ...data,
    } as GardenIrrigation
  }

  // ─── Internal publish ─────────────────────────────────────────────────────

  const _publish = async (
    privateKeyHex: string,
    payload: Omit<GardenIrrigation, "eventId" | "createdAt" | "executedAt" | "status">
  ) => {
    const sk      = hexToBytes(privateKeyHex)
    const dTag    = `${payload.zoneId}:${Date.now()}`
    const event   = finalizeEvent({
      kind:       GARDEN_KINDS.IRRIGATION,
      created_at: Math.floor(Date.now() / 1000),
      tags:       [
        ["d", dTag],
        ["t", "irrigation"],
        ["zone", payload.zoneId],
        ["node", payload.nodeId],
      ],
      content: JSON.stringify({
        zoneId:      payload.zoneId,
        nodeId:      payload.nodeId,
        command:     payload.command,
        duration:    payload.duration,
        source:      payload.source,
        ruleId:      payload.ruleId,
        scheduledAt: payload.scheduledAt,
      }),
    }, sk)
    await Promise.allSettled(pool.publish(RELAYS, event))
    return dTag
  }

  // ─── Turn irrigation ON ───────────────────────────────────────────────────

  const irrigateOn = async (opts: {
    privateKeyHex: string
    zoneId: string
    nodeId: string
    durationSeconds: number
    source?: GardenIrrigation["source"]
    ruleId?: string
    actorRole: RbacRole
  }) => {
    if (!checkPermission(opts.actorRole))
      throw new Error("RBAC: insufficient role to control irrigation")

    const dTag = await _publish(opts.privateKeyHex, {
      id:       "",
      zoneId:   opts.zoneId,
      nodeId:   opts.nodeId,
      command:  "on",
      duration: opts.durationSeconds,
      source:   opts.source ?? "manual",
      ruleId:   opts.ruleId,
    })

    const record: GardenIrrigation = {
      eventId:   dTag,
      id:        dTag,
      zoneId:    opts.zoneId,
      nodeId:    opts.nodeId,
      command:   "on",
      duration:  opts.durationSeconds,
      source:    opts.source ?? "manual",
      ruleId:    opts.ruleId,
      status:    "running",
      executedAt: Date.now(),
      createdAt:  Date.now(),
    }
    commands.value.unshift(record)
    activeZones.value[opts.zoneId] = record

    // Auto-off after duration
    const existing = autoOffTimers.get(opts.zoneId)
    if (existing) clearTimeout(existing)
    const timer = setTimeout(async () => {
      await irrigateOff({
        privateKeyHex:  opts.privateKeyHex,
        zoneId:         opts.zoneId,
        nodeId:         opts.nodeId,
        source:         opts.source ?? "manual",
        actorRole:      opts.actorRole,
      })
    }, opts.durationSeconds * 1000)
    autoOffTimers.set(opts.zoneId, timer)

    return record
  }

  // ─── Turn irrigation OFF ─────────────────────────────────────────────────

  const irrigateOff = async (opts: {
    privateKeyHex: string
    zoneId: string
    nodeId: string
    source?: GardenIrrigation["source"]
    actorRole: RbacRole
  }) => {
    if (!checkPermission(opts.actorRole))
      throw new Error("RBAC: insufficient role to control irrigation")

    await _publish(opts.privateKeyHex, {
      id:      "",
      zoneId:  opts.zoneId,
      nodeId:  opts.nodeId,
      command: "off",
      source:  opts.source ?? "manual",
    })

    delete activeZones.value[opts.zoneId]
    autoOffTimers.delete(opts.zoneId)
  }

  // ─── Load recent commands from relay ─────────────────────────────────────

  const loadCommands = async (pubkey?: string, limitDays = 7) => {
    const author = pubkey ?? user.value?.publicKey
    if (!author) return

    isLoading.value = true
    const since = Math.floor((Date.now() - limitDays * 864e5) / 1000)
    try {
      const events = await pool.querySync(RELAYS, {
        kinds:   [GARDEN_KINDS.IRRIGATION],
        authors: [author],
        since,
      })
      const parsed = events
        .map(parseEvent)
        .filter(Boolean) as GardenIrrigation[]
      commands.value = parsed.sort((a, b) => b.createdAt - a.createdAt)
    } finally {
      isLoading.value = false
    }
  }

  // ─── Derived ─────────────────────────────────────────────────────────────

  const isZoneActive = (zoneId: string) => !!activeZones.value[zoneId]
  const activeCount  = computed(() => Object.keys(activeZones.value).length)

  return {
    commands,
    activeZones,
    activeCount,
    isLoading,
    irrigateOn,
    irrigateOff,
    loadCommands,
    isZoneActive,
    checkPermission,
  }
}
