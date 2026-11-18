import { Trans, useTranslation } from 'react-i18next'

type Props = { onClose: () => void }

const bold = { b: <b /> }

export default function RulesModal({ onClose }: Props) {
  const { t } = useTranslation()
  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-label={t('rules.title')}
        className="max-h-[90vh] max-w-xl overflow-y-auto rounded-xl bg-white p-5 text-sm shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-2 text-xl font-bold">{t('rules.title')}</h2>
        <p className="mb-2">{t('rules.intro')}</p>
        <ul className="mb-2 list-disc space-y-1 pl-5">
          {(['playBird', 'gainFood', 'layEggs', 'drawCards'] as const).map((k) => (
            <li key={k}>
              <Trans i18nKey={`rules.${k}`} components={bold} />
            </li>
          ))}
        </ul>
        <p className="mb-2">{t('rules.powers')}</p>
        <p className="mb-2">{t('rules.goals')}</p>
        <p className="mb-4">
          <Trans i18nKey="rules.scoring" components={bold} />
        </p>
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer rounded-md bg-violet-700 px-4 py-1.5 font-semibold text-white hover:bg-violet-800"
        >
          {t('rules.close')}
        </button>
      </div>
    </div>
  )
}
