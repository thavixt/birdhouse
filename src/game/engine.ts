import { BIRDS_BY_ID } from './birds'
import { GOALS_BY_ID, roundGoalAwards } from './goals'
import { activateHabitat } from './powers'
import { TRAY_SIZE } from './setup'
import {
  FOODS,
  HABITATS,
  type Board,
  type CardPick,
  type EggPlacement,
  type Food,
  type FoodCost,
  type GameAction,
  type GameState,
  type Habitat,
  type PlacedBird,
  type Player,
  type Round,
  type SlotRef,
} from './types'

export const ROW_SIZE = 5
const EGG_COSTS = [0, 0, 1, 1, 2]
const TURNS_PER_ROUND = [8, 7, 6, 5]

/** Which habitat each non-play action belongs to. */
export const ACTION_HABITAT = {
  gainFood: 'forest',
  layEggs: 'grassland',
  drawCards: 'wetland',
} as const satisfies Record<string, Habitat>

// ---------------------------------------------------------------- helpers

export function eggCostForSlot(index: number): number {
  return EGG_COSTS[index] ?? Infinity
}

export function turnsPerRound(round: number): number {
  return TURNS_PER_ROUND[round - 1]
}

export function actionCount(board: Board, habitat: Habitat): number {
  const base = habitat === 'grassland' ? 2 : 1
  return base + Math.floor(board[habitat].length / 2)
}

export function countFoods(foods: readonly Food[]): Record<Food, number> {
  const out = Object.fromEntries(FOODS.map((f) => [f, 0])) as Record<Food, number>
  for (const f of foods) out[f]++
  return out
}

export function totalFood(player: Player): number {
  return FOODS.reduce((sum, f) => sum + player.food[f], 0)
}

/** True if `payment` exactly covers `cost` and the player owns it. */
export function canAfford(player: Player, cost: FoodCost, payment: readonly Food[]): boolean {
  if (payment.length !== cost.foods.length + cost.anyCount) return false
  const pay = countFoods(payment)
  const need = countFoods(cost.foods)
  return FOODS.every((f) => pay[f] >= need[f] && pay[f] <= player.food[f])
}

/** True if the player owns enough food to pay `cost` in some way. */
export function canPayCost(player: Player, cost: FoodCost): boolean {
  const need = countFoods(cost.foods)
  if (!FOODS.every((f) => player.food[f] >= need[f])) return false
  return totalFood(player) - cost.foods.length >= cost.anyCount
}

/** A valid payment: listed foods, then "any" paid from the player's most plentiful food. */
export function suggestPayment(player: Player, cost: FoodCost): Food[] | null {
  if (!canPayCost(player, cost)) return null
  const left = { ...player.food }
  for (const f of cost.foods) left[f]--
  const payment = [...cost.foods]
  for (let k = 0; k < cost.anyCount; k++) {
    const f = FOODS.reduce((best, x) => (left[x] > left[best] ? x : best), FOODS[0])
    left[f]--
    payment.push(f)
  }
  return payment
}

export function allSlots(board: Board): { slot: SlotRef; bird: PlacedBird }[] {
  return HABITATS.flatMap((habitat) => board[habitat].map((bird, index) => ({ slot: { habitat, index }, bird })))
}

export function eggCapacity(player: Player): number {
  return allSlots(player.board).reduce((sum, { bird }) => sum + BIRDS_BY_ID[bird.cardId].eggLimit - bird.eggs, 0)
}

export function totalEggs(player: Player): number {
  return allSlots(player.board).reduce((sum, { bird }) => sum + bird.eggs, 0)
}

/** Habitats where the bird is allowed, the row has room and the egg cost is payable. */
export function playableHabitats(state: GameState, playerIdx: number, cardId: string): Habitat[] {
  const card = BIRDS_BY_ID[cardId]
  const player = state.players[playerIdx]
  if (!card) return []
  return card.habitats.filter((h) => {
    const len = player.board[h].length
    return len < ROW_SIZE && totalEggs(player) >= eggCostForSlot(len)
  })
}

export function trayCount(state: GameState): number {
  return state.tray.filter((c) => c !== null).length
}

