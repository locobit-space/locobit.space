<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-6">
          <div class="flex items-center">
            <UButton
              :to="'/dashboard'"
              icon="i-lucide-arrow-left"
              variant="ghost"
              color="primary"
              class="mr-4"
            />
            <div class="flex items-center">
              <NuxtIcon name="lucide:droplets" class="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ $t('care.title') }}</h1>
            </div>
          </div>
          <UButton
            @click="showLogModal = true"
            icon="i-lucide-plus"
            color="primary"
          >
            {{ $t('care.log_activity') }}
          </UButton>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Tabs -->
      <UTabs 
        v-model="activeTab" 
        :items="tabItems"
        class="mb-6"
      />

      <!-- Overview Tab -->
      <div v-if="activeTab === 0">
        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <UCard>
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <NuxtIcon name="lucide:calendar-check" class="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{{ $t('care.stats.completed_today') }}</dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">{{ todayCompleted }}</dd>
                </dl>
              </div>
            </div>
          </UCard>

          <UCard>
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <NuxtIcon name="lucide:clock" class="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{{ $t('care.stats.pending_today') }}</dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">{{ todayPending }}</dd>
                </dl>
              </div>
            </div>
          </UCard>

          <UCard>
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <NuxtIcon name="lucide:trending-up" class="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{{ $t('care.stats.week_activities') }}</dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">{{ weekActivities }}</dd>
                </dl>
              </div>
            </div>
          </UCard>

          <UCard>
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <NuxtIcon name="lucide:dollar-sign" class="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{{ $t('care.stats.week_costs') }}</dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">{{ formatCurrency(weekCosts) }}</dd>
                </dl>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Today's Tasks -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <UCard>
            <template #header>
              <div class="flex justify-between items-center">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">{{ $t('care.todays_tasks') }}</h3>
                <UBadge :color="todayPending > 0 ? 'red' : 'green'" variant="soft">
                  {{ todayPending }} {{ $t('care.pending') }}
                </UBadge>
              </div>
            </template>

            <div class="space-y-4">
              <div v-for="task in todaysTasks" :key="task.id" class="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div class="flex items-center space-x-3">
                  <UCheckbox 
                    :model-value="task.completed"
                    @update:model-value="toggleTask(task.id)"
                  />
                  <div>
                    <div class="flex items-center space-x-2">
                      <NuxtIcon :name="getCareIcon(task.type)" class="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      <span class="font-medium text-gray-900 dark:text-white" :class="{ 'line-through opacity-50': task.completed }">
                        {{ $t(`care.activities.${task.type}`) }}
                      </span>
                    </div>
                    <p class="text-sm text-gray-500 dark:text-gray-400">{{ task.plantName }} - {{ task.plot }}</p>
                  </div>
                </div>
                <div class="flex items-center space-x-2">
                  <UBadge :color="getPriorityColor(task.priority)" variant="soft" size="xs">
                    {{ $t(`common.priority.${task.priority}`) }}
                  </UBadge>
                  <span class="text-xs text-gray-500 dark:text-gray-400">{{ task.time }}</span>
                </div>
              </div>
            </div>
          </UCard>

          <!-- Upcoming Schedule -->
          <UCard>
            <template #header>
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">{{ $t('care.upcoming_schedule') }}</h3>
            </template>

            <div class="space-y-4">
              <div v-for="schedule in upcomingSchedule" :key="schedule.id" class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center space-x-2">
                    <NuxtIcon :name="getCareIcon(schedule.type)" class="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    <span class="font-medium text-gray-900 dark:text-white">{{ $t(`care.activities.${schedule.type}`) }}</span>
                  </div>
                  <span class="text-sm text-gray-500 dark:text-gray-400">{{ formatDate(schedule.dueDate) }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-600 dark:text-gray-300">{{ schedule.plantName }} - {{ schedule.plot }}</span>
                  <UButton
                    @click="scheduleNow(schedule)"
                    size="xs"
                    variant="ghost"
                    color="primary"
                  >
                    {{ $t('care.schedule_now') }}
                  </UButton>
                </div>
              </div>
            </div>
          </UCard>
        </div>
      </div>

      <!-- Activity Log Tab -->
      <div v-if="activeTab === 1">
        <!-- Filters -->
        <UCard class="mb-6">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <UFormGroup :label="$t('care.filter_by_plant')">
              <USelect 
                v-model="filters.plant"
                :options="plantOptions"
                :placeholder="$t('care.all_plants')"
              />
            </UFormGroup>

            <UFormGroup :label="$t('care.filter_by_activity')">
              <USelect 
                v-model="filters.activity"
                :options="activityOptions"
                :placeholder="$t('care.all_activities')"
              />
            </UFormGroup>

            <UFormGroup :label="$t('care.date_from')">
              <UInput 
                v-model="filters.dateFrom"
                type="date"
              />
            </UFormGroup>

            <UFormGroup :label="$t('care.date_to')">
              <UInput 
                v-model="filters.dateTo"
                type="date"
              />
            </UFormGroup>
          </div>
        </UCard>

        <!-- Activity Log Table -->
        <UCard>
          <template #header>
            <div class="flex justify-between items-center">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">{{ $t('care.activity_log') }}</h3>
              <div class="flex items-center space-x-2">
                <UButton
                  @click="exportLog"
                  icon="i-lucide-download"
                  variant="outline"
                  size="sm"
                >
                  {{ $t('common.export') }}
                </UButton>
                <UButton
                  @click="showLogModal = true"
                  icon="i-lucide-plus"
                  size="sm"
                >
                  {{ $t('care.log_activity') }}
                </UButton>
              </div>
            </div>
          </template>

          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {{ $t('common.date') }}
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {{ $t('care.activity') }}
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {{ $t('plants.name') }}
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {{ $t('plants.plot') }}
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {{ $t('care.cost') }}
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {{ $t('common.notes') }}
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {{ $t('common.action') }}
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-for="log in filteredActivityLogs" :key="log.id">
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {{ formatDateTime(log.date) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <NuxtIcon :name="getCareIcon(log.activity)" class="h-4 w-4 mr-2" :class="getCareIconColor(log.activity)" />
                      <span class="text-sm font-medium text-gray-900 dark:text-white">
                        {{ $t(`care.activities.${log.activity}`) }}
                      </span>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {{ log.plantName }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {{ log.plot }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {{ log.cost ? formatCurrency(log.cost) : '-' }}
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                    {{ log.notes || '-' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <UButton
                      @click="editLog(log)"
                      icon="i-lucide-edit"
                      size="xs"
                      variant="ghost"
                      color="primary"
                    />
                    <UButton
                      @click="deleteLog(log.id)"
                      icon="i-lucide-trash"
                      size="xs"
                      variant="ghost"
                      color="red"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </UCard>
      </div>

      <!-- Schedule Tab -->
      <div v-if="activeTab === 2">
        <UCard>
          <template #header>
            <div class="flex justify-between items-center">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">{{ $t('care.care_schedule') }}</h3>
              <UButton
                @click="showScheduleModal = true"
                icon="i-lucide-plus"
              >
                {{ $t('care.add_schedule') }}
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
                    {{ $t('care.activity') }}
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {{ $t('care.frequency') }}
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {{ $t('care.next_due') }}
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {{ $t('common.status') }}
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {{ $t('common.action') }}
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-for="schedule in careSchedules" :key="schedule.id">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div class="text-sm font-medium text-gray-900 dark:text-white">{{ schedule.plantName }}</div>
                      <div class="text-sm text-gray-500 dark:text-gray-400">{{ schedule.plot }}</div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <NuxtIcon :name="getCareIcon(schedule.activity)" class="h-4 w-4 mr-2" :class="getCareIconColor(schedule.activity)" />
                      <span class="text-sm text-gray-900 dark:text-white">
                        {{ $t(`care.activities.${schedule.activity}`) }}
                      </span>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {{ $t(`care.frequencies.${schedule.frequency}`) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {{ formatDate(schedule.nextDue) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <UBadge 
                      :color="getScheduleStatusColor(schedule.nextDue)"
                      variant="soft"
                    >
                      {{ getScheduleStatus(schedule.nextDue) }}
                    </UBadge>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <UButton
                      @click="markScheduleComplete(schedule)"
                      icon="i-lucide-check"
                      size="xs"
                      variant="ghost"
                      color="green"
                    />
                    <UButton
                      @click="editSchedule(schedule)"
                      icon="i-lucide-edit"
                      size="xs"
                      variant="ghost"
                      color="primary"
                    />
                    <UButton
                      @click="deleteSchedule(schedule.id)"
                      icon="i-lucide-trash"
                      size="xs"
                      variant="ghost"
                      color="red"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </UCard>
      </div>
    </div>

    <!-- Log Activity Modal -->
    <UModal v-model="showLogModal">
      <UCard>
        <template #header>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">{{ $t('care.log_activity') }}</h3>
        </template>

        <UForm
          :schema="logSchema"
          :state="logForm"
          class="space-y-4"
          @submit="submitLog"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormGroup :label="$t('plants.name')" name="plantId" required>
              <USelect 
                v-model="logForm.plantId"
                :items="plantOptions"
                :placeholder="$t('plants.select_plant')"
              />
            </UFormGroup>

            <UFormGroup :label="$t('care.activity')" name="activity" required>
              <USelect 
                v-model="logForm.activity"
                :items="activityOptions"
                :placeholder="$t('care.select_activity')"
              />
            </UFormGroup>

            <UFormGroup :label="$t('common.date')" name="date" required>
              <UInput 
                v-model="logForm.date"
                type="datetime-local"
              />
            </UFormGroup>

            <UFormGroup :label="$t('care.cost')" name="cost">
              <UInput 
                v-model="logForm.cost"
                type="number"
                step="0.01"
                placeholder="0.00"
              >
                <template #trailing>
                  <span class="text-gray-400 dark:text-gray-500 text-xs">LAK</span>
                </template>
              </UInput>
            </UFormGroup>
          </div>

          <UFormGroup :label="$t('common.notes')" name="notes">
            <UTextarea 
              v-model="logForm.notes"
              :placeholder="$t('care.notes_placeholder')"
              :rows="3"
            />
          </UFormGroup>

          <div class="flex justify-end space-x-3 pt-4">
            <UButton
              @click="showLogModal = false"
              variant="ghost"
              color="gray"
            >
              {{ $t('common.cancel') }}
            </UButton>
            
            <UButton
              type="submit"
              icon="i-lucide-save"
              :loading="isSubmitting"
            >
              {{ $t('care.log_activity') }}
            </UButton>
          </div>
        </UForm>
      </UCard>
    </UModal>

    <!-- Schedule Modal -->
    <UModal v-model="showScheduleModal">
      <UCard>
        <template #header>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">{{ $t('care.add_schedule') }}</h3>
        </template>

        <UForm
          :schema="scheduleSchema"
          :state="scheduleForm"
          class="space-y-4"
          @submit="submitSchedule"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormGroup :label="$t('plants.name')" name="plantId" required>
              <USelect 
                v-model="scheduleForm.plantId"
                :items="plantOptions"
                :placeholder="$t('plants.select_plant')"
              />
            </UFormGroup>

            <UFormGroup :label="$t('care.activity')" name="activity" required>
              <USelect 
                v-model="scheduleForm.activity"
                :items="activityOptions"
                :placeholder="$t('care.select_activity')"
              />
            </UFormGroup>

            <UFormGroup :label="$t('care.frequency')" name="frequency" required>
              <USelect 
                v-model="scheduleForm.frequency"
                :options="frequencyOptions"
                :placeholder="$t('care.select_frequency')"
              />
            </UFormGroup>

            <UFormGroup :label="$t('care.start_date')" name="startDate" required>
              <UInput 
                v-model="scheduleForm.startDate"
                type="date"
              />
            </UFormGroup>
          </div>

          <UFormGroup :label="$t('common.notes')" name="notes">
            <UTextarea 
              v-model="scheduleForm.notes"
              :placeholder="$t('care.schedule_notes_placeholder')"
              :rows="2"
            />
          </UFormGroup>

          <div class="flex justify-end space-x-3 pt-4">
            <UButton
              @click="showScheduleModal = false"
              variant="ghost"
              color="gray"
            >
              {{ $t('common.cancel') }}
            </UButton>
            
            <UButton
              type="submit"
              icon="i-lucide-save"
              :loading="isSubmitting"
            >
              {{ $t('care.add_schedule') }}
            </UButton>
          </div>
        </UForm>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { z } from 'zod'

const { t } = useI18n()

// Reactive data
const activeTab = ref(0)
const showLogModal = ref(false)
const showScheduleModal = ref(false)
const isSubmitting = ref(false)

// Stats
const todayCompleted = ref(12)
const todayPending = ref(8)
const weekActivities = ref(45)
const weekCosts = ref(890000)

// Tab configuration
const tabItems = computed(() => [
  { label: t('care.overview'), icon: 'i-lucide-activity' },
  { label: t('care.activity_log'), icon: 'i-lucide-clipboard-list' },
  { label: t('care.schedule'), icon: 'i-lucide-calendar' }
])

// Form schemas
const logSchema = z.object({
  plantId: z.string().min(1, t('validation.required')),
  activity: z.string().min(1, t('validation.required')),
  date: z.string().min(1, t('validation.required')),
  cost: z.number().optional(),
  notes: z.string().optional()
})

const scheduleSchema = z.object({
  plantId: z.string().min(1, t('validation.required')),
  activity: z.string().min(1, t('validation.required')),
  frequency: z.string().min(1, t('validation.required')),
  startDate: z.string().min(1, t('validation.required')),
  notes: z.string().optional()
})

// Form states
const logForm = ref({
  plantId: '',
  activity: '',
  date: new Date().toISOString().slice(0, 16),
  cost: 0,
  notes: ''
})

const scheduleForm = ref({
  plantId: '',
  activity: '',
  frequency: '',
  startDate: new Date().toISOString().split('T')[0],
  notes: ''
})

// Filters
const filters = ref({
  plant: '',
  activity: '',
  dateFrom: '',
  dateTo: ''
})

// Options for selects
const plantOptions = computed(() => [
  { label: t('plants.examples.tomato') + ' - A-01', value: '1' },
  { label: t('plants.examples.mango') + ' - B-03', value: '2' },
  { label: t('plants.examples.lettuce') + ' - A-05', value: '3' },
  { label: t('plants.examples.papaya') + ' - C-02', value: '4' }
])

const activityOptions = computed(() => [
  { label: t('care.activities.watering'), value: 'watering' },
  { label: t('care.activities.fertilizing'), value: 'fertilizing' },
  { label: t('care.activities.pruning'), value: 'pruning' },
  { label: t('care.activities.pest_control'), value: 'pest_control' },
  { label: t('care.activities.weeding'), value: 'weeding' },
  { label: t('care.activities.mulching'), value: 'mulching' }
])

const frequencyOptions = computed(() => [
  { label: t('care.frequencies.daily'), value: 'daily' },
  { label: t('care.frequencies.weekly'), value: 'weekly' },
  { label: t('care.frequencies.biweekly'), value: 'biweekly' },
  { label: t('care.frequencies.monthly'), value: 'monthly' }
])

// Mock data
const todaysTasks = ref([
  {
    id: 1,
    type: 'watering',
    plantName: t('plants.examples.tomato'),
    plot: 'A-01',
    priority: 'high',
    time: '06:00',
    completed: false
  },
  {
    id: 2,
    type: 'fertilizing',
    plantName: t('plants.examples.mango'),
    plot: 'B-03',
    priority: 'medium',
    time: '08:00',
    completed: true
  },
  {
    id: 3,
    type: 'pruning',
    plantName: t('plants.examples.lettuce'),
    plot: 'A-05',
    priority: 'low',
    time: '10:00',
    completed: false
  }
])

const upcomingSchedule = ref([
  {
    id: 1,
    type: 'watering',
    plantName: t('plants.examples.papaya'),
    plot: 'C-02',
    dueDate: new Date(Date.now() + 86400000) // Tomorrow
  },
  {
    id: 2,
    type: 'fertilizing',
    plantName: t('plants.examples.tomato'),
    plot: 'A-01',
    dueDate: new Date(Date.now() + 172800000) // Day after tomorrow
  }
])

const activityLogs = ref([
  {
    id: 1,
    date: new Date('2024-08-17T08:00:00'),
    activity: 'watering',
    plantName: t('plants.examples.tomato'),
    plot: 'A-01',
    cost: 50000,
    notes: t('care.example_notes.watering')
  },
  {
    id: 2,
    date: new Date('2024-08-16T14:30:00'),
    activity: 'fertilizing',
    plantName: t('plants.examples.mango'),
    plot: 'B-03',
    cost: 120000,
    notes: t('care.example_notes.fertilizing')
  },
  {
    id: 3,
    date: new Date('2024-08-15T10:15:00'),
    activity: 'pruning',
    plantName: t('plants.examples.lettuce'),
    plot: 'A-05',
    cost: 0,
    notes: t('care.example_notes.pruning')
  },
  {
    id: 4,
    date: new Date('2024-08-14T16:45:00'),
    activity: 'pest_control',
    plantName: t('plants.examples.papaya'),
    plot: 'C-02',
    cost: 85000,
    notes: t('care.example_notes.pest_control')
  }
])

const careSchedules = ref([
  {
    id: 1,
    plantName: t('plants.examples.tomato'),
    plot: 'A-01',
    activity: 'watering',
    frequency: 'daily',
    nextDue: new Date(Date.now() + 3600000), // 1 hour from now
    isActive: true
  },
  {
    id: 2,
    plantName: t('plants.examples.mango'),
    plot: 'B-03',
    activity: 'fertilizing',
    frequency: 'monthly',
    nextDue: new Date(Date.now() + 172800000), // 2 days from now
    isActive: true
  },
  {
    id: 3,
    plantName: t('plants.examples.lettuce'),
    plot: 'A-05',
    activity: 'pruning',
    frequency: 'weekly',
    nextDue: new Date(Date.now() - 86400000), // Yesterday (overdue)
    isActive: true
  }
])

// Computed properties
const filteredActivityLogs = computed(() => {
  let filtered = activityLogs.value

  if (filters.value.plant) {
    filtered = filtered.filter(log => log.plantName.includes(filters.value.plant))
  }

  if (filters.value.activity) {
    filtered = filtered.filter(log => log.activity === filters.value.activity)
  }

  if (filters.value.dateFrom) {
    const fromDate = new Date(filters.value.dateFrom)
    filtered = filtered.filter(log => log.date >= fromDate)
  }

  if (filters.value.dateTo) {
    const toDate = new Date(filters.value.dateTo)
    toDate.setHours(23, 59, 59)
    filtered = filtered.filter(log => log.date <= toDate)
  }

  return filtered.sort((a, b) => b.date.getTime() - a.date.getTime())
})

// Utility functions
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('lo-LA', {
    style: 'currency',
    currency: 'LAK'
  }).format(amount)
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('lo-LA').format(date)
}

const formatDateTime = (date: Date) => {
  return new Intl.DateTimeFormat('lo-LA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const getCareIcon = (activity: string) => {
  const icons = {
    watering: 'lucide:droplets',
    fertilizing: 'lucide:flask',
    pruning: 'lucide:scissors',
    pest_control: 'lucide:bug',
    weeding: 'lucide:trash-2',
    mulching: 'lucide:layers'
  }
  return icons[activity as keyof typeof icons] || 'lucide:clipboard'
}

const getCareIconColor = (activity: string) => {
  const colors = {
    watering: 'text-blue-600 dark:text-blue-400',
    fertilizing: 'text-green-600 dark:text-green-400',
    pruning: 'text-purple-600 dark:text-purple-400',
    pest_control: 'text-red-600 dark:text-red-400',
    weeding: 'text-orange-600 dark:text-orange-400',
    mulching: 'text-yellow-600 dark:text-yellow-400'
  }
  return colors[activity as keyof typeof colors] || 'text-gray-600 dark:text-gray-400'
}

const getPriorityColor = (priority: string) => {
  const colors = {
    high: 'red',
    medium: 'yellow',
    low: 'green'
  }
  return colors[priority as keyof typeof colors] || 'gray'
}

const getScheduleStatus = (dueDate: Date) => {
  const now = new Date()
  const diffHours = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60)
  
  if (diffHours < 0) return t('care.status.overdue')
  if (diffHours < 24) return t('care.status.due_today')
  if (diffHours < 48) return t('care.status.due_tomorrow')
  return t('care.status.scheduled')
}

const getScheduleStatusColor = (dueDate: Date) => {
  const now = new Date()
  const diffHours = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60)
  
  if (diffHours < 0) return 'red'
  if (diffHours < 24) return 'orange'
  if (diffHours < 48) return 'yellow'
  return 'green'
}

// Actions
const toggleTask = (taskId: number) => {
  const task = todaysTasks.value.find(t => t.id === taskId)
  if (task) {
    task.completed = !task.completed
  }
}

const scheduleNow = (schedule: any) => {
  logForm.value.plantId = schedule.plantId
  logForm.value.activity = schedule.type
  showLogModal.value = true
}

const submitLog = async (event: any) => {
  isSubmitting.value = true
  
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Add to activity logs
    const newLog = {
      id: Date.now(),
      date: new Date(logForm.value.date),
      activity: logForm.value.activity,
      plantName: plantOptions.value.find(p => p.value === logForm.value.plantId)?.label.split(' - ')[0] || '',
      plot: plantOptions.value.find(p => p.value === logForm.value.plantId)?.label.split(' - ')[1] || '',
      cost: logForm.value.cost || 0,
      notes: logForm.value.notes
    }
    
    activityLogs.value.unshift(newLog)
    
    // Reset form and close modal
    resetLogForm()
    showLogModal.value = false
    
    // Show success notification (you can implement this with Nuxt UI notifications)
    
  } catch (error) {
    console.error('Failed to log activity:', error)
  } finally {
    isSubmitting.value = false
  }
}

const submitSchedule = async (event: any) => {
  isSubmitting.value = true
  
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Add to care schedules
    const newSchedule = {
      id: Date.now(),
      plantName: plantOptions.value.find(p => p.value === scheduleForm.value.plantId)?.label.split(' - ')[0] || '',
      plot: plantOptions.value.find(p => p.value === scheduleForm.value.plantId)?.label.split(' - ')[1] || '',
      activity: scheduleForm.value.activity,
      frequency: scheduleForm.value.frequency,
      nextDue: new Date(scheduleForm.value.startDate),
      isActive: true
    }
    
    careSchedules.value.push(newSchedule)
    
    // Reset form and close modal
    resetScheduleForm()
    showScheduleModal.value = false
    
  } catch (error) {
    console.error('Failed to create schedule:', error)
  } finally {
    isSubmitting.value = false
  }
}

const resetLogForm = () => {
  logForm.value = {
    plantId: '',
    activity: '',
    date: new Date().toISOString().slice(0, 16),
    cost: 0,
    notes: ''
  }
}

const resetScheduleForm = () => {
  scheduleForm.value = {
    plantId: '',
    activity: '',
    frequency: '',
    startDate: new Date().toISOString().split('T')[0],
    notes: ''
  }
}

const editLog = (log: any) => {
  // Implement edit functionality
  console.log('Edit log:', log)
}

const deleteLog = (logId: number) => {
  // Implement delete functionality
  activityLogs.value = activityLogs.value.filter(log => log.id !== logId)
}

const editSchedule = (schedule: any) => {
  // Implement edit functionality
  console.log('Edit schedule:', schedule)
}

const deleteSchedule = (scheduleId: number) => {
  // Implement delete functionality
  careSchedules.value = careSchedules.value.filter(schedule => schedule.id !== scheduleId)
}

const markScheduleComplete = (schedule: any) => {
  // Mark schedule as complete and create next occurrence
  logForm.value.plantId = schedule.plantId || '1'
  logForm.value.activity = schedule.activity
  showLogModal.value = true
}

const exportLog = () => {
  // Implement export functionality
  console.log('Export activity log')
}

// SEO
useHead({
  title: computed(() => t('care.title')),
  meta: [
    { name: 'description', content: computed(() => t('care.description')) }
  ]
})
</script>