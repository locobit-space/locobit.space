<template>
  <div class="min-h-screen">
    <!-- Header -->
    <div class="">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-6">
          <div class="flex items-center">
            <UButton
              :to="'/gms'"
              icon="i-lucide-arrow-left"
              variant="ghost"
              color="primary"
              class="mr-4"
            />
            <div class="flex items-center">
              <Icon
                name="lucide:plus"
                class="h-6 w-6 text-green-600 dark:text-green-400 mr-2"
              />
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ $t("plants.register_new") }}
              </h1>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <UCard>
        <UForm
          :schema="schema"
          :state="formState"
          class="space-y-6"
          @submit="onSubmit"
        >
          <!-- Basic Information -->
          <div>
            <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {{ $t("plants.basic_info") }}
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Plant Category -->
              <UFormField
                :label="$t('plants.category')"
                name="category"
                required
              >
                <USelect
                  v-model="formState.category"
                  :items="categoryOptions"
                  :placeholder="$t('plants.select_category')"
                />
              </UFormField>

              <!-- Plant Type -->
              <UFormField :label="$t('plants.type')" name="type" required>
                <USelect
                  v-model="formState.type"
                  :items="filteredTypeOptions"
                  :placeholder="$t('plants.select_type')"
                  :disabled="!formState.category"
                />
              </UFormField>

              <!-- Plant Name -->
              <UFormField :label="$t('plants.name')" name="name" required>
                <UInput
                  v-model="formState.name"
                  :placeholder="$t('plants.name_placeholder')"
                />
              </UFormField>

              <!-- Variety -->
              <UFormField :label="$t('plants.variety')" name="variety">
                <UInput
                  v-model="formState.variety"
                  :placeholder="$t('plants.variety_placeholder')"
                />
              </UFormField>

              <!-- Quantity -->
              <UFormField
                :label="$t('plants.quantity')"
                name="quantity"
                required
              >
                <UInput
                  v-model="formState.quantity"
                  type="number"
                  min="1"
                  :placeholder="$t('plants.quantity_placeholder')"
                />
              </UFormField>

              <!-- Unit -->
              <UFormField :label="$t('plants.unit')" name="unit" required>
                <USelect
                  v-model="formState.unit"
                  :items="unitOptions"
                  :placeholder="$t('plants.select_unit')"
                />
              </UFormField>
            </div>
          </div>

          <!-- Location Information -->
          <div>
            <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {{ $t("plants.location_info") }}
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <!-- Plot/Area -->
              <UFormField :label="$t('plants.plot')" name="plot" required>
                <UInput
                  v-model="formState.plot"
                  :placeholder="$t('plants.plot_placeholder')"
                />
              </UFormField>

              <!-- Row -->
              <UFormField :label="$t('plants.row')" name="row">
                <UInput
                  v-model="formState.row"
                  :placeholder="$t('plants.row_placeholder')"
                />
              </UFormField>

              <!-- Position -->
              <UFormField :label="$t('plants.position')" name="position">
                <UInput
                  v-model="formState.position"
                  :placeholder="$t('plants.position_placeholder')"
                />
              </UFormField>
            </div>
          </div>

          <!-- Planting Information -->
          <div>
            <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {{ $t("plants.planting_info") }}
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Planted Date -->
              <UFormField
                :label="$t('plants.planted_date')"
                name="plantedDate"
                required
              >
                <UInput v-model="formState.plantedDate" type="date" />
              </UFormField>

              <!-- Expected Harvest Date -->
              <UFormField
                :label="$t('plants.expected_harvest')"
                name="expectedHarvestDate"
              >
                <UInput v-model="formState.expectedHarvestDate" type="date" />
              </UFormField>

              <!-- Seed Source -->
              <UFormField :label="$t('plants.seed_source')" name="seedSource">
                <UInput
                  v-model="formState.seedSource"
                  :placeholder="$t('plants.seed_source_placeholder')"
                />
              </UFormField>

              <!-- Cost -->
              <UFormField
                :label="$t('plants.planting_cost')"
                name="plantingCost"
              >
                <UInput
                  v-model="formState.plantingCost"
                  type="number"
                  step="0.01"
                  :placeholder="$t('plants.cost_placeholder')"
                >
                  <template #trailing>
                    <span class="text-gray-400 dark:text-gray-500 text-xs"
                      >LAK</span
                    >
                  </template>
                </UInput>
              </UFormField>
            </div>
          </div>

          <!-- Additional Information -->
          <div>
            <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {{ $t("plants.additional_info") }}
            </h2>
            <div class="grid grid-cols-1 gap-6">
              <!-- Notes -->
              <UFormField :label="$t('plants.notes')" name="notes">
                <UTextarea
                  v-model="formState.notes"
                  :placeholder="$t('plants.notes_placeholder')"
                  :rows="3"
                />
              </UFormField>

              <!-- Generate QR Code -->
              <UFormField>
                <div class="flex items-center">
                  <UCheckbox
                    v-model="formState.generateQrCode"
                    :label="$t('plants.generate_qr_code')"
                  />
                </div>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {{ $t("plants.qr_code_description") }}
                </p>
              </UFormField>
            </div>
          </div>

          <!-- Action Buttons -->
          <div
            class="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700"
          >
            <UButton :to="'/dashboard'" variant="ghost" color="gray">
              {{ $t("common.cancel") }}
            </UButton>

            <UButton
              type="submit"
              icon="i-lucide-save"
              :loading="isSubmitting"
              :disabled="isSubmitting"
            >
              {{ $t("plants.register") }}
            </UButton>
          </div>
        </UForm>
      </UCard>
    </div>

    <!-- Success Modal -->
    <UModal v-model:open="showSuccessModal">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center">
              <Icon
                name="lucide:check-circle"
                class="h-6 w-6 text-green-600 dark:text-green-400 mr-2"
              />
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                {{ $t("plants.registration_success") }}
              </h3>
            </div>
          </template>

          <div class="space-y-4">
            <p class="text-gray-600 dark:text-gray-400">
              {{
                $t("plants.registration_success_message", {
                  name: registeredPlant?.name,
                })
              }}
            </p>

            <div v-if="registeredPlant?.qrCode" class="text-center">
              <div class="inline-block p-4 bg-white rounded-lg">
                <!-- QR Code would be generated here -->
                <div
                  class="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center"
                >
                  <Icon
                    name="lucide:qr-code"
                    class="h-16 w-16 text-gray-400"
                  />
                </div>
              </div>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {{ $t("plants.qr_code_generated") }}
              </p>
            </div>
          </div>

          <template #footer>
            <div class="flex justify-end space-x-3">
              <UButton @click="registerAnother" variant="ghost" color="primary">
                {{ $t("plants.register_another") }}
              </UButton>

              <UButton :to="'/dashboard'" color="primary">
                {{ $t("common.back_to_dashboard") }}
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { z } from "zod";

