import type { BirdCard, Food, Habitat, Power } from './types'

// Original card data. Species names are real; stats and powers are our own.
function bird(
  id: string,
  name: string,
  habitats: Habitat[],
  foods: Food[],
  anyCount: number,
  points: number,
  eggLimit: number,
  power?: Power,
): BirdCard {
  return { id, name, habitats, cost: { foods, anyCount }, points, eggLimit, power }
}

export const BIRDS: BirdCard[] = [
  // Forest-leaning
  bird('american-robin', 'American Robin', ['forest', 'grassland'], ['insect', 'fruit'], 0, 4, 4, { kind: 'layEggSelf' }),
  bird('barn-owl', 'Barn Owl', ['forest', 'grassland'], ['rodent', 'rodent'], 0, 5, 2),
  bird('blue-jay', 'Blue Jay', ['forest'], ['seed', 'seed'], 0, 3, 3, { kind: 'gainFood', food: 'seed' }),
  bird('northern-cardinal', 'Northern Cardinal', ['forest', 'grassland'], ['seed', 'fruit'], 0, 4, 3),
  bird('black-capped-chickadee', 'Black-capped Chickadee', ['forest'], ['seed'], 0, 2, 5),
  bird('downy-woodpecker', 'Downy Woodpecker', ['forest'], ['insect'], 0, 2, 4, { kind: 'gainFood', food: 'insect' }),
  bird('pileated-woodpecker', 'Pileated Woodpecker', ['forest'], ['insect', 'insect', 'fruit'], 0, 7, 2),
  bird('great-horned-owl', 'Great Horned Owl', ['forest', 'grassland', 'wetland'], ['rodent', 'rodent', 'rodent'], 0, 8, 1),
  bird('cedar-waxwing', 'Cedar Waxwing', ['forest'], ['fruit', 'fruit'], 0, 3, 4, { kind: 'allGainFood', food: 'fruit' }),
  bird('ruby-throated-hummingbird', 'Ruby-throated Hummingbird', ['forest', 'grassland'], [], 1, 2, 3, { kind: 'drawCard' }),
  bird('wild-turkey', 'Wild Turkey', ['forest', 'grassland'], ['seed', 'insect', 'fruit'], 0, 6, 3),
  bird('red-tailed-hawk', 'Red-tailed Hawk', ['forest', 'grassland'], ['rodent', 'rodent'], 0, 5, 2),
  bird('wood-duck', 'Wood Duck', ['wetland', 'forest'], ['seed', 'fruit'], 0, 4, 4, { kind: 'layEggAny' }),
  bird('bald-eagle', 'Bald Eagle', ['wetland', 'forest'], ['fish', 'fish', 'rodent'], 0, 8, 1),

  // Grassland-leaning
  bird('american-kestrel', 'American Kestrel', ['grassland'], ['insect', 'rodent'], 0, 4, 3, { kind: 'gainFood', food: 'rodent' }),
  bird('eastern-bluebird', 'Eastern Bluebird', ['grassland'], ['insect'], 0, 2, 5, { kind: 'layEggSelf' }),
  bird('western-meadowlark', 'Western Meadowlark', ['grassland'], ['seed', 'insect'], 0, 3, 5, { kind: 'layEggAny' }),
  bird('mourning-dove', 'Mourning Dove', ['grassland', 'forest'], ['seed'], 0, 1, 6, { kind: 'layEggAny' }),
  bird('house-sparrow', 'House Sparrow', ['grassland'], [], 1, 1, 6, { kind: 'layEggSelf' }),
  bird('barn-swallow', 'Barn Swallow', ['grassland', 'wetland'], ['insect'], 0, 2, 4, { kind: 'drawCard' }),
  bird('killdeer', 'Killdeer', ['grassland', 'wetland'], ['insect', 'seed'], 0, 3, 4, { kind: 'layEggSelf' }),
  bird('greater-prairie-chicken', 'Greater Prairie-Chicken', ['grassland'], ['seed', 'seed'], 1, 5, 3),
  bird('burrowing-owl', 'Burrowing Owl', ['grassland'], ['insect', 'rodent'], 0, 4, 3),
  bird('red-winged-blackbird', 'Red-winged Blackbird', ['wetland', 'grassland'], ['seed', 'insect'], 0, 3, 4, { kind: 'allGainFood', food: 'seed' }),

  // Wetland-leaning
  bird('great-blue-heron', 'Great Blue Heron', ['wetland'], ['fish', 'fish'], 1, 6, 2),
  bird('mallard', 'Mallard', ['wetland', 'grassland'], ['seed'], 1, 3, 5, { kind: 'layEggSelf' }),
  bird('belted-kingfisher', 'Belted Kingfisher', ['wetland'], ['fish'], 0, 3, 2, { kind: 'gainFood', food: 'fish' }),
  bird('osprey', 'Osprey', ['wetland'], ['fish', 'fish'], 0, 5, 2),
  bird('common-loon', 'Common Loon', ['wetland'], ['fish', 'insect'], 0, 4, 2, { kind: 'drawCard' }),
  bird('american-white-pelican', 'American White Pelican', ['wetland'], ['fish', 'fish', 'fish'], 0, 7, 1, { kind: 'allGainFood', food: 'fish' }),
  bird('sandhill-crane', 'Sandhill Crane', ['wetland', 'grassland'], ['seed', 'fruit'], 1, 5, 2),
  bird('snowy-egret', 'Snowy Egret', ['wetland'], ['fish', 'insect'], 0, 4, 3),
]

export const BIRDS_BY_ID: Record<string, BirdCard> = Object.fromEntries(BIRDS.map((b) => [b.id, b]))

/** Every bird twice. */
export const STARTING_DECK: string[] = BIRDS.flatMap((b) => [b.id, b.id])

