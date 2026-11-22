import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BIRD_IMAGE_BY_ID } from '../bird-images'
import { BIRDS } from '../game/birds'
import BirdCard from './BirdCard'
import BirdInfo from './BirdInfo'

/**
 * Development tool (only loaded in `npm run dev`, see main.tsx): a small corner button that
 * opens a full-screen overlay listing every bird with its game card and its info card side by
 * side, plus its id and photo source, to check all cards and images in one place.
 */
export default function DevCardGallery() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed top-2 left-2 z-60 cursor-pointer rounded-md bg-fuchsia-700 px-2 py-1 text-xs font-bold text-white opacity-60 shadow hover:opacity-100"
        title={t('dev.cards.title', { count: BIRDS.length })}
      >
        🃏 {t('dev.cards.open')}
      </button>
      {open && (
        <div role="dialog" aria-modal="true" aria-label={t('dev.cards.title', { count: BIRDS.length })} className="fixed inset-0 z-60 overflow-y-auto bg-stone-900/80 p-2 backdrop-blur-sm sm:p-4">
          <div className="mx-auto flex max-w-7xl flex-col gap-3">
            <header className="sticky top-0 z-10 flex items-center justify-between gap-2 rounded-lg bg-white/95 px-3 py-2 shadow">
              <h2 className="font-bold text-stone-900">🃏 {t('dev.cards.title', { count: BIRDS.length })}</h2>
              <button
                type="button"
                autoFocus
                onClick={() => setOpen(false)}
                className="cursor-pointer rounded-md bg-stone-200 px-3 py-1 text-sm font-semibold hover:bg-stone-300"
              >
                {t('dev.cards.close')}
              </button>
            </header>
            <ul className="grid gap-3 sm:grid-cols-[repeat(auto-fill,minmax(30rem,1fr))]">
              {BIRDS.map((bird) => {
                const photo = BIRD_IMAGE_BY_ID[bird.id]
                return (
                  <li key={bird.id} className="flex flex-col gap-2 rounded-xl bg-white/95 p-2 shadow">
                    <div className="flex flex-col items-start gap-2 min-[30rem]:flex-row">
                      <BirdCard cardId={bird.id} />
                      <div className="w-full min-w-0 flex-1">
                        <BirdInfo cardId={bird.id} />
                      </div>
                    </div>
                    {/* Developer details: not translated on purpose (ids, URLs, licences). */}
                    <p className="font-mono text-[11px] break-all text-stone-500">
                      {bird.id}
                      {photo ? (
                        <>
                          {' · '}
                          <a href={photo.source} target="_blank" rel="noopener noreferrer" className="text-emerald-800 underline">
                            {photo.license}, {photo.author}
                          </a>
                        </>
                      ) : (
                        <span className="font-bold text-rose-700"> · no photo</span>
                      )}
                    </p>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      )}
    </>
  )
}
