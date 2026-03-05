<template>
  <div class="min-h-screen">
    <!-- Offline Banner -->
    <div
      v-if="!isOnline"
      class="bg-yellow-500 text-white text-sm text-center py-1.5 px-4 flex items-center justify-center gap-2"
    >
      <Icon name="lucide:wifi-off" class="h-4 w-4 shrink-0" />
      {{ $t("common.offline_mode") }} —
      {{ $t("common.changes_queued", { count: offlineQueueCount }) }}
    </div>

    <!-- Header -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center py-6">
        <div class="flex items-center gap-3">
          <Icon
            name="lucide:leaf"
            class="h-8 w-8 text-green-600 dark:text-green-400"
          />
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
            {{ $t("garden.title") }}
          </h1>
        </div>
        <div class="flex items-center gap-3">
          <UButton
            to="/garden-os"
            icon="i-lucide-cpu"
            color="neutral"
            variant="outline"
            size="sm"
            class="hidden sm:flex"
          >
            GardenOS
          </UButton>
          <UButton
            to="/garden/register"
            icon="i-lucide-plus"
            color="primary"
            variant="solid"
            class="hidden sm:flex"
          >
            {{ $t("plants.register_new") }}
          </UButton>
          <UButton
            to="/garden/register"
            icon="i-lucide-plus"
            color="primary"
            variant="solid"
            class="sm:hidden"
            square
          />
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
      <!-- Loading skeleton -->
      <div v-if="isLoading" class="flex justify-center items-center py-20">
        <Icon
          name="lucide:loader-circle"
          class="h-10 w-10 animate-spin text-green-500"
        />
      </div>

      <template v-else>
        <!-- Stats Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <!-- Total Plants -->
          <UCard>
            <div class="flex items-center gap-4">
              <div
                class="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center shrink-0"
              >
                <Icon
                  name="lucide:trees"
                  class="h-6 w-6 text-green-600 dark:text-green-400"
                />
              </div>
              <div class="min-w-0">
                <p
                  class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate"
                >
                  {{ $t("dashboard.total_plants") }}
                </p>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ totalPlants }}
                </p>
              </div>
            </div>
          </UCard>

          <!-- Active Plots -->
          <UCard>
            <div class="flex items-center gap-4">
              <div
                class="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0"
              >
                <Icon
                  name="lucide:map-pin"
                  class="h-6 w-6 text-blue-600 dark:text-blue-400"
                />
              </div>
              <div class="min-w-0">
                <p
                  class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate"
                >
                  {{ $t("dashboard.active_plots") }}
                </p>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ activePlots }}
                </p>
              </div>
            </div>
          </UCard>

          <!-- Pending Care -->
          <UCard>
            <div class="flex items-center gap-4">
              <div
                class="w-12 h-12 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center shrink-0"
              >
                <Icon
                  name="lucide:calendar-check"
                  class="h-6 w-6 text-yellow-600 dark:text-yellow-400"
                />
              </div>
              <div class="min-w-0">
                <p
                  class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate"
                >
                  {{ $t("dashboard.pending_care") }}
                </p>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ pendingCare }}
                </p>
              </div>
            </div>
          </UCard>

          <!-- Total Revenue -->
          <UCard>
            <div class="flex items-center gap-4">
              <div
                class="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center shrink-0"
              >
                <Icon
                  name="lucide:circle-dollar-sign"
                  class="h-6 w-6 text-purple-600 dark:text-purple-400"
                />
              </div>
              <div class="min-w-0">
                <p
                  class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate"
                >
                  {{ $t("dashboard.total_revenue") }}
                </p>
                <p
                  class="text-xl font-bold text-gray-900 dark:text-white truncate"
                >
                  {{ formatCurrency(totalRevenue) }}
                </p>
              </div>
            </div>
          </UCard>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Plants Table -->
          <div class="lg:col-span-2 space-y-4">
            <!-- Search + Filter Bar -->
            <div class="flex flex-col sm:flex-row gap-3">
              <UInput
                v-model="searchQuery"
                icon="i-lucide-search"
                :placeholder="$t('common.search_plants')"
                class="flex-1"
              />
              <!-- Status filter chips -->
              <div class="flex gap-1.5 flex-wrap">
                <button
                  v-for="chip in statusChips"
                  :key="chip.value"
                  class="px-3 py-1.5 rounded-full text-xs font-medium transition-all border"
                  :class="
                    statusFilter === chip.value
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-green-400'
                  "
                  @click="
                    statusFilter = statusFilter === chip.value ? '' : chip.value
                  "
                >
                  {{ chip.label }}
                </button>
              </div>
            </div>

            <UCard :ui="{ body: 'p-0 sm:p-0' }">
              <template #header>
                <div class="flex justify-between items-center">
                  <h3
                    class="text-base font-semibold text-gray-900 dark:text-white"
                  >
                    {{ $t("dashboard.recent_plants") }}
                    <span class="ml-2 text-xs font-normal text-gray-400"
                      >({{ filteredPlants.length }})</span
                    >
                  </h3>
                </div>
              </template>

              <!-- Empty state -->
              <div
                v-if="!plants.length"
                class="py-12 text-center text-gray-400 dark:text-gray-500"
              >
                <Icon
                  name="lucide:sprout"
                  class="h-12 w-12 mx-auto mb-3 opacity-40"
                />
                <p class="text-sm">{{ $t("plants.no_plants_yet") }}</p>
                <UButton
                  to="/garden/register"
                  size="sm"
                  class="mt-3"
                  variant="soft"
                  color="green"
                >
                  {{ $t("plants.register_new") }}
                </UButton>
              </div>

              <div
                v-else-if="!filteredPlants.length"
                class="py-10 text-center text-gray-400"
              >
                <Icon
                  name="lucide:search-x"
                  class="h-10 w-10 mx-auto mb-2 opacity-40"
                />
                <p class="text-sm">{{ $t("common.no_results") }}</p>
              </div>

              <div v-else class="overflow-x-auto">
                <table
                  class="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
                >
                  <thead class="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th
                        class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        {{ $t("plants.name") }}
                      </th>
                      <th
                        class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell"
                      >
                        {{ $t("plants.plot") }}
                      </th>
                      <th
                        class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell"
                      >
                        {{ $t("plants.planted_date") }}
                      </th>
                      <th
                        class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        {{ $t("common.status") }}
                      </th>
                      <th class="px-5 py-3 w-8" />
                    </tr>
                  </thead>
                  <tbody
                    class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700"
                  >
                    <tr
                      v-for="plant in visiblePlants"
                      :key="plant.id"
                      class="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                      @click="$router.push('/garden/plant/' + plant.id)"
                    >
                      <td class="px-5 py-3.5 whitespace-nowrap">
                        <div class="flex items-center gap-2">
                          <Icon
                            :name="getPlantIcon(plant.category)"
                            class="h-4 w-4 text-green-600 dark:text-green-400 shrink-0"
                          />
                          <span
                            class="text-sm font-medium text-gray-900 dark:text-white"
                            >{{ plant.name }}</span
                          >
                          <span
                            v-if="plant.variety"
                            class="text-xs text-gray-400 hidden sm:inline"
                            >{{ plant.variety }}</span
                          >
                        </div>
                      </td>
                      <td
                        class="px-5 py-3.5 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell"
                      >
                        {{ plant.plot }}
                      </td>
                      <td
                        class="px-5 py-3.5 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell"
                      >
                        {{ formatDate(plant.plantedDate) }}
                      </td>
                      <td class="px-5 py-3.5 whitespace-nowrap">
                        <UBadge
                          :color="getStatusColor(plant.status) as any"
                          variant="soft"
                          size="xs"
                        >
                          {{ $t(`plants.status.${plant.status}`) }}
                        </UBadge>
                      </td>
                      <td class="px-5 py-3.5 whitespace-nowrap text-right">
                        <Icon
                          name="lucide:chevron-right"
                          class="h-4 w-4 text-gray-400"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>

                <!-- Show more -->
                <div
                  v-if="filteredPlants.length > pageSize"
                  class="px-5 py-3 border-t border-gray-100 dark:border-gray-800 flex justify-center"
                >
                  <UButton
                    v-if="showAll"
                    variant="ghost"
                    size="xs"
                    color="neutral"
                    @click="showAll = false"
                  >
                    {{ $t("common.show_less") }}
                  </UButton>
                  <UButton
                    v-else
                    variant="ghost"
                    size="xs"
                    color="neutral"
                    @click="showAll = true"
                  >
                    {{
                      $t("common.show_all", { count: filteredPlants.length })
                    }}
                  </UButton>
                </div>
              </div>
            </UCard>
          </div>

          <!-- Right column -->
          <div class="space-y-6">
            <!-- Quick Actions -->
            <UCard>
              <template #header>
                <h3
                  class="text-base font-semibold text-gray-900 dark:text-white"
                >
                  {{ $t("dashboard.quick_actions") }}
                </h3>
              </template>

              <div class="space-y-2.5">
                <UButton
                  to="/garden/register"
                  block
                  icon="i-lucide-plus"
                  color="primary"
                  variant="outline"
                >
                  {{ $t("plants.register_new") }}
                </UButton>

                <UButton
                  block
                  icon="i-lucide-droplets"
                  color="blue"
                  variant="outline"
                  :disabled="!plants.length"
                  @click="openLogModal"
                >
                  {{ $t("care.log_activity") }}
                </UButton>

                <UButton
                  block
                  icon="i-lucide-archive"
                  color="green"
                  variant="outline"
                  :disabled="!plants.length"
                  @click="openHarvestModal"
                >
                  {{ $t("harvest.record") }}
                </UButton>

                <USeparator />

                <UButton
                  to="/garden-os"
                  block
                  icon="i-lucide-cpu"
                  color="neutral"
                  variant="outline"
                >
                  GardenOS Dashboard
                </UButton>
              </div>
            </UCard>

            <!-- Overdue Care Tasks -->
            <UCard>
              <template #header>
                <div class="flex items-center justify-between">
                  <h3
                    class="text-base font-semibold text-gray-900 dark:text-white"
                  >
                    {{ $t("dashboard.pending_tasks") }}
                  </h3>
                  <UBadge
                    v-if="overdueSchedules.length"
                    color="red"
                    variant="soft"
                    size="xs"
                  >
                    {{ overdueSchedules.length }}
                  </UBadge>
                </div>
              </template>

              <div class="space-y-2.5">
                <div
                  v-if="!overdueSchedules.length"
                  class="py-6 text-center text-gray-400 flex flex-col items-center gap-2 dark:text-gray-500 text-sm"
                >
                  <Icon
                    name="lucide:check-circle"
                    class="opacity-40"
                    size="32"
                  />
                  {{ $t("care.all_done") }}
                </div>

                <NuxtLink
                  v-for="schedule in overdueSchedules"
                  :key="schedule.id"
                  :to="`/garden/plant/${schedule.plantId}`"
                  class="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-800/30 hover:bg-red-100/60 dark:hover:bg-red-900/20 transition-colors"
                >
                  <div class="flex items-center gap-2 min-w-0">
                    <Icon
                      :name="getTaskIcon(schedule.activity)"
                      class="h-4 w-4 text-red-500 shrink-0"
                    />
                    <div class="min-w-0">
                      <p
                        class="text-sm font-medium text-gray-900 dark:text-white truncate"
                      >
                        {{ $t(`care.activities.${schedule.activity}`) }}
                      </p>
                      <p
                        class="text-xs text-gray-500 dark:text-gray-400 truncate"
                      >
                        {{ schedule.plantName || $t("plants.unknown") }}
                        <span v-if="schedule.plot"> · {{ schedule.plot }}</span>
                      </p>
                    </div>
                  </div>
                  <UBadge
                    color="red"
                    variant="soft"
                    size="xs"
                    class="shrink-0 ml-2"
                  >
                    {{ $t("care.overdue") }}
                  </UBadge>
                </NuxtLink>
              </div>
            </UCard>
          </div>
        </div>
      </template>
    </div>

    <!-- Quick Log Activity Modal -->
    <UModal v-model:open="showLogModal">
      <template #content>
        <UCard>
          <template #header>
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">
              {{ $t("care.log_activity") }}
            </h3>
          </template>
          <div class="space-y-4">
            <UFormField :label="$t('plants.name')" name="plant">
              <USelect
                v-model="logForm.plantId"
                :items="plantOptions"
                class="w-full"
              />
            </UFormField>
            <div class="grid grid-cols-2 gap-3">
              <UFormField :label="$t('care.activity_type')" name="activity">
                <USelect
                  v-model="logForm.activity"
                  :items="activityOptions"
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
            <UFormField :label="$t('harvest.date')" name="date">
              <UInput
                v-model="logForm.date"
                type="datetime-local"
                class="w-full"
              />
            </UFormField>
            <UFormField :label="$t('common.notes')" name="notes">
              <UTextarea v-model="logForm.notes" :rows="2" class="w-full" />
            </UFormField>
          </div>
          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton variant="ghost" @click="showLogModal = false">{{
                $t("common.cancel")
              }}</UButton>
              <UButton
                :loading="isLogging"
                :disabled="!logForm.plantId || !logForm.activity"
                color="blue"
                @click="submitLog"
              >
                {{ $t("common.save") }}
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>

    <!-- Quick Record Harvest Modal -->
    <UModal v-model:open="showHarvestModal">
      <template #content>
        <UCard>
          <template #header>
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">
              {{ $t("harvest.record") }}
            </h3>
          </template>
          <div class="space-y-4">
            <UFormField :label="$t('plants.name')" name="plant">
              <USelect
                v-model="harvestForm.plantId"
                :items="plantOptions"
                class="w-full"
              />
            </UFormField>
            <div class="grid grid-cols-2 gap-3">
              <UFormField :label="$t('harvest.quantity')" name="qty">
                <UInput
                  v-model="harvestForm.quantity"
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  class="w-full"
                />
              </UFormField>
              <UFormField :label="$t('plants.unit')" name="unit">
                <USelect
                  v-model="harvestForm.unit"
                  :items="unitOptions"
                  class="w-full"
                />
              </UFormField>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <UFormField :label="$t('harvest.date')" name="date">
                <UInput
                  v-model="harvestForm.date"
                  type="datetime-local"
                  class="w-full"
                />
              </UFormField>
              <UFormField
                :label="$t('harvest.revenue_optional')"
                name="revenue"
              >
                <UInput
                  v-model="harvestForm.revenue"
                  type="number"
                  step="100"
                  placeholder="0"
                  class="w-full"
                />
              </UFormField>
            </div>
            <UFormField :label="$t('common.notes')" name="notes">
              <UTextarea v-model="harvestForm.notes" :rows="2" class="w-full" />
            </UFormField>
          </div>
          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton variant="ghost" @click="showHarvestModal = false">{{
                $t("common.cancel")
              }}</UButton>
              <UButton
                :loading="isHarvesting"
                :disabled="!harvestForm.plantId || !harvestForm.quantity"
                color="green"
                @click="submitHarvest"
              >
                {{ $t("common.save") }}
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";

