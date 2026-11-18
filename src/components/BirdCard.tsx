import { useTranslation } from 'react-i18next'
import { BIRDS_BY_ID } from '../game/birds'
import { FOOD_ICON, HABITAT_ICON, HABITAT_STYLE } from '../theme'
import PowerText from './PowerText'

type Props = {
  cardId: string
  onClick?: () => void
  selected?: boolean
  dimmed?: boolean
}

export default function BirdCard({ cardId, onClick, selected = false, dimmed = false }: Props) {
  const { t } = useTranslation()
  const card = BIRDS_BY_ID[cardId]
  const cost = [...card.cost.foods.map((f) => FOOD_ICON[f]), ...Array<string>(card.cost.anyCount).fill('❔')]
  const ring = selected ? 'ring-4 ring-violet-500' : onClick ? 'hover:ring-2 hover:ring-stone-400' : ''
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`flex w-36 shrink-0 flex-col overflow-hidden rounded-lg border border-stone-300 bg-stone-50 text-left shadow-sm transition ${ring} ${dimmed ? 'opacity-50' : ''} ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <div className="flex h-1.5">
        {card.habitats.map((h) => (
          <div key={h} className={`flex-1 ${HABITAT_STYLE[h].stripe}`} />
        ))}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-2">
        <div className="flex items-start justify-between gap-1">
          <span className="text-sm leading-tight font-semibold">{t(`birds.${card.id}`)}</span>
          <span className="rounded bg-stone-800 px-1.5 text-sm font-bold text-white" title={t('card.points')}>
            {card.points}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span title={card.cost.anyCount ? t('card.anyFood') : t('card.foodCost')}>{cost.join('') || '—'}</span>
          <span title={t('card.habitats')}>{card.habitats.map((h) => HABITAT_ICON[h]).join('')}</span>
        </div>
        <div className="text-xs text-stone-600" title={t('card.eggLimit')}>
          🥚 × {card.eggLimit}
        </div>
        <div className="min-h-8 text-xs leading-snug text-stone-700 italic">{card.power && <PowerText power={card.power} />}</div>
      </div>
    </button>
  )
}
