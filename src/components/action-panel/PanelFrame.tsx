import type { ReactNode } from 'react'

type Props = { title: string; children: ReactNode; docked: boolean }

/** The action panel's box and title. Docked (phones): tighter, with a lifted shadow. */
export default function PanelFrame({ title, children, docked }: Props) {
  return (
    <section
      className={`rounded-xl border border-violet-200 bg-violet-50 text-sm ${docked ? 'p-2.5 shadow-[0_-4px_16px_rgba(0,0,0,0.12)]' : 'p-3'}`}
    >
      <h3 className={`font-bold text-violet-900 ${docked ? 'mb-1' : 'mb-2'}`}>{title}</h3>
      {children}
    </section>
  )
}
