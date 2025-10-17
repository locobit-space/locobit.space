<template>
  <div ref="radarChart2" class="h-full w-full" />
</template>

<script setup lang="ts">
import { type ECOption, useEcharts } from '@/hooks/echart';
import type { KeyValue } from '~/types';

interface Props {
  title?: string;
  series: KeyValue[];
  radar: KeyValue;
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  series: () => [],
});

const chart2 = ref<ECOption>() as Ref<ECOption>;
const { domRef: radarChart2 } = useEcharts(chart2);

function renderChart() {
  chart2.value = {
    tooltip: {
      trigger: 'item',
    },
    legend: {
      // show: false,
      left: '30%',
      textStyle: {
        fontFamily: 'Bouasavanh',
      },
    },
    radar: props.radar,
    series: props.series,
  };
}

onMounted(() => {
  renderChart();
});

watch(
  () => props.series,
  () => {
    renderChart();
  }
);
</script>
