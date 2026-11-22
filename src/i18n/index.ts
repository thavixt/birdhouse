import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import enUS from './en-us.json'
import huHU from './hu-hu.json'

export const LANGUAGE_HU = "hu-hu";
export const LANGUAGE_EN = "en-us";
export const LANGUAGES = [LANGUAGE_EN, LANGUAGE_HU] as const
export type Language = (typeof LANGUAGES)[number]

const STORAGE_KEY = 'birdhouse.language'

function initialLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && (LANGUAGES as readonly string[]).includes(stored)) return stored as Language
  } catch {
    // storage unavailable: fall through to the browser language
  }
  return navigator.language.toLowerCase().startsWith('hu') ? 'hu-hu' : 'en-us'
}

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng
  try {
    localStorage.setItem(STORAGE_KEY, lng)
  } catch {
    // not persisted; fine
  }
})

void i18n.use(initReactI18next).init({
  resources: {
    'en-us': { translation: enUS },
    'hu-hu': { translation: huHU },
  },
  lng: initialLanguage(),
  fallbackLng: 'en-us',
  supportedLngs: LANGUAGES,
  lowerCaseLng: true,
  interpolation: { escapeValue: false }, // React already escapes
})

export default i18n
