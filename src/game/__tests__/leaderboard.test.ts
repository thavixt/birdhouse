import { describe, expect, it } from 'vitest'
import { addEntries, LEADERBOARD_SIZE, parseLeaderboard, winnersOf, type LeaderboardEntry } from '../leaderboard'
import { createGame } from '../setup'
import type { GameState, PlayerConfig } from '../types'
import { withPlayer } from './helpers'

const DATE = '2026-11-22T10:00:00.000Z'

/** A finished game where each player's score is 5 (starting food) + the given goal points. */
function finished(players: PlayerConfig[], goalPoints: number[]): GameState {
  let s: GameState = { ...createGame(1, players), phase: 'gameOver' }
  goalPoints.forEach((g, i) => (s = withPlayer(s, i, { goalPoints: g })))
  return s
}

const entry = (name: string, score: number, date = DATE): LeaderboardEntry => ({ name, score, players: 1, bots: 0, date })

describe('winnersOf', () => {
  it('records the human winner with score and line-up', () => {
    const s = finished(
      [
        { name: 'Ann', kind: 'human' },
        { name: 'Bot', kind: 'bot' },
      ],
      [10, 3],
    )
    expect(winnersOf(s, DATE)).toEqual([{ name: 'Ann', score: 15, players: 2, bots: 1, date: DATE }])
  })

  it('skips bots that win', () => {
    const s = finished(
      [
        { name: 'Ann', kind: 'human' },
        { name: 'Bot', kind: 'bot' },
      ],
      [3, 10],
    )
    expect(winnersOf(s, DATE)).toEqual([])
  })

  it('records every human sharing first place', () => {
    const s = finished(
      [
        { name: 'Ann', kind: 'human' },
        { name: 'Bea', kind: 'human' },
        { name: 'Cid', kind: 'human' },
      ],
      [4, 4, 1],
    )
    expect(winnersOf(s, DATE).map((e) => e.name)).toEqual(['Ann', 'Bea'])
  })

  it('always records a solo game, and never an unfinished one', () => {
    const solo = finished([{ name: 'Ann', kind: 'human' }], [0])
    expect(winnersOf(solo, DATE)).toEqual([{ name: 'Ann', score: 5, players: 1, bots: 0, date: DATE }])
    expect(winnersOf({ ...solo, phase: 'playing' }, DATE)).toEqual([])
  })
})

describe('addEntries', () => {
  it('sorts by score, earlier first on ties, and keeps the top 10', () => {
    const board = addEntries([entry('A', 50), entry('B', 70, '2026-11-23T00:00:00.000Z')], [entry('C', 70), entry('D', 10)])
    expect(board.map((e) => e.name)).toEqual(['C', 'B', 'A', 'D'])

    const many = Array.from({ length: 15 }, (_, i) => entry(`P${i}`, i))
    const top = addEntries([], many)
    expect(top).toHaveLength(LEADERBOARD_SIZE)
    expect(top[0].score).toBe(14)
    expect(top.at(-1)?.score).toBe(5)
  })

  it('does not mutate its inputs', () => {
    const board = Object.freeze([entry('A', 1)])
    expect(() => addEntries(board, [entry('B', 2)])).not.toThrow()
  })
})

describe('parseLeaderboard', () => {
  it('reads what was stored', () => {
    const board = [entry('A', 60), entry('B', 40)]
    expect(parseLeaderboard(JSON.stringify(board))).toEqual(board)
  })

  it('drops malformed data instead of failing', () => {
    expect(parseLeaderboard(null)).toEqual([])
    expect(parseLeaderboard('{not json')).toEqual([])
    expect(parseLeaderboard('{"a":1}')).toEqual([])
    const mixed = [entry('A', 60), { name: 'B' }, { ...entry('C', 1), bots: 1 }, { ...entry('D', 1), date: 'yesterday' }, null]
    expect(parseLeaderboard(JSON.stringify(mixed)).map((e) => e.name)).toEqual(['A'])
  })
})
