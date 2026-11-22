import type { TFunction } from 'i18next'
import { FOODS, type Food, type GameMessage } from '../game/types'
import { birdName } from './birdName'

/**
 * Translates an engine message. Params are translated by name (see `GameMessage`):
 * bird ids, habitats, foods and goal ids become display text; the rest pass through.
 * Bird names come from `birdName` (the global i18n instance).
 */
export function formatMessage(t: TFunction, msg: GameMessage): string {
  const params: Record<string, string | number> = {}
  for (const [name, value] of Object.entries(msg.params ?? {})) {
    if (Array.isArray(value)) {
      params[name] = name === 'foods' ? formatFoods(t, value as Food[]) : value.join(', ')
    } else if (name === 'card' || name === 'target') {
      params[name] = birdName(String(value))
    } else if (name === 'habitat') {
      params.habitat = t(`habitats.${value}.name`)
      params.habitatIn = t(`habitats.${value}.in`)
    } else if (name === 'food') {
      params.food = t(`foods.${value}`)
    } else if (name === 'goal') {
      params.goal = t(`goals.${value}`)
    } else {
      params[name] = value
    }
  }
  return t(msg.key, params)
}

function formatFoods(t: TFunction, foods: Food[]): string {
  return FOODS.map((f) => [f, foods.filter((x) => x === f).length] as const)
    .filter(([, n]) => n > 0)
    .map(([f, n]) => `${n} ${t(`foods.${f}`)}`)
    .join(', ')
}
