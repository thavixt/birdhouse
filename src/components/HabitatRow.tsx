import { useTranslation } from 'react-i18next'
import { BIRDS_BY_ID } from '../game/birds'
import { eggCostForSlot, ROW_SIZE } from '../game/engine'
import type { Habitat, PlacedBird } from '../game/types'
import { HABITAT_ICON, HABITAT_STYLE } from '../theme'
import { BIRD_IMAGE_BY_ID } from '../bird-images'
import BirdPhoto from './BirdPhoto'
import { birdName } from '../i18n/birdName'
import HabitatScenery from './HabitatScenery'

type Props = {
  habitat: Habitat
  birds: PlacedBird[]
  count: number // how many food/eggs/cards this row's action gives
  onAction?: () => void
  onBirdClick?: (index: number) => void
  /** Click on a placed bird when it takes no eggs right now: show its info. */
  onInspect?: (index: number) => void
  /** Pending egg change per slot index (+ laying, − paying). */
  eggDelta?: (index: number) => number
  highlightNext?: boolean
}

export default function HabitatRow({ habitat, birds, count, onAction, onBirdClick, onInspect, eggDelta, highlightNext = false }: Props) {
  const { t } = useTranslation()
  const style = HABITAT_STYLE[habitat]
  const action = t(`habitats.${habitat}.action`)
  const onSlotClick = onBirdClick ?? onInspect
  return (
    // Phones: the action is a slim bar above the slots, so the 5 slots get the full width.
    // sm and up: the action is a column on the left of the slots.
    // `isolate` gives the row its own stacking context, so the scenery (-z-10) sits behind the slots.
    <div className={`relative isolate flex flex-col gap-1.5 overflow-hidden rounded-lg border p-1.5 sm:flex-row sm:items-stretch sm:gap-2 sm:p-2 ${style.row}`}>
      <HabitatScenery habitat={habitat} />
      <button
        type="button"
        onClick={onAction}
        disabled={!onAction}
        className={`flex shrink-0 items-center justify-center gap-2 rounded-md px-2 py-1.5 text-center text-sm font-semibold disabled:opacity-60 sm:w-24 sm:flex-col sm:gap-0 sm:px-1 sm:py-2 sm:text-xs ${style.button} ${onAction ? 'cursor-pointer' : 'cursor-default'}`}
        title={`${t(`habitats.${habitat}.name`)}: ${action}`}
        data-habitat={habitat}
      >
        <span className="text-base sm:text-lg">{HABITAT_ICON[habitat]}</span>
        <span>{action}</span>
        <span className="sm:text-base">{t('board.actionCount', { count })}</span>
      </button>
      <div className="grid flex-1 grid-cols-5 gap-1 sm:gap-1.5">
        {Array.from({ length: ROW_SIZE }, (_, i) => {
          const bird = birds[i]
          if (!bird) {
            const cost = eggCostForSlot(i)
            const next = highlightNext && i === birds.length
            return (
              <div
                key={i}
                className={`flex min-h-16 flex-wrap items-center justify-center gap-x-1 rounded-md border-2 border-dashed text-center text-xs text-stone-500 sm:min-h-20 ${next ? 'border-violet-500 bg-violet-50/90' : 'border-stone-400/70 bg-white/55 backdrop-blur-[1px]'}`}
              >
                {cost > 0 && (
                  <>
                    <span>{'🥚'.repeat(cost)}</span>
                    <span className="hidden sm:inline">{t('board.toPlay')}</span>
                  </>
                )}
              </div>
            )
          }
          const card = BIRDS_BY_ID[bird.cardId]
          const name = t(`birds.${card.id}`)
          const photo = BIRD_IMAGE_BY_ID[card.id]
          const delta = eggDelta?.(i) ?? 0
          const eggs = bird.eggs + delta
          return (
            <button
              key={i}
              type="button"
              disabled={!onSlotClick}
              onClick={() => onSlotClick?.(i)}
              className={`relative isolate flex min-h-16 min-w-0 flex-col justify-between gap-0.5 overflow-hidden rounded-md border border-stone-300 bg-white p-1 text-left shadow-sm sm:min-h-20 sm:p-1.5 ${onSlotClick ? 'cursor-pointer hover:ring-2 hover:ring-violet-400' : 'cursor-default'}`}
              title={birdName(card.id)}
            >
              {/* Faded so the small text on top stays readable. */}
              {photo && <BirdPhoto photo={photo} className="opacity-30" />}
              {/* Phones: the name gets the full slot width; points sit in the bottom row instead. */}
              <div className="flex items-start justify-between gap-0.5">
                <span className="line-clamp-3 min-w-0 text-[10px] leading-tight font-semibold wrap-break-word hyphens-auto sm:line-clamp-2 sm:text-xs">
                  {name}
                </span>
                <span className="hidden shrink-0 rounded bg-stone-800 px-1 text-xs font-bold text-white sm:inline">{card.points}</span>
              </div>
              {/* <DevBirdId id={card.id} className="leading-none" /> */}
              <div className="flex items-center justify-between gap-0.5 text-[10px] sm:block sm:text-xs">
                {/* Phones: compact count. Wider: one icon per egg plus empty spaces. */}
                <span className="whitespace-nowrap sm:hidden">
                  🥚{eggs}/{card.eggLimit}
                </span>
                <span className="hidden sm:inline">
                  <span className="tracking-tighter">{'🥚'.repeat(eggs)}</span>
                  <span className="text-stone-300">{'○'.repeat(Math.max(0, card.eggLimit - eggs))}</span>
                </span>
                {delta !== 0 && (
                  <span className={`ml-0.5 font-bold sm:ml-1 ${delta > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {delta > 0 ? `+${delta}` : delta}
                  </span>
                )}
                <span className="shrink-0 rounded bg-stone-800 px-1 font-bold text-white sm:hidden">{card.points}</span>
              </div>
              {card.power && (
                <span className="text-[10px] leading-none text-violet-700">
                  <span className="sm:hidden">⚡</span>
                  <span className="hidden sm:inline">{t('board.power')}</span>
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
