import { useTranslation } from 'react-i18next'
import ScreenControls from './ScreenControls'
import CoverDialog from './ui/CoverDialog'

type Props = {
  name: string
  onReady: () => void
  onQuit: () => void
}

/**
 * Opaque full-screen cover between hot-seat turns, so the next player's hand isn't shown
 * until they have the device.
 */
export default function HandoffOverlay({ name, onQuit, onReady }: Props) {
  const { t } = useTranslation()
  return (
    <CoverDialog
      title={t('handoff.title', { name })}
      actionLabel={t('handoff.ready', { name })}
      onAction={onReady}
      controls={<ScreenControls rules onQuit={onQuit} />}
    >
      <p>{t('handoff.body', { name })}</p>
    </CoverDialog>
  )
}
