import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import type { PlayerConfig } from '../game/types'
import { loadLeaderboard, loadTutorialEnabled, saveTutorialEnabled } from '../persistence'
import Leaderboard from './Leaderboard'
import PlayerSetupRow from './PlayerSetupRow'
import ScreenControls from './ScreenControls'
import ToggleSwitch from './ui/ToggleSwitch'
import { BUTTON } from '../theme'
import { useGameStore } from '../store/gameStore'

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

export default function StartScreen() {
  const { t } = useTranslation()
  // A saved, unfinished game to offer for continuing.
  const resumable = useGameStore((s) => s.resumable)
  const onResume = useGameStore((s) => s.resume)
  const onStart = useGameStore((s) => s.newGame)
  const [players, setPlayers] = useState<PlayerConfig[]>(() => alone(t))
  // Read once per visit to the start screen (it remounts after every game).
  const [leaderboard] = useState(loadLeaderboard)
  const [tutorial, setTutorialState] = useState(loadTutorialEnabled)
  const setTutorial = (on: boolean) => {
    setTutorialState(on)
    saveTutorialEnabled(on)
  }
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
            <ScreenControls rules className="shrink-0 self-end sm:self-auto" />
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
            <button type="button" className={`${BUTTON} shrink-0 bg-violet-700 text-white hover:bg-violet-800`} onClick={onResume}>
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
                  className={`${BUTTON} flex-1 ${selected ? 'bg-emerald-700 text-white shadow-sm hover:bg-emerald-800' : 'bg-emerald-100 text-emerald-950 hover:bg-emerald-200'}`}
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
            <PlayerSetupRow
              key={i}
              player={p}
              index={i}
              onRename={(name) => update(i, { name })}
              onToggleKind={() => toggleKind(i)}
              onRemove={() => setPlayers(players.filter((_, j) => j !== i))}
            />
          ))}
        </ul>
        <button
          type="button"
          className={`${BUTTON} bg-stone-100 hover:bg-stone-200`}
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
          <ToggleSwitch checked={tutorial} onChange={setTutorial} />
        </label>

        <button
          type="button"
          className={`${BUTTON} bg-violet-700 py-2.5 text-base text-white hover:bg-violet-800`}
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
