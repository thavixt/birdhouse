import { describe, expect, it } from 'vitest'
import {
  actionCount,
  canAfford,
  eggCapacity,
  eggCostForSlot,
  playableHabitats,
  reduce,
  totalEggs,
  turnsPerRound,
  validateAction,
} from '../engine'
import type { Board, GameAction, GameState, PlacedBird } from '../types'
import { deepFreeze, food, newGame, withPlayer } from './helpers'

const chick = (eggs = 0): PlacedBird => ({ cardId: 'black-capped-chickadee', eggs }) // forest, limit 5, no power
const egret = (eggs = 0): PlacedBird => ({ cardId: 'snowy-egret', eggs }) // wetland, limit 3, no power
const board = (b: Partial<Board> = {}): Board => ({ forest: [], grassland: [], wetland: [], ...b })

function setup(patch: Parameters<typeof withPlayer>[2]): GameState {
  return withPlayer(newGame(3), 0, patch)
}

function expectInvalid(state: GameState, action: GameAction, key: string, params?: Record<string, unknown>) {
  const msg = validateAction(state, action)
  expect(msg?.key).toBe(`error.${key}`)
  if (params) expect(msg?.params).toMatchObject(params)
  expect(reduce(state, action)).toBe(state)
}

describe('helpers', () => {
  it('eggCostForSlot', () => {
    expect([0, 1, 2, 3, 4].map(eggCostForSlot)).toEqual([0, 0, 1, 1, 2])
  })

  it('actionCount scales with birds in the row', () => {
    const counts = [0, 1, 2, 3, 4, 5].map((n) => {
      const row = Array.from({ length: n }, () => chick())
      const b = board({ forest: row, grassland: row, wetland: row })
      return [actionCount(b, 'forest'), actionCount(b, 'grassland'), actionCount(b, 'wetland')]
    })
    expect(counts.map((c) => c[0])).toEqual([1, 1, 2, 2, 3, 3])
    expect(counts.map((c) => c[1])).toEqual([2, 2, 3, 3, 4, 4])
    expect(counts.map((c) => c[2])).toEqual([1, 1, 2, 2, 3, 3])
  })

  it('turnsPerRound', () => {
    expect([1, 2, 3, 4].map(turnsPerRound)).toEqual([8, 7, 6, 5])
  })

  it('canAfford handles listed and "any" food', () => {
    const p = setup({ food: food(2, 1, 0, 0, 0) }).players[0]
    const cost = { foods: ['seed' as const], anyCount: 1 }
    expect(canAfford(p, cost, ['seed', 'insect'])).toBe(true)
    expect(canAfford(p, cost, ['seed', 'seed'])).toBe(true)
    expect(canAfford(p, cost, ['insect', 'insect'])).toBe(false)
    expect(canAfford(p, cost, ['seed', 'fish'])).toBe(false)
    expect(canAfford(p, cost, ['seed'])).toBe(false)
  })

  it('eggCapacity / totalEggs', () => {
    const p = setup({ board: board({ forest: [chick(2)], wetland: [egret(3)] }) }).players[0]
    expect(totalEggs(p)).toBe(5)
    expect(eggCapacity(p)).toBe(3)
  })

  it('playableHabitats respects habitat, room and egg cost', () => {
    const s = setup({ hand: ['barn-owl'], board: board({ forest: [chick(), chick()] }) })
    expect(playableHabitats(s, 0, 'barn-owl')).toEqual(['grassland']) // forest slot 3 needs an egg
    const s2 = setup({ hand: ['barn-owl'], board: board({ forest: [chick(1), chick()] }) })
    expect(playableHabitats(s2, 0, 'barn-owl')).toEqual(['forest', 'grassland'])
  })
})

