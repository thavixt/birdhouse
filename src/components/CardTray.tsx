import { useTranslation } from 'react-i18next'
import { useHorizontalWheel } from '../hooks/useHorizontalWheel'
import type { DragItem } from '../draft'
import BirdCard from './BirdCard'
import DragSource from './DragSource'

type Props = {
  tray: (string | null)[]
  deckCount: number
  /** Cards waiting to be shuffled into a new deck when the deck runs out. */
  discardCount: number
  pickedTray: number[]
  pickedDeck: number
  onPickTray?: (index: number) => void
  onPickDeck?: () => void
  /** Which cards may be dragged into the hand right now. Only inside GameScreen's DndContext. */
  canDrag?: (item: DragItem) => boolean
  /** Click on a tray card that can't be picked right now: show its info. */
  onInspect?: (cardId: string) => void
}

/** The face-up cards and the deck. */
export default function CardTray({ tray, deckCount, discardCount, pickedTray, pickedDeck, onPickTray, onPickDeck, canDrag, onInspect }: Props) {
  const { t } = useTranslation()
  // The mouse wheel scrolls through the tray sideways.
  const wheelScroll = useHorizontalWheel<HTMLDivElement>()
  const deck = (
    <button
      type="button"
      onClick={onPickDeck}
      disabled={!onPickDeck}
      data-deck
      className={`flex min-h-52 w-36 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-stone-400 bg-linear-to-br from-stone-600 to-stone-800 text-white shadow-sm ${onPickDeck ? 'cursor-pointer hover:ring-2 hover:ring-violet-400' : 'cursor-default'} ${pickedDeck > 0 ? 'ring-4 ring-violet-500' : ''}`}
    >
      <span className="text-2xl">🂠</span>
      <span className="text-xs">{t('tray.deck', { count: deckCount })}</span>
      {discardCount > 0 && <span className="text-[10px] text-stone-300">{t('tray.discard', { count: discardCount })}</span>}
      {pickedDeck > 0 && <span className="text-xs font-bold">{t('tray.picked', { count: pickedDeck })}</span>}
    </button>
  )
  return (
    <section data-tour="tray" className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-stone-600">
        <span aria-hidden>🐦 </span>
        {t('tray.title')} {canDrag && onPickTray && <span className="font-normal">{t('tray.hint')}</span>}
      </h3>
      <div ref={wheelScroll} className="flex gap-2 overflow-x-auto pb-2">
        {canDrag ? (
          <DragSource id="deck" item={{ kind: 'deck' }} enabled={canDrag({ kind: 'deck' })}>
            {deck}
          </DragSource>
        ) : (
          deck
        )}
        {tray.map((id, i) => {
          if (!id) {
            return (
              <div
                key={i}
                className="flex w-36 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-stone-300 text-xs text-stone-400"
              >
                {t('tray.empty')}
              </div>
            )
          }
          const card = <BirdCard cardId={id} selected={pickedTray.includes(i)} onClick={onPickTray ? () => onPickTray(i) : onInspect && (() => onInspect(id))} />
          const item: DragItem = { kind: 'tray', index: i }
          return canDrag ? (
            <DragSource key={i} id={`tray:${i}`} item={item} enabled={canDrag(item)}>
              {card}
            </DragSource>
          ) : (
            <div key={i} className="flex shrink-0">
              {card}
            </div>
          )
        })}
      </div>
    </section>
  )
}
