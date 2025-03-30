<template>
    <div class="h-full w-full">
      <client-only>
        <div class="h-full" ref="chartContainer"></div>
      </client-only>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted, watch, nextTick } from 'vue';
  import * as d3 from 'd3';
  import { useFinance } from '~/composables/useFinance';
  
  const finance = useFinance();
  
  const props = defineProps<{
    data: { month: string; balance: number }[];
  }>();
  
  const chartContainer = ref<HTMLElement | null>(null);
  
  const renderChart = () => {
    if (!chartContainer.value || props.data.length === 0) return;
  
    // Clear previous chart
    d3.select(chartContainer.value).selectAll('*').remove();
  
    const width = chartContainer.value.clientWidth;
    const height = chartContainer.value.clientHeight;
    const margin = { top: 20, right: 20, bottom: 40, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
  
    // Create the SVG container
    const svg = d3
      .select(chartContainer.value)
      .append('svg')
      .attr('width', width)
      .attr('height', height);
  
    // Create the chart group
    const chart = svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);
  
    // Define scales
    const xScale = d3
      .scaleBand()
      .domain(props.data.map(d => d.month))
      .range([0, innerWidth])
      .padding(0.1);
  
    const minValue = Math.min(0, d3.min(props.data, d => d.balance) || 0);
    const maxValue = Math.max(0, d3.max(props.data, d => d.balance) || 0);
    
    const yScale = d3
      .scaleLinear()
      .domain([minValue * 1.1, maxValue * 1.1]) // Add 10% padding
      .range([innerHeight, 0]);
  
    // Define axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale).ticks(5).tickFormat(d => {
      return d.toString();
    });
  
    // Add axes
    chart
      .append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)');
  
    chart.append('g').call(yAxis);
  
    // Add zero line
    chart
      .append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', yScale(0))
      .attr('y2', yScale(0))
      .attr('stroke', '#6B7280')
      .attr('stroke-dasharray', '4')
      .attr('stroke-width', 1);
  
    // Create line generator
    const line = d3
      .line<{ month: string; balance: number }>()
      .x(d => (xScale(d.month) || 0) + xScale.bandwidth() / 2)
      .y(d => yScale(d.balance));
  
    // Add the line path
    chart
      .append('path')
      .datum(props.data)
      .attr('fill', 'none')
      .attr('stroke', '#3B82F6') // Blue-500
      .attr('stroke-width', 3)
      .attr('d', line);
  
    // Add dots
    chart
      .selectAll('.dot')
      .data(props.data)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', d => (xScale(d.month) || 0) + xScale.bandwidth() / 2)
      .attr('cy', d => yScale(d.balance))
      .attr('r', 5)
      .attr('fill', d => (d.balance >= 0 ? '#10B981' : '#EF4444'))
      .append('title')
      .text(d => `Balance: ${d.balance.toFixed(2)} ${finance.settings.value.display_unit === 'fiat' ? finance.settings.value.default_currency : 'sats'}`);
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