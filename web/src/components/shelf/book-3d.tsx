import { BayuMark } from "@/components/bayu-mark";
import type { ShelfCopy } from "@/content/shelf";
import { CoverArt, SpineArt } from "./cover-art";

/**
 * A book as a real CSS 3D box lying flat, spine towards you. Six faces:
 * spine (front), fore-edge (back), front cover (top), back cover (bottom) and
 * the two page ends. Size comes from CSS variables: --w (spine length) and --t
 * (thickness); the cover depth is derived in globals.css (.book3d).
 */
export function Book3D({
  copy,
  className = "",
  size = "min(720px, 86vw)",
}: {
  copy: ShelfCopy;
  className?: string;
  /** Length of the longest spine; each book is a share of it (copy.length). */
  size?: string;
}) {
  const vars = {
    color: copy.text,
    "--w": `calc(${size} * ${copy.length})`,
    "--t": `calc(${copy.thick}px * var(--k, 1))`,
  } as React.CSSProperties;
  return (
    <div className={`book3d ${className}`} style={vars}>
      {/* Spine */}
      <div className="f f-spine overflow-hidden" style={{ background: copy.colour }}>
        <SpineArt copy={copy} />
        <div className="relative flex h-full items-center pr-[2.5%] pl-[3%]">
          <div className="flex w-[54%] min-w-0 items-center gap-[5%]">
            <span className="w-[34%] shrink-0 truncate text-[clamp(8px,0.95vw,12px)] font-semibold tracking-[0.02em]">
              {copy.author}
            </span>
            <span className="min-w-0 flex-1 truncate font-display text-[clamp(11px,1.45vw,19px)] font-medium">
              {copy.title}
            </span>
          </div>
          <span
            className="ml-auto grid aspect-square h-[clamp(16px,52%,30px)] shrink-0 place-items-center rounded-full"
            style={{ background: copy.colour, color: copy.text }}
          >
            <BayuMark className="h-[68%] w-[68%]" />
          </span>
        </div>
      </div>

      {/* Front cover (faces up while the book lies on the stack) */}
      <div className="f f-top overflow-hidden">
        <CoverArt copy={copy} />
        <div className="relative flex h-full w-[46%] flex-col justify-between p-[5%]">
          <span className="font-display text-[clamp(18px,3vw,40px)] leading-[1.02] font-semibold">{copy.title}</span>
          <span className="text-[clamp(10px,1.2vw,15px)] font-semibold">{copy.author}</span>
        </div>
      </div>

      {/* Back cover */}
      <div className="f f-bottom" style={{ background: copy.colour }}>
        <div className="f-shade" />
      </div>

      {/* Fore-edge (the page block, seen from behind) */}
      <div className="f f-fore pages" style={{ borderColor: copy.colour }} />

      {/* Page ends */}
      <div className="f f-left pages" style={{ borderColor: copy.colour }}>
        <div className="f-shade" />
      </div>
      <div className="f f-right pages" style={{ borderColor: copy.colour }}>
        <div className="f-shade" />
      </div>
    </div>
  );
}
