import { BIRDS_BY_ID } from './birds'
import { discardCards, drawableCount, takeFromDeck } from './deck'
import { roundGoalAwards } from './goals'
import { describeMessage, gameLog, logOnce } from './logger'
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
  type GameMessage,
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
  // Deck picks can also come from the discard pile, which is reshuffled when the deck runs out.
  return Math.min(actionCount(state.players[playerIdx].board, 'wetland'), trayCount(state) + drawableCount(state))
}

/** Number of eggs the player must lay with the lay-eggs action. */
export function layCount(player: Player): number {
  return Math.min(actionCount(player.board, 'grassland'), eggCapacity(player))
}

export function slotKey(slot: SlotRef): string {
  return `${slot.habitat}:${slot.index}`
}

// ------------------------------------------------------------- validation

const err = (key: string, params?: GameMessage['params']): GameMessage => ({ key: `error.${key}`, params })

/** Sums placements per slot; returns an error message for bad input. */
function groupPlacements(
  board: Board,
  placements: readonly EggPlacement[],
): Map<string, { bird: PlacedBird; count: number }> | GameMessage {
  const out = new Map<string, { bird: PlacedBird; count: number }>()
  for (const { slot, count } of placements) {
    const bird = HABITATS.includes(slot.habitat) ? board[slot.habitat][slot.index] : undefined
    if (!bird) return err('noBirdInSlot')
    if (!Number.isInteger(count) || count <= 0) return err('badEggCount')
    const key = slotKey(slot)
    const prev = out.get(key)
    out.set(key, { bird, count: (prev?.count ?? 0) + count })
  }
  return out
}

function validateEggRemoval(player: Player, placements: readonly EggPlacement[], needed: number): GameMessage | null {
  const groups = groupPlacements(player.board, placements)
  if (!(groups instanceof Map)) return groups
  let total = 0
  for (const { bird, count } of groups.values()) {
    if (count > bird.eggs) return err('tooManyEggsRemoved')
    total += count
  }
  if (total !== needed) return err('eggCost', { count: needed })
  return null
}

/** `null` if the action is legal, otherwise a translatable reason (`error.*`). */
export function validateAction(state: GameState, action: GameAction): GameMessage | null {
  if (state.phase === 'gameOver') return err('gameOver')
  const player = state.players[state.currentPlayer]

  switch (action.type) {
    case 'playBird': {
      if (!player.hand.includes(action.cardId)) return err('cardNotInHand')
      const card = BIRDS_BY_ID[action.cardId]
      if (!card) return err('unknownCard')
      if (!card.habitats.includes(action.habitat)) return err('wrongHabitat', { card: card.id, habitat: action.habitat })
      const row = player.board[action.habitat]
      if (row.length >= ROW_SIZE) return err('rowFull', { habitat: action.habitat })
      if (!action.payment.every((f) => FOODS.includes(f))) return err('unknownFood')
      if (!canAfford(player, card.cost, action.payment)) {
        return action.payment.length === card.cost.foods.length + card.cost.anyCount &&
          FOODS.every((f) => countFoods(action.payment)[f] >= countFoods(card.cost.foods)[f])
          ? err('foodNotOwned')
          : err('paymentMismatch')
      }
      return validateEggRemoval(player, action.eggPayment, eggCostForSlot(row.length))
    }

    case 'gainFood': {
      const n = actionCount(player.board, 'forest')
      if (action.foods.length !== n) return err('gainFoodCount', { count: n })
      if (!action.foods.every((f) => FOODS.includes(f))) return err('unknownFood')
      return null
    }

    case 'layEggs': {
      const groups = groupPlacements(player.board, action.placements)
      if (!(groups instanceof Map)) return groups
      let total = 0
      for (const { bird, count } of groups.values()) {
        if (bird.eggs + count > BIRDS_BY_ID[bird.cardId].eggLimit) return err('eggLimit')
        total += count
      }
      const n = layCount(player)
      if (total !== n) return err('layCount', { count: n })
      return null
    }

    case 'drawCards': {
      const n = drawCount(state, state.currentPlayer)
      if (action.picks.length !== n) return err('drawCount', { count: n })
      const trayIdx = action.picks.flatMap((p) => (p.from === 'tray' ? [p.index] : []))
      if (new Set(trayIdx).size !== trayIdx.length) return err('trayTwice')
      if (trayIdx.some((i) => state.tray[i] == null)) return err('trayEmpty')
      if (action.picks.length - trayIdx.length > drawableCount(state)) return err('deckShort')
      return null
    }
  }
}

// ---------------------------------------------------------------- reducer

