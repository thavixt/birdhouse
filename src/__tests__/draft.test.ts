import { describe, expect, it } from 'vitest'
import {
  boardEggDelta,
  canPlayCard,
  chooseHabitat,
  clickBird,
  IDLE,
  needsHandoff,
  pickDeck,
  pickedDeck,
  pickedTray,
  pickTray,
  startHabitatAction,
  startLayEggs,
  startPlayBird,
  toAction,
  totalCount,
  viewedPlayer,
  type Draft,
} from '../draft'
import { validateAction } from '../game/engine'
import { createGame } from '../game/setup'
import type { Board, GameState, PlacedBird, SlotRef } from '../game/types'
import { food, newGame, withPlayer } from '../game/__tests__/helpers'

const chick = (eggs = 0): PlacedBird => ({ cardId: 'black-capped-chickadee', eggs }) // forest, limit 5
const egret = (eggs = 0): PlacedBird => ({ cardId: 'snowy-egret', eggs }) // wetland, limit 3
const board = (b: Partial<Board> = {}): Board => ({ forest: [], grassland: [], wetland: [], ...b })
const forest = (index: number): SlotRef => ({ habitat: 'forest', index })
const wetland = (index: number): SlotRef => ({ habitat: 'wetland', index })

function setup(patch: Parameters<typeof withPlayer>[2]): GameState {
  return withPlayer(newGame(3), 0, patch)
}

type Of<K extends Draft['kind']> = Extract<Draft, { kind: K }>
const as = <K extends Draft['kind']>(d: Draft, kind: K): Of<K> => {
  expect(d.kind).toBe(kind)
  return d as Of<K>
}

describe('toAction', () => {
  it('is null while idle or before a habitat is chosen', () => {
    expect(toAction(IDLE)).toBeNull()
    expect(toAction({ kind: 'playBird', cardId: 'blue-jay', habitat: null, anyFoods: [], eggs: [] })).toBeNull()
  })

  it('builds the payment from the listed foods plus the chosen "any" foods', () => {
    const action = toAction({ kind: 'playBird', cardId: 'great-blue-heron', habitat: 'wetland', anyFoods: ['seed'], eggs: [] })
    expect(action).toEqual({ type: 'playBird', cardId: 'great-blue-heron', habitat: 'wetland', payment: ['fish', 'fish', 'seed'], eggPayment: [] })
  })

  it('passes the other drafts through', () => {
    expect(toAction({ kind: 'gainFood', foods: ['fish'] })).toEqual({ type: 'gainFood', foods: ['fish'] })
    expect(toAction({ kind: 'drawCards', picks: [{ from: 'deck' }] })).toEqual({ type: 'drawCards', picks: [{ from: 'deck' }] })
    const placements = [{ slot: forest(0), count: 1 }]
    expect(toAction({ kind: 'layEggs', placements })).toEqual({ type: 'layEggs', placements })
  })
})

describe('starting a bird', () => {
  it('picks the habitat when only one is possible', () => {
    const s = setup({ hand: ['blue-jay'], food: food(2) })
    expect(as(startPlayBird(s, 'blue-jay'), 'playBird').habitat).toBe('forest')
  })

  it('leaves the habitat open when there is a choice, and pre-fills "any" food', () => {
    const s = setup({ hand: ['ruby-throated-hummingbird'], food: food(0, 0, 3) })
    const d = as(startPlayBird(s, 'ruby-throated-hummingbird'), 'playBird')
    expect(d.habitat).toBeNull()
    expect(d.anyFoods).toEqual(['fish'])
  })

  it('choosing a habitat pre-fills the egg payment for that column', () => {
    const s = setup({ hand: ['black-capped-chickadee'], food: food(1), board: board({ forest: [chick(1), chick(3)] }) })
    const d = as(startPlayBird(s, 'black-capped-chickadee'), 'playBird')
    expect(d.eggs).toEqual([{ slot: forest(1), count: 1 }]) // column 3 costs 1 egg, from the fullest bird
    expect(validateAction(s, toAction(d)!)).toBeNull()

    const free = chooseHabitat(setup({ board: board() }), d, 'forest')
    expect(as(free, 'playBird').eggs).toEqual([])
  })
})

