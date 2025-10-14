<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div class="px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ $t('harvest.title') }}
            </h1>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {{ $t('harvest.subtitle') }}
            </p>
          </div>
          <UButton 
            @click="showAddHarvestModal = true" 
            color="primary" 
            size="lg"
            :label="$t('harvest.add_harvest')"
          >
            <template #leading>
              <NuxtIcon name="heroicons:plus" />
            </template>
          </UButton>
        </div>
      </div>
    </div>

    <div class="px-4 sm:px-6 lg:px-8 py-6">
      <!-- Stats Overview -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <UCard>
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-green-100 dark:bg-green-800">
              <NuxtIcon name="heroicons:archive-box" class="h-8 w-8 text-green-600 dark:text-green-300" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ $t('harvest.stats.today_harvest') }}</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ todayStats.weight }} {{ $t('common.kg') }}</p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-blue-100 dark:bg-blue-800">
              <NuxtIcon name="heroicons:calendar-days" class="h-8 w-8 text-blue-600 dark:text-blue-300" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ $t('harvest.stats.this_month') }}</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ monthlyStats.weight }} {{ $t('common.kg') }}</p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-purple-100 dark:bg-purple-800">
              <NuxtIcon name="heroicons:banknotes" class="h-8 w-8 text-purple-600 dark:text-purple-300" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ $t('harvest.stats.estimated_value') }}</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ formatCurrency(monthlyStats.estimatedValue) }}</p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-orange-100 dark:bg-orange-800">
              <NuxtIcon name="heroicons:cube" class="h-8 w-8 text-orange-600 dark:text-orange-300" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ $t('harvest.stats.total_batches') }}</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ monthlyStats.totalBatches }}</p>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Filters and Search -->
      <UCard class="mb-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ $t('harvest.filters.plant_type') }}
            </label>
            <USelect v-model="selectedPlantType" :items="plantTypeOptions" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ $t('harvest.filters.date_range') }}
            </label>
            <USelect v-model="selectedDateRange" :items="dateRangeOptions" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ $t('harvest.filters.status') }}
            </label>
            <USelect v-model="selectedStatus" :items="statusOptions" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ $t('common.search') }}
            </label>
            <UInput 
              v-model="searchQuery" 
              :placeholder="$t('harvest.search_placeholder')"
              icon="heroicons:magnifying-glass"
            />
          </div>
        </div>
      </UCard>

      <!-- Harvest Records Table -->
      <UCard>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {{ $t('harvest.table.batch_id') }}
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {{ $t('harvest.table.plant_name') }}
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {{ $t('harvest.table.harvest_date') }}
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {{ $t('harvest.table.quantity') }}
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {{ $t('harvest.table.quality_grade') }}
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {{ $t('harvest.table.status') }}
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {{ $t('common.actions') }}
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="harvest in filteredHarvests" :key="harvest.id" class="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {{ harvest.batchId }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="h-10 w-10 flex-shrink-0">
                      <img class="h-10 w-10 rounded-full object-cover" :src="harvest.plantImage" :alt="harvest.plantName" />
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900 dark:text-white">{{ harvest.plantName }}</div>
                      <div class="text-sm text-gray-500 dark:text-gray-400">{{ harvest.plantVariety }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ formatDate(harvest.harvestDate) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900 dark:text-white">{{ harvest.weight }} {{ $t('common.kg') }}</div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">{{ harvest.quantity }} {{ $t('common.pieces') }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="getQualityBadgeClass(harvest.qualityGrade)" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                    {{ $t(`harvest.quality.${harvest.qualityGrade}`) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="getStatusBadgeClass(harvest.status)" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                    {{ $t(`harvest.status.${harvest.status}`) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex space-x-2">
                    <UButton size="sm" variant="ghost" @click="viewHarvest(harvest)">
                      <NuxtIcon name="heroicons:eye" />
                    </UButton>
                    <UButton size="sm" variant="ghost" @click="editHarvest(harvest)">
                      <NuxtIcon name="heroicons:pencil" />
                    </UButton>
                    <UButton size="sm" variant="ghost" color="red" @click="deleteHarvest(harvest.id)">
                      <NuxtIcon name="heroicons:trash" />
                    </UButton>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>
    </div>

    <!-- Add/Edit Harvest Modal -->
    <UModal v-model="showAddHarvestModal" :ui="{ width: 'sm:max-w-2xl' }">
      <UCard>
        <template #header>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            {{ editingHarvest ? $t('harvest.edit_harvest') : $t('harvest.add_harvest') }}
          </h3>
        </template>

        <UForm :state="harvestForm" @submit="submitHarvest">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormField :label="$t('harvest.form.plant_name')" name="plantId">
              <USelect v-model="harvestForm.plantId" :items="plantOptions" />
            </UFormField>

            <UFormField :label="$t('harvest.form.harvest_date')" name="harvestDate">
              <UInput v-model="harvestForm.harvestDate" type="date" />
            </UFormField>

            <UFormField :label="$t('harvest.form.weight')" name="weight">
              <UInput v-model="harvestForm.weight" type="number" step="0.1" :placeholder="$t('common.kg')" />
            </UFormField>

            <UFormField :label="$t('harvest.form.quantity')" name="quantity">
              <UInput v-model="harvestForm.quantity" type="number" :placeholder="$t('common.pieces')" />
            </UFormField>

            <UFormField :label="$t('harvest.form.quality_grade')" name="qualityGrade">
              <USelect v-model="harvestForm.qualityGrade" :items="qualityOptions" />
            </UFormField>

            <UFormField :label="$t('harvest.form.storage_location')" name="storageLocation">
              <UInput v-model="harvestForm.storageLocation" />
            </UFormField>

            <div class="md:col-span-2">
              <UFormField :label="$t('harvest.form.notes')" name="notes">
                <UTextarea v-model="harvestForm.notes" :rows="3" />
              </UFormField>
            </div>
          </div>

          <div class="flex justify-end space-x-3 mt-6">
            <UButton variant="ghost" @click="showAddHarvestModal = false">
              {{ $t('common.cancel') }}
            </UButton>
            <UButton type="submit" :loading="isSubmitting">
              {{ editingHarvest ? $t('common.save') : $t('common.add') }}
            </UButton>
          </div>
        </UForm>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

// Reactive data
const showAddHarvestModal = ref(false)
const editingHarvest = ref(null)
const isSubmitting = ref(false)
const searchQuery = ref('')
const selectedPlantType = ref('all')
const selectedDateRange = ref('all')
const selectedStatus = ref('all')

// Form data
const harvestForm = reactive({
  plantId: '',
  harvestDate: new Date().toISOString().split('T')[0],
  weight: '',
  quantity: '',
  qualityGrade: 'A',
  storageLocation: '',
  notes: ''
})

// Stats data
const todayStats = reactive({
  weight: 45.2,
  quantity: 128
})

const monthlyStats = reactive({
  weight: 1247.8,
  estimatedValue: 125000,
  totalBatches: 24
})

// Mock harvest data
const harvests = ref([
  {
    id: 1,
    batchId: 'HV-2024-001',
    plantName: 'ຜັກຄະນ້າ',
    plantVariety: 'Chinese Kale',
    plantImage: 'https://images.unsplash.com/photo-1515471019989-c9dde4e9c0b0?w=40&h=40&fit=crop&crop=center',
    harvestDate: '2024-08-15',
    weight: 12.5,
    quantity: 45,
    qualityGrade: 'A',
    status: 'in_stock',
    storageLocation: 'Cold Storage A1'
  },
  {
    id: 2,
    batchId: 'HV-2024-002',
    plantName: 'ຫົວໄຜ່',
    plantVariety: 'Red Onion',
    plantImage: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=40&h=40&fit=crop&crop=center',
    harvestDate: '2024-08-14',
    weight: 8.3,
    quantity: 25,
    qualityGrade: 'B',
    status: 'sold',
    storageLocation: 'Warehouse B2'
  },
  {
    id: 3,
    batchId: 'HV-2024-003',
    plantName: 'ມັກເຂືອ',
    plantVariety: 'Tomato',
    plantImage: 'https://images.unsplash.com/photo-1546470427-bb4cea8f1c26?w=40&h=40&fit=crop&crop=center',
    harvestDate: '2024-08-18',
    weight: 24.7,
    quantity: 89,
    qualityGrade: 'A',
    status: 'processing',
    storageLocation: 'Processing Unit'
  }
])

// Options for selects
const plantTypeOptions = [
  { label: t('common.all'), value: 'all' },
  { label: t('plants.vegetables'), value: 'vegetables' },
  { label: t('plants.fruits'), value: 'fruits' },
  { label: t('plants.herbs'), value: 'herbs' }
]

const dateRangeOptions = [
  { label: t('common.all'), value: 'all' },
  { label: t('time.today'), value: 'today' },
  { label: t('time.this_week'), value: 'week' },
  { label: t('time.this_month'), value: 'month' }
]

const statusOptions = [
  { label: t('common.all'), value: 'all' },
  { label: t('harvest.status.in_stock'), value: 'in_stock' },
  { label: t('harvest.status.sold'), value: 'sold' },
  { label: t('harvest.status.processing'), value: 'processing' },
  { label: t('harvest.status.expired'), value: 'expired' }
]

const qualityOptions = [
  { label: t('harvest.quality.A'), value: 'A' },
  { label: t('harvest.quality.B'), value: 'B' },
  { label: t('harvest.quality.C'), value: 'C' }
]

const plantOptions = [
  { label: 'ຢັດຄານ້າ (Chinese Kale)', value: '1' },
  { label: 'ຫົວໄຜ່ (Red Onion)', value: '2' },
  { label: 'ມັກເຂືອ (Tomato)', value: '3' },
  { label: 'ຜັກກາດ (Lettuce)', value: '4' }
]

// Computed
const filteredHarvests = computed(() => {
  return harvests.value.filter(harvest => {
    const matchesSearch = harvest.plantName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                         harvest.batchId.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesPlantType = selectedPlantType.value === 'all'
    const matchesStatus = selectedStatus.value === 'all' || harvest.status === selectedStatus.value
    
    return matchesSearch && matchesPlantType && matchesStatus
  })
})

// Methods
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('lo-LA', {
    style: 'currency',
    currency: 'LAK'
  }).format(amount)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('lo-LA')
}

const getQualityBadgeClass = (grade: string) => {
  const classes = {
    A: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100',
    B: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100',
    C: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
  }
  return classes[grade] || classes.B
}

const getStatusBadgeClass = (status: string) => {
  const classes = {
    in_stock: 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100',
    sold: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100',
    processing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100',
    expired: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
  }
  return classes[status] || classes.in_stock
}

const viewHarvest = (harvest: any) => {
  // Navigate to harvest detail page
  console.log('View harvest:', harvest)
}

const editHarvest = (harvest: any) => {
  editingHarvest.value = harvest
  Object.assign(harvestForm, {
    plantId: harvest.plantId,
    harvestDate: harvest.harvestDate,
    weight: harvest.weight.toString(),
    quantity: harvest.quantity.toString(),
    qualityGrade: harvest.qualityGrade,
    storageLocation: harvest.storageLocation,
    notes: harvest.notes || ''
  })
  showAddHarvestModal.value = true
}

const deleteHarvest = async (harvestId: number) => {
  if (confirm(t('harvest.confirm_delete'))) {
    harvests.value = harvests.value.filter(h => h.id !== harvestId)
  }
}

const submitHarvest = async () => {
  isSubmitting.value = true
  
  try {
    // Here you would normally submit to your API
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
    
    if (editingHarvest.value) {
      // Update existing harvest
      const index = harvests.value.findIndex(h => h.id === editingHarvest.value.id)
      if (index !== -1) {
        harvests.value[index] = {
          ...harvests.value[index],
          ...harvestForm,
          weight: parseFloat(harvestForm.weight),
          quantity: parseInt(harvestForm.quantity)
        }
      }
    } else {
      // Add new harvest
      const newHarvest = {
        id: harvests.value.length + 1,
        batchId: `HV-2024-${String(harvests.value.length + 1).padStart(3, '0')}`,
        plantName: plantOptions.find(p => p.value === harvestForm.plantId)?.label || '',
        plantVariety: '',
        plantImage: 'https://images.unsplash.com/photo-1515471019989-c9dde4e9c0b0?w=40&h=40&fit=crop&crop=center',
        harvestDate: harvestForm.harvestDate,
        weight: parseFloat(harvestForm.weight),
        quantity: parseInt(harvestForm.quantity),
        qualityGrade: harvestForm.qualityGrade,
        status: 'in_stock',
        storageLocation: harvestForm.storageLocation,
        notes: harvestForm.notes
      }
      
      harvests.value.unshift(newHarvest)
    }
    
    // Reset form
    Object.assign(harvestForm, {
      plantId: '',
      harvestDate: new Date().toISOString().split('T')[0],
      weight: '',
      quantity: '',
      qualityGrade: 'A',
      storageLocation: '',
      notes: ''
    })
    
    editingHarvest.value = null
    showAddHarvestModal.value = false
  } finally {
    isSubmitting.value = false
  }
}
</script>