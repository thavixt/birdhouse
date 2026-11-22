import { useTranslation } from 'react-i18next'
import { useHorizontalWheel } from '../hooks/useHorizontalWheel'
import BirdCard from './BirdCard'
import DragSource from './DragSource'

type Props = {
  cards: string[]
  selected: string | null
  isPlayable: (cardId: string) => boolean
  /** Click to start playing a card (opens the action panel). */
  onSelect?: (cardId: string) => void
  /** Playable cards can also be dragged onto a habitat row. Only inside GameScreen's DndContext. */
  draggable?: boolean
  /** Click on a card that can't be played right now: show its info. */
  onInspect?: (cardId: string) => void
}

export default function Hand({ cards, selected, isPlayable, onSelect, draggable = false, onInspect }: Props) {
  const { t } = useTranslation()
  const wheelScroll = useHorizontalWheel<HTMLDivElement>()
  return (
    <section data-tour="hand" className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-stone-600">
        <span aria-hidden>🤚 </span>
        {t('hand.title', { count: cards.length })} {onSelect && <span className="font-normal">{t('hand.hint')}</span>}
      </h3>
      {cards.length === 0 ? (
        <p className="text-sm text-stone-500 italic">{t('hand.empty')}</p>
      ) : (
        <div ref={wheelScroll} className="flex gap-2 overflow-x-auto pb-2">
          {cards.map((id, i) => {
            const playable = isPlayable(id)
            const card = (
              <BirdCard
                cardId={id}
                selected={selected === id}
                dimmed={!playable}
                onClick={onSelect && playable ? () => onSelect(id) : onInspect && (() => onInspect(id))}
              />
            )
            const key = `${id}-${i}`
            return draggable ? (
              <DragSource key={key} id={`hand:${i}`} item={{ kind: 'hand', cardId: id }} enabled={playable}>
                {card}
              </DragSource>
            ) : (
              <div key={key} className="flex shrink-0">
                {card}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
