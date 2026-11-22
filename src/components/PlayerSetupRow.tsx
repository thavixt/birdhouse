import { useTranslation } from 'react-i18next'
import type { PlayerConfig } from '../game/types'
import { BUTTON } from '../theme'

type Props = {
  player: PlayerConfig
  /** Position in the line-up; the first player (the one at the device) is fixed as a human. */
  index: number
  onRename: (name: string) => void
  onToggleKind: () => void
  onRemove: () => void
}

/** One player in the start screen's line-up: name, human/bot toggle, remove. */
export default function PlayerSetupRow({ player, index, onRename, onToggleKind, onRemove }: Props) {
  const { t } = useTranslation()
  // The first player is always a human and can't be removed (which also keeps the list
  // non-empty). `invisible` keeps the space so rows stay aligned, and takes the buttons out of
  // tab order and the accessibility tree.
  const fixed = index === 0
  return (
    <li className="flex items-center gap-2">
      <input
        value={player.name}
        onChange={(e) => onRename(e.target.value)}
        aria-label={t('start.playerNameLabel', { n: index + 1 })}
        maxLength={20}
        className="min-w-0 flex-1 rounded-md border border-stone-300 px-2 py-1"
      />
      <button
        type="button"
        className={`${BUTTON} w-24 ${player.kind === 'bot' ? 'bg-stone-700 text-white' : 'bg-violet-100 text-violet-900'} ${fixed ? 'invisible' : ''}`}
        disabled={fixed}
        onClick={onToggleKind}
        title={t('start.toggleKind')}
      >
        {player.kind === 'bot' ? t('start.bot') : t('start.human')}
      </button>
      <button
        type="button"
        className={`${BUTTON} bg-stone-100 hover:bg-stone-200 ${fixed ? 'invisible' : ''}`}
        disabled={fixed}
        onClick={onRemove}
        aria-label={t('start.removePlayer')}
      >
        ✕
      </button>
    </li>
  )
}
