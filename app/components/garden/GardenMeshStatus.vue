<!-- components/garden/GardenMeshStatus.vue — compact mesh node list -->
<template>
  <div>
    <div
      v-if="nodes.length === 0"
      class="text-xs text-gray-500 text-center py-4"
    >
      No nodes discovered yet.
    </div>
    <div v-else class="space-y-1.5">
      <div
        v-for="node in nodes"
        :key="node.id"
        class="flex items-center gap-2 text-xs"
      >
        <!-- online dot -->
        <span
          :class="[
            'h-1.5 w-1.5 rounded-full shrink-0',
            node.isOnline ? 'bg-green-400' : 'bg-gray-500',
          ]"
        />

        <!-- name + role -->
        <span
          class="text-gray-700 dark:text-gray-200 truncate flex-1 min-w-0"
          >{{ node.name }}</span
        >
        <span
          class="text-gray-700 dark:text-gray-200 capitalize hidden sm:block"
        >
          {{ node.role }}
        </span>

        <!-- signal strength bar -->
        <div class="flex gap-0.5 items-end h-3">
          <span
            v-for="bar in 4"
            :key="bar"
            :class="[
              'w-1 rounded-sm transition-all',
              bar <= signalBars(node.signalStrength)
                ? 'bg-green-400'
                : 'bg-gray-700',
              bar === 1
                ? 'h-1'
                : bar === 2
                  ? 'h-1.5'
                  : bar === 3
                    ? 'h-2'
                    : 'h-3',
            ]"
          />
        </div>

        <!-- battery -->
        <span
          v-if="node.batteryLevel !== undefined"
          :class="[
            'font-medium',
            node.batteryLevel < 20 ? 'text-red-400' : 'text-gray-400',
          ]"
          >{{ Math.round(node.batteryLevel) }}%</span
        >
      </div>
    </div>

    <!-- summary line -->
    <div
      v-if="nodes.length > 0"
      class="mt-3 pt-2 border-t border-gray-200 dark:border-gray-800 flex justify-between text-[10px] text-gray-500"
    >
      <span>{{ onlineCount }} / {{ nodes.length }} online</span>
      <NuxtLink to="/garden-os/nodes" class="text-green-400 hover:underline"
        >Manage nodes →</NuxtLink
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GardenNode } from "~/types/GardenOS";

const props = defineProps<{ nodes: GardenNode[] }>();

const onlineCount = computed(
  () => props.nodes.filter((n) => n.isOnline).length,
);

/** Map dBm to 0-4 bars */
const signalBars = (dbm?: number) => {
  if (dbm === undefined) return 0;
  if (dbm >= -60) return 4;
  if (dbm >= -70) return 3;
  if (dbm >= -80) return 2;
  if (dbm >= -90) return 1;
  return 0;
};
</script>
