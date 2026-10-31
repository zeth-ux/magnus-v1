"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** A nav link that knows when it's the current page (aria-current and a marker). */
export function NavLink({ href, children, className = "" }: { href: string; children: React.ReactNode; className?: string }) {
  const path = usePathname();
  const current = path === href || path.startsWith(`${href}/`);
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
