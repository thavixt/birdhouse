import { useTranslation } from 'react-i18next'
import { actionCount } from '../../game/engine'
import FoodToken from '../FoodToken'
import FoodPicker from './FoodPicker'
import PanelFrame from './PanelFrame'
import PanelStep from './PanelStep'
import { useGame, useGameStore } from '../../store/gameStore'
import type { PanelProps } from './types'

/** Forest action: choose N foods from the supply. */
export default function GainFoodPanel({ draft, footer, docked }: PanelProps<'gainFood'>) {
  const { t } = useTranslation()
  const state = useGame()
  const setDraft = useGameStore((s) => s.setDraft)
  const n = actionCount(state.players[state.currentPlayer].board, 'forest')
  return (
    <PanelFrame docked={docked} title={t('panel.gainFoodTitle', { count: n })}>
      <PanelStep label={t('panel.chosenProgress', { done: draft.foods.length, total: n })}>
        {draft.foods.map((f, i) => (
          <FoodToken
            key={i}
            food={f}
            title={t('food.clickToRemove')}
            onClick={() => setDraft({ ...draft, foods: draft.foods.filter((_, j) => j !== i) })}
          />
        ))}
      </PanelStep>
      {draft.foods.length < n && (
        <FoodPicker label={t('panel.take')} onPick={(f) => setDraft({ ...draft, foods: [...draft.foods, f] })} />
      )}
      {footer}
    </PanelFrame>
  )
}
