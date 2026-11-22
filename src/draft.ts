// The choices a human is collecting before dispatching one complete GameAction.
import { BIRDS_BY_ID } from './game/birds'
import { drawableCount } from './game/deck'
import { autoEggPayment, autoEggPlacements, autoPlayBird } from './game/bot'
import {
  canPayCost,
  drawCount,
  eggCostForSlot,
  layCount,
  playableHabitats,
  slotKey,
  suggestPayment,
  turnsPerRound,
  validateAction,
} from './game/engine'
import { HABITATS, type CardPick, type EggPlacement, type Food, type GameAction, type GameState, type Habitat, type SlotRef } from './game/types'

export type Draft =
  | { kind: 'idle' }
  | {
      kind: 'playBird'
      cardId: string
      /**
       * UI only: which hand position was dropped, so with two copies of a bird in hand only
       * that one is highlighted. Not part of the action (both copies play the same).
       */
      handIndex?: number
      /** Where it was dropped. */
      habitat: Habitat
      anyFoods: Food[]
      eggs: EggPlacement[]
    }
  | { kind: 'gainFood'; foods: Food[] }
  | { kind: 'layEggs'; placements: EggPlacement[] }
  | { kind: 'drawCards'; picks: CardPick[] }

export const IDLE: Draft = { kind: 'idle' }

