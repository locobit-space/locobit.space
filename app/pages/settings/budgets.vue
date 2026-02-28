<template>
  <div>
    <!-- Header -->
    <div class="">
      <div class="mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <NuxtLink
              to="/locosats"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <Icon name="heroicons:arrow-left" class="w-5 h-5" />
            </NuxtLink>
            <h1 class="text-xl font-semibold text-gray-900 dark:text-white">
              Budget Management
            </h1>
          </div>
          <UButton color="primary" size="sm" @click="showAddModal = true">
            <Icon name="heroicons:plus" class="w-4 h-4 mr-1.5" />
            Add Budget
          </UButton>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-4xl mx-auto px-4 py-6">
      <!-- Budget List -->
      <div
        v-if="
          finance.settings.value.budgets &&
          finance.settings.value.budgets.length
        "
        class="space-y-4"
      >
        <div
          v-for="budget in finance.settings.value.budgets"
          :key="budget.id"
          class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm"
        >
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-3">
              <div
                class="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
                :class="getCategoryBg(budget.category)"
              >
                <Icon
                  :name="getCategoryIcon(budget.category)"
                  class="w-6 h-6"
                  :class="getCategoryIconColor(budget.category)"
                />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  {{ budget.category }}
                </h3>
                <p class="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {{ budget.period }} budget
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button
                @click="editBudget(budget)"
                class="p-2 text-gray-400 hover:text-primary-500 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <Icon name="heroicons:pencil" class="w-4 h-4" />
              </button>
              <button
                @click="deleteBudgetHandler(budget.id)"
                class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <Icon name="heroicons:trash" class="w-4 h-4" />
              </button>
            </div>
          </div>

          <div v-if="getBudgetProgress(budget)" class="space-y-3">
            <div class="flex items-end justify-between">
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400">Spent</p>
                <p class="text-2xl font-bold" :class="getProgressColor(budget)">
                  {{ $n(getBudgetProgress(budget)!.spent || 0) }}
                  {{ finance.settings.value.default_currency }}
                </p>
              </div>
              <div class="text-right">
                <p class="text-sm text-gray-500 dark:text-gray-400">Budget</p>
                <p class="text-xl font-semibold text-gray-900 dark:text-white">
                  {{ $n(budget.amount || 0) }}
                  {{ finance.settings.value.default_currency }}
                </p>
              </div>
            </div>

            <div class="space-y-1.5">
              <div
                class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400"
              >
                <span>Progress</span>
                <span class="font-medium" :class="getProgressColor(budget)">
                  {{ getBudgetProgress(budget)!.percentage.toFixed(1) }}%
                </span>
              </div>
              <div
                class="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden"
              >
                <div
                  class="h-full rounded-full transition-all duration-500"
                  :class="getProgressBarColor(budget)"
                  :style="{
                    width: `${Math.min(getBudgetProgress(budget)!.percentage, 100)}%`,
                  }"
                />
              </div>
            </div>

            <div
              v-if="getBudgetProgress(budget)!.shouldAlert"
              class="flex items-start gap-2 p-3 rounded-lg"
              :class="
                getBudgetProgress(budget)!.isOverBudget
                  ? 'bg-red-50 dark:bg-red-900/20'
                  : 'bg-amber-50 dark:bg-amber-900/20'
              "
            >
              <Icon
                name="heroicons:exclamation-triangle"
                class="w-5 h-5 mt-0.5"
                :class="
                  getBudgetProgress(budget)!.isOverBudget
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-amber-600 dark:text-amber-400'
                "
              />
              <div class="flex-1">
                <p
                  class="text-sm font-medium"
                  :class="
                    getBudgetProgress(budget)!.isOverBudget
                      ? 'text-red-700 dark:text-red-300'
                      : 'text-amber-700 dark:text-amber-300'
                  "
                >
                  <span v-if="getBudgetProgress(budget)!.isOverBudget">
                    Over budget by
                    {{ $n(Math.abs(getBudgetProgress(budget)!.remaining)) }}
                    {{ finance.settings.value.default_currency }}
                  </span>
                  <span v-else>
                    {{ $n(getBudgetProgress(budget)!.remaining) }}
                    {{ finance.settings.value.default_currency }} remaining ({{
                      (100 - getBudgetProgress(budget)!.percentage).toFixed(0)
                    }}%)
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else
        class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center"
      >
        <div
          class="w-16 h-16 mx-auto mb-4 rounded-full bg-linear-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 flex items-center justify-center"
        >
          <Icon
            name="heroicons:chart-pie"
            class="w-8 h-8 text-primary-600 dark:text-primary-400"
          />
        </div>
        <h3 class="text-lg font-medium mb-2 text-gray-900 dark:text-white">
          No budgets yet
        </h3>
        <p
          class="text-gray-500 dark:text-gray-400 text-sm mb-5 max-w-sm mx-auto"
        >
          Set spending limits for different categories to help manage your
          finances better
        </p>
        <UButton color="primary" @click="showAddModal = true">
          <Icon name="heroicons:plus" class="w-4 h-4 mr-2" />
          Create Your First Budget
        </UButton>
      </div>
    </div>

    <!-- Add/Edit Budget Modal -->
    <UModal v-model:open="showAddModal">
      <template #content>
        <div class="p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-5">
            {{ editingBudget ? "Edit Budget" : "Add New Budget" }}
          </h3>

          <div class="space-y-4">
            <!-- Category -->
            <UFormField label="Category">
              <USelect
                v-model="form.category"
                :items="availableCategories"
                placeholder="Select category"
                class="w-full"
              />
            </UFormField>

            <!-- Amount -->
            <UFormField label="Budget Amount">
              <UInput
                v-model.number="form.amount"
                type="number"
                class="w-full"
                :placeholder="
                  'Enter amount in ' + finance.settings.value.default_currency
                "
              >
                <template #trailing>
                  {{ finance.settings.value.default_currency }}
                </template>
              </UInput>
            </UFormField>

            <!-- Period -->
            <UFormField label="Period">
              <URadioGroup v-model="form.period" :items="periodOptions" />
            </UFormField>

            <!-- Alert Threshold -->
            <UFormField
              label="Alert Threshold"
              help="Get notified when you reach this percentage"
            >
              <div class="flex items-center gap-3">
                <USlider
                  v-model="form.alert_threshold"
                  :min="50"
                  :max="100"
                  :step="5"
                  class="flex-1"
                />
                <span
                  class="text-sm font-medium text-gray-700 dark:text-gray-300 w-12 text-right"
                >
                  {{ form.alert_threshold }}%
                </span>
              </div>
            </UFormField>
          </div>

          <div class="flex gap-3 mt-6">
            <UButton color="gray" variant="soft" block @click="closeModal">
              Cancel
            </UButton>
            <UButton
              color="primary"
              block
              @click="saveBudget"
              :disabled="!isFormValid"
            >
              {{ editingBudget ? "Update" : "Create" }} Budget
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { Budget } from "~/types";

