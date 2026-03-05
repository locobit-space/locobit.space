<template>
  <div
    class="h-full flex flex-col w-full bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100"
  >
    <!-- header -->
    <div
      class="border-b sticky top-0 border-gray-200 dark:border-gray-800 z-50 bg-white/80 backdrop-blur-sm dark:bg-gray-900 px-6 py-4 flex items-center justify-between"
    >
      <div class="flex items-center gap-3">
        <NuxtLink
          to="/garden-os"
          class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          <Icon name="lucide:arrow-left" class="h-4 w-4" />
        </NuxtLink>
        <Icon
          name="lucide:network"
          class="h-5 w-5 text-green-500 dark:text-green-400"
        />
        <h1 class="font-semibold text-gray-900 dark:text-gray-100">
          Mesh Nodes
        </h1>
        <UBadge variant="soft" color="neutral" size="xs"
          >{{ nodes.totalNodes.value }} total</UBadge
        >
      </div>
      <UButton
        size="sm"
        color="success"
        variant="soft"
        icon="i-lucide-plus"
        @click="showAdd = true"
      >
        Register Node
      </UButton>
    </div>

    <div
      class="max-w-6xl w-full overflow-y-auto flex-1 mx-auto py-6 space-y-6 px-4"
    >
      <!-- Stats strip -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <GardenKpiCard
          label="Total"
          :value="nodes.totalNodes.value"
          icon="lucide:cpu"
          color="green"
        />
        <GardenKpiCard
          label="Online"
          :value="nodes.onlineNodes.value.length"
          icon="lucide:wifi"
          color="green"
        />
        <GardenKpiCard
          label="Offline"
          :value="nodes.offlineNodes.value.length"
          icon="lucide:wifi-off"
          color="red"
        />
        <GardenKpiCard
          label="Critical"
          :value="nodes.criticalNodes.value.length"
          icon="lucide:triangle-alert"
          color="red"
        />
      </div>

      <!-- Filter row -->
      <div class="flex gap-3 flex-wrap">
        <UInput
          v-model="search"
          placeholder="Search by name or zone…"
          icon="i-lucide-search"
          size="sm"
          class="flex-1 max-w-xs"
        />
        <USelect v-model="filterRole" :items="roleOptions" size="sm" />
        <USelect v-model="filterStatus" :items="statusOptions" size="sm" />
      </div>

      <!-- Node list -->
      <div
        v-if="filteredNodes.length === 0"
        class="text-center text-gray-500 py-16"
      >
        No nodes match your filter.
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="node in filteredNodes"
          :key="node.id"
          :class="[
            'rounded-xl border p-4 space-y-3 bg-white dark:bg-gray-900 shadow-sm dark:shadow-none transition-all hover:border-gray-300 dark:hover:border-gray-600',
            node.isOnline
              ? 'border-gray-200 dark:border-gray-700'
              : 'border-gray-200 dark:border-gray-800 opacity-80 dark:opacity-70 bg-gray-50 dark:bg-gray-900',
          ]"
        >
          <!-- header row -->
          <div class="flex items-start justify-between gap-2">
            <div>
              <div class="flex items-center gap-2">
                <span
                  :class="[
                    'h-2 w-2 rounded-full',
                    node.isOnline
                      ? 'bg-green-500 dark:bg-green-400 animate-pulse'
                      : 'bg-gray-400 dark:bg-gray-500',
                  ]"
                />
                <span
                  class="text-sm font-semibold text-gray-900 dark:text-gray-100"
                  >{{ node.name }}</span
                >
              </div>
              <p class="text-xs text-gray-500 mt-0.5">
                Zone: {{ zones.getZoneById(node.zoneId)?.name ?? node.zoneId }}
              </p>
            </div>
            <UBadge
              :color="healthColor(node.healthStatus)"
              variant="soft"
              size="xs"
            >
              {{ node.healthStatus }}
            </UBadge>
          </div>

          <!-- Telemetry snapshot -->
          <div class="grid grid-cols-2 gap-1.5">
            <GardenMetricRow
              icon="lucide:droplets"
              label="Moisture"
              :value="fmt(node.telemetry?.soilMoisture, '%')"
              :warn="(node.telemetry?.soilMoisture ?? 50) < 25"
            />
            <GardenMetricRow
              icon="lucide:thermometer"
              label="Temp"
              :value="fmt(node.telemetry?.temperature, '°C')"
              :warn="(node.telemetry?.temperature ?? 20) > 38"
            />
            <GardenMetricRow
              icon="lucide:battery-medium"
              label="Battery"
              :value="fmt(node.telemetry?.batteryLevel, '%')"
              :warn="(node.telemetry?.batteryLevel ?? 80) < 20"
            />
            <GardenMetricRow
              icon="lucide:radio"
              label="Signal"
              :value="fmt(node.telemetry?.signalStrength, 'dBm')"
            />
          </div>

          <!-- Footer -->
          <div
            class="flex items-center justify-between text-[10px] text-gray-500 pt-1 border-t border-gray-200 dark:border-gray-800"
          >
            <span class="capitalize">{{ node.role }}</span>
            <span>{{ lastSeen(node.lastSeen) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Node modal -->
    <UModal
      v-model:open="showAdd"
      title="Node"
      description="Register a new node"
    >
      <template #body>
        <div class="space-y-4 p-2">
          <UFormField
            label="Node ID"
            hint="Unique hardware ID (e.g. MAC address)"
          >
            <UInput
              v-model="newNode.id"
              placeholder="aa:bb:cc:dd:ee:ff"
              class="w-full"
            />
          </UFormField>
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Zone">
              <USelect
                v-model="newNode.zoneId"
                :items="zoneOptions"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Role">
              <USelect
                v-model="newNode.role"
                :items="roleOptions.filter((r) => r.value !== 'all')"
                class="w-full"
              />
            </UFormField>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end w-full gap-2">
          <UButton variant="ghost" block @click="showAdd = false">
            Cancel
          </UButton>
          <UButton
            color="success"
            block
            :disabled="!newNode.id || !newNode.zoneId"
            @click="registerNode"
          >
            Register
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { useGardenOS } from "~/composables/garden";
import type { NodeRole } from "~/types/GardenOS";

const { nodes, zones, boot, isBooted } = useGardenOS();

onMounted(async () => {
  if (!isBooted.value) await boot({ mockMode: import.meta.env.DEV });
});

const search = ref("");
const filterRole = ref<string>("all");
const filterStatus = ref<string>("all");
const showAdd = ref(false);

const newNode = reactive({ id: "", zoneId: "", role: "sensor" as NodeRole });

const roleOptions = [
  { label: "All roles", value: "all" },
  { label: "Sensor", value: "sensor" },
  { label: "Actuator", value: "actuator" },
  { label: "Gateway", value: "gateway" },
  { label: "Hybrid", value: "hybrid" },
];

const statusOptions = [
  { label: "All status", value: "all" },
  { label: "Online", value: "online" },
  { label: "Offline", value: "offline" },
  { label: "Critical", value: "critical" },
];

const zoneOptions = computed(() =>
  zones.zones.value.map((z) => ({ label: z.name, value: z.id })),
);

const filteredNodes = computed(() =>
  nodes.nodes.value.filter((n) => {
    const matchSearch =
      !search.value ||
      n.name.toLowerCase().includes(search.value.toLowerCase()) ||
      n.zoneId.includes(search.value);
    const matchRole = filterRole.value === "all" || n.role === filterRole.value;
    const matchStatus =
      filterStatus.value === "all" ||
      (filterStatus.value === "online" && n.isOnline) ||
      (filterStatus.value === "offline" && !n.isOnline) ||
      (filterStatus.value === "critical" && n.healthStatus === "critical");
    return matchSearch && matchRole && matchStatus;
  }),
);

const healthColor = (s: string) =>
  (({
    healthy: "success",
    warning: "warning",
    critical: "error",
    offline: "neutral",
  })[s] ?? "neutral") as any;

const fmt = (v: number | undefined, unit: string) =>
  v !== undefined ? `${Math.round(v)}${unit}` : "—";
const lastSeen = (ts?: number) => {
  if (!ts) return "Never";
  const d = Date.now() - ts;
  if (d < 60_000) return `${Math.round(d / 1000)}s ago`;
  if (d < 3600_000) return `${Math.round(d / 60_000)}m ago`;
  return `${Math.round(d / 3600_000)}h ago`;
};

const registerNode = () => {
  nodes.registerMockNode({ id: newNode.id, zoneId: newNode.zoneId });
  showAdd.value = false;
  Object.assign(newNode, { id: "", zoneId: "", role: "sensor" });
};

useHead({ title: "Mesh Nodes — GardenOS" });
definePageMeta({ layout: "default" });
</script>
