<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <!-- Header with Balance -->
    <div class="border-b border-gray-200 dark:border-gray-800">
      <div class="max-w-4xl mx-auto px-4 py-5 sm:py-6">
        <!-- Balance Card -->
        <div class="text-center mb-4 sm:mb-5">
          <p class="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mb-1">{{ $t('finance.total_balance') }}</p>
          <div class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-1">
            <template v-if="finance.settings.value.display_unit === 'sats'">
              <Icon name="lets-icons:lightning-light" class="w-7 h-7 sm:w-8 sm:h-8 inline text-amber-500" />
              {{ $n(Math.round(finance.totals.value.balanceSats)) }}
              <span class="text-lg sm:text-xl text-gray-500 dark:text-gray-400">sats</span>
            </template>
            <template v-else>
              {{ $n(finance.totals.value.balance, 'currency', { currency: finance.settings.value.default_currency }) }}
            </template>
          </div>
          <button 
            @click="finance.toggleDisplayUnit"
            class="text-gray-400 dark:text-gray-500 text-xs sm:text-sm hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <Icon name="heroicons:arrows-right-left" class="w-3.5 h-3.5 inline mr-1" />
            <span v-if="finance.settings.value.display_unit === 'sats'">
              ≈ {{ $n(finance.totals.value.balance) }} {{ finance.settings.value.default_currency }}
            </span>
            <span v-else>
              ≈ {{ $n(Math.round(finance.totals.value.balanceSats)) }} sats
            </span>
          </button>
        </div>

        <!-- Income / Expense Summary -->
        <div class="grid grid-cols-2 gap-2 sm:gap-3">
          <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3">
            <div class="flex items-center gap-2 mb-1">
              <div class="w-7 h-7 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                <Icon name="heroicons:arrow-down-left" class="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <span class="text-gray-500 dark:text-gray-400 text-xs">{{ $t('finance.income') }}</span>
            </div>
            <div class="text-base sm:text-lg font-semibold text-green-600 dark:text-green-400">
              <span v-if="finance.settings.value.display_unit === 'sats'">
                +{{ $n(Math.round(finance.totals.value.incomeSats)) }} sats
              </span>
              <span v-else>
                +{{ $n(finance.totals.value.income) }} {{ finance.settings.value.default_currency }}
              </span>
            </div>
          </div>
          <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3">
            <div class="flex items-center gap-2 mb-1">
              <div class="w-7 h-7 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                <Icon name="heroicons:arrow-up-right" class="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
              <span class="text-gray-500 dark:text-gray-400 text-xs">{{ $t('finance.expenses') }}</span>
            </div>
            <div class="text-base sm:text-lg font-semibold text-red-600 dark:text-red-400">
              <span v-if="finance.settings.value.display_unit === 'sats'">
                -{{ $n(Math.round(finance.totals.value.expensesSats)) }} sats
              </span>
              <span v-else>
                -{{ $n(finance.totals.value.expenses) }} {{ finance.settings.value.default_currency }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-4xl mx-auto px-4 py-5">
      <!-- Quick Actions -->
      <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-3 sm:p-4 mb-5">
        <div class="grid grid-cols-4 gap-1.5 sm:gap-2">
          <button
            @click="openQuickAdd('expense')"
            class="flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
              <Icon name="heroicons:minus" class="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" />
            </div>
            <span class="text-xs font-medium text-gray-700 dark:text-gray-300">{{ $t('finance.expense') }}</span>
          </button>
          <button
            @click="openQuickAdd('income')"
            class="flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
              <Icon name="heroicons:plus" class="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
            </div>
            <span class="text-xs font-medium text-gray-700 dark:text-gray-300">{{ $t('finance.income') }}</span>
          </button>
          <NuxtLink
            to="/locosats/report"
            class="flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <Icon name="heroicons:chart-bar" class="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <span class="text-xs font-medium text-gray-700 dark:text-gray-300">{{ $t('finance.reports') }}</span>
          </NuxtLink>
          <NuxtLink
            to="/locosats/settings"
            class="flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Icon name="heroicons:cog-6-tooth" class="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-400" />
            </div>
            <span class="text-xs font-medium text-gray-700 dark:text-gray-300">{{ $t('common.settings') }}</span>
          </NuxtLink>
        </div>
      </div>

      <!-- Budget Goals (if any) -->
      <div v-if="budgetGoals.length" class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-5 mb-5">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">{{ $t('finance.budget_goals') }}</h3>
        <div class="space-y-3">
          <div v-for="goal in budgetGoals" :key="goal.category" class="space-y-1.5">
            <div class="flex items-center justify-between text-sm">
              <span class="font-medium text-gray-700 dark:text-gray-300">{{ goal.category }}</span>
              <span :class="goal.spent > goal.budget ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'" class="text-xs">
                {{ $n(goal.spent) }} / {{ $n(goal.budget) }} {{ finance.settings.value.default_currency }}
              </span>
            </div>
            <div class="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all"
                :class="goal.percentage > 100 ? 'bg-red-500' : goal.percentage > 80 ? 'bg-amber-500' : 'bg-green-500'"
                :style="{ width: `${Math.min(goal.percentage, 100)}%` }"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Transactions -->
      <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div class="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white">{{ $t('finance.recent_transactions') }}</h3>
          <NuxtLink to="/locosats/create" class="text-primary-500 text-xs hover:underline">
            {{ $t('common.view_all') }}
          </NuxtLink>
        </div>

        <!-- Transaction List -->
        <div v-if="recentTransactions.length" class="divide-y divide-gray-100 dark:divide-gray-800">
          <div
            v-for="entry in recentTransactions"
            :key="entry.id"
            class="p-3 sm:p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
            @click="viewTransaction(entry)"
          >
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              :class="getCategoryBg(entry.category)"
            >
              <Icon :name="getCategoryIcon(entry.category)" class="w-5 h-5" :class="getCategoryIconColor(entry.category)" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-sm text-gray-900 dark:text-white truncate">{{ entry.category }}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ entry.note || $t('finance.no_note') }}</div>
            </div>
            <div class="text-right">
              <div
                class="font-semibold text-sm"
                :class="entry.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
              >
                {{ entry.type === 'income' ? '+' : '-' }}
                <span v-if="finance.settings.value.display_unit === 'sats'">
                  {{ $n(Math.round(entry.amount_sats)) }} sats
                </span>
                <span v-else>
                  {{ $n(entry.amount_fiat) }} {{ entry.fiat_currency }}
                </span>
              </div>
              <div class="text-xs text-gray-400">{{ formatRelativeDate(entry.created_at) }}</div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="p-10 text-center">
          <div class="w-14 h-14 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <Icon name="heroicons:banknotes" class="w-7 h-7 text-gray-400" />
          </div>
          <h3 class="text-base font-medium mb-1.5 text-gray-900 dark:text-white">{{ $t('finance.no_transactions') }}</h3>
          <p class="text-gray-500 dark:text-gray-400 text-sm mb-4">{{ $t('finance.no_transactions_desc') }}</p>
          <UButton color="primary" size="sm" @click="openQuickAdd('expense')">
            <Icon name="heroicons:plus" class="w-4 h-4 mr-1.5" />
            {{ $t('finance.add_first') }}
          </UButton>
        </div>
      </div>

      <!-- Spending by Category (mini chart) -->
      <div v-if="categoryBreakdown.length" class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-5 mt-5">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">{{ $t('finance.spending_by_category') }}</h3>
        <div class="space-y-2.5">
          <div v-for="cat in categoryBreakdown.slice(0, 5)" :key="cat.name" class="flex items-center gap-2.5">
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
              :class="getCategoryBg(cat.name)"
            >
              <Icon :name="getCategoryIcon(cat.name)" class="w-4 h-4" :class="getCategoryIconColor(cat.name)" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between mb-0.5">
                <span class="text-xs font-medium text-gray-700 dark:text-gray-300">{{ cat.name }}</span>
                <span class="text-xs text-gray-500 dark:text-gray-400">{{ $n(cat.amount) }} {{ finance.settings.value.default_currency }}</span>
              </div>
              <div class="h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full bg-primary-500"
                  :style="{ width: `${cat.percentage}%` }"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Add Modal -->
    <UModal v-model:open="showQuickAdd">
      <template #content>
        <div class="p-5">
          <h3 class="text-base font-semibold mb-4 text-gray-900 dark:text-white">
            {{ quickAddType === 'income' ? $t('finance.add_income') : $t('finance.add_expense') }}
          </h3>
          
          <!-- Amount Input -->
          <div class="mb-4">
            <label class="text-xs text-gray-500 dark:text-gray-400 mb-1 block">{{ $t('finance.amount') }}</label>
            <div class="relative">
              <input
                v-model="quickAddAmount"
                type="number"
                class="w-full text-2xl sm:text-3xl font-bold p-3 sm:p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-gray-900 dark:text-white"
                :placeholder="quickAddUnit === 'sats' ? '0 sats' : '0'"
                autofocus
              />
              <button
                @click="quickAddUnit = quickAddUnit === 'fiat' ? 'sats' : 'fiat'"
                class="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 px-2 sm:px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-md text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {{ quickAddUnit === 'fiat' ? finance.settings.value.default_currency : 'sats' }}
              </button>
            </div>
          </div>

          <!-- Category Quick Select -->
          <div class="mb-4">
            <label class="text-xs text-gray-500 dark:text-gray-400 mb-2 block">{{ $t('finance.category') }}</label>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="cat in quickCategories"
                :key="cat"
                @click="quickAddCategory = cat"
                class="px-2.5 py-1.5 rounded-md text-xs transition-colors"
                :class="quickAddCategory === cat 
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 ring-1 ring-primary-500/50' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'"
              >
                {{ cat }}
              </button>
            </div>
          </div>

          <!-- Note -->
          <div class="mb-5">
            <label class="text-xs text-gray-500 dark:text-gray-400 mb-1 block">{{ $t('finance.note') }}</label>
            <UInput v-model="quickAddNote" :placeholder="$t('finance.note_placeholder')" size="sm" />
          </div>

          <!-- Actions -->
          <div class="flex gap-2">
            <UButton variant="ghost" class="flex-1" size="sm" @click="showQuickAdd = false">
              {{ $t('common.cancel') }}
            </UButton>
            <UButton 
              :color="quickAddType === 'income' ? 'green' : 'red'"
              class="flex-1" 
              size="sm"
              :loading="isSaving"
              @click="submitQuickAdd"
            >
              {{ $t('common.save') }}
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Floating Action Button -->
    <button
      @click="openQuickAdd('expense')"
      class="fixed bottom-5 right-5 w-12 h-12 rounded-full bg-primary-500 text-white shadow-md hover:bg-primary-600 hover:shadow-lg transition-all flex items-center justify-center z-50"
    >
      <Icon name="heroicons:plus" class="w-6 h-6" />
    </button>
  </div>
</template>

<script setup lang="ts">
const finance = useFinance()
const { t } = useI18n()

// Quick Add State
const showQuickAdd = ref(false)
const quickAddType = ref<'income' | 'expense'>('expense')
const quickAddAmount = ref<number | string>('')
const quickAddCategory = ref('Other')
const quickAddNote = ref('')
const quickAddUnit = ref<'fiat' | 'sats'>('fiat')
const isSaving = ref(false)

const quickCategories = [
  'Food',
  'Transport',
  'Shopping',
  'Entertainment',
  'Bills',
  'Salary',
  'Freelance',
  'Other'
]

// Open Quick Add
const openQuickAdd = (type: 'income' | 'expense') => {
  quickAddType.value = type
  quickAddAmount.value = ''
  quickAddCategory.value = type === 'income' ? 'Salary' : 'Food'
  quickAddNote.value = ''
  quickAddUnit.value = finance.settings.value.display_unit
  showQuickAdd.value = true
}

// Submit Quick Add
const submitQuickAdd = async () => {
  if (!quickAddAmount.value) return
  
  isSaving.value = true
  try {
    await finance.addEntry({
      type: quickAddType.value,
      category: quickAddCategory.value,
      amount_fiat: quickAddUnit.value === 'fiat' ? Number(quickAddAmount.value) : 0,
      amount_sats: quickAddUnit.value === 'sats' ? Number(quickAddAmount.value) : 0,
      unit_input: quickAddUnit.value,
      fiat_currency: finance.settings.value.default_currency,
      sats_per_fiat: finance.currentExchangeRate.value,
      note: quickAddNote.value || quickAddCategory.value,
      tags: [quickAddCategory.value.toLowerCase()],
      visibility: 'private',
      user_id: ''
    })
    showQuickAdd.value = false
  } finally {
    isSaving.value = false
  }
}

// Recent Transactions
const recentTransactions = computed(() => {
  return finance.entries.value.slice(0, 10)
})

// Budget Goals (demo data - would come from settings)
const budgetGoals = computed(() => {
  const goals = [
    { category: 'Food', budget: 500000 },
    { category: 'Transport', budget: 200000 },
    { category: 'Entertainment', budget: 300000 }
  ]
  
  return goals.map(goal => {
    const spent = finance.entries.value
      .filter(e => e.type === 'expense' && e.category === goal.category)
      .reduce((sum, e) => sum + e.amount_fiat, 0)
    
    return {
      ...goal,
      spent,
      percentage: (spent / goal.budget) * 100
    }
  }).filter(g => g.spent > 0)
})

// Category Breakdown
const categoryBreakdown = computed(() => {
  const expenses = finance.entries.value.filter(e => e.type === 'expense')
  const total = expenses.reduce((sum, e) => sum + e.amount_fiat, 0)
  
  const categories: Record<string, number> = {}
  expenses.forEach(e => {
    categories[e.category] = (categories[e.category] || 0) + e.amount_fiat
  })
  
  return Object.entries(categories)
    .map(([name, amount]) => ({
      name,
      amount,
      percentage: total > 0 ? (amount / total) * 100 : 0
    }))
    .sort((a, b) => b.amount - a.amount)
})

// View Transaction
const viewTransaction = (entry: any) => {
  // Could open a modal or navigate to detail page
  console.log('View transaction:', entry)
}

// Category Styling
const getCategoryIcon = (category: string) => {
  const icons: Record<string, string> = {
    Food: 'heroicons:cake',
    Groceries: 'heroicons:shopping-cart',
    Transport: 'heroicons:truck',
    Entertainment: 'heroicons:tv',
    Shopping: 'heroicons:shopping-bag',
    Bills: 'heroicons:document-text',
    Health: 'heroicons:heart',
    Salary: 'heroicons:banknotes',
    Freelance: 'heroicons:computer-desktop',
    Investments: 'heroicons:chart-bar-square',
    Other: 'heroicons:ellipsis-horizontal-circle'
  }
  return icons[category] || icons.Other
}

const getCategoryBg = (category: string) => {
  const bgs: Record<string, string> = {
    Food: 'bg-orange-50 dark:bg-orange-900/20',
    Groceries: 'bg-green-50 dark:bg-green-900/20',
    Transport: 'bg-blue-50 dark:bg-blue-900/20',
    Entertainment: 'bg-purple-50 dark:bg-purple-900/20',
    Shopping: 'bg-pink-50 dark:bg-pink-900/20',
    Bills: 'bg-gray-100 dark:bg-gray-800',
    Health: 'bg-red-50 dark:bg-red-900/20',
    Salary: 'bg-emerald-50 dark:bg-emerald-900/20',
    Freelance: 'bg-cyan-50 dark:bg-cyan-900/20',
    Investments: 'bg-indigo-50 dark:bg-indigo-900/20',
    Other: 'bg-gray-100 dark:bg-gray-800'
  }
  return bgs[category] || bgs.Other
}

const getCategoryIconColor = (category: string) => {
  const colors: Record<string, string> = {
    Food: 'text-orange-600 dark:text-orange-400',
    Groceries: 'text-green-600 dark:text-green-400',
    Transport: 'text-blue-600 dark:text-blue-400',
    Entertainment: 'text-purple-600 dark:text-purple-400',
    Shopping: 'text-pink-600 dark:text-pink-400',
    Bills: 'text-gray-600 dark:text-gray-400',
    Health: 'text-red-600 dark:text-red-400',
    Salary: 'text-emerald-600 dark:text-emerald-400',
    Freelance: 'text-cyan-600 dark:text-cyan-400',
    Investments: 'text-indigo-600 dark:text-indigo-400',
    Other: 'text-gray-600 dark:text-gray-400'
  }
  return colors[category] || colors.Other
}

// Format Date
const formatRelativeDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) return t('common.today')
  if (days === 1) return t('common.yesterday')
  if (days < 7) return `${days} ${t('common.days_ago')}`
  
  return date.toLocaleDateString()
}

// Load on mount
onMounted(() => {
  finance.loadEntries()
  finance.fetchExchangeRate()
})

useHead({
  title: 'Sats Wallet - LocoBit Space'
})
</script>
