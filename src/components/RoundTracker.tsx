import { GOAL_POINTS, GOALS_BY_ID } from '../game/goals'
import type { GameState } from '../game/types'

type Props = { state: GameState; onHelp: () => void; onQuit: () => void }

export default function RoundTracker({ state, onHelp, onQuit }: Props) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white/80 p-3 shadow-sm">
      <div className="flex items-baseline gap-3">
        <h1 className="text-xl font-bold text-emerald-900">🐦 Birdhouse</h1>
        <span className="text-sm font-semibold">Round {state.round} / 4</span>
      </div>
      <ol className="flex flex-wrap gap-2 text-xs">
        {state.goals.map((id, i) => {
          const done = i + 1 < state.round || state.phase === 'gameOver'
          const current = i + 1 === state.round && !done
          return (
            <li
              key={id}
              className={`rounded-md border px-2 py-1 ${current ? 'border-violet-400 bg-violet-50 font-semibold' : 'border-stone-200'} ${done ? 'text-stone-400 line-through' : ''}`}
              title={`1st place: ${GOAL_POINTS.first[i]} pts, 2nd place: ${GOAL_POINTS.second[i]} pts`}
            >
              R{i + 1}: {GOALS_BY_ID[id].name} ({GOAL_POINTS.first[i]}/{GOAL_POINTS.second[i]})
            </li>
          )
        })}
      </ol>
      <div className="flex gap-2">
        <button type="button" onClick={onHelp} className="cursor-pointer rounded-md bg-stone-200 px-3 py-1 text-sm hover:bg-stone-300">
          Rules
        </button>
        <button type="button" onClick={onQuit} className="cursor-pointer rounded-md bg-stone-200 px-3 py-1 text-sm hover:bg-stone-300">
          Quit
        </button>
      </div>
    </header>
  )
}
