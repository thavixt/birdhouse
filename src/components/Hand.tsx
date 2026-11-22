import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from 'cn'
import BirdCard from './BirdCard'
import CardRow from './CardRow'
import CardSlot from './CardSlot'

type Props = {
  cards: string[]
  /**
   * Hand position of the bird waiting for its payment to be confirmed. A position, not a bird
   * id: with two copies of a bird in hand, only the dropped one is highlighted.
   */
  selectedIndex: number | null
  isPlayable: (cardId: string) => boolean
  /** Click on the card at a hand position: show its info (birds are played by dragging). */
  onCardClick: (index: number) => void
  /** Show the "drag or click" hint (the hand's owner is acting). */
  showHint?: boolean
  /** Playable cards can also be dragged onto a habitat row. Only inside GameScreen's DndContext. */
  draggable?: boolean
}

/** Widest fan, in degrees from the middle card to an outer one. */
const MAX_SPREAD = 12
/** Tilt between neighbouring cards when there are only a few. */
const MAX_STEP = 4

/** How far the selected card is raised out of the fan, in px. */
const SELECTED_LIFT = 16

/**
 * Tilt and drop of the card at `index`, so the hand curves like a held fan of cards. As CSS
 * variables, so the hover classes can override them.
 */
function fanStyle(index: number, count: number, selected: boolean): CSSProperties {
  const step = count > 1 ? Math.min(MAX_STEP, (2 * MAX_SPREAD) / (count - 1)) : 0
  const angle = (index - (count - 1) / 2) * step
  const drop = (angle * angle) / 8 - (selected ? SELECTED_LIFT : 0)
  return { '--fan-r': `${angle}deg`, '--fan-y': `${drop}px` } as CSSProperties
}

/**
 * The hand, laid out as a fan of overlapping cards that always fits its width (no scrolling):
 * each card gets an equal share of the row, up to a full card, and overlaps the next one.
 * Hovering a card lifts it to the front and enlarges it; the selected card stays raised.
 */
export default function Hand({ cards, selectedIndex, isPlayable, onCardClick, showHint = false, draggable = false }: Props) {
  const { t } = useTranslation()
  return (
    <CardRow
      tour="hand"
      icon="🤚"
      title={t('hand.title', { count: cards.length })}
      hint={showHint && t('hand.hint')}
      empty={cards.length === 0 && t('hand.empty')}
      className="max-w-200"
      rowClassName="flex justify-center px-2 pt-4 pb-6"
    >
      {cards.map((id, i) => {
        const playable = isPlayable(id)
        const selected = selectedIndex === i
        const last = i === cards.length - 1
        return (
          <div
            key={`${id}-${i}`}
            style={fanStyle(i, cards.length, selected)}
            className={cn(
              // Every card but the last shrinks to its share of the row; the card overflows it
              // and is covered by the next one. The last card is shown whole.
              'group relative flex min-w-0 origin-bottom transition-transform duration-150',
              last ? 'shrink-0' : 'flex-1 basis-0 max-w-38',
              'translate-y-(--fan-y) rotate-(--fan-r)',
              'hover:z-20 hover:-translate-y-1 hover:scale-120 hover:rotate-0',
              selected && 'z-10',
            )}
          >
            <CardSlot drag={draggable ? { id: `hand:${i}`, item: { kind: 'hand', cardId: id, handIndex: i }, enabled: playable } : undefined}>
              <BirdCard cardId={id} selected={selected} dimmed={!playable} onClick={() => onCardClick(i)} />
            </CardSlot>
          </div>
        )
      })}
    </CardRow>
  )
}
