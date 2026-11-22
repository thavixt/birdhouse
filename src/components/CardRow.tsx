import type { ReactNode } from 'react'
import { cn } from 'cn'
import { useHorizontalWheel } from '../hooks/useHorizontalWheel'

type Props = {
  /** Tutorial target (`data-tour`). */
  tour: string
  icon: string
  title: string
  /** How to use the row, after the title; shown only while it can be used. */
  hint?: string | false
  /** Shown instead of the row when there are no cards. */
  empty?: string | false
  className?: string
  children: ReactNode
}

/** A headed, sideways-scrolling row of cards (hand, bird tray). The mouse wheel scrolls it sideways. */
export default function CardRow({ tour, icon, title, hint, empty, className, children }: Props) {
  const wheelScroll = useHorizontalWheel<HTMLDivElement>()
  return (
    <section data-tour={tour} className={cn('flex flex-col gap-2', className)}>
      <h3 className="text-sm font-semibold text-stone-600">
        <span aria-hidden>{`${icon} `}</span>
        {title} {hint && <span className="font-normal">{hint}</span>}
      </h3>
      {empty ? (
        <p className="text-sm text-stone-500 italic">{empty}</p>
      ) : (
        <div ref={wheelScroll} className="flex gap-2 overflow-x-auto pb-2">
          {children}
        </div>
      )}
    </section>
  )
}
