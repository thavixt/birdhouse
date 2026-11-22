import { useState } from 'react'
import { describeDraft, IDLE, type Draft } from './draft'
import { gameLog } from './game/logger'
import type { GameState } from './game/types'

/**
 * The human's in-progress turn choices. The draft is stamped with the log length, so it
 * resets to idle after every action (bot turns included) without needing an effect.
 * Every change is written to the debug log with the game state (see "Debug logging").
 */
export function useTurnDraft(state: GameState): [Draft, (d: Draft) => void] {
  const turnStamp = state.log.length
  const [stamped, setStamped] = useState<{ at: number; draft: Draft }>({ at: turnStamp, draft: IDLE })
  const draft = stamped.at === turnStamp ? stamped.draft : IDLE
  // Called from event handlers only (clicks, drops), so logging here is safe.
  const setDraft = (d: Draft) => {
    if (d === draft) return // a click that changed nothing (e.g. no room for another egg)
    const player = state.players[state.currentPlayer]
    gameLog('info', `Turn draft · ${player.name}: ${describeDraft(d)}`, { draft: d, state })
    setStamped({ at: turnStamp, draft: d })
  }
  return [draft, setDraft]
}
