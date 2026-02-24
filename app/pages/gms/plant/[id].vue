<template>
  <div class="min-h-screen">
    <!-- Not found -->
    <div
      v-if="!isLoading && !plant"
      class="flex flex-col items-center justify-center py-24 text-center px-4"
    >
      <div
        class="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4"
      >
        <Icon name="lucide:leaf-off" class="h-10 w-10 text-gray-400" />
      </div>
      <p class="text-base font-medium text-gray-700 dark:text-gray-300 mb-1">
        {{ $t("plants.not_found") }}
      </p>
      <UButton :to="'/gms'" variant="outline" size="sm" class="mt-4">{{
        $t("common.back_to_dashboard")
      }}</UButton>
    </div>

    <template v-else-if="plant">
      <!-- Hero header -->
      <div class="bg-white dark:bg-gray-800">
        <div class="px-4 sm:px-6 lg:px-8 pt-4 pb-0">
          <!-- Back + badge row -->
          <div class="flex items-center justify-between mb-3">
            <UButton
              variant="ghost"
              icon="i-lucide-arrow-left"
              :to="'/gms'"
              size="sm"
              class="-ml-2"
            />
            <UBadge :color="getStatusColor(plant.status) as any" variant="soft">
              {{ $t(`plants.status.${plant.status}`) }}
            </UBadge>
          </div>

          <!-- Plant name & meta -->
          <div class="flex items-start gap-4 mb-4">
            <div
              class="w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center text-2xl"
              :class="getStatusBg(plant.status)"
            >
              <Icon
                :name="getStatusIcon(plant.status)"
                class="h-7 w-7"
                :class="getStatusIconColor(plant.status)"
              />
            </div>
            <div class="flex-1 min-w-0">
              <h1
                class="text-xl font-bold text-gray-900 dark:text-white truncate"
              >
                {{ plant.name }}
              </h1>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ plant.variety || $t(`plants.types.${plant.type}`) }} ·
                {{ plant.plot }}
              </p>
              <!-- Growth progress bar -->
              <div class="mt-2 flex items-center gap-2">
                <div
                  class="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
                >
                  <div
                    class="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-green-400 to-emerald-500"
                    :style="{ width: `${getStatusProgress(plant.status)}%` }"
                  />
                </div>
                <span class="text-xs text-gray-400 tabular-nums"
                  >{{ getStatusProgress(plant.status) }}%</span
                >
              </div>
            </div>
          </div>

          <!-- Status stepper (compact, horizontal) -->
          <div class="flex items-center justify-between mb-2 px-1">
            <template v-for="(step, i) in statusSteps" :key="step.value">
              <button
                class="flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg transition-all flex-1"
                :class="
                  plant.status === step.value
                    ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                    : statusPassed(step.value, plant.status)
                      ? 'text-green-500 dark:text-green-400 opacity-60'
                      : 'text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400'
                "
                :disabled="isUpdating"
                @click="updateStatus(step.value)"
              >
                <Icon :name="step.icon" size="24" />
                <span class="text-[10px] font-medium leading-none">{{
                  $t(`plants.status_short.${step.value}`)
                }}</span>
              </button>
              <div
                v-if="i < statusSteps.length - 1"
                class="w-4 h-px flex-shrink-0"
                :class="
                  statusPassed(statusSteps[i + 1].value, plant.status)
                    ? 'bg-green-400'
                    : 'bg-gray-200 dark:bg-gray-600'
                "
              />
            </template>
          </div>

          <!-- Tabs -->
          <UTabs v-model="activeTab" variant="link" :items="tabs" />
        </div>
      </div>

      <!-- Tab content -->
      <div class="px-4 sm:px-6 lg:px-8 py-5">
        <!-- Overview -->
        <div v-show="activeTab == 0">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Basic info -->
            <div
              class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
            >
              <div
                class="px-5 py-4 border-b border-gray-100 dark:border-gray-800"
              >
                <span
                  class="text-sm font-semibold text-gray-900 dark:text-white"
                  >{{ $t("plants.basic_info") }}</span
                >
              </div>
              <div class="px-5 py-4">
                <dl class="space-y-3">
                  <GmsInfoRow
                    :label="$t('plants.category')"
                    :value="$t(`plants.categories.${plant.category}`)"
                  />
                  <GmsInfoRow
                    :label="$t('plants.type')"
                    :value="$t(`plants.types.${plant.type}`)"
                  />
                  <GmsInfoRow
                    :label="$t('plants.variety')"
                    :value="plant.variety || '—'"
                  />
                  <GmsInfoRow
                    :label="$t('plants.quantity')"
                    :value="`${plant.quantity} ${plant.unit}`"
                  />
                  <GmsInfoRow
                    v-if="plant.seedSource"
                    :label="$t('plants.seed_source')"
                    :value="plant.seedSource"
                  />
                  <GmsInfoRow
                    v-if="plant.plantingCost"
                    :label="$t('plants.planting_cost')"
                    :value="formatCurrency(plant.plantingCost)"
                  />
                </dl>
              </div>
            </div>

            <!-- Location & dates -->
            <div
              class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
            >
              <div
                class="px-5 py-4 border-b border-gray-100 dark:border-gray-800"
              >
                <span
                  class="text-sm font-semibold text-gray-900 dark:text-white"
                  >{{ $t("plants.location_info") }}</span
                >
              </div>
              <div class="px-5 py-4">
                <dl class="space-y-3">
                  <GmsInfoRow
                    :label="$t('plants.plot')"
                    :value="plant.plot || '—'"
                  />
                  <GmsInfoRow
                    v-if="plant.row"
                    :label="$t('plants.row')"
                    :value="plant.row"
                  />
                  <GmsInfoRow
                    v-if="plant.position"
                    :label="$t('plants.position')"
                    :value="plant.position"
                  />
                  <GmsInfoRow
                    :label="$t('plants.planted_date')"
                    :value="
                      plant.plantedDate ? formatDate(plant.plantedDate) : '—'
                    "
                  />
                  <GmsInfoRow
                    :label="$t('plants.expected_harvest')"
                    :value="
                      plant.expectedHarvestDate
                        ? formatDate(plant.expectedHarvestDate)
                        : '—'
                    "
                  />
                </dl>
              </div>
            </div>
          </div>

          <!-- Status History Timeline -->
          <div
            v-if="plant.statusHistory && plant.statusHistory.length > 0"
            class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden mt-4"
          >
            <div
              class="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between"
            >
              <span class="text-sm font-semibold text-gray-900 dark:text-white">
                {{ $t("plants.status_history", "Status History") }}
                <!-- Add fallback for missing translatable key -->
              </span>
              <span class="text-xs text-gray-400">
                {{ plant.statusHistory.length }}
                {{ $t("common.updates", "updates") }}
              </span>
            </div>
            <div class="px-5 py-5 relative">
              <div
                class="absolute left-11 top-5 bottom-5 w-px bg-gray-200 dark:bg-gray-800"
              />
              <ul class="space-y-4">
                <li
                  v-for="(hist, idx) in plant.statusHistory"
                  :key="hist.eventId"
                  class="flex gap-4 relative items-center"
                >
                  <div
                    class="flex-shrink-0 z-10 w-12 h-12 rounded-full flex items-center justify-center"
                    :class="getStatusBg(hist.status)"
                  >
                    <Icon
                      :name="getStatusIcon(hist.status)"
                      class="h-5 w-5"
                      :class="getStatusIconColor(hist.status)"
                    />
                  </div>
                  <div
                    class="flex-1 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 px-5 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <div
                      class="flex flex-col sm:flex-row sm:items-center sm:justify-between py-1"
                    >
                      <p
                        class="text-[15px] font-semibold text-gray-900 dark:text-white capitalize"
                      >
                        {{ $t(`plants.status.${hist.status}`) }}
                      </p>
                      <span
                        class="text-xs font-medium text-gray-400 sm:text-right mt-1 sm:mt-0"
                      >
                        {{ formatDate(hist.date) }}
                        {{
                          new Date(hist.date).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        }}
                      </span>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <!-- Notes -->
          <div
            v-if="plant.notes"
            class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden mt-4"
          >
            <div
              class="px-5 py-4 border-b border-gray-100 dark:border-gray-800"
            >
              <span
                class="text-sm font-semibold text-gray-900 dark:text-white"
                >{{ $t("plants.notes") }}</span
              >
            </div>
            <div class="px-5 py-4">
              <p
                class="text-[15px] text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed"
              >
                {{ plant.notes }}
              </p>
            </div>
          </div>
        </div>

        <!-- Care tab -->
        <div v-show="activeTab == 1">
          <GmsCareTab :plant-id="plantId" />
        </div>

        <!-- Harvest tab -->
        <div v-show="activeTab == 2">
          <GmsHarvestTab :plant-id="plantId" />
        </div>
      </div>
    </template>

    <!-- Skeleton loader -->
    <div v-if="isLoading" class="px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      <div
        class="h-20 rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse"
      />
      <div class="grid grid-cols-2 gap-4">
        <div
          class="h-40 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse"
        />
        <div
          class="h-40 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/* ─── resolved deps ─────────────────────────────────── */
