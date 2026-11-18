// The choices a human is collecting before dispatching one complete GameAction.
import { BIRDS_BY_ID } from './game/birds'
import { autoEggPayment, autoEggPlacements } from './game/bot'
import { eggCostForSlot, layCount, playableHabitats, slotKey, suggestPayment } from './game/engine'
import type { CardPick, EggPlacement, Food, GameAction, GameState, Habitat, SlotRef } from './game/types'

export type Draft =
  | { kind: 'idle' }
  | { kind: 'playBird'; cardId: string; habitat: Habitat | null; anyFoods: Food[]; eggs: EggPlacement[] }
  | { kind: 'gainFood'; foods: Food[] }
  | { kind: 'layEggs'; placements: EggPlacement[] }
  | { kind: 'drawCards'; picks: CardPick[] }

export const IDLE: Draft = { kind: 'idle' }

export function toAction(draft: Draft): GameAction | null {
  switch (draft.kind) {
    case 'idle':
      return null
    case 'playBird': {
      if (!draft.habitat) return null
      const card = BIRDS_BY_ID[draft.cardId]
      return {
        type: 'playBird',
        cardId: draft.cardId,
        habitat: draft.habitat,
        payment: [...card.cost.foods, ...draft.anyFoods],
        eggPayment: draft.eggs,
      }
    }
    case 'gainFood':
      return { type: 'gainFood', foods: draft.foods }
    case 'layEggs':
      return { type: 'layEggs', placements: draft.placements }
    case 'drawCards':
      return { type: 'drawCards', picks: draft.picks }
  }
}

/** Starts playing a card with auto-filled choices the player can then change. */
export function startPlayBird(state: GameState, cardId: string): Draft {
  const player = state.players[state.currentPlayer]
  const card = BIRDS_BY_ID[cardId]
  const payment = suggestPayment(player, card.cost) ?? card.cost.foods
  const habitats = playableHabitats(state, state.currentPlayer, cardId)
  const draft: Draft = { kind: 'playBird', cardId, habitat: null, anyFoods: payment.slice(card.cost.foods.length), eggs: [] }
  return habitats.length === 1 ? chooseHabitat(state, draft, habitats[0]) : draft
}

export function chooseHabitat(state: GameState, draft: Extract<Draft, { kind: 'playBird' }>, habitat: Habitat): Draft {
  const player = state.players[state.currentPlayer]
  const eggs = autoEggPayment(player, eggCostForSlot(player.board[habitat].length))
  return { ...draft, habitat, eggs }
}

export function startLayEggs(state: GameState): Draft {
  const player = state.players[state.currentPlayer]
  return { kind: 'layEggs', placements: autoEggPlacements(player, layCount(player)) }
}

export function eggDelta(placements: readonly EggPlacement[], slot: SlotRef): number {
  return placements.filter((p) => slotKey(p.slot) === slotKey(slot)).reduce((s, p) => s + p.count, 0)
}

export function addEgg(placements: readonly EggPlacement[], slot: SlotRef): EggPlacement[] {
  const key = slotKey(slot)
  return placements.some((p) => slotKey(p.slot) === key)
    ? placements.map((p) => (slotKey(p.slot) === key ? { ...p, count: p.count + 1 } : p))
    : [...placements, { slot, count: 1 }]
}

export function totalCount(placements: readonly EggPlacement[]): number {
  return placements.reduce((s, p) => s + p.count, 0)
}
