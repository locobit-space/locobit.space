<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        {{ $t('finance.money_management') }}
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        {{ $t('finance.track_expenses_income') }}
      </p>
    </div>

    <!-- Financial Overview Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ $t('finance.total_balance') }}
            </p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {{ formatCurrency(financialData.totalBalance) }}
            </p>
          </div>
          <div class="p-3 bg-green-100 dark:bg-green-900 rounded-full">
            <NuxtIcon name="mdi:wallet" class="text-2xl text-green-600 dark:text-green-400" />
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ $t('finance.monthly_income') }}
            </p>
            <p class="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
              +{{ formatCurrency(financialData.monthlyIncome) }}
            </p>
          </div>
          <div class="p-3 bg-green-100 dark:bg-green-900 rounded-full">
            <NuxtIcon name="mdi:arrow-up-circle" class="text-2xl text-green-600 dark:text-green-400" />
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ $t('finance.monthly_expenses') }}
            </p>
            <p class="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
              -{{ formatCurrency(financialData.monthlyExpenses) }}
            </p>
          </div>
          <div class="p-3 bg-red-100 dark:bg-red-900 rounded-full">
            <NuxtIcon name="mdi:arrow-down-circle" class="text-2xl text-red-600 dark:text-red-400" />
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ $t('finance.savings_rate') }}
            </p>
            <p class="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
              {{ financialData.savingsRate }}%
            </p>
          </div>
          <div class="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
            <NuxtIcon name="mdi:piggy-bank" class="text-2xl text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </UCard>
    </div>

    <!-- Main Content Tabs -->
    <UTabs v-model="selectedTab" :items="tabItems" class="mb-6">
      <!-- Transactions Tab -->
      <template #transactions>
        <UCard>
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
              {{ $t('finance.recent_transactions') }}
            </h2>
            <div class="flex gap-2 w-full md:w-auto">
              <UButton
                icon="i-heroicons-funnel"
                color="gray"
                variant="soft"
                @click="showFilterModal = true"
              >
                {{ $t('common.filter') }}
              </UButton>
              <UButton
                icon="i-heroicons-plus"
                @click="showAddTransactionModal = true"
              >
                {{ $t('finance.add_transaction') }}
              </UButton>
            </div>
          </div>

          <!-- Transactions Table -->
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {{ $t('finance.date') }}
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {{ $t('finance.description') }}
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {{ $t('finance.category') }}
                  </th>
                  <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {{ $t('finance.amount') }}
                  </th>
                  <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {{ $t('common.actions') }}
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-for="transaction in transactions" :key="transaction.id" class="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {{ formatDate(transaction.date) }}
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {{ transaction.description }}
                  </td>
                  <td class="px-4 py-3">
                    <span class="px-2 py-1 text-xs rounded-full" :class="getCategoryClass(transaction.category)">
                      {{ $t(`finance.categories.${transaction.category}`) }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-sm text-right font-semibold" :class="transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                    {{ transaction.type === 'income' ? '+' : '-' }}{{ formatCurrency(transaction.amount) }}
                  </td>
                  <td class="px-4 py-3 text-center">
                    <UDropdown :items="getTransactionActions(transaction)">
                      <UButton color="gray" variant="ghost" icon="i-heroicons-ellipsis-vertical" />
                    </UDropdown>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </UCard>
      </template>

      <!-- Journey Tab -->
      <template #journey>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Journey Timeline -->
          <div class="lg:col-span-2">
            <UCard>
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {{ $t('finance.financial_journey') }}
              </h2>
              
              <div class="space-y-6">
                <div v-for="milestone in journeyMilestones" :key="milestone.id" class="flex gap-4">
                  <div class="flex flex-col items-center">
                    <div class="p-2 rounded-full" :class="milestone.completed ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-800'">
                      <NuxtIcon 
                        :name="milestone.icon" 
                        class="text-xl"
                        :class="milestone.completed ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-600'"
                      />
                    </div>
                    <div v-if="milestone.id !== journeyMilestones.length" class="w-0.5 h-16 bg-gray-200 dark:bg-gray-700"></div>
                  </div>
                  
                  <div class="flex-1 pb-6">
                    <div class="flex items-center justify-between mb-2">
                      <h3 class="font-semibold text-gray-900 dark:text-white">
                        {{ $t(`finance.milestones.${milestone.key}`) }}
                      </h3>
                      <span v-if="milestone.completed" class="text-xs text-green-600 dark:text-green-400">
                        {{ $t('common.completed') }}
                      </span>
                    </div>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {{ $t(`finance.milestones.${milestone.key}_desc`) }}
                    </p>
                    <div v-if="!milestone.completed" class="mt-3">
                      <div class="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                        <span>{{ $t('common.progress') }}</span>
                        <span>{{ milestone.progress }}%</span>
                      </div>
                      <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          class="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all" 
                          :style="{ width: `${milestone.progress}%` }"
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </UCard>
          </div>

          <!-- Goals & Insights -->
          <div class="space-y-6">
            <UCard>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {{ $t('finance.financial_goals') }}
              </h3>
              <div class="space-y-4">
                <div v-for="goal in financialGoals" :key="goal.id">
                  <div class="flex justify-between items-center mb-2">
                    <span class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ $t(`finance.goals.${goal.key}`) }}
                    </span>
                    <span class="text-xs text-gray-600 dark:text-gray-400">
                      {{ formatCurrency(goal.current) }} / {{ formatCurrency(goal.target) }}
                    </span>
                  </div>
                  <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      class="h-2 rounded-full transition-all" 
                      :class="getGoalProgressClass(goal.current, goal.target)"
                      :style="{ width: `${Math.min((goal.current / goal.target) * 100, 100)}%` }"
                    ></div>
                  </div>
                </div>
              </div>
              <UButton block class="mt-4" color="gray" variant="soft" @click="showGoalsModal = true">
                {{ $t('finance.manage_goals') }}
              </UButton>
            </UCard>

            <UCard>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {{ $t('finance.spending_insights') }}
              </h3>
              <div class="space-y-3">
                <div v-for="insight in spendingInsights" :key="insight.category" class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: insight.color }"></div>
                    <span class="text-sm text-gray-700 dark:text-gray-300">
                      {{ $t(`finance.categories.${insight.category}`) }}
                    </span>
                  </div>
                  <span class="text-sm font-semibold text-gray-900 dark:text-white">
                    {{ insight.percentage }}%
                  </span>
                </div>
              </div>
            </UCard>
          </div>
        </div>
      </template>

      <!-- Budget Tab -->
      <template #budget>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UCard v-for="budget in budgets" :key="budget.category">
            <div class="flex justify-between items-start mb-4">
              <div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  {{ $t(`finance.categories.${budget.category}`) }}
                </h3>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {{ formatCurrency(budget.spent) }} {{ $t('finance.of') }} {{ formatCurrency(budget.limit) }}
                </p>
              </div>
              <UButton color="gray" variant="ghost" icon="i-heroicons-pencil" size="sm" />
            </div>
            
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2">
              <div 
                class="h-3 rounded-full transition-all" 
                :class="getBudgetProgressClass(budget.spent, budget.limit)"
                :style="{ width: `${Math.min((budget.spent / budget.limit) * 100, 100)}%` }"
              ></div>
            </div>
            
            <div class="flex justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>{{ ((budget.spent / budget.limit) * 100).toFixed(0) }}% {{ $t('common.used') }}</span>
              <span>{{ formatCurrency(budget.limit - budget.spent) }} {{ $t('finance.remaining') }}</span>
            </div>
          </UCard>
        </div>
      </template>
    </UTabs>

    <!-- Add Transaction Modal -->
    <UModal v-model="showAddTransactionModal">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ $t('finance.add_transaction') }}
          </h3>
        </template>

        <UForm :state="newTransaction" @submit="handleAddTransaction" class="space-y-4">
          <UFormGroup :label="$t('finance.transaction_type')" required>
            <USelect 
              v-model="newTransaction.type" 
              :items="transactionTypes"
              option-attribute="label"
              value-attribute="value"
            />
          </UFormGroup>

          <UFormGroup :label="$t('finance.description')" required>
            <UInput v-model="newTransaction.description" :placeholder="$t('finance.description_placeholder')" />
          </UFormGroup>

          <UFormGroup :label="$t('finance.amount')" required>
            <UInput v-model="newTransaction.amount" type="number" :placeholder="'0.00'" />
          </UFormGroup>

          <UFormGroup :label="$t('finance.category')" required>
            <USelect 
              v-model="newTransaction.category" 
              :items="categoryOptions"
              option-attribute="label"
              value-attribute="value"
            />
          </UFormGroup>

          <UFormGroup :label="$t('finance.date')" required>
            <UInput v-model="newTransaction.date" type="date" />
          </UFormGroup>

          <div class="flex justify-end gap-2 pt-4">
            <UButton color="gray" variant="soft" @click="showAddTransactionModal = false">
              {{ $t('common.cancel') }}
            </UButton>
            <UButton type="submit">
              {{ $t('common.save') }}
            </UButton>
          </div>
        </UForm>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// Tab configuration