describe('startHabitatAction', () => {
  it('starts the action of each habitat', () => {
    const s = setup({ board: board({ forest: [chick()] }) })
    expect(startHabitatAction(s, 'forest')).toEqual({ kind: 'gainFood', foods: [] })
    expect(startHabitatAction(s, 'grassland')).toEqual(startLayEggs(s))
    expect(startHabitatAction(s, 'wetland')).toEqual({ kind: 'drawCards', picks: [] })
  })
})

describe('clickBird', () => {
  it('lays eggs up to the bird limit and the action count', () => {
    const s = setup({ board: board({ forest: [chick(4)], wetland: [egret()] }) })
    let d: Draft = { kind: 'layEggs', placements: [] }
    d = clickBird(s, d, forest(0))
    d = clickBird(s, d, forest(0)) // chickadee is full at 5
    expect(as(d, 'layEggs').placements).toEqual([{ slot: forest(0), count: 1 }])
    d = clickBird(s, d, wetland(0))
    d = clickBird(s, d, wetland(0)) // only 2 eggs to lay
    expect(totalCount(as(d, 'layEggs').placements)).toBe(2)
    expect(validateAction(s, toAction(d)!)).toBeNull()
  })

  it('pays eggs for a bird only from birds that have them, up to the cost', () => {
    const s = setup({ hand: ['black-capped-chickadee'], food: food(1), board: board({ forest: [chick(0), chick(2)] }) })
    let d: Draft = { ...as(startPlayBird(s, 'black-capped-chickadee'), 'playBird'), eggs: [] }
    d = clickBird(s, d, forest(0)) // no eggs there
    expect(as(d, 'playBird').eggs).toEqual([])
    d = clickBird(s, d, forest(1))
    d = clickBird(s, d, forest(1)) // cost is only 1
    expect(as(d, 'playBird').eggs).toEqual([{ slot: forest(1), count: 1 }])
    expect(validateAction(s, toAction(d)!)).toBeNull()
  })

  it('ignores clicks when the draft takes no eggs, or on an empty slot', () => {
    const s = setup({ board: board({ forest: [chick(1)] }) })
    const gain: Draft = { kind: 'gainFood', foods: [] }
    expect(clickBird(s, gain, forest(0))).toBe(gain)
    expect(clickBird(s, IDLE, forest(0))).toBe(IDLE)
    const lay: Draft = { kind: 'layEggs', placements: [] }
    expect(clickBird(s, lay, forest(3))).toBe(lay)
  })
})

describe('boardEggDelta', () => {
  it('is + while laying, − while paying, 0 otherwise', () => {
    const placements = [{ slot: forest(0), count: 2 }]
    expect(boardEggDelta({ kind: 'layEggs', placements }, forest(0))).toBe(2)
    expect(boardEggDelta({ kind: 'layEggs', placements }, forest(1))).toBe(0)
    expect(boardEggDelta({ kind: 'playBird', cardId: 'blue-jay', habitat: 'forest', anyFoods: [], eggs: placements }, forest(0))).toBe(-2)
    expect(boardEggDelta(IDLE, forest(0))).toBe(0)
  })
})

