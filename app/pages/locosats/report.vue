<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
      <div class="max-w-6xl mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <NuxtLink to="/locosats" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <Icon name="heroicons:arrow-left" class="w-5 h-5" />
            </NuxtLink>
            <h1 class="text-xl font-semibold">{{ $t('finance.reports') }}</h1>
          </div>
          <div class="flex items-center gap-2">
            <UButton variant="ghost" @click="exportData">
              <Icon name="heroicons:arrow-down-tray" class="w-4 h-4 mr-2" />
              Export
            </UButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Time Period Selector -->
    <div class="max-w-6xl mx-auto px-4 py-4">
      <div class="flex items-center gap-2 overflow-x-auto pb-2">
        <UButton
          v-for="period in periods"
          :key="period.value"
          :color="selectedPeriod === period.value ? 'primary' : 'neutral'"
          :variant="selectedPeriod === period.value ? 'solid' : 'ghost'"
          size="sm"
          @click="selectedPeriod = period.value"
        >
          {{ period.label }}
        </UButton>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-6xl mx-auto px-4 pb-8">
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Icon name="heroicons:arrow-trending-up" class="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <span class="text-sm text-gray-500 dark:text-gray-400">Total Income</span>
          </div>
          <div class="text-2xl font-bold text-green-600 dark:text-green-400">
            +{{ $n(periodStats.income) }}
          </div>
          <div class="text-sm text-gray-400 mt-1">
            {{ periodStats.incomeCount }} transactions
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <Icon name="heroicons:arrow-trending-down" class="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <span class="text-sm text-gray-500 dark:text-gray-400">Total Expenses</span>
          </div>
          <div class="text-2xl font-bold text-red-600 dark:text-red-400">
            -{{ $n(periodStats.expenses) }}
          </div>
          <div class="text-sm text-gray-400 mt-1">
            {{ periodStats.expenseCount }} transactions
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Icon name="heroicons:banknotes" class="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span class="text-sm text-gray-500 dark:text-gray-400">Net Balance</span>
          </div>
          <div 
            class="text-2xl font-bold"
            :class="periodStats.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
          >
            {{ periodStats.balance >= 0 ? '+' : '' }}{{ $n(periodStats.balance) }}
          </div>
          <div class="text-sm text-gray-400 mt-1">
            {{ finance.settings.value.default_currency }}
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Icon name="lets-icons:lightning-light" class="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <span class="text-sm text-gray-500 dark:text-gray-400">In Sats</span>
          </div>
          <div class="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {{ $n(Math.round(periodStats.balanceSats)) }}
          </div>
          <div class="text-sm text-gray-400 mt-1">
            satoshis
          </div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <!-- Spending by Category -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <h3 class="text-lg font-semibold mb-4">Expenses by Category</h3>
          <div v-if="categoryData.length > 0" class="h-64">
            <CommonPieChart :data="categoryData" />
          </div>
          <div v-else class="h-64 flex items-center justify-center text-gray-400">
            No expense data yet
          </div>
        </div>

        <!-- Income vs Expenses -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <h3 class="text-lg font-semibold mb-4">Income vs Expenses</h3>
          <div v-if="monthlyChart.length > 0" class="h-64">
            <CommonLineChart :series="monthlyChart" class="h-full" />
          </div>
          <div v-else class="h-64 flex items-center justify-center text-gray-400">
            No data available
          </div>
        </div>
      </div>

      <!-- Insights Section -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm mb-6">
        <h3 class="text-lg font-semibold mb-4">
          <Icon name="heroicons:light-bulb" class="w-5 h-5 inline mr-2 text-amber-500" />
          Insights & Tips
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <!-- Top Spending Category -->
          <div v-if="topCategory" class="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
            <div class="flex items-center gap-3 mb-2">
              <div class="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Icon name="heroicons:arrow-trending-up" class="w-4 h-4 text-red-500" />
              </div>
              <span class="font-medium">Top Spending</span>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-300">
              <strong>{{ topCategory.name }}</strong> is your biggest expense category at 
              <strong>{{ $n(topCategory.amount) }} {{ finance.settings.value.default_currency }}</strong> 
              ({{ topCategory.percentage.toFixed(0) }}% of total)
            </p>
          </div>

          <!-- Savings Rate -->
          <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
            <div class="flex items-center gap-3 mb-2">
              <div class="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Icon name="heroicons:chart-pie" class="w-4 h-4 text-green-500" />
              </div>
              <span class="font-medium">Savings Rate</span>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-300">
              <template v-if="savingsRate >= 0">
                You're saving <strong>{{ savingsRate.toFixed(0) }}%</strong> of your income. 
                <span v-if="savingsRate >= 20">Great job! 🎉</span>
                <span v-else-if="savingsRate >= 10">Keep it up!</span>
                <span v-else>Try to save at least 20%</span>
              </template>
              <template v-else>
                You're spending more than you earn. Consider reducing expenses.
              </template>
            </p>
          </div>

          <!-- Average Daily Spending -->
          <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
            <div class="flex items-center gap-3 mb-2">
              <div class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Icon name="heroicons:calendar" class="w-4 h-4 text-blue-500" />
              </div>
              <span class="font-medium">Daily Average</span>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-300">
              You spend about <strong>{{ $n(Math.round(dailyAverage)) }} {{ finance.settings.value.default_currency }}</strong> per day on average.
            </p>
          </div>
        </div>
      </div>

      <!-- Category Breakdown -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
        <h3 class="text-lg font-semibold mb-4">Category Breakdown</h3>
        <div class="space-y-4">
          <div 
            v-for="cat in categoryBreakdown" 
            :key="cat.name"
            class="flex items-center gap-4"
          >
            <div 
              class="w-12 h-12 rounded-full flex items-center justify-center"
              :class="getCategoryBg(cat.name)"
            >
              <Icon :name="getCategoryIcon(cat.name)" class="w-6 h-6" :class="getCategoryIconColor(cat.name)" />
            </div>
            <div class="flex-1">
              <div class="flex items-center justify-between mb-1">
                <span class="font-medium">{{ cat.name }}</span>
                <span class="text-sm">
                  {{ $n(cat.amount) }} {{ finance.settings.value.default_currency }}
                </span>
              </div>
              <div class="flex items-center gap-2">
                <div class="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    class="h-full rounded-full bg-primary-500"
                    :style="{ width: `${cat.percentage}%` }"
                  />
                </div>
                <span class="text-xs text-gray-400 w-10">{{ cat.percentage.toFixed(0) }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const finance = useFinance()

// Period selector
const selectedPeriod = ref('month')
const periods = [
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'year', label: 'This Year' },
  { value: 'all', label: 'All Time' }
]

