import type { ReactNode } from 'react'

/** One labelled row of the action panel ("Habitat", "Food", "Eggs 1/2", ...). */
export default function PanelStep({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-2 flex flex-wrap items-center gap-2">
      <span className="w-24 shrink-0 text-xs font-semibold text-stone-600 uppercase">{label}</span>
      {children}
    </div>
  )
}
