import { useTranslation } from 'react-i18next'
import BirdCard from './BirdCard'

type Props = {
  tray: (string | null)[]
  deckCount: number
  pickedTray: number[]
  pickedDeck: number
  onPickTray?: (index: number) => void
  onPickDeck?: () => void
}

/** The face-up cards and the deck. */
export default function CardTray({ tray, deckCount, pickedTray, pickedDeck, onPickTray, onPickDeck }: Props) {
  const { t } = useTranslation()
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-stone-600">
        <span aria-hidden>🐦 </span>
        {t('tray.title')}
      </h3>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tray.map((id, i) =>
          id ? (
            <BirdCard key={i} cardId={id} selected={pickedTray.includes(i)} onClick={onPickTray && (() => onPickTray(i))} />
          ) : (
            <div
              key={i}
              className="flex w-36 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-stone-300 text-xs text-stone-400"
            >
              {t('tray.empty')}
            </div>
          ),
        )}
        <button
          type="button"
          onClick={onPickDeck}
          disabled={!onPickDeck}
          data-deck
          className={`flex w-24 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-stone-400 bg-linear-to-br from-stone-600 to-stone-800 text-white shadow-sm ${onPickDeck ? 'cursor-pointer hover:ring-2 hover:ring-violet-400' : 'cursor-default'} ${pickedDeck > 0 ? 'ring-4 ring-violet-500' : ''}`}
        >
          <span className="text-2xl">🂠</span>
          <span className="text-xs">{t('tray.deck', { count: deckCount })}</span>
          {pickedDeck > 0 && <span className="text-xs font-bold">{t('tray.picked', { count: pickedDeck })}</span>}
        </button>
      </div>
    </section>
  )
}
