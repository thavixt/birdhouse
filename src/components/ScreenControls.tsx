import { useTranslation } from 'react-i18next'
import { cn } from 'cn'
import FullscreenButton from './FullscreenButton'
import LanguageSwitch from './LanguageSwitch'
import RulesButton from './RulesButton'
import ToolbarButton from './ui/ToolbarButton'

type Props = {
  /** Show the Rules button. */
  rules?: boolean
  /** Show a Quit button. */
  onQuit?: () => void
  className?: string
}

/** The screen-level controls, in one order everywhere: language, fullscreen, Rules, Quit. */
export default function ScreenControls({ rules = false, onQuit, className }: Props) {
  const { t } = useTranslation()
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <LanguageSwitch />
      <FullscreenButton />
      {rules && <RulesButton />}
      {onQuit && <ToolbarButton onClick={onQuit}>{t('tracker.quit')}</ToolbarButton>}
    </div>
  )
}
