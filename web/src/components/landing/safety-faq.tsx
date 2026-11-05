import { FAQ, SAFETY_POINTS } from "@/content/landing";

/**
 * Safety and questions, back on paper: two printed panels side by side,
 * safety on warm kraft card, questions on white sheet.
 */
export function SafetyFaq() {
  return (
    <section aria-label="Safety and questions" className="px-4 pt-16 pb-20 sm:px-8 sm:pt-24 sm:pb-28">
      <div className="mx-auto grid max-w-[1280px] items-start gap-10 md:grid-cols-12 md:gap-8">
        <div className="panel bg-kraft p-6 sm:p-8 md:col-span-5">
          <h2 id="safety" className="scroll-mt-4 font-display text-[clamp(2rem,3.4vw,3rem)] leading-[1] font-normal tracking-[-0.025em]">
            Safe by design
          </h2>
          <ul className="mt-6 flex flex-col gap-3">
            {SAFETY_POINTS.map((point) => (
              <li key={point} className="border-t border-ink/30 pt-3 font-display text-[18px] leading-[1.5]">
                {point}
              </li>
            ))}
          </ul>
        </div>
        <div className="panel bg-sheet p-6 sm:p-8 md:col-span-7">
          <h2 id="faq" className="scroll-mt-4 font-display text-[clamp(2rem,3.4vw,3rem)] leading-[1] font-normal tracking-[-0.025em]">
            Questions
          </h2>
          <div className="mt-6 border-t border-ink/90">
            {FAQ.map((item) => (
              <details key={item.q} className="faq-card group border-b border-ink/25">
                <summary className="flex cursor-pointer list-none items-baseline justify-between gap-6 py-4 [&::-webkit-details-marker]:hidden">
                  <span className="font-display text-[20px] leading-[1.3]">{item.q}</span>
                  <span aria-hidden="true" className="grid h-7 w-7 shrink-0 place-items-center border border-ink text-[18px] leading-none transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="max-w-[56ch] pb-5 text-[16px] leading-[1.65] text-ink/80">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