const route = useRoute();
const { t } = useI18n();
const toast = useToast();
const plantId = computed(() => route.params.id as string);
const { plants, isLoading, loadAll, updatePlantStatus } = useNostrGms();
onMounted(() => loadAll());

/* ─── data ──────────────────────────────────────────── */
const plant = computed(
  () => plants.value.find((p) => p.id === plantId.value) ?? null,
);
const activeTab = ref("0");

const tabs = computed(() => [
  { label: t("plants.tab_overview"), slot: "overview" },
  { label: t("care.title"), slot: "care" },
  { label: t("harvest.title"), slot: "harvest" },
]);

/* ─── status helpers ────────────────────────────────── */
const statusSteps = [
  { value: "seedling", icon: "lucide:sprout" },
  { value: "growing", icon: "lucide:trending-up" },
  { value: "flowering", icon: "lucide:flower-2" },
  { value: "mature", icon: "lucide:leaf" },
  { value: "harvesting", icon: "lucide:archive" },
];
const statusOrder = statusSteps.map((s) => s.value);
const statusPassed = (step: string, current: string) =>
  statusOrder.indexOf(step) < statusOrder.indexOf(current);
const getStatusProgress = (s: string) =>
  Math.round(((statusOrder.indexOf(s) + 1) / statusOrder.length) * 100);

