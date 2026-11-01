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
    dark: true,
  },
  {
    name: "Request",
    text: "Browse what readers near you are sharing. Pick a book; for a lend, pick the date you'll return it.",
    stamp: "Requested",
    bg: "#1b2a6b",
    ink: "#eef0fb",
    dark: true,
  },
  {
    name: "Meet up",
    text: "Agree a café or a station that suits you both. When the book changes hands, you both tap handed over.",
    stamp: "Handed over",
    bg: "#5a1f4a",
    ink: "#fbe9f0",
    dark: true,
  },
  {
    name: "Credits",
    text: "Give a book, earn a credit. Take one, spend a credit. Borrowing holds a credit until the book comes home.",
    stamp: "+1 · −1",
    bg: "#f0b429",
    ink: "#2a1a0c",
    dark: false,
  },
] as const;

export const SAFETY_POINTS = [
  "Meet in public places, like a café near the station. You agree the place and time in the app.",
  "Bayu doesn't show your WhatsApp number or email to other readers.",
  "Decline or cancel any time before the handover. Report a problem from any request, and block the reader if you want: only the pilot team reads reports.",
] as const;

export const FAQ = [
  { tab: "Cost", q: "Is Bayu free?", a: "Yes. Listing, giving, borrowing and swapping cost nothing. Credits aren't money and can't be bought." },
  { tab: "Who", q: "Who can join?", a: "Anyone who reads English books in Ansan. The pilot starts with a small group of friends and the readers they invite." },
  {
    tab: "Meeting",
    q: "How do we meet for a handover?",
    a: "Once a request is accepted, one of you suggests a place and time and the other taps \"Sounds good\". You meet, then each of you taps your side (\"I handed it over\" / \"I've got the book\"). A gift moves a credit; a loan holds one until the book comes back.",
  },
  { tab: "Lending", q: "What if I need a book for longer?", a: "Tak apa. Ask for more time on the loan and pick a new date. The lender says yes or no, and a yes moves the due date." },
  { tab: "Late", q: "What if a lent book never comes back?", a: "Two weeks after the due date, the lender can report it and keeps the borrower's held credit." },
  {
    tab: "Data",
    q: "What do you keep about me?",
    a: "Your name, email, area, WhatsApp number, books, wishlist, swap history and meet-up details, plus ratings, and any reports or feedback you send. Nothing is sold.",
  },
  {
    tab: "Leaving",
    q: "Can I delete my account?",
    a: "Yes. Ask through \"Send feedback\" (or in the pilot group) and we'll remove your name, area, WhatsApp number, books and wishlist. A record of past swaps, and any reports, stay without your name, so everyone's credits still add up and safety reports aren't lost. A delete button is on the way.",
  },
] as const;
