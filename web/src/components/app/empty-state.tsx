import Link from "next/link";

/**
 * An empty list that says what to do next: a line of explanation and one
 * action, named verb + noun. Used for first use ("nothing yet") and for
 * searches that found nothing.
 */
export function EmptyState({ children, action, secondary }: { children: React.ReactNode; action?: { href: string; label: string }; secondary?: { href: string; label: string } }) {
  return (
    <div className="flex flex-col items-start gap-4 border border-dashed border-ink/40 px-5 py-6">
      <p className="max-w-[46ch] font-display text-[19px] leading-[1.45]">{children}</p>
      {action || secondary ? (
        <div className="flex flex-wrap items-center gap-3">
          {action ? (
            <Link href={action.href} className="btn-primary !min-h-11">
              {action.label}
            </Link>
          ) : null}
          {secondary ? (
            <Link href={secondary.href} className="btn-quiet !min-h-11">
              {secondary.label}
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
