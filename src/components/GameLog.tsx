type Props = { log: string[] }

export default function GameLog({ log }: Props) {
  const recent = log.slice(-12).reverse()
  return (
    <section className="rounded-xl border border-stone-200 bg-white/80 p-3 text-xs shadow-sm">
      <h3 className="mb-1 text-sm font-semibold text-stone-600">Log</h3>
      <ul className="flex flex-col gap-0.5">
        {recent.map((line, i) => (
          <li key={log.length - i} className={i === 0 ? 'font-semibold' : 'text-stone-600'}>
            {line}
          </li>
        ))}
      </ul>
    </section>
  )
}
