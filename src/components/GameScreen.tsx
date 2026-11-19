import { useState } from 'react'
import { BIRDS_BY_ID } from '../game/birds'
import { canPayCost, drawCount, eggCostForSlot, layCount, playableHabitats } from '../game/engine'
import type { GameAction, GameState, Habitat, SlotRef } from '../game/types'
import { addEgg, eggDelta, IDLE, startLayEggs, startPlayBird, totalCount, type Draft } from '../draft'
import ActionPanel from './ActionPanel'
import Board from './Board'
import CardTray from './CardTray'
import GameLog from './GameLog'
import Hand from './Hand'
import RoundTracker from './RoundTracker'

type Props = {
  state: GameState
  dispatch: (action: GameAction) => void
  onQuit: () => void
}

export default function GameScreen({ state, dispatch, onQuit }: Props) {
  // The draft is stamped with the log length, so it resets after every action.
  const turnStamp = state.log.length
  const [stamped, setStamped] = useState<{ at: number; draft: Draft }>({ at: turnStamp, draft: IDLE })
  const draft = stamped.at === turnStamp ? stamped.draft : IDLE
  const setDraft = (d: Draft) => setStamped({ at: turnStamp, draft: d })

  const current = state.currentPlayer
  const player = state.players[current]
  const humanTurn = player.kind === 'human' && state.phase === 'playing'
  // Whose board/hand is shown up top: the acting human, or the first human while bots play.
  const viewIdx = humanTurn ? current : Math.max(0, state.players.findIndex((p) => p.kind === 'human'))
  const viewed = state.players[viewIdx]

  const isPlayable = (cardId: string) =>
    canPayCost(player, BIRDS_BY_ID[cardId].cost) && playableHabitats(state, current, cardId).length > 0

  function onHabitatAction(habitat: Habitat) {
    if (habitat === 'forest') setDraft({ kind: 'gainFood', foods: [] })
    else if (habitat === 'grassland') setDraft(startLayEggs(state))
    else setDraft({ kind: 'drawCards', picks: [] })
  }

  function onBirdClick(slot: SlotRef) {
    const bird = player.board[slot.habitat][slot.index]
    if (draft.kind === 'layEggs') {
      const room = BIRDS_BY_ID[bird.cardId].eggLimit - bird.eggs - eggDelta(draft.placements, slot)
      if (room > 0 && totalCount(draft.placements) < layCount(player)) {
        setDraft({ ...draft, placements: addEgg(draft.placements, slot) })
      }
    } else if (draft.kind === 'playBird' && draft.habitat) {
      const needed = eggCostForSlot(player.board[draft.habitat].length)
      if (bird.eggs - eggDelta(draft.eggs, slot) > 0 && totalCount(draft.eggs) < needed) {
        setDraft({ ...draft, eggs: addEgg(draft.eggs, slot) })
      }
    }
  }

  function boardEggDelta(slot: SlotRef): number {
    if (draft.kind === 'layEggs') return eggDelta(draft.placements, slot)
    if (draft.kind === 'playBird') return -eggDelta(draft.eggs, slot)
    return 0
  }

  const pickedTray = draft.kind === 'drawCards' ? draft.picks.flatMap((p) => (p.from === 'tray' ? [p.index] : [])) : []
  const pickedDeck = draft.kind === 'drawCards' ? draft.picks.filter((p) => p.from === 'deck').length : 0
  const drawsLeft = draft.kind === 'drawCards' ? drawCount(state, current) - draft.picks.length : 0

  function onPickTray(index: number) {
    if (draft.kind !== 'drawCards') return
    if (pickedTray.includes(index)) {
      setDraft({ ...draft, picks: draft.picks.filter((p) => !(p.from === 'tray' && p.index === index)) })
    } else if (drawsLeft > 0) {
      setDraft({ ...draft, picks: [...draft.picks, { from: 'tray', index }] })
    }
  }

  function onPickDeck() {
    if (draft.kind === 'drawCards' && drawsLeft > 0 && pickedDeck < state.deck.length) {
      setDraft({ ...draft, picks: [...draft.picks, { from: 'deck' }] })
    }
  }

  const interactive = humanTurn && viewIdx === current

  return (
    <main className="min-h-screen bg-linear-to-b from-emerald-50 to-stone-100 p-2 text-stone-900 sm:p-3 md:p-4">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:gap-3">
        <RoundTracker state={state} onQuit={onQuit} />
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="flex min-w-0 flex-col gap-3">
            <Board
              player={viewed}
              active={viewIdx === current}
              turnsLeft={state.turnsLeft[viewIdx]}
              onAction={interactive ? onHabitatAction : undefined}
              onBirdClick={interactive && (draft.kind === 'layEggs' || draft.kind === 'playBird') ? onBirdClick : undefined}
              eggDelta={interactive ? boardEggDelta : undefined}
              nextSlot={interactive && draft.kind === 'playBird' ? draft.habitat : null}
            />
            <Hand
              cards={viewed.hand}
              selected={draft.kind === 'playBird' ? draft.cardId : null}
              isPlayable={(id) => !interactive || isPlayable(id)}
              onSelect={interactive ? (id) => setDraft(startPlayBird(state, id)) : undefined}
            />
            <CardTray
              tray={state.tray}
              deckCount={state.deck.length}
              pickedTray={pickedTray}
              pickedDeck={pickedDeck}
              onPickTray={interactive && draft.kind === 'drawCards' ? onPickTray : undefined}
              onPickDeck={interactive && draft.kind === 'drawCards' ? onPickDeck : undefined}
            />
          </div>
          <aside className="flex flex-col gap-3">
            <div className="hidden lg:block">
              <ActionPanel state={state} draft={draft} setDraft={setDraft} onConfirm={dispatch} />
            </div>
            <GameLog log={state.log} />
          </aside>
        </div>
        {state.players.map((p, i) =>
          i === viewIdx ? null : <Board key={p.id} player={p} active={i === current} turnsLeft={state.turnsLeft[i]} />,
        )}
        {/*
          Below lg the action panel is docked to the bottom of the screen. It is `sticky`
          as the last child of the page column, so it stays in view while scrolling but
          settles into its own space at the end and never permanently covers content.
        */}
        <div className="sticky bottom-0 z-20 -mx-2 max-h-[55vh] overflow-y-auto px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden">
          <ActionPanel state={state} draft={draft} setDraft={setDraft} onConfirm={dispatch} docked />
        </div>
      </div>
    </main>
  )
}
