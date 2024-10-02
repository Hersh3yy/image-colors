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
          typeof item.color === "string" && typeof item.percentage === "number"
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

  chart = new Chart(chartCanvas.value, {
    type: "pie",
    data: {
      labels: props.colors.map((c) => c.color),
      datasets: [
        {
          data: props.colors.map((c) => c.percentage),
          backgroundColor: props.colors.map((c) => c.color),
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
