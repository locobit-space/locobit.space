<!-- components/garden/GardenZoneHealthGrid.vue -->
<template>
  <div v-if="zones.length === 0" class="text-center text-gray-500 text-sm py-6">
    No zones configured yet.
    <button
      @click="$emit('add-zone')"
      class="text-green-400 underline ml-1 hover:text-green-500 transition-colors"
    >
      Add a zone
    </button>
  </div>
  <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
    <div
      v-for="zone in zones"
      :key="zone.id"
      :class="[
        'relative rounded-xl p-3 border transition-all cursor-pointer hover:scale-[1.02]',
        healthBorder(zone.healthStatus),
      ]"
    >
      <!-- Animated pulse indicator -->
      <span
        :class="[
          'absolute top-2 right-2 h-2 w-2 rounded-full',
          healthDot(zone.healthStatus),
        ]"
      >
        <span
          v-if="zone.healthStatus !== 'offline'"
          :class="[
            'absolute inset-0 rounded-full animate-ping opacity-75',
            healthDot(zone.healthStatus),
          ]"
        />
      </span>

      <p class="text-xs text-gray-400 truncate font-medium">{{ zone.name }}</p>
      <p class="text-xs text-gray-500 capitalize">{{ zone.type }}</p>

      <!-- Node count -->
      <div class="mt-2 flex items-center gap-1 text-xs">
        <Icon name="lucide:wifi" class="h-3 w-3 text-gray-500" />
        <span class="text-gray-400"
          >{{ (nodesByZone[zone.id] ?? []).length }} nodes</span
        >
      </div>

      <!-- Moisture mini-bar -->
      <div v-if="avgMoisture(zone.id) !== undefined" class="mt-2">
        <div class="flex justify-between text-[10px] text-gray-500 mb-0.5">
          <span>Moisture</span>
          <span>{{ Math.round(avgMoisture(zone.id)!) }}%</span>
        </div>
        <div class="h-1 bg-gray-700 rounded-full overflow-hidden">
          <div
            class="h-full rounded-full transition-all"
            :class="moistureBarColor(avgMoisture(zone.id)!)"
            :style="{ width: `${avgMoisture(zone.id)}%` }"
          />
        </div>
      </div>

      <!-- Status badge -->
      <div class="mt-2">
        <span
          :class="[
            'inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-md font-medium',
            healthBadge(zone.healthStatus),
          ]"
        >
          {{ zone.healthStatus }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GardenZone, GardenNode, HealthStatus } from "~/types/GardenOS";

const props = defineProps<{
  zones: GardenZone[];
  nodesByZone: Record<string, GardenNode[]>;
}>();

defineEmits(["add-zone"]);

const healthBorder = (s: HealthStatus) =>
  ({
    healthy: "border-green-500/30  bg-green-500/5",
    warning: "border-yellow-500/30 bg-yellow-500/5",
    critical: "border-red-500/40    bg-red-500/8",
    offline: "border-gray-700      bg-gray-800/40",
  })[s];

const healthDot = (s: HealthStatus) =>
  ({
    healthy: "bg-green-400",
    warning: "bg-yellow-400",
    critical: "bg-red-400",
    offline: "bg-gray-500",
  })[s];

const healthBadge = (s: HealthStatus) =>
  ({
    healthy: "bg-green-500/15  text-green-400",
    warning: "bg-yellow-500/15 text-yellow-400",
    critical: "bg-red-500/15    text-red-400",
    offline: "bg-gray-700      text-gray-400",
  })[s];

const moistureBarColor = (v: number) =>
  v < 25 ? "bg-red-400" : v < 50 ? "bg-yellow-400" : "bg-blue-400";

const avgMoisture = (zoneId: string) => {
  const nodeList = props.nodesByZone[zoneId] ?? [];
  const vals = nodeList
    .map((n) => n.telemetry?.soilMoisture)
    .filter((v) => v !== undefined) as number[];
  if (!vals.length) return undefined;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
};
</script>
