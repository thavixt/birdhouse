import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import type { GameState, PlayerConfig } from '../game/types'
import LanguageSwitch from './LanguageSwitch'

type Props = {
  onStart: (players: PlayerConfig[]) => void
  /** A saved, unfinished game to offer for continuing. */
  resumable: GameState | null
  onResume: () => void
}

const alone = (t: TFunction): PlayerConfig[] => [
  { name: t('start.defaultYou'), kind: 'human' },
]
const vsBot = (t: TFunction): PlayerConfig[] => [
  { name: t('start.defaultYou'), kind: 'human' },
  { name: t('start.botName1'), kind: 'bot' },
]
const hotSeat = (t: TFunction): PlayerConfig[] => [
  { name: t('start.defaultPlayer', { n: 1 }), kind: 'human' },
  { name: t('start.defaultPlayer', { n: 2 }), kind: 'human' },
]
const botName = (t: TFunction, index: number) => (index < 4 ? t(`start.botName${index + 1}`) : t('start.botFallback'))

const btn = 'cursor-pointer rounded-md px-3 py-1.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40'

export default function StartScreen({ onStart, resumable, onResume }: Props) {
  const { t } = useTranslation()
  const [players, setPlayers] = useState<PlayerConfig[]>(() => alone(t))
  const update = (i: number, patch: Partial<PlayerConfig>) => setPlayers(players.map((p, j) => (j === i ? { ...p, ...patch } : p)))
  const valid = players.length >= 1 && players.length <= 4 && players.every((p) => p.name.trim() !== '')

  return (
    <main className="flex min-h-screen items-center justify-center bg-linear-to-b from-emerald-50 to-stone-100 p-4 text-stone-900">
      <div className="relative flex w-full max-w-xl flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-lg">
        <div className="text-center min-h-24 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h1 className="text-6xl font-bold text-emerald-900">🐦 {t('app.title')}</h1>
            <LanguageSwitch />
          </div>
          <p className="text-sm text-stone-600">{t('app.tagline')}</p>
        </div>

        {resumable && (
          <section className="flex items-center justify-between gap-3 rounded-xl border border-violet-200 bg-violet-50 p-3">
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-violet-900">{t('start.continueTitle')}</h2>
              <p className="truncate text-xs text-stone-600">
                {t('start.continueDetails', {
                  round: resumable.round,
                  players: resumable.players.map((p) => p.name).join(', '),
                })}
              </p>
            </div>
            <button type="button" className={`${btn} shrink-0 bg-violet-700 text-white hover:bg-violet-800`} onClick={onResume}>
              {t('start.continue')}
            </button>
          </section>
        )}

        <div className="flex flex-col gap-2">
          <p className='text-sm text-stone-600'>{t('start.howToPlay')}</p>
          <div className="flex gap-2">
            <button type="button" className={`${btn} flex-1 bg-emerald-100 hover:bg-emerald-200`} onClick={() => setPlayers(alone(t))}>
              {t('start.alone')}
            </button>
            <button type="button" className={`${btn} flex-1 bg-emerald-100 hover:bg-emerald-200`} onClick={() => setPlayers(vsBot(t))}>
              {t('start.vsBot')}
            </button>
            <button type="button" className={`${btn} flex-1 bg-emerald-100 hover:bg-emerald-200`} onClick={() => setPlayers(hotSeat(t))}>
              {t('start.hotSeat')}
            </button>
          </div>
        </div>

        <ul className="flex flex-col gap-2 min-h-40">
          {players.map((p, i) => (
            <li key={i} className="flex items-center gap-2">
              <input
                value={p.name}
                onChange={(e) => update(i, { name: e.target.value })}
                aria-label={t('start.playerNameLabel', { n: i + 1 })}
                maxLength={20}
                className="min-w-0 flex-1 rounded-md border border-stone-300 px-2 py-1"
              />
              <button
                type="button"
                className={`${btn} w-24 ${p.kind === 'bot' ? 'bg-stone-700 text-white' : 'bg-violet-100 text-violet-900'}`}
                onClick={() => update(i, { kind: p.kind === 'bot' ? 'human' : 'bot' })}
                title={t('start.toggleKind')}
              >
                {p.kind === 'bot' ? t('start.bot') : t('start.human')}
              </button>
              <button
                type="button"
                className={`${btn} bg-stone-100 hover:bg-stone-200`}
                disabled={players.length <= 1}
                onClick={() => setPlayers(players.filter((_, j) => j !== i))}
                aria-label={t('start.removePlayer')}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className={`${btn} bg-stone-100 hover:bg-stone-200`}
          disabled={players.length >= 4}
          onClick={() => setPlayers([...players, { name: botName(t, players.length), kind: 'bot' }])}
        >
          {t('start.addPlayer')}
        </button>

        <button
          type="button"
          className={`${btn} bg-violet-700 py-2.5 text-base text-white hover:bg-violet-800`}
          disabled={!valid}
          onClick={() => onStart(players.map((p) => ({ ...p, name: p.name.trim() })))}
        >
          {t('start.startGame')}
        </button>
      </div>
    </main>
  )
}
