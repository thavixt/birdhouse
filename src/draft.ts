// The choices a human is collecting before dispatching one complete GameAction.
import { BIRDS_BY_ID } from './game/birds'
import { autoEggPayment, autoEggPlacements } from './game/bot'
import { canPayCost, drawCount, eggCostForSlot, layCount, playableHabitats, slotKey, suggestPayment } from './game/engine'
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

// ------------------------------------------------- board / tray interactions
// What a click does to the draft. Each returns the draft unchanged when the click
// doesn't apply (wrong draft kind, nothing left to choose, no room, ...).

/** Starts the habitat's non-play action: gain food, lay eggs or draw cards. */
export function startHabitatAction(state: GameState, habitat: Habitat): Draft {
  if (habitat === 'forest') return { kind: 'gainFood', foods: [] }
  if (habitat === 'grassland') return startLayEggs(state)
  return { kind: 'drawCards', picks: [] }
}

/** Clicking one of the current player's birds: lay an egg on it, or pay an egg from it. */
export function clickBird(state: GameState, draft: Draft, slot: SlotRef): Draft {
  const player = state.players[state.currentPlayer]
  const bird = player.board[slot.habitat][slot.index]
  if (!bird) return draft
  if (draft.kind === 'layEggs') {
    const room = BIRDS_BY_ID[bird.cardId].eggLimit - bird.eggs - eggDelta(draft.placements, slot)
    if (room > 0 && totalCount(draft.placements) < layCount(player)) {
      return { ...draft, placements: addEgg(draft.placements, slot) }
    }
  } else if (draft.kind === 'playBird' && draft.habitat) {
    const needed = eggCostForSlot(player.board[draft.habitat].length)
    if (bird.eggs - eggDelta(draft.eggs, slot) > 0 && totalCount(draft.eggs) < needed) {
      return { ...draft, eggs: addEgg(draft.eggs, slot) }
    }
  }
  return draft
}

/** How the draft changes a bird's egg count on the board: + when laying, − when paying. */
export function boardEggDelta(draft: Draft, slot: SlotRef): number {
  if (draft.kind === 'layEggs') return eggDelta(draft.placements, slot)
  if (draft.kind === 'playBird') return -eggDelta(draft.eggs, slot)
  return 0
}

/** Tray indices picked so far. */
export function pickedTray(draft: Draft): number[] {
  return draft.kind === 'drawCards' ? draft.picks.flatMap((p) => (p.from === 'tray' ? [p.index] : [])) : []
}

/** Number of deck draws picked so far. */
export function pickedDeck(draft: Draft): number {
  return draft.kind === 'drawCards' ? draft.picks.filter((p) => p.from === 'deck').length : 0
}

/** Cards still to pick for the draw action. */
export function drawsLeft(state: GameState, draft: Draft): number {
  return draft.kind === 'drawCards' ? drawCount(state, state.currentPlayer) - draft.picks.length : 0
}

/** Toggles a tray card: unpicks it if picked, otherwise picks it while picks remain. */
export function pickTray(state: GameState, draft: Draft, index: number): Draft {
  if (draft.kind !== 'drawCards') return draft
  if (pickedTray(draft).includes(index)) {
    return { ...draft, picks: draft.picks.filter((p) => !(p.from === 'tray' && p.index === index)) }
  }
  if (state.tray[index] == null || drawsLeft(state, draft) <= 0) return draft
  return { ...draft, picks: [...draft.picks, { from: 'tray', index }] }
}

/** Adds one blind draw from the deck while picks remain and the deck has cards. */
export function pickDeck(state: GameState, draft: Draft): Draft {
  if (draft.kind !== 'drawCards' || drawsLeft(state, draft) <= 0 || pickedDeck(draft) >= state.deck.length) return draft
  return { ...draft, picks: [...draft.picks, { from: 'deck' }] }
}

// ------------------------------------------------------------- view helpers

/** Whose board and hand are shown up top: the acting human, or the first human while bots play. */
export function viewedPlayer(state: GameState): number {
  const current = state.players[state.currentPlayer]
  if (current.kind === 'human' && state.phase === 'playing') return state.currentPlayer
  return Math.max(0, state.players.findIndex((p) => p.kind === 'human'))
}

/** True if the current player can afford the card and has a habitat to put it in. */
export function canPlayCard(state: GameState, cardId: string): boolean {
  const player = state.players[state.currentPlayer]
  return canPayCost(player, BIRDS_BY_ID[cardId].cost) && playableHabitats(state, state.currentPlayer, cardId).length > 0
}
