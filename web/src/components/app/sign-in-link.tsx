"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

const CLASS = "btn-light !min-h-10 !px-4 !py-2 text-[15px]";

/**
 * The app bar's "Sign in" for a visitor on the open shelf: signing in brings
 * them back to the page they were on (a book, say). Reading the URL is
 * request data, so it sits behind <Suspense>; plain /login until then.
 */
export function SignInLink() {
  return (
    <Suspense fallback={<Link href="/login" className={CLASS}>Sign in</Link>}>
      <WithPath />
    </Suspense>
  );
}

function WithPath() {
  const path = usePathname();
  return (
    <Link href={`/login?next=${encodeURIComponent(path)}`} className={CLASS}>
      Sign in
    </Link>
  );
}
