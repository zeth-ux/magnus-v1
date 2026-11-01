"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

type Props = { href: string; children: React.ReactNode; className?: string; badge?: React.ReactNode };

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

function Plain({ href, children, className = "", current, badge }: Props & { current: boolean }) {
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={`${className} ${current ? "underline decoration-2 underline-offset-[6px]" : "no-underline"}`}
    >
      {badge ? (
        // The label and its badge together, so a corner badge sits on the word, not the whole tab.
        <span className="relative inline-flex items-center">
          {children}
          {badge}
        </span>
      ) : (
        children
      )}
    </Link>
  );
}
