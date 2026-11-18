import { useTranslation } from 'react-i18next'
import type { Power } from '../game/types'

/** "When activated: …" text for a bird power. */
export default function PowerText({ power }: { power: Power }) {
  const { t } = useTranslation()
  const food = 'food' in power ? t(`foods.${power.food}`) : undefined
  return <>{t('powers.whenActivated', { text: t(`powers.${power.kind}`, { food }) })}</>
}
