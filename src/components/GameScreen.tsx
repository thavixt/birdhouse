import { DndContext, DragOverlay } from '@dnd-kit/core'
import { cn } from 'cn'
import { lazy, Suspense } from 'react'
import {
  boardEggDelta,
  canPlayCard,
  clickBird,
  isFirstTurn,
  pickedDeck,
  pickedTray,
  selectedHandIndex,
  startHabitatAction,
} from '../draft'
import { useCardDrag } from '../hooks/useCardDrag'
import { useGame, useGameStore, useTurnView } from '../store/gameStore'
import ActionPanel from './ActionPanel'
import Board from './Board'
import BotTurnOverlay from './BotTurnOverlay'
import CardTray from './CardTray'
import DragPreview from './DragPreview'
import DropZone from './DropZone'
import HandoffOverlay from './HandoffOverlay'
import GameSidebar from './GameSidebar'
import Hand from './Hand'
import RoundTracker from './RoundTracker'

// Loaded only when a tour runs (the tutorial is off by default), keeping react-joyride out of the main bundle.
const TutorialTour = lazy(() => import('./TutorialTour'))

/*
  Desktop grid (static class lists so Tailwind sees every class):
  - lg: sidebar | one column. Row 1 is hand + tray, then one row per board.
  - 2xl: sidebar | two columns. Hand + tray span both; the boards fill a 2×2 grid
    (own board first, top left). A solo board spans both columns.
  The sidebar spans every row, so it stays sticky down the whole page.
  Use explicit ranges (`col-[2/4]`, `row-[1/3]`), never `col-span-*` / `row-span-*` next to a
  `*-start-*`: in Tailwind v4 the span utilities set the `grid-column` / `grid-row` shorthand,
  which resets the start line.
*/
const SIDEBAR_ROWS = [
  '',
  'lg:row-[1/3] 2xl:row-[1/3]',
  'lg:row-[1/4] 2xl:row-[1/3]',
  'lg:row-[1/5] 2xl:row-[1/4]',
  'lg:row-[1/6] 2xl:row-[1/4]',
]
/** Grid cell of the k-th board (0 = the viewed player's own board). */
const BOARD_CELLS = [
  'lg:col-start-2 lg:row-start-2 2xl:col-start-2 2xl:row-start-2',
  'lg:col-start-2 lg:row-start-3 2xl:col-start-3 2xl:row-start-2',
  'lg:col-start-2 lg:row-start-4 2xl:col-start-2 2xl:row-start-3',
  'lg:col-start-2 lg:row-start-5 2xl:col-start-3 2xl:row-start-3',
]
/** A solo game's only board spans both board columns from 2xl. */
const SOLO_BOARD_CELL = 'lg:col-start-2 lg:row-start-2 2xl:col-[2/4] 2xl:row-start-2'

/**
 * In-game layout. Game and turn state live in the store (`src/store/gameStore.ts`); what
 * each click does to the turn draft lives in `src/draft.ts`.
 */
