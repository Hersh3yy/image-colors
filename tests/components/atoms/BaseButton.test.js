import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseButton from '@/components/atoms/BaseButton.vue'

describe('BaseButton', () => {
  it('renders with default props', () => {
    const wrapper = mount(BaseButton, {
      props: {
        text: 'Click me'
      }
    })
    
    expect(wrapper.text()).toContain('Click me')
    expect(wrapper.classes()).toContain('bg-blue-500')
    expect(wrapper.classes()).toContain('text-white')
  })

  it('emits click event when clicked', async () => {
    const wrapper = mount(BaseButton, {
      props: {
        text: 'Click me'
      }
    })
    
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
  })

  it('applies different variants correctly', () => {
    const wrapper = mount(BaseButton, {
      props: {
        text: 'Success Button',
        variant: 'success'
      }
    })
    
    expect(wrapper.classes()).toContain('bg-green-500')
    expect(wrapper.classes()).toContain('hover:bg-green-600')
  })

  it('applies different sizes correctly', () => {
    const wrapper = mount(BaseButton, {
      props: {
        text: 'Small Button',
        size: 'sm'
      }
    })
    
    expect(wrapper.classes()).toContain('px-3')
    expect(wrapper.classes()).toContain('py-1')
    expect(wrapper.classes()).toContain('text-sm')
  })

  it('can be disabled', () => {
    const wrapper = mount(BaseButton, {
      props: {
        text: 'Disabled Button',
        disabled: true
      }
    })
    
    expect(wrapper.attributes('disabled')).toBeDefined()
    expect(wrapper.classes()).toContain('disabled:opacity-50')
  })
})
