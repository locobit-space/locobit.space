<!-- components/garden/GardenIrrigationPanel.vue -->
<template>
  <div>
    <div
      v-if="zones.length === 0"
      class="text-xs text-gray-500 text-center py-4"
    >
      No zones configured.
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="zone in zones"
        :key="zone.id"
        class="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 border border-gray-200"
      >
        <!-- Status indicator -->
        <span
          :class="[
            'h-2.5 w-2.5 rounded-full shrink-0 transition-all',
            activeZones[zone.id] ? 'bg-blue-400 animate-pulse' : 'bg-gray-600',
          ]"
        />

        <!-- Zone name -->
        <div class="flex-1 min-w-0">
          <p
            class="text-sm font-medium text-gray-900 dark:text-gray-200 truncate"
          >
            {{ zone.name }}
          </p>
          <p class="text-xs text-gray-500 capitalize">{{ zone.type }}</p>
        </div>

        <!-- Active timer -->
        <div
          v-if="activeZones[zone.id]"
          class="text-xs text-blue-400 hidden sm:block"
        >
          <Icon name="lucide:timer" class="h-3 w-3 inline mr-1" />
          running
        </div>

        <!-- Duration picker -->
        <select
          v-if="!activeZones[zone.id]"
          v-model="durations[zone.id]"
          class="text-xs bg-gray-700 border border-gray-600 dark:bg-gray-800 dark:border-gray-700 text-gray-300 rounded px-1.5 py-1"
        >
          <option :value="120">2 min</option>
          <option :value="300">5 min</option>
          <option :value="600">10 min</option>
          <option :value="900">15 min</option>
          <option :value="1800">30 min</option>
        </select>

        <!-- Control button -->
        <UButton
          v-if="!activeZones[zone.id]"
          size="xs"
          color="info"
          variant="soft"
          icon="i-lucide-play"
          :disabled="!zone.irrigationNodeId"
          @click="
            emit('irrigate-on', {
              zoneId: zone.id,
              nodeId: zone.irrigationNodeId!,
              durationSeconds: durations[zone.id] ?? 300,
            })
          "
        >
          Start
        </UButton>
        <UButton
          v-else
          size="xs"
          color="error"
          variant="soft"
          icon="i-lucide-square"
          @click="
            emit('irrigate-off', {
              zoneId: zone.id,
              nodeId: activeZones[zone.id]!.nodeId,
            })
          "
        >
          Stop
        </UButton>
      </div>
    </div>

    <div class="mt-3 flex justify-end">
      <NuxtLink
        to="/garden-os/irrigation"
        class="text-xs text-green-400 hover:underline flex items-center gap-1"
      >
        Full irrigation panel
        <Icon name="lucide:arrow-right" class="h-3 w-3" />
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GardenZone, GardenIrrigation } from "~/types/GardenOS";

const props = defineProps<{
  zones: GardenZone[];
  activeZones: Record<string, GardenIrrigation>;
}>();

const emit = defineEmits<{
  "irrigate-on": [
    payload: { zoneId: string; nodeId: string; durationSeconds: number },
  ];
  "irrigate-off": [payload: { zoneId: string; nodeId: string }];
}>();

// Default durations per zone (300s = 5min)
const durations = ref<Record<string, number>>(
  Object.fromEntries(props.zones.map((z) => [z.id, 300])),
);
</script>
