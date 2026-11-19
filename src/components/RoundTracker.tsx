import { useTranslation } from 'react-i18next'
import { GOAL_POINTS } from '../game/goals'
import type { GameState } from '../game/types'
import LanguageSwitch from './LanguageSwitch'
import RulesButton from './RulesButton'

type Props = { state: GameState; onQuit: () => void }

export default function RoundTracker({ state, onQuit }: Props) {
  const { t } = useTranslation()
  return (
    <header className="flex flex-col gap-2 rounded-xl border border-stone-200 bg-white/80 p-2 shadow-sm sm:p-3">
      {/* Title and controls share a row when they fit; on phones the controls wrap below. */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold text-emerald-900 sm:text-xl">🐦 {t('app.title')}</h1>
          <span className="text-sm font-semibold">{t('tracker.round', { round: state.round })}</span>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitch />
          <RulesButton />
          <button type="button" onClick={onQuit} className="cursor-pointer rounded-md bg-stone-200 px-3 py-1 text-sm hover:bg-stone-300">
            {t('tracker.quit')}
          </button>
        </div>
      </div>
      {/* Phones: one horizontally scrollable line. Wider screens: chips wrap. */}
      <ol className="-mx-2 flex gap-2 overflow-x-auto px-2 pb-1 text-xs sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
        {state.goals.map((id, i) => {
          const done = i + 1 < state.round || state.phase === 'gameOver'
          const current = i + 1 === state.round && !done
          const points = { first: GOAL_POINTS.first[i], second: GOAL_POINTS.second[i] }
          return (
            <li
              key={id}
              className={`shrink-0 rounded-md border px-2 py-1 whitespace-nowrap sm:whitespace-normal ${current ? 'border-violet-400 bg-violet-50 font-semibold' : 'border-stone-200'} ${done ? 'text-stone-400 line-through' : ''}`}
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
