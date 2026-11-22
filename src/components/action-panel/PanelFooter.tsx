import { useTranslation } from 'react-i18next'
import { IDLE, toAction, type Draft } from '../../draft'
import { validateAction } from '../../game/engine'
import type { GameAction, GameState } from '../../game/types'
import { formatMessage } from '../../i18n/message'
import { BUTTON, SECONDARY_BUTTON } from '../../theme'

type Props = {
  state: GameState
  draft: Draft
  setDraft: (d: Draft) => void
  onConfirm: (action: GameAction) => void
}

/** Confirm (enabled once the draft is a legal action) and Cancel, plus why it isn't legal yet. */
export default function PanelFooter({ state, draft, setDraft, onConfirm }: Props) {
  const { t } = useTranslation()
  const action = toAction(draft)
  const error = action ? validateAction(state, action) : null
  const errorText = !action ? t('panel.chooseHabitat') : error ? formatMessage(t, error) : null
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <button
        type="button"
        className={`${BUTTON} bg-violet-700 text-white hover:bg-violet-800`}
        disabled={!action || !!error}
        onClick={() => action && onConfirm(action)}
      >
        {t('panel.confirm')}
      </button>
      <button type="button" className={SECONDARY_BUTTON} onClick={() => setDraft(IDLE)}>
        {t('panel.cancel')}
      </button>
      {errorText && <span className="text-xs text-rose-700">{errorText}</span>}
    </div>
  )
}
