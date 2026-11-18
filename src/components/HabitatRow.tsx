import { BIRDS_BY_ID } from '../game/birds'
import { eggCostForSlot, ROW_SIZE } from '../game/engine'
import type { Habitat, PlacedBird } from '../game/types'
import { HABITAT_ACTION, HABITAT_ICON, HABITAT_LABEL, HABITAT_STYLE } from '../theme'

type Props = {
  habitat: Habitat
  birds: PlacedBird[]
  count: number // how many food/eggs/cards this row's action gives
  onAction?: () => void
  onBirdClick?: (index: number) => void
  /** Pending egg change per slot index (+ laying, − paying). */
  eggDelta?: (index: number) => number
  highlightNext?: boolean
}

export default function HabitatRow({ habitat, birds, count, onAction, onBirdClick, eggDelta, highlightNext = false }: Props) {
  const style = HABITAT_STYLE[habitat]
  return (
    <div className={`flex items-stretch gap-2 rounded-lg border p-2 ${style.row}`}>
      <button
        type="button"
        onClick={onAction}
        disabled={!onAction}
        className={`flex w-24 shrink-0 flex-col items-center justify-center rounded-md px-1 py-2 text-center text-xs font-semibold disabled:opacity-60 ${style.button} ${onAction ? 'cursor-pointer' : 'cursor-default'}`}
        title={`${HABITAT_LABEL[habitat]}: ${HABITAT_ACTION[habitat]}`}
      >
        <span className="text-lg">{HABITAT_ICON[habitat]}</span>
        <span>{HABITAT_ACTION[habitat]}</span>
        <span className="text-base">×{count}</span>
      </button>
      <div className="grid flex-1 grid-cols-5 gap-1.5">
        {Array.from({ length: ROW_SIZE }, (_, i) => {
          const bird = birds[i]
          if (!bird) {
            const cost = eggCostForSlot(i)
            const next = highlightNext && i === birds.length
            return (
              <div
                key={i}
                className={`flex min-h-20 items-center justify-center rounded-md border-2 border-dashed text-xs text-stone-500 ${next ? 'border-violet-500 bg-violet-50' : 'border-stone-300'}`}
              >
                {cost > 0 ? `${'🥚'.repeat(cost)} to play` : ''}
              </div>
            )
          }
          const card = BIRDS_BY_ID[bird.cardId]
          const delta = eggDelta?.(i) ?? 0
          const eggs = bird.eggs + delta
          return (
            <button
              key={i}
              type="button"
              disabled={!onBirdClick}
              onClick={() => onBirdClick?.(i)}
              className={`flex min-h-20 flex-col justify-between rounded-md border border-stone-300 bg-white p-1.5 text-left shadow-sm ${onBirdClick ? 'cursor-pointer hover:ring-2 hover:ring-violet-400' : 'cursor-default'}`}
              title={card.name}
            >
              <div className="flex items-start justify-between gap-1">
                <span className="line-clamp-2 text-xs leading-tight font-semibold">{card.name}</span>
                <span className="rounded bg-stone-800 px-1 text-xs font-bold text-white">{card.points}</span>
              </div>
              <div className="text-xs">
                <span className="tracking-tighter">{'🥚'.repeat(eggs)}</span>
                <span className="text-stone-300">{'○'.repeat(Math.max(0, card.eggLimit - eggs))}</span>
                {delta !== 0 && (
                  <span className={`ml-1 font-bold ${delta > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {delta > 0 ? `+${delta}` : delta}
                  </span>
                )}
              </div>
              {card.power && <span className="text-[10px] leading-none text-violet-700">⚡ power</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