const finance = useFinance();
const toast = useToast();

// State
const showAddModal = ref(false);
const editingBudget = ref<Budget | null>(null);

const form = ref({
  category: "",
  amount: 0,
  period: "monthly" as "daily" | "weekly" | "monthly" | "yearly",
  alert_threshold: 80,
});

// Available categories (excluding those with budgets)
const availableCategories = computed(() => {
  const existingCategories =
    finance.settings.value.budgets?.map((b) => b.category) || [];
  return (finance.settings.value.categories || [])
    .filter(
      (cat) => !existingCategories.includes(cat) || cat === form.value.category,
    )
    .map((cat) => ({ label: cat, value: cat }));
});

const periodOptions = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
];

const isFormValid = computed(() => {
  return form.value.category && form.value.amount > 0;
});

// Budget Progress
const getBudgetProgress = (budget: Budget) => {
  return finance.getBudgetProgress(budget.category, budget.period);
};

const getProgressColor = (budget: Budget) => {
  const progress = getBudgetProgress(budget);
  if (!progress) return "text-gray-500";
  if (progress.isOverBudget) return "text-red-600 dark:text-red-400";
  if (progress.shouldAlert) return "text-amber-600 dark:text-amber-400";
  return "text-green-600 dark:text-green-400";
};

const getProgressBarColor = (budget: Budget) => {
  const progress = getBudgetProgress(budget);
  if (!progress) return "bg-gray-300";
  if (progress.isOverBudget) return "bg-linear-to-r from-red-500 to-red-600";
  if (progress.shouldAlert) return "bg-linear-to-r from-amber-500 to-amber-600";
  return "bg-linear-to-r from-green-500 to-green-600";
};

// Category Styling — use shared getCategoryMeta from useFinance composable
const getCategoryIcon = (category: string) => getCategoryMeta(category).icon;
const getCategoryBg = (category: string) => getCategoryMeta(category).bg;
const getCategoryIconColor = (category: string) => getCategoryMeta(category).color;

// Actions
const editBudget = (budget: Budget) => {
  editingBudget.value = budget;
  form.value = {
    category: budget.category,
    amount: budget.amount,
    period: budget.period,
    alert_threshold: budget.alert_threshold,
  };
  showAddModal.value = true;
};

const saveBudget = () => {
  if (!isFormValid.value) return;

  try {
    if (editingBudget.value) {
      finance.updateBudget(editingBudget.value.id, form.value);
    } else {
      finance.addBudget(form.value);
    }
    closeModal();
  } catch (err) {
    toast.add({
      title: "Error",
      description: "Failed to save budget",
      color: "red",
    });
  }
};

const deleteBudgetHandler = (id: string) => {
  if (!confirm("Are you sure you want to delete this budget?")) return;
  finance.deleteBudget(id);
};

const closeModal = () => {
  showAddModal.value = false;
  editingBudget.value = null;
  form.value = {
    category: "",
    amount: 0,
    period: "monthly",
    alert_threshold: 80,
  };
};

useHead({
  title: "Budget Management - BitOS Space",
});
</script>
