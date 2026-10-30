/**
 * Landing page copy for the sections below the shelf. The shelf's SAMPLE
 * books live in shelf.ts.
 */

/** How it works: four stages, each in the colour of a book on the shelf. */
export const HOW_STAGES = [
  {
    name: "List",
    text: "Scan the barcode on an English book you own and mark it give or lend. Your first one earns a starter credit.",
    stamp: "+1 starter",
    bg: "#1f4d3a",
    ink: "#f3ecdc",
  },
  {
    name: "Request",
    text: "Browse what readers near you are sharing. Pick a book; for a lend, pick the date you'll return it.",
    stamp: "Requested",
    bg: "#1b2a6b",
    ink: "#eef0fb",
  },
  {
    name: "Meet up",
    text: "Agree a café or a station that suits you both. When the book changes hands, you both tap handed over.",
    stamp: "Handed over",
    bg: "#5a1f4a",
    ink: "#fbe9f0",
  },
  {
    name: "Credits",
    text: "Give a book, earn a credit. Take one, spend a credit. Borrowing holds a credit until the book comes home.",
    stamp: "+1 · −1",
    bg: "#f0b429",
    ink: "#2a1a0c",
  },
] as const;

export const SAFETY_POINTS = [
  "Meet in public places, like a café near the station.",
  "Your WhatsApp number stays hidden until you accept a request.",
  "Decline or cancel any time. Report anything that feels off.",
] as const;

export const FAQ = [
  { tab: "Cost", q: "Is Bayu free?", a: "Yes. Listing, giving, borrowing and swapping cost nothing. Credits aren't money and can't be bought." },
  { tab: "Who", q: "Who can join?", a: "Anyone who reads English books in Ansan. The pilot starts with a small group of friends and the readers they invite." },
  { tab: "Lending", q: "What if a lent book never comes back?", a: "Two weeks after the due date, the lender can report it and keeps the borrower's held credit." },
  { tab: "Data", q: "What do you keep about me?", a: "Your name, email, area, WhatsApp number, your books and your swap history. Nothing is sold." },
  { tab: "Leaving", q: "Can I delete my account?", a: "Yes. Deletion arrives with your profile page when the shelf opens; until then, ask in the pilot group and we'll delete it for you." },
] as const;
