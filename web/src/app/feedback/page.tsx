import type { Metadata, Viewport } from "next";
import { AppShell, APP_VIEWPORT } from "@/components/app/app-shell";
import { FeedbackForm } from "./feedback-form";

export const metadata: Metadata = { title: "Send feedback" };
export const viewport: Viewport = APP_VIEWPORT;

/** Signed-in only (proxy); the action checks the session again. */
export default function FeedbackPage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <h1 className="page-title">Send feedback</h1>
        <FeedbackForm />
      </div>
    </AppShell>
  );
}
