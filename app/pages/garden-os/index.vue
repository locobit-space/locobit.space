<template>
  <div
    class="h-full w-full bg-gray-50 dark:bg-gray-950 overflow-y-auto text-gray-900 dark:text-gray-100 flex flex-col"
  >
    <!-- ── Top bar ──────────────────────────────────────────────────────── -->
    <div
      class="bg-white/80 dark:bg-gray-900/80 backdrop-blur sticky top-0 z-30 transition-colors"
    >
      <div
        class="max-w-screen-2xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14"
      >
        <!-- Left: title -->
        <div class="flex items-center gap-3">
          <Icon
            name="lucide:cpu"
            class="h-5 w-5 text-green-600 dark:text-green-400"
          />
          <span
            class="font-semibold text-sm tracking-wide text-green-700 dark:text-green-300"
            >GardenOS</span
          >
          <UBadge color="success" variant="soft" size="xs" class="ml-1">
            {{ isBooted ? "live" : "offline" }}
          </UBadge>
          <UBadge v-if="isMocking" color="warning" variant="soft" size="xs">
            demo
          </UBadge>
        </div>

        <!-- Right: relay + alerts -->
        <div class="flex items-center gap-3">
          <span
            class="text-xs text-gray-500 dark:text-gray-400 hidden md:block"
          >
            Last update: {{ lastUpdateLabel }}
          </span>
          <UButton
            v-if="alerts.unreadCount.value > 0"
            size="xs"
            color="error"
            variant="soft"
            icon="i-lucide-bell-ring"
            @click="activeTab = 'alerts'"
          >
            {{ alerts.unreadCount.value }}
          </UButton>
          <UButton
            size="xs"
            color="neutral"
            variant="ghost"
            icon="i-lucide-refresh-cw"
            @click="reload"
            :loading="reloading"
          />
          <UButton
            v-if="!isMocking"
            size="xs"
            color="success"
            variant="soft"
            icon="i-lucide-play"
            @click="enableDemo"
            >Demo</UButton
          >
        </div>
      </div>
    </div>

    <div
      class="max-w-screen-2xl w-full flex-1 mx-auto px-4 sm:px-6 py-6 space-y-6"
    >
      <!-- ── KPI row ───────────────────────────────────────────────────── -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <GardenKpiCard
          label="Zones"
          :value="summary.totalZones"
          :sub="`${summary.activeZones} active`"
          icon="lucide:map-pin"
          color="green"
        />
        <GardenKpiCard
          label="Nodes"
          :value="summary.totalNodes"
          :sub="`${summary.onlineNodes} online`"
          icon="lucide:wifi"
          :color="summary.onlineNodes < summary.totalNodes ? 'yellow' : 'green'"
        />
        <GardenKpiCard
          label="Avg Moisture"
          :value="
            summary.avgSoilMoisture !== undefined
              ? `${Math.round(summary.avgSoilMoisture)}%`
              : '–'
          "
          sub="soil"
          icon="lucide:droplets"
          :color="(summary.avgSoilMoisture ?? 50) < 30 ? 'red' : 'blue'"
        />
        <GardenKpiCard
          label="Avg Battery"
          :value="
            summary.avgBatteryLevel !== undefined
              ? `${Math.round(summary.avgBatteryLevel)}%`
              : '–'
          "
          sub="nodes"
          icon="lucide:battery-medium"
          :color="(summary.avgBatteryLevel ?? 80) < 20 ? 'red' : 'green'"
        />
        <GardenKpiCard
          label="Irrigating"
          :value="summary.activeIrrigations"
          sub="zones active"
          icon="lucide:sprout"
          color="cyan"
        />
        <GardenKpiCard
          label="Alerts"
          :value="summary.pendingAlerts"
          sub="unacknowledged"
          icon="lucide:triangle-alert"
          :color="summary.pendingAlerts > 0 ? 'red' : 'green'"
        />
      </div>

      <!-- ── Main content + sidebar ────────────────────────────────────── -->
      <div class="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        <!-- LEFT COLUMN -->
        <div class="space-y-6">
          <!-- Zone health grid -->
          <CommonCard>
            <template #header>
              <div class="flex items-center justify-between">
                <span
                  class="font-semibold text-sm text-gray-900 dark:text-gray-200 flex items-center gap-2"
                >
                  <Icon name="lucide:layout-grid" class="h-4 w-4" />
                  Zone Health
                </span>
                <UButton
                  size="xs"
                  variant="ghost"
                  icon="i-lucide-plus"
                  @click="showAddZone = true"
                  >Add Zone</UButton
                >
              </div>
            </template>
            <GardenZoneHealthGrid
              :zones="zones.zones.value"
              :nodesByZone="nodes.nodesByZone.value"
              @add-zone="showAddZone = true"
            />
          </CommonCard>

          <!-- Node telemetry cards -->
          <CommonCard>
            <template #header>
              <span
                class="font-semibold text-sm text-gray-900 dark:text-gray-200 flex items-center gap-2"
              >
                <Icon name="lucide:activity" class="h-4 w-4" />
                Live Telemetry ({{ nodes.totalNodes.value }} nodes)
              </span>
            </template>
            <div
              v-if="nodes.totalNodes.value === 0"
              class="text-center text-gray-500 py-8 text-sm"
            >
              No nodes reporting yet. Start demo mode or connect real nodes.
            </div>
            <div
              v-else
              class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
            >
              <GardenNodeTelemetryCard
                v-for="node in nodes.nodes.value"
                :key="node.id"
                :node="node"
              />
            </div>
          </CommonCard>

          <!-- Irrigation quick panel -->
          <CommonCard>
            <template #header>
              <span
                class="font-semibold text-sm text-gray-900 dark:text-gray-200 flex items-center gap-2"
              >
                <Icon name="lucide:droplet" class="h-4 w-4" />
                Irrigation Control
              </span>
            </template>
            <GardenIrrigationPanel
              :zones="zones.zones.value"
              :activeZones="irrigation.activeZones.value"
              @irrigate-on="handleIrrigateOn"
              @irrigate-off="handleIrrigateOff"
            />
          </CommonCard>
        </div>

        <!-- RIGHT SIDEBAR -->
        <div class="space-y-4">
          <!-- Alerts feed -->
          <CommonCard>
            <template #header>
              <div class="flex items-center justify-between">
                <span
                  class="font-semibold text-sm text-gray-900 dark:text-gray-200 flex items-center gap-2"
                >
                  <Icon name="lucide:bell" class="h-4 w-4" />
                  Alerts
                  <UBadge
                    v-if="alerts.unreadCount.value > 0"
                    color="error"
                    variant="solid"
                    size="xs"
                  >
                    {{ alerts.unreadCount.value }}
                  </UBadge>
                </span>
                <UButton
                  v-if="alerts.unreadCount.value > 0"
                  size="xs"
                  variant="ghost"
                  @click="alerts.acknowledgeAll()"
                >
                  Dismiss all
                </UButton>
              </div>
            </template>
            <GardenAlertsFeed
              :alerts="alerts.alerts.value.slice(0, 20)"
              @acknowledge="alerts.acknowledge($event)"
            />
          </CommonCard>

          <!-- Automation status -->
          <CommonCard>
            <template #header>
              <div class="flex items-center justify-between">
                <span
                  class="font-semibold text-sm text-gray-900 dark:text-gray-200 flex items-center gap-2"
                >
                  <Icon name="lucide:zap" class="h-4 w-4" />
                  Automation
                </span>
                <UButton
                  size="xs"
                  variant="ghost"
                  :to="'/garden-os/automation'"
                  icon="i-lucide-arrow-right"
                />
              </div>
            </template>
            <div class="space-y-2 text-sm">
              <div
                class="flex justify-between text-gray-500 dark:text-gray-400"
              >
                <span>Active rules</span>
                <span class="text-green-600 dark:text-green-400 font-medium">{{
                  automation.enabledRules.value.length
                }}</span>
              </div>
              <div
                class="flex justify-between text-gray-500 dark:text-gray-400"
              >
                <span>Last evaluated</span>
                <span class="text-gray-900 dark:text-gray-300">{{
                  lastRunLabel
                }}</span>
              </div>
              <USeparator class="my-2" />
              <div
                v-for="rule in automation.enabledRules.value.slice(0, 4)"
                :key="rule.id"
                class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400"
              >
                <div
                  class="h-1.5 w-1.5 rounded-full bg-green-500 dark:bg-green-400 shrink-0"
                />
                {{ rule.name }}
              </div>
              <p
                v-if="automation.enabledRules.value.length === 0"
                class="text-gray-500 text-xs text-center py-2"
              >
                No active rules.
                <NuxtLink
                  to="/garden-os/automation"
                  class="text-green-600 dark:text-green-400 underline hover:text-green-700 dark:hover:text-green-300 transition-colors"
                  >Add one</NuxtLink
                >
              </p>
            </div>
          </CommonCard>

          <!-- Mesh health -->
          <CommonCard>
            <template #header>
              <div class="flex items-center justify-between">
                <span
                  class="font-semibold text-sm text-gray-900 dark:text-gray-200 flex items-center gap-2"
                >
                  <Icon name="lucide:network" class="h-4 w-4" />
                  Mesh Health
                </span>
                <UButton
                  size="xs"
                  variant="ghost"
                  :to="'/garden-os/nodes'"
                  icon="i-lucide-arrow-right"
                />
              </div>
            </template>
            <GardenMeshStatus :nodes="nodes.nodes.value" />
          </CommonCard>
        </div>
      </div>
    </div>
    <!-- Add Zone modal -->
    <UModal
      v-model:open="showAddZone"
      title="Zone"
      description="Register a new garden zone"
    >
      <template #body>
        <div class="space-y-4 p-2">
          <UFormField label="Zone Name" required>
            <UInput
              v-model="newZone.name"
              placeholder="e.g. Front Yard, Greenhouse B"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Type" required>
            <USelect
              v-model="newZone.type"
              :items="zoneTypeOptions"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Target Moisture (%)">
            <UInput
              v-model.number="newZone.targetMoisture"
              type="number"
              min="0"
              max="100"
              placeholder="e.g. 60"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Description">
            <UTextarea
              v-model="newZone.description"
              placeholder="Optional notes about this zone..."
              class="w-full"
            />
          </UFormField>

          <UFormField>
            <USwitch v-model="newZone.isActive" label="Active Zone" />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end w-full gap-2">
          <UButton variant="ghost" block @click="showAddZone = false">
            Cancel
          </UButton>
          <UButton
            color="success"
            block
            :disabled="!newZone.name || !newZone.type"
            :loading="isSubmittingZone"
            @click="registerZone"
          >
            Register Zone
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { useGardenOS } from "~/composables/garden";
const toast = useToast();

