import { useId } from "react";
import { BayuMark } from "@/components/bayu-mark";
import type { ShelfCopy } from "@/content/shelf";
import { PatternDef, Sun } from "@/components/shelf/cover-art";

/**
 * Covers and spines for books standing on the turning shelf, drawn like
 * screen-printed jackets: a card colour, one or two inks laid slightly out of
 * register, a big serif title. Bayu's own designs (never a publisher's art).
 * Text sizes use container units so a cover reads the same at any size.
 */

/** The illustration: a pattern disc overprinted by an ink disc, a little off register. */
function Print({ copy, id }: { copy: ShelfCopy; id: string }) {
  if (copy.pattern === "matahari") {
    return <Sun ink={copy.ink} cx={104} cy={210} r={30} />;
  }
  return (
    <>
      <circle cx={112} cy={204} r={64} fill={`url(#${id})`} />
      <circle cx={96} cy={214} r={52} fill={copy.ink} style={{ mixBlendMode: "multiply" }} opacity={0.9} />
      <circle cx={96} cy={214} r={52} fill="none" stroke={copy.text} strokeWidth={1} opacity={0.35} />
    </>
  );
}

export function PrintCover({ copy, className = "" }: { copy: ShelfCopy; className?: string }) {
  const id = `pc-${useId().replace(/:/g, "")}`;
  return (
    // Decorative everywhere: the title, author and mode are always written out beside it.
    <div aria-hidden="true" className={`print-cover ${className}`} style={{ background: copy.colour, color: copy.text }}>
      <svg viewBox="0 0 200 300" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <PatternDef id={id} pattern={copy.pattern} ink={copy.ink} base={copy.colour} scale={0.9} />
        </defs>
        <Print copy={copy} id={id} />
      </svg>
      <div className="relative flex h-full flex-col p-[8cqw]">
        <span className="lbl !text-[5cqw] !tracking-[0.12em]">{copy.author}</span>
        <span className="mt-[4cqw] font-display text-[13cqw] leading-[0.98] font-medium tracking-[-0.02em]">{copy.title}</span>
        <span className="mt-[5cqw] h-px w-[30%] bg-current opacity-60" />
        <span className="mt-auto flex items-end justify-between">
          <BayuMark className="h-[11cqw] w-[11cqw]" />
          <span className="box lbl !min-h-0 !border-current !px-[2.5cqw] !py-[1.2cqw] !text-[4.6cqw]">
            {copy.mode === "give" ? "Give" : "Lend"}
          </span>
        </span>
      </div>
    </div>
  );
}

export function PrintSpine({ copy, className = "" }: { copy: ShelfCopy; className?: string }) {
  const id = `ps-${useId().replace(/:/g, "")}`;
  const surname = copy.author.split(",")[0].trim().split(" ").slice(-1)[0];
  return (
    <div aria-hidden="true" className={`print-spine ${className}`} style={{ background: copy.colour, color: copy.text }}>
      <svg viewBox="0 0 60 60" className="mx-auto mt-[22cqw] block w-[64%]" aria-hidden="true">
        <defs>
          <PatternDef id={id} pattern={copy.pattern === "matahari" ? "songket" : copy.pattern} ink={copy.ink} base={copy.colour} scale={0.6} />
        </defs>
        <circle cx="30" cy="30" r="28" fill={`url(#${id})`} />
        <circle cx="30" cy="30" r="28" fill="none" stroke={copy.ink} strokeWidth="2" />
      </svg>
      <span className="spine-title font-display text-[34cqw] leading-none font-medium">{copy.title}</span>
      <span className="spine-author lbl !text-[14cqw]">{surname}</span>
      <BayuMark className="mx-auto mb-[18cqw] h-[44cqw] w-[44cqw] shrink-0" />
    </div>
  );
}
