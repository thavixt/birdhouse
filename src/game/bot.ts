import { BIRDS_BY_ID } from './birds'
import { drawableCount } from './deck'
import {
  actionCount,
  allSlots,
  canPayCost,
  countFoods,
  drawCount,
  eggCapacity,
  eggCostForSlot,
  layCount,
  playableHabitats,
  ROW_SIZE,
  slotKey,
  suggestPayment,
  totalEggs,
} from './engine'
import { FOODS, type BirdCard, type CardPick, type EggPlacement, type Food, type GameAction, type GameState, type Habitat, type Player, type SlotRef } from './types'

// ------------------------------------------------- reusable auto-choices

function addPlacement(out: EggPlacement[], slot: SlotRef): void {
  const existing = out.find((p) => slotKey(p.slot) === slotKey(slot))
  if (existing) existing.count++
  else out.push({ slot, count: 1 })
}

/** Removes `count` eggs, always from the bird holding the most. */
export function autoEggPayment(player: Player, count: number): EggPlacement[] {
  const eggs = new Map(allSlots(player.board).map(({ slot, bird }) => [slotKey(slot), { slot, left: bird.eggs }]))
  const out: EggPlacement[] = []
  for (let k = 0; k < count; k++) {
    const best = [...eggs.values()].reduce<{ slot: SlotRef; left: number } | null>((b, x) => (x.left > (b?.left ?? 0) ? x : b), null)
    if (!best) break
    best.left--
    addPlacement(out, best.slot)
  }
  return out
}

/** Lays `count` eggs, always on the bird with the most free space. */
export function autoEggPlacements(player: Player, count: number): EggPlacement[] {
  const room = new Map(
    allSlots(player.board).map(({ slot, bird }) => [slotKey(slot), { slot, left: BIRDS_BY_ID[bird.cardId].eggLimit - bird.eggs }]),
  )
  const out: EggPlacement[] = []
  for (let k = 0; k < count; k++) {
    const best = [...room.values()].reduce<{ slot: SlotRef; left: number } | null>((b, x) => (x.left > (b?.left ?? 0) ? x : b), null)
    if (!best) break
    best.left--
    addPlacement(out, best.slot)
  }
  return out
}

/** A complete playBird action using auto payment, or null if impossible. */
export function autoPlayBird(state: GameState, playerIdx: number, cardId: string, habitat: Habitat): GameAction | null {
  const player = state.players[playerIdx]
  const payment = suggestPayment(player, BIRDS_BY_ID[cardId].cost)
  if (!payment || !playableHabitats(state, playerIdx, cardId).includes(habitat)) return null
  const eggPayment = autoEggPayment(player, eggCostForSlot(player.board[habitat].length))
  return { type: 'playBird', cardId, habitat, payment, eggPayment }
}

// ------------------------------------------------------------- heuristic

function birdValue(card: BirdCard): number {
  return card.points + (card.power ? 0.5 : 0)
}

/** Foods the player still lacks to pay for `card`. */
function missingFoods(player: Player, card: BirdCard): Food[] {
  const need = countFoods(card.cost.foods)
  const missing: Food[] = []
  for (const f of FOODS) for (let k = player.food[f]; k < need[f]; k++) missing.push(f)
  const spare = FOODS.reduce((s, f) => s + Math.max(0, player.food[f] - need[f]), 0)
  for (let k = spare; k < card.cost.anyCount; k++) missing.push('seed')
  return missing
}

/** Greedy bot. Always returns a legal action for the current player. */
export function chooseAction(state: GameState, playerIdx: number): GameAction {
  const player = state.players[playerIdx]
  const turnsLeft = state.turnsLeft[playerIdx]
  const hand = [...new Set(player.hand)].map((id) => BIRDS_BY_ID[id])

  // 1. Best affordable bird, placed in its shortest available row.
  let bestPlay: { action: GameAction; value: number } | null = null
  for (const card of hand) {
    if (!canPayCost(player, card.cost)) continue
    const habitats = playableHabitats(state, playerIdx, card.id)
    if (habitats.length === 0) continue
    const habitat = habitats.reduce((a, b) => (player.board[b].length < player.board[a].length ? b : a))
    const action = autoPlayBird(state, playerIdx, card.id, habitat)
    const value = birdValue(card)
    if (action && (!bestPlay || value > bestPlay.value)) bestPlay = { action, value }
  }

  // Late game: eggs are points too. Lay if that beats the best bird.
  const eggsNow = layCount(player)
  const lastRound = state.round === 4
  if (lastRound && eggsNow > 0 && eggsNow >= (bestPlay?.value ?? 0)) return layEggs(player)
  if (bestPlay) return bestPlay.action

  // 2. Work towards the most valuable bird that has room on the board.
  const target = hand
    .filter((c) => c.habitats.some((h) => player.board[h].length < ROW_SIZE))
    .sort((a, b) => birdValue(b) - birdValue(a))[0]

  if (lastRound && turnsLeft <= 2 && eggsNow > 0) return layEggs(player)
  if (!target || player.hand.length <= 1) return drawOrGainFood(state, playerIdx)

  const missing = missingFoods(player, target)
  if (missing.length > 0) return gainFood(player, missing)

  const minEggCost = Math.min(...target.habitats.map((h) => eggCostForSlot(player.board[h].length)))
  if (totalEggs(player) < minEggCost && eggCapacity(player) > 0) return layEggs(player)

  return drawOrGainFood(state, playerIdx)
}

function gainFood(player: Player, wanted: Food[]): GameAction {
  const n = actionCount(player.board, 'forest')
  const foods = wanted.slice(0, n)
  // Fill the rest with whatever the hand wants most.
  const demand = countFoods(player.hand.flatMap((id) => BIRDS_BY_ID[id].cost.foods))
  const favourite = FOODS.reduce((best, f) => (demand[f] > demand[best] ? f : best), FOODS[0])
  while (foods.length < n) foods.push(favourite)
  return { type: 'gainFood', foods }
}

function layEggs(player: Player): GameAction {
  return { type: 'layEggs', placements: autoEggPlacements(player, layCount(player)) }
}

/** Draws cards, or gains food when there is nothing left to draw (no wasted turn). */
function drawOrGainFood(state: GameState, playerIdx: number): GameAction {
  return drawCount(state, playerIdx) > 0 ? drawCards(state, playerIdx) : gainFood(state.players[playerIdx], [])
}

function drawCards(state: GameState, playerIdx: number): GameAction {
  const n = drawCount(state, playerIdx)
  const trayByValue = state.tray
    .flatMap((id, index) => (id ? [{ index, value: birdValue(BIRDS_BY_ID[id]) }] : []))
    .sort((a, b) => b.value - a.value)
  const picks: CardPick[] = []
  for (const t of trayByValue) {
    if (picks.length >= n) break
    if (t.value >= 4) picks.push({ from: 'tray', index: t.index })
  }
  let deckLeft = drawableCount(state)
  while (picks.length < n && deckLeft > 0) {
    picks.push({ from: 'deck' })
    deckLeft--
  }
  // Deck ran out: take remaining tray cards.
  for (const t of trayByValue) {
    if (picks.length >= n) break
    if (!picks.some((p) => p.from === 'tray' && p.index === t.index)) picks.push({ from: 'tray', index: t.index })
  }
  return { type: 'drawCards', picks }
}