const { t } = useI18n();

// Form validation schema
const schema = z.object({
  category: z.string().min(1, t("validation.required")),
  type: z.string().min(1, t("validation.required")),
  name: z.string().min(1, t("validation.required")),
  variety: z.string().optional(),
  quantity: z.number().min(1, t("validation.min_quantity")),
  unit: z.string().min(1, t("validation.required")),
  plot: z.string().min(1, t("validation.required")),
  row: z.string().optional(),
  position: z.string().optional(),
  plantedDate: z.string().min(1, t("validation.required")),
  expectedHarvestDate: z.string().optional(),
  seedSource: z.string().optional(),
  plantingCost: z.number().optional(),
  notes: z.string().optional(),
  generateQrCode: z.boolean().optional(),
});

// Form state
const formState = ref({
  category: "",
  type: "",
  name: "",
  variety: "",
  quantity: 1,
  unit: "",
  plot: "",
  row: "",
  position: "",
  plantedDate: new Date().toISOString().split("T")[0],
  expectedHarvestDate: "",
  seedSource: "",
  plantingCost: 0,
  notes: "",
  generateQrCode: true,
});

const isSubmitting = ref(false);
const showSuccessModal = ref(false);
const registeredPlant = ref(null);

// Options for selects
const categoryOptions = computed(() => [
  { label: t("plants.categories.vegetable"), value: "vegetable" },
  { label: t("plants.categories.fruit"), value: "fruit" },
  { label: t("plants.categories.herb"), value: "herb" },
  { label: t("plants.categories.flower"), value: "flower" },
  { label: t("plants.categories.grain"), value: "grain" },
]);

const typeOptions = {
  vegetable: [
    { label: t("plants.types.tomato"), value: "tomato" },
    { label: t("plants.types.lettuce"), value: "lettuce" },
    { label: t("plants.types.cabbage"), value: "cabbage" },
    { label: t("plants.types.carrot"), value: "carrot" },
    { label: t("plants.types.onion"), value: "onion" },
    { label: t("plants.types.potato"), value: "potato" },
  ],
  fruit: [
    { label: t("plants.types.mango"), value: "mango" },
    { label: t("plants.types.papaya"), value: "papaya" },
    { label: t("plants.types.banana"), value: "banana" },
    { label: t("plants.types.coconut"), value: "coconut" },
    { label: t("plants.types.lime"), value: "lime" },
  ],
  herb: [
    { label: t("plants.types.basil"), value: "basil" },
    { label: t("plants.types.mint"), value: "mint" },
    { label: t("plants.types.cilantro"), value: "cilantro" },
    { label: t("plants.types.lemongrass"), value: "lemongrass" },
  ],
  flower: [
    { label: t("plants.types.marigold"), value: "marigold" },
    { label: t("plants.types.sunflower"), value: "sunflower" },
    { label: t("plants.types.rose"), value: "rose" },
  ],
  grain: [
    { label: t("plants.types.rice"), value: "rice" },
    { label: t("plants.types.corn"), value: "corn" },
  ],
};

const filteredTypeOptions = computed(() => {
  if (!formState.value.category) return [];
  return (
    typeOptions[formState.value.category as keyof typeof typeOptions] || []
  );
});

const unitOptions = computed(() => [
  { label: t("plants.units.plants"), value: "plants" },
  { label: t("plants.units.seeds"), value: "seeds" },
  { label: t("plants.units.rows"), value: "rows" },
  { label: t("plants.units.square_meters"), value: "sqm" },
]);

// Form submission
const onSubmit = async (event: any) => {
  isSubmitting.value = true;

  try {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Create registered plant object
    registeredPlant.value = {
      ...formState.value,
      id: Date.now(),
      qrCode: formState.value.generateQrCode,
    };

    // Show success modal
    showSuccessModal.value = true;

    // Reset form
    resetForm();
  } catch (error) {
    console.error("Registration failed:", error);
    // Handle error - could show error notification here
  } finally {
    isSubmitting.value = false;
  }
};

const resetForm = () => {
  formState.value = {
    category: "",
    type: "",
    name: "",
    variety: "",
    quantity: 1,
    unit: "",
    plot: "",
    row: "",
    position: "",
    plantedDate: new Date().toISOString().split("T")[0],
    expectedHarvestDate: "",
    seedSource: "",
    plantingCost: 0,
    notes: "",
    generateQrCode: true,
  };
};

const registerAnother = () => {
  showSuccessModal.value = false;
  resetForm();
};

// SEO
useHead({
  title: computed(() => t("plants.register_new")),
  meta: [
    {
      name: "description",
      content: computed(() => t("plants.register_description")),
    },
  ],
});
</script>
