<template>
  <div class="relative h-full w-full aspect-square">
    <!-- Info tooltip -->
    <div class="absolute left-2 top-2 z-10">
      <div class="relative group">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400 cursor-help" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
        </svg>
        <div class="absolute z-20 top-0 left-6 transform opacity-0 group-hover:opacity-100 bg-gray-800 text-white text-xs rounded p-2 w-64 transition-opacity">
          <p><b>Color Distribution Chart</b></p>
          <p class="mt-1">This visualization shows image colors organized in two rings:</p>
          <ul class="list-disc pl-4 mt-1">
            <li><b>Inner ring:</b> Parent color groups</li>
            <li><b>Outer ring:</b> Actual image colors</li>
          </ul>
          <p class="mt-1">Hover over segments for details, or click maximize button to see full-size chart with additional information.</p>
        </div>
      </div>
    </div>
    
    <!-- Maximize button -->
    <button @click="isMaximized = true"
      class="absolute right-2 top-2 z-10 rounded-lg bg-white/80 p-2 shadow-sm hover:bg-white">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2">
        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
      </svg>
    </button>

    <!-- Original chart -->
    <div ref="chartContainer" class="h-full w-full"></div>

    <!-- Modal -->
    <Teleport to="body">
      <div v-if="isMaximized" class="fixed inset-0 z-50">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-gray-500/75" @click="isMaximized = false"></div>

        <!-- Modal content -->
        <div class="absolute inset-4 rounded-lg bg-white p-4 shadow-xl">
          <!-- Close button -->
          <button @click="isMaximized = false"
            class="absolute right-6 top-6 rounded-lg bg-white/80 p-2 shadow-sm hover:bg-gray-100">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          <!-- Maximized chart -->
          <div class="h-[calc(100vh-4rem)] overflow-auto"> <!-- Add scroll container -->
            <div ref="maximizedChartContainer" class="w-full" style="min-height: 600px;" />
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue';

export default {
  name: 'GroupedColorsDoughnut',
  props: {
    chartDataProp: {
      type: Object,
      required: true,
      validator: (obj) => {
        return obj.labels && obj.datasets;
      },
    },
  },
  setup(props) {
    const isMaximized = ref(false);
    const chartContainer = ref(null);
    const maximizedChartContainer = ref(null);
    let chart = null;
    let maximizedChart = null;

    const createChartOptions = (isMaximized = false) => {
      const parentData = [];
      const childData = [];

      // Create parent color data
      props.chartDataProp.labels.forEach((label, i) => {
        parentData.push({
          name: label,
          y: props.chartDataProp.datasets[0].data[i],
          color: props.chartDataProp.datasets[0].backgroundColor[i]
        });
      });

      // Create child color data
      props.chartDataProp.datasets[1].data.forEach((percentage, i) => {
        const metadata = props.chartDataProp.datasets[1].metadata[i];
        childData.push({
          name: metadata.name,
          y: percentage,
          color: metadata.hex,
          pantone: metadata.pantone,
          parent: {
            name: metadata.parentName,
            hex: metadata.parentHex,
            distance: metadata.distance
          }
        });
      });

      return {
        chart: {
          type: 'pie',
          height: '100%',
          reflow: true,
          margin: isMaximized ? [10, 10, 10, 10] : [0, 0, 0, 0]
        },
        title: {
          text: ''
        },
        plotOptions: {
          pie: {
            shadow: false,
            center: ['50%', '50%'],
            size: isMaximized ? '85%' : '100%',
            states: {
              inactive: {
                opacity: 1
              },
            }
          }
        },
        tooltip: {
          useHTML: true,
          formatter: function () {
            if (this.point.pantone) {
              // Child color tooltip
              return `<div style="min-width: 200px">
                <b>${this.point.name}</b>: ${this.y.toFixed(1)}%<br/>
                Hex: ${this.point.color}<br/>
                Pantone: ${this.point.pantone.code || 'N/A'}<br/>
                Pantone Distance: ${this.point.pantone.distance.toFixed(2)}<br/>
                Parent: ${this.point.parent.name}<br/>
                Parent Distance: ${this.point.parent.distance.toFixed(2)}
              </div>`;
            } else {
              // Parent color tooltip
              return `<b>${this.point.name}</b>: ${this.y.toFixed(1)}%`;
            }
          }
        },
        series: [{
          name: 'Color Groups',
          data: parentData,
          size: '45%',
          dataLabels: {
            color: '#ffffff',
            distance: '-50%'
          }
        }, {
          name: 'Color Variants',
          data: childData,
          size: '80%',
          innerSize: '60%',
          dataLabels: {
            format: '<b>{point.name}:</b> <span style="opacity: 0.5">{point.y:.1f}%</span>',
            filter: {
              property: 'y',
              operator: '>',
              value: isMaximized ? 0.5 : 1
            },
            style: {
              fontWeight: 'normal'
            }
          }
        }]
      };
    };

    const initChart = () => {
      if (!window.Highcharts) return;

      if (chart) {
        chart.destroy();
      }
      chart = window.Highcharts.chart(chartContainer.value, createChartOptions(false));
    };

    const initMaximizedChart = () => {
      if (!window.Highcharts || !isMaximized.value) return;

      if (maximizedChart) {
        maximizedChart.destroy();
      }
      maximizedChart = window.Highcharts.chart(maximizedChartContainer.value, createChartOptions(true));
    };

    onMounted(() => {
      initChart();
    });

    watch(() => props.chartDataProp, () => {
      initChart();
      if (isMaximized.value) {
        initMaximizedChart();
      }
    });

    watch(isMaximized, (newValue) => {
      if (newValue) {
        // Need to wait for the DOM to update
        setTimeout(initMaximizedChart, 0);
      }
    });

    return {
      isMaximized,
      chartContainer,
      maximizedChartContainer,
    };
  },
};
</script>