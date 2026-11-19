import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Trans, useTranslation } from 'react-i18next'
import { GOAL_POINTS } from '../game/goals'

type Props = { onClose: () => void }

const bold = { b: <b /> }

/** Bulleted list of translation keys (which may contain <b>…</b>). */
function KeyList({ keys }: { keys: readonly string[] }) {
  return (
    <ul className="list-disc space-y-1 pl-5">
      {keys.map((k) => (
        <li key={k}>
          <Trans i18nKey={k} components={bold} />
        </li>
      ))}
    </ul>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-base font-bold text-emerald-900">{title}</h3>
      {children}
    </section>
  )
}

const CARD_PARTS = ['rules.cards.points', 'rules.cards.cost', 'rules.cards.habitats', 'rules.cards.eggLimit', 'rules.cards.power'] as const
const ACTIONS = ['rules.turn.playBird', 'rules.turn.gainFood', 'rules.turn.layEggs', 'rules.turn.drawCards'] as const
const POWERS = [
  'rules.powers.gainFood',
  'rules.powers.layEggSelf',
  'rules.powers.layEggAny',
  'rules.powers.drawCard',
  'rules.powers.allGainFood',
] as const
const FINAL_SCORE = ['rules.end.birds', 'rules.end.eggs', 'rules.end.food', 'rules.end.goals'] as const
const TIPS = ['rules.tips.engine', 'rules.tips.eggs', 'rules.tips.lastRound', 'rules.tips.goals'] as const

/**
 * Rendered into document.body (portal), so it looks the same wherever it's opened from
 * and never inherits the caller's styles (e.g. the start screen's `text-center`).
 */
export default function RulesModal({ onClose }: Props) {
  const { t } = useTranslation()
  return createPortal(
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-2 sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-label={t('rules.title')}
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white text-left text-sm text-stone-900 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-2 border-b border-stone-200 px-4 py-3 sm:px-5">
          <h2 className="text-xl font-bold">{t('rules.title')}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('rules.closeLabel')}
            className="cursor-pointer rounded-md px-2 py-1 text-lg text-stone-500 hover:bg-stone-100"
          >
            ✕
          </button>
        </header>

        <div className="flex flex-col gap-5 overflow-y-auto px-4 py-4 leading-relaxed sm:px-5">
          <Section title={t('rules.aim.title')}>
            <p>
              <Trans i18nKey="rules.aim.text" components={bold} />
            </p>
          </Section>

          <Section title={t('rules.setup.title')}>
            <p>{t('rules.setup.text')}</p>
          </Section>

          <Section title={t('rules.board.title')}>
            <p>
              <Trans i18nKey="rules.board.text" components={bold} />
            </p>
          </Section>

          <Section title={t('rules.cards.title')}>
            <KeyList keys={CARD_PARTS} />
          </Section>

          <Section title={t('rules.turn.title')}>
            <p>
              <Trans i18nKey="rules.turn.text" components={bold} />
            </p>
            <KeyList keys={ACTIONS} />
            <p>{t('rules.turn.after')}</p>
          </Section>

          <Section title={t('rules.powers.title')}>
            <p>{t('rules.powers.text')}</p>
            <KeyList keys={POWERS} />
          </Section>

          <Section title={t('rules.rounds.title')}>
            <p>{t('rules.rounds.text')}</p>
            <p>{t('rules.rounds.goals')}</p>
            {/* Built from GOAL_POINTS so the table always matches the scoring code. */}
            <table className="w-full max-w-xs text-center text-sm">
              <thead className="text-xs text-stone-500 uppercase">
                <tr>
                  <th className="py-1 text-left">{t('rules.rounds.round')}</th>
                  <th>{t('rules.rounds.first')}</th>
                  <th>{t('rules.rounds.second')}</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {GOAL_POINTS.first.map((first, i) => (
                  <tr key={i} className="border-t border-stone-200">
                    <td className="py-1 text-left">{i + 1}.</td>
                    <td>{first}</td>
                    <td>{GOAL_POINTS.second[i]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p>{t('rules.rounds.ties')}</p>
          </Section>

          <Section title={t('rules.end.title')}>
            <p>{t('rules.end.text')}</p>
            <KeyList keys={FINAL_SCORE} />
            <p>{t('rules.end.tie')}</p>
          </Section>

          <Section title={t('rules.tips.title')}>
            <KeyList keys={TIPS} />
          </Section>
        </div>

        <footer className="border-t border-stone-200 px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-md bg-violet-700 px-4 py-1.5 font-semibold text-white hover:bg-violet-800"
          >
            {t('rules.close')}
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  )
}
