// Photos of the real species for the bird cards: Wikipedia lead images, hosted on
// Wikimedia Commons (hot-linking is allowed). All are CC BY / CC BY-SA, which require
// crediting the author: `author` and `license` are shown on the cards, `source` links the
// file page with the full licence details. URLs are 330px-wide thumbnails (a standard
// Wikimedia size; cards are 144px wide, so this stays sharp on high-density screens).
// The installed app caches them for offline play (see `runtimeCaching` in vite.config.ts).
//
// Collected 2026-11-22 via the Wikipedia/Commons APIs. To change a photo, pick another
// freely licensed file on Commons and update its url, author, license and source together.

export type BirdImage = {
  /** Bird id from src/game/birds.ts. */
  id: string
  url: string
  author: string
  license: string
  /** Commons file page (licence and attribution details). */
  source: string
  /**
   * Optional Tailwind classes for the `<img>`, to keep the bird in view when the photo is
   * cropped (`object-cover`) to a card, e.g. `'object-top'`, `'object-[30%_40%]'` (x y),
   * or a zoom such as `'scale-125 origin-[40%_30%]'`. Only object-*, scale-* and origin-*
   * classes are allowed (checked by a test). Written here as full strings so Tailwind
   * generates them.
   */
  className?: string
  // className: "object-[50%_30%]"
}

