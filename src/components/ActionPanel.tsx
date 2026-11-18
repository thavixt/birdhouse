import type { ReactNode } from 'react'
import { BIRDS_BY_ID } from '../game/birds'
import { actionCount, drawCount, eggCostForSlot, layCount, playableHabitats, validateAction } from '../game/engine'
import { FOODS, type Food, type GameAction, type GameState } from '../game/types'
import { chooseHabitat, IDLE, startLayEggs, toAction, totalCount, type Draft } from '../draft'
import { HABITAT_ICON, HABITAT_LABEL, HABITAT_STYLE } from '../theme'
import FoodToken from './FoodToken'

type Props = {
  state: GameState
  draft: Draft
  setDraft: (d: Draft) => void
  onConfirm: (action: GameAction) => void
}

const btn = 'rounded-md px-3 py-1.5 text-sm font-semibold cursor-pointer disabled:cursor-not-allowed disabled:opacity-40'
const secondary = `${btn} bg-stone-200 hover:bg-stone-300`

/** Contextual prompt for the current human player's in-progress action. */
export default function ActionPanel({ state, draft, setDraft, onConfirm }: Props) {
  const player = state.players[state.currentPlayer]

  if (state.phase === 'gameOver') return null
  if (player.kind === 'bot') {
    return <Panel title={`${player.name} is thinking…`}>🤖 The bot will move in a moment.</Panel>
  }
  if (draft.kind === 'idle') {
    return (
      <Panel title={`${player.name}, it's your turn`}>
        Take <b>one</b> action: click a playable bird in your hand, or press a habitat button on your board to gain food, lay eggs or draw
        cards. Birds in that row then activate their powers right to left.
      </Panel>
    )
  }

  const action = toAction(draft)
  const error = action ? validateAction(state, action) : 'Choose a habitat.'
  const footer = (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <button
        type="button"
        className={`${btn} bg-violet-700 text-white hover:bg-violet-800`}
        disabled={!action || !!error}
        onClick={() => action && onConfirm(action)}
      >
        Confirm
      </button>
      <button type="button" className={secondary} onClick={() => setDraft(IDLE)}>
        Cancel
      </button>
      {error && <span className="text-xs text-rose-700">{error}</span>}
    </div>
  )

  switch (draft.kind) {
    case 'playBird': {
      const card = BIRDS_BY_ID[draft.cardId]
      const habitats = playableHabitats(state, state.currentPlayer, draft.cardId)
      const eggCost = draft.habitat ? eggCostForSlot(player.board[draft.habitat].length) : 0
      const left = { ...player.food }
      for (const f of [...card.cost.foods, ...draft.anyFoods]) left[f]--
      return (
        <Panel title={`Play ${card.name}`}>
          <Step label="Habitat">
            {habitats.map((h) => (
              <button
                key={h}
                type="button"
                className={`${btn} ${draft.habitat === h ? HABITAT_STYLE[h].button : HABITAT_STYLE[h].chip}`}
                onClick={() => setDraft(chooseHabitat(state, draft, h))}
              >
                {HABITAT_ICON[h]} {HABITAT_LABEL[h]}
              </button>
            ))}
          </Step>
          <Step label="Food">
            {card.cost.foods.map((f, i) => (
              <FoodToken key={i} food={f} />
            ))}
            {draft.anyFoods.map((f, i) => (
              <FoodToken
                key={`any-${i}`}
                food={f}
                title="Click to change"
                onClick={() => setDraft({ ...draft, anyFoods: draft.anyFoods.filter((_, j) => j !== i) })}
              />
            ))}
            {draft.anyFoods.length < card.cost.anyCount && (
              <FoodPicker label="pick any:" available={left} onPick={(f) => setDraft({ ...draft, anyFoods: [...draft.anyFoods, f] })} />
            )}
          </Step>
          {eggCost > 0 && (
            <Step label={`Eggs ${totalCount(draft.eggs)}/${eggCost}`}>
              <span className="text-xs text-stone-600">Click birds on your board to remove eggs.</span>
              <button type="button" className={secondary} onClick={() => setDraft({ ...draft, eggs: [] })}>
                Clear
              </button>
            </Step>
          )}
          {footer}
        </Panel>
      )
    }

    case 'gainFood': {
      const n = actionCount(player.board, 'forest')
      return (
        <Panel title={`Gain ${n} food`}>
          <Step label={`Chosen ${draft.foods.length}/${n}`}>
            {draft.foods.map((f, i) => (
              <FoodToken
                key={i}
                food={f}
                title="Click to remove"
                onClick={() => setDraft({ ...draft, foods: draft.foods.filter((_, j) => j !== i) })}
              />
            ))}
          </Step>
          {draft.foods.length < n && <FoodPicker label="Take:" onPick={(f) => setDraft({ ...draft, foods: [...draft.foods, f] })} />}
          {footer}
        </Panel>
      )
    }

    case 'layEggs': {
      const n = layCount(player)
      return (
        <Panel title={`Lay ${n} egg${n === 1 ? '' : 's'}`}>
          <Step label={`Placed ${totalCount(draft.placements)}/${n}`}>
            <span className="text-xs text-stone-600">{n === 0 ? 'No room for eggs; you can still confirm.' : 'Click your birds to add eggs.'}</span>
            <button type="button" className={secondary} onClick={() => setDraft({ ...draft, placements: [] })}>
              Clear
            </button>
            <button type="button" className={secondary} onClick={() => setDraft(startLayEggs(state))}>
              Auto
            </button>
          </Step>
          {footer}
        </Panel>
      )
    }

    case 'drawCards': {
      const n = drawCount(state, state.currentPlayer)
      return (
        <Panel title={`Draw ${n} card${n === 1 ? '' : 's'}`}>
          <Step label={`Picked ${draft.picks.length}/${n}`}>
            <span className="text-xs text-stone-600">Click tray cards or the deck.</span>
            <button type="button" className={secondary} onClick={() => setDraft({ ...draft, picks: [] })}>
              Clear
            </button>
          </Step>
          {footer}
        </Panel>
      )
    }
  }
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-violet-200 bg-violet-50 p-3 text-sm">
      <h3 className="mb-2 font-bold text-violet-900">{title}</h3>
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
  return (
    <div className="flex flex-wrap items-center gap-1">
      <span className="text-xs text-stone-600">{label}</span>
      {FOODS.filter((f) => !available || available[f] > 0).map((f) => (
        <FoodToken key={f} food={f} count={available?.[f]} onClick={() => onPick(f)} title={`Add ${f}`} />
      ))}
    </div>
  )
}
