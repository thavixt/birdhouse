import { describe, expect, it } from 'vitest'
import { BIRDS, BIRDS_BY_ID, STARTING_DECK } from '../birds'
import { FOODS, HABITATS } from '../types'

describe('birds', () => {
  it('has unique ids and at least one habitat each', () => {
    expect(new Set(BIRDS.map((b) => b.id)).size).toBe(BIRDS.length)
    expect(BIRDS.every((b) => b.habitats.length >= 1)).toBe(true)
    expect(Object.keys(BIRDS_BY_ID)).toHaveLength(BIRDS.length)
  })

  it('meets coverage rules', () => {
    for (const h of HABITATS) expect(BIRDS.filter((b) => b.habitats.includes(h)).length).toBeGreaterThanOrEqual(12)
    for (const f of FOODS) expect(BIRDS.filter((b) => b.cost.foods.includes(f)).length).toBeGreaterThanOrEqual(6)
    expect(BIRDS.filter((b) => b.cost.anyCount > 0).length).toBeGreaterThanOrEqual(4)
    const powered = BIRDS.filter((b) => b.power).length / BIRDS.length
    expect(powered).toBeGreaterThan(0.35)
    expect(powered).toBeLessThan(0.65)
  })

  it('follows the balance guide', () => {
    const ranges: Record<number, [number, number]> = { 1: [1, 3], 2: [3, 5], 3: [5, 8] }
    for (const b of BIRDS) {
      const [lo, hi] = ranges[b.cost.foods.length + b.cost.anyCount]
      expect(b.points, b.id).toBeGreaterThanOrEqual(lo)
      expect(b.points, b.id).toBeLessThanOrEqual(hi)
      expect(b.eggLimit).toBeGreaterThanOrEqual(1)
      expect(b.eggLimit).toBeLessThanOrEqual(6)
    }
  })

  it('starting deck holds every bird twice', () => {
    expect(STARTING_DECK).toHaveLength(BIRDS.length * 2)
  })
})
