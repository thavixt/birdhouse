import { finalStandings } from '../game/scoring'
import type { GameState } from '../game/types'
import Board from './Board'

type Props = { state: GameState; onRematch: () => void; onMenu: () => void }

const MEDALS = ['🥇', '🥈', '🥉']

export default function ScoreScreen({ state, onRematch, onMenu }: Props) {
  const standings = finalStandings(state)
  const winner = state.players[standings[0].playerIdx]
  const shared = standings.filter((s) => s.rank === 1).length > 1
  return (
    <main className="min-h-screen bg-linear-to-b from-emerald-50 to-stone-100 p-4 text-stone-900">
      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-lg">
          <h1 className="text-center text-3xl font-bold text-emerald-900">{shared ? "It's a tie!" : `${winner.name} wins!`}</h1>
          <table className="mt-4 w-full text-left text-sm">
            <thead className="text-xs text-stone-500 uppercase">
              <tr>
                <th className="py-1">#</th>
                <th>Player</th>
                <th className="text-right">Birds</th>
                <th className="text-right">Eggs</th>
                <th className="text-right">Food</th>
                <th className="text-right">Goals</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {standings.map(({ playerIdx, breakdown, rank }) => (
                <tr key={playerIdx} className="border-t border-stone-200">
                  <td className="py-2">{MEDALS[rank - 1] ?? rank}</td>
                  <td className="font-semibold">{state.players[playerIdx].name}</td>
                  <td className="text-right tabular-nums">{breakdown.birds}</td>
                  <td className="text-right tabular-nums">{breakdown.eggs}</td>
                  <td className="text-right tabular-nums">{breakdown.food}</td>
                  <td className="text-right tabular-nums">{breakdown.goals}</td>
                  <td className="text-right text-base font-bold tabular-nums">{breakdown.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-5 flex justify-center gap-3">
            <button
              type="button"
              onClick={onRematch}
              className="cursor-pointer rounded-md bg-violet-700 px-4 py-2 font-semibold text-white hover:bg-violet-800"
            >
              Play again
            </button>
            <button type="button" onClick={onMenu} className="cursor-pointer rounded-md bg-stone-200 px-4 py-2 font-semibold hover:bg-stone-300">
              Main menu
            </button>
          </div>
        </section>
        {state.players.map((p, i) => (
          <Board key={p.id} player={p} active={false} turnsLeft={state.turnsLeft[i]} />
        ))}
      </div>
    </main>
  )
}
