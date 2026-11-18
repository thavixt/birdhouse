import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import type { PlayerConfig } from '../game/types'
import LanguageSwitch from './LanguageSwitch'

type Props = { onStart: (players: PlayerConfig[]) => void }

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
const modeButtonStyle = (selected: boolean) => {
  const common = "border-4 border-emerald-100";
  if (selected) {
    return [common, "font-bold!"].join(" ");
  }
  return [common, "font-normal! !bg-transparent"].join(" ");
}

export default function StartScreen({ onStart }: Props) {
  const { t } = useTranslation()
  const [players, setPlayers] = useState<PlayerConfig[]>(() => vsBot(t))
  const update = (i: number, patch: Partial<PlayerConfig>) => setPlayers(players.map((p, j) => (j === i ? { ...p, ...patch } : p)))
  const valid = players.length >= 1 && players.length <= 4 && players.every((p) => p.name.trim() !== '')
  const isBotMode = players.some(p => p.kind === "bot");

  return (
    <main className="flex min-h-screen items-center justify-center bg-linear-to-b from-emerald-50 to-stone-100 p-4 text-stone-900">
      <div className="relative flex w-full max-w-md flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-lg">
        <div className="text-center h-24 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h1 className="text-4xl font-bold text-emerald-900">🐦 {t('app.title')}</h1>
            <LanguageSwitch />
          </div>
          <p className="mt-1 text-sm text-stone-600">{t('app.tagline')}</p>
        </div>

        <div className="flex flex-col gap-2">
          <p className='text-sm text-stone-600'>{t('start.howToPlay')}</p>
          <div className="flex gap-2">
            <button type="button" className={`${modeButtonStyle(isBotMode)} ${btn} flex-1 bg-emerald-100 hover:bg-emerald-200`} onClick={() => setPlayers(vsBot(t))}>
              {t('start.vsBot')}
            </button>
            <button type="button" className={`${modeButtonStyle(!isBotMode)} ${btn} flex-1 bg-emerald-100 hover:bg-emerald-200`} onClick={() => setPlayers(hotSeat(t))}>
              {t('start.hotSeat')}
            </button>
          </div>
        </div>

        <ul className="flex flex-col gap-2">
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
