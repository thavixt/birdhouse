import { useEffect, useState } from 'react'
import GameScreen from './components/GameScreen'
import ScoreScreen from './components/ScoreScreen'
import StartScreen from './components/StartScreen'
import WelcomeOverlay from './components/WelcomeOverlay'
import { chooseAction } from './game/bot'
import { hasSeenWelcome, markWelcomeSeen, saveWhenLeaving } from './persistence'
import { useGameStore } from './store/gameStore'

/** A bot takes 1–3 s per turn (random), so its moves are easy to follow and never flash past. */
const BOT_DELAY_MS = { min: 1000, max: 3000 }

/** UI pacing only: game randomness stays in the seeded RNG, so this can use Math.random. */
function botDelay(): number {
  return BOT_DELAY_MS.min + Math.random() * (BOT_DELAY_MS.max - BOT_DELAY_MS.min)
}

/** Picks the screen from the store; saving after each action happens in the store's `dispatch`. */
function App() {
  const game = useGameStore((s) => s.game)
  const dispatch = useGameStore((s) => s.dispatch)
  // First visit only: a welcome overlay, remembered in localStorage once dismissed.
  const [showWelcome, setShowWelcome] = useState(() => !hasSeenWelcome())
  const closeWelcome = () => {
    markWelcomeSeen()
    setShowWelcome(false)
  }

  // Also save when the app may stop running (focus lost, app switched, tab closed), so a
  // failed save is retried.
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
  }, [game, dispatch])

  const screen = !game ? <StartScreen /> : game.phase === 'gameOver' ? <ScoreScreen /> : <GameScreen />
  return (
    <>
      {screen}
      {showWelcome && <WelcomeOverlay onClose={closeWelcome} />}
    </>
  )
}

export default App
