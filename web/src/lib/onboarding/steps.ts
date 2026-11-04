/**
 * The three first steps of a new reader (docs/user-flow.md): make a library
 * card, put a book on the shelf (which earns the starter credit), ask for a
 * book. Shown until all three are done, then never again.
 */
export type FirstStep = { key: "card" | "book" | "ask"; label: string; href: string; done: boolean };

export function firstSteps(done: { card: boolean; book: boolean; ask: boolean }): { steps: FirstStep[]; current: number } | null {
  const steps: FirstStep[] = [
    { key: "card", label: "Make your library card", href: "/me", done: done.card },
    // Listing needs a card first, so the link goes through the card if it's missing.
    { key: "book", label: "Add a book", href: done.card ? "/add" : "/me?next=/add", done: done.book },
    { key: "ask", label: "Ask for a book", href: "/browse", done: done.ask },
  ];
  const current = steps.findIndex((s) => !s.done);
  return current === -1 ? null : { steps, current };
}
