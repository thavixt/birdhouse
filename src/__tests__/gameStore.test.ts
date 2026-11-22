import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { IDLE, selectedHandIndex, type Draft } from '../draft'
import { food, newGame, withPlayer } from '../game/__tests__/helpers'
import type { GameState } from '../game/types'
import { turnView, useGameStore } from '../store/gameStore'

/** A minimal in-memory Storage, so saving can be observed. */
function memoryStorage() {
  const data = new Map<string, string>()
  return {
    data,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  }
}

const initial = useGameStore.getState()
const store = () => useGameStore.getState()
/** Puts `game` on screen with a fresh turn, as if it had just started. */
const play = (game: GameState) => useGameStore.setState({ game, draft: IDLE, revealedTo: null, inspected: null, toured: [] })

let storage: ReturnType<typeof memoryStorage>
beforeEach(() => {
  storage = memoryStorage()
  vi.stubGlobal('localStorage', storage)
  useGameStore.setState(initial, true)
})
afterEach(() => vi.unstubAllGlobals())

describe('game store: lifecycle', () => {
  it('starts, quits (keeping the game for Continue) and resumes', () => {
    store().newGame([{ name: 'Ann', kind: 'human' }], true)
    const game = store().game
    expect(game?.players.map((p) => p.name)).toEqual(['Ann'])
    expect(store().tutorial).toBe(true)
    expect(storage.data.has('birdhouse.savedGame')).toBe(true)

    store().inspect('mallard')
    store().quit()
    expect(store()).toMatchObject({ game: null, resumable: game, inspected: null, tutorial: false })

    store().resume()
    expect(store()).toMatchObject({ game, resumable: null, tutorial: false })
  })

  it('rematch keeps the line-up with a new game and no tutorial', () => {
    store().newGame([{ name: 'Ann', kind: 'human' }, { name: 'Bot', kind: 'bot' }], true)
    const first = store().game
    store().rematch()
    expect(store().game).not.toBe(first)
    expect(store().game?.players.map((p) => [p.name, p.kind])).toEqual([['Ann', 'human'], ['Bot', 'bot']])
    expect(store().tutorial).toBe(false)
  })
})

describe('game store: dispatch', () => {
  it('applies valid actions through the engine, resets the draft and saves', () => {
    play(newGame(1, 1))
    store().setDraft({ kind: 'gainFood', foods: ['seed'] })
    store().dispatch({ type: 'gainFood', foods: ['seed'] })
    expect(store().game?.players[0].food.seed).toBe(2)
    expect(store().draft).toBe(IDLE)
    expect(storage.data.has('birdhouse.savedGame')).toBe(true)
  })

  it('ignores rejected actions and keeps the draft', () => {
    const game = newGame(1, 1)
    play(game)
    const draft: Draft = { kind: 'gainFood', foods: ['seed', 'seed'] }
    store().setDraft(draft)
    store().dispatch({ type: 'gainFood', foods: ['seed', 'seed'] }) // forest gives 1
    expect(store().game).toBe(game)
    expect(store().draft).toBe(draft)
  })
})

describe('game store: card clicks (the three selection bugs)', () => {
  const twoJays = () => withPlayer(newGame(1, 1), 0, { hand: ['blue-jay', 'great-blue-heron', 'blue-jay'], food: food(2) })

  it('1: with two copies of a bird, only the clicked one is selected', () => {
    play(twoJays())
    store().clickHandCard(2)
    expect(selectedHandIndex(store().game!, store().draft)).toBe(2)
    store().clickHandCard(0)
    expect(selectedHandIndex(store().game!, store().draft)).toBe(0)
  })

  it('2: clicking an unplayable card shows its info and cancels the selected bird', () => {
    play(twoJays())
    store().clickHandCard(0)
    store().clickHandCard(1) // heron: no fish
    expect(store().inspected).toBe('great-blue-heron')
    expect(store().draft).toBe(IDLE)
  })

  it('3: picking up a hand card selects it, however far the pointer moves before letting go', () => {
    play(twoJays())
    store().clickHandCard(0)
    // A "click" that moved while pressed becomes a drag; the browser then sends no click.
    store().startDrag({ kind: 'hand', cardId: 'blue-jay', handIndex: 2 })
    expect(selectedHandIndex(store().game!, store().draft)).toBe(2)
    expect(store().inspected).toBe('blue-jay')
    store().endDrag({ kind: 'hand', cardId: 'blue-jay', handIndex: 2 }, null, { x: 40, y: 0 })
    expect(selectedHandIndex(store().game!, store().draft)).toBe(2) // still selected
    store().startDrag({ kind: 'hand', cardId: 'blue-jay', handIndex: 0 })
    store().endDrag({ kind: 'hand', cardId: 'blue-jay', handIndex: 0 }, { kind: 'hand' }, { x: 300, y: 5 })
    expect(selectedHandIndex(store().game!, store().draft)).toBe(0)
  })

  it('tray cards count as clicked only for a short wobble, not an abandoned drag', () => {
    play(newGame(1, 1))
    store().startDrag({ kind: 'tray', index: 1 })
    store().endDrag({ kind: 'tray', index: 1 }, null, { x: 60, y: 0 })
    expect(store().draft).toBe(IDLE)
    store().startDrag({ kind: 'tray', index: 1 })
    store().endDrag({ kind: 'tray', index: 1 }, null, { x: 5, y: 3 })
    expect(store().draft).toEqual({ kind: 'drawCards', picks: [{ from: 'tray', index: 1 }] })
  })

  it('a real drop still plays the bird', () => {
    play(twoJays())
    store().endDrag({ kind: 'hand', cardId: 'blue-jay', handIndex: 0 }, { kind: 'habitat', habitat: 'forest' }, { x: 200, y: 300 })
    expect(store().game?.players[0].board.forest.map((b) => b.cardId)).toEqual(['blue-jay'])
    expect(store().draft).toBe(IDLE)
  })
})

describe('turnView', () => {
  it('covers the screen between two humans until the next one reveals their hand', () => {
    const game = newGame(1, 2)
    expect(turnView(game, null)).toMatchObject({ viewIdx: 0, handoff: true, interactive: false })
    expect(turnView(game, 0)).toMatchObject({ viewIdx: 0, handoff: false, interactive: true })
  })
})
