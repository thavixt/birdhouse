import { useTranslation } from 'react-i18next'
import { LANGUAGES } from '../i18n'

/** Compact language toggle; each language is labelled in its own language ("English", "Magyar"). */
export default function LanguageSwitch() {
  const { t, i18n } = useTranslation()
  return (
    <div role="group" aria-label={t('language.label')} className="inline-flex overflow-hidden rounded-md border border-stone-300 text-xs font-semibold">
      {LANGUAGES.map((lng) => {
        const active = i18n.resolvedLanguage === lng
        const short = `${lng.slice(0, 2)[0].toUpperCase()}${lng.slice(0, 2)[1]}`;
        return (
          <button
            key={lng}
            type="button"
            onClick={() => void i18n.changeLanguage(lng)}
            aria-pressed={active}
            lang={lng}
            className={`text-sm cursor-pointer px-2 py-1 ${active ? 'bg-stone-800 text-white' : 'bg-white text-stone-700 hover:bg-stone-100'}`}
            title={t(`language.${lng}`)}
          >
            {short}
          </button>
        )
      })}
    </div>
  )
}
