import { useId } from "react";
import type { CoverPattern, ShelfCopy } from "@/content/shelf";

/**
 * Drawn cover patterns, one per book, from Malay craft: songket diamonds,
 * awan larat clouds, pucuk rebung shoots, kain pelikat checks, tikar weave,
 * bunga tabur flowers, ombak waves, plus stars and a sun. Linework and
 * pattern only (no calligraphy, no invented Jawi).
 */

type Tile = { w: number; h: number; body: (ink: string, base: string) => React.ReactNode };

const TILES: Record<Exclude<CoverPattern, "matahari">, Tile> = {
  songket: {
    w: 24,
    h: 24,
    body: (ink) => (
      <>
        <path d="M12 0 L24 12 L12 24 L0 12 Z" fill="none" stroke={ink} strokeWidth={1.2} />
        <path d="M12 7 L17 12 L12 17 L7 12 Z" fill={ink} />
        <circle cx="0" cy="0" r="1.6" fill={ink} />
        <circle cx="24" cy="24" r="1.6" fill={ink} />
      </>
    ),
  },
  awan: {
    w: 64,
    h: 40,
    body: (ink) => (
      <path
        d="M0 30 C 14 30, 14 10, 30 10 C 46 10, 46 32, 34 32 C 26 32, 26 22, 33 22 C 37 22, 38 26, 36 28 M30 10 C 44 4, 56 8, 64 30"
        fill="none"
        stroke={ink}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    ),
  },
  rebung: {
    w: 20,
    h: 26,
    body: (ink, base) => (
      <>
        <path d="M0 26 L10 0 L20 26 Z" fill={ink} />
        <path d="M5 26 L10 12 L15 26 Z" fill={base} />
      </>
    ),
  },
  pelikat: {
    w: 28,
    h: 28,
    body: (ink) => (
      <>
        <rect x="0" y="4" width="28" height="6" fill={ink} opacity={0.55} />
        <rect x="4" y="0" width="6" height="28" fill={ink} opacity={0.55} />
        <rect x="0" y="18" width="28" height="2" fill={ink} opacity={0.8} />
        <rect x="18" y="0" width="2" height="28" fill={ink} opacity={0.8} />
      </>
    ),
  },
  bintang: {
    w: 48,
    h: 48,
    body: (ink) => (
      <>
        <path d="M10 4 L11.5 9 L16 10.5 L11.5 12 L10 17 L8.5 12 L4 10.5 L8.5 9 Z" fill={ink} />
        <circle cx="34" cy="14" r="1.3" fill={ink} />
        <circle cx="26" cy="36" r="2" fill={ink} />
        <path d="M40 30 L40.8 33 L44 34 L40.8 35 L40 38 L39.2 35 L36 34 L39.2 33 Z" fill={ink} />
        <circle cx="6" cy="40" r="1" fill={ink} />
      </>
    ),
  },
  ombak: {
    w: 40,
    h: 18,
    body: (ink) => (
      <>
        <path d="M0 9 Q 10 0, 20 9 T 40 9" fill="none" stroke={ink} strokeWidth={1.6} />
        <path d="M0 16 Q 10 7, 20 16 T 40 16" fill="none" stroke={ink} strokeWidth={0.9} opacity={0.6} />
      </>
    ),
  },
  bunga: {
    w: 40,
    h: 40,
    body: (ink, base) => (
      <>
        {[0, 45, 90, 135].map((r) => (
          <ellipse key={r} cx="14" cy="14" rx="3" ry="9" fill={ink} transform={`rotate(${r} 14 14)`} />
        ))}
        <circle cx="14" cy="14" r="2.6" fill={base} />
        <circle cx="33" cy="33" r="2.2" fill={ink} />
      </>
    ),
  },
  tikar: {
    w: 16,
    h: 16,
    body: (ink) => (
      <>
        <rect x="0" y="0" width="8" height="3" fill={ink} />
        <rect x="0" y="5" width="8" height="3" fill={ink} />
        <rect x="8" y="8" width="3" height="8" fill={ink} />
        <rect x="13" y="8" width="3" height="8" fill={ink} />
      </>
    ),
  },
};

function PatternDef({ id, pattern, ink, base, scale = 1 }: { id: string; pattern: CoverPattern; ink: string; base: string; scale?: number }) {
  const tile = TILES[pattern === "matahari" ? "songket" : pattern];
  return (
    <pattern id={id} width={tile.w * scale} height={tile.h * scale} patternUnits="userSpaceOnUse">
      <g transform={`scale(${scale})`}>{tile.body(ink, base)}</g>
    </pattern>
  );
}

/** A sun with rays, for Klara and the Sun. */
function Sun({ ink, cx, cy, r }: { ink: string; cx: number; cy: number; r: number }) {
  return (
    <g>
      {Array.from({ length: 24 }, (_, i) => {
        const a = (i / 24) * Math.PI * 2;
        const r1 = r * 1.18;
        const r2 = r * (i % 2 ? 1.5 : 1.9);
        return (
          <line
            key={i}
            x1={cx + Math.cos(a) * r1}
            y1={cy + Math.sin(a) * r1}
            x2={cx + Math.cos(a) * r2}
            y2={cy + Math.sin(a) * r2}
            stroke={ink}
            strokeWidth={2.2}
            strokeLinecap="round"
          />
        );
      })}
      <circle cx={cx} cy={cy} r={r} fill={ink} />
    </g>
  );
}

/** Spine art: a strip of the book's pattern filling the right part of the spine. */
export function SpineArt({ copy }: { copy: ShelfCopy }) {
  // useId: the same book renders twice (shelf and dialog), and pattern ids must be unique.
  const id = `sp-${useId().replace(/:/g, "")}`;
  return (
    <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <PatternDef id={id} pattern={copy.pattern} ink={copy.ink} base={copy.colour} scale={0.8} />
      </defs>
      {copy.pattern === "matahari" ? (
        <svg x="64%" width="36%" height="100%" viewBox="0 0 100 40" preserveAspectRatio="xMidYMid slice">
          <Sun ink={copy.ink} cx={50} cy={20} r={9} />
        </svg>
      ) : (
        <rect x="64%" y="0" width="36%" height="100%" fill={`url(#${id})`} />
      )}
    </svg>
  );
}

/** Cover art for the front board, drawn landscape (spine length x cover width). */
export function CoverArt({ copy }: { copy: ShelfCopy }) {
  const id = `cv-${useId().replace(/:/g, "")}`;
  return (
    <svg viewBox="0 0 300 192" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <PatternDef id={id} pattern={copy.pattern} ink={copy.ink} base={copy.colour} scale={1.1} />
      </defs>
      <rect width="300" height="192" fill={copy.colour} />
      {copy.pattern === "matahari" ? (
        <Sun ink={copy.ink} cx={222} cy={96} r={38} />
      ) : (
        <rect x="132" y="0" width="168" height="192" fill={`url(#${id})`} />
      )}
    </svg>
  );
}
