import type { ReactNode } from 'react'
import { cn } from 'cn'

type Props = { title: string; className?: string; children: ReactNode }

/** White card with a small grey heading, as used in the game sidebar (players, log). */
export default function SidebarCard({ title, className, children }: Props) {
  return (
    <section className={cn('rounded-xl border border-stone-200 bg-white/80 p-3 text-sm shadow-sm', className)}>
      <h3 className="mb-1 text-sm font-semibold text-stone-600">{title}</h3>
      {children}
    </section>
  )
}
