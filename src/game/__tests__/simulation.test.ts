import { describe, expect, it } from 'vitest'
import { BIRDS_BY_ID } from '../birds'
import { autoEggPlacements, autoPlayBird, chooseAction } from '../bot'
import { actionCount, allSlots, drawCount, layCount, reduce, ROW_SIZE, validateAction } from '../engine'
import { finalStandings } from '../scoring'
import { FOODS, HABITATS, type GameAction, type GameState } from '../types'
import { newGame } from './helpers'

/** First legal action from a fixed candidate order. */
function firstLegal(s: GameState): GameAction {
  const idx = s.currentPlayer
  const p = s.players[idx]
  const candidates: GameAction[] = []
  for (const id of p.hand) for (const h of HABITATS) {
    const a = autoPlayBird(s, idx, id, h)
    if (a) candidates.push(a)
  }
  candidates.push({ type: 'layEggs', placements: autoEggPlacements(p, layCount(p)) })
  const picks = Array.from({ length: drawCount(s, idx) }, () => ({ from: 'deck' as const }))
  candidates.push({ type: 'drawCards', picks })
  candidates.push({ type: 'gainFood', foods: Array(actionCount(p.board, 'forest')).fill('fish') })
  const legal = candidates.find((a) => validateAction(s, a) === null)
  if (!legal) throw new Error('no legal action')
  return legal
}

function checkInvariants(s: GameState) {
  for (const p of s.players) {
    for (const f of FOODS) expect(p.food[f]).toBeGreaterThanOrEqual(0)
    for (const h of HABITATS) expect(p.board[h].length).toBeLessThanOrEqual(ROW_SIZE)
    for (const { bird } of allSlots(p.board)) {
      expect(bird.eggs).toBeGreaterThanOrEqual(0)
      expect(bird.eggs).toBeLessThanOrEqual(BIRDS_BY_ID[bird.cardId].eggLimit)
    }
  }
  expect(s.tray).toHaveLength(3)
}

function playOut(seed: number, players: number, choose: (s: GameState) => GameAction): GameState {
  let s = newGame(seed, players)
  let steps = 0
  while (s.phase === 'playing') {
    const action = choose(s)
    expect(validateAction(s, action)).toBeNull()
    s = reduce(s, action)
    checkInvariants(s)
    if (++steps > 500) throw new Error('game did not end')
  }
  return s
}

describe('simulation', () => {
  it('plays 100 seeded games with a first-legal-action driver', () => {
    for (let seed = 0; seed < 100; seed++) {
      const s = playOut(seed, 1 + (seed % 4), firstLegal)
      expect(s.phase).toBe('gameOver')
    }
  })

  it('plays 100 seeded bot games', () => {
    let birdsPlayed = 0
    for (let seed = 0; seed < 100; seed++) {
      const s = playOut(seed, 1 + (seed % 4), (st) => chooseAction(st, st.currentPlayer))
      expect(finalStandings(s)).toHaveLength(s.players.length)
      birdsPlayed += s.players.reduce((n, p) => n + allSlots(p.board).length, 0) / s.players.length
    }
    // The bot should actually build an engine, not just pass.
    expect(birdsPlayed / 100).toBeGreaterThan(5)
  })

  it('same seed + same actions ⇒ identical game', () => {
    const bot = (st: GameState) => chooseAction(st, st.currentPlayer)
    expect(playOut(77, 2, bot)).toEqual(playOut(77, 2, bot))
  })
})