const { t } = useI18n();
const toast = useToast();

const {
  plants,
  harvests,
  schedules,
  isLoading,
  isOnline,
  totalPlants,
  activePlots,
  pendingCare,
  loadAll,
  getOfflineQueue,
  createCareLog,
  createHarvest,
} = useNostrGms();

const offlineQueueCount = computed(() => getOfflineQueue().length);

/* ─── search / filter ──────────────────────────────── */
const searchQuery = ref("");
const statusFilter = ref("");
const showAll = ref(false);
const pageSize = 8;

const statusChips = computed(() => [
  { label: t("plants.status.seedling"), value: "seedling" },
  { label: t("plants.status.growing"), value: "growing" },
  { label: t("plants.status.flowering"), value: "flowering" },
  { label: t("plants.status.mature"), value: "mature" },
  { label: t("plants.status.harvesting"), value: "harvesting" },
]);

const filteredPlants = computed(() => {
  let list = plants.value;
  if (statusFilter.value)
    list = list.filter((p) => p.status === statusFilter.value);
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.plot.toLowerCase().includes(q) ||
        (p.variety ?? "").toLowerCase().includes(q),
    );
  }
  return list;
});

const visiblePlants = computed(() =>
  showAll.value
    ? filteredPlants.value
    : filteredPlants.value.slice(0, pageSize),
);

