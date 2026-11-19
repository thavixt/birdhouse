// Browser storage for the game in progress. All access is guarded: storage can be
// unavailable (private mode, blocked site data), and the game must work without it.
import { gameLog } from './game/logger'
import { deserializeGame, SAVE_VERSION, serializeGame } from './game/save'
import type { GameState } from './game/types'

const KEY = 'birdhouse.savedGame'

const summary = (s: GameState) => `round ${s.round}, ${s.players.map((p) => p.name).join(' vs ')}`

// React Strict Mode runs the app's initializer twice in development; report the load once.
let loadReported = false

export function loadSavedGame(): GameState | null {
  const report = (log: () => void) => {
    if (!loadReported) log()
    loadReported = true
  }
  try {
    const text = localStorage.getItem(KEY)
    const state = deserializeGame(text)
    if (state) report(() => gameLog('info', `Loaded saved game (${summary(state)}, ${state.phase})`, state))
    else if (text) report(() => gameLog('warn', `Ignored saved game: missing, outdated or invalid (expects save version ${SAVE_VERSION})`, text))
    else report(() => gameLog('info', 'No saved game'))
    return state
  } catch (e) {
    report(() => gameLog('warn', 'Could not read saved game (storage unavailable)', e))
    return null
  }
}

export function saveGame(state: GameState): void {
  try {
    const text = serializeGame(state)
    localStorage.setItem(KEY, text)
    gameLog('info', `Saved game (${summary(state)}, ${(text.length / 1024).toFixed(1)} KB)`)
  } catch (e) {
    gameLog('warn', 'Could not save game (storage unavailable or full); continuing in memory', e)
  }
}

export function clearSavedGame(): void {
  try {
    localStorage.removeItem(KEY)
    gameLog('info', 'Cleared saved game')
  } catch {
    // nothing to clear
  }
}
