import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import type { GameState, PlayerConfig } from '../game/types'
import { loadLeaderboard } from '../persistence'
import LanguageSwitch from './LanguageSwitch'
import Leaderboard from './Leaderboard'
import RulesButton from './RulesButton'

type Props = {
  /** `tutorial`: show the guided tour on each human's first turn. */
  onStart: (players: PlayerConfig[], tutorial: boolean) => void
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
const SEATS = [1, 2, 3, 4] as const

/** Every preset name in the current language: a name in this set hasn't been typed by the user. */
const presetNames = (t: TFunction) =>
  new Set([
    t('start.defaultYou'),
    t('start.botFallback'),
    ...SEATS.map((n) => t('start.defaultPlayer', { n })),
    ...SEATS.map((n) => t(`start.botName${n}`)),
  ])

/** The first preset name for `kind` that no other player is using (players at `index` excluded). */
function freshName(t: TFunction, kind: PlayerConfig['kind'], players: PlayerConfig[], index: number): string {
  const taken = new Set(players.filter((_, j) => j !== index).map((p) => p.name.trim()))
  const candidates =
    kind === 'bot'
      ? [...SEATS.map((n) => t(`start.botName${n}`)), t('start.botFallback')]
      : [index + 1, ...SEATS].map((n) => t('start.defaultPlayer', { n }))
  return candidates.find((name) => !taken.has(name)) ?? candidates[0]
}

type PlayMode = 'alone' | 'vsBot' | 'hotSeat'

/** The play mode the current line-up amounts to. The first player is always human. */
function playModeOf(players: PlayerConfig[]): PlayMode {
  const humans = players.filter((p) => p.kind === 'human').length
  if (humans >= 2) return 'hotSeat'
  return players.length > 1 ? 'vsBot' : 'alone'
}

const MODES: { mode: PlayMode; preset: (t: TFunction) => PlayerConfig[] }[] = [
  { mode: 'alone', preset: alone },
  { mode: 'vsBot', preset: vsBot },
  { mode: 'hotSeat', preset: hotSeat },
]

const btn = 'cursor-pointer rounded-md px-3 py-1.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40'

export default function StartScreen({ onStart, resumable, onResume }: Props) {
  const { t } = useTranslation()
  const [players, setPlayers] = useState<PlayerConfig[]>(() => alone(t))
  // Read once per visit to the start screen (it remounts after every game).
  const [leaderboard] = useState(loadLeaderboard)
  const [tutorial, setTutorial] = useState(true)
  const update = (i: number, patch: Partial<PlayerConfig>) => setPlayers(players.map((p, j) => (j === i ? { ...p, ...patch } : p)))
  // Switching human/bot also swaps a preset name for one that fits; a typed name is kept.
  const toggleKind = (i: number) => {
    const p = players[i]
    const kind = p.kind === 'bot' ? 'human' : 'bot'
    const name = presetNames(t).has(p.name.trim()) ? freshName(t, kind, players, i) : p.name
    update(i, { kind, name })
  }
  const valid = players.length >= 1 && players.length <= 4 && players.every((p) => p.name.trim() !== '')
  const currentMode = playModeOf(players)

  return (
    <main className="flex min-h-screen items-center justify-center bg-linear-to-b from-emerald-50 to-stone-100 p-4 text-stone-900">
      <div className="relative flex w-full max-w-xl flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-lg">
        <div className="text-center min-h-24 flex flex-col gap-3">
          {/* Phones: rules + language switch on their own line above the title, so nothing gets squeezed. */}
          <div className="flex flex-col-reverse items-center gap-2 sm:flex-row sm:justify-between">
            <h1 className="text-5xl font-bold text-emerald-900 min-[375px]:text-6xl">🐦 {t('app.title')}</h1>
            <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
              <RulesButton />
              <LanguageSwitch />
            </div>
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
          {/* The highlight follows the line-up below, including manual edits to it. */}
          <div className="flex gap-2">
            {MODES.map(({ mode, preset }) => {
              const selected = currentMode === mode
              return (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={selected}
                  className={`${btn} flex-1 ${selected ? 'bg-emerald-700 text-white shadow-sm hover:bg-emerald-800' : 'bg-emerald-100 text-emerald-950 hover:bg-emerald-200'}`}
                  onClick={() => setPlayers(preset(t))}
                >
                  {t(`start.${mode}`)}
                </button>
              )
            })}
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
                // The first player is always a human (the one at the device): no toggle, hidden like
                // the remove button below so the rows stay aligned.
                className={`${btn} w-24 ${p.kind === 'bot' ? 'bg-stone-700 text-white' : 'bg-violet-100 text-violet-900'} ${i === 0 ? 'invisible' : ''}`}
                disabled={i === 0}
                onClick={() => toggleKind(i)}
                title={t('start.toggleKind')}
              >
                {p.kind === 'bot' ? t('start.bot') : t('start.human')}
              </button>
              <button
                type="button"
                // The first player can't be removed, which also keeps the list non-empty. `invisible`
                // keeps its space so the rows stay aligned, and takes it out of tab order and the
                // accessibility tree.
                className={`${btn} bg-stone-100 hover:bg-stone-200 ${i === 0 ? 'invisible' : ''}`}
                disabled={i === 0}
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
          onClick={() => setPlayers([...players, { name: freshName(t, 'bot', players, players.length), kind: 'bot' }])}
        >
          {t('start.addPlayer')}
        </button>

        <label className="flex cursor-pointer items-center justify-between gap-3 text-sm">
          <span>
            <span className="font-semibold">{t('start.tutorial')}</span>
            <span className="block text-xs text-stone-500">{t('start.tutorialHint')}</span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={tutorial}
            onClick={() => setTutorial(!tutorial)}
            className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${tutorial ? 'bg-violet-700' : 'bg-stone-300'}`}
          >
            <span
              aria-hidden
              className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform ${tutorial ? 'translate-x-5' : ''}`}
            />
          </button>
        </label>

        <button
          type="button"
          className={`${btn} bg-violet-700 py-2.5 text-base text-white hover:bg-violet-800`}
          disabled={!valid}
          onClick={() => onStart(players.map((p) => ({ ...p, name: p.name.trim() })), tutorial)}
        >
          {t('start.startGame')}
        </button>

        <Leaderboard entries={leaderboard} />
      </div>
    </main>
  )
}
