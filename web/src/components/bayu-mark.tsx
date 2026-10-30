/** The Bayu mark: an open book with two wind lines lifting from its page. */
export function BayuMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 34 34"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 27 L17 24 L30 27 L30 10 L17 7 L4 10 Z" />
      <path d="M17 7 L17 24" />
      <path d="M19 9 C 23 4, 27 4, 30 6" />
      <path d="M21 12 C 25 8, 29 9, 32 11" />
    </svg>
  );
}
