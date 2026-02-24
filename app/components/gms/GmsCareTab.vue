<template>
  <div class="space-y-6">
    <!-- Action bar -->
    <div class="flex items-center justify-between">
      <p class="text-sm text-gray-500 dark:text-gray-400">
        {{ plantCareLogs.length }} {{ $t("care.activities_recorded") }}
      </p>
      <UButton
        icon="i-lucide-plus"
        size="sm"
        color="orange"
        @click="showLogModal = true"
      >
        {{ $t("care.log_activity") }}
      </UButton>
    </div>

    <!-- Care timeline -->
    <div v-if="plantCareLogs.length === 0" class="py-16 text-center">
      <div
        class="mx-auto w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-4"
      >
        <Icon name="lucide:droplets" class="h-8 w-8 text-blue-400" />
      </div>
      <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
        {{ $t("care.no_logs") }}
      </p>
      <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
        {{ $t("care.start_logging") }}
      </p>
      <UButton
        size="sm"
        variant="outline"
        class="mt-4"
        @click="showLogModal = true"
      >
        {{ $t("care.log_first") }}
      </UButton>
    </div>

    <div v-else class="relative">
      <!-- Timeline line -->
      <div
        class="absolute left-6 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-800"
      />
      <ul class="space-y-4">
        <li
          v-for="log in plantCareLogs"
          :key="log.id"
          class="flex gap-4 relative"
        >
          <!-- Icon dot -->
          <div
            class="flex-shrink-0 z-10 w-12 h-12 rounded-full flex items-center justify-center"
            :class="getCareColor(log.activity)"
          >
            <Icon :name="getCareIcon(log.activity)" class="h-5 w-5" />
          </div>
          <!-- Content card -->
          <div
            class="flex-1 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 px-5 py-3 flex items-center justify-between transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
          >
            <div class="space-y-0.5">
              <p
                class="text-[15px] font-semibold text-gray-900 dark:text-white capitalize"
              >
                {{
                  $t(`care.activities.${log.activity.toLowerCase()}`) ||
                  log.activity
                }}
              </p>
              <p
                v-if="log.notes"
                class="text-xs text-gray-400 dark:text-gray-500"
              >
                {{ log.notes }}
              </p>
            </div>
            <div class="text-right flex-shrink-0">
              <span
                class="text-xs font-medium text-gray-400 dark:text-gray-500"
                >{{ formatDateTime(log.date) }}</span
              >
              <p
                v-if="log.cost"
                class="text-xs text-indigo-500 dark:text-indigo-400 font-medium mt-0.5"
              >
                {{ formatCurrency(log.cost) }}
              </p>
            </div>
          </div>
        </li>
      </ul>
    </div>

    <!-- Upcoming Schedules -->
    <div
      v-if="plantSchedules.length > 0"
      class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
    >
      <div
        class="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between"
      >
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
          {{ $t("care.upcoming_schedules") }}
        </h3>
        <UButton
          size="xs"
          variant="ghost"
          icon="i-lucide-plus"
          color="orange"
          @click="showScheduleModal = true"
        />
      </div>
      <ul class="divide-y divide-gray-100 dark:divide-gray-800">
        <li
          v-for="s in plantSchedules"
          :key="s.id"
          class="flex items-center justify-between px-5 py-3.5"
        >
          <div class="flex items-center gap-3">
            <Icon
              :name="getCareIcon(s.activity)"
              class="h-5 w-5 text-gray-400"
            />
            <span
              class="text-[15px] font-medium text-gray-900 dark:text-white capitalize"
              >{{
                $t(`care.activities.${s.activity.toLowerCase()}`) || s.activity
              }}</span
            >
            <UBadge size="xs" variant="soft" color="blue">{{
              $t(`care.frequencies.${s.frequency.toLowerCase()}`) || s.frequency
            }}</UBadge>
          </div>
          <span class="text-xs font-medium text-gray-400 dark:text-gray-500">
            {{ $t("care.next") }}: {{ formatDateTime(s.nextDue) }}
          </span>
        </li>
      </ul>
    </div>

    <div v-else class="text-center">
      <UButton
        size="sm"
        variant="outline"
        icon="i-lucide-calendar-plus"
        @click="showScheduleModal = true"
      >
        {{ $t("care.add_schedule") }}
      </UButton>
    </div>

    <!-- Log Activity Modal -->
    <UModal v-model:open="showLogModal">
      <template #content>
        <UCard>
          <template #header>
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">
              {{ $t("care.log_activity") }}
            </h3>
          </template>
          <div class="space-y-4">
            <UFormField :label="$t('care.activity_type')" name="activity">
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="act in activities"
                  :key="act.value"
                  class="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-sm"
                  :class="
                    logForm.activity === act.value
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                  "
                  @click="logForm.activity = act.value"
                >
                  <Icon :name="act.icon" class="h-5 w-5" />
                  <span class="text-xs font-medium">{{
                    $t(`care.activities.${act.value}`)
                  }}</span>
                </button>
              </div>
            </UFormField>
            <div class="grid grid-cols-2 gap-3">
              <UFormField :label="$t('harvest.date')" name="date">
                <UInput
                  v-model="logForm.date"
                  type="datetime-local"
                  class="w-full"
                />
              </UFormField>
              <UFormField :label="$t('care.cost_optional')" name="cost">
                <UInput
                  v-model="logForm.cost"
                  type="number"
                  step="100"
                  placeholder="0"
                  class="w-full"
                />
              </UFormField>
            </div>
            <UFormField :label="$t('common.notes')" name="notes">
              <UTextarea
                v-model="logForm.notes"
                :rows="2"
                class="w-full"
                :placeholder="$t('care.notes_placeholder')"
              />
            </UFormField>
          </div>
          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton variant="ghost" @click="showLogModal = false">{{
                $t("common.cancel")
              }}</UButton>
              <UButton
                :loading="isLogging"
                :disabled="!logForm.activity"
                color="green"
                @click="submitLog"
              >
                {{ $t("common.save") }}
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>

    <!-- Schedule Modal -->
    <UModal v-model:open="showScheduleModal">
      <template #content>
        <UCard>
          <template #header>
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">
              {{ $t("care.add_schedule") }}
            </h3>
          </template>
          <div class="space-y-4 grid grid-cols-2 gap-3">
            <UFormField :label="$t('care.activity_type')" name="activity">
              <USelect
                v-model="scheduleForm.activity"
                :items="activityOptions"
                class="w-full"
              />
            </UFormField>
            <UFormField :label="$t('care.frequency')" name="frequency">
              <USelect
                v-model="scheduleForm.frequency"
                :items="frequencyOptions"
                class="w-full"
              />
            </UFormField>
            <UFormField :label="$t('care.start_date')" name="start">
              <UInput
                v-model="scheduleForm.startDate"
                type="datetime-local"
                class="w-full"
              />
            </UFormField>
            <UFormField :label="$t('common.notes')" name="notes">
              <UTextarea
                v-model="scheduleForm.notes"
                :rows="1"
                class="w-full"
              />
            </UFormField>
          </div>
          <template #footer>
            <div class="flex justify-end w-full gap-3">
              <UButton variant="ghost" block @click="showScheduleModal = false">
                {{ $t("common.cancel") }}
              </UButton>
              <UButton :loading="isScheduling" block @click="submitSchedule">{{
                $t("common.save")
              }}</UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ plantId: string }>();
