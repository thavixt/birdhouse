import type { ReactNode } from 'react'
import type { DragItem } from '../draft'
import DragSource from './DragSource'

type Props = {
  /** Make the card draggable. Only inside GameScreen's DndContext. */
  drag?: { id: string; item: DragItem; enabled: boolean }
  children: ReactNode
}

/** One card in a card row (hand, tray): a `DragSource` when it can be dragged, else a plain wrapper. */
export default function CardSlot({ drag, children }: Props) {
  if (!drag) return <div className="flex shrink-0">{children}</div>
  return (
    <DragSource id={drag.id} item={drag.item} enabled={drag.enabled}>
      {children}
    </DragSource>
  )
}