/** Pure reducer. Invalid actions return the state unchanged. */
export function reduce(state: GameState, action: GameAction): GameState {
  const error = validateAction(state, action)
  if (error !== null) {
    logOnce(action, () => logRejected(state, action, error))
    return state
  }
  // Work on a private deep copy; the input state is never touched.
  const draft = structuredClone(state) as GameState
  const idx = draft.currentPlayer
  const player = draft.players[idx]

  switch (action.type) {
    case 'playBird': {
      player.hand.splice(player.hand.indexOf(action.cardId), 1)
      for (const f of action.payment) player.food[f]--
      applyEggs(player, action.eggPayment, -1)
      player.board[action.habitat].push({ cardId: action.cardId, eggs: 0 })
      draft.log.push({ key: 'log.playedBird', params: { player: player.name, card: action.cardId, habitat: action.habitat } })
      break
    }
    case 'gainFood':
      for (const f of action.foods) player.food[f]++
      draft.log.push({ key: 'log.gainedFood', params: { player: player.name, foods: action.foods } })
      activateHabitat(draft, idx, 'forest')
      break
    case 'layEggs': {
      applyEggs(player, action.placements, 1)
      const count = action.placements.reduce((s, p) => s + p.count, 0)
      draft.log.push({ key: 'log.laidEggs', params: { player: player.name, count } })
      activateHabitat(draft, idx, 'grassland')
      break
    }
    case 'drawCards':
      drawCards(draft, player, action.picks)
      draft.log.push({ key: 'log.drewCards', params: { player: player.name, count: action.picks.length } })
      activateHabitat(draft, idx, 'wetland')
      break
  }

  endTurn(draft)
  logOnce(action, () => logTransition(state, action, draft))
  return draft
}

// ---------------------------------------------------------------- logging
// Developer-facing debug output (see src/game/logger.ts). Never affects state.

function describeAction(action: GameAction): string {
  switch (action.type) {
    case 'playBird': {
      const eggs = action.eggPayment.reduce((s, p) => s + p.count, 0)
      return `played ${action.cardId} → ${action.habitat} (paid ${action.payment.join(', ') || 'nothing'}${eggs ? ` + ${eggs} egg${eggs === 1 ? '' : 's'}` : ''})`
    }
    case 'gainFood':
      return `gain food: ${action.foods.join(', ')}`
    case 'layEggs': {
      const n = action.placements.reduce((s, p) => s + p.count, 0)
      return `lay ${n} egg${n === 1 ? '' : 's'}: ${action.placements.map((p) => `${slotKey(p.slot)}×${p.count}`).join(', ') || 'none'}`
    }
    case 'drawCards':
      return `draw: ${action.picks.map((p) => (p.from === 'tray' ? `tray#${p.index + 1}` : 'deck')).join(', ') || 'none'}`
  }
}

function who(state: GameState): string {
  const p = state.players[state.currentPlayer]
  return `${p.name} (${p.kind})`
}

function logRejected(state: GameState, action: GameAction, error: GameMessage): void {
  gameLog('warn', `Rejected ${action.type} from ${who(state)}: ${describeMessage(error)}`, { action, state })
}

function logTransition(before: GameState, action: GameAction, after: GameState): void {
  const turn = turnsPerRound(before.round) - before.turnsLeft[before.currentPlayer] + 1
  gameLog('info', `R${before.round} T${turn} · ${who(before)} · ${describeAction(action)}`, {
    action,
    // Everything this action caused, including powers and round scoring.
    events: after.log.slice(before.log.length).map(describeMessage),
    state: after,
  })
  if (after.phase === 'gameOver') {
    gameLog('info', 'Game over', {
      goalPoints: Object.fromEntries(after.players.map((p) => [p.name, p.goalPoints])),
      state: after,
    })
  } else if (after.round !== before.round) {
    gameLog('info', `Round ${after.round} begins · ${who(after)} goes first · goal: ${after.goals[after.round - 1]}`)
  }
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
      player.hand.push(takeFromDeck(draft)!) // validated: enough cards in deck + discard
    }
  }
}

function refillTray(draft: GameState): void {
  for (let i = 0; i < TRAY_SIZE; i++) {
    if (draft.tray[i] == null) draft.tray[i] = takeFromDeck(draft)
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
    winners.length
      ? { key: 'log.roundEnd', params: { round: draft.round, goal: goalId, awards: winners } }
      : { key: 'log.roundEndNoPoints', params: { round: draft.round, goal: goalId } },
  )

  if (draft.round === 4) {
    draft.phase = 'gameOver'
    draft.log.push({ key: 'log.gameOver' })
    return
  }
  draft.round = (draft.round + 1) as Round
  discardCards(draft, draft.tray) // leftover tray cards go to the discard pile
  draft.tray = draft.tray.map(() => null)
  refillTray(draft)
  draft.turnsLeft = draft.players.map(() => turnsPerRound(draft.round))
  draft.firstPlayer = (draft.firstPlayer + 1) % draft.players.length
  draft.currentPlayer = draft.firstPlayer
  draft.log.push({ key: 'log.roundBegins', params: { round: draft.round } })
}
