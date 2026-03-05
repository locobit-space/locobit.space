// composables/garden/useGardenAlerts.ts
// ─────────────────────────────────────────────────────────────────────────────
// Manages kind 30012 alert events.
// New alerts can be generated locally (by the automation engine or threshold
// watcher) and published to relay.  Acknowledgement updates local state and
// records an audit entry.
// ─────────────────────────────────────────────────────────────────────────────

import { finalizeEvent } from "nostr-tools/pure"
import { hexToBytes }    from "@noble/ciphers/utils"
import type { GardenAlert, GardenTelemetry } from "~/types/GardenOS"
import { AlertContentSchema, parseTags, safeJsonParse } from "./schemas"
import { GARDEN_KINDS } from "./useGardenTelemetry"

export const useGardenAlerts = () => {
  const { $nostr }  = useNuxtApp()
  const { pool }    = $nostr
  const { DEFAULT_RELAYS: RELAYS } = useNostrRelay()
  const { user }    = useNostrUser()

  const alerts      = useState<GardenAlert[]>("gardenOS-alerts",         () => [])
  const isLoading   = useState<boolean>("gardenOS-alerts-loading",       () => false)
  const unreadCount = computed(() => alerts.value.filter(a => !a.acknowledged).length)

  // ─── Parse raw event ──────────────────────────────────────────────────────

  const parseEvent = (event: { id: string; content: string; tags: string[][]; created_at: number }): GardenAlert | null => {
    const raw    = safeJsonParse<unknown>(event.content)
    const result = AlertContentSchema.safeParse(raw)
    if (!result.success) return null

    const d    = parseTags(event.tags)
    const data = result.data
    return {
      eventId:      event.id,
      id:           d.d ?? event.id,
      acknowledged: false,
      createdAt:    event.created_at * 1000,
      ...data,
    } as GardenAlert
  }

  // ─── Publish alert ────────────────────────────────────────────────────────

  const publishAlert = async (
    privateKeyHex: string,
    alert: Omit<GardenAlert, "eventId" | "id" | "acknowledged" | "createdAt">
  ) => {
    const sk    = hexToBytes(privateKeyHex)
    const dTag  = `alert:${alert.nodeId}:${Date.now()}`
    const event = finalizeEvent({
      kind:       GARDEN_KINDS.ALERT,
      created_at: Math.floor(Date.now() / 1000),
      tags:       [
        ["d",         dTag],
        ["t",         "alert"],
        ["severity",  alert.severity],
        ["zone",      alert.zoneId],
        ["node",      alert.nodeId],
      ],
      content: JSON.stringify({
        nodeId:            alert.nodeId,
        zoneId:            alert.zoneId,
        alertType:         alert.alertType,
        severity:          alert.severity,
        message:           alert.message,
        telemetrySnapshot: alert.telemetrySnapshot,
      }),
    }, sk)

    await Promise.allSettled(pool.publish(RELAYS, event))

    const newAlert: GardenAlert = {
      eventId:      event.id,
      id:           dTag,
      acknowledged: false,
      createdAt:    Date.now(),
      ...alert,
    }
    alerts.value.unshift(newAlert)
    return newAlert
  }

  // ─── Auto-generate alerts from telemetry reading ──────────────────────────
  // Called by the telemetry subscription on every reading.

  const checkThresholds = (
    t: GardenTelemetry,
    privateKeyHex?: string
  ): string[] => {
    const issues: { type: string; severity: GardenAlert["severity"]; msg: string }[] = []

    if (t.soilMoisture !== undefined && t.soilMoisture < 25)
      issues.push({ type: "low_moisture",  severity: "warning",  msg: `Node ${t.nodeId}: soil moisture ${t.soilMoisture}% is below 25%` })
    if (t.temperature  !== undefined && t.temperature > 38)
      issues.push({ type: "high_temp",     severity: "warning",  msg: `Node ${t.nodeId}: temperature ${t.temperature}°C exceeds 38°C` })
    if (t.batteryLevel !== undefined && t.batteryLevel < 15)
      issues.push({ type: "low_battery",   severity: "critical", msg: `Node ${t.nodeId}: battery ${t.batteryLevel}% is critically low` })
    if (t.waterTankLevel !== undefined && t.waterTankLevel < 15)
      issues.push({ type: "low_tank",      severity: "critical", msg: `Water tank at ${t.waterTankLevel}% — refill needed` })

    const messages: string[] = []
    for (const issue of issues) {
      // Deduplicate — skip if same alert type already unacknowledged for this node
      const exists = alerts.value.find(
        a => !a.acknowledged && a.nodeId === t.nodeId && a.alertType === issue.type
      )
      if (exists) continue

      const alert: GardenAlert = {
        eventId:      `local:${t.nodeId}:${issue.type}:${Date.now()}`,
        id:           `local:${t.nodeId}:${issue.type}:${Date.now()}`,
        nodeId:       t.nodeId,
        zoneId:       t.zoneId,
        alertType:    issue.type,
        severity:     issue.severity,
        message:      issue.msg,
        telemetrySnapshot: { soilMoisture: t.soilMoisture, temperature: t.temperature, batteryLevel: t.batteryLevel },
        acknowledged: false,
        createdAt:    Date.now(),
      }
      alerts.value.unshift(alert)
      messages.push(issue.msg)

      // Publish to relay in background if key available
      if (privateKeyHex)
        publishAlert(privateKeyHex, alert).catch(() => {})
    }
    return messages
  }

  // ─── Acknowledge ─────────────────────────────────────────────────────────

  const acknowledge = (alertId: string) => {
    const a = alerts.value.find(a => a.id === alertId)
    if (!a) return
    a.acknowledged    = true
    a.acknowledgedAt  = Date.now()
  }

  const acknowledgeAll = () => alerts.value.forEach(a => {
    a.acknowledged   = true
    a.acknowledgedAt = Date.now()
  })

  // ─── Load from relay ──────────────────────────────────────────────────────

  const loadAlerts = async (pubkey?: string, limitDays = 7) => {
    const author = pubkey ?? user.value?.publicKey
    if (!author) return
    isLoading.value = true
    const since = Math.floor((Date.now() - limitDays * 864e5) / 1000)
    try {
      const events = await pool.querySync(RELAYS, {
        kinds:   [GARDEN_KINDS.ALERT],
        authors: [author],
        since,
      })
      const parsed = events.map(parseEvent).filter(Boolean) as GardenAlert[]
      // Merge — don't overwrite local acknowledged state
      const existingIds = new Set(alerts.value.map(a => a.eventId))
      const fresh = parsed.filter(a => !existingIds.has(a.eventId))
      alerts.value = [...alerts.value, ...fresh].sort((a, b) => b.createdAt - a.createdAt)
    } finally {
      isLoading.value = false
    }
  }

  const criticalAlerts = computed(() => alerts.value.filter(a => a.severity === "critical" && !a.acknowledged))
  const warningAlerts  = computed(() => alerts.value.filter(a => a.severity === "warning"  && !a.acknowledged))

  return {
    alerts,
    unreadCount,
    criticalAlerts,
    warningAlerts,
    isLoading,
    publishAlert,
    checkThresholds,
    acknowledge,
    acknowledgeAll,
    loadAlerts,
  }
}
