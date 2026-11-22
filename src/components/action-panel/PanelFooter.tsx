import { useTranslation } from 'react-i18next'
import { IDLE, toAction } from '../../draft'
import { validateAction } from '../../game/engine'
import { formatMessage } from '../../i18n/message'
import { useGame, useGameStore } from '../../store/gameStore'
import { BUTTON, SECONDARY_BUTTON } from '../../theme'

/** Confirm (enabled once the draft is a legal action) and Cancel, plus why it isn't legal yet. */
export default function PanelFooter() {
  const { t } = useTranslation()
  const state = useGame()
  const draft = useGameStore((s) => s.draft)
  const setDraft = useGameStore((s) => s.setDraft)
  const dispatch = useGameStore((s) => s.dispatch)
  const action = toAction(draft)
  const error = action ? validateAction(state, action) : null
  const errorText = !action ? t('panel.chooseHabitat') : error ? formatMessage(t, error) : null
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <button
        type="button"
        className={`${BUTTON} bg-violet-700 text-white hover:bg-violet-800`}
        disabled={!action || !!error}
        onClick={() => action && dispatch(action)}
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
