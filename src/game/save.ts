// Save-game format: versioned JSON of the full GameState. Pure; storage lives in the UI layer.
import { BIRDS_BY_ID } from './birds'
import { GOALS_BY_ID } from './goals'
import { FOODS, HABITATS, type GameState } from './types'

/** Bump when GameState's shape changes; older saves are then ignored. */
export const SAVE_VERSION = 1

export function serializeGame(state: GameState): string {
  return JSON.stringify({ version: SAVE_VERSION, state })
}

/** Parses a saved game; returns null for missing, outdated or malformed data. */
export function deserializeGame(text: string | null): GameState | null {
  if (!text) return null
  try {
    const data: unknown = JSON.parse(text)
    if (!isObject(data) || data.version !== SAVE_VERSION) return null
    return isGameState(data.state) ? data.state : null
  } catch {
    return null
  }
}

type Obj = Record<string, unknown>
const isObject = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v)
const isCount = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 0
const isCardId = (v: unknown) => typeof v === 'string' && v in BIRDS_BY_ID
const isArrayOf = (v: unknown, check: (x: unknown) => boolean) => Array.isArray(v) && v.every(check)

function isPlayer(p: unknown): boolean {
  if (!isObject(p)) return false
  const { food, board } = p
  return (
    typeof p.id === 'string' &&
    typeof p.name === 'string' &&
    (p.kind === 'human' || p.kind === 'bot') &&
    isArrayOf(p.hand, isCardId) &&
    isObject(food) &&
    FOODS.every((f) => isCount(food[f])) &&
    isObject(board) &&
    HABITATS.every((h) =>
      isArrayOf(board[h], (b) => isObject(b) && isCardId(b.cardId) && isCount(b.eggs) && b.eggs <= BIRDS_BY_ID[b.cardId as string].eggLimit),
    ) &&
    isCount(p.goalPoints)
  )
}

/** Structural check: the shape is right and every card/goal id is known. */
function isGameState(s: unknown): s is GameState {
  if (!isObject(s) || !Array.isArray(s.players)) return false
  const n = s.players.length
  return (
    n >= 1 &&
    n <= 4 &&
    s.players.every(isPlayer) &&
    isCount(s.currentPlayer) &&
    (s.currentPlayer as number) < n &&
    isCount(s.firstPlayer) &&
    (s.firstPlayer as number) < n &&
    [1, 2, 3, 4].includes(s.round as number) &&
    isArrayOf(s.turnsLeft, isCount) &&
    (s.turnsLeft as unknown[]).length === n &&
    isArrayOf(s.deck, isCardId) &&
    isArrayOf(s.tray, (c) => c === null || isCardId(c)) &&
    (s.tray as unknown[]).length === 3 &&
    isArrayOf(s.goals, (g) => typeof g === 'string' && g in GOALS_BY_ID) &&
    (s.goals as unknown[]).length === 4 &&
    Number.isInteger(s.rngState) &&
    (s.phase === 'playing' || s.phase === 'gameOver') &&
    isArrayOf(s.log, (m) => isObject(m) && typeof m.key === 'string')
  )
}
