import { describe, expect, it } from 'vitest'
import { BIRD_FACTS, BIRD_FACTS_BY_ID, wikipediaUrl } from '../bird-facts'
import { BIRDS } from '../game/birds'
import enUS from '../i18n/en-us.json'
import huHU from '../i18n/hu-hu.json'

describe('bird facts', () => {
  it('has facts and a description in both languages for every bird', () => {
    expect(BIRD_FACTS.map((f) => f.id).sort()).toEqual(BIRDS.map((b) => b.id).sort())
    for (const b of BIRDS) {
      const facts = BIRD_FACTS_BY_ID[b.id]!
      expect(facts.scientific, b.id).toMatch(/^[A-Z][a-z]+ [a-z]+$/) // binomial: Genus species
      const en = (enUS.birdFacts as Record<string, string>)[b.id]
      const hu = (huHU.birdFacts as Record<string, string>)[b.id]
      expect(en?.length, b.id).toBeGreaterThan(40)
      expect(hu?.length, b.id).toBeGreaterThan(40)
    }
  })

  it('links Wikipedia in the UI language, falling back to English', () => {
    const robin = BIRD_FACTS_BY_ID['american-robin']!
    expect(wikipediaUrl(robin, 'en-us')).toBe('https://en.wikipedia.org/wiki/American_robin')
    expect(wikipediaUrl(robin, 'hu-hu')).toBe('https://hu.wikipedia.org/wiki/V%C3%A1ndorrig%C3%B3')
    const downy = BIRD_FACTS_BY_ID['downy-woodpecker']!
    expect(downy.wikipedia.hu).toBeUndefined()
    expect(wikipediaUrl(downy, 'hu-hu')).toBe('https://en.wikipedia.org/wiki/Downy_woodpecker')
  })
})
