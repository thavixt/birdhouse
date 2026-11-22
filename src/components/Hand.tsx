import { useTranslation } from 'react-i18next'
import BirdCard from './BirdCard'
import CardRow from './CardRow'
import CardSlot from './CardSlot'

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
  return (
    <CardRow
      tour="hand"
      icon="🤚"
      title={t('hand.title', { count: cards.length })}
      hint={showHint && t('hand.hint')}
      empty={cards.length === 0 && t('hand.empty')}
      className="max-w-[800px]"
    >
      {cards.map((id, i) => {
        const playable = isPlayable(id)
        return (
          <CardSlot key={`${id}-${i}`} drag={draggable ? { id: `hand:${i}`, item: { kind: 'hand', cardId: id, handIndex: i }, enabled: playable } : undefined}>
            <BirdCard cardId={id} selected={selectedIndex === i} dimmed={!playable} onClick={() => onCardClick(i)} />
          </CardSlot>
        )
      })}
    </CardRow>
  )
}
