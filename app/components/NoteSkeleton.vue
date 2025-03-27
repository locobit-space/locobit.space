<template>
  <div class="flex gap-4">
    <USkeleton class="h-12 w-12 rounded-full" />
    <article class="grid gap-2">
      <USkeleton
        class="h-4"
        :style="{
          width: `${randomWidth()}px`,
        }"
      />
      <USkeleton
        class="h-4"
        :style="{
          width: `${randomWidth()}%`,
        }"
      />

      <article v-if="randomImage() > 0">
        <div class="flex gap-4 py-4">
          <USkeleton class="h-[150px] w-[150px]" />
          <USkeleton class="h-[150px] w-[150px]" />
        </div>
      </article>
      <article v-else class="flex flex-col gap-2">
        <USkeleton
          class="h-4"
          :style="{
            width: `${randomWidth()}%`,
          }"
        />
        <USkeleton
          class="h-4"
          :style="{
            width: `${randomWidth()}%`,
          }"
        />
      </article>

      <nav class="flex gap-2">
        <USkeleton class="h-6 w-14" />
        <USkeleton class="h-6 w-14" />
        <USkeleton class="h-6 w-14" />
        <USkeleton class="h-6 w-14" />
      </nav>
    </article>
  </div>
</template>

<script setup lang="ts">
const randomWidth = () => {
  return Math.floor(Math.random() * 100);
};

const randomImage = () => {
  return Math.floor(Math.random() * 4);
};
</script>
