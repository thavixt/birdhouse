import { BIRDS_BY_ID } from './birds'
import { allSlots, totalEggs, totalFood } from './engine'
import type { GameState, Player } from './types'

export const FOOD_SCORE_CAP = 5

export type ScoreBreakdown = { birds: number; eggs: number; food: number; goals: number; total: number }

export function scorePlayer(player: Player): ScoreBreakdown {
  const birds = allSlots(player.board).reduce((s, { bird }) => s + BIRDS_BY_ID[bird.cardId].points, 0)
  const eggs = totalEggs(player)
  const food = Math.min(FOOD_SCORE_CAP, totalFood(player))
  const goals = player.goalPoints
  return { birds, eggs, food, goals, total: birds + eggs + food + goals }
}

export type Standing = { playerIdx: number; breakdown: ScoreBreakdown; rank: number }

/** Sorted by total, then most leftover food; still tied ⇒ shared rank. */
export function finalStandings(state: GameState): Standing[] {
  const rows = state.players.map((p, playerIdx) => ({ playerIdx, breakdown: scorePlayer(p), food: totalFood(p) }))
  rows.sort((a, b) => b.breakdown.total - a.breakdown.total || b.food - a.food)
  const out: Standing[] = []
  rows.forEach((r, i) => {
    const prev = rows[i - 1]
    const tied = prev && prev.breakdown.total === r.breakdown.total && prev.food === r.food
    out.push({ playerIdx: r.playerIdx, breakdown: r.breakdown, rank: tied ? out[i - 1].rank : i + 1 })
  })
  return out
}
