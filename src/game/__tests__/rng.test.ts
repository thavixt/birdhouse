import { describe, expect, it } from 'vitest'
import { nextRandom, shuffle } from '../rng'

describe('rng', () => {
  it('same seed gives same sequence', () => {
    const seq = (seed: number) => {
      const out: number[] = []
      let s = seed
      for (let i = 0; i < 10; i++) {
        const [v, n] = nextRandom(s)
        out.push(v)
        s = n
      }
      return out
    }
    expect(seq(42)).toEqual(seq(42))
    expect(seq(42)).not.toEqual(seq(43))
    expect(seq(7).every((v) => v >= 0 && v < 1)).toBe(true)
  })

  it('shuffle is a non-mutating permutation', () => {
    const input = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8])
    const [out, s] = shuffle(input, 99)
    expect([...out].sort()).toEqual([...input])
    expect(input).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    expect(shuffle(input, 99)).toEqual([out, s])
  })
})