export const BIRD_IMAGES = [
  {
    id: 'american-robin',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/97/American_robin_%2871307%29.jpg/330px-American_robin_%2871307%29.jpg',
    author: 'Rhododendrites',
    license: 'CC BY-SA 4.0',
    source: 'https://commons.wikimedia.org/wiki/File:American_robin_(71307).jpg',
  },
  {
    id: 'barn-owl',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9e/American_Barn_Owl_%28Tyto_furcata_guatemalae%29%2C_Orange_Walk.jpg/330px-American_Barn_Owl_%28Tyto_furcata_guatemalae%29%2C_Orange_Walk.jpg',
    author: 'Charles J. Sharp',
    license: 'CC BY-SA 4.0',
    source: 'https://commons.wikimedia.org/wiki/File:American_Barn_Owl_(Tyto_furcata_guatemalae),_Orange_Walk.jpg',
    className: "object-[50%_30%]"
  },
  {
    id: 'blue-jay',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f4/Blue_jay_in_PP_%2830960%29.jpg/330px-Blue_jay_in_PP_%2830960%29.jpg',
    author: 'Rhododendrites',
    license: 'CC BY-SA 4.0',
    source: 'https://commons.wikimedia.org/wiki/File:Blue_jay_in_PP_(30960).jpg',
    className: "object-[50%_25%]"
  },
  {
    id: 'northern-cardinal',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5c/Male_northern_cardinal_in_Central_Park_%2852612%29.jpg/330px-Male_northern_cardinal_in_Central_Park_%2852612%29.jpg',
    author: 'Rhododendrites',
    license: 'CC BY-SA 4.0',
    source: 'https://commons.wikimedia.org/wiki/File:Male_northern_cardinal_in_Central_Park_(52612).jpg',
    className: "object-[50%_15%]"
  },
  {
    id: 'black-capped-chickadee',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4a/Poecile-atricapilla-001.jpg/330px-Poecile-atricapilla-001.jpg',
    author: 'Mdf',
    license: 'CC BY-SA 3.0',
    source: 'https://commons.wikimedia.org/wiki/File:Poecile-atricapilla-001.jpg',
    className: "object-[50%_10%]"
  },
  {
    id: 'downy-woodpecker',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/13/Dryobates_pubescens_UL_03.jpg/330px-Dryobates_pubescens_UL_03.jpg',
    author: 'Cephas',
    license: 'CC BY-SA 4.0',
    source: 'https://commons.wikimedia.org/wiki/File:Dryobates_pubescens_UL_03.jpg',
  },
  {
    id: 'pileated-woodpecker',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/12/PileatedWoodpeckerFeedingonTree%2C_crop.jpg/330px-PileatedWoodpeckerFeedingonTree%2C_crop.jpg',
    author: 'Joshlaymon',
    license: 'CC BY-SA 3.0',
    source: 'https://commons.wikimedia.org/wiki/File:PileatedWoodpeckerFeedingonTree,_crop.jpg',
    className: "object-[50%_10%]"
  },
  {
    id: 'great-horned-owl',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/23/Bubo_virginianus_06.jpg/330px-Bubo_virginianus_06.jpg',
    author: 'Greg Hume',
    license: 'CC BY-SA 3.0',
    source: 'https://commons.wikimedia.org/wiki/File:Bubo_virginianus_06.jpg',
  },
  {
    id: 'cedar-waxwing',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/35/Cedar_waxwing_in_pokeweed_%2810132%29.jpg/330px-Cedar_waxwing_in_pokeweed_%2810132%29.jpg',
    author: 'Rhododendrites',
    license: 'CC BY-SA 4.0',
    source: 'https://commons.wikimedia.org/wiki/File:Cedar_waxwing_in_pokeweed_(10132).jpg',
  },
  {
    id: 'ruby-throated-hummingbird',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7c/Archilochus_colubris_-flying_-male-8.jpg/330px-Archilochus_colubris_-flying_-male-8.jpg',
    author: 'jeffreyw',
    license: 'CC BY 2.0',
    source: 'https://commons.wikimedia.org/wiki/File:Archilochus_colubris_-flying_-male-8.jpg',
    className: "object-[50%_30%]"
  },
  {
    id: 'wild-turkey',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bc/20260428_tom_wild_turkey_matthaei_botanical_gardens_PD08952.jpg/330px-20260428_tom_wild_turkey_matthaei_botanical_gardens_PD08952.jpg',
    author: 'Paul Danese',
    license: 'CC BY-SA 4.0',
    source: 'https://commons.wikimedia.org/wiki/File:20260428_tom_wild_turkey_matthaei_botanical_gardens_PD08952.jpg',
  },
  {
    id: 'red-tailed-hawk',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7c/Red-tailed_Hawk_%2845812546121%29.jpg/330px-Red-tailed_Hawk_%2845812546121%29.jpg',
    author: 'Becky Matsubara from El Sobrante, California',
    license: 'CC BY 2.0',
    source: 'https://commons.wikimedia.org/wiki/File:Red-tailed_Hawk_(45812546121).jpg',
  },
  {
    id: 'wood-duck',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e7/Wood_Duck_Wissahickon_Creek.png/330px-Wood_Duck_Wissahickon_Creek.png',
    author: 'Chuck Homler d/b/a FocusOnwWildlife',
    license: 'CC BY-SA 4.0',
    source: 'https://commons.wikimedia.org/wiki/File:Wood_Duck_Wissahickon_Creek.png',
  },
  {
    id: 'bald-eagle',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/db/Bald_eagle_about_to_fly_in_Alaska_%282016%29.jpg/330px-Bald_eagle_about_to_fly_in_Alaska_%282016%29.jpg',
    author: 'Andy Morffew from Itchen Abbas, Hampshire, UK',
    license: 'CC BY 2.0',
    source: 'https://commons.wikimedia.org/wiki/File:Bald_eagle_about_to_fly_in_Alaska_(2016).jpg',
  },
  {
    id: 'american-kestrel',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6a/American_Kestrel_%2853468230687%29.jpg/330px-American_Kestrel_%2853468230687%29.jpg',
    author: 'Channel City Camera Club from Santa Barbara, US',
    license: 'CC BY 2.0',
    source: 'https://commons.wikimedia.org/wiki/File:American_Kestrel_(53468230687).jpg',
    className: "object-[50%_15%]"
  },
  {
    id: 'eastern-bluebird',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/00/Sialia_sialis_-Michigan%2C_USA_-pair-8c.jpg/330px-Sialia_sialis_-Michigan%2C_USA_-pair-8c.jpg',
    author: 'Sandysphotos2009',
    license: 'CC BY 2.0',
    source: 'https://commons.wikimedia.org/wiki/File:Sialia_sialis_-Michigan,_USA_-pair-8c.jpg',
  },
  {
    id: 'western-meadowlark',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/53/Sturnella_neglecta_GNP_02.jpg/330px-Sturnella_neglecta_GNP_02.jpg',
    author: 'Cephas',
    license: 'CC BY-SA 4.0',
    source: 'https://commons.wikimedia.org/wiki/File:Sturnella_neglecta_GNP_02.jpg',
  },
  {
    id: 'mourning-dove',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/55/Mourning_dove_perched_%2861179%29.jpg/330px-Mourning_dove_perched_%2861179%29.jpg',
    author: 'Rhododendrites',
    license: 'CC BY-SA 4.0',
    source: 'https://commons.wikimedia.org/wiki/File:Mourning_dove_perched_(61179).jpg',
  },
  {
    id: 'house-sparrow',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9b/House_sparrow_male_in_Prospect_Park_%2853532%29.jpg/330px-House_sparrow_male_in_Prospect_Park_%2853532%29.jpg',
    author: 'Rhododendrites',
    license: 'CC BY-SA 4.0',
    source: 'https://commons.wikimedia.org/wiki/File:House_sparrow_male_in_Prospect_Park_(53532).jpg',
  },
  {
    id: 'barn-swallow',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7d/Rauchschwalbe_Hirundo_rustica.jpg/330px-Rauchschwalbe_Hirundo_rustica.jpg',
    author: 'Andreas Trepte',
    license: 'CC BY-SA 2.5',
    source: 'https://commons.wikimedia.org/wiki/File:Rauchschwalbe_Hirundo_rustica.jpg',
  },
  {
    id: 'killdeer',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cb/Killdeer_Heislerville.png/330px-Killdeer_Heislerville.png',
    author: 'Charles Homler d/b/a FocusOnWildlife',
    license: 'CC BY-SA 4.0',
    source: 'https://commons.wikimedia.org/wiki/File:Killdeer_Heislerville.png',
  },
  {
    id: 'greater-prairie-chicken',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f8/Tympanuchus_cupido_-Illinois%2C_USA_-male_displaying-8_%281%29.jpg/330px-Tympanuchus_cupido_-Illinois%2C_USA_-male_displaying-8_%281%29.jpg',
    author: 'GregTheBusker',
    license: 'CC BY 2.0',
    source: 'https://commons.wikimedia.org/wiki/File:Tympanuchus_cupido_-Illinois,_USA_-male_displaying-8_(1).jpg',
    className: "object-[50%_100%]"
  },
  {
    id: 'burrowing-owl',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/be/Southern_burrowing_owl_%28Athene_cunicularia_cunicularia%29_Colonia.jpg/330px-Southern_burrowing_owl_%28Athene_cunicularia_cunicularia%29_Colonia.jpg',
    author: 'Charles J. Sharp',
    license: 'CC BY-SA 4.0',
    source: 'https://commons.wikimedia.org/wiki/File:Southern_burrowing_owl_(Athene_cunicularia_cunicularia)_Colonia.jpg',
  },
  {
    id: 'red-winged-blackbird',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e6/Red-Winged_Blackbird.png/330px-Red-Winged_Blackbird.png',
    author: 'Chuck Homler, Focus On Wildlife',
    license: 'CC BY-SA 4.0',
    source: 'https://commons.wikimedia.org/wiki/File:Red-Winged_Blackbird.png',
    className: "object-[50%_30%]"
  },
  {
    id: 'great-blue-heron',
    url: 'https://upload.wikimedia.org/wikipedia/commons/f/f1/GreatBlueHeronInARiver.jpg',
    author: 'DallasPenner',
    license: 'CC BY-SA 4.0',
    source: 'https://commons.wikimedia.org/wiki/File:GreatBlueHeronInARiver.jpg',
    className: 'object-[50%_30%]',
  },
  {
    id: 'mallard',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bf/Anas_platyrhynchos_male_female_quadrat.jpg/330px-Anas_platyrhynchos_male_female_quadrat.jpg',
    author: 'Richard Bartz',
    license: 'CC BY-SA 2.5',
    source: 'https://commons.wikimedia.org/wiki/File:Anas_platyrhynchos_male_female_quadrat.jpg',
  },
  {
    id: 'belted-kingfisher',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0c/BeltedKingfisherJG_Male.jpg/330px-BeltedKingfisherJG_Male.jpg',
    author: 'JeffreyGammon',
    license: 'CC BY-SA 4.0',
    source: 'https://commons.wikimedia.org/wiki/File:BeltedKingfisherJG_Male.jpg',
  },
  {
    id: 'osprey',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a0/Osprey_Perched_Snag_Heislerville.jpg/330px-Osprey_Perched_Snag_Heislerville.jpg',
    author: 'Chuck Homler / Focus On Wildlife',
    license: 'CC BY-SA 4.0',
    source: 'https://commons.wikimedia.org/wiki/File:Osprey_Perched_Snag_Heislerville.jpg',
  },
  {
    id: 'common-loon',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b0/Gavia_immer_-Minocqua%2C_Wisconsin%2C_USA_-swimming-8.jpg/330px-Gavia_immer_-Minocqua%2C_Wisconsin%2C_USA_-swimming-8.jpg',
    author: 'John Picken from Chicago, USA',
    license: 'CC BY 2.0',
    source: 'https://commons.wikimedia.org/wiki/File:Gavia_immer_-Minocqua,_Wisconsin,_USA_-swimming-8.jpg',
  },
  {
    id: 'american-white-pelican',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/32/American_White_Pelican.jpg/330px-American_White_Pelican.jpg',
    author: 'Manjith Kainickara',
    license: 'CC BY-SA 2.0',
    source: 'https://commons.wikimedia.org/wiki/File:American_White_Pelican.jpg',
  },
  {
    id: 'sandhill-crane',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/55/Sandhill_Crane_JG.jpg/330px-Sandhill_Crane_JG.jpg',
    author: 'JeffreyGammon',
    license: 'CC BY 4.0',
    source: 'https://commons.wikimedia.org/wiki/File:Sandhill_Crane_JG.jpg',
    className: "object-[50%_15%]"
  },
  {
    id: 'snowy-egret',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bf/Snowy_Egret_%28Egretta_thula%29_Edwin_B_Forsythe_NWR%2C_Galloway%2C_NJ%2C_USA.jpg/330px-Snowy_Egret_%28Egretta_thula%29_Edwin_B_Forsythe_NWR%2C_Galloway%2C_NJ%2C_USA.jpg',
    author: 'Chuck Homler d/b/a Focus On Wildlife',
    license: 'CC BY-SA 4.0',
    source: 'https://commons.wikimedia.org/wiki/File:Snowy_Egret_(Egretta_thula)_Edwin_B_Forsythe_NWR,_Galloway,_NJ,_USA.jpg',
  },
] as const satisfies readonly BirdImage[]

export const BIRD_IMAGE_BY_ID: Record<string, BirdImage | undefined> = Object.fromEntries(BIRD_IMAGES.map((img) => [img.id, img]))
