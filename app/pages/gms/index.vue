<template>
  <div class="min-h-screen">
    <!-- Offline Banner -->
    <div
      v-if="!isOnline"
      class="bg-yellow-500 text-white text-sm text-center py-1 px-4 flex items-center justify-center gap-2"
    >
      <Icon name="lucide:wifi-off" class="h-4 w-4" />
      {{ $t("common.offline_mode") }} —
      {{ $t("common.changes_queued", { count: offlineQueueCount }) }}
    </div>

    <!-- Header -->
    <div class="">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-6">
          <div class="flex items-center">
            <Icon
              name="lucide:leaf"
              class="h-8 w-8 text-green-600 dark:text-green-400 mr-3"
            />
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
              {{ $t("garden.title") }}
            </h1>
          </div>
          <div class="flex items-center space-x-4">
            <UButton
              :to="'/gms/register'"
              icon="i-lucide-plus"
              color="primary"
              variant="solid"
              class="hidden sm:flex"
            >
              {{ $t("plants.register_new") }}
            </UButton>
            <UButton
              :to="'/gms/register'"
              icon="i-lucide-plus"
              color="primary"
              variant="solid"
              class="sm:hidden"
              square
            />
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Loading skeleton -->
      <div v-if="isLoading" class="flex justify-center items-center py-20">
        <Icon
          name="lucide:loader-circle"
          class="h-10 w-10 animate-spin text-green-500"
        />
      </div>

      <template v-else>
        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <UCard>
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <Icon
                  name="lucide:trees"
                  class="h-8 w-8 text-green-600 dark:text-green-400"
                />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt
                    class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate"
                  >
                    {{ $t("dashboard.total_plants") }}
                  </dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">
                    {{ totalPlants }}
                  </dd>
                </dl>
              </div>
            </div>
          </UCard>

          <UCard>
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <Icon
                  name="lucide:activity"
                  class="h-8 w-8 text-blue-600 dark:text-blue-400"
                />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt
                    class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate"
                  >
                    {{ $t("dashboard.active_plots") }}
                  </dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">
                    {{ activePlots }}
                  </dd>
                </dl>
              </div>
            </div>
          </UCard>

          <UCard>
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <Icon
                  name="lucide:calendar-check"
                  class="h-8 w-8 text-yellow-600 dark:text-yellow-400"
                />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt
                    class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate"
                  >
                    {{ $t("dashboard.pending_care") }}
                  </dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">
                    {{ pendingCare }}
                  </dd>
                </dl>
              </div>
            </div>
          </UCard>

          <UCard>
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <Icon
                  name="lucide:trending-up"
                  class="h-8 w-8 text-purple-600 dark:text-purple-400"
                />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt
                    class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate"
                  >
                    {{ $t("dashboard.total_harvests") }}
                  </dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">
                    {{ harvests.length }}
                  </dd>
                </dl>
              </div>
            </div>
          </UCard>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Recent Plants -->
          <div class="lg:col-span-2">
            <UCard
              :ui="{
                body: 'p-0 sm:p-0',
              }"
            >
              <template #header>
                <div class="flex justify-between items-center">
                  <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                    {{ $t("dashboard.recent_plants") }}
                  </h3>
                  <UButton
                    :to="'/gms/register'"
                    variant="ghost"
                    color="primary"
                    size="sm"
                  >
                    {{ $t("common.view_all") }}
                  </UButton>
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
                  :to="'/gms/register'"
                  size="sm"
                  class="mt-3"
                  variant="soft"
                  color="green"
                >
                  {{ $t("plants.register_new") }}
                </UButton>
              </div>

              <div v-else class="overflow-x-auto">
                <table
                  class="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
                >
                  <thead class="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th
                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        {{ $t("plants.name") }}
                      </th>
                      <th
                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        {{ $t("plants.plot") }}
                      </th>
                      <th
                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        {{ $t("plants.planted_date") }}
                      </th>
                      <th
                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        {{ $t("common.status") }}
                      </th>
                      <th
                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        {{ $t("common.action") }}
                      </th>
                    </tr>
                  </thead>
                  <tbody
                    class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700"
                  >
                    <tr
                      v-for="plant in recentPlants"
                      :key="plant.id"
                      class="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                      @click="$router.push('/gms/plant/' + plant.id)"
                    >
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                          <Icon
                            :name="getPlantIcon(plant.category)"
                            class="h-5 w-5 text-green-600 dark:text-green-400 mr-2"
                          />
                          <span
                            class="text-sm font-medium text-gray-900 dark:text-white"
                            >{{ plant.name }}</span
                          >
                        </div>
                      </td>
                      <td
                        class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"
                      >
                        {{ plant.plot }}
                      </td>
                      <td
                        class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"
                      >
                        {{ formatDate(plant.plantedDate) }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <UBadge
                          :color="getStatusColor(plant.status) as any"
                          variant="soft"
                        >
                          {{ $t(`plants.status.${plant.status}`) }}
                        </UBadge>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-right">
                        <Icon
                          name="lucide:chevron-right"
                          class="h-4 w-4 text-gray-400"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </UCard>
          </div>

          <!-- Right column -->
          <div class="space-y-6">
            <!-- Quick Actions -->
            <UCard>
              <template #header>
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                  {{ $t("dashboard.quick_actions") }}
                </h3>
              </template>

              <div class="space-y-3">
                <UButton
                  :to="'/gms/register'"
                  block
                  icon="i-lucide-plus"
                  color="primary"
                  variant="outline"
                >
                  {{ $t("plants.register_new") }}
                </UButton>

                <UButton
                  :to="'/gms/register'"
                  block
                  icon="i-lucide-droplets"
                  color="blue"
                  variant="outline"
                >
                  {{ $t("care.log_activity") }}
                </UButton>

                <UButton
                  :to="'/gms/register'"
                  block
                  icon="i-lucide-scissors"
                  color="green"
                  variant="outline"
                >
                  {{ $t("harvest.record") }}
                </UButton>
              </div>
            </UCard>

            <!-- Pending Care Schedules -->
            <UCard>
              <template #header>
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                  {{ $t("dashboard.pending_tasks") }}
                </h3>
              </template>

              <div class="space-y-3">
                <div
                  v-if="!overdueSchedules.length"
                  class="py-6 text-center text-gray-400 flex flex-col items-center justify-center dark:text-gray-500 text-sm"
                >
                  <Icon
                    name="lucide:check-circle"
                    class="mx-auto mb-2 opacity-40"
                    size="32"
                  />
                  {{ $t("care.all_done") }}
                </div>

                <div
                  v-for="schedule in overdueSchedules"
                  :key="schedule.id"
                  class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div class="flex items-center">
                    <Icon
                      :name="getTaskIcon(schedule.activity)"
                      class="h-4 w-4 text-gray-600 dark:text-gray-400 mr-2"
                    />
                    <div>
                      <p
                        class="text-sm font-medium text-gray-900 dark:text-white"
                      >
                        {{ $t(`care.activities.${schedule.activity}`) }}
                      </p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">
                        {{ schedule.plantName }} — {{ schedule.plot }}
                      </p>
                    </div>
                  </div>
                  <UBadge color="red" variant="soft" size="xs">
                    {{ $t("care.overdue") }}
                  </UBadge>
                </div>
              </div>
            </UCard>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";

const { t } = useI18n();

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
} = useNostrGms();

