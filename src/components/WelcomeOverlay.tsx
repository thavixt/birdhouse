import { useTranslation } from 'react-i18next'
import FullscreenButton from './FullscreenButton'
import LanguageSwitch from './LanguageSwitch'

type Props = {
  onClose: () => void
}

/** Full-screen welcome shown once, on the first visit (see "Persistence" in AGENTS.md). */
export default function WelcomeOverlay({ onClose }: Props) {
  const { t } = useTranslation()
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-linear-to-b from-emerald-800 to-emerald-950 p-4 text-center text-white"
    >
      <div className="flex max-w-md flex-col items-center gap-4">
        <span aria-hidden className="text-5xl">
          🐦
        </span>
        <h2 id="welcome-title" className="text-2xl font-bold sm:text-3xl">
          {t('welcome.title')}
        </h2>
        <p className="text-emerald-100">{t('welcome.intro')}</p>
        <p className="text-emerald-100">{t('welcome.goal')}</p>
        <button
          type="button"
          autoFocus
          onClick={onClose}
          className="cursor-pointer rounded-lg bg-white px-5 py-2.5 font-semibold text-emerald-900 shadow-lg hover:bg-emerald-50"
        >
          {t('welcome.start')}
        </button>
        <div className="flex items-center gap-2">
          <LanguageSwitch />
          <FullscreenButton />
        </div>
      </div>
    </div>
  )
}
