import type { Viewport } from "next";
import { Shelf } from "@/components/shelf/shelf";
import { getLandingShelf } from "@/lib/shelf/landing-shelf";
import { SiteHeader } from "@/components/landing/site-header";
import { HowItWorks } from "@/components/landing/how-it-works";
import { SafetyFaq } from "@/components/landing/safety-faq";
import { Closing } from "@/components/landing/closing";
import { SmoothScroll } from "@/components/landing/smooth-scroll";

/**
 * The landing page. Story and rules: docs/landing.md.
 * The shelf comes first and is the page's main event: a stack of 3D books you
 * scroll through and pick from (after Stripe Press).
 */
export const viewport: Viewport = {
  themeColor: "#1c1614",
  colorScheme: "dark",
};

export default function LandingPage() {
  return (
    <div className="page-malam bg-malam">
      <SmoothScroll />
      <SiteHeader />
      <main>
        <LandingShelf />
        <HowItWorks />
        <SafetyFaq />
      </main>
      <Closing />
    </div>
  );
}

/** The shelf's books are cached data (getLandingShelf), so this stays in the static shell. */
async function LandingShelf() {
  const copies = await getLandingShelf();
  return <Shelf copies={copies} />;
}
