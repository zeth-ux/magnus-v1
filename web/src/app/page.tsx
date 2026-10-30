import { Hero } from "@/components/landing/hero";
import { WindScene } from "@/components/landing/wind-scene";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Showcase } from "@/components/landing/showcase";
import { RantauScene } from "@/components/landing/rantau-scene";
import { SafetyFaq } from "@/components/landing/safety-faq";
import { FirstStep } from "@/components/landing/first-step";
import { Closing } from "@/components/landing/closing";
import { SmoothScroll } from "@/components/landing/smooth-scroll";

/**
 * The landing page. Story and rules: docs/landing.md.
 * One motif runs the page: the arch of a carved Malay panel (the hero's giant
 * window, the scene you fly through, cover stages, buttons, tabs, the footer).
 */
export default function LandingPage() {
  return (
    <>
      <SmoothScroll />
      <main>
        <Hero />
        <WindScene />
        <HowItWorks />
        <Showcase />
        <RantauScene />
        <SafetyFaq />
        <FirstStep />
      </main>
      <Closing />
    </>
  );
}
