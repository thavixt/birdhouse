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

describe('game store: drag and drop', () => {
  const twoJays = () => withPlayer(newGame(1, 1), 0, { hand: ['blue-jay', 'great-blue-heron', 'blue-jay'], food: food(2) })

  it('picking up a hand card shows its info and selects nothing; dropping it nowhere does nothing', () => {
    play(twoJays())
    store().startDrag({ kind: 'hand', cardId: 'blue-jay', handIndex: 2 })
    expect(store().inspected).toBe('blue-jay')
    store().endDrag({ kind: 'hand', cardId: 'blue-jay', handIndex: 2 }, null)
    store().endDrag({ kind: 'hand', cardId: 'blue-jay', handIndex: 2 }, { kind: 'hand' })
    expect(store().draft).toBe(IDLE)
    expect(store().game!.players[0].board.forest).toEqual([])
  })

  it('a bird with a payment choice waits in the action panel, its hand position highlighted', () => {
    // Hummingbird: any 1 food, and the player has seed and fish.
    play(withPlayer(newGame(1, 1), 0, { hand: ['blue-jay', 'ruby-throated-hummingbird'], food: food(1, 0, 1) }))
    store().endDrag({ kind: 'hand', cardId: 'ruby-throated-hummingbird', handIndex: 1 }, { kind: 'habitat', habitat: 'forest' })
    expect(store().draft).toMatchObject({ kind: 'playBird', cardId: 'ruby-throated-hummingbird', habitat: 'forest' })
    expect(selectedHandIndex(store().game!, store().draft)).toBe(1)
    expect(store().game!.players[0].board.forest).toEqual([])
  })

  it('tray cards are only drawn by dropping them in the hand: picking one up just shows its info', () => {
    play(newGame(1, 1))
    const card = store().game!.tray[1]
    store().startDrag({ kind: 'tray', index: 1 })
    expect(store().inspected).toBe(card)
    store().endDrag({ kind: 'tray', index: 1 }, null) // dropped nowhere, however short the drag
    expect(store().draft).toBe(IDLE)
    const hand = store().game!.players[0].hand
    store().startDrag({ kind: 'tray', index: 1 })
    store().endDrag({ kind: 'tray', index: 1 }, { kind: 'hand' }) // empty wetland: draw 1, done
    expect(store().game!.players[0].hand).toEqual([...hand, card])
    expect(store().draft).toBe(IDLE)
  })

  it('a real drop still plays the bird', () => {
    play(twoJays())
    store().endDrag({ kind: 'hand', cardId: 'blue-jay', handIndex: 0 }, { kind: 'habitat', habitat: 'forest' })
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