const os = useGardenOS();
const {
  telemetry,
  zones,
  irrigation,
  alerts,
  automation,
  nodes,
  isBooted,
  isMocking,
  dashboardSummary,
  boot,
  shutdown,
} = os;

const reloading = ref(false);
const activeTab = ref("dashboard");
const showAddZone = ref(false);
const isSubmittingZone = ref(false);

const newZone = reactive({
  name: "",
  description: "",
  type: "field" as "field" | "greenhouse" | "indoor" | "container",
  targetMoisture: undefined as number | undefined,
  isActive: true,
});

const zoneTypeOptions = [
  { label: "Field", value: "field" },
  { label: "Greenhouse", value: "greenhouse" },
  { label: "Indoor", value: "indoor" },
  { label: "Container", value: "container" },
];

const summary = dashboardSummary;

const lastUpdateLabel = computed(() => {
  const ts = summary.value.lastTelemetryAt;
  if (!ts) return "—";
  const diff = Date.now() - ts;
  if (diff < 60_000) return `${Math.round(diff / 1000)}s ago`;
  return `${Math.round(diff / 60_000)}m ago`;
});

const lastRunLabel = computed(() => {
  const ts = automation.lastRunAt.value;
  if (!ts) return "—";
  const diff = Date.now() - ts;
  if (diff < 60_000) return `${Math.round(diff / 1000)}s ago`;
  return `${Math.round(diff / 60_000)}m ago`;
});

