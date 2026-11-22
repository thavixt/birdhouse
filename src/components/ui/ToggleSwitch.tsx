type Props = { checked: boolean; onChange: (checked: boolean) => void }

/** Accessible on/off switch (`role="switch"`). Put it inside a <label> with its text. */
export default function ToggleSwitch({ checked, onChange }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${checked ? 'bg-violet-700' : 'bg-stone-300'}`}
    >
      <span
        aria-hidden
        className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`}
      />
    </button>
  )
}