export default function GameScreen() {
  const state = useGame()
  const draft = useGameStore((s) => s.draft)
  const tutorial = useGameStore((s) => s.tutorial)
  const toured = useGameStore((s) => s.toured)
  const { setDraft, inspect, revealHand, finishTour, quit } = useGameStore.getState()
  const { current, viewIdx, handoff, interactive } = useTurnView()

  const viewed = state.players[viewIdx]
  // Every other player's index, in seat order: their boards follow the viewed player's own.
  const opponents = state.players.map((_, i) => i).filter((i) => i !== viewIdx)
  const clickableBirds = interactive && (draft.kind === 'layEggs' || draft.kind === 'playBird')
  // Tutorial: once per human, on their first turn; finishing or skipping it marks them done.
  const showTour = tutorial && interactive && isFirstTurn(state) && !toured.includes(current)

  const { dragging, accepts, canDrag, contextProps } = useCardDrag(interactive)

  return (
    <DndContext {...contextProps}>
      {/* Keyed by player so the next human's tour starts from the first step. */}
      {showTour && (
        <Suspense fallback={null}>
          <TutorialTour key={current} name={viewed.name} onDone={() => finishTour(current)} />
        </Suspense>
      )}
      {!handoff && state.phase === 'playing' && state.players[current].kind === 'bot' && (
        <BotTurnOverlay name={state.players[current].name} />
      )}
      {handoff && <HandoffOverlay name={viewed.name} onQuit={quit} onReady={revealHand} />}
      <main inert={handoff} className="min-h-screen bg-linear-to-b from-stone-100 to-emerald-200 p-2 text-stone-900 sm:p-3 md:p-4 select-none">
        <div className="relative mx-auto flex max-w-7xl flex-col gap-2 sm:gap-3 2xl:max-w-363">
          <RoundTracker className="lg:sticky z-10 -top-2" />
          {/* <RoundTracker /> */}
          {/*
            lg+: sidebar (action panel + log) on the left, boards on the right. Items are placed
            explicitly so the DOM order, and with it the phone layout, stays boards-first.
          */}
          <div className="grid gap-3 lg:grid-cols-[20rem_minmax(0,1fr)] 2xl:grid-cols-[20rem_minmax(0,1fr)_minmax(0,1fr)]">
            {/*
              Hand and tray: stacked, or side by side once this area is ≥ 64rem wide (container
              query; the tray alone is ~600px), with the tray at its natural width and the hand
              fanned out in the rest. The `min-w-0` wrappers are required: without them a flex
              item can't shrink below its content, so the hand's fan widens the page.
            */}
            <div className="@container min-w-0 lg:col-start-2 lg:row-start-1 2xl:col-[2/4]">
              <div className="flex flex-col gap-3 @5xl:flex-row @5xl:items-start @5xl:gap-12">
                <div className="min-w-0 @5xl:flex-1">
                  <DropZone target={{ kind: 'hand' }} enabled={accepts({ kind: 'hand' })}>
                    <Hand
                      cards={viewed.hand}
                      selectedIndex={interactive ? selectedHandIndex(state, draft) : null}
                      isPlayable={(id) => !interactive || canPlayCard(state, id)}
                      onCardClick={(i) => inspect(viewed.hand[i])}
                      showHint={interactive}
                      draggable={interactive}
                    />
                  </DropZone>
                </div>
                <div className="min-w-0 @5xl:shrink-0">
                  <CardTray
                    tray={state.tray}
                    deckCount={state.deck.length}
                    discardCount={state.discard.length}
                    pickedTray={pickedTray(draft)}
                    pickedDeck={pickedDeck(draft)}
                    canDrag={interactive ? canDrag : undefined}
                    onInspect={inspect}
                  />
                </div>
              </div>
            </div>
            <div data-tour="board" className={cn('min-w-0', state.players.length === 1 ? SOLO_BOARD_CELL : BOARD_CELLS[0])}>
              <Board
                player={viewed}
                active={viewIdx === current}
                turnsLeft={state.turnsLeft[viewIdx]}
                onAction={interactive ? (h) => setDraft(startHabitatAction(h)) : undefined}
                onBirdClick={
                  clickableBirds
                    ? (slot) => {
                      inspect(viewed.board[slot.habitat][slot.index].cardId)
                      setDraft(clickBird(state, draft, slot))
                    }
                    : undefined
                }
                onInspect={inspect}
                eggDelta={interactive ? (slot) => boardEggDelta(draft, slot) : undefined}
                nextSlot={interactive && draft.kind === 'playBird' ? draft.habitat : null}
                canDropOn={interactive ? (habitat) => accepts({ kind: 'habitat', habitat }) : undefined}
              />
            </div>
            {/*
              lg+: sticky within its grid column so the action panel and log stay in view while
              the board and hand scroll. `self-start` stops the grid stretching it to the row's
              full height (which would leave sticky nothing to do); it scrolls internally if
              taller than the window.
            */}
            <GameSidebar
              className={`flex flex-col gap-3 lg:col-start-1 ${SIDEBAR_ROWS[state.players.length]} lg:sticky lg:top-22 lg:max-h-[calc(100vh-2rem)] lg:self-start lg:overflow-y-auto`}
            />
            {opponents.map((i, k) => {
              const p = state.players[i]
              return (
                <div key={p.id} className={cn('min-w-0', BOARD_CELLS[k + 1])}>
                  <Board player={p} active={i === current} turnsLeft={state.turnsLeft[i]} onInspect={inspect} />
                </div>
              )
            })}
            {/*
            Below lg the action panel is docked to the bottom of the screen. It is `sticky`
            as the last child of the page column, so it stays in view while scrolling but
            settles into its own space at the end and never permanently covers content.
          */}
            <div data-tour="panel" className="sticky bottom-0 z-20 -mx-2 max-h-[55vh] overflow-y-auto px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden">
              <ActionPanel docked />
            </div>
          </div>
        </div>
      </main>
      {/* Follows the pointer; null drop animation so a committed move doesn't fly back. */}
      <DragOverlay dropAnimation={null}>{dragging && <DragPreview item={dragging} />}</DragOverlay>
    </DndContext>
  )
}
