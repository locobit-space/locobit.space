<!-- components/garden/GardenNodeTelemetryCard.vue -->
<template>
  <div
    :class="[
      'rounded-xl border p-3 space-y-2 border-gray-200 dark:border-gray-800 transition-all',
      node.isOnline
        ? 'border-gray-200 bg-gray-200/60 dark:bg-gray-800/60 hover:shadow-md transition-shadow duration-200'
        : 'border-gray-200 bg-gray-200/40 dark:bg-gray-900/40 hover:shadow-md transition-shadow duration-200 opacity-60',
    ]"
  >
    <!-- header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span :class="['h-2 w-2 rounded-full shrink-0', dotColor]" />
        <span
          class="text-xs font-medium text-gray-700 dark:text-gray-200 truncate max-w-[100px]"
        >
          {{ node.name }}
        </span>
        <UBadge size="xs" :color="roleColor as any" variant="soft">
          {{ node.role }}
        </UBadge>
      </div>
      <span
        :class="[
          'text-[10px] font-medium px-1.5 py-0.5 rounded',
          healthBadgeClass,
        ]"
      >
        {{ node.healthStatus }}
      </span>
    </div>

    <!-- metrics grid -->
    <div class="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
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
        icon="lucide:cloud-rain"
        label="Humidity"
        :value="fmt(node.telemetry?.humidity, '%')"
      />
      <GardenMetricRow
        icon="lucide:battery-medium"
        label="Battery"
        :value="fmt(node.telemetry?.batteryLevel, '%')"
        :warn="(node.telemetry?.batteryLevel ?? 80) < 20"
      />
      <GardenMetricRow
        icon="lucide:waves"
        label="Tank"
        :value="fmt(node.telemetry?.waterTankLevel, '%')"
        :warn="(node.telemetry?.waterTankLevel ?? 50) < 15"
      />
      <GardenMetricRow
        icon="lucide:radio"
        label="Signal"
        :value="fmt(node.telemetry?.signalStrength, 'dB')"
        :warn="(node.telemetry?.signalStrength ?? -70) < -90"
      />
    </div>

    <!-- last seen -->
    <div class="text-[10px] text-gray-600 text-right">
      {{ lastSeenLabel }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GardenNode } from "~/types/GardenOS";

const props = defineProps<{ node: GardenNode }>();

const fmt = (v: number | undefined, unit: string) =>
  v !== undefined ? `${Math.round(v)}${unit}` : "—";

const dotColor = computed(() =>
  props.node.healthStatus === "offline"
    ? "bg-gray-500"
    : props.node.healthStatus === "critical"
      ? "bg-red-400 animate-pulse"
      : props.node.healthStatus === "warning"
        ? "bg-yellow-400"
        : "bg-green-400",
);

const healthBadgeClass = computed(
  () =>
    ({
      healthy: "bg-green-500/15 text-green-400",
      warning: "bg-yellow-500/15 text-yellow-400",
      critical: "bg-red-500/15 text-red-400",
      offline: "bg-gray-700 text-gray-500",
    })[props.node.healthStatus],
);

const roleColor = computed(
  () =>
    ({
      sensor: "info",
      actuator: "success",
      gateway: "warning",
      hybrid: "secondary",
    })[props.node.role] ?? "neutral",
);

const lastSeenLabel = computed(() => {
  if (!props.node.lastSeen) return "Never";
  const diff = Date.now() - props.node.lastSeen;
  if (diff < 60_000) return `${Math.round(diff / 1000)}s ago`;
  if (diff < 3600_000) return `${Math.round(diff / 60_000)}m ago`;
  return `${Math.round(diff / 3600_000)}h ago`;
});
</script>