const offlineQueueCount = computed(() => getOfflineQueue().length);

const recentPlants = computed(() => plants.value.slice(0, 5));

const overdueSchedules = computed(() => {
  const now = new Date();
  return schedules.value
    .filter((s) => s.isActive && new Date(s.nextDue) <= now)
    .slice(0, 3);
});

onMounted(() => loadAll());

const formatDate = (dateStr: string) => {
  if (!dateStr) return "—";
  return new Intl.DateTimeFormat("lo-LA").format(new Date(dateStr));
};

const getPlantIcon = (category: string) => {
  const icons: Record<string, string> = {
    vegetable: "lucide:carrot",
    fruit: "lucide:apple",
    herb: "lucide:leaf",
    flower: "lucide:flower",
    grain: "lucide:wheat",
  };
  return icons[category] || "lucide:sprout";
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    seedling: "yellow",
    growing: "blue",
    flowering: "purple",
    mature: "green",
    harvesting: "orange",
  };
  return colors[status] || "gray";
};

const getTaskIcon = (type: string) => {
  const icons: Record<string, string> = {
    watering: "lucide:droplets",
    fertilizing: "lucide:flask-conical",
    pruning: "lucide:scissors",
    harvest: "lucide:package",
    pest_control: "lucide:bug",
    weeding: "lucide:shovel",
  };
  return icons[type] || "lucide:clipboard";
};

// SEO
useHead({
  title: computed(() => t("garden.title")),
  meta: [
    { name: "description", content: computed(() => t("garden.description")) },
  ],
});
</script>
