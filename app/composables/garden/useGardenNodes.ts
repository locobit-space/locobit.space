// composables/garden/useGardenNodes.ts
// ─────────────────────────────────────────────────────────────────────────────
// Derives the node registry from the latest telemetry.
// Nodes are NOT stored as separate Nostr events — they are discovered
// automatically from kind 30010 telemetry and kind 30015 zone configs.
// An "offline" state is inferred when a node hasn't reported in > threshold.
// ─────────────────────────────────────────────────────────────────────────────

import type { GardenNode, GardenTelemetry, HealthStatus, NodeRole } from "~/types/GardenOS"
import { useGardenTelemetry } from "./useGardenTelemetry"
import { useGardenZones } from "./useGardenZones"

/** A node is considered offline after this many ms without a telemetry update */
const OFFLINE_THRESHOLD_MS = 5 * 60 * 1000 // 5 minutes

export const useGardenNodes = () => {
  const { latestByNode } = useGardenTelemetry()
  const { zones }        = useGardenZones()

  // ─── Derive node list from telemetry + zone configs ──────────────────────

  const nodes = computed<GardenNode[]>(() => {
    const now = Date.now()
    return Object.values(latestByNode.value).map((t: GardenTelemetry) => {
      const zone    = zones.value.find(z => z.id === t.zoneId)
      const isOnline = (now - (t.timestamp ?? 0)) < OFFLINE_THRESHOLD_MS

      // Role inference: if node is listed as irrigationNodeId → actuator
      let role: NodeRole = "sensor"
      if (zone?.irrigationNodeId === t.nodeId)        role = "actuator"
      else if ((zone?.nodeIds?.length ?? 0) > 1)      role = "hybrid"

      const health: HealthStatus = !isOnline ? "offline" : t.healthStatus

      return {
        id:            t.nodeId,
        zoneId:        t.zoneId,
        name:          `Node ${t.nodeId.slice(-6)}`,
        role,
        lastSeen:      t.timestamp,
        batteryLevel:  t.batteryLevel,
        signalStrength: t.signalStrength,
        isOnline,
        healthStatus:  health,
        telemetry:     t,
      } satisfies GardenNode
    })
  })

  // ─── Stats ────────────────────────────────────────────────────────────────

  const totalNodes   = computed(() => nodes.value.length)
  const onlineNodes  = computed(() => nodes.value.filter(n => n.isOnline))
  const offlineNodes = computed(() => nodes.value.filter(n => !n.isOnline))
  const criticalNodes = computed(() => nodes.value.filter(n => n.healthStatus === "critical"))

  const nodesByZone = computed(() => {
    const map: Record<string, GardenNode[]> = {}
    for (const n of nodes.value) {
      if (!map[n.zoneId]) map[n.zoneId] = []
      map[n.zoneId]!.push(n)
    }
    return map
  })

  const getNodeById = (id: string) => nodes.value.find(n => n.id === id)

  // ─── Mock node registration (dev / demo) ─────────────────────────────────

  /**
   * Registers a virtual node by injecting a seed telemetry reading.
   * In production, nodes self-register by publishing telemetry events.
   */
  const registerMockNode = (node: {
    id: string
    zoneId: string
    role?: NodeRole
  }) => {
    const { ingest } = useGardenTelemetry()
    ingest({
      eventId:       `mock-reg-${node.id}`,
      id:            `${node.id}:${Date.now()}`,
      nodeId:        node.id,
      zoneId:        node.zoneId,
      soilMoisture:  50,
      temperature:   25,
      batteryLevel:  80,
      waterTankLevel: 60,
      signalStrength: -65,
      packetLoss:    2,
      timestamp:     Date.now(),
      healthStatus:  "healthy",
      createdAt:     Date.now(),
    })
  }

  return {
    nodes,
    totalNodes,
    onlineNodes,
    offlineNodes,
    criticalNodes,
    nodesByZone,
    getNodeById,
    registerMockNode,
  }
}
