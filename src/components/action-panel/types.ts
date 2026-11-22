import type { ReactNode } from 'react'
import type { Draft } from '../../draft'

/**
 * Props shared by the per-action panels; `draft` is narrowed to that action. The game and
 * `setDraft` come from the store (`useGame`, `useGameStore`).
 */
export type PanelProps<K extends Draft['kind']> = {
  draft: Extract<Draft, { kind: K }>
  /** Confirm / Cancel row with the validation message, rendered last. */
  footer: ReactNode
  docked: boolean
}
