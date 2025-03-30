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
    data: { month: string; income: number; expense: number; key: string }[];
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
      .padding(0.3);
  
    const maxValue = d3.max(props.data, d => Math.max(d.income, d.expense)) || 0;
    const yScale = d3
      .scaleLinear()
      .domain([0, maxValue * 1.1]) // Add 10% padding
      .range([innerHeight, 0]);
  
    // Define axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale).ticks(5).tickFormat(d => {
      if (finance.settings.value.display_unit === 'fiat') {
        return d.toString();
      } else {
        return d.toString();
      }
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
  
    // Add grouped bars
    const barWidth = xScale.bandwidth() / 2;
  
    // Income bars
    chart
      .selectAll('.income-bar')
      .data(props.data)
      .enter()
      .append('rect')
      .attr('class', 'income-bar')
      .attr('x', d => (xScale(d.month) || 0))
      .attr('y', d => yScale(d.income))
      .attr('width', barWidth)
      .attr('height', d => innerHeight - yScale(d.income))
      .attr('fill', '#10B981') // Emerald-500
      .attr('rx', 2) // Rounded corners
      .append('title')
      .text(d => `Income: ${d.income.toFixed(2)}`);
  
    // Expense bars
    chart
      .selectAll('.expense-bar')
      .data(props.data)
      .enter()
      .append('rect')
      .attr('class', 'expense-bar')
      .attr('x', d => (xScale(d.month) || 0) + barWidth)
      .attr('y', d => yScale(d.expense))
      .attr('width', barWidth)
      .attr('height', d => innerHeight - yScale(d.expense))
      .attr('fill', '#EF4444') // Red-500
      .attr('rx', 2) // Rounded corners
      .append('title')
      .text(d => `Expense: ${d.expense.toFixed(2)}`);
  
    // Add legend
    const legend = svg
      .append('g')
      .attr('transform', `translate(${width - 100}, 10)`);
  
    // Income legend
    legend
      .append('rect')
      .attr('width', 15)
      .attr('height', 15)
      .attr('fill', '#10B981');
  
    legend
      .append('text')
      .attr('x', 20)
      .attr('y', 12.5)
      .text('Income')
      .attr('font-size', '12px')
      .attr('alignment-baseline', 'middle');
  
    // Expense legend
    legend
      .append('rect')
      .attr('width', 15)
      .attr('height', 15)
      .attr('fill', '#EF4444')
      .attr('y', 20);
  
    legend
      .append('text')
      .attr('x', 20)
      .attr('y', 27.5)
      .text('Expense')
      .attr('font-size', '12px')
      .attr('alignment-baseline', 'middle');
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