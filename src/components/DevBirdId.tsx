import { SHOW_BIRD_IDS } from '../i18n/birdName'

/**
 * The bird's id as a small tag, shown after its name in `npm run dev` only (see
 * `SHOW_BIRD_IDS`). Renders nothing in production builds.
 */
export default function DevBirdId({ id, className = '' }: { id: string; className?: string }) {
  if (!SHOW_BIRD_IDS) return null
  return <span className={`font-mono text-[10px] font-normal break-all text-fuchsia-700 ${className}`}>{id}</span>
}
