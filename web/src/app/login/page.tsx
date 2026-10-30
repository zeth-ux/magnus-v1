import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "./login-form";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { BayuMark } from "@/components/bayu-mark";

export const metadata: Metadata = { title: "Join the pilot" };

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col gap-10 px-6 py-12">
      <Link href="/" className="flex items-center gap-2 self-start text-ink no-underline">
        <BayuMark className="h-8 w-8" />
        <span className="font-display text-2xl font-semibold">Bayu</span>
      </Link>
      <div className="flex flex-col gap-3">
        <h1 className="font-display text-4xl leading-tight font-medium">Join the Ansan pilot</h1>
        <p className="text-base leading-relaxed">
          New or returning, it&apos;s the same step. List your first book and you get 1 starter
          credit.
        </p>
      </div>
      {/* searchParams are request data, so the form streams in behind a boundary. */}
      <Suspense fallback={<LoginForm next="/welcome" />}>
        <LoginFormWithNext searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function LoginFormWithNext({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const params = await searchParams;
  const raw = Array.isArray(params.next) ? params.next[0] : params.next;
  return <LoginForm next={safeRedirectPath(raw)} />;
}
