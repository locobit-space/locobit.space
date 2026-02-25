<template>
  <div
    class="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100"
  >
    <div
      class="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-4 flex items-center justify-between"
    >
      <div class="flex items-center gap-3">
        <NuxtLink
          to="/garden-os"
          class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          <Icon name="lucide:arrow-left" class="h-4 w-4" />
        </NuxtLink>
        <Icon
          name="lucide:zap"
          class="h-5 w-5 text-yellow-500 dark:text-yellow-400"
        />
        <h1 class="font-semibold text-gray-900 dark:text-gray-100">
          Automation Rules
        </h1>
        <UBadge color="warning" variant="soft" size="xs"
          >{{ automation.enabledRules.value.length }} active</UBadge
        >
      </div>
      <UButton
        size="sm"
        color="warning"
        variant="soft"
        icon="i-lucide-plus"
        @click="openCreate"
      >
        New Rule
      </UButton>
    </div>

    <div class="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-4">
      <!-- Empty state -->
      <div
        v-if="automation.rules.value.length === 0"
        class="text-center py-20 space-y-3"
      >
        <Icon name="lucide:zap-off" class="h-10 w-10 text-gray-600 mx-auto" />
        <p class="text-gray-500">No automation rules yet.</p>
        <UButton color="warning" variant="soft" @click="openCreate"
          >Create first rule</UButton
        >
      </div>

      <!-- Rule cards -->
      <div v-else class="space-y-3">
        <div
          v-for="rule in automation.rules.value"
          :key="rule.id"
          :class="[
            'rounded-xl border p-4 space-y-3 transition-all shadow-sm dark:shadow-none bg-white dark:bg-gray-900',
            rule.isEnabled
              ? 'border-yellow-500/25 bg-yellow-50 dark:bg-yellow-500/5'
              : 'border-gray-200 dark:border-gray-800 opacity-80 dark:opacity-60',
          ]"
        >
          <!-- Rule header -->
          <div class="flex items-start justify-between gap-2">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <Icon
                  name="lucide:zap"
                  :class="
                    rule.isEnabled
                      ? 'text-yellow-500 dark:text-yellow-400'
                      : 'text-gray-400 dark:text-gray-600'
                  "
                  class="h-4 w-4 shrink-0"
                />
                <span
                  class="font-semibold text-gray-900 dark:text-gray-100 truncate"
                  >{{ rule.name }}</span
                >
              </div>
              <p v-if="rule.description" class="text-xs text-gray-500 mt-0.5">
                {{ rule.description }}
              </p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <UBadge
                :color="rule.isEnabled ? 'warning' : 'neutral'"
                variant="soft"
                size="xs"
              >
                {{ rule.isEnabled ? "enabled" : "disabled" }}
              </UBadge>
              <UButton
                size="xs"
                variant="ghost"
                icon="i-lucide-pencil"
                @click="openEdit(rule)"
              />
              <UButton
                size="xs"
                variant="ghost"
                color="error"
                icon="i-lucide-trash-2"
                @click="deleteRule(rule.id)"
              />
            </div>
          </div>

          <!-- Conditions -->
          <div class="text-xs space-y-1">
            <p
              class="text-gray-500 font-medium uppercase tracking-wide text-[10px]"
            >
              IF ({{ rule.conditionLogic.toUpperCase() }})
            </p>
            <div
              v-for="(cond, i) in rule.conditions"
              :key="i"
              class="flex items-center gap-2 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/60 rounded px-2 py-1"
            >
              <Icon
                name="lucide:git-branch"
                class="h-3 w-3 text-gray-400 dark:text-gray-500 shrink-0"
              />
              <span class="font-mono">{{ cond.metric }}</span>
              <span class="text-yellow-600 dark:text-yellow-400">{{
                cond.op
              }}</span>
              <span>{{ cond.value }}</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="text-xs space-y-1">
            <p
              class="text-gray-500 font-medium uppercase tracking-wide text-[10px]"
            >
              THEN
            </p>
            <div
              v-for="(action, i) in rule.actions"
              :key="i"
              class="flex items-center gap-2 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/60 rounded px-2 py-1"
            >
              <Icon
                name="lucide:arrow-right"
                class="h-3 w-3 text-green-500 dark:text-green-400 shrink-0"
              />
              <span class="capitalize">{{
                action.type.replace(/_/g, " ")
              }}</span>
              <span
                v-if="action.zoneId"
                class="text-gray-400 dark:text-gray-500"
                >zone:{{ action.zoneId }}</span
              >
              <span
                v-if="action.duration"
                class="text-gray-400 dark:text-gray-500"
                >{{ action.duration }}s</span
              >
            </div>
          </div>

          <!-- Footer stats -->
          <div
            class="flex items-center gap-4 text-[10px] text-gray-500 pt-1 border-t border-gray-200 dark:border-gray-800"
          >
            <span>Cooldown: {{ rule.cooldownSeconds }}s</span>
            <span>Triggered: {{ rule.triggerCount }} times</span>
            <span v-if="rule.lastTriggeredAt"
              >Last: {{ timeLabel(rule.lastTriggeredAt) }}</span
            >
          </div>
        </div>
      </div>
    </div>

    <!-- Rule editor modal -->
    <UModal
      v-model:open="showEditor"
      :title="`${editingRule ? 'Edit' : 'New'} Automation Rule`"
      description="Edit or create a new automation rule"
    >
      <template #body>
        <div class="space-y-5 p-2">
          <UFormField label="Name">
            <UInput
              v-model="form.name"
              placeholder="e.g. Low moisture → irrigate"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Description (optional)">
            <UInput
              v-model="form.description"
              placeholder="Describe when this rule fires"
              class="w-full"
            />
          </UFormField>

          <!-- Condition logic -->
          <UFormField label="Condition logic">
            <div class="flex gap-2">
              <UButton
                v-for="opt in ['and', 'or']"
                :key="opt"
                size="sm"
                :color="form.conditionLogic === opt ? 'primary' : 'neutral'"
                :variant="form.conditionLogic === opt ? 'solid' : 'ghost'"
                @click="form.conditionLogic = opt as 'and' | 'or'"
                >{{ opt.toUpperCase() }}</UButton
              >
            </div>
          </UFormField>

          <!-- Conditions -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label
                class="text-sm font-medium text-gray-700 dark:text-gray-300"
                >Conditions</label
              >
              <UButton
                size="xs"
                variant="ghost"
                icon="i-lucide-plus"
                @click="addCondition"
                >Add</UButton
              >
            </div>
            <div
              v-for="(cond, i) in form.conditions"
              :key="i"
              class="grid grid-cols-[1fr_80px_80px_32px] gap-2 items-center"
            >
              <USelect v-model="cond.metric" :items="metricOptions" size="sm" />
              <USelect v-model="cond.op" :items="opOptions" size="sm" />
              <UInput v-model.number="cond.value" type="number" size="sm" />
              <UButton
                size="xs"
                color="error"
                variant="ghost"
                icon="i-lucide-x"
                @click="removeCondition(i)"
              />
            </div>
          </div>

          <!-- Actions -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label
                class="text-sm font-medium text-gray-700 dark:text-gray-300"
                >Actions</label
              >
              <UButton
                size="xs"
                variant="ghost"
                icon="i-lucide-plus"
                @click="addAction"
                >Add</UButton
              >
            </div>
            <div
              v-for="(action, i) in form.actions"
              :key="i"
              class="grid grid-cols-[1fr_1fr_80px_32px] gap-2 items-center"
            >
              <USelect
                v-model="action.type"
                :items="actionTypeOptions"
                size="sm"
              />
              <UInput v-model="action.zoneId" placeholder="zone id" size="sm" />
              <UInput
                v-model.number="action.duration"
                type="number"
                placeholder="sec"
                size="sm"
              />
              <UButton
                size="xs"
                color="error"
                variant="ghost"
                icon="i-lucide-x"
                @click="removeAction(i)"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Cooldown (seconds)">
              <UInput
                v-model.number="form.cooldownSeconds"
                type="number"
                min="0"
              />
            </UFormField>
            <UFormField label="Enabled">
              <USwitch v-model="form.isEnabled" color="warning" />
            </UFormField>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end w-full gap-2">
          <UButton variant="ghost" block @click="showEditor = false"
            >Cancel</UButton
          >
          <UButton
            block
            :disabled="!form.name || !form.conditions.length"
            @click="saveRule"
          >
            {{ editingRule ? "Update" : "Create" }}
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { useGardenOS } from "~/composables/garden";
import type { GardenAutomationRule } from "~/types/GardenOS";

