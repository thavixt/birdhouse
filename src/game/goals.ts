import { BIRDS_BY_ID } from './birds'
import { HABITATS, type Habitat, type Player } from './types'

export type Goal = {
  id: string
  name: string
  measure: (player: Player) => number
}

const birdsIn = (p: Player, h: Habitat) => p.board[h].length
const eggsIn = (p: Player, h: Habitat) => p.board[h].reduce((sum, b) => sum + b.eggs, 0)
const allBirds = (p: Player) => HABITATS.flatMap((h) => p.board[h])

export const GOALS: Goal[] = [
  { id: 'forest-birds', name: 'Most birds in forest', measure: (p) => birdsIn(p, 'forest') },
  { id: 'grassland-birds', name: 'Most birds in grassland', measure: (p) => birdsIn(p, 'grassland') },
  { id: 'wetland-birds', name: 'Most birds in wetland', measure: (p) => birdsIn(p, 'wetland') },
  { id: 'total-birds', name: 'Most birds total', measure: (p) => allBirds(p).length },
  { id: 'grassland-eggs', name: 'Most eggs in grassland', measure: (p) => eggsIn(p, 'grassland') },
  { id: 'total-eggs', name: 'Most eggs total', measure: (p) => allBirds(p).reduce((s, b) => s + b.eggs, 0) },
  { id: 'birds-with-eggs', name: 'Most birds with eggs', measure: (p) => allBirds(p).filter((b) => b.eggs > 0).length },
  {
    id: 'bird-points',
    name: 'Most bird points on board',
    measure: (p) => allBirds(p).reduce((s, b) => s + BIRDS_BY_ID[b.cardId].points, 0),
  },
]

export const GOALS_BY_ID: Record<string, Goal> = Object.fromEntries(GOALS.map((g) => [g.id, g]))
export const GOAL_IDS: string[] = GOALS.map((g) => g.id)

/** Points for 1st and 2nd place, indexed by round - 1. */
export const GOAL_POINTS = {
  first: [4, 5, 6, 7],
  second: [1, 2, 3, 4],
} as const

/**
 * Points each player earns for a round goal. Players need at least 1 to place.
 * Tied players share the points of the places they span (rounded down).
 */
export function roundGoalAwards(players: Player[], goalId: string, round: number): number[] {
  const goal = GOALS_BY_ID[goalId]
  const values = players.map((p) => goal.measure(p))
  const placePoints = [GOAL_POINTS.first[round - 1], GOAL_POINTS.second[round - 1]]
  const awards = players.map(() => 0)
  const distinct = [...new Set(values.filter((v) => v > 0))].sort((a, b) => b - a)
  let place = 0
  for (const v of distinct) {
    const tied = values.flatMap((x, i) => (x === v ? [i] : []))
    let pool = 0
    for (let k = place; k < place + tied.length; k++) pool += placePoints[k] ?? 0
    const share = Math.floor(pool / tied.length)
    for (const i of tied) awards[i] = share
    place += tied.length
  }
  return awards
}