const selectedTab = ref(0)
const tabItems = [
  { label: t('finance.transactions'), value: 'transactions', slot: 'transactions' },
  { label: t('finance.journey'), value: 'journey', slot: 'journey' },
  { label: t('finance.budget'), value: 'budget', slot: 'budget' }
]

// Financial overview data
const financialData = ref({
  totalBalance: 45780.50,
  monthlyIncome: 8500.00,
  monthlyExpenses: 6320.40,
  savingsRate: 25.6
})

// Transactions data
const transactions = ref([
  { id: 1, date: '2025-10-22', description: 'Salary Payment', category: 'salary', amount: 8500.00, type: 'income' },
  { id: 2, date: '2025-10-21', description: 'Grocery Shopping', category: 'food', amount: 156.80, type: 'expense' },
  { id: 3, date: '2025-10-20', description: 'Electricity Bill', category: 'utilities', amount: 89.50, type: 'expense' },
  { id: 4, date: '2025-10-19', description: 'Freelance Project', category: 'freelance', amount: 1200.00, type: 'income' },
  { id: 5, date: '2025-10-18', description: 'Restaurant Dinner', category: 'food', amount: 65.00, type: 'expense' },
  { id: 6, date: '2025-10-17', description: 'Gas Station', category: 'transportation', amount: 45.00, type: 'expense' }
])

