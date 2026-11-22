import { useDraggable } from '@dnd-kit/core'
import type { ReactNode } from 'react'
import type { DragItem } from '../draft'

type Props = {
  id: string
  item: DragItem
  enabled: boolean
  children: ReactNode
}

/**
 * Makes a card (or the deck) draggable. Must be inside GameScreen's DndContext.
 * Only pointer/touch listeners are attached: the child stays a normal button, so clicking
 * and keyboard use keep working (the drag starts after a small move / a long press).
 * While dragging, the original fades and `DragPreview` follows the pointer.
 */
export default function DragSource({ id, item, enabled, children }: Props) {
  const { setNodeRef, listeners, isDragging } = useDraggable({ id, data: item, disabled: !enabled })
  return (
    <div
      ref={setNodeRef}
      {...(enabled ? listeners : {})}
      className={`flex shrink-0 ${enabled ? 'cursor-grab touch-manipulation select-none' : ''} ${isDragging ? 'opacity-30' : ''}`}
    >
      {children}
    </div>
  )
}
