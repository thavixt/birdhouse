// Browser storage for the game in progress. All access is guarded: storage can be
// unavailable (private mode, blocked site data), and the game must work without it.
import { deserializeGame, serializeGame } from './game/save'
import type { GameState } from './game/types'

const KEY = 'birdhouse.savedGame'

export function loadSavedGame(): GameState | null {
  try {
    return deserializeGame(localStorage.getItem(KEY))
  } catch {
    return null
  }
}

export function saveGame(state: GameState): void {
  try {
    localStorage.setItem(KEY, serializeGame(state))
  } catch {
    // not saved; the game continues in memory
  }
}

export function clearSavedGame(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // nothing to clear
  }
}
