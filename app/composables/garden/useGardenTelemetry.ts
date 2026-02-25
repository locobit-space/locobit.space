// composables/garden/useGardenTelemetry.ts
// ─────────────────────────────────────────────────────────────────────────────
// Subscribes to kind 30010 events from connected relays,
// validates them with Zod, derives health status, and keeps a
// rolling window of readings per node in Vue state.
// Telemetry is also persisted to localStorage as a simple ring buffer
// (production would use IndexedDB / Dexie for the full history).
// ─────────────────────────────────────────────────────────────────────────────

import { finalizeEvent } from "nostr-tools/pure"
import { hexToBytes }    from "@noble/ciphers/utils"
import type { GardenTelemetry, HealthStatus } from "~/types/GardenOS"
import { TelemetryContentSchema, parseTags, safeJsonParse } from "./schemas"

export const GARDEN_KINDS = {
  TELEMETRY:  30010,
  IRRIGATION: 30011,
  ALERT:      30012,
  WORKER:     30013,
  AUTOMATION: 30014,
  ZONE:       30015,
  AUDIT:      30016,
} as const

const STORAGE_KEY = "gardenOS_telemetry"
const MAX_HISTORY = 100 // per node

// ─── Health derivation ────────────────────────────────────────────────────────

function deriveTelemetryHealth(t: Partial<GardenTelemetry>): HealthStatus {
  if (t.batteryLevel !== undefined && t.batteryLevel < 15) return "critical"
  if (t.soilMoisture !== undefined && t.soilMoisture < 20)  return "warning"
  if (t.temperature  !== undefined && t.temperature > 40)   return "warning"
  if (t.signalStrength !== undefined && t.signalStrength < -90) return "warning"
  return "healthy"
}

// ─── Composable ───────────────────────────────────────────────────────────────

