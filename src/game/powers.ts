import { BIRDS_BY_ID } from './birds'
import { HABITATS, type GameState, type Habitat, type PlacedBird } from './types'

/**
 * Activates the "when activated" powers of a player's birds in one habitat,
 * right to left. Mutates `draft`, which must be a private copy owned by the reducer.
 *
 * Powers resolve automatically (they are all beneficial):
 * - `layEggAny` puts the egg on the bird with the most free space
 *   (ties: forest → grassland → wetland, left to right).
 */
export function activateHabitat(draft: GameState, playerIdx: number, habitat: Habitat): void {
  const player = draft.players[playerIdx]
  const row = player.board[habitat]
  for (let i = row.length - 1; i >= 0; i--) {
    const bird = row[i]
    const card = BIRDS_BY_ID[bird.cardId]
    const power = card.power
    if (!power) continue
    const who = `${player.name}'s ${card.name}`
    switch (power.kind) {
      case 'gainFood':
        player.food[power.food]++
        draft.log.push(`${who}: gained 1 ${power.food}.`)
        break
      case 'layEggSelf':
        if (bird.eggs < card.eggLimit) {
          bird.eggs++
          draft.log.push(`${who}: laid an egg on itself.`)
        }
        break
      case 'layEggAny': {
        const target = roomiestBird(HABITATS.flatMap((h) => player.board[h]))
        if (target) {
          target.eggs++
          draft.log.push(`${who}: laid an egg on ${BIRDS_BY_ID[target.cardId].name}.`)
        }
        break
      }
      case 'drawCard': {
        const drawn = draft.deck.shift()
        if (drawn) {
          player.hand.push(drawn)
          draft.log.push(`${who}: drew a card.`)
        }
        break
      }
      case 'allGainFood':
        for (const p of draft.players) p.food[power.food]++
        draft.log.push(`${who}: every player gained 1 ${power.food}.`)
        break
    }
  }
}

function roomiestBird(birds: PlacedBird[]): PlacedBird | undefined {
  let best: PlacedBird | undefined
  let bestRoom = 0
  for (const b of birds) {
    const room = BIRDS_BY_ID[b.cardId].eggLimit - b.eggs
    if (room > bestRoom) {
      best = b
      bestRoom = room
    }
  }
  return best
}
