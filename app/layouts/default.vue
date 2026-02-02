<script setup lang="ts">

</script>

<template>
  <div
    class="flex h-full w-full flex-col-reverse md:flex-row md:divide-x dark:divide-slate-800 divide-slate-100 container mx-auto"
  >
    <aside class="md:px-4 md:sticky md:top-0 bottom-0 md:h-screen">
      <div class="w-full md:w-60">
        <AppSidebar class="" />
      </div>
    </aside>
    <main class="flex-1 flex flex-col">
      <slot />
      <div class="h-4 md:hidden"></div>
    </main>
  </div>
</template>
