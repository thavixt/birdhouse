// Browser console output for the game's debug log (src/game/logger.ts).
// On automatically in `npm run dev`. In a production build (e.g. the installed app),
// enable it from the browser console and reload:
//   localStorage.setItem('birdhouse.debug', '1')   // off: localStorage.removeItem('birdhouse.debug')
import { setGameLogger, type GameLogger } from './game/logger'

const FLAG = 'birdhouse.debug'
const TAG_STYLE = 'color:#fff;background:#047857;border-radius:3px;padding:0 4px;font-weight:bold'

const consoleLogger: GameLogger = (level, message, data) => {
  const args: unknown[] = [`%cbirdhouse%c ${message}`, TAG_STYLE, '']
  if (data !== undefined) args.push(data)
  console[level](...args)
}

function debugEnabled(): boolean {
  if (import.meta.env.DEV) return true
  try {
    return localStorage.getItem(FLAG) === '1'
  } catch {
    return false
  }
}

/** Call once at startup, before the app renders. */
export function initDebugLogging(): void {
  if (!debugEnabled()) return
  setGameLogger(consoleLogger)
  consoleLogger('info', `debug logging on (${import.meta.env.DEV ? 'dev build' : `"${FLAG}" flag`})`)
}
