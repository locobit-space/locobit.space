<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 border-b dark:border-gray-700 sticky top-0 z-10">
      <div class="max-w-2xl mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <NuxtLink to="/locosats" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <Icon name="heroicons:arrow-left" class="w-5 h-5" />
            </NuxtLink>
            <h1 class="text-xl font-semibold">{{ $t('finance.add_expense') }}</h1>
          </div>
        </div>
      </div>
    </div>

    <!-- Type Toggle -->
    <div class="max-w-2xl mx-auto px-4 py-6">
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-2 mb-6">
        <div class="grid grid-cols-2 gap-2">
          <button
            @click="form.type = 'expense'"
            class="py-3 px-4 rounded-xl font-medium transition-all"
            :class="form.type === 'expense' 
              ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' 
              : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'"
          >
            <Icon name="heroicons:arrow-up-right" class="w-5 h-5 inline mr-2" />
            {{ $t('finance.expense') }}
          </button>
          <button
            @click="form.type = 'income'"
            class="py-3 px-4 rounded-xl font-medium transition-all"
            :class="form.type === 'income' 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
              : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'"
          >
            <Icon name="heroicons:arrow-down-left" class="w-5 h-5 inline mr-2" />
            {{ $t('finance.income') }}
          </button>
        </div>
      </div>

      <!-- Amount Section -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 mb-6">
        <label class="text-sm text-gray-500 dark:text-gray-400 mb-2 block">{{ $t('finance.amount') }}</label>
        <div class="flex items-center gap-4">
          <div class="flex-1 relative">
            <input
              v-model="amount"
              type="number"
              inputmode="decimal"
              class="w-full text-4xl font-bold p-0 border-0 bg-transparent focus:ring-0 outline-none"
              :class="form.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
              placeholder="0"
              autofocus
            />
          </div>
          <button
            @click="toggleUnit"
            class="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            {{ form.unit_input === 'fiat' ? finance.settings.value.default_currency : 'sats' }}
          </button>
        </div>
        
        <!-- Conversion -->
        <div v-if="amount && Number(amount) > 0" class="mt-2 text-sm text-gray-500">
          ≈ {{ conversionDisplay }}
        </div>

        <!-- Quick Amounts -->
        <div class="mt-4 flex flex-wrap gap-2">
          <button
            v-for="quickAmount in quickAmounts"
            :key="quickAmount"
            @click="amount = quickAmount"
            class="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            {{ $n(quickAmount) }}
          </button>
        </div>
      </div>

      <!-- Category Section -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 mb-6">
        <label class="text-sm text-gray-500 dark:text-gray-400 mb-3 block">{{ $t('finance.category') }}</label>
        <div class="grid grid-cols-4 gap-3">
          <button
            v-for="cat in categories"
            :key="cat.name"
            @click="form.category = cat.name"
            class="flex flex-col items-center gap-2 p-3 rounded-xl transition-all"
            :class="form.category === cat.name 
              ? 'bg-primary-100 dark:bg-primary-900/30 ring-2 ring-primary-500' 
              : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'"
          >
            <div 
              class="w-10 h-10 rounded-full flex items-center justify-center"
              :class="cat.bg"
            >
              <Icon :name="cat.icon" class="w-5 h-5" :class="cat.color" />
            </div>
            <span class="text-xs font-medium">{{ cat.name }}</span>
          </button>
        </div>
      </div>

      <!-- Details Section -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 mb-6 space-y-4">
        <!-- Note -->
        <div>
          <label class="text-sm text-gray-500 dark:text-gray-400 mb-2 block">{{ $t('finance.note') }}</label>
          <UInput
            v-model="form.note"
            :placeholder="$t('finance.note_placeholder')"
            size="lg"
          />
        </div>

        <!-- Tags -->
        <div>
          <label class="text-sm text-gray-500 dark:text-gray-400 mb-2 block">Tags</label>
          <UInputTags
            v-model="form.tags"
            placeholder="Add tags..."
          />
        </div>

        <!-- Date -->
        <div>
          <label class="text-sm text-gray-500 dark:text-gray-400 mb-2 block">{{ $t('common.date') }}</label>
          <UInput
            v-model="form.date"
            type="date"
            :max="today"
          />
        </div>
      </div>

      <!-- Submit Button -->
      <UButton
        color="primary"
        size="xl"
        block
        :loading="isSubmitting"
        :disabled="!amount || Number(amount) <= 0"
        @click="handleSubmit"
      >
        <Icon name="heroicons:check" class="w-5 h-5 mr-2" />
        {{ form.type === 'income' ? $t('finance.add_income') : $t('finance.add_expense') }}
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const finance = useFinance()
const toast = useToast()

