import { useState } from 'react'
import {
  boardEggDelta,
  canPlayCard,
  clickBird,
  needsHandoff,
  pickDeck,
  pickedDeck,
  pickedTray,
  pickTray,
  startHabitatAction,
  startPlayBird,
  viewedPlayer,
} from '../draft'
import type { GameAction, GameState } from '../game/types'
import { useTurnDraft } from '../useTurnDraft'
import ActionPanel from './ActionPanel'
import Board from './Board'
import CardTray from './CardTray'
import GameLog from './GameLog'
import HandoffOverlay from './HandoffOverlay'
import Hand from './Hand'
import RoundTracker from './RoundTracker'

type Props = {
  state: GameState
  dispatch: (action: GameAction) => void
  onQuit: () => void
}

/** In-game layout. What each click does to the turn draft lives in `src/draft.ts`. */
export default function GameScreen({ state, dispatch, onQuit }: Props) {
  const [draft, setDraft] = useTurnDraft(state)
  // Hot-seat: the human whose hand is currently uncovered (null until someone reveals).
  const [revealedTo, setRevealedTo] = useState<number | null>(null)

  const current = state.currentPlayer
  const viewIdx = viewedPlayer(state, revealedTo)
  const viewed = state.players[viewIdx]
  const handoff = needsHandoff(state, revealedTo)
  const interactive =
    !handoff && state.players[current].kind === 'human' && state.phase === 'playing' && viewIdx === current
  const drawing = interactive && draft.kind === 'drawCards'
  const clickableBirds = interactive && (draft.kind === 'layEggs' || draft.kind === 'playBird')

  return (
    <>
      {handoff && <HandoffOverlay name={viewed.name} onReady={() => setRevealedTo(viewIdx)} />}
      <main inert={handoff} className="min-h-screen bg-linear-to-b from-emerald-50 to-stone-100 p-2 text-stone-900 sm:p-3 md:p-4">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:gap-3">
          <RoundTracker state={state} onQuit={onQuit} />
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="flex min-w-0 flex-col gap-3">
              <Hand
                cards={viewed.hand}
                selected={draft.kind === 'playBird' ? draft.cardId : null}
                isPlayable={(id) => !interactive || canPlayCard(state, id)}
                onSelect={interactive ? (id) => setDraft(startPlayBird(state, id)) : undefined}
              />
              <CardTray
                tray={state.tray}
                deckCount={state.deck.length}
                pickedTray={pickedTray(draft)}
                pickedDeck={pickedDeck(draft)}
                onPickTray={drawing ? (i) => setDraft(pickTray(state, draft, i)) : undefined}
                onPickDeck={drawing ? () => setDraft(pickDeck(state, draft)) : undefined}
              />
              <Board
                player={viewed}
                active={viewIdx === current}
                turnsLeft={state.turnsLeft[viewIdx]}
                onAction={interactive ? (h) => setDraft(startHabitatAction(state, h)) : undefined}
                onBirdClick={clickableBirds ? (slot) => setDraft(clickBird(state, draft, slot)) : undefined}
                eggDelta={interactive ? (slot) => boardEggDelta(draft, slot) : undefined}
                nextSlot={interactive && draft.kind === 'playBird' ? draft.habitat : null}
              />
            </div>
            {/*
              lg+: sticky within its grid column so the action panel and log stay in view while
              the board and hand scroll. `self-start` stops the grid stretching it to the row's
              full height (which would leave sticky nothing to do); it scrolls internally if
              taller than the window.
            */}
            <aside className="flex flex-col gap-3 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:self-start lg:overflow-y-auto">
              <div className="hidden lg:block">
                <ActionPanel state={state} draft={draft} setDraft={setDraft} onConfirm={dispatch} />
              </div>
              <GameLog log={state.log} />
            </aside>
            {state.players.map((p, i) =>
              i === viewIdx ? null : <Board key={p.id} player={p} active={i === current} turnsLeft={state.turnsLeft[i]} />,
            )}
            {/*
            Below lg the action panel is docked to the bottom of the screen. It is `sticky`
            as the last child of the page column, so it stays in view while scrolling but
            settles into its own space at the end and never permanently covers content.
          */}
            <div className="sticky bottom-0 z-20 -mx-2 max-h-[55vh] overflow-y-auto px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden">
              <ActionPanel state={state} draft={draft} setDraft={setDraft} onConfirm={dispatch} docked />
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
