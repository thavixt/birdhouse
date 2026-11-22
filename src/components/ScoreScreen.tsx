import { useTranslation } from 'react-i18next'
import { finalStandings } from '../game/scoring'
import Board from './Board'
import FullscreenButton from './FullscreenButton'
import LanguageSwitch from './LanguageSwitch'
import { useGame, useGameStore } from '../store/gameStore'

const MEDALS = ['🥇', '🥈', '🥉']

export default function ScoreScreen() {
  const { t } = useTranslation()
  const state = useGame()
  const onRematch = useGameStore((s) => s.rematch)
  const onMenu = useGameStore((s) => s.quit)
  const standings = finalStandings(state)
  const winner = state.players[standings[0].playerIdx]
  const shared = standings.filter((s) => s.rank === 1).length > 1
  return (
    <main className="min-h-screen bg-linear-to-b from-emerald-50 to-stone-100 p-2 text-stone-900 sm:p-4">
      <div className="mx-auto flex max-w-4xl flex-col gap-2 sm:gap-4">
        <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-lg sm:p-6">
          <div className="flex justify-end gap-2">
            <LanguageSwitch />
            <FullscreenButton />
          </div>
          <h1 className="mt-2 text-center text-2xl font-bold text-emerald-900 sm:text-3xl">
            {shared ? t('score.tie') : t('score.winner', { name: winner.name })}
          </h1>
          {/* Scrolls sideways on narrow phones rather than squeezing the columns. */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-stone-500 uppercase">
                <tr>
                  <th className="py-1">{t('score.rank')}</th>
                  <th>{t('score.player')}</th>
                  <th className="text-right">{t('score.birds')}</th>
                  <th className="text-right">{t('score.eggs')}</th>
                  <th className="text-right">{t('score.food')}</th>
                  <th className="text-right">{t('score.goals')}</th>
                  <th className="text-right">{t('score.total')}</th>
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
          </div>
          <div className="mt-5 flex justify-center gap-3">
            <button
              type="button"
              onClick={onRematch}
              className="cursor-pointer rounded-md bg-violet-700 px-4 py-2 font-semibold text-white hover:bg-violet-800"
            >
              {t('score.playAgain')}
            </button>
            <button type="button" onClick={onMenu} className="cursor-pointer rounded-md bg-stone-200 px-4 py-2 font-semibold hover:bg-stone-300">
              {t('score.mainMenu')}
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
