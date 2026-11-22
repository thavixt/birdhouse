import { useEffect, useState } from 'react'
import { Joyride, STATUS, type EventData, type Step } from 'react-joyride'
import { useTranslation } from 'react-i18next'

/** Joyride's default gap between the window top and a target it scrolls to. */
const SCROLL_GAP = 20

/**
 * How far below the window top a scrolled-to target should land: under the RoundTracker
 * while it is sticky (lg+), otherwise just the default gap. Without this, the sticky
 * tracker covers targets near the top of the page (the hand).
 */
function measureScrollOffset(): number {
  const tracker = document.querySelector<HTMLElement>('[data-tour="tracker"]')
  if (!tracker) return SCROLL_GAP
  const style = getComputedStyle(tracker)
  if (style.position !== 'sticky') return SCROLL_GAP
  return Math.ceil((parseFloat(style.top) || 0) + tracker.getBoundingClientRect().height + SCROLL_GAP)
}

/** `measureScrollOffset`, kept up to date when the tracker resizes (goal chips wrap). */
function useScrollOffset(): number {
  const [offset, setOffset] = useState(SCROLL_GAP)
  useEffect(() => {
    const tracker = document.querySelector('[data-tour="tracker"]')
    const update = () => setOffset(measureScrollOffset())
    update()
    if (!tracker) return
    const observer = new ResizeObserver(update)
    observer.observe(tracker)
    return () => observer.disconnect()
  }, [])
  return offset
}

type Props = {
  /** Whose first turn it is (shown in the welcome step). */
  name: string
  onDone: () => void
}

/** The first visible element matching `selector` (the action panel exists twice: sidebar and docked). */
const visible = (selector: string) => () =>
  [...document.querySelectorAll<HTMLElement>(selector)].find((el) => el.getClientRects().length > 0) ?? null

/**
 * A guided tour of the game screen, shown on a human's first turn when the tutorial
 * switch on the start screen is on. Targets are `data-tour` attributes; the player's own
 * board is wrapped in `[data-tour="board"]` so opponents' boards don't match.
 */
export default function TutorialTour({ name, onDone }: Props) {
  const { t } = useTranslation()
  const scrollOffset = useScrollOffset()
  const step =(target: Step['target'], key: string, extra: Partial<Step> = {}): Step => ({
    target,
    title: t(`tutorial.${key}.title`, { name }),
    content: t(`tutorial.${key}.body`),
    ...extra,
  })
  const steps: Step[] = [
    step('body', 'welcome', { placement: 'center' }),
    step('[data-tour="hand"]', 'hand', { placement: 'bottom' }),
    step('[data-tour="board"] [data-tour="food"]', 'food'),
    step('[data-tour="board"]', 'board', { placement: 'top' }),
    step('[data-tour="board"] [data-habitat="forest"]', 'actions', { placement: 'right' }),
    step('[data-tour="tray"]', 'tray'),
    step('[data-tour="goals"]', 'goals'),
    step(visible('[data-tour="panel"]'), 'panel', { placement: 'auto' }),
  ]

  function onEvent(data: EventData) {
    if (data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED) onDone()
  }

  return (
    <Joyride
      run
      continuous
      steps={steps}
      onEvent={onEvent}
      options={{
        buttons: ['back', 'skip', 'primary'],
        showProgress: true,
        skipBeacon: true,
        primaryColor: '#6d28d9', // violet-700, like the Confirm button
        textColor: '#1c1917', // stone-900
        zIndex: 50, // above the docked action panel (z-20)
        overlayClickAction: false,
        scrollOffset, // land targets below the sticky RoundTracker
      }}
      locale={{
        back: t('tutorial.back'),
        close: t('tutorial.close'),
        last: t('tutorial.last'),
        next: t('tutorial.next'),
        nextWithProgress: t('tutorial.nextWithProgress'),
        skip: t('tutorial.skip'),
      }}
    />
  )
}
