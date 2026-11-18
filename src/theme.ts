import type { Food, Habitat } from './game/types'

export const FOOD_ICON: Record<Food, string> = {
  seed: '🌾',
  insect: '🐛',
  fish: '🐟',
  fruit: '🍒',
  rodent: '🐭',
}

export const HABITAT_ICON: Record<Habitat, string> = {
  forest: '🌲',
  grassland: '🌼',
  wetland: '💧',
}

export const HABITAT_LABEL: Record<Habitat, string> = {
  forest: 'Forest',
  grassland: 'Grassland',
  wetland: 'Wetland',
}

export const HABITAT_ACTION: Record<Habitat, string> = {
  forest: 'Gain food',
  grassland: 'Lay eggs',
  wetland: 'Draw cards',
}

/** Static class strings so Tailwind can see them. */
export const HABITAT_STYLE: Record<Habitat, { row: string; button: string; stripe: string; chip: string }> = {
  forest: {
    row: 'bg-emerald-100/70 border-emerald-300',
    button: 'bg-emerald-700 hover:bg-emerald-800 text-white',
    stripe: 'bg-emerald-600',
    chip: 'bg-emerald-100 text-emerald-900',
  },
  grassland: {
    row: 'bg-amber-100/70 border-amber-300',
    button: 'bg-amber-600 hover:bg-amber-700 text-white',
    stripe: 'bg-amber-500',
    chip: 'bg-amber-100 text-amber-900',
  },
  wetland: {
    row: 'bg-sky-100/70 border-sky-300',
    button: 'bg-sky-700 hover:bg-sky-800 text-white',
    stripe: 'bg-sky-600',
    chip: 'bg-sky-100 text-sky-900',
  },
}
