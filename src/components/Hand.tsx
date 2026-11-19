import { useTranslation } from 'react-i18next'
import BirdCard from './BirdCard'

type Props = {
  cards: string[]
  selected: string | null
  isPlayable: (cardId: string) => boolean
  onSelect?: (cardId: string) => void
}

export default function Hand({ cards, selected, isPlayable, onSelect }: Props) {
  const { t } = useTranslation()
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-stone-600">
        <span aria-hidden>🤚 </span>
        {t('hand.title', { count: cards.length })} {onSelect && <span className="font-normal">{t('hand.hint')}</span>}
      </h3>
      {cards.length === 0 ? (
        <p className="text-sm text-stone-500 italic">{t('hand.empty')}</p>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {cards.map((id, i) => {
            const playable = isPlayable(id)
            return (
              <BirdCard
                key={`${id}-${i}`}
                cardId={id}
                selected={selected === id}
                dimmed={!playable}
                onClick={onSelect && playable ? () => onSelect(id) : undefined}
              />
            )
          })}
        </div>
      )}
    </section>
  )
}
