import { describe, expect, it } from 'vitest'
import { horizontalWheelDelta } from '../hooks/useHorizontalWheel'

const wheel = (deltaY: number, more: Partial<Parameters<typeof horizontalWheelDelta>[0]> = {}) => ({
  deltaX: 0,
  deltaY,
  deltaMode: 0,
  shiftKey: false,
  ctrlKey: false,
  ...more,
})
/** A 300px-wide row of 900px content, scrolled to `scrollLeft`. */
const row = (scrollLeft = 100) => ({ scrollLeft, scrollWidth: 900, clientWidth: 300 })

describe('horizontalWheelDelta', () => {
  it('turns vertical wheel movement into sideways scrolling', () => {
    expect(horizontalWheelDelta(wheel(100), row())).toBe(100)
    expect(horizontalWheelDelta(wheel(-100), row())).toBe(-100)
  })

  it('converts line and page units to pixels', () => {
    expect(horizontalWheelDelta(wheel(3, { deltaMode: 1 }), row())).toBe(48)
    expect(horizontalWheelDelta(wheel(1, { deltaMode: 2 }), row())).toBe(300)
  })

  it('leaves trackpad swipes, Shift+wheel and Ctrl+wheel (zoom) alone', () => {
    expect(horizontalWheelDelta(wheel(10, { deltaX: 40 }), row())).toBeNull()
    expect(horizontalWheelDelta(wheel(100, { shiftKey: true }), row())).toBeNull()
    expect(horizontalWheelDelta(wheel(100, { ctrlKey: true }), row())).toBeNull()
  })

  it('lets the page scroll when the content fits or the row is at that end', () => {
    expect(horizontalWheelDelta(wheel(100), { scrollLeft: 0, scrollWidth: 300, clientWidth: 300 })).toBeNull()
    expect(horizontalWheelDelta(wheel(-100), row(0))).toBeNull() // already at the start
    expect(horizontalWheelDelta(wheel(100), row(600))).toBeNull() // already at the end
    expect(horizontalWheelDelta(wheel(100), row(0))).toBe(100) // start, scrolling on
    expect(horizontalWheelDelta(wheel(-100), row(600))).toBe(-100) // end, scrolling back
  })
})
