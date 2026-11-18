import { useTranslation } from 'react-i18next'
import { FOODS, type Food } from '../game/types'
import FoodToken from './FoodToken'

type Props = { food: Record<Food, number> }

/** A player's food tokens. */
export default function FoodSupply({ food }: Props) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-wrap gap-1" aria-label={t('board.food')}>
      {FOODS.map((f) => (
        <FoodToken key={f} food={f} count={food[f]} />
      ))}
    </div>
  )
}
