import { MouseSensor, TouchSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core'
import { useState } from 'react'
import { canDrag, canDrop, type DragItem, type DropTarget } from '../draft'
import { useGame, useGameStore } from '../store/gameStore'

/**
 * Drag and drop for the game screen (see "Drag and drop" in `src/draft.ts`): the `DndContext` props, the item being dragged, and which drags and
 * drops are allowed right now. Moves only happen while `interactive`.
 *
 * Mouse: a drag starts after 6px, so clicks still work. Touch: press and hold, so swiping
 * still scrolls the page.
 */
export function useCardDrag(interactive: boolean) {
  const state = useGame()
  const draft = useGameStore((s) => s.draft)
  const { startDrag, endDrag } = useGameStore.getState()
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  )
  // Only while the pointer is down; local because nothing outside this screen needs it.
  const [dragging, setDragging] = useState<DragItem | null>(null)

  return {
    /** The item under the pointer (for the drag preview), or null. */
    dragging,
    /** True while the dragged item may be dropped on `target` (highlights drop zones). */
    accepts: (target: DropTarget) => dragging !== null && canDrop(state, draft, dragging, target),
    /** Whether `item` may be picked up right now. */
    canDrag: (item: DragItem) => interactive && canDrag(state, draft, item),
    /** Spread onto `DndContext`. */
    contextProps: {
      sensors,
      onDragStart: ({ active }: DragStartEvent) => {
        const item = (active.data.current as DragItem | undefined) ?? null
        setDragging(item)
        if (item && interactive) startDrag(item)
      },
      onDragEnd: ({ active, over }: DragEndEvent) => {
        setDragging(null)
        const item = active.data.current as DragItem | undefined
        if (!interactive || !item) return
        endDrag(item, (over?.data.current as DropTarget | undefined) ?? null)
      },
      onDragCancel: () => setDragging(null),
    },
  }
}
