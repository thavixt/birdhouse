import { useGame, useGameStore } from '../store/gameStore'
import ActionPanel from './ActionPanel'
import BirdInfo from './BirdInfo'
import GameLog from './GameLog'
import PlayerList from './PlayerList'

/**
 * The game screen's side column: players, the action panel (from lg; below that it is docked
 * to the bottom of the screen instead), the bird info card and the log. `className` places it
 * in GameScreen's grid.
 */
export default function GameSidebar({ className }: { className?: string }) {
  const state = useGame()
  const inspected = useGameStore((s) => s.inspected)
  const inspect = useGameStore((s) => s.inspect)
  return (
    <aside className={className}>
      <PlayerList />
      <div data-tour="panel" className="hidden lg:block">
        <ActionPanel />
      </div>
      {inspected && <BirdInfo cardId={inspected} onClose={() => inspect(null)} />}
      <GameLog log={state.log} />
    </aside>
  )
}
