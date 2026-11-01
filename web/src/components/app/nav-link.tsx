"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

type Props = { href: string; children: React.ReactNode; className?: string };

/**
 * A nav link that knows when it's the current page (aria-current and a
 * marker). Reading the URL is request data under Cache Components, so it sits
 * behind <Suspense>; the plain link shows until then (and in the static shell).
 */
export function NavLink(props: Props) {
  return (
    <Suspense fallback={<Plain {...props} current={false} />}>
      <WithPath {...props} />
    </Suspense>
  );
}

function WithPath(props: Props) {
  const path = usePathname();
  return <Plain {...props} current={path === props.href || path.startsWith(`${props.href}/`)} />;
}

function Plain({ href, children, className = "", current }: Props & { current: boolean }) {
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={`${className} ${current ? "underline decoration-2 underline-offset-[6px]" : "no-underline"}`}
    >
      {children}
    </Link>
  );
}
