import { HOW_STAGES } from "@/content/landing";

/**
 * How it works: the four steps in order, on a full cobalt band (the page's loud
 * colour after the quiet shelf). Each step is a printed card with the library
 * stamp it earns. Static on purpose: the shelf above is the one moving moment.
 */
export function HowItWorks() {
  return (
    <section id="how" aria-labelledby="how-title" className="scroll-mt-4 bg-cobalt px-4 pt-14 pb-20 text-cream sm:px-8 sm:pt-20 sm:pb-28">
      <div className="mx-auto max-w-[1280px]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 id="how-title" className="font-display text-[clamp(2.6rem,6vw,5.2rem)] leading-[0.95] font-normal tracking-[-0.03em]">
            How a book moves
          </h2>
          <p className="max-w-[34ch] font-display text-[19px] leading-[1.45] text-cream/90">
            Four steps, from your shelf to a reader nearby. Credits keep every swap fair.
          </p>
        </div>
        <ol className="mt-12 grid gap-6 sm:mt-16 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {HOW_STAGES.map((stage, i) => (
            <li key={stage.name} className="panel flex flex-col gap-4 bg-sheet p-6 text-ink lg:min-h-[300px]">
              <span className="flex items-baseline justify-between">
                <span className="font-display text-[56px] leading-[0.8] text-cobalt">{i + 1}</span>
                <span className="lbl text-muted">Step {i + 1} of 4</span>
              </span>
              <h3 className="font-display text-[28px] leading-[1.05] font-normal tracking-[-0.01em]">{stage.name}</h3>
              <p className="text-[15px] leading-[1.6] text-ink/80">{stage.text}</p>
              <span className="stamp mt-auto self-start">{stage.stamp}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
