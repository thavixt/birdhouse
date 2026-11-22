import { useTranslation } from 'react-i18next'
import { drawCount } from '../../game/engine'
import PanelFrame from './PanelFrame'
import PanelStep from './PanelStep'
import SecondaryButton from './SecondaryButton'
import { useGame, useGameStore } from '../../store/gameStore'
import type { PanelProps } from './types'

/** Wetland action: cards are picked by clicking the tray or the deck. */
export default function DrawCardsPanel({ draft, footer, docked }: PanelProps<'drawCards'>) {
  const { t } = useTranslation()
  const state = useGame()
  const setDraft = useGameStore((s) => s.setDraft)
  const n = drawCount(state, state.currentPlayer)
  return (
    <PanelFrame docked={docked} title={t('panel.drawCardsTitle', { count: n })}>
      <PanelStep label={t('panel.pickedProgress', { done: draft.picks.length, total: n })}>
        <span className="text-xs text-stone-600">{t('panel.drawHint')}</span>
        <SecondaryButton onClick={() => setDraft({ ...draft, picks: [] })}>{t('panel.clear')}</SecondaryButton>
      </PanelStep>
      {footer}
    </PanelFrame>
  )
}
