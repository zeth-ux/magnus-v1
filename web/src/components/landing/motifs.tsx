/**
 * Shared drawings for the landing page, all in one 1280×800 coordinate space
 * so every layer of a scene lines up. Paths are geometry (linework), not
 * pictures: awan larat ("drifting clouds") curls for the wind, and a carved
 * ventilation panel (ukiran tebuk tembus) from a Malay house.
 */

export const ART_VIEWBOX = "0 0 1280 800";

/** Wind lines in the awan larat style, drawn across the sky. */
export const WIND_LINES = [
  "M-20 300 C 120 200, 260 200, 340 290 C 400 360, 500 360, 520 290 C 534 240, 488 216, 462 242 C 442 262, 462 292, 486 280",
  "M520 290 C 620 200, 760 190, 860 260 C 930 310, 1030 300, 1060 250 C 1078 220, 1052 196, 1028 208 C 1008 218, 1016 246, 1038 242",
  "M-20 560 C 140 500, 300 510, 420 570 C 520 620, 600 612, 660 580",
  "M780 640 C 880 600, 990 610, 1070 650 C 1130 680, 1210 670, 1300 630",
];

/** Gold awan larat that draws itself once the kayu world opens. */
export const GOLD_LINES = [
  "M880 150 C 960 100, 1060 110, 1100 170 C 1130 214, 1190 214, 1202 176 C 1210 150, 1184 134, 1166 148 C 1152 160, 1162 180, 1178 174",
  "M60 690 C 140 640, 240 650, 290 710 C 320 746, 380 744, 396 710 C 404 690, 384 676, 368 688",
  "M860 680 C 940 630, 1040 640, 1090 700 C 1120 736, 1180 734, 1196 700",
];

/** The path the book rides: up from its reader, through the panel, onward. */
export const FLIGHT_PATH =
  "M640 650 C 520 600, 470 520, 560 460 C 610 426, 636 418, 652 384 C 690 316, 790 196, 980 132";

/** One mirrored pair of curls on the panel's centre stem. */
function PanelCurls({ y }: { y: number }) {
  return (
    <g transform={`translate(0 ${y})`}>
      <path d="M640 0 C 612 -18, 576 -10, 572 16 C 568 40, 594 48, 604 34 C 612 22, 600 12, 592 18" />
      <path d="M640 0 C 668 -18, 704 -10, 708 16 C 712 40, 686 48, 676 34 C 668 22, 680 12, 688 18" />
      <path d="M640 52 C 650 40, 662 40, 668 48 C 658 58, 648 58, 640 52 Z M640 52 C 630 40, 618 40, 612 48 C 622 58, 632 58, 640 52 Z" />
    </g>
  );
}

/** The carved panel, centred at (640, 400). Each <path> can be drawn with DrawSVG. */
export function CarvedPanel() {
  return (
    <>
      <path d="M510 600 V 290 Q 510 200 640 200 Q 770 200 770 290 V 600 Z" />
      <path d="M530 580 V 298 Q 530 222 640 222 Q 750 222 750 298 V 580 Z" strokeWidth={1.4} />
      <path d="M640 248 V 562" />
      <PanelCurls y={300} />
      <PanelCurls y={400} />
      <PanelCurls y={500} />
    </>
  );
}

/** The open book a reader holds, spine at x = 640. */
export const BOOK_LEFT = "M640 640 C 600 620, 545 618, 510 632 L 510 742 C 545 728, 600 730, 640 750 Z";
export const BOOK_RIGHT = "M640 640 C 680 620, 735 618, 770 632 L 770 742 C 735 728, 680 730, 640 750 Z";
/** Where the lifting pages hinge (the bottom of the spine), for GSAP's svgOrigin. */
export const SPINE_ORIGIN = "640 748";

/** A small open book drawn around (0, 0), so it can ride the flight path. */
export function FlyingBook() {
  return (
    <>
      <path d="M0 -16 C -12 -22, -28 -22, -40 -18 L -40 18 C -28 14, -12 14, 0 20 Z" fill="#eeeeea" />
      <path d="M0 -16 C 12 -22, 28 -22, 40 -18 L 40 18 C 28 14, 12 14, 0 20 Z" fill="#eeeeea" />
    </>
  );
}

/**
 * Pucuk rebung ("bamboo shoot"): the rising-triangle border of songket cloth.
 * Used once, as the full-width band that divides the page's two halves.
 */
export function PucukRebungBand({ className, id = "pucuk" }: { className?: string; id?: string }) {
  return (
    <svg className={className} width="100%" height="64" aria-hidden="true" preserveAspectRatio="none">
      <defs>
        <pattern id={id} width="56" height="64" patternUnits="userSpaceOnUse">
          <rect width="56" height="64" fill="#6e1f1f" />
          <path d="M0 60 L28 6 L56 60 Z" fill="#c9a24a" />
          <path d="M12 60 L28 28 L44 60 Z" fill="#6e1f1f" />
          <path d="M22 60 L28 47 L34 60 Z" fill="#c9a24a" />
          <rect y="60" width="56" height="4" fill="#c9a24a" />
        </pattern>
      </defs>
      <rect width="100%" height="64" fill={`url(#${id})`} />
    </svg>
  );
}
