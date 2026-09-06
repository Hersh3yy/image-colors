import { describe, it, expect, vi } from 'vitest'

vi.mock('@/composables/useColorMatcherService', () => ({
  useColorMatcherService: () => ({ isInitialized: false }),
}))

import { settingsToAnalysisOptions, REPRODUCIBLE_SEED } from '@/services/imageAnalyzer'
import { defaultSettings, validateSettingsRanges } from '@/composables/useAnalysisSettings'

describe('settingsToAnalysisOptions', () => {
  it('forwards every slider the UI exposes — none may be dropped on the way to the pipeline', () => {
    const settings = { sampleSize: 25000, k: 7, maxImageSize: 400, maxIterations: 55, confidenceThreshold: 35, reproducibleRuns: false }
    const options = settingsToAnalysisOptions(settings)

    expect(options).toMatchObject({ sampleSize: 25000, k: 7, maxImageSize: 400, maxIterations: 55, confidenceThreshold: 35 })
    expect(options.seed).toBeUndefined() // unseeded by default: run-to-run variation is wanted
  })

  it('turns reproducibleRuns into a fixed seed', () => {
    expect(settingsToAnalysisOptions({ ...defaultSettings, reproducibleRuns: true }).seed).toBe(REPRODUCIBLE_SEED)
  })

  it('accepts the defaults from useAnalysisSettings unchanged', () => {
    const options = settingsToAnalysisOptions(defaultSettings)
    expect(options).toEqual({ sampleSize: 10000, k: 13, maxImageSize: 800, maxIterations: 30, confidenceThreshold: 20 })
  })
})

describe('validateSettingsRanges', () => {
  it('clamps numbers, coerces the reproducible flag, and drops retired settings from old localStorage payloads', () => {
    const v = validateSettingsRanges({ sampleSize: 5, k: 99, maxImageSize: 10, maxIterations: 1000, confidenceThreshold: 0,
      reproducibleRuns: 'yes', colorSpace: 'lab', distanceMethod: 'deltaE' })
    expect(v).toEqual({ sampleSize: 1000, k: 20, maxImageSize: 200, maxIterations: 100, confidenceThreshold: 20, reproducibleRuns: true })
  })
})
