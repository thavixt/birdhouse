import { afterEach, describe, expect, it, vi } from 'vitest'
import { newGame } from '../game/__tests__/helpers'
import { clearSavedGame, loadSavedGame, saveGame } from '../persistence'

/** A minimal in-memory Storage. */
function memoryStorage() {
  const data = new Map<string, string>()
  return {
    data,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  }
}

const broken = {
  getItem: () => {
    throw new Error('SecurityError')
  },
  setItem: () => {
    throw new Error('QuotaExceededError')
  },
  removeItem: () => {
    throw new Error('SecurityError')
  },
}

afterEach(() => vi.unstubAllGlobals())

describe('persistence', () => {
  it('saves, loads and clears the game in progress', () => {
    const storage = memoryStorage()
    vi.stubGlobal('localStorage', storage)
    expect(loadSavedGame()).toBeNull()

    const game = newGame(4)
    saveGame(game)
    expect(storage.data.has('birdhouse.savedGame')).toBe(true)
    expect(loadSavedGame()).toEqual(game)

    clearSavedGame()
    expect(loadSavedGame()).toBeNull()
  })

  it('ignores a corrupt save', () => {
    const storage = memoryStorage()
    storage.data.set('birdhouse.savedGame', '{not json')
    vi.stubGlobal('localStorage', storage)
    expect(loadSavedGame()).toBeNull()
  })

  it('keeps working when storage throws', () => {
    vi.stubGlobal('localStorage', broken)
    expect(loadSavedGame()).toBeNull()
    expect(() => saveGame(newGame(4))).not.toThrow()
    expect(() => clearSavedGame()).not.toThrow()
  })
})
