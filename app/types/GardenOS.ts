// ============================================================
// 🌿 GardenOS — Smart Garden Mesh OS types
// Nostr event kinds: 30010–30016
// ============================================================
//  30010  Telemetry     — sensor readings from a mesh node
//  30011  Irrigation    — command to open/close a valve
//  30012  Alert         — threshold breach or system fault
//  30013  Worker report — background agent heartbeat / result
//  30014  Automation    — if/then rule definition
//  30015  Zone config   — physical zone metadata
//  30016  Audit log     — immutable record of critical actions
// ============================================================

// ─── Shared helpers ─────────────────────────────────────────

export type HealthStatus = "healthy" | "warning" | "critical" | "offline"
export type NodeRole     = "sensor" | "actuator" | "gateway" | "hybrid"
export type IrrigationState = "idle" | "running" | "scheduled" | "error"

export type RbacRole = "owner" | "admin" | "worker" | "viewer"

// ─── Kind 30010 — Telemetry ─────────────────────────────────

export interface GardenTelemetry {
  /** Nostr event id */
  eventId: string
  /** d-tag — nodeId:timestamp slug */
  id: string
  nodeId: string
  zoneId: string
  /** Soil moisture 0-100 % */
  soilMoisture?: number
  /** °C */
  temperature?: number
  /** % */
  humidity?: number
  /** lux */
  lightLevel?: number
  /** 0-100 % */
  batteryLevel?: number
  /** Water tank fill 0-100 % */
  waterTankLevel?: number
  /** dBm */
  signalStrength?: number
  packetLoss?: number
  /** UNIX ms */
  timestamp: number
  /** Derived after receiving */
  healthStatus: HealthStatus
  createdAt: number
}

// ─── Kind 30011 — Irrigation command ────────────────────────

export interface GardenIrrigation {
  eventId: string
  id: string
  zoneId: string
  nodeId: string
  /** on | off */
  command: "on" | "off"
  /** seconds */
  duration?: number
  /** manual | scheduled | automation */
  source: "manual" | "scheduled" | "automation"
  ruleId?: string
  /** ISO datetime */
  scheduledAt?: string
  executedAt?: number
  status: IrrigationState
  createdAt: number
}

// ─── Kind 30012 — Alert ─────────────────────────────────────

export interface GardenAlert {
  eventId: string
  id: string
  nodeId: string
  zoneId: string
  /** low_moisture | high_temp | low_battery | node_offline | relay_failure | rule_loop */
  alertType: string
  severity: "info" | "warning" | "critical"
  message: string
  telemetrySnapshot?: Partial<GardenTelemetry>
  acknowledged: boolean
  acknowledgedAt?: number
  createdAt: number
}

// ─── Kind 30013 — Worker report ─────────────────────────────

export interface GardenWorkerReport {
  eventId: string
  id: string
  workerId: string
  /** automation | sync | health_check */
  workerType: string
  status: "running" | "idle" | "error"
  lastHeartbeat: number
  processedEvents: number
  errors: string[]
  createdAt: number
}

// ─── Kind 30014 — Automation rule ───────────────────────────

export type AutomationConditionOp = "lt" | "gt" | "lte" | "gte" | "eq" | "neq"
export type AutomationAction = {
  type: "irrigation_on" | "irrigation_off" | "alert" | "notify"
  zoneId?: string
  nodeId?: string
  /** seconds for irrigation */
  duration?: number
  message?: string
}

export interface AutomationCondition {
  /** e.g. soilMoisture, temperature, batteryLevel */
  metric: string
  op: AutomationConditionOp
  value: number
}

export interface GardenAutomationRule {
  eventId: string
  id: string
  name: string
  description?: string
  /** AND | OR */
  conditionLogic: "and" | "or"
  conditions: AutomationCondition[]
  actions: AutomationAction[]
  isEnabled: boolean
  /** cooldown between re-triggers (seconds) */
  cooldownSeconds: number
  lastTriggeredAt?: number
  triggerCount: number
  createdAt: number
}

// ─── Kind 30015 — Zone config ────────────────────────────────

export interface GardenZone {
  eventId: string
  id: string
  name: string
  description?: string
  /** field | greenhouse | indoor | container */
  type: string
  area?: number
  areaUnit?: "m2" | "ft2"
  cropType?: string
  /** target soil moisture % */
  targetMoisture?: number
  /** nodeIds attached */
  nodeIds: string[]
  irrigationNodeId?: string
  isActive: boolean
  /** polygon GeoJSON coordinates */
  coordinates?: [number, number][]
  healthStatus: HealthStatus
  createdAt: number
}

// ─── Kind 30016 — Audit log ──────────────────────────────────

export type AuditAction =
  | "irrigation_start"
  | "irrigation_stop"
  | "rule_created"
  | "rule_updated"
  | "rule_deleted"
  | "rule_executed"
  | "zone_created"
  | "zone_updated"
  | "config_changed"
  | "alert_acknowledged"
  | "node_added"
  | "node_removed"

export interface GardenAuditLog {
  eventId: string
  id: string
  action: AuditAction
  actorPubkey: string
  actorRole: RbacRole
  targetId?: string
  targetType?: string
  payload?: Record<string, unknown>
  ipfsHash?: string
  createdAt: number
}

// ─── Node (mesh device) ──────────────────────────────────────

export interface GardenNode {
  id: string
  zoneId: string
  name: string
  role: NodeRole
  /** firmware version */
  firmware?: string
  lastSeen?: number
  batteryLevel?: number
  signalStrength?: number
  isOnline: boolean
  healthStatus: HealthStatus
  telemetry?: GardenTelemetry
}

// ─── Relay health ────────────────────────────────────────────

export interface RelayHealth {
  url: string
  isConnected: boolean
  latencyMs?: number
  lastPingAt?: number
  errorCount: number
}

// ─── Dashboard summary ───────────────────────────────────────

export interface GardenDashboardSummary {
  totalZones: number
  activeZones: number
  totalNodes: number
  onlineNodes: number
  pendingAlerts: number
  activeIrrigations: number
  lastTelemetryAt?: number
  avgSoilMoisture?: number
  avgBatteryLevel?: number
}
