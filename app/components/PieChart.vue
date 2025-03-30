<template>
    <div class="h-full w-full">
      <client-only>
        <div class="flex h-full">
          <div class="flex-1 h-full" ref="chartContainer"></div>
          <div class="w-1/3">
            <div class="flex flex-col space-y-2">
              <div v-for="(item, index) in data" :key="index" class="flex items-center">
                <div
                  class="w-3 h-3 rounded-full mr-2"
                  :style="{ backgroundColor: colors[index % colors.length] }"
                ></div>
                <div class="text-sm truncate">{{ item.label }}</div>
                <div class="ml-auto text-sm font-medium">
                  {{ item.value.toFixed(2) }}
                  <span v-if="finance.settings.value.display_unit === 'fiat'">
                    {{ finance.settings.value.default_currency }}
                  </span>
                  <span v-else>sats</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </client-only>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted, watch, nextTick } from 'vue';
  import * as d3 from 'd3';
  import { useFinance } from '~/composables/useFinance';
  
  const finance = useFinance();
  
  const props = defineProps<{
    data: { label: string; value: number }[];
  }>();
  
  const chartContainer = ref<HTMLElement | null>(null);
  const colors = [
    '#3B82F6', // blue-500
    '#10B981', // emerald-500
    '#F59E0B', // amber-500
    '#EF4444', // red-500
    '#8B5CF6', // violet-500
    '#EC4899', // pink-500
    '#6366F1', // indigo-500
    '#06B6D4', // cyan-500
    '#F97316', // orange-500
    '#84CC16', // lime-500
  ];
  
  const renderChart = () => {
    if (!chartContainer.value || props.data.length === 0) return;
  
    // Clear previous chart
    d3.select(chartContainer.value).selectAll('*').remove();
  
    const width = chartContainer.value.clientWidth;
    const height = chartContainer.value.clientHeight;
    const radius = Math.min(width, height) / 2;
  
    const svg = d3
      .select(chartContainer.value)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);
  
    const pie = d3.pie<{ label: string; value: number }>().value(d => d.value);
    const data_ready = pie(props.data);
  
    const arcGenerator = d3
      .arc<d3.PieArcDatum<{ label: string; value: number }>>()
      .innerRadius(0)
      .outerRadius(radius * 0.8);
  
    // Build the pie chart
    svg
      .selectAll('slices')
      .data(data_ready)
      .enter()
      .append('path')
      .attr('d', arcGenerator)
      .attr('fill', (_, i) => colors[i % colors.length])
      .attr('stroke', 'white')
      .style('stroke-width', '2px')
      .style('opacity', 0.7);
  
    // Add labels
    svg
      .selectAll('labels')
      .data(data_ready)
      .enter()
      .append('text')
      .text(d => {
        const percent = ((d.endAngle - d.startAngle) / (2 * Math.PI)) * 100;
        return percent >= 5 ? `${percent.toFixed(0)}%` : '';
      })
      .attr('transform', d => `translate(${arcGenerator.centroid(d)})`)
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', 'white');
  };
  
  // Render the chart when component is mounted
  onMounted(() => {
    if (props.data.length > 0) {
      nextTick(() => {
        renderChart();
      });
    }
  });
  
  // Re-render when data changes
  watch(
    () => props.data,
    () => {
      nextTick(() => {
        renderChart();
      });
    },
    { deep: true }
  );
  
  // Re-render when display unit changes
  watch(
    () => finance.settings.value.display_unit,
    () => {
      nextTick(() => {
        renderChart();
      });
    }
  );
  
  // Re-render on window resize
  onMounted(() => {
    window.addEventListener('resize', () => {
      nextTick(() => {
        renderChart();
      });
    });
  });
  
  onBeforeUnmount(() => {
    window.removeEventListener('resize', renderChart);
  });
  </script>