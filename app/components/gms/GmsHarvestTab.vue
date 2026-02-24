<template>
  <div class="space-y-6">
    <!-- Summary stats -->
    <div class="grid grid-cols-3 gap-3">
      <div class="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4 text-center">
        <p class="text-2xl font-bold text-green-700 dark:text-green-400">
          {{ totalQty }}
        </p>
        <p
          class="text-xs font-medium text-green-600 dark:text-green-500 mt-0.5"
        >
          {{ $t("harvest.total_quantity") }}
        </p>
      </div>
      <div class="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 text-center">
        <p class="text-2xl font-bold text-blue-700 dark:text-blue-400">
          {{ batchCount }}
        </p>
        <p class="text-xs font-medium text-blue-600 dark:text-blue-500 mt-0.5">
          {{ $t("harvest.batches") }}
        </p>
      </div>
      <div
        class="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-4 text-center"
      >
        <p
          class="text-lg font-bold text-purple-700 dark:text-purple-400 leading-tight"
        >
          {{ formatCurrency(totalRevenue) }}
        </p>
        <p
          class="text-xs font-medium text-purple-600 dark:text-purple-500 mt-0.5"
        >
          {{ $t("harvest.total_revenue") }}
        </p>
      </div>
    </div>

    <!-- Action button -->
    <div class="flex justify-end">
      <UButton icon="i-lucide-plus" color="orange" @click="showModal = true">
        {{ $t("harvest.record") }}
      </UButton>
    </div>

    <!-- Harvest list -->
    <div v-if="plantHarvests.length === 0" class="py-16 text-center">
      <div
        class="mx-auto w-16 h-16 rounded-2xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center mb-4"
      >
        <Icon name="lucide:archive" class="h-8 w-8 text-green-400" />
      </div>
      <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
        {{ $t("harvest.no_harvests") }}
      </p>
      <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
        {{ $t("harvest.start_recording") }}
      </p>
    </div>

    <ul v-else class="space-y-3">
      <li
        v-for="h in plantHarvests"
        :key="h.id"
        class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 px-5 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div
              class="w-12 h-12 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400"
            >
              <Icon name="lucide:archive" class="h-5 w-5" />
            </div>
            <div class="space-y-0.5">
              <p
                class="text-[15px] font-semibold text-gray-900 dark:text-white"
              >
                {{ h.quantity }} {{ $t(`common.${h.unit}`) || h.unit }}
              </p>
              <p class="text-xs font-medium text-gray-400 dark:text-gray-500">
                {{ formatDateTime(h.date) }}
              </p>
            </div>
          </div>
          <div class="text-right flex-shrink-0">
            <p
              v-if="h.revenue"
              class="text-sm font-medium text-green-600 dark:text-green-400"
            >
              {{ formatCurrency(h.revenue) }}
            </p>
            <p
              v-if="h.notes"
              class="text-xs text-gray-500 dark:text-gray-400 max-w-[120px] truncate mt-0.5"
            >
              {{ h.notes }}
            </p>
          </div>
        </div>
      </li>
    </ul>

    <!-- Record Harvest Modal -->
    <UModal v-model:open="showModal">
      <template #content>
        <UCard>
          <template #header>
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">
              {{ $t("harvest.record") }}
            </h3>
          </template>
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <UFormField :label="$t('harvest.quantity')" name="qty">
                <UInput
                  v-model="form.quantity"
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  class="w-full"
                />
              </UFormField>
              <UFormField :label="$t('plants.unit')" name="unit">
                <USelect
                  v-model="form.unit"
                  :items="unitOptions"
                  class="w-full"
                />
              </UFormField>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <UFormField :label="$t('harvest.date')" name="date">
                <UInput
                  v-model="form.date"
                  type="datetime-local"
                  class="w-full"
                />
              </UFormField>
              <UFormField
                :label="$t('harvest.revenue_optional')"
                name="revenue"
              >
                <UInput
                  v-model="form.revenue"
                  type="number"
                  step="100"
                  placeholder="0"
                  class="w-full"
                />
              </UFormField>
            </div>
          </div>
          <UFormField class="mt-2" :label="$t('common.notes')" name="notes">
            <UTextarea v-model="form.notes" :rows="2" class="w-full" />
          </UFormField>
          <template #footer>
            <div class="flex justify-end w-full gap-3">
              <UButton variant="ghost" block @click="showModal = false">{{
                $t("common.cancel")
              }}</UButton>
              <UButton
                :loading="isSaving"
                :disabled="!form.quantity"
                block
                @click="submit"
              >
                {{ $t("common.save") }}
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ plantId: string }>();
const { t } = useI18n();
const toast = useToast();
const { harvests, createHarvest, isOnline } = useNostrGms();
const { formatDateTime, formatCurrency } = useHelpers();
const plantHarvests = computed(() =>
  harvests.value
    .filter((h) => h.plantId === props.plantId)
    .sort((a, b) => b.date.localeCompare(a.date)),
);
const totalQty = computed(() => {
  const sum = plantHarvests.value.reduce((acc, h) => acc + h.quantity, 0);
  return `${sum.toFixed(1)} kg`;
});
const batchCount = computed(() => plantHarvests.value.length);
const totalRevenue = computed(() =>
  plantHarvests.value.reduce((acc, h) => acc + (h.revenue ?? 0), 0),
);

const showModal = ref(false);
const isSaving = ref(false);

const currentDate = new Date().toISOString().split("T");
const today = currentDate[0] + " " + currentDate[1]?.substring(0, 5);
const form = reactive({
  quantity: "",
  unit: "kg",
  date: today,
  revenue: "",
  notes: "",
});

const unitOptions = [
  { label: t("common.kg"), value: "kg" },
  { label: t("common.pieces"), value: "pieces" },
  { label: t("common.g"), value: "g" },
  { label: t("common.bunch"), value: "bunch" },
];

const submit = async () => {
  if (!form.quantity) return;
  isSaving.value = true;
  try {
    const ok = await createHarvest({
      plantId: props.plantId,
      quantity: parseFloat(form.quantity),
      unit: form.unit,
      date: form.date,
      revenue: form.revenue ? parseFloat(form.revenue) : undefined,
      notes: form.notes || undefined,
    });
    if (ok) {
      toast.add({
        title: isOnline.value ? t("common.success") : t("common.saved_offline"),
        color: isOnline.value ? "green" : "yellow",
        icon: "i-lucide-check-circle",
      });
      Object.assign(form, {
        quantity: "",
        unit: "kg",
        date: today,
        revenue: "",
        notes: "",
      });
      showModal.value = false;
    }
  } finally {
    isSaving.value = false;
  }
};
</script>
