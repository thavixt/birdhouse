// The app's game state in one zustand store: the game itself (changed only through the
// engine's pure `reduce`) plus the UI state of the turn in progress, which used to be spread
// over App's reducer, GameScreen's useState calls and the useTurnDraft hook and passed down
// as props. Components read what they need with `useGameStore(selector)`.
import { create } from 'zustand'
import {
  clickDeck,
  clickHandCard,
  clickItem,
  clickTrayCard,
  describeDraft,
  drop,
  IDLE,
  isClickLike,
  needsHandoff,
  viewedPlayer,
  type Draft,
  type DragItem,
  type DropTarget,
} from '../draft'
import { reduce } from '../game/engine'
import { gameLog } from '../game/logger'
import { createGame } from '../game/setup'
import type { GameAction, GameState, PlayerConfig } from '../game/types'
import { clearSavedGame, loadSavedGame, recordWinners, saveGame } from '../persistence'

export type GameStore = {
  /** The game on screen; null on the start screen. */
  game: GameState | null
  /** An unfinished game that can be continued from the start screen. */
  resumable: GameState | null
  /** Guided tour on each human's first turn (start screen switch). Not saved: a continued game has none. */
  tutorial: boolean

  // ---- the turn in progress (UI only, never saved; reset by every game action)
  /** The human's choices before Confirm. */
  draft: Draft
  /** Hot-seat: the human whose hand is currently uncovered (null until someone reveals). */
  revealedTo: number | null
  /** The bird shown in the info card: the last bird card clicked (or dragged). */
  inspected: string | null
  /** Players who finished or skipped the tutorial tour this game. */
  toured: number[]

  // ---- game lifecycle
  newGame: (players: PlayerConfig[], tutorial?: boolean) => void
  /** Same line-up, new seed, no tutorial. */
  rematch: () => void
  resume: () => void
  quit: () => void
  /** Applies a game action through the engine; saves, and records winners once the game ends. */
  dispatch: (action: GameAction) => void

  // ---- turn UI
  setDraft: (draft: Draft) => void
  inspect: (cardId: string | null) => void
  revealHand: () => void
  finishTour: (playerIdx: number) => void
  /** Click on the current player's hand card at `index` (see `clickHandCard`). */
  clickHandCard: (index: number) => void
  clickTrayCard: (index: number) => void
  clickDeck: () => void
  /** End of a drag: drop it on `target`, or, if it moved only a little, treat it as a click. */
  endDrag: (item: DragItem, target: DropTarget | null, delta: { x: number; y: number }) => void
}

/** Turn UI state for a fresh screen (new game, continue, quit). */
const FRESH_TURN = { draft: IDLE, revealedTo: null, inspected: null, toured: [] } satisfies Partial<GameStore>

function newSeed(): number {
  return Math.floor(Math.random() * 2 ** 31)
}

function initialState() {
  const saved = loadSavedGame()
  return { game: null, resumable: saved?.phase === 'playing' ? saved : null, tutorial: false, ...FRESH_TURN }
}

