import { useTranslation } from 'react-i18next'
import { birdName } from '../../i18n/birdName'
import { chooseHabitat, totalCount } from '../../draft'
import { BIRDS_BY_ID } from '../../game/birds'
import { eggCostForSlot, playableHabitats } from '../../game/engine'
import { BUTTON, HABITAT_ICON, HABITAT_STYLE } from '../../theme'
import FoodToken from '../FoodToken'
import FoodPicker from './FoodPicker'
import PanelFrame from './PanelFrame'
import PanelStep from './PanelStep'
import SecondaryButton from './SecondaryButton'
import type { PanelProps } from './types'

/** Playing a bird: pick the habitat, the "any" food, and which birds pay the egg cost. */
export default function PlayBirdPanel({ state, draft, setDraft, footer, docked }: PanelProps<'playBird'>) {
  const { t } = useTranslation()
  const player = state.players[state.currentPlayer]
  const card = BIRDS_BY_ID[draft.cardId]
  const habitats = playableHabitats(state, state.currentPlayer, draft.cardId)
  const eggCost = draft.habitat ? eggCostForSlot(player.board[draft.habitat].length) : 0
  const left = { ...player.food }
  for (const f of [...card.cost.foods, ...draft.anyFoods]) left[f]--

  return (
    <PanelFrame docked={docked} title={t('panel.playBirdTitle', { card: birdName(card.id) })}>
      <PanelStep label={t('panel.habitat')}>
        {habitats.map((h) => (
          <button
            key={h}
            type="button"
            className={`${BUTTON} ${draft.habitat === h ? HABITAT_STYLE[h].button : HABITAT_STYLE[h].chip}`}
            onClick={() => setDraft(chooseHabitat(state, draft, h))}
          >
            {HABITAT_ICON[h]} {t(`habitats.${h}.name`)}
          </button>
        ))}
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
