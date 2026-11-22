import { useTranslation } from 'react-i18next'
import RulesButton from './RulesButton';
import LanguageSwitch from './LanguageSwitch';

type Props = {
  name: string;
  onReady: () => void;
  onQuit: () => void;
}

/**
 * Opaque full-screen cover between hot-seat turns, so the next player's hand isn't shown
 * until they have the device. Covers everything, including the docked action panel.
 */
export default function HandoffOverlay({ name, onQuit, onReady }: Props) {
  const { t } = useTranslation()
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="handoff-title"
      className="fixed inset-0 z-40 flex items-center justify-center bg-linear-to-b from-emerald-800 to-emerald-950 p-4 text-center text-white"
    >
      <div className="flex max-w-sm flex-col items-center gap-4">
        <span aria-hidden className="text-5xl">
          🐦
        </span>
        <h2 id="handoff-title" className="text-2xl font-bold sm:text-3xl">
          {t('handoff.title', { name })}
        </h2>
        <p className="text-emerald-100">{t('handoff.body', { name })}</p>
        <button
          type="button"
          autoFocus
          onClick={onReady}
          className="cursor-pointer rounded-lg bg-white px-5 py-2.5 font-semibold text-emerald-900 shadow-lg hover:bg-emerald-50"
        >
          {t('handoff.ready', { name })}
        </button>
        <div className="flex items-center gap-2">
          <LanguageSwitch />
          <RulesButton className='text-emerald-900' />
          <button type="button" onClick={onQuit} className="cursor-pointer rounded-md bg-stone-200 px-3 py-1 text-sm hover:bg-stone-300 text-emerald-900">
            {t('tracker.quit')}
          </button>
        </div>
      </div>
    </div>
  )
}
