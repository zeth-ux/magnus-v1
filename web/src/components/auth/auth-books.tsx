import { SHELF } from "@/content/shelf";
import { PrintCover, PrintSpine } from "@/components/turning-shelf/print-art";

const SPINES = ["circe", "the-midnight-library", "norwegian-wood", "kafka-on-the-shore", "pachinko"];
const COVER = "klara-and-the-sun";

/**
 * A still from the landing shelf: a few spines standing side by side and one
 * book pulled out, leaning, showing its cover. Decoration: hidden from screen readers.
 */
export function AuthBooks() {
  const spines = SPINES.map((slug) => SHELF.find((b) => b.slug === slug)).filter((b) => b !== undefined);
  const cover = SHELF.find((b) => b.slug === COVER)!;
  return (
    <div aria-hidden="true" className="flex items-end justify-center gap-[6px]">
      {spines.slice(0, 3).map((copy, i) => (
        <div key={copy.slug} className="relative w-[58px] overflow-hidden rounded-[2px]" style={{ height: `${[360, 336, 352][i]}px` }}>
          <PrintSpine copy={copy} />
        </div>
      ))}
      <div className="relative mx-4 h-[372px] w-[248px] -rotate-[4.5deg] rounded-[2px] shadow-[0_30px_60px_-28px_rgb(20_16_10/0.55)]">
        <PrintCover copy={cover} />
      </div>
      {spines.slice(3).map((copy, i) => (
        <div key={copy.slug} className="relative w-[58px] overflow-hidden rounded-[2px]" style={{ height: `${[344, 362][i]}px` }}>
          <PrintSpine copy={copy} />
        </div>
      ))}
    </div>
  );
}