const { t } = useI18n();
const toast = useToast();
const { careLogs, schedules, createCareLog, createSchedule, isOnline } =
  useNostrGms();

const { formatDateTime } = useHelpers();

const plantCareLogs = computed(() =>
  careLogs.value
    .filter((l) => l.plantId === props.plantId)
    .sort((a, b) => b.date.localeCompare(a.date)),
);
const plantSchedules = computed(() =>
  schedules.value.filter((s) => s.plantId === props.plantId && s.isActive),
);

const showLogModal = ref(false);
const showScheduleModal = ref(false);
const isLogging = ref(false);
const isScheduling = ref(false);

const currentDate = new Date().toISOString().split("T");

const today = currentDate[0] + " " + currentDate[1]?.substring(0, 5);
const logForm = reactive({ activity: "", date: today, cost: "", notes: "" });
const scheduleForm = reactive({
  activity: "watering",
  frequency: "daily",
  startDate: today,
  notes: "",
});

const activities = [
  { value: "watering", icon: "lucide:droplets" },
  { value: "fertilizing", icon: "lucide:flask-conical" },
  { value: "pruning", icon: "lucide:scissors" },
  { value: "pest_control", icon: "lucide:bug" },
  { value: "weeding", icon: "lucide:shovel" },
  { value: "mulching", icon: "lucide:layers" },
];
const activityOptions = activities.map((a) => ({
  label: a.value,
  value: a.value,
}));
const frequencyOptions = [
  { label: t("care.freq.daily"), value: "daily" },
  { label: t("care.freq.weekly"), value: "weekly" },
  { label: t("care.freq.biweekly"), value: "biweekly" },
  { label: t("care.freq.monthly"), value: "monthly" },
];

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("lo-LA", { style: "currency", currency: "LAK" }).format(
    n,
  );

const getCareIcon = (a: string) =>
  ({
    watering: "lucide:droplets",
    fertilizing: "lucide:flask-conical",
    pruning: "lucide:scissors",
    pest_control: "lucide:bug",
    weeding: "lucide:shovel",
    mulching: "lucide:layers",
  })[a] || "lucide:clipboard";

const getCareColor = (a: string) =>
  ({
    watering:
      "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400",
    fertilizing:
      "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400",
    pruning:
      "bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400",
    pest_control:
      "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400",
    weeding:
      "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-400",
    mulching:
      "bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400",
  })[a] || "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400";

const submitLog = async () => {
  if (!logForm.activity) return;
  isLogging.value = true;
  try {
    const ok = await createCareLog({
      plantId: props.plantId,
      activity: logForm.activity,
      date: logForm.date,
      cost: logForm.cost ? parseFloat(logForm.cost) : undefined,
      notes: logForm.notes || undefined,
    });
    if (ok) {
      toast.add({
        title: isOnline.value
          ? t("care.log_success")
          : t("common.saved_offline"),
        color: isOnline.value ? "green" : "yellow",
        icon: "i-lucide-check-circle",
      });
      Object.assign(logForm, {
        activity: "",
        date: today,
        cost: "",
        notes: "",
      });
      showLogModal.value = false;
    }
  } finally {
    isLogging.value = false;
  }
};

const submitSchedule = async () => {
  isScheduling.value = true;
  try {
    const ok = await createSchedule({
      plantId: props.plantId,
      activity: scheduleForm.activity,
      frequency: scheduleForm.frequency,
      startDate: scheduleForm.startDate,
      notes: scheduleForm.notes || undefined,
    });
    if (ok) {
      toast.add({
        title: isOnline.value
          ? t("care.schedule_success")
          : t("common.saved_offline"),
        color: isOnline.value ? "green" : "yellow",
        icon: "i-lucide-check-circle",
      });
      showScheduleModal.value = false;
    }
  } finally {
    isScheduling.value = false;
  }
};
</script>
