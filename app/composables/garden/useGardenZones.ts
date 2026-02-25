// composables/garden/useGardenZones.ts
// ─────────────────────────────────────────────────────────────────────────────
// CRUD for kind 30015 Zone config events.
// Zones represent physical garden areas.  Each zone tracks which sensor
// nodes are attached and derives its aggregate health from them.
// ─────────────────────────────────────────────────────────────────────────────

import { finalizeEvent } from "nostr-tools/pure"
import { hexToBytes }    from "@noble/ciphers/utils"
import type { GardenZone, HealthStatus } from "~/types/GardenOS"
import { ZoneContentSchema, parseTags, safeJsonParse } from "./schemas"
import { GARDEN_KINDS } from "./useGardenTelemetry"

export const useGardenZones = () => {
  const { $nostr }  = useNuxtApp()
  const { pool }    = $nostr
  const { DEFAULT_RELAYS: RELAYS } = useNostrRelay()
  const { user }    = useNostrUser()

  const zones     = useState<GardenZone[]>("gardenOS-zones",     () => [])
  const isLoading = useState<boolean>("gardenOS-zones-loading",  () => false)
  const error     = useState<string | null>("gardenOS-zones-err", () => null)

  // ─── Parse raw event ──────────────────────────────────────────────────────

  const parseEvent = (event: { id: string; content: string; tags: string[][]; created_at: number }): GardenZone | null => {
    const raw    = safeJsonParse<unknown>(event.content)
    const result = ZoneContentSchema.safeParse(raw)
    if (!result.success) return null

    const d    = parseTags(event.tags)
    const data = result.data
    return {
      eventId:     event.id,
      id:          d.d ?? event.id,
      healthStatus: "healthy" as HealthStatus,
      createdAt:   event.created_at * 1000,
      ...data,
    } as GardenZone
  }

  // ─── Load zones from relays ───────────────────────────────────────────────

  const loadZones = async (pubkey?: string) => {
    const author = pubkey ?? user.value?.publicKey
    if (!author) return

    isLoading.value = true
    error.value     = null

    try {
      const events = await pool.querySync(RELAYS, {
        kinds:   [GARDEN_KINDS.ZONE],
        authors: [author],
      })

      // Deduplicate by d-tag, keep latest
      const byDTag = new Map<string, GardenZone>()
      for (const ev of events) {
        const zone = parseEvent(ev)
        if (!zone) continue
        const existing = byDTag.get(zone.id)
        if (!existing || ev.created_at > (existing.createdAt / 1000))
          byDTag.set(zone.id, zone)
      }
      zones.value = Array.from(byDTag.values()).sort((a, b) => a.name.localeCompare(b.name))
    } catch (e: any) {
      error.value = e?.message ?? "Failed to load zones"
    } finally {
      isLoading.value = false
    }
  }

  // ─── Publish zone config ──────────────────────────────────────────────────

  const publishZone = async (
    privateKeyHex: string,
    zone: Omit<GardenZone, "eventId" | "createdAt" | "healthStatus">
  ) => {
    const sk    = hexToBytes(privateKeyHex)
    const event = finalizeEvent({
      kind:       GARDEN_KINDS.ZONE,
      created_at: Math.floor(Date.now() / 1000),
      tags:       [
        ["d", zone.id],
        ["t", "garden_zone"],
        ["name", zone.name],
      ],
      content: JSON.stringify({
        name:             zone.name,
        description:      zone.description,
        type:             zone.type,
        area:             zone.area,
        areaUnit:         zone.areaUnit,
        cropType:         zone.cropType,
        targetMoisture:   zone.targetMoisture,
        nodeIds:          zone.nodeIds,
        irrigationNodeId: zone.irrigationNodeId,
        isActive:         zone.isActive,
        coordinates:      zone.coordinates,
      }),
    }, sk)
    await Promise.allSettled(pool.publish(RELAYS, event))

    // Optimistically update local state
    const newZone: GardenZone = { ...zone, eventId: event.id, healthStatus: "healthy", createdAt: Date.now() }
    const idx = zones.value.findIndex(z => z.id === zone.id)
    if (idx >= 0) zones.value.splice(idx, 1, newZone)
    else zones.value.push(newZone)

    return event
  }

  // ─── Update zone health based on current telemetry ───────────────────────

  const updateZoneHealth = (zoneId: string, nodeHealth: HealthStatus[]) => {
    const zone = zones.value.find(z => z.id === zoneId)
    if (!zone) return
    if (nodeHealth.includes("critical"))      zone.healthStatus = "critical"
    else if (nodeHealth.includes("warning"))  zone.healthStatus = "warning"
    else if (nodeHealth.includes("offline"))  zone.healthStatus = "offline"
    else                                      zone.healthStatus = "healthy"
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  const getZoneById = (id: string) => zones.value.find(z => z.id === id)

  const activeZones = computed(() => zones.value.filter(z => z.isActive))

  return {
    zones,
    activeZones,
    isLoading,
    error,
    loadZones,
    publishZone,
    updateZoneHealth,
    getZoneById,
  }
}
