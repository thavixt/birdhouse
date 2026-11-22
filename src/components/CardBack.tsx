import type { ReactNode } from 'react'

/** A face-down card, the size of a `BirdCard` (the deck, and the deck while dragged). */
export default function CardBack({ children }: { children?: ReactNode }) {
  return (
    <div className="flex min-h-52 w-36 flex-col items-center justify-center gap-1 rounded-lg border border-stone-400 bg-linear-to-br from-stone-600 to-stone-800 text-white">
      <span aria-hidden className="text-2xl">
        🂠
      </span>
      {children}
    </div>
  )
}
