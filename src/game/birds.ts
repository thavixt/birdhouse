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
  bird('american-robin', 'American robin', ['forest', 'grassland'], ['insect', 'fruit'], 0, 4, 4, { kind: 'layEggSelf' }),
  bird('barn-owl', 'Barn owl', ['forest', 'grassland'], ['rodent', 'rodent'], 0, 5, 2),
  bird('blue-jay', 'Blue jay', ['forest'], ['seed', 'seed'], 0, 3, 3, { kind: 'gainFood', food: 'seed' }),
  bird('northern-cardinal', 'Northern cardinal', ['forest', 'grassland'], ['seed', 'fruit'], 0, 4, 3),
  bird('black-capped-chickadee', 'Black-capped chickadee', ['forest'], ['seed'], 0, 2, 5),
  bird('downy-woodpecker', 'Downy woodpecker', ['forest'], ['insect'], 0, 2, 4, { kind: 'gainFood', food: 'insect' }),
  bird('pileated-woodpecker', 'Pileated woodpecker', ['forest'], ['insect', 'insect', 'fruit'], 0, 7, 2),
  bird('great-horned-owl', 'Great horned owl', ['forest', 'grassland', 'wetland'], ['rodent', 'rodent', 'rodent'], 0, 8, 1),
  bird('cedar-waxwing', 'Cedar waxwing', ['forest'], ['fruit', 'fruit'], 0, 3, 4, { kind: 'allGainFood', food: 'fruit' }),
  bird('ruby-throated-hummingbird', 'Ruby-throated hummingbird', ['forest', 'grassland'], [], 1, 2, 3, { kind: 'drawCard' }),
  bird('wild-turkey', 'Wild turkey', ['forest', 'grassland'], ['seed', 'insect', 'fruit'], 0, 6, 3),
  bird('red-tailed-hawk', 'Red-tailed hawk', ['forest', 'grassland'], ['rodent', 'rodent'], 0, 5, 2),
  bird('wood-duck', 'Wood duck', ['wetland', 'forest'], ['seed', 'fruit'], 0, 4, 4, { kind: 'layEggAny' }),
  bird('bald-eagle', 'Bald eagle', ['wetland', 'forest'], ['fish', 'fish', 'rodent'], 0, 8, 1),

  // Grassland-leaning
  bird('american-kestrel', 'American kestrel', ['grassland'], ['insect', 'rodent'], 0, 4, 3, { kind: 'gainFood', food: 'rodent' }),
  bird('eastern-bluebird', 'Eastern bluebird', ['grassland'], ['insect'], 0, 2, 5, { kind: 'layEggSelf' }),
  bird('western-meadowlark', 'Western meadowlark', ['grassland'], ['seed', 'insect'], 0, 3, 5, { kind: 'layEggAny' }),
  bird('mourning-dove', 'Mourning dove', ['grassland', 'forest'], ['seed'], 0, 1, 6, { kind: 'layEggAny' }),
  bird('house-sparrow', 'House sparrow', ['grassland'], [], 1, 1, 6, { kind: 'layEggSelf' }),
  bird('barn-swallow', 'Barn swallow', ['grassland', 'wetland'], ['insect'], 0, 2, 4, { kind: 'drawCard' }),
  bird('killdeer', 'Killdeer', ['grassland', 'wetland'], ['insect', 'seed'], 0, 3, 4, { kind: 'layEggSelf' }),
  bird('greater-prairie-chicken', 'Greater prairie-chicken', ['grassland'], ['seed', 'seed'], 1, 5, 3),
  bird('burrowing-owl', 'Burrowing owl', ['grassland'], ['insect', 'rodent'], 0, 4, 3),
  bird('red-winged-blackbird', 'Red-winged blackbird', ['wetland', 'grassland'], ['seed', 'insect'], 0, 3, 4, { kind: 'allGainFood', food: 'seed' }),

  // Wetland-leaning
  bird('great-blue-heron', 'Great blue heron', ['wetland'], ['fish', 'fish'], 1, 6, 2),
  bird('mallard', 'Mallard', ['wetland', 'grassland'], ['seed'], 1, 3, 5, { kind: 'layEggSelf' }),
  bird('belted-kingfisher', 'Belted kingfisher', ['wetland'], ['fish'], 0, 3, 2, { kind: 'gainFood', food: 'fish' }),
  bird('osprey', 'Osprey', ['wetland'], ['fish', 'fish'], 0, 5, 2),
  bird('common-loon', 'Common loon', ['wetland'], ['fish', 'insect'], 0, 4, 2, { kind: 'drawCard' }),
  bird('american-white-pelican', 'American white pelican', ['wetland'], ['fish', 'fish', 'fish'], 0, 7, 1, { kind: 'allGainFood', food: 'fish' }),
  bird('sandhill-crane', 'Sandhill crane', ['wetland', 'grassland'], ['seed', 'fruit'], 1, 5, 2),
  bird('snowy-egret', 'Snowy egret', ['wetland'], ['fish', 'insect'], 0, 4, 3),
]

export const BIRDS_BY_ID: Record<string, BirdCard> = Object.fromEntries(BIRDS.map((b) => [b.id, b]))

/** Every bird twice. */
export const STARTING_DECK: string[] = BIRDS.flatMap((b) => [b.id, b.id])

