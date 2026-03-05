<!-- components/garden/GardenAlertsFeed.vue -->
<template>
  <div class="space-y-2 max-h-80 overflow-y-auto pr-1">
    <p v-if="alerts.length === 0" class="text-xs text-gray-500 text-center py-4">
      No active alerts 🌿
    </p>
    <TransitionGroup name="alert-fade" tag="div" class="space-y-2">
      <div
        v-for="alert in alerts"
        :key="alert.id"
        :class="[
          'flex gap-2 p-2 rounded-lg border text-xs transition-all',
          alert.acknowledged ? 'opacity-40' : '',
          severityClass(alert.severity),
        ]"
      >
        <Icon :name="severityIcon(alert.severity)" :class="['h-3.5 w-3.5 shrink-0 mt-0.5', severityIconColor(alert.severity)]" />
        <div class="flex-1 min-w-0">
          <p class="text-gray-200 wrap-break-word">{{ alert.message }}</p>
          <p class="text-gray-500 mt-0.5">{{ timeLabel(alert.createdAt) }}</p>
        </div>
        <button
          v-if="!alert.acknowledged"
          class="text-gray-600 hover:text-gray-300 shrink-0"
          @click="$emit('acknowledge', alert.id)"
          title="Dismiss"
        >
          <Icon name="lucide:x" class="h-3 w-3" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import type { GardenAlert } from "~/types/GardenOS"

defineProps<{ alerts: GardenAlert[] }>()
defineEmits<{ acknowledge: [id: string] }>()

const severityClass = (s: GardenAlert["severity"]) => ({
  info:     "border-blue-500/20  bg-blue-500/5",
  warning:  "border-yellow-500/20 bg-yellow-500/5",
  critical: "border-red-500/25  bg-red-500/8",
}[s])

const severityIcon = (s: GardenAlert["severity"]) => ({
  info:     "lucide:info",
  warning:  "lucide:triangle-alert",
  critical: "lucide:octagon-alert",
}[s])

const severityIconColor = (s: GardenAlert["severity"]) => ({
  info:     "text-blue-400",
  warning:  "text-yellow-400",
  critical: "text-red-400",
}[s])

const timeLabel = (ms: number) => {
  const diff = Date.now() - ms
  if (diff < 60_000)    return `${Math.round(diff / 1000)}s ago`
  if (diff < 3600_000)  return `${Math.round(diff / 60_000)}m ago`
  return `${Math.round(diff / 3600_000)}h ago`
}
</script>

<style scoped>
.alert-fade-enter-active { transition: all 0.2s ease; }
.alert-fade-leave-active { transition: all 0.15s ease; }
.alert-fade-enter-from   { opacity: 0; transform: translateY(-6px); }
.alert-fade-leave-to     { opacity: 0; transform: translateX(10px); }
</style>