/* ─── overdue tasks ─────────────────────────────────── */
const overdueSchedules = computed(() => {
  const now = new Date();
  return schedules.value
    .filter((s) => s.isActive && new Date(s.nextDue) <= now)
    .slice(0, 5);
});

/* ─── stats ─────────────────────────────────────────── */
const totalRevenue = computed(() =>
  harvests.value.reduce((acc, h) => acc + (h.revenue ?? 0), 0),
);

/* ─── quick log modal ───────────────────────────────── */
const showLogModal = ref(false);
const isLogging = ref(false);

const nowStr = () => {
  const d = new Date().toISOString().split("T");
  return d[0] + "T" + (d[1]?.substring(0, 5) ?? "00:00");
};

const logForm = reactive({
  plantId: "",
  activity: "watering",
  date: nowStr(),
  cost: "",
  notes: "",
});

const plantOptions = computed(() =>
  plants.value.map((p) => ({ label: `${p.name} (${p.plot})`, value: p.id })),
);
const activityOptions = [
  { label: t("care.activities.watering"), value: "watering" },
  { label: t("care.activities.fertilizing"), value: "fertilizing" },
  { label: t("care.activities.pruning"), value: "pruning" },
  { label: t("care.activities.pest_control"), value: "pest_control" },
  { label: t("care.activities.weeding"), value: "weeding" },
  { label: t("care.activities.mulching"), value: "mulching" },
];

