import { useTranslation } from 'react-i18next'
import type { LeaderboardEntry } from '../game/leaderboard'

const MEDALS = ['🥇', '🥈', '🥉']

/** The play mode a stored line-up amounts to (same labels as the start screen's modes). */
function modeKey(e: LeaderboardEntry): string {
  if (e.players - e.bots >= 2) return 'start.hotSeat'
  return e.players > 1 ? 'start.vsBot' : 'start.alone'
}

/** Top scores of winners of finished games, best first. */
export default function Leaderboard({ entries }: { entries: LeaderboardEntry[] }) {
  const { t, i18n } = useTranslation()
  return (
    <section className="flex flex-col gap-2 border-t border-stone-200 pt-4">
      <h2 className="text-sm font-bold text-stone-700">🏆 {t('leaderboard.title')}</h2>
      {entries.length === 0 ? (
        <p className="text-sm text-stone-500 italic">{t('leaderboard.empty')}</p>
      ) : (
        <ol className="flex flex-col gap-1 text-sm">
          {entries.map((e, i) => (
            <li key={`${e.date}-${e.name}-${i}`} className="flex items-center gap-2 rounded-md px-2 py-1 odd:bg-stone-50">
              <span className="w-6 shrink-0 text-center" aria-label={t('leaderboard.rank', { rank: i + 1 })}>
                {MEDALS[i] ?? `${i + 1}.`}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{e.name}</div>
                <div className="truncate text-xs text-stone-500">
                  {t(modeKey(e))} · {new Date(e.date).toLocaleDateString(i18n.language)}
                </div>
              </div>
              <span className="shrink-0 font-bold text-emerald-900">{t('leaderboard.points', { count: e.score })}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
