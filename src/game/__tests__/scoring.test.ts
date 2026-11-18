import { describe, expect, it } from 'vitest'
import { roundGoalAwards } from '../goals'
import { finalStandings, scorePlayer } from '../scoring'
import { food, newGame, withPlayer } from './helpers'

describe('scoring', () => {
  it('breaks down a score with the food cap', () => {
    const s = withPlayer(newGame(), 0, {
      food: food(3, 3, 0, 0, 0),
      goalPoints: 6,
      board: { forest: [{ cardId: 'barn-owl', eggs: 2 }], grassland: [{ cardId: 'mourning-dove', eggs: 4 }], wetland: [] },
    })
    expect(scorePlayer(s.players[0])).toEqual({ birds: 6, eggs: 6, food: 5, goals: 6, total: 23 })
  })

  it('ranks by total, then leftover food, sharing exact ties', () => {
    let s = newGame(1, 4)
    s = withPlayer(s, 0, { food: food(9, 0, 0, 0, 0), goalPoints: 0 }) // 5
    s = withPlayer(s, 1, { food: food(6, 0, 0, 0, 0), goalPoints: 0 }) // 5, less food
    s = withPlayer(s, 2, { food: food(9, 0, 0, 0, 0), goalPoints: 0 }) // tie with p0
    s = withPlayer(s, 3, { food: food(0, 0, 0, 0, 0), goalPoints: 10 }) // 10
    expect(finalStandings(s).map((r) => [r.playerIdx, r.rank])).toEqual([
      [3, 1],
      [0, 2],
      [2, 2],
      [1, 4],
    ])
  })
})

describe('round goals', () => {
  const players = (counts: number[]) => {
    let s = newGame(1, counts.length)
    counts.forEach((n, i) => {
      s = withPlayer(s, i, { board: { forest: Array.from({ length: n }, () => ({ cardId: 'blue-jay', eggs: 0 })), grassland: [], wetland: [] } })
    })
    return s.players
  }

  it('awards 1st and 2nd by round', () => {
    expect(roundGoalAwards(players([3, 1, 0]), 'forest-birds', 1)).toEqual([4, 1, 0])
    expect(roundGoalAwards(players([1, 3]), 'forest-birds', 4)).toEqual([4, 7])
  })

  it('shares ties (rounded down) and needs at least 1', () => {
    expect(roundGoalAwards(players([2, 2, 1]), 'forest-birds', 1)).toEqual([2, 2, 0])
    expect(roundGoalAwards(players([2, 1, 1]), 'forest-birds', 2)).toEqual([5, 1, 1])
    expect(roundGoalAwards(players([0, 0]), 'forest-birds', 3)).toEqual([0, 0])
  })
})
