import { useTranslation } from 'react-i18next'
import { FOODS, type Food } from '../../game/types'
import FoodToken from '../FoodToken'

type Props = {
  label: string
  onPick: (f: Food) => void
  /** Limits the choice to foods the player still has, showing the counts. Omit for "any food". */
  available?: Record<Food, number>
}

export default function FoodPicker({ label, onPick, available }: Props) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-wrap items-center gap-1">
      <span className="text-xs text-stone-600">{label}</span>
      {FOODS.filter((f) => !available || available[f] > 0).map((f) => (
        <FoodToken key={f} food={f} count={available?.[f]} onClick={() => onPick(f)} title={t('food.add', { food: t(`foods.${f}`) })} />
      ))}
    </div>
  )
}