describe('playBird', () => {
  const base = () => setup({ hand: ['barn-owl', 'osprey'], food: food(0, 0, 0, 0, 2) })
  const play = (patch: Partial<Extract<GameAction, { type: 'playBird' }>> = {}): GameAction => ({
    type: 'playBird',
    cardId: 'barn-owl',
    habitat: 'forest',
    payment: ['rodent', 'rodent'],
    eggPayment: [],
    ...patch,
  })

  it('happy path', () => {
    const next = reduce(base(), play())
    const p = next.players[0]
    expect(p.hand).toEqual(['osprey'])
    expect(p.food.rodent).toBe(0)
    expect(p.board.forest).toEqual([{ cardId: 'barn-owl', eggs: 0 }])
    expect(next.currentPlayer).toBe(1)
    expect(next.turnsLeft).toEqual([7, 8])
  })

  it('rejects card not in hand', () => expectInvalid(base(), play({ cardId: 'bald-eagle' }), 'cardNotInHand'))
  it('rejects wrong habitat', () => expectInvalid(base(), play({ habitat: 'wetland' }), 'wrongHabitat', { card: 'barn-owl', habitat: 'wetland' }))
  it('rejects full row', () => {
    const s = setup({ hand: ['barn-owl'], food: food(0, 0, 0, 0, 2), board: board({ forest: Array.from({ length: 5 }, () => chick(1)) }) })
    expectInvalid(s, play(), 'rowFull', { habitat: 'forest' })
  })
  it('rejects wrong payment', () => expectInvalid(base(), play({ payment: ['rodent', 'seed'] }), 'paymentMismatch'))
  it('rejects unowned payment', () => {
    expectInvalid(setup({ hand: ['barn-owl'], food: food(0, 0, 0, 0, 1) }), play(), 'foodNotOwned')
  })

  it('charges eggs by column', () => {
    const s = setup({ hand: ['barn-owl'], food: food(0, 0, 0, 0, 2), board: board({ forest: [chick(1), chick(2)] }) })
    expectInvalid(s, play(), 'eggCost', { count: 1 })
    expectInvalid(s, play({ eggPayment: [{ slot: { habitat: 'forest', index: 0 }, count: 2 }] }), 'tooManyEggsRemoved')
    expectInvalid(s, play({ eggPayment: [{ slot: { habitat: 'wetland', index: 0 }, count: 1 }] }), 'noBirdInSlot')
    const next = reduce(s, play({ eggPayment: [{ slot: { habitat: 'forest', index: 1 }, count: 1 }] }))
    expect(next.players[0].board.forest.map((b) => b.eggs)).toEqual([1, 1, 0])

    const s5 = setup({
      hand: ['barn-owl'],
      food: food(0, 0, 0, 0, 2),
      board: board({ forest: [chick(1), chick(1), chick(), chick()] }),
    })
    expectInvalid(s5, play({ eggPayment: [{ slot: { habitat: 'forest', index: 0 }, count: 1 }] }), 'eggCost', { count: 2 })
    expect(
      validateAction(s5, play({ eggPayment: [0, 1].map((index) => ({ slot: { habitat: 'forest' as const, index }, count: 1 })) })),
    ).toBeNull()
  })
})

describe('gainFood', () => {
  it('takes N foods', () => {
    const s = setup({ board: board({ forest: [chick(), chick()] }) })
    expectInvalid(s, { type: 'gainFood', foods: ['fish'] }, 'gainFoodCount', { count: 2 })
    const next = reduce(s, { type: 'gainFood', foods: ['fish', 'fish'] })
    expect(next.players[0].food.fish).toBe(3)
  })
})

describe('layEggs', () => {
  it('lays N eggs within limits', () => {
    const s = setup({ board: board({ wetland: [egret(2)], forest: [chick()] }) })
    const at = (habitat: 'forest' | 'wetland', count: number) => ({ slot: { habitat, index: 0 }, count })
    expectInvalid(s, { type: 'layEggs', placements: [at('wetland', 2)] }, 'eggLimit')
    expectInvalid(s, { type: 'layEggs', placements: [at('forest', 1)] }, 'layCount', { count: 2 })
    const next = reduce(s, { type: 'layEggs', placements: [at('forest', 1), at('wetland', 1)] })
    expect(next.players[0].board.wetland[0].eggs).toBe(3)
    expect(next.players[0].board.forest[0].eggs).toBe(1)
  })

  it('caps the required count by capacity', () => {
    const s = setup({ board: board({ wetland: [egret(2)] }) })
    expectInvalid(s, { type: 'layEggs', placements: [] }, 'layCount', { count: 1 })
    expect(validateAction(s, { type: 'layEggs', placements: [{ slot: { habitat: 'wetland', index: 0 }, count: 1 }] })).toBeNull()
    expect(validateAction(setup({}), { type: 'layEggs', placements: [] })).toBeNull()
  })
})

