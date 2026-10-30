import { FAQ, SAFETY_POINTS } from "@/content/landing";
import { Reveal } from "./reveal";

/** L7 · Safety and questions. A quiet section; the FAQ is a native accordion. */
export function SafetyFaq() {
  return (
    <section aria-label="Safety and questions" className="bg-bone text-ink">
      <div className="mx-auto grid w-full max-w-[1312px] grid-cols-1 gap-20 px-4 py-28 sm:px-8 lg:grid-cols-12 lg:gap-6 lg:py-40">
        <Reveal className="flex flex-col gap-7 lg:col-span-5">
          <h2
            id="safety"
            data-reveal=""
            className="scroll-mt-8 font-display text-[clamp(2.25rem,5vw,3.25rem)] leading-[1.05] font-medium tracking-[-0.02em]"
          >
            Safe by design
          </h2>
          {SAFETY_POINTS.map((point) => (
            <p key={point} data-reveal="" className="text-xl leading-snug font-semibold sm:text-[22px]">
              {point}
            </p>
          ))}
        </Reveal>

        <Reveal className="flex flex-col gap-2 lg:col-span-6 lg:col-start-7">
          <h2 id="faq" data-reveal="" className="mb-3 scroll-mt-8 font-display text-4xl font-medium">
            Questions
          </h2>
          {FAQ.map((item, i) => (
            <details
              key={item.q}
              data-reveal=""
              open={i === 0}
              className="group rounded-[4px] px-5 py-4 open:bg-bone-deep hover:bg-bone-deep"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-bold [&::-webkit-details-marker]:hidden">
                {item.q}
                <svg
                  viewBox="0 0 16 16"
                  className="h-4 w-4 shrink-0 transition-transform duration-200 group-open:rotate-45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M8 2 V14 M2 8 H14" />
                </svg>
              </summary>
              <p className="mt-2.5 text-base leading-relaxed">{item.a}</p>
            </details>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
