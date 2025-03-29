<script setup lang="ts">
const { user } = useNostr();
</script>

<template>
  <div
    class="flex h-full w-full flex-col-reverse md:flex-row md:divide-x divide-slate-100 container mx-auto"
  >
    <aside
      class="md:px-4 md:sticky md:top-0 bottom-0 md:h-screen w-full md:w-60"
    >
      <AppSidebar class="" />
    </aside>
    <main class="flex-1 flex flex-col">
      <UButton
        v-if="user"
        icon="i-heroicons-plus-circle"
        color="primary"
        to="/create-note"
        square
        size="xl"
        class="fixed w-10 h-10 shadow-lg flex items-center rounded-full justify-center bottom-10 right-4 md:hidden"
      >
      </UButton>

      <slot />
    </main>
  </div>
</template>
