// The draw pile and its discard pile. Every card taken from the deck (the draw action, tray
// refills and the drawCard power) goes through `takeFromDeck`, so a deck that runs out is
// always handled the same way: the discard pile is shuffled (with the game's seeded RNG)
// into a new deck. Both events are written to the game log.
import { shuffle } from './rng'
import type { GameState } from './types'

/** Cards that can still be drawn blind: the deck plus the discard pile waiting to be reshuffled. */
export function drawableCount(state: Pick<GameState, 'deck' | 'discard'>): number {
  return state.deck.length + state.discard.length
}

/**
 * Takes the top card of the deck, reshuffling the discard pile into a new deck first if the
 * deck is empty. Returns null when both are empty. Mutates `draft`, which must be a private
 * copy owned by the reducer.
 */
export function takeFromDeck(draft: GameState): string | null {
  if (draft.deck.length === 0 && draft.discard.length > 0) {
    const [deck, rngState] = shuffle(draft.discard, draft.rngState)
    draft.log.push({ key: 'log.deckReshuffled', params: { count: deck.length } })
    draft.deck = deck
    draft.discard = []
    draft.rngState = rngState
  }
  const card = draft.deck.shift()
  if (card === undefined) return null
  // The last card is gone and nothing is waiting to be reshuffled: say so once, now.
  if (draft.deck.length === 0 && draft.discard.length === 0) draft.log.push({ key: 'log.deckEmpty' })
  return card
}

/** Puts cards on the discard pile (the tray's leftovers at the end of a round). */
export function discardCards(draft: GameState, cards: readonly (string | null)[]): void {
  for (const card of cards) if (card) draft.discard.push(card)
}
