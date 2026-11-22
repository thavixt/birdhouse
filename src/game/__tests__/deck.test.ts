import { describe, expect, it } from 'vitest'
import { STARTING_DECK } from '../birds'
import { chooseAction } from '../bot'
import { discardCards, drawableCount, takeFromDeck } from '../deck'
import { drawCount, reduce, validateAction } from '../engine'
import { shuffle } from '../rng'
import { HABITATS, type GameAction, type GameState } from '../types'
import { newGame } from './helpers'

/** A private copy, as the reducer would make. */
const copy = (s: GameState): GameState => ({ ...structuredClone(s), log: [] }) // empty log: only new entries
const keys = (s: GameState) => s.log.map((m) => m.key)

/** Every card in the game, wherever it is. */
function allCards(s: GameState): string[] {
  return [
    ...s.deck,
    ...s.discard,
    ...s.tray.filter((c): c is string => c !== null),
    ...s.players.flatMap((p) => [...p.hand, ...HABITATS.flatMap((h) => p.board[h].map((b) => b.cardId))]),
  ]
}

describe('takeFromDeck', () => {
  it('takes the top card', () => {
    const s = copy(newGame(1))
    const top = s.deck[0]
    expect(takeFromDeck(s)).toBe(top)
    expect(keys(s)).toEqual([])
  })

  it('shuffles the discard pile into a new deck when the deck runs out, and logs it', () => {
    const s: GameState = { ...copy(newGame(1)), deck: [], discard: ['osprey', 'mallard', 'killdeer'] }
    const [expected, rng] = shuffle(s.discard, s.rngState) // seeded: same game ⇒ same order
    expect(takeFromDeck(s)).toBe(expected[0])
    expect(s.deck).toEqual(expected.slice(1))
    expect(s.discard).toEqual([])
    expect(s.rngState).toBe(rng)
    expect(s.log.at(-1)).toEqual({ key: 'log.deckReshuffled', params: { count: 3 } })
  })

  it('logs once when the last card is taken with nothing left to reshuffle', () => {
    const s: GameState = { ...copy(newGame(1)), deck: ['osprey'], discard: [] }
    expect(takeFromDeck(s)).toBe('osprey')
    expect(keys(s)).toEqual(['log.deckEmpty'])
    expect(takeFromDeck(s)).toBeNull()
    expect(keys(s)).toEqual(['log.deckEmpty']) // not repeated
  })

  it('discardCards skips empty tray spaces', () => {
    const s = { ...copy(newGame(1)), discard: [] }
    discardCards(s, ['osprey', null, 'mallard'])
    expect(s.discard).toEqual(['osprey', 'mallard'])
  })
})

describe('deck and discard in the engine', () => {
  it('sends the tray to the discard pile at the end of a round', () => {
    let s = newGame(2, 1)
    const tray = s.tray
    while (s.round === 1) s = reduce(s, { type: 'gainFood', foods: ['seed'] })
    expect(s.discard).toEqual(tray)
  })

  it('lets you draw from the discard pile when the deck is empty', () => {
    const s: GameState = { ...newGame(3), deck: [], discard: ['osprey'], tray: [null, null, null] }
    expect(drawCount(s, 0)).toBe(1)
    const draw: GameAction = { type: 'drawCards', picks: [{ from: 'deck' }] }
    expect(validateAction(s, draw)).toBeNull()
    const next = reduce(s, draw)
    expect(next.players[0].hand.at(-1)).toBe('osprey')
    expect(next.log.map((m) => m.key)).toContain('log.deckReshuffled')
    expect(drawableCount(next)).toBe(0)
  })

  it('still rejects more deck picks than deck + discard hold', () => {
    const s: GameState = { ...newGame(3), deck: ['osprey'], discard: [] }
    expect(validateAction(s, { type: 'drawCards', picks: [{ from: 'deck' }, { from: 'deck' }] })?.key).not.toBeNull()
  })
})

describe('long games', () => {
  it('never lose or duplicate a card, and bots never waste a turn drawing nothing', () => {
    const total = [...STARTING_DECK].sort()
    for (let seed = 0; seed < 40; seed++) {
      let s = newGame(seed, 4)
      s = { ...s, players: s.players.map((p) => ({ ...p, kind: 'bot' as const })) }
      while (s.phase === 'playing') {
        const action = chooseAction(s, s.currentPlayer)
        if (action.type === 'drawCards') expect(action.picks.length, `seed ${seed}`).toBeGreaterThan(0)
        s = reduce(s, action)
        expect(allCards(s).sort(), `seed ${seed}`).toEqual(total)
      }
    }
  })
})
