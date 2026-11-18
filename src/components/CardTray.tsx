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
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-stone-600">Bird tray</h3>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tray.map((id, i) =>
          id ? (
            <BirdCard key={i} cardId={id} selected={pickedTray.includes(i)} onClick={onPickTray && (() => onPickTray(i))} />
          ) : (
            <div key={i} className="flex w-36 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-stone-300 text-xs text-stone-400">
              empty
            </div>
          ),
        )}
        <button
          type="button"
          onClick={onPickDeck}
          disabled={!onPickDeck}
          className={`flex w-24 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-stone-400 bg-linear-to-br from-stone-600 to-stone-800 text-white shadow-sm ${onPickDeck ? 'cursor-pointer hover:ring-2 hover:ring-violet-400' : 'cursor-default'} ${pickedDeck > 0 ? 'ring-4 ring-violet-500' : ''}`}
        >
          <span className="text-2xl">🂠</span>
          <span className="text-xs">Deck: {deckCount}</span>
          {pickedDeck > 0 && <span className="text-xs font-bold">+{pickedDeck} picked</span>}
        </button>
      </div>
    </section>
  )
}
