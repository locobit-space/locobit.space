<template>
  <div class="flex divide-x divide-slate-100 h-dvh container mx-auto">
    <aside>
      <AppSidebar class="w-64 px-4" />
    </aside>
    <main class="flex-1 flex flex-col">
      <nav>
        <AppHeader />
      </nav>
      <div class="flex-1 overflow-y-scroll">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped></style>
