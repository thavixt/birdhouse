import type { ReactNode } from 'react'
import { SECONDARY_BUTTON } from '../../theme'

export default function SecondaryButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className={SECONDARY_BUTTON} onClick={onClick}>
      {children}
    </button>
  )
}
