<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    <h2 class="text-xl font-semibold mb-4">Add New Transaction</h2>

    <form @submit.prevent="handleSubmit">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Transaction Type -->
        <div>
          <UFormField label="Transaction Type">
            <URadio
              v-model="form.type"
              value="income"
              name="type"
              label="Income"
            />
            <URadio
              v-model="form.type"
              value="expense"
              name="type"
              label="Expense"
            />
          </UFormField>
        </div>

        <!-- Currency Unit Selection -->
        <div>
          <UFormField label="Enter amount in">
            <URadio
              v-model="form.unit_input"
              value="fiat"
              name="unit_input"
              :label="form.fiat_currency"
            />
            <URadio
              v-model="form.unit_input"
              value="sats"
              name="unit_input"
              label="Satoshis"
            />
          </UFormField>
        </div>

        <!-- Amount Input -->
        <div class="col-span-1 md:col-span-2">
          <UFormField label="Amount">
            <div class="flex items-center">
              <UInput
                v-model="amount"
                type="number"
                step="any"
                :placeholder="`Amount in ${
                  form.unit_input === 'fiat' ? form.fiat_currency : 'sats'
                }`"
                class="w-full"
              />

              <div
                v-if="showConversion"
                class="ml-4 text-sm text-gray-500 dark:text-gray-400"
              >
                <span v-if="form.unit_input === 'fiat'">
                  ≈ {{ Math.round(Number(amount) * form.sats_per_fiat) }} sats
                </span>
                <span v-else>
                  ≈ {{ (Number(amount) / form.sats_per_fiat).toFixed(2) }}
                  {{ form.fiat_currency }}
                </span>
              </div>
            </div>
          </UFormField>
        </div>

        <!-- Fiat Currency Selection -->
        <div>
          <UFormField label="Fiat Currency">
            <USelect
              v-model="form.fiat_currency"
              :options="currencies"
              @update:model-value="updateExchangeRate"
            />
          </UFormField>
        </div>

        <!-- Exchange Rate -->
        <div>
          <UFormField label="Exchange Rate (sats per fiat)">
            <div class="flex">
              <UInput
                v-model="form.sats_per_fiat"
                type="number"
                placeholder="Sats per fiat unit"
                class="w-full"
              />
              <UButton
                color="gray"
                variant="ghost"
                icon="i-heroicons-arrow-path"
                class="ml-2"
                @click="updateExchangeRate"
              />
            </div>
          </UFormField>
        </div>

        <!-- Note -->
        <div class="col-span-1 md:col-span-2">
          <UFormField label="Note">
            <UInput
              v-model="form.note"
              placeholder="Description"
              class="w-full"
            />
          </UFormField>
        </div>

        <!-- Tags -->
        <div class="col-span-1 md:col-span-2">
          <UFormField label="Tags">
            <UInput
              v-model="tagsInput"
              placeholder="Enter tags separated by commas"
              class="w-full"
            />
            <div class="mt-2 flex flex-wrap gap-2">
              <UBadge
                v-for="tag in form.tags"
                :key="tag"
                color="blue"
                class="cursor-pointer"
                @click="removeTag(tag)"
              >
                {{ tag }}
                <UIcon name="i-heroicons-x-mark" class="ml-1" />
              </UBadge>
            </div>
          </UFormField>
        </div>

        <!-- Visibility -->
        <div class="col-span-1 md:col-span-2">
          <UFormField label="Visibility">
            <URadio
              v-model="form.visibility"
              value="private"
              name="visibility"
              label="Private"
            />
            <URadio
              v-model="form.visibility"
              value="public"
              name="visibility"
              label="Public"
            />
          </UFormField>
        </div>
      </div>

      <div class="mt-6 flex justify-end">
        <UButton type="submit" color="primary">Add Transaction</UButton>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";

const finance = useFinance();

// Mock user ID - would come from authentication system
const userId = "npub1mockuserid";

// Available currencies
const currencies = ["USD", "EUR", "THB", "JPY", "GBP"];

// Form state
const form = ref({
  user_id: userId,
  type: "expense" as "income" | "expense",
  amount_fiat: 0,
  amount_sats: 0,
  fiat_currency: "USD",
  sats_per_fiat: finance.currentExchangeRate.value,
  unit_input: "fiat" as "fiat" | "sats",
  note: "",
  tags: [] as string[],
  visibility: "private" as "private" | "public",
});

// Amount input - we'll convert to the right field based on unit_input
const amount = ref("");
const tagsInput = ref("");

// Show conversion only when amount is entered
const showConversion = computed(() => {
  return amount.value !== "" && Number(amount.value) > 0;
});

// Update exchange rate from API
const updateExchangeRate = async () => {
  form.value.sats_per_fiat = await finance.fetchExchangeRate(
    form.value.fiat_currency
  );
};

// Process tag input
watch(tagsInput, (newValue) => {
  if (newValue.includes(",")) {
    const parts = newValue.split(",");
    const newTag = parts[0].trim();

    if (newTag && !form.value.tags.includes(newTag)) {
      form.value.tags.push(newTag);
    }

    tagsInput.value = parts.slice(1).join(",").trim();
  }
});

// Remove a tag
const removeTag = (tag: string) => {
  form.value.tags = form.value.tags.filter((t) => t !== tag);
};

// Form submission
const handleSubmit = () => {
  // Convert the amount based on the unit input
  if (form.value.unit_input === "fiat") {
    form.value.amount_fiat = Number(amount.value);
    form.value.amount_sats = Number(amount.value) * form.value.sats_per_fiat;
  } else {
    form.value.amount_sats = Number(amount.value);
    form.value.amount_fiat = Number(amount.value) / form.value.sats_per_fiat;
  }

  // Add any remaining tag
  if (tagsInput.value.trim()) {
    form.value.tags.push(tagsInput.value.trim());
    tagsInput.value = "";
  }

  // Submit the entry
  finance.addEntry(form.value);

  // Reset form
  form.value = {
    user_id: userId,
    type: "expense",
    amount_fiat: 0,
    amount_sats: 0,
    fiat_currency: form.value.fiat_currency,
    sats_per_fiat: form.value.sats_per_fiat,
    unit_input: form.value.unit_input,
    note: "",
    tags: [],
    visibility: "private",
  };

  amount.value = "";
  tagsInput.value = "";
};

// Initialize by fetching current exchange rate
onMounted(async () => {
  await updateExchangeRate();
});
</script>
