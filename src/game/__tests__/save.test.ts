import { describe, expect, it } from 'vitest'
import { chooseAction } from '../bot'
import { reduce } from '../engine'
import { deserializeGame, SAVE_VERSION, serializeGame } from '../save'
import type { GameState } from '../types'
import { newGame } from './helpers'

function playBots(s: GameState, steps: number): GameState {
  for (let i = 0; i < steps && s.phase === 'playing'; i++) s = reduce(s, chooseAction(s, s.currentPlayer))
  return s
}

describe('save games', () => {
  it('round-trips a game in progress', () => {
    const s = playBots(newGame(9, 3), 20)
    expect(deserializeGame(serializeGame(s))).toEqual(s)
  })

  it('a loaded game continues exactly like the original (RNG state included)', () => {
    const s = playBots(newGame(21, 2), 15)
    const loaded = deserializeGame(serializeGame(s))!
    expect(playBots(loaded, 1000)).toEqual(playBots(s, 1000))
  })

  it('round-trips a finished game', () => {
    const s = playBots(newGame(5, 2), 1000)
    expect(s.phase).toBe('gameOver')
    expect(deserializeGame(serializeGame(s))).toEqual(s)
  })

  it('rejects missing, malformed and outdated data', () => {
    expect(deserializeGame(null)).toBeNull()
    expect(deserializeGame('')).toBeNull()
    expect(deserializeGame('{not json')).toBeNull()
    expect(deserializeGame('42')).toBeNull()
    const state = newGame()
    expect(deserializeGame(JSON.stringify({ version: SAVE_VERSION + 1, state }))).toBeNull()
    expect(deserializeGame(JSON.stringify({ state }))).toBeNull()
    expect(deserializeGame(JSON.stringify({ version: SAVE_VERSION, state: null }))).toBeNull()
  })

  it('rejects states with unknown ids or a broken shape', () => {
    const s = newGame(1, 2)
    const bad = (patch: (s: GameState) => unknown) => deserializeGame(JSON.stringify({ version: SAVE_VERSION, state: patch(s) }))
    expect(bad((x) => ({ ...x, deck: [...x.deck, 'dodo'] }))).toBeNull()
    expect(bad((x) => ({ ...x, goals: ['made-up', ...x.goals.slice(1)] }))).toBeNull()
    expect(bad((x) => ({ ...x, currentPlayer: 5 }))).toBeNull()
    expect(bad((x) => ({ ...x, round: 7 }))).toBeNull()
    expect(bad((x) => ({ ...x, tray: [null, null] }))).toBeNull()
    expect(bad((x) => ({ ...x, log: ['old string log line'] }))).toBeNull()
    expect(bad((x) => ({ ...x, players: [{ ...x.players[0], food: { seed: -1 } }, x.players[1]] }))).toBeNull()
    expect(
      bad((x) => ({
        ...x,
        players: [{ ...x.players[0], board: { forest: [{ cardId: 'barn-owl', eggs: 9 }], grassland: [], wetland: [] } }, x.players[1]],
      })),
    ).toBeNull() // more eggs than the limit
    expect(bad((x) => x)).toEqual(s)
  })
})