const { automation, audit, boot, isBooted } = useGardenOS();
const { user } = useNostrUser();

onMounted(async () => {
  if (!isBooted.value) await boot({ mockMode: import.meta.env.DEV });
});

// ── Editor ──────────────────────────────────────────────────────────────────
const showEditor = ref(false);
const editingRule = ref<GardenAutomationRule | null>(null);

const emptyForm = () => ({
  name: "",
  description: "",
  conditionLogic: "and" as "and" | "or",
  conditions: [{ metric: "soilMoisture", op: "lt" as const, value: 30 }],
  actions: [{ type: "irrigation_on" as const, zoneId: "", duration: 300 }],
  isEnabled: true,
  cooldownSeconds: 300,
  id: "",
});

const form = reactive(emptyForm());

const openCreate = () => {
  Object.assign(form, emptyForm());
  editingRule.value = null;
  showEditor.value = true;
};

const openEdit = (rule: GardenAutomationRule) => {
  Object.assign(form, {
    ...rule,
    conditions: rule.conditions.map((c) => ({ ...c })),
    actions: rule.actions.map((a) => ({ ...a })),
  });
  editingRule.value = rule;
  showEditor.value = true;
};

const addCondition = () => {
  form.conditions.push({ metric: "soilMoisture", op: "lt", value: 30 });
};
const removeCondition = (i: number) => form.conditions.splice(i, 1);
const addAction = () => {
  form.actions.push({ type: "irrigation_on", zoneId: "", duration: 300 });
};
const removeAction = (i: number) => form.actions.splice(i, 1);

