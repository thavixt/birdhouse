import { describe, expect, it } from 'vitest'
import { STARTING_DECK } from '../birds'
import { GOALS_BY_ID } from '../goals'
import { createGame } from '../setup'
import { newGame } from './helpers'

describe('createGame', () => {
  it('deals hands, food, tray and goals', () => {
    const g = newGame(5, 3)
    expect(g.players).toHaveLength(3)
    for (const p of g.players) {
      expect(p.hand).toHaveLength(5)
      expect(p.food).toEqual({ seed: 1, insect: 1, fish: 1, fruit: 1, rodent: 1 })
      expect(p.goalPoints).toBe(0)
    }
    expect(g.tray).toHaveLength(3)
    expect(g.tray.every((c) => c !== null)).toBe(true)
    expect(g.deck).toHaveLength(STARTING_DECK.length - 15 - 3)
    expect(g.goals).toHaveLength(4)
    expect(new Set(g.goals).size).toBe(4)
    expect(g.goals.every((id) => GOALS_BY_ID[id])).toBe(true)
    expect(g.turnsLeft).toEqual([8, 8, 8])
    expect(g).toMatchObject({ round: 1, currentPlayer: 0, firstPlayer: 0, phase: 'playing' })
  })

  it('is deterministic per seed', () => {
    expect(newGame(11)).toEqual(newGame(11))
    expect(newGame(11).deck).not.toEqual(newGame(12).deck)
  })

  it('requires 1–4 players', () => {
    expect(() => createGame(1, [])).toThrow()
    expect(() => createGame(1, Array(5).fill({ name: 'x', kind: 'bot' }))).toThrow()
    expect(createGame(1, [{ name: 'solo', kind: 'human' }]).players).toHaveLength(1)
  })
})
