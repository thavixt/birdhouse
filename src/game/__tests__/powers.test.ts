import { describe, expect, it } from 'vitest'
import { activateHabitat } from '../powers'
import type { Board, GameState, Habitat, PlacedBird } from '../types'
import { food, newGame, withPlayer } from './helpers'

const at = (cardId: string, eggs = 0): PlacedBird => ({ cardId, eggs })
const board = (b: Partial<Board> = {}): Board => ({ forest: [], grassland: [], wetland: [], ...b })

/** Runs a habitat's powers for player 0 on a private copy, as the reducer does. */
function activate(state: GameState, habitat: Habitat): GameState {
  const draft = structuredClone(state)
  activateHabitat(draft, 0, habitat)
  return draft
}

function setup(b: Partial<Board>): GameState {
  return withPlayer(newGame(5), 0, { food: food(), board: board(b) })
}

describe('powers', () => {
  it('gainFood gives the player one of that food', () => {
    const s = activate(setup({ forest: [at('blue-jay')] }), 'forest')
    expect(s.players[0].food).toEqual(food(1))
    expect(s.log.at(-1)).toMatchObject({ key: 'log.power.gainFood', params: { card: 'blue-jay', food: 'seed' } })
  })

  it('layEggSelf lays on the bird itself, but not past its limit', () => {
    const s = activate(setup({ grassland: [at('eastern-bluebird', 4)] }), 'grassland') // limit 5
    expect(s.players[0].board.grassland[0].eggs).toBe(5)
    const full = activate(s, 'grassland')
    expect(full.players[0].board.grassland[0].eggs).toBe(5)
    expect(full.log).toHaveLength(s.log.length) // nothing happened, nothing logged
  })

  it('layEggAny lays on the bird with the most free space, in any habitat', () => {
    const s = activate(
      setup({ grassland: [at('mourning-dove', 6)], wetland: [at('snowy-egret', 0)], forest: [at('pileated-woodpecker', 1)] }),
      'grassland',
    )
    expect(s.players[0].board.wetland[0].eggs).toBe(1) // egret had 3 free, woodpecker 1, dove 0
    expect(s.log.at(-1)).toMatchObject({ key: 'log.power.layEggAny', params: { target: 'snowy-egret' } })
  })

  it('layEggAny does nothing when every bird is full', () => {
    const s = setup({ grassland: [at('mourning-dove', 6)] })
    expect(activate(s, 'grassland').log).toHaveLength(s.log.length)
  })

  it('drawCard takes the top card of the deck, or nothing when it is empty', () => {
    const s = setup({ wetland: [at('common-loon')] })
    const drew = activate(s, 'wetland')
    expect(drew.players[0].hand).toEqual([...s.players[0].hand, s.deck[0]])
    expect(drew.deck).toEqual(s.deck.slice(1))

    const empty = activate({ ...s, deck: [] }, 'wetland')
    expect(empty.players[0].hand).toEqual(s.players[0].hand)
  })

  it('allGainFood feeds every player', () => {
    const s = activate(setup({ wetland: [at('american-white-pelican')] }), 'wetland')
    for (const p of s.players) expect(p.food.fish).toBe(p === s.players[0] ? 1 : 2) // others started with 1
  })

  it('resolves right to left and only in the activated habitat', () => {
    const s = activate(
      setup({ forest: [at('blue-jay'), at('downy-woodpecker'), at('cedar-waxwing')], grassland: [at('house-sparrow')] }),
      'forest',
    )
    const powers = s.log.slice(-3).map((m) => m.params?.card)
    expect(powers).toEqual(['cedar-waxwing', 'downy-woodpecker', 'blue-jay'])
    expect(s.players[0].board.grassland[0].eggs).toBe(0)
  })

  it('birds without powers do nothing', () => {
    const s = setup({ forest: [at('black-capped-chickadee')] })
    expect(activate(s, 'forest')).toEqual(s)
  })
})