const saveRule = async () => {
  if (!user.value?.privateKey) return;
  const pk = user.value.privateKey;
  await automation.publishRule(pk, {
    id: form.id || `rule-${Date.now()}`,
    name: form.name,
    description: form.description,
    conditionLogic: form.conditionLogic,
    conditions: form.conditions as any,
    actions: form.actions,
    isEnabled: form.isEnabled,
    cooldownSeconds: form.cooldownSeconds,
  });
  audit.logAudit({
    privateKeyHex: pk,
    action: editingRule.value ? "rule_updated" : "rule_created",
    actorPubkey: user.value.publicKey,
    actorRole: "owner",
    targetId: form.id,
    targetType: "rule",
  });
  showEditor.value = false;
};

const deleteRule = async (ruleId: string) => {
  if (!user.value?.privateKey) return;
  await automation.deleteRule(user.value.privateKey, ruleId);
  audit.logAudit({
    privateKeyHex: user.value.privateKey,
    action: "rule_deleted",
    actorPubkey: user.value.publicKey,
    actorRole: "owner",
    targetId: ruleId,
    targetType: "rule",
  });
};

// Options
const metricOptions = [
  { label: "Soil Moisture", value: "soilMoisture" },
  { label: "Temperature", value: "temperature" },
  { label: "Humidity", value: "humidity" },
  { label: "Battery Level", value: "batteryLevel" },
  { label: "Water Tank", value: "waterTankLevel" },
  { label: "Signal Strength", value: "signalStrength" },
];
const opOptions = [
  { label: "< (less)", value: "lt" },
  { label: "> (greater)", value: "gt" },
  { label: "≤", value: "lte" },
  { label: "≥", value: "gte" },
  { label: "=", value: "eq" },
  { label: "≠", value: "neq" },
];
const actionTypeOptions = [
  { label: "Irrigate ON", value: "irrigation_on" },
  { label: "Irrigate OFF", value: "irrigation_off" },
  { label: "Alert", value: "alert" },
  { label: "Notify", value: "notify" },
];

const timeLabel = (ms: number) => {
  const d = Date.now() - ms;
  if (d < 60_000) return `${Math.round(d / 1000)}s ago`;
  if (d < 3600_000) return `${Math.round(d / 60_000)}m ago`;
  return new Date(ms).toLocaleString();
};

useHead({ title: "Automation — GardenOS" });
definePageMeta({ layout: "default" });
</script>
