<!-- ParentColorPieChart.vue -->
<template>
  <div>
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import Chart from "chart.js/auto";

const props = defineProps({
  colors: {
    type: Array,
    required: true,
    validator: (value) =>
      value.every(
        (item) =>
          typeof item.closestParentColor === "string" &&
          typeof item.percentage === "number"
      ),
  },
});

const chartCanvas = ref(null);
let chart = null;

const createChart = () => {
  if (!chartCanvas.value) return;

  if (chart) {
    chart.destroy();
  }

  const parentColors = props.colors.reduce((acc, color) => {
    if (!acc[color.closestParentColor]) {
      acc[color.closestParentColor] = 0;
    }
    acc[color.closestParentColor] += color.percentage;
    return acc;
  }, {});

  const labels = Object.keys(parentColors);
  const data = Object.values(parentColors);

  chart = new Chart(chartCanvas.value, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: labels.map((label) => label.toLowerCase()),
          borderColor: "white",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "top",
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              return `${context.label}: ${context.formattedValue}%`;
            },
          },
        },
      },
    },
  });
};

onMounted(() => {
  createChart();
});

watch(
  () => props.colors,
  () => {
    createChart();
  },
  { deep: true }
);
</script>
