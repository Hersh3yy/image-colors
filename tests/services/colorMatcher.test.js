import { describe, it, expect, vi } from 'vitest'
import chroma from 'chroma-js'

// The matcher consults the (inert) ML service first; keep it out of these tests.
vi.mock('@/composables/useColorMatcherService', () => ({
  useColorMatcherService: () => ({ isInitialized: false }),
}))

import { findClosestParentColor } from '@/services/colorMatcher'

const parents = [
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Silver', hex: '#C0C0C0' },
  { name: 'Black', hex: '#000000' },
  { name: 'Navy', hex: '#000080' },
]

describe('findClosestParentColor', () => {
  it('reports the plain CIEDE2000 distance to the chosen parent — no extra weighting', () => {
    for (const hex of ['#F5F5F5', '#111111', '#1A2A6C', '#808080']) {
      const match = findClosestParentColor(hex, parents)
      const distances = parents.map((p) => chroma.deltaE(hex, p.hex))
      const minIndex = distances.indexOf(Math.min(...distances))

      expect(match.color.name).toBe(parents[minIndex].name)
      expect(match.distance).toBeCloseTo(distances[minIndex], 10)
      expect(match.method).toBe('mathematical')
    }
  })

  it('returns null when there are no parent colours', () => {
    expect(findClosestParentColor('#123456', [])).toBeNull()
  })
})
