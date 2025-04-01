<template>
  <div class="relative h-64 w-full overflow-hidden md:max-w-xs">
    <!-- Matrix background -->
    <div
      ref="canvas"
      class="absolute inset-0 w-full h-full backdrop-blur-lg rounded-lg overflow-hidden"
    ></div>

    <!-- Center slot content -->
    <div
      class="absolute inset-0 flex w-full h-full items-center justify-center z-10"
    >
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

// Configuration options
const props = withDefaults(
  defineProps<{
    fontSize?: number;
    columnWidth?: number;
    fallSpeed?: number;
    charSet?: string;
  }>(),
  {
    fontSize: 14,
    columnWidth: 20,
    fallSpeed: 1.5,
    charSet: "ສຶກສາ Bitcoin",
  }
);

// Canvas reference
const canvas = ref<HTMLElement | null>(null);

// Matrix variables
let columns: number[] = [];
let ctx: CanvasRenderingContext2D | null = null;
let canvasEl: HTMLCanvasElement | null = null;
let animationId: number | null = null;

// Setup matrix effect
onMounted(() => {
  if (!canvas.value) return;

  // Create canvas element
  canvasEl = document.createElement("canvas");
  ctx = canvasEl.getContext("2d");
  if (!ctx) return;

  // Add canvas to container
  canvas.value.appendChild(canvasEl);

  // Initialize dimensions
  resizeCanvas();

  // Listen for resize events
  window.addEventListener("resize", resizeCanvas);

  // Start animation
  startMatrixEffect();
});

// Clean up
onUnmounted(() => {
  window.removeEventListener("resize", resizeCanvas);
  if (animationId !== null) {
    cancelAnimationFrame(animationId);
  }
});

// Resize canvas to fit container
const resizeCanvas = () => {
  if (!canvasEl || !canvas.value || !ctx) return;

  canvasEl.width = canvas.value.clientWidth;
  canvasEl.height = canvas.value.clientHeight;

  // Calculate number of columns
  const columnCount = Math.floor(canvasEl.width / props.columnWidth);

  // Reset columns array with random starting positions
  columns = Array(columnCount)
    .fill(0)
    .map(() =>
      Math.floor((Math.random() * (canvasEl?.height || 0)) / props.fontSize)
    );
};

// Main matrix effect function
const startMatrixEffect = () => {
  if (!ctx || !canvasEl) return;

  // Semi-transparent black to create fade effect
  ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
  ctx.fillRect(0, 0, canvasEl.width, canvasEl.height);

  // Green text
  ctx.fillStyle = "#0f0";
  ctx.font = `${props.fontSize}px monospace`;

  // Draw each column
  columns.forEach((y, i) => {
    // Get random character
    const charIndex = Math.floor(Math.random() * props.charSet.length);
    const char = props.charSet[charIndex];

    // Draw character
    const x = i * props.columnWidth;
    ctx?.fillText(char || "", x, y * props.fontSize);

    // Move down or reset if reached bottom
    if (y * props.fontSize > (canvasEl?.height || 1) && Math.random() > 0.975) {
      columns[i] = 0;
    } else {
      columns[i] += props.fallSpeed;
    }
  });

  // Loop animation
  animationId = requestAnimationFrame(startMatrixEffect);
};
</script>
