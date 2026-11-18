import { createGame } from '../setup'
import type { GameState, Player } from '../types'

export function newGame(seed = 1, n = 2): GameState {
  return createGame(
    seed,
    Array.from({ length: n }, (_, i) => ({ name: `P${i + 1}`, kind: 'human' as const })),
  )
}

/** Returns a copy of `state` with the given player patched. */
export function withPlayer(state: GameState, idx: number, patch: Partial<Player>): GameState {
  const players = state.players.map((p, i) => (i === idx ? { ...p, ...patch } : p))
  return { ...state, players }
}

export function deepFreeze<T>(obj: T): T {
  if (obj && typeof obj === 'object' && !Object.isFrozen(obj)) {
    Object.freeze(obj)
    for (const v of Object.values(obj)) deepFreeze(v)
  }
  return obj
}

export const food = (seed = 0, insect = 0, fish = 0, fruit = 0, rodent = 0) => ({ seed, insect, fish, fruit, rodent })
