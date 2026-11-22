import { getI18n } from 'react-i18next'

/**
 * Debug aid: in `npm run dev` bird names can be followed by the bird's id (see `DevBirdId`),
 * so cards, board slots, the log and error messages can be traced back to `birds.ts`. Off in
 * production builds, and in tests so they can check exact player-facing text.
 */
export const SHOW_BIRD_IDS = import.meta.env.DEV && import.meta.env.MODE !== 'test'

/**
 * The bird's name in the current language, for plain-text places (log, errors, titles).
 * Uses the app's global i18n instance (`getI18n()`, registered by `initReactI18next` in
 * `./index.ts`), so callers don't pass `t`. Called during render, it follows language
 * changes because components re-render through `useTranslation()`.
 */
export function birdName(id: string): string {
  return getI18n().t(`birds.${id}`)
}
