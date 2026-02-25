// composables/garden/useGardenAudit.ts
// ─────────────────────────────────────────────────────────────────────────────
// Publishes kind 30016 audit events and loads the audit trail.
// Every critical action (irrigation, rule change, config) must call
// logAudit() before returning to the caller.
// ─────────────────────────────────────────────────────────────────────────────

import { finalizeEvent } from "nostr-tools/pure"
import { hexToBytes }    from "@noble/ciphers/utils"
import type { GardenAuditLog, AuditAction, RbacRole } from "~/types/GardenOS"
import { AuditLogContentSchema, parseTags, safeJsonParse } from "./schemas"
import { GARDEN_KINDS } from "./useGardenTelemetry"

export const useGardenAudit = () => {
  const { $nostr }  = useNuxtApp()
  const { pool }    = $nostr
  const { DEFAULT_RELAYS: RELAYS } = useNostrRelay()
  const { user }    = useNostrUser()

  const logs      = useState<GardenAuditLog[]>("gardenOS-audit", () => [])
  const isLoading = useState<boolean>("gardenOS-audit-loading", () => false)

  // ─── Parse raw event ──────────────────────────────────────────────────────

  const parseEvent = (event: { id: string; content: string; tags: string[][]; created_at: number }): GardenAuditLog | null => {
    const raw    = safeJsonParse<unknown>(event.content)
    const result = AuditLogContentSchema.safeParse(raw)
    if (!result.success) return null

    const d    = parseTags(event.tags)
    const data = result.data
    return {
      eventId:    event.id,
      id:         d.d ?? event.id,
      createdAt:  event.created_at * 1000,
      ...data,
    } as GardenAuditLog
  }

  // ─── Publish an audit log entry ───────────────────────────────────────────

  const logAudit = async (opts: {
    privateKeyHex: string
    action:        AuditAction
    actorPubkey:   string
    actorRole:     RbacRole
    targetId?:     string
    targetType?:   string
    payload?:      Record<string, unknown>
  }) => {
    const sk      = hexToBytes(opts.privateKeyHex)
    const dTag    = `audit:${opts.action}:${Date.now()}`
    const event   = finalizeEvent({
      kind:        GARDEN_KINDS.AUDIT,
      created_at:  Math.floor(Date.now() / 1000),
      tags:        [
        ["d",        dTag],
        ["t",        "audit"],
        ["action",   opts.action],
      ],
      content: JSON.stringify({
        action:      opts.action,
        actorPubkey: opts.actorPubkey,
        actorRole:   opts.actorRole,
        targetId:    opts.targetId,
        targetType:  opts.targetType,
        payload:     opts.payload,
      }),
    }, sk)

    // Fire and forget — audit must not block main operation
    Promise.allSettled(pool.publish(RELAYS, event)).catch(() => {})

    const entry: GardenAuditLog = {
      eventId:     event.id,
      id:          dTag,
      action:      opts.action,
      actorPubkey: opts.actorPubkey,
      actorRole:   opts.actorRole,
      targetId:    opts.targetId,
      targetType:  opts.targetType,
      payload:     opts.payload,
      createdAt:   Date.now(),
    }
    logs.value.unshift(entry)
    return entry
  }

  // ─── Load audit trail from relay ─────────────────────────────────────────

  const loadAuditLog = async (pubkey?: string, limitDays = 30) => {
    const author = pubkey ?? user.value?.publicKey
    if (!author) return

    isLoading.value = true
    const since = Math.floor((Date.now() - limitDays * 864e5) / 1000)
    try {
      const events = await pool.querySync(RELAYS, {
        kinds:   [GARDEN_KINDS.AUDIT],
        authors: [author],
        since,
      })
      const parsed = events
        .map(parseEvent)
        .filter(Boolean) as GardenAuditLog[]
      logs.value = parsed.sort((a, b) => b.createdAt - a.createdAt)
    } finally {
      isLoading.value = false
    }
  }

  const recentLogs = computed(() => logs.value.slice(0, 50))

  return {
    logs,
    recentLogs,
    isLoading,
    logAudit,
    loadAuditLog,
  }
}
