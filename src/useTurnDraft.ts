import { useState } from 'react'
import { IDLE, type Draft } from './draft'
import type { GameState } from './game/types'

/**
 * The human's in-progress turn choices. The draft is stamped with the log length, so it
 * resets to idle after every action (bot turns included) without needing an effect.
 */
export function useTurnDraft(state: GameState): [Draft, (d: Draft) => void] {
  const turnStamp = state.log.length
  const [stamped, setStamped] = useState<{ at: number; draft: Draft }>({ at: turnStamp, draft: IDLE })
  const draft = stamped.at === turnStamp ? stamped.draft : IDLE
  return [draft, (d: Draft) => setStamped({ at: turnStamp, draft: d })]
}
