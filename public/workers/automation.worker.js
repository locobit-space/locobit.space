/**
 * public/workers/automation.worker.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Background automation engine.
 * Receives telemetry events from the main thread and evaluates automation
 * rules entirely in-worker.  When a rule fires it posts a message back and
 * the main thread performs the actual Nostr publish (workers have no DOM /
 * nostr-tools access).
 *
 * Messages IN  (from main thread):
 *   { type: "INIT",          rules:    Rule[]     }
 *   { type: "UPDATE_RULES",  rules:    Rule[]     }
 *   { type: "TELEMETRY",     telemetry: Telemetry }
 *
 * Messages OUT (to main thread):
 *   { type: "RULE_TRIGGERED", ruleId, actions, telemetry }
 *   { type: "HEARTBEAT",      processedCount, timestamp  }
 *   { type: "ERROR",          message                    }
 * ─────────────────────────────────────────────────────────────────────────────
 */

"use strict"

// ─── State ───────────────────────────────────────────────────────────────────

let rules            = []        // GardenAutomationRule[]
let processedCount   = 0
let lastHeartbeatAt  = Date.now()

// ─── Heartbeat (every 30s) ────────────────────────────────────────────────────

setInterval(() => {
  self.postMessage({
    type:           "HEARTBEAT",
    processedCount,
    timestamp:      Date.now(),
    rulesLoaded:    rules.length,
  })
  lastHeartbeatAt = Date.now()
}, 30_000)

// ─── Condition evaluator ─────────────────────────────────────────────────────

function checkCondition(cond, telemetry) {
  const val = telemetry[cond.metric]
  if (val === undefined || val === null) return false
  switch (cond.op) {
    case "lt":  return val < cond.value
    case "gt":  return val > cond.value
    case "lte": return val <= cond.value
    case "gte": return val >= cond.value
    case "eq":  return val === cond.value
    case "neq": return val !== cond.value
    default:    return false
  }
}

// ─── Rule evaluation ─────────────────────────────────────────────────────────

function evaluateRules(telemetry) {
  const now = Date.now()

  for (const rule of rules) {
    if (!rule.isEnabled) continue

    // Loop prevention: cooldown check
    const cooldownMs = (rule.cooldownSeconds ?? 300) * 1000
    if (rule.lastTriggeredAt && now - rule.lastTriggeredAt < cooldownMs) continue

    const results = (rule.conditions ?? []).map(c => checkCondition(c, telemetry))
    const matched  = rule.conditionLogic === "and"
      ? results.every(Boolean)
      : results.some(Boolean)

    if (!matched) continue

    // Mark triggered — mutate in-worker copy only
    rule.lastTriggeredAt = now
    rule.triggerCount    = (rule.triggerCount ?? 0) + 1

    self.postMessage({
      type:      "RULE_TRIGGERED",
      ruleId:    rule.id,
      ruleName:  rule.name,
      actions:   rule.actions,
      telemetry,
      timestamp: now,
    })
  }
}

// ─── Message handler ─────────────────────────────────────────────────────────

self.onmessage = function (event) {
  const { type, rules: newRules, telemetry } = event.data ?? {}

  try {
    if (type === "INIT" || type === "UPDATE_RULES") {
      // Deep-clone to avoid transferable issues
      rules = JSON.parse(JSON.stringify(newRules ?? []))
      self.postMessage({ type: "RULES_LOADED", count: rules.length })
    }
    else if (type === "TELEMETRY") {
      processedCount++
      evaluateRules(telemetry)
    }
    else {
      self.postMessage({ type: "ERROR", message: `Unknown message type: ${type}` })
    }
  } catch (err) {
    self.postMessage({ type: "ERROR", message: String(err?.message ?? err) })
  }
}
