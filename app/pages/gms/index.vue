<template>
  <div class="min-h-screen ">
    <!-- Header -->
    <div class="">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-6">
          <div class="flex items-center">
            <Icon name="lucide:leaf" class="h-8 w-8 text-green-600 dark:text-green-400 mr-3" />
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">{{ $t('garden.title') }}</h1>
          </div>
          <div class="flex items-center space-x-4">
            <UButton 
              :to="'/gms/register'"
              icon="i-lucide-plus"
              color="primary"
              variant="solid"
              class="hidden sm:flex"
            >
              {{ $t('plants.register_new') }}
            </UButton>
            <UButton
              :to="'/plants/register'"
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
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <UCard>
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <Icon name="lucide:trees" class="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{{ $t('dashboard.total_plants') }}</dt>
                <dd class="text-lg font-medium text-gray-900 dark:text-white">{{ totalPlants }}</dd>
              </dl>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <Icon name="lucide:activity" class="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{{ $t('dashboard.active_plots') }}</dt>
                <dd class="text-lg font-medium text-gray-900 dark:text-white">{{ activePlots }}</dd>
              </dl>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <Icon name="lucide:calendar-check" class="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{{ $t('dashboard.pending_care') }}</dt>
                <dd class="text-lg font-medium text-gray-900 dark:text-white">{{ pendingCare }}</dd>
              </dl>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <Icon name="lucide:trending-up" class="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{{ $t('dashboard.monthly_revenue') }}</dt>
                <dd class="text-lg font-medium text-gray-900 dark:text-white">{{ formatCurrency(monthlyRevenue) }}</dd>
              </dl>
            </div>
          </div>
        </UCard>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Recent Plants -->
        <div class="lg:col-span-2">
          <UCard>
            <template #header>
              <div class="flex justify-between items-center">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">{{ $t('dashboard.recent_plants') }}</h3>
                <UButton 
                  :to="'/plants'"
                  variant="ghost"
                  color="primary"
                  size="sm"
                >
                  {{ $t('common.view_all') }}
                </UButton>
              </div>
            </template>

            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead class="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {{ $t('plants.name') }}
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {{ $t('plants.plot') }}
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {{ $t('plants.planted_date') }}
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {{ $t('common.status') }}
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  <tr v-for="plant in recentPlants" :key="plant.id">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <Icon :name="getPlantIcon(plant.type)" class="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                        <span class="text-sm font-medium text-gray-900 dark:text-white">{{ plant.name }}</span>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {{ plant.plot }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {{ formatDate(plant.plantedDate) }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <UBadge 
                        :color="getStatusColor(plant.status)"
                        variant="soft"
                      >
                        {{ $t(`plants.status.${plant.status}`) }}
                      </UBadge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </UCard>
        </div>

        <!-- Quick Actions & Tasks -->
        <div class="space-y-6">
          <!-- Quick Actions -->
          <UCard>
            <template #header>
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">{{ $t('dashboard.quick_actions') }}</h3>
            </template>

            <div class="space-y-3">
              <UButton 
                :to="'/plants/register'"
                block
                icon="i-lucide-plus"
                color="primary"
                variant="outline"
              >
                {{ $t('plants.register_new') }}
              </UButton>
              
              <UButton 
                :to="'/care/new'"
                block
                icon="i-lucide-droplets"
                color="blue"
                variant="outline"
              >
                {{ $t('care.log_activity') }}
              </UButton>
              
              <UButton 
                :to="'/harvest/new'"
                block
                icon="i-lucide-scissors"
                color="green"
                variant="outline"
              >
                {{ $t('harvest.record') }}
              </UButton>
              
              <UButton 
                :to="'/sales/new'"
                block
                icon="i-lucide-shopping-cart"
                color="purple"
                variant="outline"
              >
                {{ $t('sales.record') }}
              </UButton>
            </div>
          </UCard>

          <!-- Pending Tasks -->
          <UCard>
            <template #header>
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">{{ $t('dashboard.pending_tasks') }}</h3>
            </template>

            <div class="space-y-3">
              <div v-for="task in pendingTasks" :key="task.id" class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div class="flex items-center">
                  <Icon :name="getTaskIcon(task.type)" class="h-4 w-4 text-gray-600 dark:text-gray-400 mr-2" />
                  <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">{{ task.title }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">{{ task.plant }}</p>
                  </div>
                </div>
                <UBadge 
                  :color="getPriorityColor(task.priority)"
                  variant="soft"
                  size="xs"
                >
                  {{ $t(`common.priority.${task.priority}`) }}
                </UBadge>
              </div>

              <UButton 
                :to="'/tasks'"
                block
                variant="ghost"
                color="primary"
                size="sm"
              >
                {{ $t('common.view_all') }}
              </UButton>
            </div>
          </UCard>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const { t } = useI18n()

