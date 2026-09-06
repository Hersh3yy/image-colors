import { config } from '@vue/test-utils'
import { vi } from 'vitest'

// Global test configuration
config.global.stubs = {
  // Stub Nuxt components that might not be available in test environment
  'NuxtLink': true,
  'NuxtImg': true,
}

// Highcharts is mocked per-test in GroupedColorsDoughnut.test.js (it needs
// fresh call counts); nothing else touches window.Highcharts.

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
