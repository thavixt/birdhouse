import { describe, expect, it } from 'vitest'
import { autoEggPayment, autoEggPlacements, autoPlayBird, chooseAction } from '../bot'
import { validateAction } from '../engine'
import type { Board, GameState, PlacedBird, Player } from '../types'
import { food, newGame, withPlayer } from './helpers'

const at = (cardId: string, eggs = 0): PlacedBird => ({ cardId, eggs })
const chick = (eggs = 0) => at('black-capped-chickadee', eggs) // forest, limit 5, 2 pts
const board = (b: Partial<Board> = {}): Board => ({ forest: [], grassland: [], wetland: [], ...b })

function setup(patch: Partial<Player>, extra: Partial<GameState> = {}): GameState {
  return { ...withPlayer(newGame(7), 0, { food: food(), hand: [], board: board(), ...patch }), ...extra }
}

/** The bot's choice, which must always be legal. */
function choose(state: GameState) {
  const action = chooseAction(state, 0)
  expect(validateAction(state, action)).toBeNull()
  return action
}

describe('auto choices', () => {
  it('autoEggPayment takes eggs from the fullest bird first', () => {
    const p = setup({ board: board({ forest: [chick(1), chick(3)] }) }).players[0]
    expect(autoEggPayment(p, 2)).toEqual([{ slot: { habitat: 'forest', index: 1 }, count: 2 }])
    expect(autoEggPayment(p, 5)).toHaveLength(2) // runs out: takes what there is
    expect(autoEggPayment(p, 0)).toEqual([])
  })

  it('autoEggPlacements fills the roomiest bird and respects limits', () => {
    const p = setup({ board: board({ forest: [chick(4)], wetland: [at('snowy-egret', 0)] }) }).players[0]
    const placed = autoEggPlacements(p, 5)
    const total = placed.reduce((s, x) => s + x.count, 0)
    expect(total).toBe(4) // 1 free on the chickadee + 3 on the egret
    expect(placed.find((x) => x.slot.habitat === 'wetland')?.count).toBe(3)
  })

  it('autoPlayBird returns null when the bird cannot be played there', () => {
    const s = setup({ hand: ['blue-jay'], food: food(2) })
    expect(autoPlayBird(s, 0, 'blue-jay', 'forest')).toMatchObject({ type: 'playBird', payment: ['seed', 'seed'] })
    expect(autoPlayBird(s, 0, 'blue-jay', 'wetland')).toBeNull()
    expect(autoPlayBird(setup({ hand: ['blue-jay'], food: food(1) }), 0, 'blue-jay', 'forest')).toBeNull()
  })
})

describe('chooseAction', () => {
  it('plays the most valuable affordable bird', () => {
    const s = setup({ hand: ['black-capped-chickadee', 'great-horned-owl'], food: food(1, 0, 0, 0, 3) })
    expect(choose(s)).toMatchObject({ type: 'playBird', cardId: 'great-horned-owl' })
  })

  it('puts the bird in its shortest available row', () => {
    const s = setup({ hand: ['great-horned-owl'], food: food(0, 0, 0, 0, 3), board: board({ forest: [chick()], wetland: [at('snowy-egret')] }) })
    expect(choose(s)).toMatchObject({ type: 'playBird', habitat: 'grassland' })
  })

  it('gains the food it lacks for its best bird', () => {
    const s = setup({ hand: ['great-horned-owl', 'bald-eagle'] })
    expect(choose(s)).toEqual({ type: 'gainFood', foods: ['rodent'] })
  })

  it('draws cards when its hand is nearly empty', () => {
    expect(choose(setup({ hand: [] })).type).toBe('drawCards')
    expect(choose(setup({ hand: ['great-horned-owl'] })).type).toBe('drawCards')
  })

  it('lays eggs when the next slot needs eggs it does not have', () => {
    // Its best bird (the woodpecker) has its food, but forest column 3 costs an egg.
    const s = setup({
      hand: ['downy-woodpecker', 'black-capped-chickadee'],
      food: food(0, 1),
      board: board({ forest: [chick(), chick()] }),
    })
    expect(choose(s).type).toBe('layEggs')
  })

  it('prefers laying eggs over a cheap bird in the last round', () => {
    const s = setup({ hand: ['black-capped-chickadee'], food: food(1), board: board({ forest: [chick()] }) }, { round: 4 })
    expect(choose(s).type).toBe('layEggs')
    const early = setup({ hand: ['black-capped-chickadee'], food: food(1), board: board({ forest: [chick()] }) })
    expect(choose(early).type).toBe('playBird')
  })

  it('picks valuable tray cards before blind deck draws', () => {
    const s = setup({ hand: [] }, { tray: ['great-horned-owl', 'house-sparrow', 'black-capped-chickadee'] })
    expect(choose(s)).toEqual({ type: 'drawCards', picks: [{ from: 'tray', index: 0 }] })
    const noDeck = setup({ hand: [] }, { tray: [null, 'house-sparrow', null], deck: [] })
    expect(choose(noDeck)).toEqual({ type: 'drawCards', picks: [{ from: 'tray', index: 1 }] })
  })
})
