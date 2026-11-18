import { useEffect, useReducer } from 'react'
import GameScreen from './components/GameScreen'
import ScoreScreen from './components/ScoreScreen'
import StartScreen from './components/StartScreen'
import { chooseAction } from './game/bot'
import { reduce } from './game/engine'
import { createGame } from './game/setup'
import type { GameAction, GameState, PlayerConfig } from './game/types'

const BOT_DELAY_MS = 900

type AppAction = GameAction | { type: 'newGame'; players: PlayerConfig[]; seed: number } | { type: 'quit' }

function appReduce(state: GameState | null, action: AppAction): GameState | null {
  switch (action.type) {
    case 'newGame':
      return createGame(action.seed, action.players)
    case 'quit':
      return null
    default:
      return state ? reduce(state, action) : state
  }
}

function newSeed(): number {
  return Math.floor(Math.random() * 2 ** 31)
}

function App() {
  const [game, dispatch] = useReducer(appReduce, null)

  // Bots take their turn after a short pause so humans can follow along.
  useEffect(() => {
    if (!game || game.phase !== 'playing') return
    const idx = game.currentPlayer
    if (game.players[idx].kind !== 'bot') return
    const timer = setTimeout(() => dispatch(chooseAction(game, idx)), BOT_DELAY_MS)
    return () => clearTimeout(timer)
  }, [game])

  if (!game) {
    return <StartScreen onStart={(players) => dispatch({ type: 'newGame', players, seed: newSeed() })} />
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
