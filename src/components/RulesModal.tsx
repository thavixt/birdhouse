type Props = { onClose: () => void }

export default function RulesModal({ onClose }: Props) {
  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-label="Rules"
        className="max-h-[90vh] max-w-xl overflow-y-auto rounded-xl bg-white p-5 text-sm shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-2 text-xl font-bold">How to play</h2>
        <p className="mb-2">
          Attract birds to your three habitats over 4 rounds (8, 7, 6 and 5 turns each). On your turn take exactly one action:
        </p>
        <ul className="mb-2 list-disc space-y-1 pl-5">
          <li>
            <b>Play a bird</b>: pay its food (❔ = any food) and place it in the leftmost empty slot of a habitat it allows. Slots 3–4 cost 1
            egg, slot 5 costs 2 eggs.
          </li>
          <li>
            <b>🌲 Gain food</b>: 1, plus 1 for every 2 forest birds.
          </li>
          <li>
            <b>🌼 Lay eggs</b>: 2, plus 1 for every 2 grassland birds, up to each bird's egg limit.
          </li>
          <li>
            <b>💧 Draw cards</b>: 1, plus 1 for every 2 wetland birds, from the tray or the deck.
          </li>
        </ul>
        <p className="mb-2">After a habitat action, the birds in that row activate their powers (⚡) from right to left.</p>
        <p className="mb-2">
          At the end of each round its goal is scored: 1st and 2nd place earn points. You need at least 1 to place; tied players share the
          points, rounded down.
        </p>
        <p className="mb-4">
          <b>Final score:</b> bird points + 1 per egg + 1 per leftover food (max 5) + goal points. Ties go to whoever has more leftover food.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer rounded-md bg-violet-700 px-4 py-1.5 font-semibold text-white hover:bg-violet-800"
        >
          Got it
        </button>
      </div>
    </div>
  )
}
