import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { BayuMark } from "@/components/bayu-mark";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What Bayu keeps about you, who can see it, and how to have it removed.",
  alternates: { canonical: "/privacy" },
};
export const viewport: Viewport = { themeColor: "#1c1614", colorScheme: "dark" };

/**
 * The privacy notice for the pilot, written from what the database actually
 * stores (supabase/migrations). Keep it in step with the schema and the FAQ.
 */
export default function PrivacyPage() {
  return (
    <div className="page-malam on-dark min-h-svh bg-malam text-paper">
      <header className="mx-auto flex w-full max-w-[760px] items-center px-6 py-5">
        <Link href="/" className="flex items-center gap-3 text-paper no-underline">
          <BayuMark className="h-8 w-8" />
          <span className="font-display text-[17px] font-semibold">Bayu</span>
        </Link>
      </header>
      <main className="mx-auto flex w-full max-w-[760px] flex-col gap-10 px-6 pt-6 pb-24 text-[17px] leading-relaxed">
        <div className="flex flex-col gap-3">
          <h1 className="font-display text-[clamp(2.2rem,5vw,3.2rem)] leading-[1.04] font-medium tracking-[-0.02em]">Privacy</h1>
          <p className="text-paper/80">
            Bayu is a small pilot run by Zarith Imran for readers in Ansan. This page says, in plain words, what we keep,
            who can see it, and how to have it removed. Last updated 1 November 2026.
          </p>
        </div>

        <Section title="What we keep">
          <ul className="flex list-disc flex-col gap-2 pl-6">
            <li>
              <strong>Your email address</strong>, to send sign-in links. If you sign in with <strong>Google</strong>, also
              the name, email, profile picture and account id Google shares with us.
            </li>
            <li>
              <strong>Your profile:</strong> the name and area you choose, and when you joined.
            </li>
            <li>
              <strong>Your WhatsApp number</strong>, only if you add it. Nobody sees it today. Later it may be shared with
              the reader you&apos;re swapping with, and we&apos;ll ask you before that changes.
            </li>
            <li>
              <strong>Your books:</strong> each copy you list, its condition and your note, and your wishlist.
            </li>
            <li>
              <strong>Your swaps:</strong> requests, meet-up places and times, due dates, requests for more time, and your
              credit history.
            </li>
            <li>
              <strong>Trust and safety:</strong> the 👍/👎 after a handover, readers you block, reports and feedback you
              send, and reports other readers make about a swap with you.
            </li>
            <li>
              <strong>Technical logs:</strong> our hosts record sign-ins and page requests (time, IP address and browser)
              to keep the service running and safe.
            </li>
          </ul>
          <p>
            We don&apos;t use advertising or tracking cookies. The only cookies keep you signed in, and the app saves its
            offline page on your phone.
          </p>
        </Section>

        <Section title="Who can see it">
          <ul className="flex list-disc flex-col gap-2 pl-6">
            <li>
              <strong>Anyone visiting the home page</strong> sees a few of the newest available books, with the owner&apos;s
              area but never their name.
            </li>
            <li>
              <strong>Other signed-in readers</strong> see your name, your area, the books you list (with
              your notes), and how many readers had a smooth handover with you. A book you&apos;ve taken off the shelf is
              hidden from them, except readers who asked for it or passed it on to you.
            </li>
            <li>
              <strong>The reader you&apos;re swapping with</strong> also sees the request and the meet-up details.
            </li>
            <li>
              <strong>Nobody else</strong> sees your email or WhatsApp number. We never show who gave a 👍 or 👎, or who
              reported whom.
            </li>
            <li>
              <strong>The pilot team</strong> reads reports and feedback, and can see the database to keep Bayu running.
            </li>
          </ul>
          <p>We never sell or share your information with anyone for marketing.</p>
        </Section>

        <Section title="Where it's kept">
          <p>
            Bayu is used in Korea, and your information is stored and processed abroad by these services, only to run Bayu:
          </p>
          <ul className="flex list-disc flex-col gap-2 pl-6">
            <li>
              <strong>Supabase</strong> (database, sign-in and sign-in emails): servers in Ireland (EU).
            </li>
            <li>
              <strong>Vercel</strong> (the website): servers in the United States.
            </li>
            <li>
              <strong>Google</strong>, only if you choose to sign in with Google.
            </li>
          </ul>
        </Section>

        <Section title="Your choices">
          <ul className="flex list-disc flex-col gap-2 pl-6">
            <li>Change your name, area or WhatsApp number any time on your card (Me).</li>
            <li>Take books off the shelf in My shelf, and unblock readers on your card.</li>
            <li>
              <strong>Delete your account:</strong> ask through &ldquo;Send feedback&rdquo; or the pilot group. First finish
              any handover or loan in progress. Then we remove your name and area, WhatsApp number, wishlist, the blocks you
              made, meet-up places and notes you wrote, your feedback, and your Google link; your email is replaced and the
              account can&apos;t sign in again. Your books come off the shelf and lose their notes (notes on books you gave
              away stay with the book).
            </li>
            <li>
              <strong>What stays, without your name:</strong> a record of past swaps and credits (so everyone&apos;s credits
              still add up), 👍/👎 ratings, and reports (so safety reports aren&apos;t lost). Supabase&apos;s own sign-in log
              may still hold your old email.
            </li>
            <li>To see what we hold about you, or for any privacy question, ask the same way.</li>
          </ul>
        </Section>

        <Section title="How long">
          <p>
            We keep your information while your account exists. After a deletion, the anonymous records above stay for as
            long as Bayu runs. When the pilot ends we&apos;ll tell readers what happens next before anything changes.
          </p>
        </Section>

        <p className="text-[15px] text-paper/70">
          <Link href="/" className="underline underline-offset-4">
            Back to Bayu
          </Link>
        </p>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-2xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}
