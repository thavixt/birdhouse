import type { ComponentProps } from 'react'
import { cn } from 'cn'

/**
 * Small grey button for screen-level controls (Rules, Quit). Sets its own text colour, so it
 * reads the same on light screens and on the dark full-screen covers.
 */
export default function ToolbarButton({ className, type = 'button', ...props }: ComponentProps<'button'>) {
  return (
    <button
      type={type}
      className={cn('cursor-pointer rounded-md bg-stone-200 px-3 py-1 text-sm text-stone-900 hover:bg-stone-300', className)}
      {...props}
    />
  )
}
