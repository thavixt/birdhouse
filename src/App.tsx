import { useEffect, useReducer, useRef, useState } from 'react'
import GameScreen from './components/GameScreen'
import ScoreScreen from './components/ScoreScreen'
import StartScreen from './components/StartScreen'
import WelcomeOverlay from './components/WelcomeOverlay'
import { chooseAction } from './game/bot'
import { reduce } from './game/engine'
import { gameLog, logOnce } from './game/logger'
import { createGame } from './game/setup'
import type { GameAction, GameState, PlayerConfig } from './game/types'
import {
  clearSavedGame,
  hasSeenWelcome,
  loadSavedGame,
  markWelcomeSeen,
  recordWinners,
  saveGame,
  saveWhenLeaving,
} from './persistence'

/** A bot takes 1–3 s per turn (random), so its moves are easy to follow and never flash past. */
const BOT_DELAY_MS = { min: 1000, max: 3000 }

/** UI pacing only: game randomness stays in the seeded RNG, so this can use Math.random. */
function botDelay(): number {
  return BOT_DELAY_MS.min + Math.random() * (BOT_DELAY_MS.max - BOT_DELAY_MS.min)
}

type AppState = {
  game: GameState | null
  /** An unfinished game that can be continued from the start screen. */
  resumable: GameState | null
  /** Guided tour on each human's first turn (start screen switch). Not saved: a continued game has none. */
  tutorial: boolean
}

type AppAction =
  | GameAction
  | { type: 'newGame'; players: PlayerConfig[]; seed: number; tutorial?: boolean }
  | { type: 'resume' }
  | { type: 'quit' }

function appReduce(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'newGame': {
      const game = createGame(action.seed, action.players)
      logOnce(action, () =>
        gameLog('info', `New game · seed ${action.seed} · ${action.players.map((p) => `${p.name} (${p.kind})`).join(', ')}`, {
          goals: game.goals,
          state: game,
        }),
      )
      return { game, resumable: null, tutorial: action.tutorial ?? false }
    }
    case 'resume':
      logOnce(action, () => gameLog('info', `Continuing saved game (round ${state.resumable?.round})`, state.resumable))
      return { game: state.resumable, resumable: null, tutorial: false }
    case 'quit': {
      const keep = state.game?.phase === 'playing'
      logOnce(action, () => gameLog('info', keep ? 'Quit to menu (game kept for Continue)' : 'Back to menu'))
      return { game: null, resumable: keep ? state.game : null, tutorial: false }
    }
    default:
      return state.game ? { ...state, game: reduce(state.game, action) } : state
  }
}

function init(): AppState {
  const saved = loadSavedGame()
  return { game: null, resumable: saved?.phase === 'playing' ? saved : null, tutorial: false }
}

function newSeed(): number {
  return Math.floor(Math.random() * 2 ** 31)
}

function App() {
  const [{ game, resumable, tutorial }, dispatch] = useReducer(appReduce, undefined, init)
  // First visit only: a welcome overlay, remembered in localStorage once dismissed.
  const [showWelcome, setShowWelcome] = useState(() => !hasSeenWelcome())
  const closeWelcome = () => {
    markWelcomeSeen()
    setShowWelcome(false)
  }

  // Keep the saved game in sync: save after every action, forget it once finished.
  // A finished game's winners go on the leaderboard, exactly once per game.
  const recorded = useRef<GameState | null>(null)
  useEffect(() => {
    if (!game) return
    if (game.phase === 'playing') {
      saveGame(game)
      return
    }
    clearSavedGame()
    if (recorded.current !== game) {
      recorded.current = game
      recordWinners(game)
    }
  }, [game])

  // Also save when the app may stop running (focus lost, app switched, tab closed), so a
  // failed save is retried and nothing depends on the effect above having run.
  useEffect(() => {
    if (!game || game.phase !== 'playing') return
    return saveWhenLeaving(game)
  }, [game])

  // Bots take their turn after a short pause so humans can follow along.
  useEffect(() => {
    if (!game || game.phase !== 'playing') return
    const idx = game.currentPlayer
    if (game.players[idx].kind !== 'bot') return
    const timer = setTimeout(() => dispatch(chooseAction(game, idx)), botDelay())
    return () => clearTimeout(timer)
  }, [game])

  let screen
  if (!game) {
    screen = (
      <StartScreen
        resumable={resumable}
        onResume={() => dispatch({ type: 'resume' })}
        onStart={(players, withTutorial) => dispatch({ type: 'newGame', players, seed: newSeed(), tutorial: withTutorial })}
      />
    )
  } else if (game.phase === 'gameOver') {
    const configs = game.players.map(({ name, kind }) => ({ name, kind }))
    screen = (
      <ScoreScreen
        state={game}
        onRematch={() => dispatch({ type: 'newGame', players: configs, seed: newSeed() })}
        onMenu={() => dispatch({ type: 'quit' })}
      />
    )
  } else {
    screen = <GameScreen state={game} dispatch={dispatch} onQuit={() => dispatch({ type: 'quit' })} tutorial={tutorial} />
  }
  return (
    <>
      {screen}
      {showWelcome && <WelcomeOverlay onClose={closeWelcome} />}
    </>
  )
}

export default App
