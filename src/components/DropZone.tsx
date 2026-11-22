import { useDroppable } from '@dnd-kit/core'
import type { ReactNode } from 'react'
import type { DropTarget } from '../draft'

type Props = {
  target: DropTarget
  /** True while something that may land here is being dragged. */
  enabled: boolean
  children: ReactNode
}

const dropId = (t: DropTarget) => (t.kind === 'hand' ? 'drop:hand' : `drop:${t.habitat}`)

/** A place a dragged card can be put down; outlined while it accepts the dragged item. */
export default function DropZone({ target, enabled, children }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: dropId(target), data: target, disabled: !enabled })
  const ring = !enabled ? '' : isOver ? 'ring-4 ring-violet-500' : 'ring-2 ring-violet-300'
  return (
    <div ref={setNodeRef} className={`rounded-lg transition-shadow ${ring}`}>
      {children}
    </div>
  )
}
