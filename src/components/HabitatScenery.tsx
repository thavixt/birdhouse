import { useId, type ReactNode } from 'react'
import type { Habitat } from '../game/types'

// Decorative backdrop for a habitat row: a soft sky gradient plus a strip of scenery along
// the bottom, drawn as a 120×48 SVG tile repeated across the row's width. Original art made
// of simple shapes; colours are Tailwind fill/stroke classes so they follow the theme.
// Every tile starts and ends at the same height so the repeats join without seams.

const TILE = { w: 120, h: 48 }

/** A two-tier pine tree standing on the bottom edge: centre x, height, half-width. */
function pine(x: number, height: number, half: number): string {
  const top = TILE.h - height
  const at = (f: number) => top + height * f
  return [
    [x, top],
    [x - half * 0.55, at(0.38)],
    [x - half * 0.3, at(0.38)],
    [x - half * 0.8, at(0.72)],
    [x - half * 0.45, at(0.72)],
    [x - half, TILE.h],
    [x + half, TILE.h],
    [x + half * 0.45, at(0.72)],
    [x + half * 0.8, at(0.72)],
    [x + half * 0.3, at(0.38)],
    [x + half * 0.55, at(0.38)],
  ]
    .map(([px, py]) => `${px},${py}`)
    .join(' ')
}

/** Waterline wave across the whole tile at height `y`. */
const wave = (y: number) => `M0 ${y}` + ' q7.5 -2.5 15 0'.repeat(TILE.w / 15)

const SCENES: Record<Habitat, { sky: string; tile: ReactNode }> = {
  forest: {
    sky: 'bg-linear-to-b from-emerald-50 to-emerald-100',
    tile: (
      <>
        <g className="fill-emerald-300/70">
          {[[14, 34, 9], [52, 42, 11], [96, 30, 8]].map(([x, h, w]) => (
            <polygon key={x} points={pine(x, h, w)} />
          ))}
        </g>
        <g className="fill-emerald-600/45">
          {[[32, 44, 11], [74, 36, 10], [108, 40, 10]].map(([x, h, w]) => (
            <polygon key={x} points={pine(x, h, w)} />
          ))}
        </g>
        <rect y={TILE.h - 3} width={TILE.w} height={3} className="fill-emerald-700/35" />
      </>
    ),
  },
  grassland: {
    sky: 'bg-linear-to-b from-sky-50 via-amber-50 to-amber-100',
    tile: (
      <>
        <path d="M0 34 Q30 22 60 32 T120 34 V48 H0 Z" className="fill-lime-300/60" />
        <path d="M0 40 Q30 34 60 40 T120 40 V48 H0 Z" className="fill-lime-400/55" />
        <g className="fill-none stroke-lime-600/60" strokeWidth={1} strokeLinecap="round">
          {[8, 27, 45, 66, 83, 101, 116].map((x) => (
            <path key={x} d={`M${x} 48 l-2 -7 M${x + 2} 48 l1 -6`} />
          ))}
        </g>
        <g className="fill-amber-400">
          {[[19, 42], [55, 45], [88, 43], [109, 46]].map(([x, y]) => (
            <circle key={x} cx={x} cy={y} r={1.8} />
          ))}
        </g>
        <g className="fill-rose-300">
          {[[37, 44], [73, 46]].map(([x, y]) => (
            <circle key={x} cx={x} cy={y} r={1.5} />
          ))}
        </g>
      </>
    ),
  },
  wetland: {
    sky: 'bg-linear-to-b from-sky-50 to-sky-100',
    tile: (
      <>
        <rect y={31} width={TILE.w} height={TILE.h - 31} className="fill-sky-300/55" />
        <g className="fill-none stroke-white/80" strokeWidth={1}>
          <path d={wave(36)} />
          <path d={wave(43)} transform="translate(-7 0)" />
          <path d={wave(43)} transform="translate(113 0)" />
        </g>
        <ellipse cx={62} cy={39} rx={8} ry={2.2} className="fill-emerald-500/55" />
        <g className="stroke-emerald-700/55" strokeWidth={1.2} strokeLinecap="round">
          {[[16, 12], [21, 16], [26, 10], [92, 14], [98, 18]].map(([x, top]) => (
            <line key={x} x1={x} y1={40} x2={x} y2={top} />
          ))}
        </g>
        <g className="fill-amber-800/55">
          {[[16, 12], [26, 10], [92, 14]].map(([x, top]) => (
            <rect key={x} x={x - 1.6} y={top + 2} width={3.2} height={8} rx={1.6} />
          ))}
        </g>
      </>
    ),
  },
}

/** Fills its (relative, `isolate`d) parent from behind; purely decorative. */
export default function HabitatScenery({ habitat }: { habitat: Habitat }) {
  const id = useId()
  const scene = SCENES[habitat]
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 -z-10 ${scene.sky}`}>
      <svg className="absolute bottom-0 left-0 h-12 w-full">
        <defs>
          <pattern id={id} width={TILE.w} height={TILE.h} patternUnits="userSpaceOnUse">
            {scene.tile}
          </pattern>
        </defs>
        <rect width="100%" height={TILE.h} fill={`url(#${id})`} />
      </svg>
    </div>
  )
}