/** Number of cards the current player must take with the draw action. */
export function drawCount(state: GameState, playerIdx: number): number {
  return Math.min(actionCount(state.players[playerIdx].board, 'wetland'), trayCount(state) + state.deck.length)
}

/** Number of eggs the player must lay with the lay-eggs action. */
export function layCount(player: Player): number {
  return Math.min(actionCount(player.board, 'grassland'), eggCapacity(player))
}

export function slotKey(slot: SlotRef): string {
  return `${slot.habitat}:${slot.index}`
}

// ------------------------------------------------------------- validation

/** Sums placements per slot; returns an error string for bad input. */
function groupPlacements(board: Board, placements: readonly EggPlacement[]): Map<string, { bird: PlacedBird; count: number }> | string {
  const out = new Map<string, { bird: PlacedBird; count: number }>()
  for (const { slot, count } of placements) {
    const bird = HABITATS.includes(slot.habitat) ? board[slot.habitat][slot.index] : undefined
    if (!bird) return 'There is no bird in that slot.'
    if (!Number.isInteger(count) || count <= 0) return 'Egg counts must be positive whole numbers.'
    const key = slotKey(slot)
    const prev = out.get(key)
    out.set(key, { bird, count: (prev?.count ?? 0) + count })
  }
  return out
}

function validateEggRemoval(player: Player, placements: readonly EggPlacement[], needed: number): string | null {
  const groups = groupPlacements(player.board, placements)
  if (typeof groups === 'string') return groups
  let total = 0
  for (const { bird, count } of groups.values()) {
    if (count > bird.eggs) return 'Cannot remove more eggs than a bird has.'
    total += count
  }
  if (total !== needed) return `This slot costs ${needed} egg${needed === 1 ? '' : 's'}.`
  return null
}

export function validateAction(state: GameState, action: GameAction): string | null {
  if (state.phase === 'gameOver') return 'The game is over.'
  const player = state.players[state.currentPlayer]

  switch (action.type) {
    case 'playBird': {
      if (!player.hand.includes(action.cardId)) return 'That card is not in your hand.'
      const card = BIRDS_BY_ID[action.cardId]
      if (!card) return 'Unknown card.'
      if (!card.habitats.includes(action.habitat)) return `${card.name} cannot live in the ${action.habitat}.`
      const row = player.board[action.habitat]
      if (row.length >= ROW_SIZE) return `Your ${action.habitat} is full.`
      if (!action.payment.every((f) => FOODS.includes(f))) return 'Unknown food type.'
      if (!canAfford(player, card.cost, action.payment)) {
        return action.payment.length === card.cost.foods.length + card.cost.anyCount &&
          FOODS.every((f) => countFoods(action.payment)[f] >= countFoods(card.cost.foods)[f])
          ? 'You do not have that food.'
          : 'Payment does not match the cost.'
      }
      return validateEggRemoval(player, action.eggPayment, eggCostForSlot(row.length))
    }

    case 'gainFood': {
      const n = actionCount(player.board, 'forest')
      if (action.foods.length !== n) return `Choose exactly ${n} food.`
      if (!action.foods.every((f) => FOODS.includes(f))) return 'Unknown food type.'
      return null
    }

    case 'layEggs': {
      const groups = groupPlacements(player.board, action.placements)
      if (typeof groups === 'string') return groups
      let total = 0
      for (const { bird, count } of groups.values()) {
        if (bird.eggs + count > BIRDS_BY_ID[bird.cardId].eggLimit) return 'That bird cannot hold that many eggs.'
        total += count
      }
      const n = layCount(player)
      if (total !== n) return `Lay exactly ${n} egg${n === 1 ? '' : 's'}.`
      return null
    }

    case 'drawCards': {
      const n = drawCount(state, state.currentPlayer)
      if (action.picks.length !== n) return `Draw exactly ${n} card${n === 1 ? '' : 's'}.`
      const trayIdx = action.picks.flatMap((p) => (p.from === 'tray' ? [p.index] : []))
      if (new Set(trayIdx).size !== trayIdx.length) return 'Each tray card can only be taken once.'
      if (trayIdx.some((i) => state.tray[i] == null)) return 'That tray slot is empty.'
      if (action.picks.length - trayIdx.length > state.deck.length) return 'Not enough cards in the deck.'
      return null
    }
  }
}

