import { useTranslation } from 'react-i18next'
import { autoLayEggs, totalCount } from '../../draft'
import { layCount } from '../../game/engine'
import PanelFrame from './PanelFrame'
import PanelStep from './PanelStep'
import SecondaryButton from './SecondaryButton'
import { useGame, useGameStore } from '../../store/gameStore'
import type { PanelProps } from './types'

/** Grassland action: eggs are placed by clicking birds on the board ("Auto" places them all at once). */
export default function LayEggsPanel({ draft, footer, docked }: PanelProps<'layEggs'>) {
  const { t } = useTranslation()
  const state = useGame()
  const setDraft = useGameStore((s) => s.setDraft)
  const n = layCount(state.players[state.currentPlayer])
  return (
    <PanelFrame docked={docked} title={t('panel.layEggsTitle', { count: n })}>
      <PanelStep label={t('panel.placedProgress', { done: totalCount(draft.placements), total: n })}>
        <span className="text-xs text-stone-600">{n === 0 ? t('panel.noRoomForEggs') : t('panel.addEggsHint')}</span>
        <SecondaryButton onClick={() => setDraft({ ...draft, placements: [] })}>{t('panel.clear')}</SecondaryButton>
        <SecondaryButton onClick={() => setDraft(autoLayEggs(state))}>{t('panel.auto')}</SecondaryButton>
      </PanelStep>
      {footer}
    </PanelFrame>
  )
}
