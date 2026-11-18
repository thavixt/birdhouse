import { useTranslation } from 'react-i18next'
import type { GameMessage } from '../game/types'
import { formatMessage } from '../i18n/message'

type Props = { log: GameMessage[] }

export default function GameLog({ log }: Props) {
  const { t } = useTranslation()
  const recent = log.slice(-12).reverse()
  return (
    <section className="rounded-xl border border-stone-200 bg-white/80 p-3 text-xs shadow-sm">
      <h3 className="mb-1 text-sm font-semibold text-stone-600">{t('log.title')}</h3>
      <ul className="flex flex-col gap-0.5">
        {recent.map((msg, i) => (
          <li key={log.length - i} className={i === 0 ? 'font-semibold' : 'text-stone-600'}>
            {formatMessage(t, msg)}
          </li>
        ))}
      </ul>
    </section>
  )
}
