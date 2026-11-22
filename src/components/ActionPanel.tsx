import { Trans, useTranslation } from 'react-i18next'
import type { Draft } from '../draft'
import type { GameAction, GameState } from '../game/types'
import DrawCardsPanel from './action-panel/DrawCardsPanel'
import GainFoodPanel from './action-panel/GainFoodPanel'
import LayEggsPanel from './action-panel/LayEggsPanel'
import PanelFooter from './action-panel/PanelFooter'
import PanelFrame from './action-panel/PanelFrame'
import PlayBirdPanel from './action-panel/PlayBirdPanel'

type Props = {
  state: GameState
  draft: Draft
  setDraft: (d: Draft) => void
  onConfirm: (action: GameAction) => void
  /** Docked to the bottom of a phone screen: shorter idle text and a lifted shadow. */
  docked?: boolean
}

/** Contextual prompt for the current human player's in-progress action. */
export default function ActionPanel({ state, draft, setDraft, onConfirm, docked = false }: Props) {
  const { t } = useTranslation()
  const player = state.players[state.currentPlayer]

  if (state.phase === 'gameOver') return null
  if (player.kind === 'bot') {
    return (
      <PanelFrame docked={docked} title={t('panel.botThinkingTitle', { name: player.name })}>
        {t('panel.botThinking')}
      </PanelFrame>
    )
  }

  const footer = <PanelFooter state={state} draft={draft} setDraft={setDraft} onConfirm={onConfirm} />
  const common = { state, setDraft, footer, docked }
  switch (draft.kind) {
    case 'idle':
      return (
        <PanelFrame docked={docked} title={t('panel.yourTurnTitle', { name: player.name })}>
          {docked ? t('panel.yourTurnShort') : <Trans i18nKey="panel.yourTurn" components={{ b: <b /> }} />}
        </PanelFrame>
      )
    case 'playBird':
      return <PlayBirdPanel {...common} draft={draft} />
    case 'gainFood':
      return <GainFoodPanel {...common} draft={draft} />
    case 'layEggs':
      return <LayEggsPanel {...common} draft={draft} />
    case 'drawCards':
      return <DrawCardsPanel {...common} draft={draft} />
  }
}
