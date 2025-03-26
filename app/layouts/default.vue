<template>
  <div class="flex divide-x divide-slate-100 h-full">
    <aside class="sticky px-4 top-0 h-screen w-60">
      <AppSidebar />
    </aside>
    <main class="flex-1 flex flex-col overflow-y-auto">
      <nav>
        <AppHeader />
      </nav>
      <div class="flex-1 overflow-y-scroll">
        <slot />
      </div>
    </main>
  </div>
</template>
