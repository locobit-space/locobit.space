<template>
  <div class="flex divide-x divide-slate-100 h-full container mx-auto">
    <aside class="px-4 sticky top-0 h-screen w-60">
      <AppSidebar class="" />
    </aside>
    <main class="flex-1 flex flex-col overflow-y-auto">
      <slot />
    </main>
  </div>
</template>
