<template>
  <div ref="lineChart" v-bind="$attrs" class="h-full w-full" />
</template>

<script setup lang="ts">
import { type ECOption, useEcharts } from "@/hooks/echart";
import type { KeyValue } from "~/types";

interface Props {
  title?: string;
  xAxisData?: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  series?: any;
  option?: ECOption; // Note: Prop is 'option', not 'options'
}

const { locale } = useI18n();

const props = withDefaults(defineProps<Props>(), {
  title: "",
  xAxisData: () => [],
  series: () => [],
  option: () => ({}),
});

const chartRef = ref<ECOption>() as Ref<ECOption>;
const { domRef: lineChart } = useEcharts(chartRef);

// Deep merge function that allows full override for new keys
function deepMerge(target: KeyValue, source: KeyValue): KeyValue {
  const output = { ...target };

  if (isObject(source)) {
    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        // If source[key] is an object and not an array, merge recursively
        if (isObject(source[key]) && !Array.isArray(source[key])) {
          output[key] = deepMerge(output[key] || {}, source[key]);
        } else {
          // For arrays or primitive values, fully override the target
          output[key] = Array.isArray(source[key])
            ? [...source[key]]
            : source[key];
        }
      }
    }
  }
  return output;
}

function isObject(obj: KeyValue): boolean {
  return obj != null && typeof obj === "object" && !Array.isArray(obj);
}

const defaultOption: ECOption = {
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "cross",
      label: {
        backgroundColor: "#6a7985",
        fontFamily: "Bouasavanh",
      },
    },
  },
  grid: {
    left: "2%",
    right: "4%",
    bottom: "0%",
    top: "10%",
    containLabel: true,
  },
  legend: {
    top: "0%",
    textStyle: {
      fontFamily: "Bouasavanh",
    },
  },
  xAxis: [
    {
      type: "category",
      // boundaryGap: false,
      axisLine: {
        lineStyle: {
          color: "#FCFCFC",
          cap: "round",
          dashOffset: 5,
        },
      },
      axisLabel: {
        color: "#BDBBBB",
        fontFamily: "Bouasavanh",
      },
      // data: [],
    },
  ],
  yAxis: [
    {
      type: "value",
      splitLine: {
        lineStyle: {
          // color: lineChartColor.value,
        },
      },
      axisLine: {
        lineStyle: {
          color: "#FCFCFC",
          cap: "round",
          dashOffset: 5,
        },
      },
      axisLabel: {
        color: "#BDBBBB",
      },
    },
  ],
};

function renderChart() {
  // Deep merge default with props.option
  const mergedOption = deepMerge(defaultOption, props.option);

  // Override xAxis data specifically
  if (
    mergedOption.xAxis &&
    Array.isArray(mergedOption.xAxis) &&
    mergedOption.xAxis[0]
  ) {
    mergedOption.xAxis[0].data = props.xAxisData.length
      ? props.xAxisData
      : [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
  }

  // Override series
  mergedOption.series = props.series;

  chartRef.value = mergedOption;
}

watch(
  () => [props.series, props.xAxisData, props.option],
  () => {
    renderChart();
  },
  { deep: true }
);

onMounted(() => {
  renderChart();
});
</script>
