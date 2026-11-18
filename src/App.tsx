import { useEffect, useReducer } from 'react'
import GameScreen from './components/GameScreen'
import ScoreScreen from './components/ScoreScreen'
import StartScreen from './components/StartScreen'
import { chooseAction } from './game/bot'
import { reduce } from './game/engine'
import { createGame } from './game/setup'
import type { GameAction, GameState, PlayerConfig } from './game/types'
import { clearSavedGame, loadSavedGame, saveGame } from './persistence'

const BOT_DELAY_MS = 900

type AppState = {
  game: GameState | null
  /** An unfinished game that can be continued from the start screen. */
  resumable: GameState | null
}

type AppAction =
  | GameAction
  | { type: 'newGame'; players: PlayerConfig[]; seed: number }
  | { type: 'resume' }
  | { type: 'quit' }

function appReduce(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'newGame':
      return { game: createGame(action.seed, action.players), resumable: null }
    case 'resume':
      return { game: state.resumable, resumable: null }
    case 'quit':
      return { game: null, resumable: state.game?.phase === 'playing' ? state.game : null }
    default:
      return state.game ? { ...state, game: reduce(state.game, action) } : state
  }
}

function init(): AppState {
  const saved = loadSavedGame()
  return { game: null, resumable: saved?.phase === 'playing' ? saved : null }
}

function newSeed(): number {
  return Math.floor(Math.random() * 2 ** 31)
}

function App() {
  const [{ game, resumable }, dispatch] = useReducer(appReduce, undefined, init)

  // Keep the saved game in sync: save after every action, forget it once finished.
  useEffect(() => {
    if (!game) return
    if (game.phase === 'playing') saveGame(game)
    else clearSavedGame()
  }, [game])

  // Bots take their turn after a short pause so humans can follow along.
  useEffect(() => {
    if (!game || game.phase !== 'playing') return
    const idx = game.currentPlayer
    if (game.players[idx].kind !== 'bot') return
    const timer = setTimeout(() => dispatch(chooseAction(game, idx)), BOT_DELAY_MS)
    return () => clearTimeout(timer)
  }, [game])

  if (!game) {
    return (
      <StartScreen
        resumable={resumable}
        onResume={() => dispatch({ type: 'resume' })}
        onStart={(players) => dispatch({ type: 'newGame', players, seed: newSeed() })}
      />
    )
  }
  if (game.phase === 'gameOver') {
    const configs = game.players.map(({ name, kind }) => ({ name, kind }))
    return (
      <ScoreScreen
        state={game}
        onRematch={() => dispatch({ type: 'newGame', players: configs, seed: newSeed() })}
        onMenu={() => dispatch({ type: 'quit' })}
      />
    )
  }
  return <GameScreen state={game} dispatch={dispatch} onQuit={() => dispatch({ type: 'quit' })} />
}

export default App
