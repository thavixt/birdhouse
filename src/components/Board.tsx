import { useTranslation } from 'react-i18next'
import { actionCount } from '../game/engine'
import { scorePlayer } from '../game/scoring'
import { HABITATS, type Habitat, type Player, type SlotRef } from '../game/types'
import FoodSupply from './FoodSupply'
import HabitatRow from './HabitatRow'

type Props = {
  player: Player
  active: boolean
  turnsLeft: number
  onAction?: (habitat: Habitat) => void
  onBirdClick?: (slot: SlotRef) => void
  eggDelta?: (slot: SlotRef) => number
  nextSlot?: Habitat | null
}

/** A player's three habitat rows plus a summary header. */
export default function Board({ player, active, turnsLeft, onAction, onBirdClick, eggDelta, nextSlot }: Props) {
  const { t } = useTranslation()
  const score = scorePlayer(player)
  return (
    <section
      className={`flex flex-col gap-2 rounded-xl border bg-white/80 p-2 shadow-sm sm:p-3 ${active ? 'border-violet-400 ring-2 ring-violet-300' : 'border-stone-200'}`}
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <h2 className="text-lg font-bold">{player.name}</h2>
          <span className="text-xs text-stone-500">
            {t(player.kind === 'bot' ? 'board.bot' : 'board.human')} · {t('board.turnsLeft', { count: turnsLeft })} ·{' '}
            {t('board.cardsInHand', { count: player.hand.length })}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <FoodSupply food={player.food} />
          <span className="rounded-md bg-stone-800 px-2 py-0.5 text-sm font-bold whitespace-nowrap text-white" title={t('board.scoreTitle')}>
            {t('board.score', { count: score.total })}
          </span>
        </div>
      </header>
      {HABITATS.map((h) => (
        <HabitatRow
          key={h}
          habitat={h}
          birds={player.board[h]}
          count={actionCount(player.board, h)}
          onAction={onAction && (() => onAction(h))}
          onBirdClick={onBirdClick && ((index) => onBirdClick({ habitat: h, index }))}
          eggDelta={eggDelta && ((index) => eggDelta({ habitat: h, index }))}
          highlightNext={nextSlot === h}
        />
      ))}
    </section>
  )
}
