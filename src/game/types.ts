export const FOODS = ['seed', 'insect', 'fish', 'fruit', 'rodent'] as const
export type Food = (typeof FOODS)[number]

export const HABITATS = ['forest', 'grassland', 'wetland'] as const
export type Habitat = (typeof HABITATS)[number]

/** Listed foods must be paid exactly; `anyCount` more can be any food. */
export type FoodCost = { foods: Food[]; anyCount: number }

/** "When activated" powers: resolved right-to-left after a habitat action. */
export type Power =
  | { kind: 'gainFood'; food: Food }
  | { kind: 'layEggSelf' }
  | { kind: 'layEggAny' }
  | { kind: 'drawCard' }
  | { kind: 'allGainFood'; food: Food }

export type BirdCard = {
  id: string
  name: string
  habitats: Habitat[]
  cost: FoodCost
  points: number
  eggLimit: number
  power?: Power
}

export type PlacedBird = { cardId: string; eggs: number }
export type Board = Record<Habitat, PlacedBird[]> // 0..5 birds, left to right
export type SlotRef = { habitat: Habitat; index: number }
export type EggPlacement = { slot: SlotRef; count: number }

export type PlayerKind = 'human' | 'bot'
export type PlayerConfig = { name: string; kind: PlayerKind }

export type Player = {
  id: string
  name: string
  kind: PlayerKind
  hand: string[] // card ids
  food: Record<Food, number>
  board: Board
  goalPoints: number
}

export type Round = 1 | 2 | 3 | 4

/**
 * A translatable message: `key` is a path in `src/i18n/en-us.json`.
 * The UI translates params by name: `card`/`target` are bird ids, `habitat` a Habitat,
 * `food` a Food, `foods` a Food[], `goal` a goal id; anything else is shown as-is.
 */
export type MessageParams = Record<string, string | number | string[]>
export type GameMessage = { key: string; params?: MessageParams }

export type GameState = {
  players: Player[]
  currentPlayer: number // index into players
  firstPlayer: number // rotates each round
  round: Round
  turnsLeft: number[] // per player, this round
  deck: string[]
  discard: string[] // removed tray cards; shuffled into a new deck when the deck runs out
  tray: (string | null)[] // always length 3
  goals: string[] // one goal id per round
  rngState: number
  phase: 'playing' | 'gameOver'
  log: GameMessage[] // translatable event log
}

export type CardPick = { from: 'tray'; index: number } | { from: 'deck' }

export type GameAction =
  | {
      type: 'playBird'
      cardId: string
      habitat: Habitat
      payment: Food[]
      eggPayment: EggPlacement[]
    }
  | { type: 'gainFood'; foods: Food[] }
  | { type: 'layEggs'; placements: EggPlacement[] }
  | { type: 'drawCards'; picks: CardPick[] }
