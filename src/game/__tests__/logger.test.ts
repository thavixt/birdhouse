import { afterEach, describe, expect, it } from 'vitest'
import { reduce } from '../engine'
import { setGameLogger, type LogLevel } from '../logger'
import type { GameAction } from '../types'
import { newGame } from './helpers'

type Line = { level: LogLevel; message: string; data: unknown }

function capture(): Line[] {
  const lines: Line[] = []
  setGameLogger((level, message, data) => lines.push({ level, message, data }))
  return lines
}

afterEach(() => setGameLogger(null))

describe('engine logging', () => {
  it('logs a valid action once, even when the reducer runs twice (Strict Mode)', () => {
    const lines = capture()
    const s = newGame(1, 2)
    const action: GameAction = { type: 'gainFood', foods: ['fish'] }
    reduce(s, action)
    reduce(s, action)
    expect(lines).toHaveLength(1)
    expect(lines[0].level).toBe('info')
    expect(lines[0].message).toBe('R1 T1 · P1 (human) · gain food: fish')
    expect(lines[0].data).toMatchObject({ action, events: ['log.gainedFood {"player":"P1","foods":["fish"]}'] })
  })

  it('warns about rejected actions with the reason', () => {
    const lines = capture()
    reduce(newGame(1, 2), { type: 'gainFood', foods: [] })
    expect(lines).toHaveLength(1)
    expect(lines[0].level).toBe('warn')
    expect(lines[0].message).toBe('Rejected gainFood from P1 (human): error.gainFoodCount {"count":1}')
  })

  it('reports round changes and game over', () => {
    const lines = capture()
    let s = newGame(2, 1)
    while (s.phase === 'playing') s = reduce(s, { type: 'gainFood', foods: ['seed'] })
    const messages = lines.map((l) => l.message)
    expect(messages.filter((m) => m.startsWith('Round '))).toHaveLength(3)
    expect(messages.at(-1)).toBe('Game over')
    expect(messages.filter((m) => m.startsWith('R4 T5 '))).toHaveLength(1) // last turn of the game
  })

  it('is silent and side-effect free without a logger', () => {
    const s = newGame(1, 2)
    expect(() => reduce(s, { type: 'gainFood', foods: ['fish'] })).not.toThrow()
  })
})
