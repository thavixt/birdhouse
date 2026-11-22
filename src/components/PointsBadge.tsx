import { useTranslation } from 'react-i18next'
import { cn } from 'cn'

/** A bird's victory points as a small dark badge (game card, info card). */
export default function PointsBadge({ points, className }: { points: number; className?: string }) {
  const { t } = useTranslation()
  return (
    <span className={cn('shrink-0 rounded bg-stone-800 px-1.5 text-sm font-bold text-white', className)} title={t('card.points')}>
      {points}
    </span>
  )
}
