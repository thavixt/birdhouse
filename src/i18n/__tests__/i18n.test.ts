import { createInstance, type TFunction } from 'i18next'
import { beforeAll, describe, expect, it } from 'vitest'
import { BIRDS } from '../../game/birds'
import { chooseAction } from '../../game/bot'
import { reduce, validateAction } from '../../game/engine'
import { GOAL_IDS } from '../../game/goals'
import { createGame } from '../../game/setup'
import { FOODS, HABITATS, type GameAction } from '../../game/types'
import enUS from '../en-us.json'
import huHU from '../hu-hu.json'
import { formatMessage } from '../message'

type Dict = { [k: string]: string | Dict }

function flatten(dict: Dict, prefix = ''): string[] {
  return Object.entries(dict).flatMap(([k, v]) => (typeof v === 'string' ? [`${prefix}${k}`] : flatten(v, `${prefix}${k}.`)))
}

const enKeys = new Set(flatten(enUS))
/** True if `key` exists directly or as a plural form. */
const hasKey = (key: string) => enKeys.has(key) || enKeys.has(`${key}_one`)

const SOURCES = {
  components: import.meta.glob<string>('../../components/*.tsx', { query: '?raw', import: 'default', eager: true }),
  game: import.meta.glob<string>('../../game/*.ts', { query: '?raw', import: 'default', eager: true }),
}
const sources = (dir: keyof typeof SOURCES) => Object.values(SOURCES[dir])

describe('dictionaries', () => {
  it('hu-hu has exactly the same keys as en-us', () => {
    const hu = new Set(flatten(huHU))
    expect([...enKeys].filter((k) => !hu.has(k))).toEqual([])
    expect([...hu].filter((k) => !enKeys.has(k))).toEqual([])
  })

  it('names every bird, goal, food and habitat', () => {
    for (const b of BIRDS) expect(hasKey(`birds.${b.id}`), b.id).toBe(true)
    for (const g of GOAL_IDS) expect(hasKey(`goals.${g}`), g).toBe(true)
    for (const f of FOODS) expect(hasKey(`foods.${f}`), f).toBe(true)
    for (const h of HABITATS) for (const p of ['name', 'in', 'action']) expect(hasKey(`habitats.${h}.${p}`)).toBe(true)
  })

  it('contains every literal key used in components and the engine', () => {
    const ui = sources('components').flatMap((s) => [
      ...s.matchAll(/\bt\(\s*'([\w.-]+)'/g),
      ...s.matchAll(/i18nKey="([\w.-]+)"/g),
      // Keys kept in constant lists, e.g. RulesModal's sections.
      ...s.matchAll(/'(rules\.[\w.-]+)'/g),
    ])
    const game = sources('game').flatMap((s) => [...s.matchAll(/key: '([\w.-]+)'/g)])
    const errors = sources('game').flatMap((s) => [...s.matchAll(/\berr\('(\w+)'/g)].map((m) => ['', `error.${m[1]}`]))
    const used = [...ui, ...game].map((m) => m[1]).concat(errors.map((e) => e[1]))
    expect(used.length).toBeGreaterThan(50)
    expect(used.filter((k) => !hasKey(k))).toEqual([])
  })
})

describe('engine messages render in English', () => {
  let t: TFunction
  beforeAll(async () => {
    const i18n = createInstance()
    await i18n.init({ lng: 'en-us', lowerCaseLng: true, resources: { 'en-us': { translation: enUS } }, interpolation: { escapeValue: false } })
    t = i18n.t
  })

  const assertRendered = (text: string, key: string) => {
    expect(text, key).not.toBe(key)
    expect(text, key).not.toMatch(/\{\{|undefined/)
  }

  it('formats every log entry of a few bot games', () => {
    for (let seed = 0; seed < 5; seed++) {
      let s = createGame(seed, [
        { name: 'Ann', kind: 'bot' },
        { name: 'Bob', kind: 'bot' },
      ])
      while (s.phase === 'playing') s = reduce(s, chooseAction(s, s.currentPlayer))
      for (const msg of s.log) assertRendered(formatMessage(t, msg), msg.key)
    }
  })

  it('formats validation errors with params', () => {
    const s = createGame(1, [{ name: 'Ann', kind: 'human' }])
    const bad: GameAction = { type: 'playBird', cardId: s.players[0].hand[0], habitat: 'forest', payment: [], eggPayment: [] }
    const msg = validateAction(s, bad)!
    assertRendered(formatMessage(t, msg), msg.key)
    expect(formatMessage(t, { key: 'error.eggCost', params: { count: 2 } })).toBe('This slot costs 2 eggs.')
    expect(formatMessage(t, { key: 'error.wrongHabitat', params: { card: 'osprey', habitat: 'forest' } })).toBe(
      'Osprey cannot live in the forest.',
    )
    expect(formatMessage(t, { key: 'log.gainedFood', params: { player: 'Ann', foods: ['fish', 'seed', 'fish'] } })).toBe(
      'Ann gained 1 seed, 2 fish.',
    )
  })
})
