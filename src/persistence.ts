// Browser storage for the game in progress and the leaderboard. All access is guarded: storage can be
// unavailable (private mode, blocked site data), and the game must work without it.
import { addEntries, parseLeaderboard, winnersOf, type LeaderboardEntry } from './game/leaderboard'
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

/** `reason` only labels the debug log line (e.g. "app hidden"). */
export function saveGame(state: GameState, reason?: string): void {
  try {
    const text = serializeGame(state)
    localStorage.setItem(KEY, text)
    gameLog('info', `Saved game${reason ? ` (${reason})` : ''} (${summary(state)}, ${(text.length / 1024).toFixed(1)} KB)`)
  } catch (e) {
    gameLog('warn', 'Could not save game (storage unavailable or full); continuing in memory', e)
  }
}

/**
 * Saves `state` again whenever the app may be about to stop running: the window loses focus
 * (desktop), the page is hidden (switching apps or tabs, locking the phone) or unloaded.
 * On phones `blur` isn't reliable, but `visibilitychange` → hidden is the last event an app
 * is guaranteed to get before the OS may freeze or kill it; `pagehide` covers closing and
 * the back/forward cache. localStorage writes are synchronous, so the save completes inside
 * the handler. Returns a cleanup function.
 */
export function saveWhenLeaving(state: GameState): () => void {
  const onHidden = () => {
    if (document.visibilityState === 'hidden') saveGame(state, 'app hidden')
  }
  const onBlur = () => saveGame(state, 'window lost focus')
  const onPageHide = () => saveGame(state, 'page hidden')
  document.addEventListener('visibilitychange', onHidden)
  window.addEventListener('blur', onBlur)
  window.addEventListener('pagehide', onPageHide)
  return () => {
    document.removeEventListener('visibilitychange', onHidden)
    window.removeEventListener('blur', onBlur)
    window.removeEventListener('pagehide', onPageHide)
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

// ------------------------------------------------------------------ leaderboard

const LEADERBOARD_KEY = 'birdhouse.leaderboard'

/** The stored top scores; empty if there are none or storage is unavailable. */
export function loadLeaderboard(): LeaderboardEntry[] {
  try {
    return parseLeaderboard(localStorage.getItem(LEADERBOARD_KEY))
  } catch {
    return []
  }
}

/** Adds a finished game's human winners to the leaderboard. Call once per finished game. */
export function recordWinners(state: GameState, date = new Date().toISOString()): void {
  const winners = winnersOf(state, date)
  if (winners.length === 0) return
  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(addEntries(loadLeaderboard(), winners)))
    gameLog('info', `Leaderboard: recorded ${winners.map((w) => `${w.name} ${w.score}`).join(', ')}`)
  } catch (e) {
    gameLog('warn', 'Could not save the leaderboard (storage unavailable or full)', e)
  }
}
