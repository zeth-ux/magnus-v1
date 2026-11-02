import { HOW_STAGES } from "@/content/landing";

/**
 * How it works: the four steps in order, laid out like a ruled library card.
 * Each step ends with the stamp it earns. Static on purpose: the shelf above is
 * the page's one moving moment.
 */
export function HowItWorks() {
  return (
    <section id="how" aria-labelledby="how-title" className="scroll-mt-4 border-t border-ink/90 px-4 pt-10 pb-16 sm:px-8 sm:pt-14 sm:pb-24">
      <div className="mx-auto max-w-[1280px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="how-title" className="font-display text-[clamp(2.2rem,4vw,3.6rem)] leading-[1] font-normal tracking-[-0.025em]">
            How a book moves
          </h2>
          <p className="max-w-[38ch] font-display text-[17px] leading-[1.5] text-muted">
            Four steps, from your shelf to a reader nearby. Credits keep every swap fair.
          </p>
        </div>
        <ol className="mt-10 grid border-y border-ink/90 sm:mt-14 md:grid-cols-4">
          {HOW_STAGES.map((stage, i) => (
            <li key={stage.name} className="flex flex-col gap-4 border-ink/90 py-7 not-first:border-t md:px-6 md:py-9 md:not-first:border-t-0 md:not-first:border-l md:first:pl-0 md:last:pr-0">
              <span className="box lbl self-start">{`Step ${i + 1}`}</span>
              <h3 className="font-display text-[28px] leading-[1.05] font-normal tracking-[-0.01em]">{stage.name}</h3>
              <p className="max-w-[34ch] text-[15px] leading-[1.6] text-ink/80">{stage.text}</p>
              <span className="stamp mt-auto self-start">{stage.stamp}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
