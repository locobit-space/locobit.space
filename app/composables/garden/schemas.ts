// ============================================================
// 🌿 GardenOS — Zod runtime validation schemas
// Validates content field of incoming Nostr events before
// they are accepted into the local store.
// ============================================================

import { z } from "zod"

// ─── Shared ──────────────────────────────────────────────────

const healthStatusSchema  = z.enum(["healthy", "warning", "critical", "offline"])
const irrigationStateSchema = z.enum(["idle", "running", "scheduled", "error"])
const rbacRoleSchema      = z.enum(["owner", "admin", "worker", "viewer"])

// ─── Kind 30010 — Telemetry ─────────────────────────────────

export const TelemetryContentSchema = z.object({
  nodeId:          z.string().min(1),
  zoneId:          z.string().min(1),
  soilMoisture:    z.number().min(0).max(100).optional(),
  temperature:     z.number().min(-50).max(80).optional(),
  humidity:        z.number().min(0).max(100).optional(),
  lightLevel:      z.number().min(0).optional(),
  batteryLevel:    z.number().min(0).max(100).optional(),
  waterTankLevel:  z.number().min(0).max(100).optional(),
  signalStrength:  z.number().optional(),
  packetLoss:      z.number().min(0).max(100).optional(),
  timestamp:       z.number().positive(),
})

export type TelemetryContent = z.infer<typeof TelemetryContentSchema>

// ─── Kind 30011 — Irrigation ─────────────────────────────────

export const IrrigationContentSchema = z.object({
  zoneId:      z.string().min(1),
  nodeId:      z.string().min(1),
  command:     z.enum(["on", "off"]),
  duration:    z.number().positive().optional(),
  source:      z.enum(["manual", "scheduled", "automation"]),
  ruleId:      z.string().optional(),
  scheduledAt: z.string().optional(),
})

export type IrrigationContent = z.infer<typeof IrrigationContentSchema>

// ─── Kind 30012 — Alert ──────────────────────────────────────

export const AlertContentSchema = z.object({
  nodeId:    z.string().min(1),
  zoneId:    z.string().min(1),
  alertType: z.string().min(1),
  severity:  z.enum(["info", "warning", "critical"]),
  message:   z.string().min(1).max(500),
  telemetrySnapshot: z.record(z.string(), z.unknown()).optional(),
})

export type AlertContent = z.infer<typeof AlertContentSchema>

// ─── Kind 30013 — Worker report ──────────────────────────────

export const WorkerReportContentSchema = z.object({
  workerId:        z.string().min(1),
  workerType:      z.enum(["automation", "sync", "health_check"]),
  status:          z.enum(["running", "idle", "error"]),
  lastHeartbeat:   z.number().positive(),
  processedEvents: z.number().min(0),
  errors:          z.array(z.string()),
})

export type WorkerReportContent = z.infer<typeof WorkerReportContentSchema>

// ─── Kind 30014 — Automation rule ────────────────────────────

export const AutomationConditionSchema = z.object({
  metric: z.string().min(1),
  op:     z.enum(["lt", "gt", "lte", "gte", "eq", "neq"]),
  value:  z.number(),
})

export const AutomationActionSchema = z.object({
  type:     z.enum(["irrigation_on", "irrigation_off", "alert", "notify"]),
  zoneId:   z.string().optional(),
  nodeId:   z.string().optional(),
  duration: z.number().positive().optional(),
  message:  z.string().max(300).optional(),
})

export const AutomationRuleContentSchema = z.object({
  name:           z.string().min(1).max(100),
  description:    z.string().max(500).optional(),
  conditionLogic: z.enum(["and", "or"]),
  conditions:     z.array(AutomationConditionSchema).min(1),
  actions:        z.array(AutomationActionSchema).min(1),
  isEnabled:      z.boolean(),
  cooldownSeconds: z.number().min(0).default(300),
})

export type AutomationRuleContent = z.infer<typeof AutomationRuleContentSchema>

// ─── Kind 30015 — Zone config ────────────────────────────────

export const ZoneContentSchema = z.object({
  name:              z.string().min(1).max(100),
  description:       z.string().max(500).optional(),
  type:              z.enum(["field", "greenhouse", "indoor", "container"]),
  area:              z.number().positive().optional(),
  areaUnit:          z.enum(["m2", "ft2"]).optional(),
  cropType:          z.string().optional(),
  targetMoisture:    z.number().min(0).max(100).optional(),
  nodeIds:           z.array(z.string()),
  irrigationNodeId:  z.string().optional(),
  isActive:          z.boolean(),
  coordinates:       z.array(z.tuple([z.number(), z.number()])).optional(),
})

export type ZoneContent = z.infer<typeof ZoneContentSchema>

// ─── Kind 30016 — Audit log ──────────────────────────────────

export const AuditLogContentSchema = z.object({
  action: z.enum([
    "irrigation_start", "irrigation_stop",
    "rule_created", "rule_updated", "rule_deleted", "rule_executed",
    "zone_created", "zone_updated",
    "config_changed", "alert_acknowledged",
    "node_added", "node_removed",
  ]),
  actorPubkey:  z.string().length(64),
  actorRole:    rbacRoleSchema,
  targetId:     z.string().optional(),
  targetType:   z.string().optional(),
  payload:      z.record(z.string(), z.unknown()).optional(),
})

export type AuditLogContent = z.infer<typeof AuditLogContentSchema>

// ─── Generic Nostr event tag extractor ───────────────────────

/**
 * Parse a Nostr event's tags and return a flat map.
 * e.g. [["d","my-id"],["t","telemetry"]] → { d: "my-id", t: "telemetry" }
 */
export function parseTags(tags: string[][]): Record<string, string> {
  return Object.fromEntries(tags.filter(([k]) => k).map(([k, v]) => [k, v ?? ""]))
}

/**
 * Safe JSON parse. Returns null on failure.
 */
export function safeJsonParse<T>(raw: string): T | null {
  try { return JSON.parse(raw) as T }
  catch { return null }
}
