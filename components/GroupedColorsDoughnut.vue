<template>
  <div class="relative h-full w-full">
    <!-- Maximize button -->
    <button @click="isMaximized = true"
      class="absolute right-2 top-2 z-10 rounded-lg bg-white/80 p-2 shadow-sm hover:bg-white">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2">
        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
      </svg>
    </button>

    <!-- Original chart -->
    <ag-charts :options="options" class="h-full w-full" />

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
          <ag-charts :options="maximizedOptions" class="h-full w-full" />
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { AgCharts } from 'ag-charts-vue3';

export default {
  name: 'GroupedColorsDoughnut',
  components: {
    'ag-charts': AgCharts,
  },
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

    const transformedData = computed(() => {
      // Outer ring data
      const outerData = props.chartDataProp.labels.map((label, index) => ({
        group: label,
        value: props.chartDataProp.datasets[0].data[index],
        fill: props.chartDataProp.datasets[0].backgroundColor[index],
      }));

      // Inner ring data
      const innerData = [];
      let currentIndex = 0;
      props.chartDataProp.datasets[0].data.forEach((groupTotal, groupIndex) => {
        const colors = [];
        let remainingValue = groupTotal;

        while (remainingValue > 0 && currentIndex < props.chartDataProp.datasets[1].data.length) {
          const value = props.chartDataProp.datasets[1].data[currentIndex];
          colors.push({
            subgroup: `${props.chartDataProp.labels[groupIndex]}-${currentIndex}`,
            value: value,
            fill: props.chartDataProp.datasets[1].backgroundColor[currentIndex],
            parentGroup: props.chartDataProp.labels[groupIndex],
          });
          remainingValue -= value;
          currentIndex++;
        }
        innerData.push(...colors);
      });

      return {
        outer: outerData,
        inner: innerData,
      };
    });

    const totalPercentage = computed(() => {
      return transformedData.value.outer.reduce((sum, item) => sum + item.value, 0).toFixed(1);
    });

    const createChartOptions = (isMaximized = false) => ({
      autoSize: true,
      padding: {
        top: isMaximized ? 60 : 40,
        right: isMaximized ? 200 : 140,
        bottom: isMaximized ? 60 : 40,
        left: isMaximized ? 60 : 40,
      },
      series: [
        {
          type: 'donut',
          data: transformedData.value.outer,
          angleKey: 'value',
          sectorLabelKey: 'group',
          legendItemKey: 'group',
          fillOpacity: 1,
          strokeWidth: 2,
          strokeOpacity: 1,
          outerRadiusRatio: 1,
          innerRadiusRatio: 0.65,
          itemStyler: (params) => {
            return {
              fill: params.datum.fill,
              stroke: '#ffffff'
            };
          },
          tooltip: {
            renderer: ({ datum }) => ({
              title: datum.group,
              content: `${datum.value.toFixed(1)}%`,
            }),
          },
          sectorLabel: {
            enabled: false
          },
          innerCircle: {
            fill: '#ffffff',
            fillOpacity: 1
          },
        },
        {
          type: 'donut',
          data: transformedData.value.inner,
          angleKey: 'value',
          legendItemKey: 'subgroup',
          showInLegend: false,
          fillOpacity: 1,
          strokeWidth: 2,
          strokeOpacity: 1,
          outerRadiusRatio: 0.55,
          innerRadiusRatio: 0.2,
          itemStyler: (params) => {
            return {
              fill: params.datum.fill,
              stroke: '#ffffff'
            };
          },
          tooltip: {
            renderer: ({ datum }) => ({
              title: datum.parentGroup,
              content: `${datum.value.toFixed(1)}%`,
            }),
          },
          sectorLabel: {
            enabled: false
          }
        },
      ],
      legend: {
        position: 'right',
        item: {
          paddingY: isMaximized ? 20 : 16,
          marker: {
            shape: 'square',
            size: isMaximized ? 20 : 16,
            strokeWidth: 0,
            padding: isMaximized ? 6 : 4
          },
        },
      },
    });

    const options = computed(() => createChartOptions(false));
    const maximizedOptions = computed(() => createChartOptions(true));

    return {
      options,
      maximizedOptions,
      isMaximized,
    };
  },
};
</script>