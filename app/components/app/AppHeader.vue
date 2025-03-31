<template>
  <div>
    <CommonContainer class="">
      <nav class="space-y-1 flex">
        <div
          v-for="(item, index) in items"
          :key="item.key"
          class="group justify-center items-center flex flex-col text-center cursor-pointer relative rounded-sm px-4 py-3 transition-all"
          @click="handleFilter(item)"
        >
          <span class="text-center">
            {{ item.label }}
          </span>
          <div
            v-if="filterTab?.key == item.key"
            class="absolute bottom-0 w-full"
          >
            <div class="flex w-full justify-center items-center">
              <div class="h-1 w-10 rounded-full bg-black" />
            </div>
          </div>
        </div>
      </nav>
    </CommonContainer>
  </div>
</template>

<script setup lang="ts">
const items = useState("itemsHeader", () => [
  { label: "For You", key: "for-you", value: "for-you" },
  { label: "Following", key: "following", value: "following" },
  { label: "Trending", key: "trending", value: "trending" },
  { label: "#laostr", key: "hashtag", value: "laostr" },
]);

const { filterTab } = useNostrFeed();

const emit = defineEmits(["filter"]);

const handleFilter = (item: any) => {
  filterTab.value = item;
  emit("filter", item);
};
</script>

<style scoped></style>
