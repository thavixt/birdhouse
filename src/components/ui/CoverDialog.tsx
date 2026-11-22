import { useId, type ReactNode } from 'react'
import { cn } from 'cn'

type Props = {
  title: string
  /** The one main button (focused on open). */
  actionLabel: string
  onAction: () => void
  /** Body text below the title. */
  children: ReactNode
  /** Small controls under the main button (language, fullscreen, …). */
  controls?: ReactNode
  /** Wider text column (`max-w-md` instead of `max-w-sm`) for longer text. */
  wide?: boolean
  /** Outer element, e.g. a different `z-*` (default `z-40`). */
  className?: string
}

/**
 * Opaque green full-screen cover with a bird, a title, some text and one main button: the
 * welcome screen and the hot-seat "pass the device" screen. Covers everything beneath it,
 * including the docked action panel.
 */
export default function CoverDialog({ title, actionLabel, onAction, children, controls, wide = false, className }: Props) {
  const titleId = useId()
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className={cn(
        'fixed inset-0 z-40 flex items-center justify-center bg-linear-to-b from-emerald-800 to-emerald-950 p-4 text-center text-white',
        className,
      )}
    >
      <div className={cn('flex flex-col items-center gap-4', wide ? 'max-w-md' : 'max-w-sm')}>
        <span aria-hidden className="text-5xl">
          🐦
        </span>
        <h2 id={titleId} className="text-2xl font-bold sm:text-3xl">
          {title}
        </h2>
        <div className="flex flex-col gap-4 text-emerald-100">{children}</div>
        <button
          type="button"
          autoFocus
          onClick={onAction}
          className="cursor-pointer rounded-lg bg-white px-5 py-2.5 font-semibold text-emerald-900 shadow-lg hover:bg-emerald-50"
        >
          {actionLabel}
        </button>
        {controls}
      </div>
    </div>
  )
}
