// composables/garden/useGardenAutomation.ts
// ─────────────────────────────────────────────────────────────────────────────
// Manages kind 30014 automation rules.
// The in-browser rule evaluator runs every time new telemetry arrives.
// A Web Worker variant (automation.worker.js) is also provided for
// background-tab processing — this composable bridges both modes.
//
// Loop prevention: each rule has a cooldownSeconds period and a
// lastTriggeredAt timestamp.  A rule cannot re-trigger until
// (lastTriggeredAt + cooldownSeconds) has elapsed.
// ─────────────────────────────────────────────────────────────────────────────

import { finalizeEvent } from "nostr-tools/pure"
import { hexToBytes }    from "@noble/ciphers/utils"
import type {
  GardenAutomationRule,
  GardenTelemetry,
  AutomationCondition,
} from "~/types/GardenOS"
import { AutomationRuleContentSchema, parseTags, safeJsonParse } from "./schemas"
import { GARDEN_KINDS } from "./useGardenTelemetry"

export const useGardenAutomation = () => {
  const { $nostr }  = useNuxtApp()
  const { pool }    = $nostr
  const { DEFAULT_RELAYS: RELAYS } = useNostrRelay()
  const { user }    = useNostrUser()

  const rules     = useState<GardenAutomationRule[]>("gardenOS-rules",        () => [])
  const isLoading = useState<boolean>("gardenOS-rules-loading",               () => false)
  const lastRunAt = useState<number | null>("gardenOS-rules-lastRun",         () => null)

  /** Worker reference — initialised in startWorker() */
  let worker: Worker | null = null

  // ─── Parse raw event ──────────────────────────────────────────────────────

  const parseEvent = (event: { id: string; content: string; tags: string[][]; created_at: number }): GardenAutomationRule | null => {
    const raw    = safeJsonParse<unknown>(event.content)
    const result = AutomationRuleContentSchema.safeParse(raw)
    if (!result.success) return null

    const d    = parseTags(event.tags)
    const data = result.data
    return {
      eventId:      event.id,
      id:           d.d ?? event.id,
      triggerCount: 0,
      createdAt:    event.created_at * 1000,
      ...data,
    } as GardenAutomationRule
  }

  // ─── Publish a new / updated rule ─────────────────────────────────────────

  const publishRule = async (
    privateKeyHex: string,
    rule: Omit<GardenAutomationRule, "eventId" | "createdAt" | "triggerCount" | "lastTriggeredAt">
  ) => {
    const sk    = hexToBytes(privateKeyHex)
    const dTag  = rule.id || `rule:${Date.now()}`
    const event = finalizeEvent({
      kind:       GARDEN_KINDS.AUTOMATION,
      created_at: Math.floor(Date.now() / 1000),
      tags:       [
        ["d",    dTag],
        ["t",    "automation"],
        ["name", rule.name],
      ],
      content: JSON.stringify({
        name:            rule.name,
        description:     rule.description,
        conditionLogic:  rule.conditionLogic,
        conditions:      rule.conditions,
        actions:         rule.actions,
        isEnabled:       rule.isEnabled,
        cooldownSeconds: rule.cooldownSeconds,
      }),
    }, sk)

    await Promise.allSettled(pool.publish(RELAYS, event))

    const saved: GardenAutomationRule = {
      ...rule,
      id:           dTag,
      eventId:      event.id,
      triggerCount: 0,
      createdAt:    Date.now(),
    }

    const idx = rules.value.findIndex(r => r.id === rule.id)
    if (idx >= 0) rules.value.splice(idx, 1, saved)
    else          rules.value.push(saved)

    return saved
  }

  // ─── Load rules from relay ────────────────────────────────────────────────

  const loadRules = async (pubkey?: string) => {
    const author = pubkey ?? user.value?.publicKey
    if (!author) return
    isLoading.value = true
    try {
      const events = await pool.querySync(RELAYS, {
        kinds:   [GARDEN_KINDS.AUTOMATION],
        authors: [author],
      })
      const byDTag = new Map<string, GardenAutomationRule>()
      for (const ev of events) {
        const r = parseEvent(ev)
        if (!r) continue
        const existing = byDTag.get(r.id)
        if (!existing || ev.created_at > (existing.createdAt / 1000))
          byDTag.set(r.id, r)
      }
      rules.value = Array.from(byDTag.values())
    } finally {
      isLoading.value = false
    }
  }

  // ─── Condition evaluator ──────────────────────────────────────────────────

  const checkCondition = (cond: AutomationCondition, telemetry: GardenTelemetry): boolean => {
    const val = telemetry[cond.metric as keyof GardenTelemetry] as number | undefined
    if (val === undefined) return false
    switch (cond.op) {
      case "lt":  return val < cond.value
      case "gt":  return val > cond.value
      case "lte": return val <= cond.value
      case "gte": return val >= cond.value
      case "eq":  return val === cond.value
      case "neq": return val !== cond.value
    }
  }

  // ─── Evaluate all enabled rules against a single telemetry reading ────────

  const evaluateRules = async (
    telemetry: GardenTelemetry,
    opts: {
      privateKeyHex: string
      onIrrigateOn?:  (zoneId: string, nodeId: string, duration: number, ruleId: string) => Promise<void>
      onIrrigateOff?: (zoneId: string, nodeId: string, ruleId: string) => Promise<void>
      onAlert?:       (msg: string, ruleId: string) => void
    }
  ) => {
    const now = Date.now()
    lastRunAt.value = now

    for (const rule of rules.value) {
      if (!rule.isEnabled) continue

      // Loop prevention: cooldown check
      if (rule.lastTriggeredAt && now - rule.lastTriggeredAt < rule.cooldownSeconds * 1000) continue

      const conditions = rule.conditions.map(c => checkCondition(c, telemetry))
      const matched    = rule.conditionLogic === "and"
        ? conditions.every(Boolean)
        : conditions.some(Boolean)

      if (!matched) continue

      // Execute actions
      rule.lastTriggeredAt = now
      rule.triggerCount    = (rule.triggerCount ?? 0) + 1

      for (const action of rule.actions) {
        const zId = action.zoneId ?? telemetry.zoneId
        const nId = action.nodeId ?? telemetry.nodeId

        if (action.type === "irrigation_on" && opts.onIrrigateOn)
          await opts.onIrrigateOn(zId, nId, action.duration ?? 300, rule.id)
        else if (action.type === "irrigation_off" && opts.onIrrigateOff)
          await opts.onIrrigateOff(zId, nId, rule.id)
        else if (action.type === "alert" && opts.onAlert)
          opts.onAlert(action.message ?? `Rule "${rule.name}" triggered`, rule.id)
      }
    }
  }

  // ─── Web Worker bridge ────────────────────────────────────────────────────

  const startWorker = () => {
    if (!import.meta.client || worker) return
    try {
      worker = new Worker("/workers/automation.worker.js")
      worker.postMessage({ type: "INIT", rules: rules.value })
      worker.onmessage = (e: MessageEvent) => {
        if (e.data?.type === "RULE_TRIGGERED") {
          console.info("[AutomationWorker] rule triggered:", e.data.ruleId)
        }
      }
    } catch {
      // Worker not available in this env
    }
  }

  const stopWorker = () => {
    worker?.terminate()
    worker = null
  }

  const syncWorkerRules = () => {
    worker?.postMessage({ type: "UPDATE_RULES", rules: rules.value })
  }

  const sendTelemetryToWorker = (t: GardenTelemetry) => {
    worker?.postMessage({ type: "TELEMETRY", telemetry: t })
  }

  // ─── Delete (soft — publish rule with isEnabled: false) ──────────────────

  const deleteRule = async (privateKeyHex: string, ruleId: string) => {
    const rule = rules.value.find(r => r.id === ruleId)
    if (!rule) return
    await publishRule(privateKeyHex, { ...rule, isEnabled: false })
    rules.value = rules.value.filter(r => r.id !== ruleId)
  }

  const enabledRules  = computed(() => rules.value.filter(r => r.isEnabled))
  const disabledRules = computed(() => rules.value.filter(r => !r.isEnabled))

  return {
    rules,
    enabledRules,
    disabledRules,
    isLoading,
    lastRunAt,
    publishRule,
    loadRules,
    evaluateRules,
    deleteRule,
    startWorker,
    stopWorker,
    syncWorkerRules,
    sendTelemetryToWorker,
  }
}