describe('drawing cards', () => {
  // 2 wetland birds ⇒ draw 2.
  const s = setup({ board: board({ wetland: [egret(), egret()] }) })
  const start: Draft = { kind: 'drawCards', picks: [] }

  it('toggles tray cards and stops at the draw count', () => {
    let d = pickTray(s, start, 0)
    d = pickTray(s, d, 2)
    d = pickTray(s, d, 1) // already picked 2
    expect(pickedTray(d)).toEqual([0, 2])
    d = pickTray(s, d, 0) // unpick
    expect(pickedTray(d)).toEqual([2])
    expect(validateAction(s, toAction(pickDeck(s, d))!)).toBeNull()
  })

  it('mixes deck draws and stops at the draw count', () => {
    let d = pickDeck(s, start)
    d = pickDeck(s, d)
    d = pickDeck(s, d)
    expect(pickedDeck(d)).toBe(2)
    expect(pickTray(s, d, 0)).toBe(d)
  })

  it('ignores empty tray slots and an empty deck', () => {
    const bare = { ...s, deck: [], tray: [s.tray[0], null, null] }
    let d = pickTray(bare, start, 1)
    expect(d).toBe(start)
    d = pickDeck(bare, start)
    expect(d).toBe(start)
    expect(pickedTray(pickTray(bare, start, 0))).toEqual([0])
  })

  it('does nothing outside a draw draft', () => {
    expect(pickTray(s, IDLE, 0)).toBe(IDLE)
    expect(pickDeck(s, IDLE)).toBe(IDLE)
    expect(pickedTray(IDLE)).toEqual([])
    expect(pickedDeck(IDLE)).toBe(0)
  })
})

describe('view helpers', () => {
  it('shows the acting human, or the first human while a bot plays', () => {
    const s = createGame(1, [
      { name: 'Bot', kind: 'bot' },
      { name: 'Ann', kind: 'human' },
      { name: 'Bea', kind: 'human' },
    ])
    expect(viewedPlayer(s)).toBe(1)
    expect(viewedPlayer({ ...s, currentPlayer: 2 })).toBe(2)
  })

  it('while a bot plays, keeps showing the human who last had the device', () => {
    const s = createGame(1, [
      { name: 'Bot', kind: 'bot' },
      { name: 'Ann', kind: 'human' },
      { name: 'Bea', kind: 'human' },
    ])
    expect(viewedPlayer(s, 2)).toBe(2)
    expect(viewedPlayer(s, 0)).toBe(1) // not a human: fall back to the first human
  })

  it('needsHandoff covers the screen between different humans only', () => {
    const hotSeat = createGame(1, [
      { name: 'Ann', kind: 'human' },
      { name: 'Bot', kind: 'bot' },
      { name: 'Bea', kind: 'human' },
    ])
    expect(needsHandoff(hotSeat, null)).toBe(true) // game start / resumed game
    expect(needsHandoff(hotSeat, 0)).toBe(false) // Ann already revealed
    expect(needsHandoff({ ...hotSeat, currentPlayer: 1 }, 0)).toBe(false) // bot plays; Ann's view stays
    expect(needsHandoff({ ...hotSeat, currentPlayer: 2 }, 0)).toBe(true) // Bea's turn
    expect(needsHandoff({ ...hotSeat, currentPlayer: 2 }, 2)).toBe(false)
    expect(needsHandoff({ ...hotSeat, phase: 'gameOver' }, null)).toBe(false)

    const vsBot = createGame(1, [
      { name: 'Ann', kind: 'human' },
      { name: 'Bot', kind: 'bot' },
    ])
    expect(needsHandoff(vsBot, null)).toBe(false) // a single human never needs it
    expect(needsHandoff(newGame(1, 1), null)).toBe(false)
  })

  it('canPlayCard needs food and a habitat with room', () => {
    const full = board({ forest: [chick(), chick(), chick(), chick(), chick()] })
    expect(canPlayCard(setup({ hand: ['blue-jay'], food: food(2) }), 'blue-jay')).toBe(true)
    expect(canPlayCard(setup({ hand: ['blue-jay'], food: food(1) }), 'blue-jay')).toBe(false)
    expect(canPlayCard(setup({ hand: ['blue-jay'], food: food(2), board: full }), 'blue-jay')).toBe(false)
  })
})