// ---------------------------------------------------------------- reducer

/** Pure reducer. Invalid actions return the state unchanged. */
export function reduce(state: GameState, action: GameAction): GameState {
  if (validateAction(state, action) !== null) return state
  // Work on a private deep copy; the input state is never touched.
  const draft = structuredClone(state) as GameState
  const idx = draft.currentPlayer
  const player = draft.players[idx]

  switch (action.type) {
    case 'playBird': {
      const card = BIRDS_BY_ID[action.cardId]
      player.hand.splice(player.hand.indexOf(action.cardId), 1)
      for (const f of action.payment) player.food[f]--
      applyEggs(player, action.eggPayment, -1)
      player.board[action.habitat].push({ cardId: action.cardId, eggs: 0 })
      draft.log.push(`${player.name} played ${card.name} in the ${action.habitat}.`)
      break
    }
    case 'gainFood':
      for (const f of action.foods) player.food[f]++
      draft.log.push(`${player.name} gained ${describeFoods(action.foods)}.`)
      activateHabitat(draft, idx, 'forest')
      break
    case 'layEggs': {
      applyEggs(player, action.placements, 1)
      const n = action.placements.reduce((s, p) => s + p.count, 0)
      draft.log.push(`${player.name} laid ${n} egg${n === 1 ? '' : 's'}.`)
      activateHabitat(draft, idx, 'grassland')
      break
    }
    case 'drawCards':
      drawCards(draft, player, action.picks)
      draft.log.push(`${player.name} drew ${action.picks.length} card${action.picks.length === 1 ? '' : 's'}.`)
      activateHabitat(draft, idx, 'wetland')
      break
  }

  endTurn(draft)
  return draft
}

function applyEggs(player: Player, placements: readonly EggPlacement[], sign: 1 | -1): void {
  for (const { slot, count } of placements) player.board[slot.habitat][slot.index].eggs += sign * count
}

function drawCards(draft: GameState, player: Player, picks: readonly CardPick[]): void {
  for (const pick of picks) {
    if (pick.from === 'tray') {
      player.hand.push(draft.tray[pick.index]!)
      draft.tray[pick.index] = null
    } else {
      player.hand.push(draft.deck.shift()!)
    }
  }
}

function describeFoods(foods: readonly Food[]): string {
  if (foods.length === 0) return 'nothing'
  const counts = countFoods(foods)
  return FOODS.filter((f) => counts[f] > 0)
    .map((f) => `${counts[f]} ${f}`)
    .join(', ')
}

function refillTray(draft: GameState): void {
  for (let i = 0; i < TRAY_SIZE; i++) {
    if (draft.tray[i] == null) draft.tray[i] = draft.deck.shift() ?? null
  }
}

function endTurn(draft: GameState): void {
  refillTray(draft)
  draft.turnsLeft[draft.currentPlayer]--
  const n = draft.players.length
  for (let k = 1; k <= n; k++) {
    const next = (draft.currentPlayer + k) % n
    if (draft.turnsLeft[next] > 0) {
      draft.currentPlayer = next
      return
    }
  }
  endRound(draft)
}

function endRound(draft: GameState): void {
  const goalId = draft.goals[draft.round - 1]
  const awards = roundGoalAwards(draft.players, goalId, draft.round)
  draft.players.forEach((p, i) => (p.goalPoints += awards[i]))
  const winners = draft.players.flatMap((p, i) => (awards[i] > 0 ? [`${p.name} +${awards[i]}`] : []))
  draft.log.push(
    `End of round ${draft.round}. Goal "${GOALS_BY_ID[goalId].name}": ${winners.length ? winners.join(', ') : 'no points'}.`,
  )

  if (draft.round === 4) {
    draft.phase = 'gameOver'
    draft.log.push('Game over!')
    return
  }
  draft.round = (draft.round + 1) as Round
  draft.tray = draft.tray.map(() => null)
  refillTray(draft)
  draft.turnsLeft = draft.players.map(() => turnsPerRound(draft.round))
  draft.firstPlayer = (draft.firstPlayer + 1) % draft.players.length
  draft.currentPlayer = draft.firstPlayer
  draft.log.push(`Round ${draft.round} begins.`)
}
