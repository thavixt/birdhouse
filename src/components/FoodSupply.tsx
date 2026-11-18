import { FOODS, type Food } from '../game/types'
import FoodToken from './FoodToken'

type Props = { food: Record<Food, number> }

/** A player's food tokens. */
export default function FoodSupply({ food }: Props) {
  return (
    <div className="flex flex-wrap gap-1" aria-label="Food">
      {FOODS.map((f) => (
        <FoodToken key={f} food={f} count={food[f]} />
      ))}
    </div>
  )
}
