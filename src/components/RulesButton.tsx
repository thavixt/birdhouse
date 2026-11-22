import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import RulesModal from './RulesModal'
import { cn } from 'cn'

/** "Rules" button that opens the rules dialog. Self-contained: drop it anywhere. */
export default function RulesButton({ className }: { className?: string }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className={cn("cursor-pointer rounded-md bg-stone-200 px-3 py-1 text-sm hover:bg-stone-300", className)}
      >
        {t('rules.button')}
      </button>
      {open && <RulesModal onClose={() => setOpen(false)} />}
    </>
  )
}
