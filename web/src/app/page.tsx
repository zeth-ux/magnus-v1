import type { Metadata, Viewport } from "next";
import { ShelfHero } from "@/components/landing/shelf-hero";
import { getLandingShelf } from "@/lib/shelf/landing-shelf";
import { SiteHeader } from "@/components/landing/site-header";
import { HowItWorks } from "@/components/landing/how-it-works";
import { SafetyFaq } from "@/components/landing/safety-faq";
import { Closing } from "@/components/landing/closing";
import { SmoothScroll } from "@/components/landing/smooth-scroll";
import { LinkErrorRedirect } from "@/components/auth/link-error-redirect";

/**
 * The landing page. Story and rules: docs/landing.md.
 * The shelf comes first and is the page's main event: a stack of 3D books you
 * scroll through and pick from (after Stripe Press).
 */
export const metadata: Metadata = { alternates: { canonical: "/" }, openGraph: { url: "/" } };

export const viewport: Viewport = {
  themeColor: "#edebe6",
  colorScheme: "light",
};

export default function LandingPage() {
  return (
    <div className="bg-paper">
      <LinkErrorRedirect />
      <SmoothScroll />
      <div className="relative">
        <SiteHeader />
        <main>
          <LandingShelf />
          <HowItWorks />
          <SafetyFaq />
        </main>
      </div>
      <Closing />
    </div>
  );
}

/** The shelf's books are cached data (getLandingShelf), so this stays in the static shell. */
async function LandingShelf() {
  const copies = await getLandingShelf();
  // Books to give first, then books to lend, so the Give / Lend tabs each lead to a run of books.
  const ordered = [...copies.filter((c) => c.mode === "give"), ...copies.filter((c) => c.mode === "lend")];
  return <ShelfHero copies={ordered} />;
}
