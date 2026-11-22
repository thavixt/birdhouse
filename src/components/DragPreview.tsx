import { useTranslation } from 'react-i18next'
import type { DragItem } from '../draft'
import type { GameState } from '../game/types'
import BirdCard from './BirdCard'

/** What follows the pointer while dragging (rendered in dnd-kit's DragOverlay). */
export default function DragPreview({ item, state }: { item: DragItem; state: GameState }) {
  const { t } = useTranslation()
  const cardId = item.kind === 'hand' ? item.cardId : item.kind === 'tray' ? state.tray[item.index] : null
  return (
    <div className="pointer-events-none rotate-3 cursor-grabbing shadow-2xl">
      {cardId ? (
        <BirdCard cardId={cardId} />
      ) : (
        <div className="flex min-h-52 w-36 flex-col items-center justify-center gap-1 rounded-lg border border-stone-400 bg-linear-to-br from-stone-600 to-stone-800 text-white">
          <span className="text-2xl">🂠</span>
          <span className="text-xs">{t('tray.deckCard')}</span>
        </div>
      )}
    </div>
  )
}
