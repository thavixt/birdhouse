import { useTranslation } from 'react-i18next'
import { birdName } from '../../i18n/birdName'
import { totalCount } from '../../draft'
import { BIRDS_BY_ID } from '../../game/birds'
import { eggCostForSlot } from '../../game/engine'
import { HABITAT_ICON, HABITAT_STYLE } from '../../theme'
import FoodToken from '../FoodToken'
import FoodPicker from './FoodPicker'
import PanelFrame from './PanelFrame'
import PanelStep from './PanelStep'
import SecondaryButton from './SecondaryButton'
import { useGame, useGameStore } from '../../store/gameStore'
import type { PanelProps } from './types'

/**
 * A bird dropped on a habitat when its payment is a real choice: pick the "any" food and
 * which birds pay the egg cost (pre-filled with the automatic payment), then confirm.
 */
export default function PlayBirdPanel({ draft, footer, docked }: PanelProps<'playBird'>) {
  const { t } = useTranslation()
  const state = useGame()
  const setDraft = useGameStore((s) => s.setDraft)
  const player = state.players[state.currentPlayer]
  const card = BIRDS_BY_ID[draft.cardId]
  const eggCost = eggCostForSlot(player.board[draft.habitat].length)
  const left = { ...player.food }
  for (const f of [...card.cost.foods, ...draft.anyFoods]) left[f]--

  return (
    <PanelFrame docked={docked} title={t('panel.playBirdTitle', { card: birdName(card.id) })}>
      <p className="mb-2 text-xs text-stone-600">{t('panel.choosePayment')}</p>
      <PanelStep label={t('panel.habitat')}>
        <span className={`rounded-md px-2 py-1 text-sm font-semibold ${HABITAT_STYLE[draft.habitat].button}`}>
          {HABITAT_ICON[draft.habitat]} {t(`habitats.${draft.habitat}.name`)}
        </span>
      </PanelStep>
      <PanelStep label={t('panel.food')}>
        {card.cost.foods.map((f, i) => (
          <FoodToken key={i} food={f} />
        ))}
        {draft.anyFoods.map((f, i) => (
          <FoodToken
            key={`any-${i}`}
            food={f}
            title={t('food.clickToChange')}
            onClick={() => setDraft({ ...draft, anyFoods: draft.anyFoods.filter((_, j) => j !== i) })}
          />
        ))}
        {draft.anyFoods.length < card.cost.anyCount && (
          <FoodPicker
            label={t('panel.pickAny')}
            available={left}
            onPick={(f) => setDraft({ ...draft, anyFoods: [...draft.anyFoods, f] })}
          />
        )}
      </PanelStep>
      {eggCost > 0 && (
        <PanelStep label={t('panel.eggsProgress', { done: totalCount(draft.eggs), total: eggCost })}>
          <span className="text-xs text-stone-600">{t('panel.removeEggsHint')}</span>
          <SecondaryButton onClick={() => setDraft({ ...draft, eggs: [] })}>{t('panel.clear')}</SecondaryButton>
        </PanelStep>
      )}
      {footer}
    </PanelFrame>
  )
}