const getStatusColor = (s: string) =>
  ({
    seedling: "blue",
    growing: "green",
    flowering: "purple",
    mature: "emerald",
    harvesting: "orange",
  })[s] || "gray";
const getStatusBg = (s: string) =>
  ({
    seedling: "bg-blue-50 dark:bg-blue-900/20",
    growing: "bg-green-50 dark:bg-green-900/20",
    flowering: "bg-purple-50 dark:bg-purple-900/20",
    mature: "bg-emerald-50 dark:bg-emerald-900/20",
    harvesting: "bg-orange-50 dark:bg-orange-900/20",
  })[s] || "bg-gray-100 dark:bg-gray-700";
const getStatusIconColor = (s: string) =>
  ({
    seedling: "text-blue-500",
    growing: "text-green-500",
    flowering: "text-purple-500",
    mature: "text-emerald-500",
    harvesting: "text-orange-500",
  })[s] || "text-gray-400";
const getStatusIcon = (s: string) =>
  ({
    seedling: "lucide:sprout",
    growing: "lucide:trending-up",
    flowering: "lucide:flower-2",
    mature: "lucide:leaf",
    harvesting: "lucide:archive",
  })[s] || "lucide:leaf";

const formatDate = (d: string) => new Date(d).toLocaleDateString();
const formatCurrency = (n: number) =>
  new Intl.NumberFormat("lo-LA", { style: "currency", currency: "LAK" }).format(
    n,
  );

/* ─── status update ─────────────────────────────────── */
const isUpdating = ref(false);
const updateStatus = async (newStatus: string) => {
  if (!plant.value || plant.value.status === newStatus) return;
  isUpdating.value = true;
  try {
    await updatePlantStatus(plantId.value, newStatus);
    toast.add({
      title: t("common.success"),
      description: t(`plants.status.${newStatus}`),
      color: "green",
      icon: "i-lucide-check-circle",
    });
  } catch {
    toast.add({
      title: t("common.error"),
      color: "red",
      icon: "i-lucide-alert-circle",
    });
  } finally {
    isUpdating.value = false;
  }
};

useHead({ title: computed(() => plant.value?.name ?? t("plants.title")) });
</script>
