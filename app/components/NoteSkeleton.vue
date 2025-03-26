<template>
  <div class="flex gap-4">
    <USkeleton class="h-12 w-12 rounded-full" />
    <article class="grid gap-2">
      <USkeleton class="h-4 w-[250px]" />
      <USkeleton class="h-4 w-[200px]" />

      <div class="flex gap-4 py-4">
        <USkeleton class="h-45 w-[150px]" />
        <USkeleton class="h-45 w-[150px]" />
      </div>

      <nav class="flex gap-2">
        <USkeleton class="h-6 w-14" />
        <USkeleton class="h-6 w-14" />
        <USkeleton class="h-6 w-14" />
        <USkeleton class="h-6 w-14" />
      </nav>
    </article>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped></style>
