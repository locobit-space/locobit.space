---
name: BitOS Social Coding Style
description: Best practices, patterns, and conventions for the BitOS Social Nuxt project.
metadata:
  author: BitOS Team
  version: "2026.2.1"
  stack: Nuxt 3, Vue 3, Tailwind CSS
---

# BitOS Social Coding Standards

This skill defines the coding style and best practices for the BitOS Social project. Always refer to this when writing or refactoring code to ensure consistency and maintainability.

## Preferences

- **Framework**: Prefer **Nuxt 3** features over vanilla Vue where applicable.
- **Language**: Strictly **TypeScript**. Avoid `any`.
- **API Style**: Always use **Composition API** with `<script setup lang="ts">`.
- **Styling**: Use **Tailwind CSS** / **UnoCSS** utility classes. Avoid scoped CSS unless necessary for complex animations.
- **Icons**: Use `@nuxt/icon` module (e.g., `heroicons:`, `svg-spinners:`).

## Core Architecture

The project follows a standard Nuxt 3 directory structure within the `app/` directory:

- **`app/pages/`**: Route views. Should primarily coordinate data fetching and layout. Keep logic minimal.
- **`app/components/`**: Reusable UI elements.
  - Prefer generic components (e.g., `CommonLineChart`, `UButton`) for UI primitives.
  - Feature-specific components should be grouped if possible.
- **`app/composables/`**: Business logic and state management.
  - **Pattern**: Extract complex logic from components into composables (e.g., `useFinance`, `useNostrFeed`).
  - **Naming**: `useCamelCase`.
- **`app/services/`**: Pure interaction layers (e.g., Nostr relay connections, API wrappers).
- **`app/utils/`**: Helper functions and formatters (stateless).

## Essential Patterns

### Infinite Scroll ("Easy Scroll")

Avoid manual `scroll` event listeners. Use the **Intersection Observer** pattern for performance and reliability.

**Implementation:**

1. Place a "Sentinel" element at the bottom of the list.
2. Use `IntersectionObserver` to trigger loading when the sentinel becomes visible.
3. **Critical**: Watch `isLoading` to re-check visibility if the sentinel remains on screen after a load.

```vue
<template>
  <div class="list">
    <div v-for="item in items" :key="item.id">...</div>
    <!-- Sentinel -->
    <div ref="loadMoreSentinel" class="py-4">
      <LoadingSpinner v-if="isLoading || isLoadingMore" />
    </div>
  </div>
</template>

<script setup lang="ts">
const loadMoreSentinel = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;

const setupObserver = () => {
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !isLoading.value) {
          loadMore();
        }
      });
    },
    { rootMargin: "300px" },
  );

  if (loadMoreSentinel.value) observer.observe(loadMoreSentinel.value);
};

// Fix for "stuck" scroll state where sentinel is visible but observer didn't trigger
watch(isLoading, (newVal) => {
  if (!newVal && observer && loadMoreSentinel.value) {
    observer.unobserve(loadMoreSentinel.value);
    observer.observe(loadMoreSentinel.value);
  }
});

onMounted(() => setupObserver());
onUnmounted(() => observer?.disconnect());
</script>
```

### Data Fetching

- **Server/Hybrid**: Use `useFetch` or `useAsyncData` for data that should be SEO-friendly or pre-fetched.
- **Client-side only**: For dynamic user dashboards (like `report.vue`), standard pattern is:
  ```ts
  const store = useStore();
  onMounted(() => {
    store.loadData();
  });
  ```
- **Reactivity**: Use `computed` to derive UI state from raw data. Avoid manual updates in watchers if possible.

### Charts

Use the common chart wrappers located in `app/components/Common*`.

- **Line Charts**: `CommonLineChart` (uses ECharts under the hood).
- **Pie Charts**: `CommonPieChart`.
- **Styling**: Ensure chart colors match the Tailwind theme (use CSS variables or standard palette colors).

## UI & UX Guidelines

### Standard Page Template

For dashboard-like pages, use a structure with a sticky header, scrollable content area, and optional sticky tools/footer.

```vue
<template>
  <div class="page-container pb-20">
    <!-- Padding for specific spacing -->
    <!-- 1. Sticky Header -->
    <div
      class="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800"
    >
      <div
        class="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center"
      >
        <!-- Navigation / Title -->
        <h1>Page Title</h1>
        <!-- Actions -->
        <UButton>Action</UButton>
      </div>
    </div>

    <!-- 2. Scrollable Content -->
    <div class="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <!-- Content Widgets -->
    </div>
  </div>
</template>
```

### Loading States

- **Feedback**: Always show visual feedback during async operations.
- **Icons**: Use `svg-spinners:180-ring-with-bg` or similar for consistency.
- **UX**: Combine global loading state with local specific loading states to prevent UI freezing.
- **Avoid**: intrusive toast notifications for passive actions like "Refreshed list".

### Icons

- Use the `<Icon name="..." />` component.
- Naming format: `collection:name` (e.g., `heroicons:arrow-left`).

## Naming Conventions

- **Files**: `kebab-case` (e.g., `user-profile.vue`, `data-table.vue`).
- **Composables**: `camelCase` starting with `use` (e.g., `useFinance`, `useNostrFeed`).
- **Components**: `PascalCase` (e.g., `NoteCard`, `AppHeader`).
- **Props**: `camelCase`.
- **Events**: `kebab-case` for templates, `camelCase` for `defineEmits` object keys.

## Anti-patterns

- **No Options API**: Do not use `export default { data() ... }`.
- **No Manual DOM Manipulation**: Avoid `document.querySelector`. Use `ref` template refs.
- **No Global Event Bus**: Use standard props/emits or a store (Pinia/Composable) for state.
- **No Manual Scroll Listeners**: Use `IntersectionObserver`.

## Quick Reference

### Safe Imports

```ts
// Vue Core
import { ref, computed, watch, onMounted, onUnmounted } from "vue";

// Nuxt
import { useHead, navigateTo } from "#app";
```
