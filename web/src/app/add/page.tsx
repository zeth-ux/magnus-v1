import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AppShell, APP_VIEWPORT } from "@/components/app/app-shell";
import { getProfile, requireUser } from "@/lib/supabase/user";
import { AddBookForm } from "./add-book-form";

export const metadata: Metadata = { title: "Add a book" };
export const viewport: Viewport = APP_VIEWPORT;

export default function AddPage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-3">
          <h1 className="font-display text-[clamp(2.2rem,4vw,3.2rem)] leading-[1.04] font-medium tracking-[-0.02em]">
            Put a book on the shelf.
          </h1>
          <p className="max-w-[32rem] text-[17px] leading-relaxed text-paper/80">
            Any English book you&apos;re happy to give away or lend. Your first one earns a starter credit.
          </p>
        </div>
        <Suspense fallback={<p className="text-paper/70">Getting the shelf ready…</p>}>
          <NeedsProfile />
        </Suspense>
      </div>
    </AppShell>
  );
}

async function NeedsProfile() {
  const { supabase, user } = await requireUser("/add");
  if (!(await getProfile(supabase, user.id))) redirect("/me?next=/add");
  return <AddBookForm />;
}
