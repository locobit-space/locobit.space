// composables/garden/useGardenOS.ts
// ─────────────────────────────────────────────────────────────────────────────
// Top-level orchestrator.  Initialises all sub-systems, wires telemetry
// → automation → irrigation → audit in a single call.
//
// Usage:
//   const os = useGardenOS()
//   await os.boot()          // connect, load state, start subscriptions
//   os.shutdown()            // clean teardown
// ─────────────────────────────────────────────────────────────────────────────

import type { GardenDashboardSummary, RbacRole } from "~/types/GardenOS"
import { useGardenTelemetry } from "./useGardenTelemetry"
import { useGardenZones }     from "./useGardenZones"
import { useGardenIrrigation } from "./useGardenIrrigation"
import { useGardenAlerts }    from "./useGardenAlerts"
import { useGardenAutomation } from "./useGardenAutomation"
import { useGardenAudit }     from "./useGardenAudit"
import { useGardenNodes }     from "./useGardenNodes"

export const useGardenOS = () => {
  // ─── Sub-systems ─────────────────────────────────────────────────────────
  const telemetry   = useGardenTelemetry()
  const zones       = useGardenZones()
  const irrigation  = useGardenIrrigation()
  const alerts      = useGardenAlerts()
  const automation  = useGardenAutomation()
  const audit       = useGardenAudit()
  const nodes       = useGardenNodes()
  const { user }    = useNostrUser()

  const isBooted  = useState<boolean>("gardenOS-booted",  () => false)
  const isMocking = useState<boolean>("gardenOS-mocking", () => false)

  // ─── Wire telemetry → alerts → automation ────────────────────────────────

  const onTelemetry = (t: Parameters<typeof telemetry.ingest>[0]) => {
    telemetry.ingest(t)

    // Auto-generate threshold alerts (no key needed for local-only)
    alerts.checkThresholds(t)

    // Feed automation engine
    automation.sendTelemetryToWorker(t)

    // In-process evaluation (no Worker fallback needed)
    const pk = user.value?.privateKey
    if (pk) {
      automation.evaluateRules(t, {
        privateKeyHex: pk,
        onIrrigateOn: async (zId, nId, dur, ruleId) => {
          await irrigation.irrigateOn({
            privateKeyHex:   pk,
            zoneId:          zId,
            nodeId:          nId,
            durationSeconds: dur,
            source:          "automation",
            ruleId,
            actorRole:       "owner",
          })
          audit.logAudit({
            privateKeyHex: pk,
            action:        "irrigation_start",
            actorPubkey:   user.value!.publicKey,
            actorRole:     "owner",
            targetId:      zId,
            targetType:    "zone",
            payload:       { ruleId, duration: dur },
          })
        },
        onIrrigateOff: async (zId, nId, ruleId) => {
          await irrigation.irrigateOff({
            privateKeyHex: pk,
            zoneId:        zId,
            nodeId:        nId,
            source:        "automation",
            actorRole:     "owner",
          })
          audit.logAudit({
            privateKeyHex: pk,
            action:        "irrigation_stop",
            actorPubkey:   user.value!.publicKey,
            actorRole:     "owner",
            targetId:      zId,
            targetType:    "zone",
            payload:       { ruleId },
          })
        },
        onAlert: (msg, ruleId) => {
          alerts.alerts.value.unshift({
            eventId:      `rule-alert-${ruleId}-${Date.now()}`,
            id:           `rule-alert-${ruleId}-${Date.now()}`,
            nodeId:       t.nodeId,
            zoneId:       t.zoneId,
            alertType:    "rule_triggered",
            severity:     "info",
            message:      msg,
            acknowledged: false,
            createdAt:    Date.now(),
          })
        },
      }).catch(console.error)
    }
  }

  // ─── Boot ─────────────────────────────────────────────────────────────────

  const boot = async (opts?: { mockMode?: boolean }) => {
    if (isBooted.value) return

    // Load persisted state in parallel
    const pk = user.value?.publicKey
    await Promise.allSettled([
      zones.loadZones(pk),
      automation.loadRules(pk),
      alerts.loadAlerts(pk),
      audit.loadAuditLog(pk),
      irrigation.loadCommands(pk),
    ])

    // Start relay subscription
    telemetry.subscribe()
    automation.startWorker()

    if (opts?.mockMode) {
      isMocking.value = true
      // Register demo nodes
      const demoNodes = ["node-001", "node-002", "node-003", "node-004"]
      demoNodes.forEach((id, i) => {
        nodes.registerMockNode({ id, zoneId: `zone-${(i % 2) + 1}` })
      })
      telemetry.startMockFeed(demoNodes)
    }

    isBooted.value = true
  }

  // ─── Shutdown ────────────────────────────────────────────────────────────

  const shutdown = () => {
    telemetry.unsubscribe()
    telemetry.stopMockFeed()
    automation.stopWorker()
    isBooted.value  = false
    isMocking.value = false
  }

  // ─── Dashboard summary ────────────────────────────────────────────────────

  const dashboardSummary = computed<GardenDashboardSummary>(() => ({
    totalZones:         zones.zones.value.length,
    activeZones:        zones.activeZones.value.length,
    totalNodes:         nodes.totalNodes.value,
    onlineNodes:        nodes.onlineNodes.value.length,
    pendingAlerts:      alerts.unreadCount.value,
    activeIrrigations:  irrigation.activeCount.value,
    lastTelemetryAt:    telemetry.nodes.value[0]?.timestamp,
    avgSoilMoisture:    telemetry.avgSoilMoisture.value,
    avgBatteryLevel:    telemetry.avgBattery.value,
  }))

  return {
    // Sub-systems (direct access when needed)
    telemetry,
    zones,
    irrigation,
    alerts,
    automation,
    audit,
    nodes,
    // Orchestrator
    isBooted,
    isMocking,
    dashboardSummary,
    boot,
    shutdown,
    onTelemetry,
  }
}
