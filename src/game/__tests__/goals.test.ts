import { describe, expect, it } from 'vitest'
import { GOAL_IDS, GOALS_BY_ID } from '../goals'
import type { PlacedBird } from '../types'
import { newGame, withPlayer } from './helpers'

const at = (cardId: string, eggs = 0): PlacedBird => ({ cardId, eggs })

describe('goal measures', () => {
  // forest: chickadee (2 pts, 2 eggs) + owl (8 pts); grassland: bluebird (2 pts, 3 eggs); wetland: egret (4 pts, 1 egg)
  const player = withPlayer(newGame(1), 0, {
    board: {
      forest: [at('black-capped-chickadee', 2), at('great-horned-owl')],
      grassland: [at('eastern-bluebird', 3)],
      wetland: [at('snowy-egret', 1)],
    },
  }).players[0]

  it.each([
    ['forest-birds', 2],
    ['grassland-birds', 1],
    ['wetland-birds', 1],
    ['total-birds', 4],
    ['forest-eggs', 2],
    ['grassland-eggs', 3],
    ['total-eggs', 6],
    ['birds-with-eggs', 3],
    ['bird-points', 16],
  ])('%s = %i', (id, expected) => {
    expect(GOALS_BY_ID[id].measure(player)).toBe(expected)
  })

  it('every goal measures 0 on an empty board', () => {
    const empty = newGame(1).players[0]
    for (const id of GOAL_IDS) expect(GOALS_BY_ID[id].measure(empty), id).toBe(0)
  })
})