// Mock data - replace with real data from API/Pinia
const totalPlants = ref(156)
const activePlots = ref(12)
const pendingCare = ref(8)
const monthlyRevenue = ref(2450000)

const recentPlants = ref([
  {
    id: 1,
    name: t('plants.examples.tomato'),
    type: 'vegetable',
    plot: 'A-01',
    plantedDate: new Date('2024-07-15'),
    status: 'growing'
  },
  {
    id: 2,
    name: t('plants.examples.mango'),
    type: 'fruit',
    plot: 'B-03',
    plantedDate: new Date('2024-07-10'),
    status: 'flowering'
  },
  {
    id: 3,
    name: t('plants.examples.lettuce'),
    type: 'vegetable',
    plot: 'A-05',
    plantedDate: new Date('2024-07-20'),
    status: 'seedling'
  },
  {
    id: 4,
    name: t('plants.examples.papaya'),
    type: 'fruit',
    plot: 'C-02',
    plantedDate: new Date('2024-07-05'),
    status: 'mature'
  }
])

const pendingTasks = ref([
  {
    id: 1,
    title: t('care.tasks.watering'),
    plant: t('plants.examples.tomato'),
    type: 'water',
    priority: 'high'
  },
  {
    id: 2,
    title: t('care.tasks.fertilizing'),
    plant: t('plants.examples.mango'),
    type: 'fertilizer',
    priority: 'medium'
  },
  {
    id: 3,
    title: t('care.tasks.pruning'),
    plant: t('plants.examples.lettuce'),
    type: 'prune',
    priority: 'low'
  }
])

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('lo-LA', {
    style: 'currency',
    currency: 'LAK'
  }).format(amount)
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('lo-LA').format(date)
}

const getPlantIcon = (type: string) => {
  const icons = {
    vegetable: 'lucide:carrot',
    fruit: 'lucide:apple',
    herb: 'lucide:leaf',
    flower: 'lucide:flower'
  }
  return icons[type as keyof typeof icons] || 'lucide:seedling'
}

const getStatusColor = (status: string) => {
  const colors = {
    seedling: 'yellow',
    growing: 'blue',
    flowering: 'purple',
    mature: 'green',
    harvesting: 'orange'
  }
  return colors[status as keyof typeof colors] || 'gray'
}

const getTaskIcon = (type: string) => {
  const icons = {
    water: 'lucide:droplets',
    fertilizer: 'lucide:flask',
    prune: 'lucide:scissors',
    harvest: 'lucide:package'
  }
  return icons[type as keyof typeof icons] || 'lucide:clipboard'
}

const getPriorityColor = (priority: string) => {
  const colors = {
    high: 'red',
    medium: 'yellow',
    low: 'green'
  }
  return colors[priority as keyof typeof colors] || 'gray'
}

// SEO
useHead({
  title: computed(() => t('garden.title')),
  meta: [
    { name: 'description', content: computed(() => t('garden.description')) }
  ]
})
</script>