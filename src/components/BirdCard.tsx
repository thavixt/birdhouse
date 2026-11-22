import { useTranslation } from 'react-i18next'
import { BIRD_IMAGE_BY_ID } from '../bird-images'
import { BIRDS_BY_ID } from '../game/birds'
import { FOOD_ICON, HABITAT_ICON, HABITAT_STYLE } from '../theme'
import BirdPhoto from './BirdPhoto'
import PowerText from './PowerText'

type Props = {
  cardId: string
  onClick?: () => void
  selected?: boolean
  dimmed?: boolean
}

/** Light, slightly frosted panel so text stays readable on top of the photo. */
const PANEL = 'rounded-md bg-white/85 backdrop-blur-[2px]'

/**
 * A bird card: the species' photo fills the card (see src/bird-images.ts), with the name and
 * points on top and the cost, habitats, egg limit and power below. The photo's middle stays
 * uncovered and carries the photo credit as its tooltip. Without the photo (offline, not
 * yet loaded) the card falls back to its plain background.
 */
export default function BirdCard({ cardId, onClick, selected = false, dimmed = false }: Props) {
  const { t } = useTranslation()
  const card = BIRDS_BY_ID[cardId]
  const photo = BIRD_IMAGE_BY_ID[card.id]
  const cost = [...card.cost.foods.map((f) => FOOD_ICON[f]), ...Array<string>(card.cost.anyCount).fill('❔')]
  const ring = selected ? 'ring-4 ring-violet-500' : onClick ? 'hover:ring-2 hover:ring-stone-400' : ''
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`relative isolate flex min-h-52 w-36 shrink-0 flex-col overflow-hidden rounded-lg border border-stone-300 bg-stone-100 text-left shadow-sm transition ${ring} ${dimmed ? 'opacity-25' : ''} ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      {photo && <BirdPhoto photo={photo} />}
      <div className="flex h-1.5">
        {card.habitats.map((h) => (
          <div key={h} className={`flex-1 ${HABITAT_STYLE[h].stripe}`} />
        ))}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-1.5">
        <div className={`flex items-start justify-between gap-1 px-1.5 py-1 ${PANEL}`}>
          <div className="flex flex-col p-0.5">
            <span className="text-sm leading-tight font-semibold">
              {t(`birds.${card.id}`)}
            </span>
            {/* <DevBirdId id={card.id} /> */}
          </div>
          <span className="rounded bg-stone-800 px-1.5 text-sm font-bold text-white" title={t('card.points')}>
            {card.points}
          </span>
        </div>
        {/* The bird shows through here; hovering it shows the photo credit. */}
        <div
          className="min-h-14 flex-1"
          title={photo ? t('card.photoCredit', { author: photo.author, license: photo.license }) : undefined}
        />
        <div className={`flex flex-col gap-0.5 px-1.5 py-1 ${PANEL}`}>
          <div className="flex items-center justify-between text-sm">
            <span title={card.cost.anyCount ? t('card.anyFood') : t('card.foodCost')}>{cost.join('') || '—'}</span>
            <span title={t('card.habitats')}>{card.habitats.map((h) => HABITAT_ICON[h]).join('')}</span>
          </div>
          <div className="text-xs text-stone-700" title={t('card.eggLimit')}>
            🥚 × {card.eggLimit}
          </div>
          {card.power && (
            <div className="text-xs leading-snug text-stone-800 italic">
              <PowerText power={card.power} />
            </div>
          )}
        </div>
      </div>
    </button>
  )
}
