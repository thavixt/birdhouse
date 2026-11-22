import { useTranslation } from 'react-i18next'
import { BIRD_FACTS_BY_ID, wikipediaUrl } from '../bird-facts'
import { BIRD_IMAGE_BY_ID } from '../bird-images'
import { BIRDS_BY_ID } from '../game/birds'
import BirdPhoto from './BirdPhoto'
import PointsBadge from './PointsBadge'

type Props = {
  cardId: string
  /** Shows a ✕ close button when given (left out in the dev card gallery). */
  onClose?: () => void
}

/**
 * Field-guide style card about the last bird card clicked: photo, name, point value (the
 * game card's badge), a short description (`birdFacts.<id>`) and a Wikipedia link in the UI language.
 * The photo fills the whole card; the text sits on a frosted panel at the bottom, with
 * clear space above it so the bird stays visible. Shown below the game log.
 */
export default function BirdInfo({ cardId, onClose }: Props) {
  const { t, i18n } = useTranslation()
  const facts = BIRD_FACTS_BY_ID[cardId]
  const photo = BIRD_IMAGE_BY_ID[cardId]
  return (
    <section
      aria-label={t('birdInfo.title')}
      className="relative isolate flex h-96 shrink-0 flex-col overflow-hidden rounded-xl border border-stone-200 bg-stone-200 text-sm shadow-sm"
    >
      {photo && <BirdPhoto photo={photo} />}
      <div className="flex min-h-0 flex-1 justify-end p-1.5">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label={t('birdInfo.close')}
            className="flex size-7 cursor-pointer items-center justify-center rounded-full bg-white/85 text-stone-700 shadow hover:bg-white"
          >
            ✕
          </button>
        )}
      </div>
      <div className="m-1.5 mt-0 flex h-44 shrink-0 flex-col gap-2 overflow-y-auto rounded-lg bg-white/85 p-3 backdrop-blur-sm">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-emerald-900 underline hover:no-underline cursor-pointer" onClick={() => {
            if (facts) {
              window.open(wikipediaUrl(facts, i18n.language))
            }
          }} title={`Wikipedia: ${t(`birds.${cardId}`)}`}>
            {t(`birds.${cardId}`)}
          </h3>
          <PointsBadge points={BIRDS_BY_ID[cardId].points} />
          {/* <DevBirdId id={cardId} /> */}
          {/* {facts && <p className="text-xs text-stone-500 italic">{facts.scientific}</p>} */}
        </div>
        <p className="leading-snug text-stone-800">{t(`birdFacts.${cardId}`)}</p>
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-xs">
        </div>
      </div>
    </section>
  )
}
