import { describe, it, expect } from 'vitest'
import chroma from 'chroma-js'
import {
  rgbToLab,
  closestCentroidIndexLab,
  euclideanDistance,
  performKMeans,
  calculateColorPercentages,
} from '@/services/imageAnalyzerSupport'

// Deterministic pseudo-random pixels so tests don't depend on Math.random
const lcg = (seed) => () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296
const noisyPixels = (base, n, spread, rnd) =>
  Array.from({ length: n }, () => base.map((c) => Math.max(0, Math.min(255, Math.round(c + (rnd() - 0.5) * spread)))))

describe('rgbToLab', () => {
  it('agrees with chroma-js within rounding tolerance', () => {
    for (const rgb of [[0, 0, 0], [255, 255, 255], [255, 0, 0], [0, 0, 128], [64, 64, 64], [43, 63, 158], [233, 196, 106]]) {
      const ours = rgbToLab(rgb)
      const ref = chroma(...rgb).lab()
      ours.forEach((v, i) => expect(Math.abs(v - ref[i]), `${rgb} channel ${i}`).toBeLessThan(0.05))
    }
  })
})

describe('closestCentroidIndexLab', () => {
  it('assigns by perceptual (LAB) distance, not by RGB distance', () => {
    // Navy is closer to dark grey in RGB (Δ≈111 vs 127) but closer to blue in LAB (ΔE76 ≈57 vs 82).
    const navy = [0, 0, 128]
    const centroidsRgb = [[64, 64, 64], [0, 0, 255]]
    const centroidsLab = centroidsRgb.map(rgbToLab)

    expect(euclideanDistance(navy, centroidsRgb[0])).toBeLessThan(euclideanDistance(navy, centroidsRgb[1])) // RGB says grey
    expect(closestCentroidIndexLab(navy, centroidsLab)).toBe(1) // LAB says blue
  })
})

describe('performKMeans', () => {
  it('returns LAB centroids alongside RGB centroids, and per-sample labels', () => {
    const rnd = lcg(7)
    const pixels = [...noisyPixels([220, 30, 30], 60, 20, rnd), ...noisyPixels([30, 30, 220], 40, 20, rnd)]
    const result = performKMeans(pixels, { k: 2, seed: 1 })

    expect(result.centroids).toHaveLength(2)
    expect(result.centroidsLab).toHaveLength(2)
    expect(result.clusters).toHaveLength(pixels.length)
    // RGB centroids are the LAB centroids converted back — they must describe the same colours
    result.centroids.forEach((rgb, i) => {
      const back = rgbToLab(rgb)
      back.forEach((v, ch) => expect(Math.abs(v - result.centroidsLab[i][ch])).toBeLessThan(1.5))
    })
  })

  it('is reproducible when a seed is given', () => {
    const rnd = lcg(11)
    const pixels = [...noisyPixels([200, 180, 40], 50, 40, rnd), ...noisyPixels([20, 90, 60], 50, 40, rnd), ...noisyPixels([120, 120, 120], 50, 40, rnd)]
    const a = performKMeans(pixels, { k: 3, seed: 42 })
    const b = performKMeans(pixels, { k: 3, seed: 42 })
    expect(a.centroidsLab).toEqual(b.centroidsLab)
    expect(a.clusters).toEqual(b.clusters)
  })
})

describe('calculateColorPercentages', () => {
  it('counts every pixel in LAB against the same centroids k-means produced; percentages sum to 100', async () => {
    const pixels = [...Array(700).fill([255, 0, 0]), ...Array(300).fill([0, 0, 255])]
    const { centroids, centroidsLab } = performKMeans(pixels, { k: 2, seed: 3 })

    const colors = await calculateColorPercentages(pixels, centroids, (pixel) => closestCentroidIndexLab(pixel, centroidsLab))

    const total = colors.reduce((s, c) => s + c.percentage, 0)
    expect(total).toBeCloseTo(100, 6)
    const byHex = Object.fromEntries(colors.map((c) => [c.color, c.percentage]))
    expect(byHex['#FF0000']).toBeCloseTo(70, 6)
    expect(byHex['#0000FF']).toBeCloseTo(30, 6)
  })
})
