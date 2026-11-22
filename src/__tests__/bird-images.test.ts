import { describe, expect, it } from 'vitest'
import { BIRD_IMAGE_BY_ID, BIRD_IMAGES, type BirdImage } from '../bird-images'
import { BIRDS } from '../game/birds'

describe('bird images', () => {
  it('has exactly one photo per bird', () => {
    expect(BIRD_IMAGES.map((img) => img.id).sort()).toEqual(BIRDS.map((b) => b.id).sort())
    for (const b of BIRDS) expect(BIRD_IMAGE_BY_ID[b.id], b.id).toBeDefined()
  })

  it('uses Wikimedia thumbnails with a credit and a free licence', () => {
    for (const img of BIRD_IMAGES) {
      expect(img.url, img.id).toMatch(/^https:\/\/[a-z]+\.wikimedia\.org\/.+\/330px-/)
      expect(img.source, img.id).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/)
      expect(img.author.trim(), img.id).not.toBe('')
      expect(img.license, img.id).toMatch(/^(CC BY(-SA)? \d\.\d|CC0|Public domain)$/)
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
