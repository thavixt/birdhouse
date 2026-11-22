import { Joyride, STATUS, type EventData, type Step } from 'react-joyride'
import { useTranslation } from 'react-i18next'

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
  const step = (target: Step['target'], key: string, extra: Partial<Step> = {}): Step => ({
    target,
    title: t(`tutorial.${key}.title`, { name }),
    content: t(`tutorial.${key}.body`),
    ...extra,
  })
  const steps: Step[] = [
    step('body', 'welcome', { placement: 'center' }),
    step('[data-tour="hand"]', 'hand'),
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