// Journey milestones
const journeyMilestones = ref([
  { id: 1, key: 'emergency_fund', icon: 'mdi:shield-check', completed: true, progress: 100 },
  { id: 2, key: 'debt_free', icon: 'mdi:credit-card-off', completed: true, progress: 100 },
  { id: 3, key: 'investment_start', icon: 'mdi:chart-line', completed: false, progress: 65 },
  { id: 4, key: 'house_down_payment', icon: 'mdi:home', completed: false, progress: 35 },
  { id: 5, key: 'retirement_ready', icon: 'mdi:palm-tree', completed: false, progress: 12 }
])

// Financial goals
const financialGoals = ref([
  { id: 1, key: 'emergency_fund', current: 15000, target: 15000 },
  { id: 2, key: 'vacation', current: 2500, target: 5000 },
  { id: 3, key: 'new_car', current: 8000, target: 20000 }
])

// Spending insights
const spendingInsights = ref([
  { category: 'food', percentage: 28, color: '#10b981' },
  { category: 'transportation', percentage: 22, color: '#3b82f6' },
  { category: 'utilities', percentage: 18, color: '#f59e0b' },
  { category: 'entertainment', percentage: 15, color: '#8b5cf6' },
  { category: 'other', percentage: 17, color: '#6b7280' }
])

// Budget data
const budgets = ref([
  { category: 'food', spent: 1680, limit: 2000 },
  { category: 'transportation', spent: 450, limit: 500 },
  { category: 'utilities', spent: 380, limit: 400 },
  { category: 'entertainment', spent: 280, limit: 300 }
])

// Modals
const showAddTransactionModal = ref(false)
const showFilterModal = ref(false)
const showGoalsModal = ref(false)

// New transaction form
const newTransaction = ref({
  type: 'expense',
  description: '',
  amount: 0,
  category: 'food',
  date: new Date().toISOString().split('T')[0]
})

const transactionTypes = [
  { label: t('finance.income'), value: 'income' },
  { label: t('finance.expense'), value: 'expense' }
]

const categoryOptions = [
  { label: t('finance.categories.salary'), value: 'salary' },
  { label: t('finance.categories.freelance'), value: 'freelance' },
  { label: t('finance.categories.food'), value: 'food' },
  { label: t('finance.categories.transportation'), value: 'transportation' },
  { label: t('finance.categories.utilities'), value: 'utilities' },
  { label: t('finance.categories.entertainment'), value: 'entertainment' },
  { label: t('finance.categories.other'), value: 'other' }
]

// Helper functions
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const getCategoryClass = (category: string) => {
  const classes: Record<string, string> = {
    salary: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
    freelance: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
    food: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200',
    transportation: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
    utilities: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
    entertainment: 'bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200',
    other: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
  }
  return classes[category] || classes.other
}

const getGoalProgressClass = (current: number, target: number) => {
  const percentage = (current / target) * 100
  if (percentage >= 100) return 'bg-green-600 dark:bg-green-500'
  if (percentage >= 75) return 'bg-blue-600 dark:bg-blue-500'
  if (percentage >= 50) return 'bg-yellow-600 dark:bg-yellow-500'
  return 'bg-orange-600 dark:bg-orange-500'
}

const getBudgetProgressClass = (spent: number, limit: number) => {
  const percentage = (spent / limit) * 100
  if (percentage >= 90) return 'bg-red-600 dark:bg-red-500'
  if (percentage >= 75) return 'bg-orange-600 dark:bg-orange-500'
  if (percentage >= 50) return 'bg-yellow-600 dark:bg-yellow-500'
  return 'bg-green-600 dark:bg-green-500'
}

const getTransactionActions = (transaction: any) => [
  [{
    label: t('common.edit'),
    icon: 'i-heroicons-pencil',
    click: () => console.log('Edit', transaction.id)
  }],
  [{
    label: t('common.delete'),
    icon: 'i-heroicons-trash',
    click: () => console.log('Delete', transaction.id)
  }]
]

const handleAddTransaction = () => {
  console.log('Adding transaction:', newTransaction.value)
  showAddTransactionModal.value = false
  // Reset form
  newTransaction.value = {
    type: 'expense',
    description: '',
    amount: 0,
    category: 'food',
    date: new Date().toISOString().split('T')[0]
  }
}
</script>