const today = new Date().toISOString().split('T')[0]

const form = ref({
  type: 'expense' as 'income' | 'expense',
  category: 'Food',
  note: '',
  tags: [] as string[],
  unit_input: 'fiat' as 'fiat' | 'sats',
  date: today
})

const amount = ref<number | string>('')
const isSubmitting = ref(false)

// Quick amounts based on currency
const quickAmounts = computed(() => {
  if (form.value.unit_input === 'sats') {
    return [1000, 5000, 10000, 21000, 50000, 100000]
  }
  // For LAK
  if (finance.settings.value.default_currency === 'LAK') {
    return [10000, 20000, 50000, 100000, 200000, 500000]
  }
  // For USD
  return [5, 10, 20, 50, 100, 200]
})

// Categories with icons
const categories = [
  { name: 'Food', icon: 'heroicons:cake', bg: 'bg-orange-100 dark:bg-orange-900/30', color: 'text-orange-600 dark:text-orange-400' },
  { name: 'Transport', icon: 'heroicons:truck', bg: 'bg-blue-100 dark:bg-blue-900/30', color: 'text-blue-600 dark:text-blue-400' },
  { name: 'Shopping', icon: 'heroicons:shopping-bag', bg: 'bg-pink-100 dark:bg-pink-900/30', color: 'text-pink-600 dark:text-pink-400' },
  { name: 'Entertainment', icon: 'heroicons:tv', bg: 'bg-purple-100 dark:bg-purple-900/30', color: 'text-purple-600 dark:text-purple-400' },
  { name: 'Bills', icon: 'heroicons:document-text', bg: 'bg-gray-100 dark:bg-gray-700', color: 'text-gray-600 dark:text-gray-400' },
  { name: 'Health', icon: 'heroicons:heart', bg: 'bg-red-100 dark:bg-red-900/30', color: 'text-red-600 dark:text-red-400' },
  { name: 'Salary', icon: 'heroicons:banknotes', bg: 'bg-emerald-100 dark:bg-emerald-900/30', color: 'text-emerald-600 dark:text-emerald-400' },
  { name: 'Other', icon: 'heroicons:ellipsis-horizontal-circle', bg: 'bg-gray-100 dark:bg-gray-700', color: 'text-gray-600 dark:text-gray-400' }
]

// Toggle unit
const toggleUnit = () => {
  form.value.unit_input = form.value.unit_input === 'fiat' ? 'sats' : 'fiat'
}

// Conversion display
const conversionDisplay = computed(() => {
  if (!amount.value || Number(amount.value) <= 0) return ''
  const val = Number(amount.value)
  
  if (form.value.unit_input === 'fiat') {
    const sats = Math.round(val * finance.currentExchangeRate.value)
    return `${sats.toLocaleString()} sats`
  } else {
    const fiat = (val / finance.currentExchangeRate.value).toFixed(2)
    return `${fiat} ${finance.settings.value.default_currency}`
  }
})

// Submit handler
const handleSubmit = async () => {
  if (!amount.value || Number(amount.value) <= 0) return
  
  isSubmitting.value = true
  try {
    await finance.addEntry({
      type: form.value.type,
      category: form.value.category,
      amount_fiat: form.value.unit_input === 'fiat' ? Number(amount.value) : 0,
      amount_sats: form.value.unit_input === 'sats' ? Number(amount.value) : 0,
      unit_input: form.value.unit_input,
      fiat_currency: finance.settings.value.default_currency,
      sats_per_fiat: finance.currentExchangeRate.value,
      note: form.value.note || form.value.category,
      tags: form.value.tags.length ? form.value.tags : [form.value.category.toLowerCase()],
      visibility: 'private',
      user_id: ''
    })
    
    toast.add({
      title: 'Success',
      description: `${form.value.type === 'income' ? 'Income' : 'Expense'} added successfully`,
      color: 'green'
    })
    
    router.push('/locosats')
  } catch (error) {
    console.error(error)
  } finally {
    isSubmitting.value = false
  }
}

// Load exchange rate on mount
onMounted(() => {
  finance.fetchExchangeRate()
})

useHead({
  title: 'Add Transaction - Sats Wallet'
})
</script>
