import { DndContext, DragOverlay, MouseSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { lazy, Suspense, useState } from 'react'
import {
  addDrawPick,
  boardEggDelta,
  canDrag,
  canDrop,
  canPlayCard,
  clickBird,
  drop,
  isFirstTurn,
  needsHandoff,
  pickDeck,
  pickedDeck,
  pickedTray,
  pickTray,
  startHabitatAction,
  startPlayBird,
  viewedPlayer,
  type DragItem,
  type DropTarget,
} from '../draft'
import { drawCount } from '../game/engine'
import { gameLog } from '../game/logger'
import type { GameAction, GameState } from '../game/types'
import { useTurnDraft } from '../hooks/useTurnDraft'
import ActionPanel from './ActionPanel'
import BirdInfo from './BirdInfo'
import Board from './Board'
import BotTurnOverlay from './BotTurnOverlay'
import CardTray from './CardTray'
import DragPreview from './DragPreview'
import DropZone from './DropZone'
import GameLog from './GameLog'
import HandoffOverlay from './HandoffOverlay'
import Hand from './Hand'
import RoundTracker from './RoundTracker'

// Loaded only when a tour runs (the tutorial is off by default), keeping react-joyride out of the main bundle.
const TutorialTour = lazy(() => import('./TutorialTour'))

/** lg+: the sidebar spans one grid row per board (own + opponents), so it stays sticky down the page. */
const SIDEBAR_ROWS = ['', 'lg:row-span-1', 'lg:row-span-2', 'lg:row-span-3', 'lg:row-span-4']

type Props = {
  state: GameState
  dispatch: (action: GameAction) => void
  onQuit: () => void
  /** Show the guided tour on each human's first turn (start screen switch). */
  tutorial?: boolean
}

/** In-game layout. What each click does to the turn draft lives in `src/draft.ts`. */
export default function GameScreen({ state, dispatch, onQuit, tutorial = false }: Props) {
  const [draft, setDraft] = useTurnDraft(state)
  // Hot-seat: the human whose hand is currently uncovered (null until someone reveals).
  const [revealedTo, setRevealedTo] = useState<number | null>(null)

  const current = state.currentPlayer
  const viewIdx = viewedPlayer(state, revealedTo)
  const viewed = state.players[viewIdx]
  const handoff = needsHandoff(state, revealedTo)
  const interactive =
    !handoff && state.players[current].kind === 'human' && state.phase === 'playing' && viewIdx === current
  const clickableBirds = interactive && (draft.kind === 'layEggs' || draft.kind === 'playBird')
  // Tray and deck clicks start the draw action if it isn't already in progress.
  const canPickCards = interactive && drawCount(state, current) > 0
  // Tutorial: once per human, on their first turn; finishing or skipping it marks them done.
  const [toured, setToured] = useState<number[]>([])
  const showTour = tutorial && interactive && isFirstTurn(state) && !toured.includes(current)

  function revealHand() {
    gameLog('info', `Handoff · ${viewed.name} revealed their hand`, state)
    setRevealedTo(viewIdx)
    setInspected(null) // it may show a card from the previous player's hand
  }

  // The bird shown in the info card below the log: the last bird card clicked (or dragged).
  const [inspected, setInspected] = useState<string | null>(null)

  // A click on a tray card toggles it while drawing; otherwise it starts the draw with it.
  function onPickTray(index: number) {
    setInspected(state.tray[index])
    setDraft(draft.kind === 'drawCards' ? pickTray(state, draft, index) : addDrawPick(state, draft, { from: 'tray', index }))
  }
  function onPickDeck() {
    setDraft(draft.kind === 'drawCards' ? pickDeck(state, draft) : addDrawPick(state, draft, { from: 'deck' }))
  }

  // Drag and drop (table-style shortcuts; see "Drag and drop" in draft.ts).
  // Mouse: drag after moving 6px, so clicks still work. Touch: press and hold, so swiping
  // still scrolls the hand and tray.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  )
  const [dragging, setDragging] = useState<DragItem | null>(null)
  const accepts = (target: DropTarget) => dragging !== null && canDrop(state, draft, dragging, target)
  const dragEnabled = (item: DragItem) => interactive && canDrag(state, draft, item)

  function onDragEnd({ active, over }: DragEndEvent) {
    setDragging(null)
    const item = active.data.current as DragItem | undefined
    const target = over?.data.current as DropTarget | undefined
    if (!interactive || !item || !target) return
    const result = drop(state, draft, item, target)
    if (result && 'action' in result) dispatch(result.action)
    else if (result) setDraft(result.draft)
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={({ active }) => {
        const item = (active.data.current as DragItem | undefined) ?? null
        setDragging(item)
        if (item?.kind === 'hand') setInspected(item.cardId)
        else if (item?.kind === 'tray') setInspected(state.tray[item.index])
      }}
      onDragEnd={onDragEnd}
      onDragCancel={() => setDragging(null)}
    >
      {/* Keyed by player so the next human's tour starts from the first step. */}
      {showTour && (
        <Suspense fallback={null}>
          <TutorialTour key={current} name={viewed.name} onDone={() => setToured([...toured, current])} />
        </Suspense>
      )}
      {!handoff && state.phase === 'playing' && state.players[current].kind === 'bot' && (
        <BotTurnOverlay name={state.players[current].name} />
      )}
      {handoff && <HandoffOverlay name={viewed.name} onQuit={onQuit} onReady={revealHand} />}
      <main inert={handoff} className="min-h-screen bg-linear-to-b from-emerald-50 to-stone-100 p-2 text-stone-900 sm:p-3 md:p-4">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:gap-3 relative">
          <RoundTracker className="lg:sticky z-100 top-0" state={state} onQuit={onQuit} />
          {/*
            lg+: sidebar (action panel + log) on the left, boards on the right. Items are placed
            explicitly so the DOM order, and with it the phone layout, stays boards-first.
          */}
          <div className="grid gap-3 lg:grid-cols-[20rem_minmax(0,1fr)]">
            <div className="flex min-w-0 flex-col gap-3 lg:col-start-2 lg:row-start-1">
              <DropZone target={{ kind: 'hand' }} enabled={accepts({ kind: 'hand' })}>
                <Hand
                  cards={viewed.hand}
                  selected={draft.kind === 'playBird' ? draft.cardId : null}
                  isPlayable={(id) => !interactive || canPlayCard(state, id)}
                  onSelect={
                    interactive
                      ? (id) => {
                        setInspected(id)
                        setDraft(startPlayBird(state, id))
                      }
                      : undefined
                  }
                  onInspect={setInspected}
                  draggable={interactive}
                />
              </DropZone>
              <CardTray
                tray={state.tray}
                deckCount={state.deck.length}
                discardCount={state.discard.length}
                pickedTray={pickedTray(draft)}
                pickedDeck={pickedDeck(draft)}
                onPickTray={canPickCards ? onPickTray : undefined}
                onPickDeck={canPickCards ? onPickDeck : undefined}
                canDrag={interactive ? dragEnabled : undefined}
                onInspect={setInspected}
              />
              <div data-tour="board">
                <Board
                  player={viewed}
                  active={viewIdx === current}
                  turnsLeft={state.turnsLeft[viewIdx]}
                  onAction={interactive ? (h) => setDraft(startHabitatAction(h)) : undefined}
                  onBirdClick={
                    clickableBirds
                      ? (slot) => {
                        setInspected(viewed.board[slot.habitat][slot.index].cardId)
                        setDraft(clickBird(state, draft, slot))
                      }
                      : undefined
                  }
                  onInspect={setInspected}
                  eggDelta={interactive ? (slot) => boardEggDelta(draft, slot) : undefined}
                  nextSlot={interactive && draft.kind === 'playBird' ? draft.habitat : null}
                  canDropOn={interactive ? (habitat) => accepts({ kind: 'habitat', habitat }) : undefined}
                />
              </div>
            </div>
            {/*
              lg+: sticky within its grid column so the action panel and log stay in view while
              the board and hand scroll. `self-start` stops the grid stretching it to the row's
              full height (which would leave sticky nothing to do); it scrolls internally if
              taller than the window.
            */}
            <aside className={`flex flex-col gap-3 lg:col-start-1 lg:row-start-1 ${SIDEBAR_ROWS[state.players.length]} lg:sticky lg:top-24 lg:max-h-[calc(100vh-2rem)] lg:self-start lg:overflow-y-auto`}>
              <div data-tour="panel" className="hidden lg:block">
                <ActionPanel state={state} draft={draft} setDraft={setDraft} onConfirm={dispatch} />
              </div>
              {inspected && <BirdInfo cardId={inspected} onClose={() => setInspected(null)} />}
              <GameLog log={state.log} />
            </aside>
            {state.players.map((p, i) =>
              i === viewIdx ? null : (
                <div key={p.id} className="lg:col-start-2">
                  <Board player={p} active={i === current} turnsLeft={state.turnsLeft[i]} onInspect={setInspected} />
                </div>
              ),
            )}
            {/*
            Below lg the action panel is docked to the bottom of the screen. It is `sticky`
            as the last child of the page column, so it stays in view while scrolling but
            settles into its own space at the end and never permanently covers content.
          */}
            <div data-tour="panel" className="sticky bottom-0 z-20 -mx-2 max-h-[55vh] overflow-y-auto px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden">
              <ActionPanel state={state} draft={draft} setDraft={setDraft} onConfirm={dispatch} docked />
            </div>
          </div>
        </div>
      </main>
      {/* Follows the pointer; null drop animation so a committed move doesn't fly back. */}
      <DragOverlay dropAnimation={null}>{dragging && <DragPreview item={dragging} state={state} />}</DragOverlay>
    </DndContext>
  )
}
