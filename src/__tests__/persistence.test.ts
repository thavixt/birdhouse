import { afterEach, describe, expect, it, vi } from 'vitest'
import { newGame } from '../game/__tests__/helpers'
import { clearSavedGame, loadLeaderboard, loadSavedGame, recordWinners, saveGame, saveWhenLeaving } from '../persistence'

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
  it('saves again when the app is hidden, the window blurs or the page unloads', () => {
    const storage = memoryStorage()
    const doc = Object.assign(new EventTarget(), { visibilityState: 'visible' })
    const win = new EventTarget()
    vi.stubGlobal('localStorage', storage)
    vi.stubGlobal('document', doc)
    vi.stubGlobal('window', win)
    const game = newGame(4)
    const stop = saveWhenLeaving(game)
    const saved = () => storage.data.get('birdhouse.savedGame')

    doc.dispatchEvent(new Event('visibilitychange')) // became visible: nothing to do
    expect(saved()).toBeUndefined()
    doc.visibilityState = 'hidden' // switched apps / locked the phone
    doc.dispatchEvent(new Event('visibilitychange'))
    expect(loadSavedGame()).toEqual(game)

    for (const type of ['blur', 'pagehide']) {
      storage.data.clear()
      win.dispatchEvent(new Event(type))
      expect(loadSavedGame(), type).toEqual(game)
    }

    stop()
    storage.data.clear()
    win.dispatchEvent(new Event('pagehide'))
    expect(saved()).toBeUndefined()
  })

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
    expect(loadLeaderboard()).toEqual([])
    expect(() => recordWinners({ ...newGame(4, 1), phase: 'gameOver' })).not.toThrow()
  })

  it('records winners of finished games on the leaderboard', () => {
    vi.stubGlobal('localStorage', memoryStorage())
    expect(loadLeaderboard()).toEqual([])
    const solo = { ...newGame(4, 1), phase: 'gameOver' as const }
    recordWinners(solo, '2026-11-22T10:00:00.000Z')
    recordWinners(solo, '2026-11-23T10:00:00.000Z')
    const board = loadLeaderboard()
    expect(board).toHaveLength(2)
    expect(board[0]).toMatchObject({ name: 'P1', score: 5, players: 1, bots: 0, date: '2026-11-22T10:00:00.000Z' })

    recordWinners({ ...solo, phase: 'playing' }) // unfinished: ignored
    expect(loadLeaderboard()).toHaveLength(2)
  })
})
