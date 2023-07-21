<template>
    <Doughnut
      id="my-chart-id"
      :options="chartOptions"
      :data="chartDataProp"
    />
  </template>
  
  <script>
  import { Doughnut } from 'vue-chartjs'
  import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement, CategoryScale, LinearScale } from 'chart.js'
  
  ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale, LinearScale)
  
  export default {
    name: 'DoughnutChart',
    components: { Doughnut },
    props: {
      chartDataProp: {
        type: Object,
        required: true
      }
    },
    data() {
      return {
        chartOptions: {
          responsive: true,
          maintainAspectRatio: true,
          cutout: '30%'
        }
      }
    }
  }
  </script>
  