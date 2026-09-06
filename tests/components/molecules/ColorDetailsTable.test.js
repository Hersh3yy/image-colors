import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ColorDetailsTable from '@/components/molecules/ColorDetailsTable.vue'

// Mock the composable
vi.mock('@/composables/useColorUtils', () => ({
  useColorUtils: () => ({
    getColorDescription: vi.fn((color) => `Description for ${color}`)
  })
}))

describe('ColorDetailsTable', () => {
  const mockColors = [
    {
      color: '#FF0000',
      percentage: 25.5,
      parent: {
        name: 'Red',
        hex: '#FF0000',
        distance: 2.1
      },
      pantone: {
        name: 'PMS 185',
        code: '185',
        hex: '#FF0000'
      }
    },
    {
      color: '#00FF00',
      percentage: 15.2,
      parent: {
        name: 'Green',
        hex: '#00FF00',
        distance: 1.8
      },
      pantone: {
        name: 'PMS 354',
        code: '354',
        hex: '#00FF00'
      }
    }
  ]

  it('renders color data correctly', () => {
    const wrapper = mount(ColorDetailsTable, {
      props: {
        colors: mockColors
      }
    })
    
    expect(wrapper.text()).toContain('Red')
    expect(wrapper.text()).toContain('Green')
    expect(wrapper.text()).toContain('25.5%')
    expect(wrapper.text()).toContain('15.2%')
  })

  it('emits feedback event when improve match button is clicked', async () => {
    // AtomsBaseButton is a Nuxt auto-import; stub it as a plain button that
    // renders its `text` prop so the click can be found and forwarded.
    const wrapper = mount(ColorDetailsTable, {
      props: { colors: mockColors },
      global: {
        stubs: {
          AtomsBaseButton: {
            props: ['text', 'variant', 'size', 'title'],
            emits: ['click'],
            template: '<button @click="$emit(\'click\')">{{ text }}</button>'
          }
        }
      }
    })

    const improveMatchButton = wrapper.findAll('button').find(btn => btn.text().includes('Improve Match'))
    expect(improveMatchButton, 'Improve Match button should render').toBeDefined()

    await improveMatchButton.trigger('click')
    expect(wrapper.emitted('feedback')).toBeTruthy()
    // Rows are sorted by percentage desc, so the first button belongs to the 25.5% colour.
    expect(wrapper.emitted('feedback')[0][0]).toEqual(mockColors[0])
  })

  it('sorts colors by percentage by default', () => {
    const wrapper = mount(ColorDetailsTable, {
      props: {
        colors: mockColors
      }
    })
    
    // The first color should be the one with higher percentage (25.5%)
    const firstRow = wrapper.find('tbody tr')
    expect(firstRow.text()).toContain('25.5%')
  })

  it('handles empty colors array', () => {
    const wrapper = mount(ColorDetailsTable, {
      props: {
        colors: []
      }
    })
    
    expect(wrapper.find('tbody tr').exists()).toBe(false)
  })

  it('emits copy event when color swatch is clicked', async () => {
    // jsdom has no navigator.clipboard; define a restorable one for this test only.
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true
    })

    // AtomsColorSwatch is a Nuxt auto-import; stand in for it with a stub that
    // forwards its `copy` event the way the real atom does on click.
    const wrapper = mount(ColorDetailsTable, {
      props: { colors: mockColors },
      global: {
        stubs: {
          AtomsColorSwatch: {
            props: ['color', 'size'],
            emits: ['copy'],
            template: '<div class="swatch-stub" @click="$emit(\'copy\', color)"></div>'
          }
        }
      }
    })

    const colorSwatch = wrapper.find('[data-color="#FF0000"]')
    expect(colorSwatch.exists()).toBe(true)

    await colorSwatch.trigger('click')
    await flushPromises() // copyToClipboard emits after the clipboard promise resolves

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('#FF0000')
    expect(wrapper.emitted('copy')).toEqual([['#FF0000']])

    delete navigator.clipboard // don't leak the mock into other tests
  })
})
