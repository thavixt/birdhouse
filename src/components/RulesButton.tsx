import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import RulesModal from './RulesModal'
import ToolbarButton from './ui/ToolbarButton'

/** "Rules" button that opens the rules dialog. Self-contained: drop it anywhere. */
export default function RulesButton() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  return (
    <>
      <ToolbarButton onClick={() => setOpen(true)} aria-haspopup="dialog">
        {t('rules.button')}
      </ToolbarButton>
      {open && <RulesModal onClose={() => setOpen(false)} />}
    </>
  )
}