export const useGardenTelemetry = () => {
  const { $nostr }  = useNuxtApp()
  const { pool }    = $nostr
  const { DEFAULT_RELAYS: RELAYS } = useNostrRelay()

  /** Latest telemetry per nodeId */
  const latestByNode = useState<Record<string, GardenTelemetry>>(
    "gardenOS-telemetry-latest", () => ({})
  )

  /** History (ring-buffer) per nodeId */
  const historyByNode = useState<Record<string, GardenTelemetry[]>>(
    "gardenOS-telemetry-history", () => ({})
  )

  const isSubscribed = useState<boolean>("gardenOS-tele-subscribed", () => false)

  // ─── Persistence helpers ──────────────────────────────────────────────────

  const persistLatest = () => {
    if (!import.meta.client) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(latestByNode.value))
    } catch { /* quota exceeded – ignore */ }
  }

  const loadPersistedTelemetry = () => {
    if (!import.meta.client) return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) latestByNode.value = JSON.parse(raw)
    } catch { /* corrupted – skip */ }
  }

  // ─── Parse raw Nostr event → GardenTelemetry ─────────────────────────────

  const parseEvent = (event: { id: string; content: string; tags: string[][]; created_at: number }): GardenTelemetry | null => {
    const raw     = safeJsonParse<unknown>(event.content)
    const result  = TelemetryContentSchema.safeParse(raw)
    if (!result.success) return null

    const d      = parseTags(event.tags)
    const data   = result.data
    const health = deriveTelemetryHealth(data)

    return {
      eventId:        event.id,
      id:             d.d ?? `${data.nodeId}:${data.timestamp}`,
      ...data,
      healthStatus:   health,
      createdAt:      event.created_at * 1000,
    } as GardenTelemetry
  }

  // ─── Ingest a telemetry record (from relay or mock) ──────────────────────

  const ingest = (t: GardenTelemetry) => {
    latestByNode.value[t.nodeId] = t

    if (!historyByNode.value[t.nodeId]) historyByNode.value[t.nodeId] = []
    historyByNode.value[t.nodeId]!.unshift(t)
    if (historyByNode.value[t.nodeId]!.length > MAX_HISTORY)
      historyByNode.value[t.nodeId]!.splice(MAX_HISTORY)

    persistLatest()
  }

  // ─── Subscribe to relay feed ──────────────────────────────────────────────

  let sub: { close(): void } | null = null

  const subscribe = (filterNodeIds?: string[]) => {
    if (isSubscribed.value) return
    loadPersistedTelemetry()

    const filter: Record<string, unknown> = { kinds: [GARDEN_KINDS.TELEMETRY] }
    if (filterNodeIds?.length) filter["#d"] = filterNodeIds

    sub = pool.subscribeMany(RELAYS, [filter] as any, {
      onevent(event: { id: string; content: string; tags: string[][]; created_at: number }) {
        const t = parseEvent(event)
        if (t) ingest(t)
      },
    })
    isSubscribed.value = true
  }

  const unsubscribe = () => {
    sub?.close()
    sub = null
    isSubscribed.value = false
  }

  // ─── Derived stats ────────────────────────────────────────────────────────

  const nodes = computed(() => Object.values(latestByNode.value))

  const avgSoilMoisture = computed(() => {
    const vals = nodes.value.map(n => n.soilMoisture).filter(v => v !== undefined) as number[]
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : undefined
  })

  const avgBattery = computed(() => {
    const vals = nodes.value.map(n => n.batteryLevel).filter(v => v !== undefined) as number[]
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : undefined
  })

  const criticalNodes = computed(() =>
    nodes.value.filter(n => n.healthStatus === "critical")
  )

  // ─── Simulate mock reading (dev/demo) ─────────────────────────────────────

  let mockTimer: NodeJS.Timeout | null = null

  const startMockFeed = (nodeIds: string[]) => {
    if (mockTimer) return
    const zoneIds = ["zone-1", "zone-2"]
    mockTimer = setInterval(() => {
      nodeIds.forEach((nodeId, i) => {
        const t: GardenTelemetry = {
          eventId:       `mock-${nodeId}-${Date.now()}`,
          id:            `${nodeId}:${Date.now()}`,
          nodeId,
          zoneId:        zoneIds[i % zoneIds.length] ?? "zone-1",
          soilMoisture:  Math.round(20 + Math.random() * 60),
          temperature:   Math.round(20 + Math.random() * 20),
          humidity:      Math.round(40 + Math.random() * 40),
          batteryLevel:  Math.round(30 + Math.random() * 70),
          waterTankLevel: Math.round(20 + Math.random() * 80),
          signalStrength: Math.round(-80 + Math.random() * 30),
          packetLoss:    Math.round(Math.random() * 10),
          timestamp:     Date.now(),
          healthStatus:  "healthy",
          createdAt:     Date.now(),
        }
        t.healthStatus = deriveTelemetryHealth(t)
        ingest(t)
      })
    }, 4000)
  }

  const stopMockFeed = () => {
    if (mockTimer) clearInterval(mockTimer)
    mockTimer = null
  }

  // ─── Publish a test telemetry event ──────────────────────────────────────

  const publishTelemetry = async (
    privateKeyHex: string,
    content: Record<string, unknown>
  ) => {
    const sk     = hexToBytes(privateKeyHex)
    const event  = finalizeEvent({
      kind:       GARDEN_KINDS.TELEMETRY,
      created_at: Math.floor(Date.now() / 1000),
      tags:       [["d", `${content.nodeId}:${Date.now()}`]],
      content:    JSON.stringify(content),
    }, sk)
    await Promise.allSettled(pool.publish(RELAYS, event))
    return event
  }

  return {
    latestByNode,
    historyByNode,
    nodes,
    avgSoilMoisture,
    avgBattery,
    criticalNodes,
    isSubscribed,
    subscribe,
    unsubscribe,
    ingest,
    startMockFeed,
    stopMockFeed,
    publishTelemetry,
    deriveTelemetryHealth,
  }
}
