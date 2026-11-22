// Language-neutral facts for the bird info card (BirdInfo.tsx). The short descriptions
// themselves are translated text, in `birdFacts.<id>` in src/i18n/*.json; they summarise
// basic or unusual traits from each species' Wikipedia article (written in our own words).
// `wikipedia` holds article titles for the "read more" link: Hungarian when there is a
// Hungarian article, otherwise English.

export type BirdFacts = {
  /** Bird id from src/game/birds.ts. */
  id: string
  scientific: string
  wikipedia: { en: string; hu?: string }
}

export const BIRD_FACTS = [
  { id: 'american-robin', scientific: 'Turdus migratorius', wikipedia: { en: 'American robin', hu: 'Vándorrigó' } },
  { id: 'barn-owl', scientific: 'Tyto alba', wikipedia: { en: 'Barn owl', hu: 'Gyöngybagoly' } },
  { id: 'blue-jay', scientific: 'Cyanocitta cristata', wikipedia: { en: 'Blue jay', hu: 'Kék szajkó' } },
  { id: 'northern-cardinal', scientific: 'Cardinalis cardinalis', wikipedia: { en: 'Northern cardinal', hu: 'Vörös kardinálispinty' } },
  { id: 'black-capped-chickadee', scientific: 'Poecile atricapillus', wikipedia: { en: 'Black-capped chickadee', hu: 'Kanadai cinege' } },
  { id: 'downy-woodpecker', scientific: 'Dryobates pubescens', wikipedia: { en: 'Downy woodpecker' } },
  { id: 'pileated-woodpecker', scientific: 'Dryocopus pileatus', wikipedia: { en: 'Pileated woodpecker', hu: 'Kontyos feketeharkály' } },
  { id: 'great-horned-owl', scientific: 'Bubo virginianus', wikipedia: { en: 'Great horned owl', hu: 'Amerikai uhu' } },
  { id: 'cedar-waxwing', scientific: 'Bombycilla cedrorum', wikipedia: { en: 'Cedar waxwing', hu: 'Cédruscsonttollú' } },
  { id: 'ruby-throated-hummingbird', scientific: 'Archilochus colubris', wikipedia: { en: 'Ruby-throated hummingbird', hu: 'Tüzestorkú kolibri' } },
  { id: 'wild-turkey', scientific: 'Meleagris gallopavo', wikipedia: { en: 'Wild turkey', hu: 'Vadpulyka' } },
  { id: 'red-tailed-hawk', scientific: 'Buteo jamaicensis', wikipedia: { en: 'Red-tailed hawk', hu: 'Rőtfarkú ölyv' } },
  { id: 'wood-duck', scientific: 'Aix sponsa', wikipedia: { en: 'Wood duck', hu: 'Karolinai réce' } },
  { id: 'bald-eagle', scientific: 'Haliaeetus leucocephalus', wikipedia: { en: 'Bald eagle', hu: 'Fehérfejű rétisas' } },
  { id: 'american-kestrel', scientific: 'Falco sparverius', wikipedia: { en: 'American kestrel', hu: 'Tarka vércse' } },
  { id: 'eastern-bluebird', scientific: 'Sialia sialis', wikipedia: { en: 'Eastern bluebird', hu: 'Vörösbegyű kékmadár' } },
  { id: 'western-meadowlark', scientific: 'Sturnella neglecta', wikipedia: { en: 'Western meadowlark', hu: 'Nyugati réticsiröge' } },
  { id: 'mourning-dove', scientific: 'Zenaida macroura', wikipedia: { en: 'Mourning dove', hu: 'Sirató gerle' } },
  { id: 'house-sparrow', scientific: 'Passer domesticus', wikipedia: { en: 'House sparrow', hu: 'Házi veréb' } },
  { id: 'barn-swallow', scientific: 'Hirundo rustica', wikipedia: { en: 'Barn swallow', hu: 'Füsti fecske' } },
  { id: 'killdeer', scientific: 'Charadrius vociferus', wikipedia: { en: 'Killdeer', hu: 'Ékfarkú lile' } },
  { id: 'greater-prairie-chicken', scientific: 'Tympanuchus cupido', wikipedia: { en: 'Greater prairie-chicken', hu: 'Nagy prérityúk' } },
  { id: 'burrowing-owl', scientific: 'Athene cunicularia', wikipedia: { en: 'Burrowing owl', hu: 'Üregi bagoly' } },
  { id: 'red-winged-blackbird', scientific: 'Agelaius phoeniceus', wikipedia: { en: 'Red-winged blackbird', hu: 'Pirosvállú csiröge' } },
  { id: 'great-blue-heron', scientific: 'Ardea herodias', wikipedia: { en: 'Great blue heron', hu: 'Királygém' } },
  { id: 'mallard', scientific: 'Anas platyrhynchos', wikipedia: { en: 'Mallard', hu: 'Tőkés réce' } },
  { id: 'belted-kingfisher', scientific: 'Megaceryle alcyon', wikipedia: { en: 'Belted kingfisher', hu: 'Örvös halkapó' } },
  { id: 'osprey', scientific: 'Pandion haliaetus', wikipedia: { en: 'Osprey', hu: 'Halászsas' } },
  { id: 'common-loon', scientific: 'Gavia immer', wikipedia: { en: 'Common loon', hu: 'Jeges búvár' } },
  { id: 'american-white-pelican', scientific: 'Pelecanus erythrorhynchos', wikipedia: { en: 'American white pelican', hu: 'Orrszarvú pelikán' } },
  { id: 'sandhill-crane', scientific: 'Antigone canadensis', wikipedia: { en: 'Sandhill crane', hu: 'Kanadai daru' } },
  { id: 'snowy-egret', scientific: 'Egretta thula', wikipedia: { en: 'Snowy egret', hu: 'Hókócsag' } },
] as const satisfies readonly BirdFacts[]

export const BIRD_FACTS_BY_ID: Record<string, BirdFacts | undefined> = Object.fromEntries(BIRD_FACTS.map((f) => [f.id, f]))

/** Link to the species' Wikipedia article in the UI language (falls back to English). */
export function wikipediaUrl(facts: BirdFacts, language: string): string {
  const hu = language.startsWith('hu') ? facts.wikipedia.hu : undefined
  const [lang, title] = hu ? ['hu', hu] : ['en', facts.wikipedia.en]
  return `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title.replaceAll(' ', '_'))}`
}
