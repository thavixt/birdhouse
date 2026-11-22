// Top scores of winners, kept across games (stored by src/persistence.ts). Pure; no i18n.
import { finalStandings } from './scoring'
import type { GameState } from './types'

export const LEADERBOARD_SIZE = 10

export type LeaderboardEntry = {
  name: string
  score: number
  /** Line-up of the game: total players and how many were bots (play mode is derived). */
  players: number
  bots: number
  /** When the game finished, ISO 8601. */
  date: string
}

/**
 * The human winners of a finished game: everyone sharing first place. Bots that win don't
 * make the board. Empty for an unfinished game.
 */
export function winnersOf(state: GameState, date: string): LeaderboardEntry[] {
  if (state.phase !== 'gameOver') return []
  const bots = state.players.filter((p) => p.kind === 'bot').length
  return finalStandings(state)
    .filter((s) => s.rank === 1 && state.players[s.playerIdx].kind === 'human')
    .map((s) => ({ name: state.players[s.playerIdx].name, score: s.breakdown.total, players: state.players.length, bots, date }))
}

/** Adds entries, keeping the best `LEADERBOARD_SIZE`: highest score first, earlier first on ties. */
export function addEntries(board: readonly LeaderboardEntry[], entries: readonly LeaderboardEntry[]): LeaderboardEntry[] {
  return [...board, ...entries]
    .sort((a, b) => b.score - a.score || a.date.localeCompare(b.date))
    .slice(0, LEADERBOARD_SIZE)
}

function isEntry(x: unknown): x is LeaderboardEntry {
  if (!x || typeof x !== 'object') return false
  const e = x as Record<string, unknown>
  const count = (v: unknown, min: number, max: number) => Number.isInteger(v) && (v as number) >= min && (v as number) <= max
  return (
    typeof e.name === 'string' &&
    e.name !== '' &&
    Number.isFinite(e.score) &&
    count(e.players, 1, 4) &&
    count(e.bots, 0, (e.players as number) - 1) &&
    typeof e.date === 'string' &&
    !Number.isNaN(Date.parse(e.date))
  )
}

/** Reads stored JSON; drops anything malformed instead of failing (bad data ⇒ empty board). */
export function parseLeaderboard(text: string | null): LeaderboardEntry[] {
  if (!text) return []
  try {
    const data: unknown = JSON.parse(text)
    return Array.isArray(data) ? addEntries([], data.filter(isEntry)) : []
  } catch {
    return []
  }
}
