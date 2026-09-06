import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import GroupedColorsDoughnut from '@/components/molecules/GroupedColorsDoughnut.vue'

describe('GroupedColorsDoughnut', () => {
  const mockChartData = {
    labels: ['Red', 'Blue', 'Green'],
    datasets: [
      {
        data: [40, 35, 25],
        backgroundColor: ['#FF0000', '#0000FF', '#00FF00']
      },
      {
        data: [20, 20, 15, 15, 10, 10],
        metadata: [
          {
            name: 'Crimson',
            hex: '#DC143C',
            pantone: { code: '185', distance: 1.2 },
            parentName: 'Red',
            parentHex: '#FF0000',
            distance: 2.1
          },
          {
            name: 'Scarlet',
            hex: '#FF2400',
            pantone: { code: '186', distance: 1.5 },
            parentName: 'Red',
            parentHex: '#FF0000',
            distance: 1.8
          },
          {
            name: 'Navy',
            hex: '#000080',
            pantone: { code: '281', distance: 1.1 },
            parentName: 'Blue',
            parentHex: '#0000FF',
            distance: 1.2
          },
          {
            name: 'Royal',
            hex: '#4169E1',
            pantone: { code: '2728', distance: 1.3 },
            parentName: 'Blue',
            parentHex: '#0000FF',
            distance: 2.5
          },
          {
            name: 'Forest',
            hex: '#228B22',
            pantone: { code: '349', distance: 1.4 },
            parentName: 'Green',
            parentHex: '#00FF00',
            distance: 3.1
          },
          {
            name: 'Lime',
            hex: '#32CD32',
            pantone: { code: '375', distance: 1.6 },
            parentName: 'Green',
            parentHex: '#00FF00',
            distance: 2.8
          }
        ]
      }
    ]
  }

  beforeEach(() => {
    // Mock Highcharts
    global.Highcharts = {
      chart: vi.fn(() => ({
        destroy: vi.fn(),
        setSize: vi.fn(),
      })),
    }
  })

  // The modal lives in a <Teleport to="body">; stub it so the close button is inside the wrapper.
  const mountChart = (props = { chartDataProp: mockChartData }) =>
    mount(GroupedColorsDoughnut, { props, global: { stubs: { teleport: true } } })

  it('renders chart container', () => {
    const wrapper = mountChart()

    expect(wrapper.find('.h-full.w-full').exists()).toBe(true)
    // Vue strips `ref` attributes from the DOM; assert on the template ref itself.
    expect(wrapper.vm.chartContainer).toBeInstanceOf(HTMLElement)
  })

  it('shows maximize button', () => {
    const wrapper = mount(GroupedColorsDoughnut, {
      props: {
        chartDataProp: mockChartData
      }
    })
    
    const maximizeButton = wrapper.find('button')
    expect(maximizeButton.exists()).toBe(true)
  })

  it('opens modal when maximize button is clicked', async () => {
    const wrapper = mount(GroupedColorsDoughnut, {
      props: {
        chartDataProp: mockChartData
      }
    })
    
    const maximizeButton = wrapper.find('button')
    await maximizeButton.trigger('click')
    
    expect(wrapper.vm.isMaximized).toBe(true)
  })

  it('closes modal when close button is clicked', async () => {
    const wrapper = mountChart()

    // Open modal first
    wrapper.vm.isMaximized = true
    await wrapper.vm.$nextTick()
    
    // Find and click close button
    const closeButton = wrapper.find('button[class*="right-6"]')
    await closeButton.trigger('click')
    
    expect(wrapper.vm.isMaximized).toBe(false)
  })

  it('creates chart with correct options', () => {
    const wrapper = mount(GroupedColorsDoughnut, {
      props: {
        chartDataProp: mockChartData
      }
    })
    
    // Trigger chart creation
    wrapper.vm.initChart()
    
    expect(global.Highcharts.chart).toHaveBeenCalled()
    const chartOptions = global.Highcharts.chart.mock.calls[0][1]
    
    expect(chartOptions.chart.type).toBe('pie')
    expect(chartOptions.series).toHaveLength(2)
    expect(chartOptions.series[0].name).toBe('Color Groups')
    expect(chartOptions.series[1].name).toBe('Color Variants')
  })

  it('handles chart data updates', async () => {
    const wrapper = mount(GroupedColorsDoughnut, {
      props: {
        chartDataProp: mockChartData
      }
    })
    
    const newChartData = {
      ...mockChartData,
      labels: ['Yellow', 'Purple'],
      datasets: [
        {
          data: [50, 50],
          backgroundColor: ['#FFFF00', '#800080']
        },
        {
          data: [25, 25],
          metadata: [
            {
              name: 'Gold',
              hex: '#FFD700',
              pantone: { code: '123', distance: 1.0 },
              parentName: 'Yellow',
              parentHex: '#FFFF00',
              distance: 1.5
            },
            {
              name: 'Violet',
              hex: '#8B008B',
              pantone: { code: '2592', distance: 1.2 },
              parentName: 'Purple',
              parentHex: '#800080',
              distance: 2.0
            }
          ]
        }
      ]
    }
    
    await wrapper.setProps({ chartDataProp: newChartData })

    // Once on mount, once for the prop change — no double-init on mount.
    expect(global.Highcharts.chart).toHaveBeenCalledTimes(2)
  })
})
