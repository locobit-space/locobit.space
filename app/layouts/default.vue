<template>
  <div class="flex divide-x divide-slate-100 h-full container mx-auto">
    <aside class="sticky px-4 top-0 h-screen w-60">
      <AppSidebar />
    </aside>
    <main class="flex-1 flex flex-col">
      <slot />
    </main>
  </div>
</template>
