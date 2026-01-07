<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <!-- Sync Status Bar -->
    <div
      v-if="
        finance.syncStatus.value.isSyncing || finance.syncStatus.value.hasError
      "
      class="bg-blue-500 dark:bg-blue-600 text-white px-4 py-2 text-xs sm:text-sm text-center"
    >
      <Icon
        v-if="finance.syncStatus.value.isSyncing"
        name="svg-spinners:ring-resize"
        class="w-3.5 h-3.5 inline mr-1.5"
      />
      <Icon
        v-else-if="finance.syncStatus.value.hasError"
        name="heroicons:exclamation-triangle"
        class="w-3.5 h-3.5 inline mr-1.5"
      />
      <span v-if="finance.syncStatus.value.isSyncing"
        >Syncing with Nostr...</span
      >
      <span v-else-if="finance.syncStatus.value.hasError">
        Sync failed.
        <button @click="finance.retrySync()" class="underline ml-1">
          Retry
        </button>
      </span>
    </div>

    <!-- Header with Balance -->
    <div
      class="border-b border-gray-200 dark:border-gray-800 bg-gradient-to-br from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700"
    >
      <div class="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <!-- Balance Card -->
        <div class="text-center mb-5 sm:mb-6">
          <div class="flex items-center justify-center gap-2 mb-2">
            <p class="text-white/80 text-xs sm:text-sm">
              {{ $t("finance.total_balance") }}
            </p>
            <Icon
              v-if="finance.syncStatus.value.pendingCount > 0"
              name="heroicons:cloud-arrow-up"
              class="w-4 h-4 text-white/60 animate-pulse"
              
            />
          </div>
          <div class="text-4xl sm:text-5xl font-bold text-white mb-2">
            <template v-if="finance.settings.value.display_unit === 'sats'">
              <Icon
                name="lets-icons:lightning-light"
                class="w-8 h-8 sm:w-10 sm:h-10 inline text-amber-400"
              />
              {{ $n(Math.round(finance.totals.value.balanceSats)) }}
              <span class="text-xl sm:text-2xl text-white/80">sats</span>
            </template>
            <template v-else>
              {{
                $n(finance.totals.value.balance, "currency", {
                  currency: finance.settings.value.default_currency,
                })
              }}
            </template>
          </div>
          <button
            @click="finance.toggleDisplayUnit"
            class="text-white/70 text-xs sm:text-sm hover:text-white transition-colors inline-flex items-center gap-1"
          >
            <Icon name="heroicons:arrows-right-left" class="w-3.5 h-3.5" />
            <span v-if="finance.settings.value.display_unit === 'sats'">
              ≈ {{ $n(finance.totals.value.balance) }}
              {{ finance.settings.value.default_currency }}
            </span>
            <span v-else>
              ≈ {{ $n(Math.round(finance.totals.value.balanceSats)) }} sats
            </span>
          </button>
        </div>

        <!-- Income / Expense Summary -->
        <div class="grid grid-cols-2 gap-3 sm:gap-4">
          <div
            class="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3.5"
          >
            <div class="flex items-center gap-2 mb-1.5">
              <div
                class="w-7 h-7 rounded-full bg-green-400/20 flex items-center justify-center"
              >
                <Icon
                  name="heroicons:arrow-down-left"
                  class="w-4 h-4 text-green-100"
                />
              </div>
              <span class="text-white/80 text-xs">{{
                $t("finance.income")
              }}</span>
            </div>
            <div class="text-lg sm:text-xl font-semibold text-green-100">
              <span v-if="finance.settings.value.display_unit === 'sats'">
                +{{ $n(Math.round(finance.totals.value.incomeSats)) }} sats
              </span>
              <span v-else>
                +{{ $n(finance.totals.value.income) }}
                {{ finance.settings.value.default_currency }}
              </span>
            </div>
          </div>
          <div
            class="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3.5"
          >
            <div class="flex items-center gap-2 mb-1.5">
              <div
                class="w-7 h-7 rounded-full bg-red-400/20 flex items-center justify-center"
              >
                <Icon
                  name="heroicons:arrow-up-right"
                  class="w-4 h-4 text-red-100"
                />
              </div>
              <span class="text-white/80 text-xs">{{
                $t("finance.expenses")
              }}</span>
            </div>
            <div class="text-lg sm:text-xl font-semibold text-red-100">
              <span v-if="finance.settings.value.display_unit === 'sats'">
                -{{ $n(Math.round(finance.totals.value.expensesSats)) }} sats
              </span>
              <span v-else>
                -{{ $n(finance.totals.value.expenses) }}
                {{ finance.settings.value.default_currency }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-4xl mx-auto px-4 py-5">
      <!-- Search Bar -->
      <div class="mb-5">
        <div class="relative">
          <Icon
            name="heroicons:magnifying-glass"
            class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400"
          />

          <UInput
            v-model="searchQuery"
            type="text"
            :placeholder="$t('common.search') + ' transactions...'"
            icon="heroicons:magnifying-glass"
            class="w-full"
          />
        </div>

        <!-- Filter Chips -->
        <div
          v-if="hasActiveFilters"
          class="flex items-center gap-2 mt-3 flex-wrap"
        >
          <button
            v-for="filter in activeFilters"
            :key="filter.key"
            @click="removeFilter(filter.key)"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg text-xs font-medium hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
          >
            {{ filter.label }}
            <Icon name="heroicons:x-mark" class="w-3 h-3" />
          </button>
          <button
            @click="clearFilters"
            class="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Clear all
          </button>
        </div>
      </div>

      <!-- Quick Actions -->
      <div
        class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-3 sm:p-4 mb-5 shadow-sm"
      >
        <div class="grid grid-cols-4 gap-1.5 sm:gap-2">
          <NuxtLink
            to="/locosats/create?type=expense"
            class="flex flex-col items-center gap-1.5 sm:gap-2 p-2.5 sm:p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all active:scale-95"
          >
            <div
              class="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-md"
            >
              <Icon
                name="heroicons:minus"
                class="w-5 h-5 sm:w-6 sm:h-6 text-white"
              />
            </div>
            <span
              class="text-xs font-medium text-gray-700 dark:text-gray-300"
              >{{ $t("finance.expense") }}</span
            >
          </NuxtLink>
          <NuxtLink
            to="/locosats/create?type=income"
            class="flex flex-col items-center gap-1.5 sm:gap-2 p-2.5 sm:p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all active:scale-95"
          >
            <div
              class="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-md"
            >
              <Icon
                name="heroicons:plus"
                class="w-5 h-5 sm:w-6 sm:h-6 text-white"
              />
            </div>
            <span
              class="text-xs font-medium text-gray-700 dark:text-gray-300"
              >{{ $t("finance.income") }}</span
            >
          </NuxtLink>
          <NuxtLink
            to="/locosats/report"
            class="flex flex-col items-center gap-1.5 sm:gap-2 p-2.5 sm:p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all active:scale-95"
          >
            <div
              class="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md"
            >
              <Icon
                name="heroicons:chart-bar"
                class="w-5 h-5 sm:w-6 sm:h-6 text-white"
              />
            </div>
            <span
              class="text-xs font-medium text-gray-700 dark:text-gray-300"
              >{{ $t("finance.reports") }}</span
            >
          </NuxtLink>
          <NuxtLink
            to="/settings/locosats"
            class="flex flex-col items-center gap-1.5 sm:gap-2 p-2.5 sm:p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all active:scale-95"
          >
            <div
              class="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center shadow-md"
            >
              <Icon
                name="heroicons:cog-6-tooth"
                class="w-5 h-5 sm:w-6 sm:h-6 text-white"
              />
            </div>
            <span
              class="text-xs font-medium text-gray-700 dark:text-gray-300"
              >{{ $t("common.settings", "Settings") }}</span
            >
          </NuxtLink>
        </div>
      </div>

      <!-- Budget Goals (if any) -->
      <div
        v-if="budgetGoals.length"
        class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-5 mb-5 shadow-sm"
      >
        <div class="flex items-center justify-between mb-4">
          <h3
            class="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"
          >
            <Icon name="heroicons:chart-pie" class="w-4 h-4 text-primary-500" />
            {{ $t("finance.budget_goals") }}
          </h3>
          <NuxtLink
            to="/locosats/budgets"
            class="text-xs text-primary-500 hover:text-primary-600 flex items-center gap-1"
          >
            Manage
            <Icon name="heroicons:chevron-right" class="w-3 h-3" />
          </NuxtLink>
        </div>
        <div class="space-y-4">
          <div
            v-for="goal in budgetGoals"
            :key="goal.category"
            class="space-y-2"
          >
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-2">
                <div
                  class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  :class="getCategoryBg(goal.category)"
                >
                  <Icon
                    :name="getCategoryIcon(goal.category)"
                    class="w-4 h-4"
                    :class="getCategoryIconColor(goal.category)"
                  />
                </div>
                <div>
                  <span
                    class="text-sm font-medium text-gray-700 dark:text-gray-300"
                    >{{ goal.category }}</span
                  >
                  <div class="text-xs text-gray-500 dark:text-gray-400">
                    {{
                      goal.budget.period === "monthly"
                        ? "Monthly budget"
                        : goal.budget.period + " budget"
                    }}
                  </div>
                </div>
              </div>
              <div class="text-right">
                <div
                  :class="
                    goal.percentage > 100
                      ? 'text-red-600 dark:text-red-400 font-bold'
                      : goal.percentage > goal.budget.alert_threshold
                      ? 'text-amber-600 dark:text-amber-400 font-semibold'
                      : 'text-gray-600 dark:text-gray-400'
                  "
                  class="text-sm"
                >
                  {{ $n(goal.spent) }} / {{ $n(goal.budget.amount) }}
                </div>
                <div class="text-xs text-gray-400">
                  {{ goal.percentage.toFixed(0) }}%
                </div>
              </div>
            </div>
            <div
              class="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden"
            >
              <div
                class="h-full rounded-full transition-all duration-500"
                :class="
                  goal.percentage > 100
                    ? 'bg-gradient-to-r from-red-500 to-red-600'
                    : goal.percentage > goal.budget.alert_threshold
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600'
                    : 'bg-gradient-to-r from-green-500 to-green-600'
                "
                :style="{ width: `${Math.min(goal.percentage, 100)}%` }"
              />
            </div>
            <div
              v-if="goal.percentage > goal.budget.alert_threshold"
              class="flex items-start gap-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg"
            >
              <Icon
                name="heroicons:exclamation-triangle"
                class="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5"
              />
              <div class="flex-1">
                <p class="text-xs text-amber-700 dark:text-amber-300">
                  <span v-if="goal.percentage > 100">
                    You've exceeded your budget by
                    {{ $n(goal.spent - goal.budget.amount) }}
                    {{ finance.settings.value.default_currency }}!
                  </span>
                  <span v-else>
                    You're approaching your budget limit.
                    {{ $n(goal.budget.amount - goal.spent) }}
                    {{ finance.settings.value.default_currency }} remaining.
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Transactions -->
      <div
        class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm"
      >
        <div
          class="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between"
        >
          <h3
            class="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"
          >
            <Icon name="heroicons:clock" class="w-4 h-4 text-primary-500" />
            {{ $t("finance.recent_transactions") }}
          </h3>
          <NuxtLink
            to="/locosats/transactions"
            class="text-primary-500 text-xs hover:underline flex items-center gap-1"
          >
            {{ $t("common.view_all") }}
            <Icon name="heroicons:chevron-right" class="w-3 h-3" />
          </NuxtLink>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="p-8 space-y-4">
          <div
            v-for="i in 3"
            :key="i"
            class="animate-pulse flex items-center gap-3"
          >
            <div
              class="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"
            ></div>
            <div class="flex-1 space-y-2">
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
          </div>
        </div>

        <!-- Transaction List -->
        <div
          v-else-if="displayedTransactions.length"
          class="divide-y divide-gray-100 dark:divide-gray-800"
        >
          <div
            v-for="entry in displayedTransactions"
            :key="entry.id"
            class="p-3.5 sm:p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all cursor-pointer active:scale-[0.99] group"
            @click="viewTransaction(entry)"
          >
            <div
              class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm group-hover:shadow-md transition-shadow"
              :class="getCategoryBg(entry.category)"
            >
              <Icon
                :name="getCategoryIcon(entry.category)"
                class="w-5 h-5"
                :class="getCategoryIconColor(entry.category)"
              />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <div
                  class="font-medium text-sm text-gray-900 dark:text-white truncate"
                >
                  {{ entry.category }}
                </div>
                <Icon
                  v-if="!entry.synced"
                  name="heroicons:cloud-arrow-up"
                  class="w-3.5 h-3.5 text-gray-400 animate-pulse"
                />
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400 truncate">
                {{ entry.note || $t("finance.no_note") }}
              </div>
              <div
                v-if="entry.tags && entry.tags.length"
                class="flex gap-1 mt-1"
              >
                <span
                  v-for="tag in entry.tags.slice(0, 2)"
                  :key="tag"
                  class="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-400"
                >
                  #{{ tag }}
                </span>
                <span
                  v-if="entry.tags.length > 2"
                  class="text-xs text-gray-400"
                >
                  +{{ entry.tags.length - 2 }}
                </span>
              </div>
            </div>
            <div class="text-right">
              <div
                class="font-semibold text-sm whitespace-nowrap"
                :class="
                  entry.type === 'income'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                "
              >
                {{ entry.type === "income" ? "+" : "-" }}
                <span v-if="finance.settings.value.display_unit === 'sats'">
                  {{ $n(Math.round(entry.amount_sats)) }}
                  <span class="text-xs">sats</span>
                </span>
                <span v-else>
                  {{ $n(entry.amount_fiat) }}
                  <span class="text-xs opacity-80">{{
                    entry.fiat_currency
                  }}</span>
                </span>
              </div>
              <div class="text-xs text-gray-400 mt-0.5">
                {{ formatRelativeDate(entry.created_at) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="p-12 text-center">
          <div
            class="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center"
          >
            <Icon name="heroicons:banknotes" class="w-8 h-8 text-gray-400" />
          </div>
          <h3 class="text-base font-medium mb-2 text-gray-900 dark:text-white">
            {{ $t("finance.no_transactions") }}
          </h3>
          <p
            class="text-gray-500 dark:text-gray-400 text-sm mb-5 max-w-xs mx-auto"
          >
            {{ $t("finance.no_transactions_desc") }}
          </p>
          <UButton
            color="primary"
            size="md"
            @click="$router.push('/locosats/create?type=expense')"
          >
            <Icon name="heroicons:plus" class="w-4 h-4 mr-2" />
            {{ $t("finance.add_first") }}
          </UButton>
        </div>
      </div>

      <!-- Spending by Category (mini chart) -->
      <div
        v-if="categoryBreakdown.length"
        class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-5 mt-5 shadow-sm"
      >
        <h3
          class="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"
        >
          <Icon name="heroicons:chart-pie" class="w-4 h-4 text-primary-500" />
          {{ $t("finance.spending_by_category") }}
        </h3>
        <div class="space-y-3">
          <div
            v-for="cat in categoryBreakdown.slice(0, 5)"
            :key="cat.name"
            class="flex items-center gap-3"
          >
            <div
              class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-sm"
              :class="getCategoryBg(cat.name)"
            >
              <Icon
                :name="getCategoryIcon(cat.name)"
                class="w-4.5 h-4.5"
                :class="getCategoryIconColor(cat.name)"
              />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between mb-1">
                <span
                  class="text-xs font-medium text-gray-700 dark:text-gray-300"
                  >{{ cat.name }}</span
                >
                <div class="text-right">
                  <span
                    class="text-xs font-semibold text-gray-900 dark:text-white"
                  >
                    {{ $n(cat.amount) }}
                    {{ finance.settings.value.default_currency }}
                  </span>
                  <span class="text-xs text-gray-400 ml-1.5">
                    ({{ cat.percentage.toFixed(0) }}%)
                  </span>
                </div>
              </div>
              <div
                class="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden"
              >
                <div
                  class="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500"
                  :style="{ width: `${cat.percentage}%` }"
                />
              </div>
            </div>
          </div>
          <NuxtLink
            v-if="categoryBreakdown.length > 5"
            to="/locosats/report"
            class="block text-center text-xs text-primary-500 hover:text-primary-600 mt-3 py-2"
          >
            View all {{ categoryBreakdown.length }} categories →
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Floating Action Button -->
    <NuxtLink
      to="/locosats/create"
      class="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 flex items-center justify-center z-50 active:scale-95"
    >
      <Icon name="heroicons:plus" class="w-7 h-7" />
    </NuxtLink>

    <!-- Transaction Detail Modal -->
    <UModal v-model:open="showDetailModal" :ui="{ width: 'sm:max-w-md' }">
      <template #default>
        <div v-if="selectedTransaction" class="p-6">
          <div class="flex items-start justify-between mb-5">
            <div class="flex items-center gap-3">
              <div
                class="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
                :class="getCategoryBg(selectedTransaction.category)"
              >
                <Icon
                  :name="getCategoryIcon(selectedTransaction.category)"
                  class="w-6 h-6"
                  :class="getCategoryIconColor(selectedTransaction.category)"
                />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  {{ selectedTransaction.category }}
                </h3>
                <p class="text-xs text-gray-500">
                  {{ formatRelativeDate(selectedTransaction.created_at) }}
                </p>
              </div>
            </div>
            <button
              @click="showDetailModal = false"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <Icon name="heroicons:x-mark" class="w-5 h-5" />
            </button>
          </div>

          <div class="space-y-4 mb-6">
            <!-- Amount -->
            <div>
              <label class="text-xs text-gray-500 dark:text-gray-400 block mb-1"
                >Amount</label
              >
              <div
                class="text-3xl font-bold"
                :class="
                  selectedTransaction.type === 'income'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                "
              >
                {{ selectedTransaction.type === "income" ? "+" : "-" }}
                {{ $n(selectedTransaction.amount_fiat) }}
                {{ selectedTransaction.fiat_currency }}
              </div>
              <div class="text-sm text-gray-500 mt-1">
                ≈ {{ $n(Math.round(selectedTransaction.amount_sats)) }} sats
              </div>
            </div>

            <!-- Note -->
            <div v-if="selectedTransaction.note">
              <label class="text-xs text-gray-500 dark:text-gray-400 block mb-1"
                >Note</label
              >
              <p class="text-sm text-gray-700 dark:text-gray-300">
                {{ selectedTransaction.note }}
              </p>
            </div>

            <!-- Tags -->
            <div
              v-if="selectedTransaction.tags && selectedTransaction.tags.length"
            >
              <label
                class="text-xs text-gray-500 dark:text-gray-400 block mb-1.5"
                >Tags</label
              >
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="tag in selectedTransaction.tags"
                  :key="tag"
                  class="text-xs px-2 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg"
                >
                  #{{ tag }}
                </span>
              </div>
            </div>

            <!-- Exchange Rate -->
            <div>
              <label class="text-xs text-gray-500 dark:text-gray-400 block mb-1"
                >Exchange Rate</label
              >
              <p class="text-sm text-gray-700 dark:text-gray-300">
                {{ selectedTransaction.sats_per_fiat }} sats per
                {{ selectedTransaction.fiat_currency }}
              </p>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-2">
            <UButton
              color="gray"
              variant="soft"
              class="flex-1"
              @click="editTransactionHandler(selectedTransaction.id)"
            >
              <Icon name="heroicons:pencil" class="w-4 h-4 mr-2" />
              Edit
            </UButton>
            <UButton
              color="red"
              variant="soft"
              class="flex-1"
              @click="deleteTransactionHandler(selectedTransaction.id)"
            >
              <Icon name="heroicons:trash" class="w-4 h-4 mr-2" />
              Delete
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { FinanceEntry } from "~/types";

const finance = useFinance();
const { t } = useI18n();
const router = useRouter();
const toast = useToast();

// State
const isLoading = ref(false);
const searchQuery = ref("");
const showDetailModal = ref(false);
const selectedTransaction = ref<FinanceEntry | null>(null);

// Search and Filter
const displayedTransactions = computed(() => {
  let filtered = [...finance.entries.value];

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (entry) =>
        entry.note.toLowerCase().includes(query) ||
        entry.category.toLowerCase().includes(query) ||
        entry.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  }

  return filtered.slice(0, 10);
});

const hasActiveFilters = computed(() => searchQuery.value.length > 0);

const activeFilters = computed(() => {
  const filters = [];
  if (searchQuery.value) {
    filters.push({ key: "search", label: `"${searchQuery.value}"` });
  }
  return filters;
});

const removeFilter = (key: string) => {
  if (key === "search") searchQuery.value = "";
};

const clearFilters = () => {
  searchQuery.value = "";
};

// Budget Goals with enhanced logic
const budgetGoals = computed(() => {
  if (
    !finance.settings.value.budgets ||
    finance.settings.value.budgets.length === 0
  ) {
    return [];
  }

  return finance.settings.value.budgets
    .map((budget) => {
      const progress = finance.getBudgetProgress(
        budget.category,
        budget.period
      );
      if (!progress || progress.spent === 0) return null;

      return {
        category: budget.category,
        budget: budget,
        spent: progress.spent,
        percentage: progress.percentage,
      };
    })
    .filter(Boolean);
});

// Category Breakdown
const categoryBreakdown = computed(() => {
  const expenses = finance.entries.value.filter((e) => e.type === "expense");
  const total = expenses.reduce((sum, e) => sum + e.amount_fiat, 0);

  const categories: Record<string, number> = {};
  expenses.forEach((e) => {
    categories[e.category] = (categories[e.category] || 0) + e.amount_fiat;
  });

  return Object.entries(categories)
    .map(([name, amount]) => ({
      name,
      amount,
      percentage: total > 0 ? (amount / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
});

// View Transaction
const viewTransaction = (entry: FinanceEntry) => {
  selectedTransaction.value = entry;
  showDetailModal.value = true;
};

const editTransactionHandler = (id: string) => {
  router.push(`/locosats/edit/${id}`);
  showDetailModal.value = false;
};

const deleteTransactionHandler = async (id: string) => {
  if (!confirm("Are you sure you want to delete this transaction?")) return;

  try {
    finance.deleteEntry(id);
    showDetailModal.value = false;
    toast.add({
      title: "Transaction deleted",
      description: "The transaction has been removed successfully",
    });
  } catch (err) {
    toast.add({
      title: "Error",
      description: "Failed to delete transaction",
      color: "red",
    });
  }
};

// Category Styling
const getCategoryIcon = (category: string) => {
  const icons: Record<string, string> = {
    Food: "heroicons:cake",
    Groceries: "heroicons:shopping-cart",
    Transport: "heroicons:truck",
    Entertainment: "heroicons:tv",
    Shopping: "heroicons:shopping-bag",
    Bills: "heroicons:document-text",
    Health: "heroicons:heart",
    Salary: "heroicons:banknotes",
    Freelance: "heroicons:computer-desktop",
    Investments: "heroicons:chart-bar-square",
    Other: "heroicons:ellipsis-horizontal-circle",
  };
  return icons[category] || icons.Other;
};

const getCategoryBg = (category: string) => {
  const bgs: Record<string, string> = {
    Food: "bg-orange-50 dark:bg-orange-900/20",
    Groceries: "bg-green-50 dark:bg-green-900/20",
    Transport: "bg-blue-50 dark:bg-blue-900/20",
    Entertainment: "bg-purple-50 dark:bg-purple-900/20",
    Shopping: "bg-pink-50 dark:bg-pink-900/20",
    Bills: "bg-gray-100 dark:bg-gray-800",
    Health: "bg-red-50 dark:bg-red-900/20",
    Salary: "bg-emerald-50 dark:bg-emerald-900/20",
    Freelance: "bg-cyan-50 dark:bg-cyan-900/20",
    Investments: "bg-indigo-50 dark:bg-indigo-900/20",
    Other: "bg-gray-100 dark:bg-gray-800",
  };
  return bgs[category] || bgs.Other;
};

const getCategoryIconColor = (category: string) => {
  const colors: Record<string, string> = {
    Food: "text-orange-600 dark:text-orange-400",
    Groceries: "text-green-600 dark:text-green-400",
    Transport: "text-blue-600 dark:text-blue-400",
    Entertainment: "text-purple-600 dark:text-purple-400",
    Shopping: "text-pink-600 dark:text-pink-400",
    Bills: "text-gray-600 dark:text-gray-400",
    Health: "text-red-600 dark:text-red-400",
    Salary: "text-emerald-600 dark:text-emerald-400",
    Freelance: "text-cyan-600 dark:text-cyan-400",
    Investments: "text-indigo-600 dark:text-indigo-400",
    Other: "text-gray-600 dark:text-gray-400",
  };
  return colors[category] || colors.Other;
};

// Format Date
const formatRelativeDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 0) return t("common.today");
  if (days === 1) return t("common.yesterday");
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;

  return date.toLocaleDateString();
};

// Load on mount
onMounted(async () => {
  isLoading.value = true;
  try {
    await Promise.all([finance.loadEntries(), finance.fetchExchangeRate()]);
  } catch (err) {
    console.error("Failed to load data:", err);
  } finally {
    isLoading.value = false;
  }
});

// Auto-sync every 5 minutes if enabled
let syncInterval: NodeJS.Timeout | null = null;
onMounted(() => {
  if (finance.settings.value.auto_sync) {
    syncInterval = setInterval(() => {
      finance.loadEntries();
    }, 5 * 60 * 1000); // 5 minutes
  }
});

onUnmounted(() => {
  if (syncInterval) clearInterval(syncInterval);
});

useHead({
  title: "Sats Wallet - LocoBit Space",
});
</script>
