import { useTranslation } from 'react-i18next'
import { useHorizontalWheel } from '../hooks/useHorizontalWheel'
import BirdCard from './BirdCard'
import DragSource from './DragSource'

type Props = {
  cards: string[]
  /**
   * Hand position of the card being played. A position, not a bird id: with two copies of a
   * bird in hand, only the clicked one is highlighted.
   */
  selectedIndex: number | null
  isPlayable: (cardId: string) => boolean
  /** Click on the card at a hand position: play it, or show its info. */
  onCardClick: (index: number) => void
  /** Show the "drag or click" hint (the hand's owner is acting). */
  showHint?: boolean
  /** Playable cards can also be dragged onto a habitat row. Only inside GameScreen's DndContext. */
  draggable?: boolean
}

export default function Hand({ cards, selectedIndex, isPlayable, onCardClick, showHint = false, draggable = false }: Props) {
  const { t } = useTranslation()
  const wheelScroll = useHorizontalWheel<HTMLDivElement>()
  return (
    <section data-tour="hand" className="flex flex-col gap-2 max-w-[800px]">
      <h3 className="text-sm font-semibold text-stone-600">
        <span aria-hidden>🤚 </span>
        {t('hand.title', { count: cards.length })} {showHint && <span className="font-normal">{t('hand.hint')}</span>}
      </h3>
      {cards.length === 0 ? (
        <p className="text-sm text-stone-500 italic">{t('hand.empty')}</p>
      ) : (
        <div ref={wheelScroll} className="flex gap-2 overflow-x-auto pb-2">
          {cards.map((id, i) => {
            const playable = isPlayable(id)
            const card = <BirdCard cardId={id} selected={selectedIndex === i} dimmed={!playable} onClick={() => onCardClick(i)} />
            const key = `${id}-${i}`
            return draggable ? (
              <DragSource key={key} id={`hand:${i}`} item={{ kind: 'hand', cardId: id, handIndex: i }} enabled={playable}>
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
