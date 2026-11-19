import type { ReactNode } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { BIRDS_BY_ID } from '../game/birds'
import { actionCount, drawCount, eggCostForSlot, layCount, playableHabitats, validateAction } from '../game/engine'
import { FOODS, type Food, type GameAction, type GameState } from '../game/types'
import { chooseHabitat, IDLE, startLayEggs, toAction, totalCount, type Draft } from '../draft'
import { formatMessage } from '../i18n/message'
import { HABITAT_ICON, HABITAT_STYLE } from '../theme'
import FoodToken from './FoodToken'

type Props = {
  state: GameState
  draft: Draft
  setDraft: (d: Draft) => void
  onConfirm: (action: GameAction) => void
  /** Docked to the bottom of a phone screen: shorter idle text and a lifted shadow. */
  docked?: boolean
}

const btn = 'rounded-md px-3 py-1.5 text-sm font-semibold cursor-pointer disabled:cursor-not-allowed disabled:opacity-40'
const secondary = `${btn} bg-stone-200 hover:bg-stone-300`

/** Contextual prompt for the current human player's in-progress action. */
export default function ActionPanel({ state, draft, setDraft, onConfirm, docked = false }: Props) {
  const { t } = useTranslation()
  const player = state.players[state.currentPlayer]

  if (state.phase === 'gameOver') return null
  if (player.kind === 'bot') {
    return <PanelFrame docked={docked} title={t('panel.botThinkingTitle', { name: player.name })}>{t('panel.botThinking')}</PanelFrame>
  }
  if (draft.kind === 'idle') {
    return (
      <PanelFrame docked={docked} title={t('panel.yourTurnTitle', { name: player.name })}>
        {docked ? t('panel.yourTurnShort') : <Trans i18nKey="panel.yourTurn" components={{ b: <b /> }} />}
      </PanelFrame>
    )
  }

  const action = toAction(draft)
  const error = action ? validateAction(state, action) : null
  const errorText = !action ? t('panel.chooseHabitat') : error ? formatMessage(t, error) : null
  const footer = (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <button
        type="button"
        className={`${btn} bg-violet-700 text-white hover:bg-violet-800`}
        disabled={!action || !!error}
        onClick={() => action && onConfirm(action)}
      >
        {t('panel.confirm')}
      </button>
      <button type="button" className={secondary} onClick={() => setDraft(IDLE)}>
        {t('panel.cancel')}
      </button>
      {errorText && <span className="text-xs text-rose-700">{errorText}</span>}
    </div>
  )
  const clearButton = (onClick: () => void) => (
    <button type="button" className={secondary} onClick={onClick}>
      {t('panel.clear')}
    </button>
  )

  switch (draft.kind) {
    case 'playBird': {
      const card = BIRDS_BY_ID[draft.cardId]
      const habitats = playableHabitats(state, state.currentPlayer, draft.cardId)
      const eggCost = draft.habitat ? eggCostForSlot(player.board[draft.habitat].length) : 0
      const left = { ...player.food }
      for (const f of [...card.cost.foods, ...draft.anyFoods]) left[f]--
      return (
        <PanelFrame docked={docked} title={t('panel.playBirdTitle', { card: t(`birds.${card.id}`) })}>
          <Step label={t('panel.habitat')}>
            {habitats.map((h) => (
              <button
                key={h}
                type="button"
                className={`${btn} ${draft.habitat === h ? HABITAT_STYLE[h].button : HABITAT_STYLE[h].chip}`}
                onClick={() => setDraft(chooseHabitat(state, draft, h))}
              >
                {HABITAT_ICON[h]} {t(`habitats.${h}.name`)}
              </button>
            ))}
          </Step>
          <Step label={t('panel.food')}>
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
          </Step>
          {eggCost > 0 && (
            <Step label={t('panel.eggsProgress', { done: totalCount(draft.eggs), total: eggCost })}>
              <span className="text-xs text-stone-600">{t('panel.removeEggsHint')}</span>
              {clearButton(() => setDraft({ ...draft, eggs: [] }))}
            </Step>
          )}
          {footer}
        </PanelFrame>
      )
    }

    case 'gainFood': {
      const n = actionCount(player.board, 'forest')
      return (
        <PanelFrame docked={docked} title={t('panel.gainFoodTitle', { count: n })}>
          <Step label={t('panel.chosenProgress', { done: draft.foods.length, total: n })}>
            {draft.foods.map((f, i) => (
              <FoodToken
                key={i}
                food={f}
                title={t('food.clickToRemove')}
                onClick={() => setDraft({ ...draft, foods: draft.foods.filter((_, j) => j !== i) })}
              />
            ))}
          </Step>
          {draft.foods.length < n && (
            <FoodPicker label={t('panel.take')} onPick={(f) => setDraft({ ...draft, foods: [...draft.foods, f] })} />
          )}
          {footer}
        </PanelFrame>
      )
    }

    case 'layEggs': {
      const n = layCount(player)
      return (
        <PanelFrame docked={docked} title={t('panel.layEggsTitle', { count: n })}>
          <Step label={t('panel.placedProgress', { done: totalCount(draft.placements), total: n })}>
            <span className="text-xs text-stone-600">{n === 0 ? t('panel.noRoomForEggs') : t('panel.addEggsHint')}</span>
            {clearButton(() => setDraft({ ...draft, placements: [] }))}
            <button type="button" className={secondary} onClick={() => setDraft(startLayEggs(state))}>
              {t('panel.auto')}
            </button>
          </Step>
          {footer}
        </PanelFrame>
      )
    }

    case 'drawCards': {
      const n = drawCount(state, state.currentPlayer)
      return (
        <PanelFrame docked={docked} title={t('panel.drawCardsTitle', { count: n })}>
          <Step label={t('panel.pickedProgress', { done: draft.picks.length, total: n })}>
            <span className="text-xs text-stone-600">{t('panel.drawHint')}</span>
            {clearButton(() => setDraft({ ...draft, picks: [] }))}
          </Step>
          {footer}
        </PanelFrame>
      )
    }
  }
}

function PanelFrame({ title, children, docked }: { title: string; children: ReactNode; docked: boolean }) {
  return (
    <section
      className={`rounded-xl border border-violet-200 bg-violet-50 text-sm ${docked ? 'p-2.5 shadow-[0_-4px_16px_rgba(0,0,0,0.12)]' : 'p-3'}`}
    >
      <h3 className={`font-bold text-violet-900 ${docked ? 'mb-1' : 'mb-2'}`}>{title}</h3>
      {children}
    </section>
  )
}

function Step({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-2 flex flex-wrap items-center gap-2">
      <span className="w-24 shrink-0 text-xs font-semibold text-stone-600 uppercase">{label}</span>
      {children}
    </div>
  )
}

function FoodPicker({ label, onPick, available }: { label: string; onPick: (f: Food) => void; available?: Record<Food, number> }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-wrap items-center gap-1">
      <span className="text-xs text-stone-600">{label}</span>
      {FOODS.filter((f) => !available || available[f] > 0).map((f) => (
        <FoodToken key={f} food={f} count={available?.[f]} onClick={() => onPick(f)} title={t('food.add', { food: t(`foods.${f}`) })} />
      ))}
    </div>
  )
}
