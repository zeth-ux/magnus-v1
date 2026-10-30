import { Hero } from "@/components/landing/hero";
import { WindScene } from "@/components/landing/wind-scene";
import { Credits } from "@/components/landing/credits";
import { ShelfPreview } from "@/components/landing/shelf-preview";
import { RantauScene } from "@/components/landing/rantau-scene";
import { SafetyFaq } from "@/components/landing/safety-faq";
import { Closing } from "@/components/landing/closing";

/**
 * The landing page. Story and rules: docs/landing.md.
 * Sky → (scene 1: wind through the carved panel) → kayu → bone → merah hati
 * (scene 2: a book's rantau) → bone → kayu.
 */
export default function LandingPage() {
  return (
    <>
      <main>
        <Hero />
        <WindScene />
        <Credits />
        <ShelfPreview />
        <RantauScene />
        <SafetyFaq />
      </main>
      <Closing />
    </>
  );
}
