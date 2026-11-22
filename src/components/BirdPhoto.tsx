import type { BirdImage } from '../bird-images'

type Props = {
  photo: BirdImage
  /** Extra classes, e.g. an opacity to tone the photo down behind small text. */
  className?: string
}

/**
 * A species photo filling its (relative, `isolate`d) parent from behind. Decorative: the
 * bird's name is always shown as text, so `alt` is empty. Lazy-loaded; `crossOrigin` lets
 * the installed app cache it for offline play (Wikimedia allows any origin).
 * The photo's own `className` (positioning, see `BirdImage`) applies everywhere it's shown;
 * the `className` prop adds per-use styling such as an opacity.
 */
export default function BirdPhoto({ photo, className = '' }: Props) {
  return (
    <img
      src={photo.url}
      alt=""
      loading="lazy"
      decoding="async"
      crossOrigin="anonymous"
      draggable={false}
      className={`pointer-events-none absolute inset-0 -z-10 size-full object-cover ${photo.className ?? ''} ${className}`}
    />
  )
}
