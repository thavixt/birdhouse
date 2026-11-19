// Debug logging hook for the game layer. Silent until the UI installs a sink
// (see src/debug.ts), so src/game/ stays free of browser APIs and tests stay quiet.
import type { GameMessage } from './types'

export type LogLevel = 'debug' | 'info' | 'warn'
export type GameLogger = (level: LogLevel, message: string, data?: unknown) => void

let sink: GameLogger | null = null

/** Install (or with null, remove) the function that receives log lines. */
export function setGameLogger(logger: GameLogger | null): void {
  sink = logger
}

export function gameLog(level: LogLevel, message: string, data?: unknown): void {
  sink?.(level, message, data)
}

// React Strict Mode calls reducers twice in development with the same action object.
// Logging once per object keeps the console free of duplicates without affecting state.
const seen = new WeakSet<object>()

/** Runs `log` only the first time it's called for `key` (e.g. an action object). */
export function logOnce(key: object, log: () => void): void {
  if (!sink || seen.has(key)) return
  seen.add(key)
  log()
}

/** "error.eggCost {count:1}"-style text for a GameMessage (untranslated, for developers). */
export function describeMessage(msg: GameMessage): string {
  return msg.params ? `${msg.key} ${JSON.stringify(msg.params)}` : msg.key
}
