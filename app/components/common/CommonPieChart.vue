<template>
  <div ref="lineChart2" class="h-full w-full" />
</template>

<script setup lang="ts">
import { type ECOption, useEcharts } from "@/hooks/echart";
// import { colorsItems } from '~/lib';

interface Props {
  title?: string;
  data: {
    name: string;
    value: number;
  }[];
  colors?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  title: "",
  data: () => [],
  colors: () => [],
});

const chart2 = ref<ECOption>() as Ref<ECOption>;
const { domRef: lineChart2 } = useEcharts(chart2);

function renderChart() {
  chart2.value = {
    title: {
      text: props.title,
      textStyle: {
        fontFamily: "Bouasavanh",
      },
    },
    tooltip: {
      trigger: "item",
    },
    // skip color index 0
    // color: [
    //   ...props.colors,
    //    ...colorsItems
    // ],
    legend: {
      orient: "vertical",
      left: "right",
      top: "center",
      textStyle: {
        fontFamily: "Bouasavanh",
      },
    },
    series: [
      {
        type: "pie",
        // left: '-20%',
        top: "10%",
        // bottom: '2%',
        // radius: ['30%', '70%'],
        // avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 5,
          borderColor: "#fff",
          borderWidth: 2,
        },
        label: {
          show: true,
          // position: 'center',
          formatter: "{d}%",
        },
        labelLine: {
          show: true,
        },
        data: props.data,
      },
    ],
  };
}

onMounted(() => {
  renderChart();
});

watch(
  () => props.data,
  () => {
    renderChart();
  }
);
</script>
