<template>
  <div
    class="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100"
  >
    <div
      class="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-4 flex items-center gap-3"
    >
      <NuxtLink
        to="/garden-os"
        class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        <Icon name="lucide:arrow-left" class="h-4 w-4" />
      </NuxtLink>
      <Icon
        name="lucide:droplet"
        class="h-5 w-5 text-blue-500 dark:text-blue-400"
      />
      <h1 class="font-semibold text-gray-900 dark:text-gray-100">
        Irrigation Control
      </h1>
      <UBadge color="info" variant="soft" size="xs"
        >{{ irrigation.activeCount.value }} active</UBadge
      >
    </div>

    <div class="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <!-- Zone control grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          v-for="zone in zones.zones.value"
          :key="zone.id"
          :class="[
            'rounded-xl p-4 border space-y-3 transition-colors bg-white dark:bg-gray-900',
            irrigation.isZoneActive(zone.id)
              ? 'border-blue-500/40 bg-blue-50 dark:bg-blue-500/5'
              : 'border-gray-200 dark:border-gray-700',
          ]"
        >
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-semibold text-gray-900 dark:text-gray-100">
                {{ zone.name }}
              </h3>
              <p class="text-xs text-gray-500 capitalize">
                {{ zone.type }} · {{ zone.nodeIds.length }} nodes
              </p>
            </div>
            <div
              :class="[
                'h-3 w-3 rounded-full',
                irrigation.isZoneActive(zone.id)
                  ? 'bg-blue-500 dark:bg-blue-400 animate-pulse'
                  : 'bg-gray-300 dark:bg-gray-600',
              ]"
            />
          </div>

          <!-- Active indicator -->
          <div
            v-if="irrigation.isZoneActive(zone.id)"
            class="flex items-center gap-2 text-sm text-blue-400 bg-blue-500/10 rounded-lg px-3 py-2"
          >
            <Icon name="lucide:timer" class="h-4 w-4 animate-spin" />
            Irrigation running
          </div>

          <!-- Duration control -->
          <div v-else class="flex gap-2">
            <select
              v-model="durations[zone.id]"
              class="flex-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none transition-shadow"
            >
              <option :value="60">1 min</option>
              <option :value="120">2 min</option>
              <option :value="300">5 min</option>
              <option :value="600">10 min</option>
              <option :value="900">15 min</option>
              <option :value="1800">30 min</option>
              <option :value="3600">1 hour</option>
            </select>
          </div>

          <!-- Action buttons -->
          <div class="flex gap-2">
            <UButton
              v-if="!irrigation.isZoneActive(zone.id)"
              class="flex-1"
              color="info"
              variant="soft"
              icon="i-lucide-play"
              :disabled="!zone.irrigationNodeId"
              @click="startIrrigation(zone.id, zone.irrigationNodeId!)"
            >
              Start
            </UButton>
            <UButton
              v-else
              class="flex-1"
              color="error"
              variant="soft"
              icon="i-lucide-square"
              @click="stopIrrigation(zone.id)"
            >
              Stop
            </UButton>
          </div>

          <p v-if="!zone.irrigationNodeId" class="text-xs text-yellow-500">
            ⚠ No irrigation actuator assigned to this zone.
          </p>
        </div>
      </div>

      <!-- Recent commands history -->
      <CommonCard>
        <template #header>
          <span
            class="font-semibold text-sm text-gray-900 dark:text-gray-200 flex items-center gap-2"
          >
            <Icon name="lucide:history" class="h-4 w-4" />
            Recent Commands
          </span>
        </template>
        <div
          v-if="irrigation.commands.value.length === 0"
          class="text-center text-gray-500 text-sm py-6"
        >
          No irrigation events recorded yet.
        </div>
        <div v-else class="space-y-1.5">
          <div
            v-for="cmd in irrigation.commands.value.slice(0, 20)"
            :key="cmd.id"
            class="flex items-center gap-3 text-xs p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Icon
              :name="cmd.command === 'on' ? 'lucide:play' : 'lucide:square'"
              :class="
                cmd.command === 'on'
                  ? 'text-blue-500 dark:text-blue-400'
                  : 'text-gray-400 dark:text-gray-500'
              "
              class="h-3.5 w-3.5 shrink-0"
            />
            <span class="flex-1 text-gray-700 dark:text-gray-300"
              >Zone <strong>{{ cmd.zoneId }}</strong> —
              {{ cmd.command === "on" ? `on (${cmd.duration}s)` : "off" }}</span
            >
            <span class="text-gray-500 capitalize">{{ cmd.source }}</span>
            <span class="text-gray-400 dark:text-gray-600">{{
              timeLabel(cmd.createdAt)
            }}</span>
          </div>
        </div>
      </CommonCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGardenOS } from "~/composables/garden";

const { zones, irrigation, audit, boot, isBooted } = useGardenOS();
const { user } = useNostrUser();

onMounted(async () => {
  if (!isBooted.value) await boot({ mockMode: import.meta.env.DEV });
});

// Default durations
const durations = ref<Record<string, number>>(
  Object.fromEntries((zones.zones.value ?? []).map((z) => [z.id, 300])),
);
watch(
  () => zones.zones.value,
  (zs) => {
    zs.forEach((z) => {
      if (!durations.value[z.id]) durations.value[z.id] = 300;
    });
  },
);

const startIrrigation = async (zoneId: string, nodeId: string) => {
  if (!user.value?.privateKey) return;
  const pk = user.value.privateKey;
  const dur = durations.value[zoneId] ?? 300;
  await irrigation.irrigateOn({
    privateKeyHex: pk,
    zoneId,
    nodeId,
    durationSeconds: dur,
    source: "manual",
    actorRole: "owner",
  });
  audit.logAudit({
    privateKeyHex: pk,
    action: "irrigation_start",
    actorPubkey: user.value.publicKey,
    actorRole: "owner",
    targetId: zoneId,
    targetType: "zone",
    payload: { duration: dur },
  });
};

const stopIrrigation = async (zoneId: string) => {
  const active = irrigation.activeZones.value[zoneId];
  if (!active || !user.value?.privateKey) return;
  const pk = user.value.privateKey;
  await irrigation.irrigateOff({
    privateKeyHex: pk,
    zoneId,
    nodeId: active.nodeId,
    source: "manual",
    actorRole: "owner",
  });
  audit.logAudit({
    privateKeyHex: pk,
    action: "irrigation_stop",
    actorPubkey: user.value.publicKey,
    actorRole: "owner",
    targetId: zoneId,
    targetType: "zone",
  });
};

const timeLabel = (ms: number) => {
  const d = Date.now() - ms;
  if (d < 60_000) return `${Math.round(d / 1000)}s ago`;
  if (d < 3600_000) return `${Math.round(d / 60_000)}m ago`;
  return new Date(ms).toLocaleTimeString();
};

useHead({ title: "Irrigation — GardenOS" });
definePageMeta({ layout: "default" });
</script>
