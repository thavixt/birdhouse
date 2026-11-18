import { describe, expect, it } from 'vitest'
import { reduce, validateAction } from '../engine'
import type { GameAction, GameState } from '../types'
import { newGame } from './helpers'

const pass: GameAction = { type: 'gainFood', foods: ['seed'] }

function playRound(s: GameState): GameState {
  const round = s.round
  while (s.round === round && s.phase === 'playing') s = reduce(s, pass)
  return s
}

describe('turn and round flow', () => {
  it('alternates players', () => {
    let s = newGame(1, 3)
    const order: number[] = []
    for (let i = 0; i < 6; i++) {
      order.push(s.currentPlayer)
      s = reduce(s, pass)
    }
    expect(order).toEqual([0, 1, 2, 0, 1, 2])
  })

  it('skips players with no turns left', () => {
    const s = { ...newGame(1, 3), turnsLeft: [3, 0, 2] }
    const next = reduce(s, pass)
    expect(next.currentPlayer).toBe(2)
    expect(reduce(next, pass).currentPlayer).toBe(0)
  })

  it('transitions rounds 8 → 7 → 6 → 5 with first-player rotation and a fresh tray', () => {
    let s = newGame(2, 2)
    const seen: { turns: number[]; first: number; current: number }[] = []
    for (let r = 1; r <= 3; r++) {
      const before = s
      s = playRound(s)
      expect(s.round).toBe(r + 1)
      // tray was discarded and refilled from the deck
      expect(s.tray).toEqual(before.deck.slice(0, 3))
      seen.push({ turns: s.turnsLeft, first: s.firstPlayer, current: s.currentPlayer })
    }
    expect(seen).toEqual([
      { turns: [7, 7], first: 1, current: 1 },
      { turns: [6, 6], first: 0, current: 0 },
      { turns: [5, 5], first: 1, current: 1 },
    ])
  })

  it('ends after round 4 and rejects further actions', () => {
    let s = newGame(4, 2)
    let actions = 0
    while (s.phase === 'playing') {
      s = reduce(s, pass)
      actions++
    }
    expect(actions).toBe(2 * (8 + 7 + 6 + 5))
    expect(s.round).toBe(4)
    expect(validateAction(s, pass)?.key).toBe('error.gameOver')
    expect(reduce(s, pass)).toBe(s)
  })
})
