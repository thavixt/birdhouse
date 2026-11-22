import { useTranslation } from 'react-i18next'

/**
 * Light, see-through cover while a bot takes its turn, with a spinner and who is playing.
 * Purely visual (`pointer-events-none`): the page still scrolls and the log, Rules and Quit
 * stay usable underneath. It fades in, so short bot turns don't flash.
 * Stacking: above the docked action panel (z-20), below the rules dialog (z-30).
 */
export default function BotTurnOverlay({ name }: { name: string }) {
  const { t } = useTranslation()
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-0 z-1000 flex items-center justify-center bg-stone-900/35 backdrop-blur-sm transition-opacity duration-300 starting:opacity-0"
    >
      <div className="min-h-36 w-72 flex justify-center items-center gap-3 rounded-xl border border-stone-200 bg-white/95 px-4 py-3 shadow-lg">
        <span className="font-semibold text-stone-800">🐦 {t('panel.botThinkingTitle', { name })}</span>
        <span
          aria-hidden
          className="size-6 shrink-0 animate-spin rounded-full border-[3px] border-violet-200 border-t-violet-700 motion-reduce:animate-none"
        />
      </div>
    </div>
  )
}
