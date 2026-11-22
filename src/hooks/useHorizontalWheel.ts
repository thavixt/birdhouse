/** Pixels per line for `deltaMode === 1` (Firefox reports mouse wheels in lines). */
const LINE_PX = 16

type WheelLike = Pick<WheelEvent, 'deltaX' | 'deltaY' | 'deltaMode' | 'shiftKey' | 'ctrlKey'>
type ScrollBox = Pick<HTMLElement, 'scrollLeft' | 'scrollWidth' | 'clientWidth'>

/**
 * How far to scroll `el` sideways for a wheel event, or null to leave the event alone:
 * - only plain vertical wheel movement is converted (trackpads already scroll sideways,
 *   Shift+wheel does too, Ctrl+wheel zooms);
 * - nothing happens when the content fits, or when `el` is already at the end it would
 *   scroll towards, so the page scrolls on instead of getting stuck.
 */
export function horizontalWheelDelta(e: WheelLike, el: ScrollBox): number | null {
  if (e.shiftKey || e.ctrlKey || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return null
  const max = el.scrollWidth - el.clientWidth
  if (max <= 0) return null
  const delta = e.deltaMode === 1 ? e.deltaY * LINE_PX : e.deltaMode === 2 ? e.deltaY * el.clientWidth : e.deltaY
  if ((delta < 0 && el.scrollLeft <= 0) || (delta > 0 && el.scrollLeft >= max - 1)) return null
  return delta
}

/**
 * Lets a horizontally scrolling container scroll with the mouse wheel. Returns a callback
 * ref: `<div ref={useHorizontalWheel()} className="overflow-x-auto">`.
 * Uses a native, non-passive listener because React's `onWheel` is passive and can't stop
 * the page from scrolling at the same time.
 */
export function useHorizontalWheel<T extends HTMLElement>(): (el: T | null) => (() => void) | undefined {
  return (el) => {
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      const delta = horizontalWheelDelta(e, el)
      if (delta === null) return
      e.preventDefault()
      el.scrollLeft += delta
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }
}
