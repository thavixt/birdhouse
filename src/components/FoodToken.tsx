import type { Food } from '../game/types'
import { FOOD_ICON } from '../theme'

type Props = { food: Food; count?: number; onClick?: () => void; title?: string }

/** A food icon, optionally with a count; becomes a button when clickable. */
export default function FoodToken({ food, count, onClick, title }: Props) {
  const body = (
    <>
      <span aria-hidden>{FOOD_ICON[food]}</span>
      {count !== undefined && <span className="tabular-nums">{count}</span>}
    </>
  )
  const base = 'inline-flex items-center gap-1 rounded-full border border-stone-300 bg-white px-2 py-0.5 text-sm'
  if (!onClick) {
    return (
      <span className={base} title={title ?? food}>
        {body}
      </span>
    )
  }
  return (
    <button type="button" onClick={onClick} title={title ?? food} className={`${base} cursor-pointer hover:border-stone-500 hover:bg-stone-50`}>
      {body}
    </button>
  )
}
