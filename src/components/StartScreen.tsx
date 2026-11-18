import { useState } from 'react'
import type { PlayerConfig } from '../game/types'

type Props = { onStart: (players: PlayerConfig[]) => void }

const VS_BOT: PlayerConfig[] = [
  { name: 'You', kind: 'human' },
  { name: 'Robin Bot', kind: 'bot' },
]
const HOT_SEAT: PlayerConfig[] = [
  { name: 'Player 1', kind: 'human' },
  { name: 'Player 2', kind: 'human' },
]
const BOT_NAMES = ['Robin Bot', 'Wren Bot', 'Finch Bot', 'Heron Bot']

const btn = 'cursor-pointer rounded-md px-3 py-1.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40'
const modeButtonStyle = (selected: boolean) => {
  if (selected) {
    return "font-bold!";
  }
  return "font-normal!";
}

export default function StartScreen({ onStart }: Props) {
  const [players, setPlayers] = useState<PlayerConfig[]>(VS_BOT)
  const update = (i: number, patch: Partial<PlayerConfig>) => setPlayers(players.map((p, j) => (j === i ? { ...p, ...patch } : p)))
  const valid = players.length >= 1 && players.length <= 4 && players.every((p) => p.name.trim() !== '')
  const isBotMode = players.some(p => p.kind === "bot");

  return (
    <main className="flex min-h-screen items-center justify-center bg-linear-to-b from-emerald-50 to-stone-100 p-4 text-stone-900">
      <div className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-lg">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-emerald-900">🐦 Birdhouse</h1>
          <p className="mt-1 text-sm text-stone-600">Attract birds, build your nest and score the most points.</p>
        </div>

        <div className="flex flex-col gap-2">
          <p className='text-sm text-stone-600'>How would you like to play?</p>
          <div className="flex gap-2">
            <button type="button" className={`${modeButtonStyle(isBotMode)} ${btn} flex-1 bg-emerald-100 hover:bg-emerald-200`} onClick={() => setPlayers(VS_BOT)}>
              Against the computer
            </button>
            <button type="button" className={`${modeButtonStyle(!isBotMode)} ${btn} flex-1 bg-emerald-100 hover:bg-emerald-200`} onClick={() => setPlayers(HOT_SEAT)}>
              In person with friends
            </button>
          </div>
        </div>

        <ul className="flex flex-col gap-2">
          {players.map((p, i) => (
            <li key={i} className="flex items-center gap-2">
              <input
                value={p.name}
                onChange={(e) => update(i, { name: e.target.value })}
                aria-label={`Player ${i + 1} name`}
                maxLength={20}
                className="min-w-0 flex-1 rounded-md border border-stone-300 px-2 py-1"
              />
              <button
                type="button"
                className={`${btn} w-24 ${p.kind === 'bot' ? 'bg-stone-700 text-white' : 'bg-violet-100 text-violet-900'}`}
                onClick={() => update(i, { kind: p.kind === 'bot' ? 'human' : 'bot' })}
                title="Toggle human / bot"
              >
                {p.kind === 'bot' ? '🤖 Bot' : '🧑 Human'}
              </button>
              <button
                type="button"
                className={`${btn} bg-stone-100 hover:bg-stone-200`}
                disabled={players.length <= 1}
                onClick={() => setPlayers(players.filter((_, j) => j !== i))}
                aria-label="Remove player"
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
          onClick={() => setPlayers([...players, { name: BOT_NAMES[players.length] ?? 'Bot', kind: 'bot' }])}
        >
          + Add player
        </button>

        <button
          type="button"
          className={`${btn} bg-violet-700 py-2.5 text-base text-white hover:bg-violet-800`}
          disabled={!valid}
          onClick={() => onStart(players.map((p) => ({ ...p, name: p.name.trim() })))}
        >
          Start game
        </button>
      </div>
    </main>
  )
}
