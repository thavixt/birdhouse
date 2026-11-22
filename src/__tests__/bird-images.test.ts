import { describe, expect, it } from 'vitest'
import { BIRD_IMAGE_BY_ID, BIRD_IMAGES, type BirdImage } from '../bird-images'
import { BIRDS } from '../game/birds'

const wikiRegex = /^https:\/\/.*\.(wikipedia|wikimedia)\.org\/.*/;
const licenseRegex = /^(CC BY(-SA)? \d\.\d|CC0|Public domain)$/;

describe('bird images', () => {
  it('has exactly one photo per bird', () => {
    expect(BIRD_IMAGES.map((img) => img.id).sort()).toEqual(BIRDS.map((b) => b.id).sort())
    for (const b of BIRDS) expect(BIRD_IMAGE_BY_ID[b.id], b.id).toBeDefined()
  })

  it('uses Wikimedia thumbnails with a credit and a free licence', () => {
    for (const img of BIRD_IMAGES) {
      expect(img.url, img.id).toMatch(wikiRegex)
      expect(img.source, img.id).toMatch(wikiRegex)
      expect(img.author.trim(), img.id).not.toBe('')
      expect(img.license, img.id).toMatch(licenseRegex)
    }
  })

  it('only uses positioning classes for photo framing', () => {
    for (const img of BIRD_IMAGES as readonly BirdImage[]) {
      for (const cls of img.className?.split(/\s+/).filter(Boolean) ?? []) {
        expect(cls, img.id).toMatch(/^(object-|scale-|origin-)/)
      }
    }
  })
})
