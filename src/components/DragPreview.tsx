import { useTranslation } from 'react-i18next'
import type { DragItem } from '../draft'
import { useGame } from '../store/gameStore'
import BirdCard from './BirdCard'
import CardBack from './CardBack'

/** What follows the pointer while dragging (rendered in dnd-kit's DragOverlay). */
export default function DragPreview({ item }: { item: DragItem }) {
  const { t } = useTranslation()
  const state = useGame()
  const cardId = item.kind === 'hand' ? item.cardId : item.kind === 'tray' ? state.tray[item.index] : null
  return (
    <div className="pointer-events-none rotate-3 cursor-grabbing shadow-2xl">
      {cardId ? (
        <BirdCard cardId={cardId} />
      ) : (
        <CardBack>
          <span className="text-xs">{t('tray.deckCard')}</span>
        </CardBack>
      )}
    </div>
  )
}
