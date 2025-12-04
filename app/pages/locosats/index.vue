<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header with Balance -->
    <div class="bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 text-white">
      <div class="max-w-4xl mx-auto px-4 py-8">
        <!-- Balance Card -->
        <div class="text-center mb-6">
          <p class="text-white/80 text-sm mb-1">{{ $t('finance.total_balance') }}</p>
          <div class="text-4xl md:text-5xl font-bold mb-2">
            <template v-if="finance.settings.value.display_unit === 'sats'">
              <Icon name="lets-icons:lightning-light" class="w-8 h-8 inline" />
              {{ $n(Math.round(finance.totals.value.balanceSats)) }}
              <span class="text-xl">sats</span>
            </template>
            <template v-else>
              {{ $n(finance.totals.value.balance, 'currency', { currency: finance.settings.value.default_currency }) }}
            </template>
          </div>
          <button 
            @click="finance.toggleDisplayUnit"
            class="text-white/70 text-sm hover:text-white transition-colors"
          >
            <Icon name="heroicons:arrows-right-left" class="w-4 h-4 inline mr-1" />
            <span v-if="finance.settings.value.display_unit === 'sats'">
              ≈ {{ $n(finance.totals.value.balance) }} {{ finance.settings.value.default_currency }}
            </span>
            <span v-else>
              ≈ {{ $n(Math.round(finance.totals.value.balanceSats)) }} sats
            </span>
          </button>
        </div>

        <!-- Income / Expense Summary -->
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-white/10 backdrop-blur rounded-xl p-4">
            <div class="flex items-center gap-2 mb-1">
              <div class="w-8 h-8 rounded-full bg-green-400/30 flex items-center justify-center">
                <Icon name="heroicons:arrow-down-left" class="w-5 h-5 text-green-200" />
              </div>
              <span class="text-white/80 text-sm">{{ $t('finance.income') }}</span>
            </div>
            <div class="text-xl font-semibold">
              <span v-if="finance.settings.value.display_unit === 'sats'">
                +{{ $n(Math.round(finance.totals.value.incomeSats)) }} sats
              </span>
              <span v-else>
                +{{ $n(finance.totals.value.income) }} {{ finance.settings.value.default_currency }}
              </span>
            </div>
          </div>
          <div class="bg-white/10 backdrop-blur rounded-xl p-4">
            <div class="flex items-center gap-2 mb-1">
              <div class="w-8 h-8 rounded-full bg-red-400/30 flex items-center justify-center">
                <Icon name="heroicons:arrow-up-right" class="w-5 h-5 text-red-200" />
              </div>
              <span class="text-white/80 text-sm">{{ $t('finance.expenses') }}</span>
            </div>
            <div class="text-xl font-semibold">
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
    <div class="max-w-4xl mx-auto px-4 py-6 -mt-4">
      <!-- Quick Actions -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 mb-6">
        <div class="grid grid-cols-4 gap-2">
          <button
            @click="openQuickAdd('expense')"
            class="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div class="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <Icon name="heroicons:minus" class="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <span class="text-xs font-medium">{{ $t('finance.expense') }}</span>
          </button>
          <button
            @click="openQuickAdd('income')"
            class="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div class="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Icon name="heroicons:plus" class="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <span class="text-xs font-medium">{{ $t('finance.income') }}</span>
          </button>
          <NuxtLink
            to="/locosats/report"
            class="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div class="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Icon name="heroicons:chart-bar" class="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <span class="text-xs font-medium">{{ $t('finance.reports') }}</span>
          </NuxtLink>
          <NuxtLink
            to="/locosats/settings"
            class="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div class="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <Icon name="heroicons:cog-6-tooth" class="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </div>
            <span class="text-xs font-medium">{{ $t('common.settings') }}</span>
          </NuxtLink>
        </div>
      </div>

      <!-- Budget Goals (if any) -->
      <div v-if="budgetGoals.length" class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6">
        <h3 class="text-lg font-semibold mb-4">{{ $t('finance.budget_goals') }}</h3>
        <div class="space-y-4">
          <div v-for="goal in budgetGoals" :key="goal.category" class="space-y-2">
            <div class="flex items-center justify-between text-sm">
              <span class="font-medium">{{ goal.category }}</span>
              <span :class="goal.spent > goal.budget ? 'text-red-500' : 'text-gray-500'">
                {{ $n(goal.spent) }} / {{ $n(goal.budget) }} {{ finance.settings.value.default_currency }}
              </span>
            </div>
            <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
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
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
        <div class="p-4 border-b dark:border-gray-700 flex items-center justify-between">
          <h3 class="text-lg font-semibold">{{ $t('finance.recent_transactions') }}</h3>
          <NuxtLink to="/locosats/create" class="text-primary-500 text-sm hover:underline">
            {{ $t('common.view_all') }}
          </NuxtLink>
        </div>

        <!-- Transaction List -->
        <div v-if="recentTransactions.length" class="divide-y dark:divide-gray-700">
          <div
            v-for="entry in recentTransactions"
            :key="entry.id"
            class="p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
            @click="viewTransaction(entry)"
          >
            <div
              class="w-12 h-12 rounded-full flex items-center justify-center"
              :class="getCategoryBg(entry.category)"
            >
              <Icon :name="getCategoryIcon(entry.category)" class="w-6 h-6" :class="getCategoryIconColor(entry.category)" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium truncate">{{ entry.category }}</div>
              <div class="text-sm text-gray-500 dark:text-gray-400 truncate">{{ entry.note || $t('finance.no_note') }}</div>
            </div>
            <div class="text-right">
              <div
                class="font-semibold"
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
        <div v-else class="p-12 text-center">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <Icon name="heroicons:banknotes" class="w-8 h-8 text-gray-400" />
          </div>
          <h3 class="text-lg font-medium mb-2">{{ $t('finance.no_transactions') }}</h3>
          <p class="text-gray-500 dark:text-gray-400 mb-4">{{ $t('finance.no_transactions_desc') }}</p>
          <UButton color="primary" @click="openQuickAdd('expense')">
            <Icon name="heroicons:plus" class="w-4 h-4 mr-2" />
            {{ $t('finance.add_first') }}
          </UButton>
        </div>
      </div>

      <!-- Spending by Category (mini chart) -->
      <div v-if="categoryBreakdown.length" class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mt-6">
        <h3 class="text-lg font-semibold mb-4">{{ $t('finance.spending_by_category') }}</h3>
        <div class="space-y-3">
          <div v-for="cat in categoryBreakdown.slice(0, 5)" :key="cat.name" class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center"
              :class="getCategoryBg(cat.name)"
            >
              <Icon :name="getCategoryIcon(cat.name)" class="w-5 h-5" :class="getCategoryIconColor(cat.name)" />
            </div>
            <div class="flex-1">
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm font-medium">{{ cat.name }}</span>
                <span class="text-sm text-gray-500">{{ $n(cat.amount) }} {{ finance.settings.value.default_currency }}</span>
              </div>
              <div class="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
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
        <div class="p-6">
          <h3 class="text-lg font-semibold mb-4">
            {{ quickAddType === 'income' ? $t('finance.add_income') : $t('finance.add_expense') }}
          </h3>
          
          <!-- Amount Input -->
          <div class="mb-4">
            <label class="text-sm text-gray-500 mb-1 block">{{ $t('finance.amount') }}</label>
            <div class="relative">
              <input
                v-model="quickAddAmount"
                type="number"
                class="w-full text-3xl font-bold p-4 border dark:border-gray-700 rounded-xl bg-transparent focus:ring-2 focus:ring-primary-500 outline-none"
                :placeholder="quickAddUnit === 'sats' ? '0 sats' : '0'"
                autofocus
              />
              <button
                @click="quickAddUnit = quickAddUnit === 'fiat' ? 'sats' : 'fiat'"
                class="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm"
              >
                {{ quickAddUnit === 'fiat' ? finance.settings.value.default_currency : 'sats' }}
              </button>
            </div>
          </div>

          <!-- Category Quick Select -->
          <div class="mb-4">
            <label class="text-sm text-gray-500 mb-2 block">{{ $t('finance.category') }}</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="cat in quickCategories"
                :key="cat"
                @click="quickAddCategory = cat"
                class="px-3 py-2 rounded-lg text-sm transition-colors"
                :class="quickAddCategory === cat 
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 ring-1 ring-primary-500' 
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'"
              >
                {{ cat }}
              </button>
            </div>
          </div>

          <!-- Note -->
          <div class="mb-6">
            <label class="text-sm text-gray-500 mb-1 block">{{ $t('finance.note') }}</label>
            <UInput v-model="quickAddNote" :placeholder="$t('finance.note_placeholder')" />
          </div>

          <!-- Actions -->
          <div class="flex gap-3">
            <UButton variant="ghost" class="flex-1" @click="showQuickAdd = false">
              {{ $t('common.cancel') }}
            </UButton>
            <UButton 
              :color="quickAddType === 'income' ? 'green' : 'red'"
              class="flex-1" 
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
      class="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary-500 text-white shadow-lg hover:bg-primary-600 transition-colors flex items-center justify-center z-50"
    >
      <Icon name="heroicons:plus" class="w-7 h-7" />
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
    Food: 'bg-orange-100 dark:bg-orange-900/30',
    Groceries: 'bg-green-100 dark:bg-green-900/30',
    Transport: 'bg-blue-100 dark:bg-blue-900/30',
    Entertainment: 'bg-purple-100 dark:bg-purple-900/30',
    Shopping: 'bg-pink-100 dark:bg-pink-900/30',
    Bills: 'bg-gray-100 dark:bg-gray-700',
    Health: 'bg-red-100 dark:bg-red-900/30',
    Salary: 'bg-emerald-100 dark:bg-emerald-900/30',
    Freelance: 'bg-cyan-100 dark:bg-cyan-900/30',
    Investments: 'bg-indigo-100 dark:bg-indigo-900/30',
    Other: 'bg-gray-100 dark:bg-gray-700'
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
