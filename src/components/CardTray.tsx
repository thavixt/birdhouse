import { useTranslation } from 'react-i18next'
import { cn } from 'cn'
import type { DragItem } from '../draft'
import BirdCard from './BirdCard'
import CardBack from './CardBack'
import CardRow from './CardRow'
import CardSlot from './CardSlot'

type Props = {
  tray: (string | null)[]
  deckCount: number
  /** Cards waiting to be shuffled into a new deck when the deck runs out. */
  discardCount: number
  pickedTray: number[]
  pickedDeck: number
  /**
   * Which cards may be dragged into the hand right now. Only inside GameScreen's DndContext.
   * Dragging is the only way to draw: clicks never pick a card.
   */
  canDrag?: (item: DragItem) => boolean
  /** Click on a tray card: show its info. */
  onInspect?: (cardId: string) => void
}

/**
 * The face-up cards and the deck. The cards overlap like the hand and pop forward on hover.
 * Cards are drawn by dragging them (or the deck) into the hand.
 */
export default function CardTray({ tray, deckCount, discardCount, pickedTray, pickedDeck, canDrag, onInspect }: Props) {
  const { t } = useTranslation()
  const drag = (id: string, item: DragItem) => (canDrag ? { id, item, enabled: canDrag(item) } : undefined)
  const deckDraggable = canDrag?.({ kind: 'deck' }) ?? false
  return (
    <CardRow tour="tray" icon="🐦" title={t('tray.title')} hint={canDrag && t('tray.hint')} rowClassName="flex px-1 pt-3 pb-3">
      {tray.map((id, i) => (
        <div
          key={i}
          className={cn(
            // Like the hand: each card but the last shrinks to its share of the row (at most
            // 7rem, so neighbours always overlap a little) and is covered by the next one.
            'relative flex min-w-0 transition-transform duration-150',
            i === tray.length - 1 ? 'shrink-0' : 'flex-1 basis-0 max-w-28',
            id && 'hover:z-20 hover:-translate-y-1 hover:scale-110',
          )}
        >
          {id ? (
            <CardSlot drag={drag(`tray:${i}`, { kind: 'tray', index: i })}>
              <BirdCard cardId={id} selected={pickedTray.includes(i)} onClick={onInspect && (() => onInspect(id))} />
            </CardSlot>
          ) : (
            <div className="m-1 flex w-36 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-stone-300 bg-stone-50 text-xs text-stone-400">
              {t('tray.empty')}
            </div>
          )}
        </div>
      ))}
      <div className="ml-3 flex shrink-0">
        <CardSlot drag={drag('deck', { kind: 'deck' })}>
          <div
            data-deck
            title={deckDraggable ? t('tray.deckHint') : undefined}
            className={cn('flex shrink-0 rounded-lg shadow-sm', deckDraggable && 'hover:ring-2 hover:ring-violet-400', pickedDeck > 0 && 'ring-4 ring-violet-500')}
          >
            <CardBack>
              <span className="text-xs">{t('tray.deck', { count: deckCount })}</span>
              {discardCount > 0 && <span className="text-[10px] text-stone-300">{t('tray.discard', { count: discardCount })}</span>}
              {pickedDeck > 0 && <span className="text-xs font-bold">{t('tray.picked', { count: pickedDeck })}</span>}
            </CardBack>
          </div>
        </CardSlot>
      </div>
    </CardRow>
  )
}