export function toAction(draft: Draft): GameAction | null {
  switch (draft.kind) {
    case 'idle':
      return null
    case 'playBird': {
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

/**
 * Playing a bird dropped on `habitat`, with the automatic payment pre-filled (the same one a
 * drop commits when there is nothing to choose); the action panel lets the player change it.
 */
export function startPlayBird(state: GameState, cardId: string, habitat: Habitat, handIndex?: number): Draft {
  const player = state.players[state.currentPlayer]
  const card = BIRDS_BY_ID[cardId]
  const payment = suggestPayment(player, card.cost) ?? card.cost.foods
  return {
    kind: 'playBird',
    cardId,
    handIndex: handIndex ?? player.hand.indexOf(cardId),
    habitat,
    anyFoods: payment.slice(card.cost.foods.length),
    eggs: autoEggPayment(player, eggCostForSlot(player.board[habitat].length)),
  }
}

/**
 * True if playing `cardId` in `habitat` leaves the player a real choice of payment: an "any"
 * food with 2+ kinds of food left to pay it with, or an egg cost with 2+ birds holding eggs.
 * Otherwise the payment is forced and a drop plays the bird at once.
 */
export function hasPaymentChoice(state: GameState, cardId: string, habitat: Habitat): boolean {
  const player = state.players[state.currentPlayer]
  const card = BIRDS_BY_ID[cardId]
  if (card.cost.anyCount > 0) {
    const left = { ...player.food }
    for (const f of card.cost.foods) left[f]--
    if (Object.values(left).filter((n) => n > 0).length > 1) return true
  }
  if (eggCostForSlot(player.board[habitat].length) > 0) {
    const withEggs = HABITATS.flatMap((h) => player.board[h]).filter((b) => b.eggs > 0)
    if (withEggs.length > 1) return true
  }
  return false
}

/** Starts the lay-eggs action with no eggs placed: the player clicks the birds to place them. */
export function startLayEggs(): Draft {
  return { kind: 'layEggs', placements: [] }
}

/** All eggs placed automatically on the birds with the most room (the panel's "Auto" button). */
export function autoLayEggs(state: GameState): Draft {
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
// Drawing cards has no clicks: it is drag and drop only (see below).

/** Habitats whose action starts with a click on its button. Wetland (draw) is drag only. */
export type ButtonHabitat = Exclude<Habitat, 'wetland'>

/** True if the habitat's action button starts its action (the wetland's draw is dragged). */
export function isButtonHabitat(habitat: Habitat): habitat is ButtonHabitat {
  return habitat !== 'wetland'
}

/** Starts the habitat's non-play action: gain food or lay eggs. */
export function startHabitatAction(habitat: ButtonHabitat): Draft {
  return habitat === 'forest' ? { kind: 'gainFood', foods: [] } : startLayEggs()
}

/** Clicking one of the current player's birds: lay an egg on it, or pay an egg from it. */
export function clickBird(state: GameState, draft: Draft, slot: SlotRef): Draft {
  const player = state.players[state.currentPlayer]
  const bird = player.board[slot.habitat][slot.index]
  if (!bird) return draft
  if (draft.kind === 'layEggs') {
    const room = BIRDS_BY_ID[bird.cardId].eggLimit - bird.eggs - eggDelta(draft.placements, slot)
    const placements = placeOrMove(draft.placements, slot, room > 0, layCount(player))
    return placements ? { ...draft, placements } : draft
  }
  if (draft.kind === 'playBird') {
    const needed = eggCostForSlot(player.board[draft.habitat].length)
    const eggs = placeOrMove(draft.eggs, slot, bird.eggs - eggDelta(draft.eggs, slot) > 0, needed)
    return eggs ? { ...draft, eggs } : draft
  }
  return draft
}

/**
 * One egg onto (laying) or from (paying) `slot`. While fewer than `total` are assigned it is
 * added; once all are assigned (e.g. the automatic pre-fill) it is moved here from the
 * bird that was assigned one most recently, so clicking re-distributes without "Clear".
 * Null if `slot` can't take another (`canTake`) or there is nothing to move.
 */
function placeOrMove(placements: readonly EggPlacement[], slot: SlotRef, canTake: boolean, total: number): EggPlacement[] | null {
  if (!canTake) return null
  if (totalCount(placements) < total) return addEgg(placements, slot)
  const from = placements.findLast((p) => slotKey(p.slot) !== slotKey(slot))
  if (!from) return null
  return addEgg(removeEgg(placements, from.slot), slot)
}

/** Takes one egg off `slot`'s placement, dropping it when it reaches zero. */
export function removeEgg(placements: readonly EggPlacement[], slot: SlotRef): EggPlacement[] {
  const key = slotKey(slot)
  return placements.flatMap((p) => (slotKey(p.slot) !== key ? [p] : p.count > 1 ? [{ ...p, count: p.count - 1 }] : []))
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
  if (draft.kind !== 'drawCards' || drawsLeft(state, draft) <= 0 || pickedDeck(draft) >= drawableCount(state)) return draft
  return { ...draft, picks: [...draft.picks, { from: 'deck' }] }
}

// ------------------------------------------------------------- view helpers

/**
 * Whose board and hand are shown up top: the acting human; while bots play, the human
 * who last had the device (`revealedTo`), else the first human.
 */
export function viewedPlayer(state: GameState, revealedTo: number | null = null): number {
  const current = state.players[state.currentPlayer]
  if (current.kind === 'human' && state.phase === 'playing') return state.currentPlayer
  if (revealedTo !== null && state.players[revealedTo]?.kind === 'human') return revealedTo
  return Math.max(0, state.players.findIndex((p) => p.kind === 'human'))
}

/**
 * Hot-seat privacy: true when the hand about to be shown isn't the one last revealed and
 * other humans share the device, so the screen must be covered until its owner is ready.
 * Never needed with a single human (solo / against the computer).
 */
export function needsHandoff(state: GameState, revealedTo: number | null): boolean {
  if (state.phase !== 'playing') return false
  const humans = state.players.filter((p) => p.kind === 'human').length
  return humans > 1 && viewedPlayer(state, revealedTo) !== revealedTo
}

/** True if the current player can afford the card and has a habitat to put it in. */
export function canPlayCard(state: GameState, cardId: string): boolean {
  const player = state.players[state.currentPlayer]
  return canPayCost(player, BIRDS_BY_ID[cardId].cost) && playableHabitats(state, state.currentPlayer, cardId).length > 0
}

// ------------------------------------------------------------ hand

/** The hand position to highlight: the bird waiting for its payment to be confirmed, if any. */
export function selectedHandIndex(state: GameState, draft: Draft): number | null {
  if (draft.kind !== 'playBird') return null
  return draft.handIndex ?? state.players[state.currentPlayer].hand.indexOf(draft.cardId)
}

// ---------------------------------------------------------- drag and drop
// The only way to play a bird or draw cards (clicking a card just shows its info): drag a
// bird from the hand onto a habitat to play it, or a tray card / the deck into the hand to
// draw it. A dropped bird is played at once with the automatic payment, unless the player has
// a real choice of payment (`hasPaymentChoice`): then the action panel opens, pre-filled, to
// change and confirm it. Draws commit when the last card is dropped.

/** Something the player can pick up. */
export type DragItem = { kind: 'hand'; cardId: string; handIndex: number } | { kind: 'tray'; index: number } | { kind: 'deck' }

/** Somewhere it can be put down. */
export type DropTarget = { kind: 'habitat'; habitat: Habitat } | { kind: 'hand' }

/** What a drop does: dispatch a complete action, update the draft, or nothing. */
export type DropResult = { action: GameAction } | { draft: Draft } | null

const toPick = (item: Exclude<DragItem, { kind: 'hand' }>): CardPick =>
  item.kind === 'tray' ? { from: 'tray', index: item.index } : { from: 'deck' }

/** Adds a card to the draw action, starting it if another (or no) action was in progress. */
export function addDrawPick(state: GameState, draft: Draft, pick: CardPick): Draft {
  const base: Draft = draft.kind === 'drawCards' ? draft : { kind: 'drawCards', picks: [] }
  if (pick.from === 'tray') {
    // Picking an already picked card again is a no-op here, not an un-pick.
    if (pickedTray(base).includes(pick.index)) return base
    return pickTray(state, base, pick.index)
  }
  return pickDeck(state, base)
}

/** True if the current player may start dragging `item` right now. */
export function canDrag(state: GameState, draft: Draft, item: DragItem): boolean {
  if (item.kind === 'hand') return canPlayCard(state, item.cardId)
  const base: Draft = draft.kind === 'drawCards' ? draft : { kind: 'drawCards', picks: [] }
  if (drawsLeft(state, base) <= 0) return false
  if (item.kind === 'tray') return state.tray[item.index] != null && !pickedTray(base).includes(item.index)
  return pickedDeck(base) < drawableCount(state)
}

/** True if `item` may be dropped on `target` (used to highlight valid targets). */
export function canDrop(state: GameState, draft: Draft, item: DragItem, target: DropTarget): boolean {
  if (!canDrag(state, draft, item)) return false
  if (item.kind === 'hand') {
    return target.kind === 'habitat' && playableHabitats(state, state.currentPlayer, item.cardId).includes(target.habitat)
  }
  return target.kind === 'hand'
}

export function drop(state: GameState, draft: Draft, item: DragItem, target: DropTarget): DropResult {
  if (!canDrop(state, draft, item, target)) return null
  if (item.kind === 'hand' && target.kind === 'habitat') {
    if (hasPaymentChoice(state, item.cardId, target.habitat)) {
      return { draft: startPlayBird(state, item.cardId, target.habitat, item.handIndex) }
    }
    const action = autoPlayBird(state, state.currentPlayer, item.cardId, target.habitat)
    return action && validateAction(state, action) === null ? { action } : null
  }
  if (item.kind === 'hand') return null
  const next = addDrawPick(state, draft, toPick(item))
  if (drawsLeft(state, next) > 0) return { draft: next }
  const action = toAction(next)
  return action && validateAction(state, action) === null ? { action } : { draft: next }
}

// --------------------------------------------------------------- tutorial

/** True on the current player's very first turn of the game (round 1, no turns taken). */
export function isFirstTurn(state: GameState): boolean {
  return state.phase === 'playing' && state.round === 1 && state.turnsLeft[state.currentPlayer] === turnsPerRound(1)
}

// ------------------------------------------------------------ debug output

/** Short developer-facing text for a draft (debug log only; not translated). */
export function describeDraft(draft: Draft): string {
  const eggs = (placements: readonly EggPlacement[]) => placements.map((p) => `${slotKey(p.slot)}×${p.count}`).join(', ')
  switch (draft.kind) {
    case 'idle':
      return 'idle'
    case 'playBird': {
      const parts = [`play ${draft.cardId} → ${draft.habitat}`]
      if (draft.anyFoods.length) parts.push(`any food: ${draft.anyFoods.join(', ')}`)
      if (draft.eggs.length) parts.push(`egg payment: ${eggs(draft.eggs)}`)
      return parts.join(' ')
    }
    case 'gainFood':
      return `gain food: ${draft.foods.join(', ') || 'none chosen'}`
    case 'layEggs':
      return `lay eggs: ${eggs(draft.placements) || 'none placed'}`
    case 'drawCards':
      return `draw: ${draft.picks.map((p) => (p.from === 'tray' ? `tray#${p.index + 1}` : 'deck')).join(', ') || 'none picked'}`
  }
}
