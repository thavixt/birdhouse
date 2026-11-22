import { useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'

// The browser's fullscreen state as an external store, so the icon also follows leaving
// fullscreen with Esc or the browser's own controls.
function subscribe(onChange: () => void) {
  document.addEventListener('fullscreenchange', onChange)
  return () => document.removeEventListener('fullscreenchange', onChange)
}
const isFullscreen = () => document.fullscreenElement !== null

function toggle() {
  if (document.fullscreenElement) void document.exitFullscreen().catch(() => {})
  else void document.documentElement.requestFullscreen().catch(() => {})
}

/**
 * Icon button that toggles fullscreen for the whole app. Sits next to the language switch.
 * Hidden where the Fullscreen API isn't available (e.g. Safari on iPhone).
 */
export default function FullscreenButton() {
  const { t } = useTranslation()
  const fullscreen = useSyncExternalStore(subscribe, isFullscreen, () => false)
  if (typeof document === 'undefined' || !document.fullscreenEnabled) return null
  const label = t(fullscreen ? 'fullscreen.exit' : 'fullscreen.enter')
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      aria-pressed={fullscreen}
      title={label}
      className="inline-flex size-7.5 shrink-0 cursor-pointer items-center justify-center rounded-md border border-stone-300 bg-white text-stone-700 hover:bg-stone-100"
    >
      <svg viewBox="0 0 24 24" aria-hidden className="size-4 fill-none stroke-current stroke-2" strokeLinecap="round" strokeLinejoin="round">
        {fullscreen ? (
          // Corners pointing inwards: leave fullscreen.
          <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
        ) : (
          // Corners pointing outwards: go fullscreen.
          <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
        )}
      </svg>
    </button>
  )
}