// ── Lifecycle ──────────────────────────────────────────────────────────────
onMounted(async () => {
  await boot({ mockMode: import.meta.env.DEV });
});

onUnmounted(() => {
  shutdown();
});

// ── Actions ────────────────────────────────────────────────────────────────
const { user } = useNostrUser();
const { publishZone } = zones;

const registerZone = async () => {
  if (!user.value?.privateKey) {
    toast.add({
      title: "Login Required",
      description: "You must be logged in to register a zone.",
      color: "red",
    });
    return;
  }

  isSubmittingZone.value = true;
  try {
    const zoneData = {
      id: crypto.randomUUID(),
      name: newZone.name,
      description: newZone.description || undefined,
      type: newZone.type,
      targetMoisture: newZone.targetMoisture,
      isActive: newZone.isActive,
      nodeIds: [],
    };

    await publishZone(user.value.privateKey, zoneData);

    toast.add({
      title: "Zone Registered",
      description: `Successfully created zone "${newZone.name}"`,
      color: "green",
    });

    showAddZone.value = false;
    // Reset form
    Object.assign(newZone, {
      name: "",
      description: "",
      type: "field",
      targetMoisture: undefined,
      isActive: true,
    });
  } catch (error: any) {
    toast.add({
      title: "Registration Failed",
      description: error.message || "An error occurred while saving the zone.",
      color: "error",
    });
  } finally {
    isSubmittingZone.value = false;
  }
};

const handleIrrigateOn = async (payload: {
  zoneId: string;
  nodeId: string;
  durationSeconds: number;
}) => {
  if (!user.value?.privateKey) return;
  await irrigation.irrigateOn({
    privateKeyHex: user.value.privateKey,
    zoneId: payload.zoneId,
    nodeId: payload.nodeId,
    durationSeconds: payload.durationSeconds,
    source: "manual",
    actorRole: "owner",
  });
};

const handleIrrigateOff = async (payload: {
  zoneId: string;
  nodeId: string;
}) => {
  if (!user.value?.privateKey) return;
  await irrigation.irrigateOff({
    privateKeyHex: user.value.privateKey,
    zoneId: payload.zoneId,
    nodeId: payload.nodeId,
    actorRole: "owner",
  });
};

const enableDemo = () => boot({ mockMode: true });

const reload = async () => {
  reloading.value = true;
  shutdown();
  await boot({ mockMode: isMocking.value });
  reloading.value = false;
};

// ── SEO ───────────────────────────────────────────────────────────────────
useHead({ title: "GardenOS Dashboard" });
definePageMeta({ layout: "default" });
</script>