const openLogModal = () => {
  Object.assign(logForm, {
    plantId: plantOptions.value[0]?.value ?? "",
    activity: "watering",
    date: nowStr(),
    cost: "",
    notes: "",
  });
  showLogModal.value = true;
};

const submitLog = async () => {
  if (!logForm.plantId || !logForm.activity) return;
  isLogging.value = true;
  try {
    const ok = await createCareLog({
      plantId: logForm.plantId,
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
      showLogModal.value = false;
    }
  } finally {
    isLogging.value = false;
  }
};

/* ─── quick harvest modal ───────────────────────────── */
const showHarvestModal = ref(false);
const isHarvesting = ref(false);
const harvestForm = reactive({
  plantId: "",
  quantity: "",
  unit: "kg",
  date: nowStr(),
  revenue: "",
  notes: "",
});

const unitOptions = [
  { label: t("common.kg"), value: "kg" },
  { label: t("common.pieces"), value: "pieces" },
  { label: t("common.g"), value: "g" },
  { label: t("common.bunch"), value: "bunch" },
];

const openHarvestModal = () => {
  Object.assign(harvestForm, {
    plantId: plantOptions.value[0]?.value ?? "",
    quantity: "",
    unit: "kg",
    date: nowStr(),
    revenue: "",
    notes: "",
  });
  showHarvestModal.value = true;
};

const submitHarvest = async () => {
  if (!harvestForm.plantId || !harvestForm.quantity) return;
  isHarvesting.value = true;
  try {
    const ok = await createHarvest({
      plantId: harvestForm.plantId,
      quantity: parseFloat(harvestForm.quantity),
      unit: harvestForm.unit,
      date: harvestForm.date,
      revenue: harvestForm.revenue
        ? parseFloat(harvestForm.revenue)
        : undefined,
      notes: harvestForm.notes || undefined,
    });
    if (ok) {
      toast.add({
        title: isOnline.value ? t("common.success") : t("common.saved_offline"),
        color: isOnline.value ? "green" : "yellow",
        icon: "i-lucide-check-circle",
      });
      showHarvestModal.value = false;
    }
  } finally {
    isHarvesting.value = false;
  }
};

onMounted(() => loadAll());

/* ─── formatting helpers ────────────────────────────── */
const formatDate = (dateStr: string) => {
  if (!dateStr) return "—";
  return new Intl.DateTimeFormat("lo-LA").format(new Date(dateStr));
};
const formatCurrency = (n: number) =>
  new Intl.NumberFormat("lo-LA", { style: "currency", currency: "LAK" }).format(
    n,
  );

const getPlantIcon = (category: string) =>
  ({
    vegetable: "lucide:carrot",
    fruit: "lucide:apple",
    herb: "lucide:leaf",
    flower: "lucide:flower",
    grain: "lucide:wheat",
  })[category as string] || "lucide:sprout";

const getStatusColor = (status: string) =>
  ({
    seedling: "yellow",
    growing: "blue",
    flowering: "purple",
    mature: "green",
    harvesting: "orange",
  })[status as string] || "gray";

const getTaskIcon = (type: string) =>
  ({
    watering: "lucide:droplets",
    fertilizing: "lucide:flask-conical",
    pruning: "lucide:scissors",
    harvest: "lucide:package",
    pest_control: "lucide:bug",
    weeding: "lucide:shovel",
    mulching: "lucide:layers",
  })[type as string] || "lucide:clipboard";

// SEO
useHead({
  title: computed(() => t("garden.title")),
  meta: [
    { name: "description", content: computed(() => t("garden.description")) },
  ],
});
</script>
