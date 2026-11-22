import { describe, expect, it } from 'vitest'
import {
  addDrawPick,
  boardEggDelta,
  canDrag,
  canDrop,
  canPlayCard,
  chooseHabitat,
  clickBird,
  clickDeck,
  clickHandCard,
  clickItem,
  clickTrayCard,
  isClickLike,
  selectedHandIndex,
  describeDraft,
  drop,
  IDLE,
  isFirstTurn,
  needsHandoff,
  pickDeck,
  pickedDeck,
  pickedTray,
  pickTray,
  startHabitatAction,
  autoLayEggs,
  startLayEggs,
  startPlayBird,
  toAction,
  totalCount,
  viewedPlayer,
  type Draft,
} from '../draft'
import { reduce, validateAction } from '../game/engine'
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
    expect(startHabitatAction('forest')).toEqual({ kind: 'gainFood', foods: [] })
    expect(startHabitatAction('grassland')).toEqual({ kind: 'layEggs', placements: [] }) // nothing pre-placed
    expect(startLayEggs()).toEqual({ kind: 'layEggs', placements: [] })
    expect(autoLayEggs(s)).toEqual({ kind: 'layEggs', placements: [{ slot: forest(0), count: 2 }] }) // the "Auto" button
    expect(startHabitatAction('wetland')).toEqual({ kind: 'drawCards', picks: [] })
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

  it('moves a pre-placed egg to the clicked bird once all eggs are placed', () => {
    const s = setup({ board: board({ forest: [chick(0)], wetland: [egret(0)] }) }) // lay 2
    const pre = as(autoLayEggs(s), 'layEggs') // Auto: both on the chickadee (most room)
    expect(pre.placements).toEqual([{ slot: forest(0), count: 2 }])
    let d: Draft = clickBird(s, pre, wetland(0))
    expect(as(d, 'layEggs').placements).toEqual([
      { slot: forest(0), count: 1 },
      { slot: wetland(0), count: 1 },
    ])
    d = clickBird(s, d, wetland(0))
    expect(as(d, 'layEggs').placements).toEqual([{ slot: wetland(0), count: 2 }])
    expect(clickBird(s, d, wetland(0))).toBe(d) // nothing left to move
    expect(validateAction(s, toAction(d)!)).toBeNull()
  })

  it('moves the egg payment to the clicked bird', () => {
    const s = setup({ hand: ['black-capped-chickadee'], food: food(1), board: board({ forest: [chick(1), chick(3)] }) })
    const pre = as(startPlayBird(s, 'black-capped-chickadee'), 'playBird') // pays from the fullest
    expect(pre.eggs).toEqual([{ slot: forest(1), count: 1 }])
    const d = clickBird(s, pre, forest(0))
    expect(as(d, 'playBird').eggs).toEqual([{ slot: forest(0), count: 1 }])
    expect(validateAction(s, toAction(d)!)).toBeNull()
  })

  it('does not move an egg onto a full bird', () => {
    const s = setup({ board: board({ forest: [chick(5)], wetland: [egret(0)] }) })
    const pre = autoLayEggs(s)
    expect(clickBird(s, pre, forest(0))).toBe(pre)
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

describe('drag and drop', () => {
  it('dropping a bird on a habitat plays it at once, with automatic payment', () => {
    const s = setup({ hand: ['blue-jay'], food: food(2) })
    const result = drop(s, IDLE, { kind: 'hand', cardId: 'blue-jay', handIndex: 0 }, { kind: 'habitat', habitat: 'forest' })
    expect(result).toEqual({ action: { type: 'playBird', cardId: 'blue-jay', habitat: 'forest', payment: ['seed', 'seed'], eggPayment: [] } })
  })

  it('pays the egg cost automatically from the fullest bird', () => {
    const s = setup({ hand: ['black-capped-chickadee'], food: food(1), board: board({ forest: [chick(1), chick(3)] }) })
    const result = drop(s, IDLE, { kind: 'hand', cardId: 'black-capped-chickadee', handIndex: 0 }, { kind: 'habitat', habitat: 'forest' })
    expect(result && 'action' in result && validateAction(s, result.action)).toBeNull()
    expect(result).toMatchObject({ action: { eggPayment: [{ slot: forest(1), count: 1 }] } })
  })

  it('rejects birds that cannot go there or cannot be paid for', () => {
    const s = setup({ hand: ['blue-jay'], food: food(2) })
    const jay = { kind: 'hand', cardId: 'blue-jay', handIndex: 0 } as const
    expect(canDrop(s, IDLE, jay, { kind: 'habitat', habitat: 'wetland' })).toBe(false)
    expect(drop(s, IDLE, jay, { kind: 'habitat', habitat: 'wetland' })).toBeNull()
    expect(drop(s, IDLE, jay, { kind: 'hand' })).toBeNull()
    const poor = setup({ hand: ['blue-jay'], food: food(1) })
    expect(canDrag(poor, IDLE, jay)).toBe(false)
    expect(drop(poor, IDLE, jay, { kind: 'habitat', habitat: 'forest' })).toBeNull()
  })

  it('dropping the last card to draw into the hand takes the turn', () => {
    const s = setup({}) // empty wetland: draw 1
    expect(drop(s, IDLE, { kind: 'tray', index: 1 }, { kind: 'hand' })).toEqual({
      action: { type: 'drawCards', picks: [{ from: 'tray', index: 1 }] },
    })
    expect(drop(s, IDLE, { kind: 'deck' }, { kind: 'hand' })).toEqual({ action: { type: 'drawCards', picks: [{ from: 'deck' }] } })
    expect(drop(s, IDLE, { kind: 'tray', index: 1 }, { kind: 'habitat', habitat: 'wetland' })).toBeNull()
  })

  it('collects picks until the draw count is reached, mixing in clicked picks', () => {
    const s = setup({ board: board({ wetland: [egret(), egret()] }) }) // draw 2
    const first = drop(s, IDLE, { kind: 'tray', index: 0 }, { kind: 'hand' })
    expect(first).toEqual({ draft: { kind: 'drawCards', picks: [{ from: 'tray', index: 0 }] } })
    const draft = (first as { draft: Draft }).draft
    expect(canDrag(s, draft, { kind: 'tray', index: 0 })).toBe(false) // already picked
    const second = drop(s, draft, { kind: 'deck' }, { kind: 'hand' })
    expect(second && 'action' in second && validateAction(s, second.action)).toBeNull()

    // A click-started draw finishes with a drag.
    const clicked = pickDeck(s, { kind: 'drawCards', picks: [] })
    expect(drop(s, clicked, { kind: 'tray', index: 2 }, { kind: 'hand' })).toMatchObject({ action: { type: 'drawCards' } })
  })

  it('cannot drag cards that are not there', () => {
    const s = { ...setup({}), deck: [], tray: ['blue-jay', null, null] }
    expect(canDrag(s, IDLE, { kind: 'deck' })).toBe(false)
    expect(canDrag(s, IDLE, { kind: 'tray', index: 1 })).toBe(false)
    expect(canDrag(s, IDLE, { kind: 'tray', index: 0 })).toBe(true)
  })

  it('addDrawPick starts a draw from any other draft and ignores repeats', () => {
    const s = setup({ board: board({ wetland: [egret(), egret()] }) })
    const d = addDrawPick(s, { kind: 'gainFood', foods: ['fish'] }, { from: 'tray', index: 0 })
    expect(d).toEqual({ kind: 'drawCards', picks: [{ from: 'tray', index: 0 }] })
    expect(addDrawPick(s, d, { from: 'tray', index: 0 })).toBe(d)
  })
})

describe('isFirstTurn', () => {
  it('is true only before the current player has taken a turn', () => {
    const s = newGame(1, 2)
    expect(isFirstTurn(s)).toBe(true)
    const next = reduce(s, { type: 'gainFood', foods: ['seed'] }) // P1 done, P2's first turn
    expect(next.currentPlayer).toBe(1)
    expect(isFirstTurn(next)).toBe(true)
    const back = reduce(next, { type: 'gainFood', foods: ['seed'] }) // P1's second turn
    expect(isFirstTurn(back)).toBe(false)
    expect(isFirstTurn({ ...s, round: 2 })).toBe(false)
    expect(isFirstTurn({ ...s, phase: 'gameOver' })).toBe(false)
  })
})

describe('describeDraft', () => {
  it('summarises each kind of draft for the debug log', () => {
    expect(describeDraft(IDLE)).toBe('idle')
    expect(describeDraft({ kind: 'playBird', cardId: 'mallard', habitat: null, anyFoods: [], eggs: [] })).toBe('play mallard (no habitat yet)')
    expect(
      describeDraft({ kind: 'playBird', cardId: 'mallard', habitat: 'wetland', anyFoods: ['fish'], eggs: [{ slot: forest(1), count: 1 }] }),
    ).toBe('play mallard → wetland any food: fish egg payment: forest:1×1')
    expect(describeDraft({ kind: 'gainFood', foods: [] })).toBe('gain food: none chosen')
    expect(describeDraft({ kind: 'layEggs', placements: [{ slot: wetland(0), count: 2 }] })).toBe('lay eggs: wetland:0×2')
    expect(describeDraft({ kind: 'drawCards', picks: [{ from: 'tray', index: 0 }, { from: 'deck' }] })).toBe('draw: tray#1, deck')
  })
})

describe('card clicks', () => {
  it('highlights only the clicked copy when the hand holds two of the same bird', () => {
    const s = setup({ hand: ['blue-jay', 'mallard', 'blue-jay'], food: food(2) })
    const second = clickHandCard(s, IDLE, 2)
    expect(as(second, 'playBird').cardId).toBe('blue-jay')
    expect(selectedHandIndex(s, second)).toBe(2)
    expect(selectedHandIndex(s, clickHandCard(s, second, 0))).toBe(0)
    // Started without a position (e.g. from older code paths): the first copy.
    expect(selectedHandIndex(s, startPlayBird(s, 'blue-jay'))).toBe(0)
    expect(selectedHandIndex(s, IDLE)).toBeNull()
  })

  it('clicking an unplayable card cancels the bird being played, and keeps other actions', () => {
    const s = setup({ hand: ['blue-jay', 'great-blue-heron'], food: food(2) }) // heron costs fish
    expect(canPlayCard(s, 'great-blue-heron')).toBe(false)
    const playing = clickHandCard(s, IDLE, 0)
    expect(clickHandCard(s, playing, 1)).toBe(IDLE)
    const gaining: Draft = { kind: 'gainFood', foods: ['seed'] }
    expect(clickHandCard(s, gaining, 1)).toBe(gaining)
    expect(clickHandCard(s, IDLE, 5)).toBe(IDLE) // no such card
  })

  it('tray and deck clicks start or extend the draw', () => {
    const s = setup({})
    expect(clickTrayCard(s, IDLE, 1)).toEqual({ kind: 'drawCards', picks: [{ from: 'tray', index: 1 }] })
    expect(clickTrayCard(s, clickTrayCard(s, IDLE, 1), 1)).toEqual({ kind: 'drawCards', picks: [] }) // toggles off
    expect(clickDeck(s, IDLE)).toEqual({ kind: 'drawCards', picks: [{ from: 'deck' }] })
  })

  it('a short drag that went nowhere counts as a click on the item', () => {
    expect(isClickLike({ x: 8, y: 3 })).toBe(true)
    expect(isClickLike({ x: 40, y: 0 })).toBe(false)
    const s = setup({ hand: ['mallard', 'blue-jay'], food: food(2) })
    expect(selectedHandIndex(s, clickItem(s, IDLE, { kind: 'hand', cardId: 'blue-jay', handIndex: 1 }))).toBe(1)
    expect(clickItem(s, IDLE, { kind: 'tray', index: 0 })).toEqual(clickTrayCard(s, IDLE, 0))
    expect(clickItem(s, IDLE, { kind: 'deck' })).toEqual(clickDeck(s, IDLE))
  })
})