export const useGameStore = create<GameStore>()((set, get) => {
  /** The game, for actions that only make sense during one. */
  const playing = () => {
    const { game } = get()
    return game && game.phase === 'playing' ? game : null
  }

  return {
    ...initialState(),

    newGame: (players, tutorial = false) => {
      const seed = newSeed()
      const game = createGame(seed, players)
      gameLog('info', `New game · seed ${seed} · ${players.map((p) => `${p.name} (${p.kind})`).join(', ')}`, {
        goals: game.goals,
        state: game,
      })
      set({ game, resumable: null, tutorial, ...FRESH_TURN })
      saveGame(game)
    },

    rematch: () => {
      const { game } = get()
      if (game) get().newGame(game.players.map(({ name, kind }) => ({ name, kind })))
    },

    resume: () => {
      const { resumable } = get()
      if (!resumable) return
      gameLog('info', `Continuing saved game (round ${resumable.round})`, resumable)
      set({ game: resumable, resumable: null, tutorial: false, ...FRESH_TURN })
    },

    quit: () => {
      const { game } = get()
      const keep = game?.phase === 'playing'
      gameLog('info', keep ? 'Quit to menu (game kept for Continue)' : 'Back to menu')
      set({ game: null, resumable: keep ? game : null, tutorial: false, ...FRESH_TURN })
    },

    dispatch: (action) => {
      const { game } = get()
      if (!game) return
      const next = reduce(game, action)
      if (next === game) return // rejected: the engine logged why; keep the draft
      set({ game: next, draft: IDLE })
      if (next.phase === 'playing') {
        saveGame(next)
      } else {
        // Only the action that ends the game gets here (later ones are rejected), so the
        // winners are recorded exactly once.
        clearSavedGame()
        recordWinners(next)
      }
    },

    setDraft: (draft) => {
      const { game, draft: current } = get()
      if (!game || draft === current) return // a click that changed nothing (e.g. no room for another egg)
      gameLog('info', `Turn draft · ${game.players[game.currentPlayer].name}: ${describeDraft(draft)}`, { draft, state: game })
      set({ draft })
    },

    inspect: (inspected) => set({ inspected }),

    revealHand: () => {
      const game = playing()
      if (!game) return
      const viewIdx = viewedPlayer(game, get().revealedTo)
      gameLog('info', `Handoff · ${game.players[viewIdx].name} revealed their hand`, game)
      // The info card may show a card from the previous player's hand.
      set({ revealedTo: viewIdx, inspected: null })
    },

    finishTour: (playerIdx) => set(({ toured }) => ({ toured: [...toured, playerIdx] })),

    clickHandCard: (index) => {
      const game = playing()
      if (!game) return
      const cardId = game.players[game.currentPlayer].hand[index]
      if (cardId !== undefined) set({ inspected: cardId })
      get().setDraft(clickHandCard(game, get().draft, index))
    },

    clickTrayCard: (index) => {
      const game = playing()
      if (!game) return
      set({ inspected: game.tray[index] })
      get().setDraft(clickTrayCard(game, get().draft, index))
    },

    clickDeck: () => {
      const game = playing()
      if (game) get().setDraft(clickDeck(game, get().draft))
    },

    endDrag: (item, target, delta) => {
      const game = playing()
      if (!game) return
      const { draft, dispatch, setDraft } = get()
      const result = target ? drop(game, draft, item, target) : null
      if (result && 'action' in result) dispatch(result.action)
      else if (result) setDraft(result.draft)
      else if (isClickLike(delta)) setDraft(clickItem(game, draft, item))
    },
  }
})

/** The game on screen. Only for components rendered during a game (GameScreen, ScoreScreen and below). */
export function useGame(): GameState {
  const game = useGameStore((s) => s.game)
  if (!game) throw new Error('useGame() used outside a game')
  return game
}

/** Who is acting, whose hand is shown, and whether the screen may take input. */
export type TurnView = {
  current: number
  /** Whose hand and board are shown up top. */
  viewIdx: number
  /** Hot-seat cover is up. */
  handoff: boolean
  /** The viewed player is the acting human and the screen is uncovered. */
  interactive: boolean
}

export function turnView(game: GameState, revealedTo: number | null): TurnView {
  const current = game.currentPlayer
  const viewIdx = viewedPlayer(game, revealedTo)
  const handoff = needsHandoff(game, revealedTo)
  const interactive = !handoff && game.players[current].kind === 'human' && game.phase === 'playing' && viewIdx === current
  return { current, viewIdx, handoff, interactive }
}

/** `turnView` for the game on screen. */
export function useTurnView(): TurnView {
  const game = useGame()
  const revealedTo = useGameStore((s) => s.revealedTo)
  return turnView(game, revealedTo)
}
