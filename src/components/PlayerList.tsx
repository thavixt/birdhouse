import { useTranslation } from 'react-i18next'
import { scorePlayer } from '../game/scoring'
import type { GameState } from '../game/types'
import { cn } from 'cn'

type Props = { state: GameState }

/** Every player's name and current score; the player whose turn it is is highlighted. */
export default function PlayerList({ state }: Props) {
  const { t } = useTranslation()
  return (
    <section className="rounded-xl border border-stone-200 bg-white/80 p-3 text-sm shadow-sm">
      <h3 className="mb-1 text-sm font-semibold text-stone-600">{t('players.title')}</h3>
      <ul className="flex flex-col gap-1">
        {state.players.map((player, i) => {
          const score = scorePlayer(player)
          const active = i === state.currentPlayer && state.phase === 'playing'
          return (
            <li
              key={player.id}
              aria-current={active || undefined}
              title={t('players.scoreTitle', score)}
              className={cn(
                'flex items-baseline justify-between gap-2 rounded-md border px-2 py-1',
                active ? 'border-emerald-400 bg-emerald-50 font-semibold' : 'border-transparent',
              )}
            >
              <span className="min-w-0 truncate">
                {player.kind === 'bot' ? '🤖' : '🧑'} {player.name}
              </span>
              <span className="shrink-0 font-bold text-emerald-900">{t('board.score', { count: score.total })}</span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
