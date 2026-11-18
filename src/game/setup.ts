import { STARTING_DECK } from './birds'
import { GOAL_IDS } from './goals'
import { shuffle } from './rng'
import { FOODS, type Food, type GameState, type Player, type PlayerConfig } from './types'

export const HAND_SIZE = 5
export const TRAY_SIZE = 3

export function emptyFood(): Record<Food, number> {
  return Object.fromEntries(FOODS.map((f) => [f, 0])) as Record<Food, number>
}

export function createGame(seed: number, configs: PlayerConfig[]): GameState {
  if (configs.length < 1 || configs.length > 4) {
    throw new Error('A game needs 1–4 players.')
  }
  const [deck, s1] = shuffle(STARTING_DECK, seed | 0)
  const [goalOrder, s2] = shuffle(GOAL_IDS, s1)

  const players: Player[] = configs.map((c, i) => ({
    id: `p${i}`,
    name: c.name,
    kind: c.kind,
    hand: deck.slice(i * HAND_SIZE, (i + 1) * HAND_SIZE),
    food: Object.fromEntries(FOODS.map((f) => [f, 1])) as Record<Food, number>,
    board: { forest: [], grassland: [], wetland: [] },
    goalPoints: 0,
  }))
  const dealt = configs.length * HAND_SIZE

  return {
    players,
    currentPlayer: 0,
    firstPlayer: 0,
    round: 1,
    turnsLeft: players.map(() => 8),
    deck: deck.slice(dealt + TRAY_SIZE),
    tray: deck.slice(dealt, dealt + TRAY_SIZE),
    goals: goalOrder.slice(0, 4),
    rngState: s2,
    phase: 'playing',
    log: [{ key: 'log.newGame', params: { players: players.map((p) => p.name) } }],
  }
}
