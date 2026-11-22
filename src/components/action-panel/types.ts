import type { ReactNode } from 'react'
import type { Draft } from '../../draft'
import type { GameState } from '../../game/types'

/** Props shared by the per-action panels; `draft` is narrowed to that action. */
export type PanelProps<K extends Draft['kind']> = {
  state: GameState
  draft: Extract<Draft, { kind: K }>
  setDraft: (d: Draft) => void
  /** Confirm / Cancel row with the validation message, rendered last. */
  footer: ReactNode
  docked: boolean
}