describe('drawCards', () => {
  it('takes from tray and deck, then refills the tray', () => {
    const s = setup({ board: board({ wetland: [egret(), egret()] }) })
    const tray0 = s.tray[0]
    const deckTop = s.deck[0]
    const next = reduce(s, { type: 'drawCards', picks: [{ from: 'tray', index: 0 }, { from: 'deck' }] })
    expect(next.players[0].hand.slice(-2)).toEqual([tray0, deckTop])
    expect(next.tray.every((c) => c !== null)).toBe(true)
    expect(next.deck).toHaveLength(s.deck.length - 2)
  })

  it('rejects bad picks', () => {
    const s = setup({ board: board({ wetland: [egret(), egret()] }) })
    expectInvalid(s, { type: 'drawCards', picks: [{ from: 'deck' }] }, 'drawCount', { count: 2 })
    expectInvalid(s, { type: 'drawCards', picks: [{ from: 'tray', index: 1 }, { from: 'tray', index: 1 }] }, 'trayTwice')
    const holey = { ...s, tray: [null, s.tray[1], s.tray[2]] }
    expectInvalid(holey, { type: 'drawCards', picks: [{ from: 'tray', index: 0 }, { from: 'deck' }] }, 'trayEmpty')
  })

  it('handles an empty deck', () => {
    const s = { ...setup({}), deck: [] }
    expectInvalid(s, { type: 'drawCards', picks: [{ from: 'deck' }] }, 'deckShort')
    const next = reduce(s, { type: 'drawCards', picks: [{ from: 'tray', index: 2 }] })
    expect(next.tray[2]).toBeNull()
    const bare = { ...s, tray: [null, null, null] }
    expect(validateAction(bare, { type: 'drawCards', picks: [] })).toBeNull()
  })
})

describe('powers', () => {
  it('activate right-to-left after the habitat action', () => {
    const s = setup({
      food: food(),
      board: board({
        forest: [{ cardId: 'blue-jay', eggs: 0 }, { cardId: 'cedar-waxwing', eggs: 0 }],
        grassland: [{ cardId: 'house-sparrow', eggs: 0 }],
      }),
    })
    const next = reduce(s, { type: 'gainFood', foods: ['fish', 'fish'] })
    expect(next.players[0].food).toEqual(food(1, 0, 2, 1, 0))
    expect(next.players[1].food.fruit).toBe(2) // allGainFood
    expect(next.players[0].board.grassland[0].eggs).toBe(0) // other habitats don't fire

    const laid = reduce(s, { type: 'layEggs', placements: [{ slot: { habitat: 'forest', index: 0 }, count: 2 }] })
    expect(laid.players[0].board.grassland[0].eggs).toBe(1) // layEggSelf
  })
})

describe('immutability', () => {
  it('reduce does not mutate a frozen state', () => {
    const s = deepFreeze(setup({ hand: ['barn-owl'], food: food(0, 0, 0, 0, 2), board: board({ forest: [chick(1), chick()] }) }))
    const actions: GameAction[] = [
      { type: 'playBird', cardId: 'barn-owl', habitat: 'forest', payment: ['rodent', 'rodent'], eggPayment: [{ slot: { habitat: 'forest', index: 0 }, count: 1 }] },
      { type: 'gainFood', foods: ['seed', 'seed'] },
      { type: 'layEggs', placements: [{ slot: { habitat: 'forest', index: 1 }, count: 2 }] },
      { type: 'drawCards', picks: [{ from: 'tray', index: 0 }] },
    ]
    for (const a of actions) expect(reduce(s, a)).not.toBe(s)
  })
})