// Filter entries by period
const filteredEntries = computed(() => {
  const now = new Date()
  let startDate: Date

  switch (selectedPeriod.value) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      break
    case 'quarter':
      const quarter = Math.floor(now.getMonth() / 3)
      startDate = new Date(now.getFullYear(), quarter * 3, 1)
      break
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1)
      break
    default:
      return finance.entries.value
  }

  return finance.entries.value.filter(e => new Date(e.created_at) >= startDate)
})

// Period statistics
const periodStats = computed(() => {
  const income = filteredEntries.value
    .filter(e => e.type === 'income')
    .reduce((sum, e) => sum + e.amount_fiat, 0)
  
  const expenses = filteredEntries.value
    .filter(e => e.type === 'expense')
    .reduce((sum, e) => sum + e.amount_fiat, 0)

  const incomeSats = filteredEntries.value
    .filter(e => e.type === 'income')
    .reduce((sum, e) => sum + e.amount_sats, 0)
  
  const expensesSats = filteredEntries.value
    .filter(e => e.type === 'expense')
    .reduce((sum, e) => sum + e.amount_sats, 0)

  return {
    income,
    expenses,
    balance: income - expenses,
    balanceSats: incomeSats - expensesSats,
    incomeCount: filteredEntries.value.filter(e => e.type === 'income').length,
    expenseCount: filteredEntries.value.filter(e => e.type === 'expense').length
  }
})

// Category data for pie chart
const categoryData = computed(() => {
  const expenses = filteredEntries.value.filter(e => e.type === 'expense')
  const categories: Record<string, number> = {}
  
  expenses.forEach(e => {
    categories[e.category] = (categories[e.category] || 0) + e.amount_fiat
  })

  return Object.entries(categories).map(([name, value]) => ({
    name,
    value: Math.round(value)
  }))
})

// Category breakdown
const categoryBreakdown = computed(() => {
  const expenses = filteredEntries.value.filter(e => e.type === 'expense')
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

// Top category
const topCategory = computed(() => {
  return categoryBreakdown.value[0] || null
})

// Savings rate
const savingsRate = computed(() => {
  if (periodStats.value.income === 0) return 0
  return ((periodStats.value.income - periodStats.value.expenses) / periodStats.value.income) * 100
})

// Daily average spending
const dailyAverage = computed(() => {
  const days = selectedPeriod.value === 'week' ? 7 :
               selectedPeriod.value === 'month' ? 30 :
               selectedPeriod.value === 'quarter' ? 90 :
               selectedPeriod.value === 'year' ? 365 : 365
  return periodStats.value.expenses / days
})

// Monthly chart data
const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const currentYear = new Date().getFullYear()

const monthlyChart = computed(() => {
  const months: Record<string, { income: number; expense: number }> = {}
  monthLabels.forEach((_, i) => {
    months[`${currentYear}-${i + 1}`] = { income: 0, expense: 0 }
  })

  finance.entries.value.forEach(e => {
    const date = new Date(e.created_at)
    if (date.getFullYear() !== currentYear) return
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`
    if (!months[key]) return
    
    if (e.type === 'income') months[key].income += e.amount_fiat
    else months[key].expense += e.amount_fiat
  })

  return [
    {
      name: 'Income',
      type: 'bar',
      data: monthLabels.map((_, i) => months[`${currentYear}-${i + 1}`]?.income || 0),
      backgroundColor: '#22C55E'
    },
    {
      name: 'Expense',
      type: 'bar',
      data: monthLabels.map((_, i) => months[`${currentYear}-${i + 1}`]?.expense || 0),
      backgroundColor: '#EF4444'
    }
  ]
})

// Category styling helpers
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

// Export data
const exportData = () => {
  const data = filteredEntries.value.map(e => ({
    date: e.created_at,
    type: e.type,
    category: e.category,
    amount_fiat: e.amount_fiat,
    amount_sats: e.amount_sats,
    currency: e.fiat_currency,
    note: e.note
  }))
  
  const csv = [
    Object.keys(data[0] || {}).join(','),
    ...data.map(row => Object.values(row).join(','))
  ].join('\n')
  
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `locosats-report-${selectedPeriod.value}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// Load data
onMounted(() => {
  finance.loadEntries()
})

useHead({
  title: 'Reports - Sats Wallet'
})
</script>
