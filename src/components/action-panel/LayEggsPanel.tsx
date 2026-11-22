import { useTranslation } from 'react-i18next'
import { startLayEggs, totalCount } from '../../draft'
import { layCount } from '../../game/engine'
import PanelFrame from './PanelFrame'
import PanelStep from './PanelStep'
import SecondaryButton from './SecondaryButton'
import type { PanelProps } from './types'

/** Grassland action: eggs are placed by clicking birds on the board (pre-filled automatically). */
export default function LayEggsPanel({ state, draft, setDraft, footer, docked }: PanelProps<'layEggs'>) {
  const { t } = useTranslation()
  const n = layCount(state.players[state.currentPlayer])
  return (
    <PanelFrame docked={docked} title={t('panel.layEggsTitle', { count: n })}>
      <PanelStep label={t('panel.placedProgress', { done: totalCount(draft.placements), total: n })}>
        <span className="text-xs text-stone-600">{n === 0 ? t('panel.noRoomForEggs') : t('panel.addEggsHint')}</span>
        <SecondaryButton onClick={() => setDraft({ ...draft, placements: [] })}>{t('panel.clear')}</SecondaryButton>
        <SecondaryButton onClick={() => setDraft(startLayEggs(state))}>{t('panel.auto')}</SecondaryButton>
      </PanelStep>
      {footer}
    </PanelFrame>
  )
}
