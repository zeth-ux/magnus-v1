import { FAQ, SAFETY_POINTS } from "@/content/landing";

/** Safety and questions, side by side on wide screens: ruled lists, native <details> for answers. */
export function SafetyFaq() {
  return (
    <section aria-label="Safety and questions" className="border-t border-ink/90 px-4 pt-10 pb-16 sm:px-8 sm:pt-14 sm:pb-24">
      <div className="mx-auto grid max-w-[1280px] gap-14 md:grid-cols-12 md:gap-8">
        <div className="md:col-span-5">
          <h2 id="safety" className="scroll-mt-4 font-display text-[clamp(2rem,3.4vw,3rem)] leading-[1] font-normal tracking-[-0.025em]">
            Safe by design
          </h2>
          <ul className="mt-8 border-t border-ink/90">
            {SAFETY_POINTS.map((point) => (
              <li key={point} className="border-b border-ink/25 py-5 font-display text-[18px] leading-[1.5]">
                {point}
              </li>
            ))}
          </ul>
        </div>
        <div className="md:col-span-6 md:col-start-7">
          <h2 id="faq" className="scroll-mt-4 font-display text-[clamp(2rem,3.4vw,3rem)] leading-[1] font-normal tracking-[-0.025em]">
            Questions
          </h2>
          <div className="mt-8 border-t border-ink/90">
            {FAQ.map((item) => (
              <details key={item.q} className="faq-card group border-b border-ink/25">
                <summary className="flex cursor-pointer list-none items-baseline justify-between gap-6 py-5 [&::-webkit-details-marker]:hidden">
                  <span className="font-display text-[20px] leading-[1.3]">{item.q}</span>
                  <span aria-hidden="true" className="lbl shrink-0 text-cobalt">
                    <span className="group-open:hidden">Open</span>
                    <span className="hidden group-open:inline">Close</span>
                  </span>
                </summary>
                <p className="max-w-[56ch] pb-6 text-[16px] leading-[1.65] text-ink/80">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
