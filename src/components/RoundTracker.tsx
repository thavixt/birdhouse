import { useTranslation } from 'react-i18next'
import { GOAL_POINTS } from '../game/goals'
import type { GameState } from '../game/types'
import LanguageSwitch from './LanguageSwitch'

type Props = { state: GameState; onHelp: () => void; onQuit: () => void }

export default function RoundTracker({ state, onHelp, onQuit }: Props) {
  const { t } = useTranslation()
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white/80 p-3 shadow-sm">
      <div className="flex items-baseline gap-3">
        <h1 className="text-xl font-bold text-emerald-900">🐦 {t('app.title')}</h1>
        <span className="text-sm font-semibold">{t('tracker.round', { round: state.round })}</span>
        <div className="flex items-center gap-2">
          <LanguageSwitch />
          <button type="button" onClick={onHelp} className="cursor-pointer rounded-md bg-stone-200 px-3 py-1 text-sm hover:bg-stone-300">
            {t('tracker.rules')}
          </button>
          <button type="button" onClick={onQuit} className="cursor-pointer rounded-md bg-stone-200 px-3 py-1 text-sm hover:bg-stone-300">
            {t('tracker.quit')}
          </button>
        </div>
      </div>
      <ol className="flex flex-wrap gap-2 text-xs">
        {state.goals.map((id, i) => {
          const done = i + 1 < state.round || state.phase === 'gameOver'
          const current = i + 1 === state.round && !done
          const points = { first: GOAL_POINTS.first[i], second: GOAL_POINTS.second[i] }
          return (
            <li
              key={id}
              className={`rounded-md border px-2 py-1 ${current ? 'border-violet-400 bg-violet-50 font-semibold' : 'border-stone-200'} ${done ? 'text-stone-400 line-through' : ''}`}
              title={t('tracker.goalTitle', points)}
            >
              {t('tracker.goal', { round: i + 1, name: t(`goals.${id}`), ...points })}
            </li>
          )
        })}
      </ol>
    </header>
  )
}
