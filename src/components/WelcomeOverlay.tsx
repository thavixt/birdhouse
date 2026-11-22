import { useTranslation } from 'react-i18next'
import ScreenControls from './ScreenControls'
import CoverDialog from './ui/CoverDialog'

type Props = {
  onClose: () => void
}

/** Full-screen welcome shown once, on the first visit (see "Persistence" in AGENTS.md). */
export default function WelcomeOverlay({ onClose }: Props) {
  const { t } = useTranslation()
  return (
    <CoverDialog
      title={t('welcome.title')}
      actionLabel={t('welcome.start')}
      onAction={onClose}
      controls={<ScreenControls />}
      wide
      className="z-50"
    >
      <p>{t('welcome.intro')}</p>
      <p>{t('welcome.goal')}</p>
    </CoverDialog>
  )
}
