import { useTranslation } from 'react-i18next'
import type { GameMessage } from '../game/types'
import { formatMessage } from '../i18n/message'
import SidebarCard from './ui/SidebarCard'

type Props = { log: GameMessage[] }

/** The latest game events, newest first. */
export default function GameLog({ log }: Props) {
  const { t } = useTranslation()
  const recent = log.slice(-12).reverse()
  return (
    <SidebarCard title={t('log.title')} className="text-xs">
      <ul className="flex flex-col gap-0.5 max-h-30 overflow-y-auto">
        {recent.map((msg, i) => (
          <li key={log.length - i} className={i === 0 ? 'font-semibold' : 'text-stone-600'}>
            {formatMessage(t, msg)}
          </li>
        ))}
      </ul>
    </SidebarCard>
  )
}
