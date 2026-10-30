/**
 * Landing page content. SAMPLE data is marked: replace it with the real pilot
 * shelf (read from Supabase) once friends have listed their books.
 */

export type ShelfBook = {
  title: string;
  author: string;
  mode: "give" | "lend";
  lendFor?: string;
  owner: string;
  note?: string;
  /** Arch (stage) colour behind the cover, and the cover's own colours. */
  stage: string;
  cover: string;
  coverInk: string;
};

/** SAMPLE: illustrative titles until the pilot shelf opens (9 Nov). */
export const SAMPLE_SHELF: ShelfBook[] = [
  { title: "Circe", author: "Madeline Miller", mode: "lend", lendFor: "4 weeks", owner: "Hafiz, near ERICA", note: "Mind the coffee ring on page 112.", stage: "#6e1f1f", cover: "#3b2618", coverInk: "#c9a24a" },
  { title: "Klara and the Sun", author: "Kazuo Ishiguro", mode: "give", owner: "Sofea, Sa-dong", note: "Made me call my mum.", stage: "#2f7a4d", cover: "#dceef7", coverInk: "#2b2a28" },
  { title: "Norwegian Wood", author: "Haruki Murakami", mode: "give", owner: "Mira, Gojan", stage: "#c9a24a", cover: "#2f7a4d", coverInk: "#eeeeea" },
  { title: "The Midnight Library", author: "Matt Haig", mode: "lend", lendFor: "flexible", owner: "Danial, Jungang", stage: "#3b2618", cover: "#eeeeea", coverInk: "#2b2a28" },
  { title: "Pachinko", author: "Min Jin Lee", mode: "lend", lendFor: "2 months", owner: "Hafiz, near ERICA", note: "Bring tissues.", stage: "#9cc9e3", cover: "#c9a24a", coverInk: "#3b2618" },
];

/** How it works, as four stages read dark to light (timber to songket gold). */
export const HOW_STAGES = [
  {
    name: "List",
    text: "Scan the barcode on an English book you own and mark it give or lend. Your first one earns a starter credit.",
    stamp: "+1 starter",
    bg: "#3b2618",
    ink: "#eeeeea",
  },
  {
    name: "Request",
    text: "Browse what readers near you are sharing. Pick a book; for a lend, pick the date you'll return it.",
    stamp: "Requested",
    bg: "#53371f",
    ink: "#eeeeea",
  },
  {
    name: "Meet up",
    text: "Agree a café or a station that suits you both. When the book changes hands, you both tap handed over.",
    stamp: "Handed over",
    bg: "#6b4a2c",
    ink: "#eeeeea",
  },
  {
    name: "Credits",
    text: "Give a book, earn a credit. Take one, spend a credit. Borrowing holds a credit until the book comes home.",
    stamp: "+1 · −1",
    bg: "#c9a24a",
    ink: "#3b2618",
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

/** SAMPLE: an illustrative journey for one copy (Rantau ships after the pilot). */
export const SAMPLE_RANTAU = {
  book: "Norwegian Wood",
  stops: [
    { city: "Ansan", date: "2 Nov", line: "Listed by Mira after her last exam.", field: "#dceef7", ink: "#2b2a28" },
    { city: "Seoul", date: "20 Nov", line: "Read on the subway, line 4 to line 2.", field: "#2f7a4d", ink: "#eeeeea" },
    { city: "KL", date: "22 Dec", line: "Packed for the flight home over the break.", field: "#c9a24a", ink: "#3b2618" },
  ],
  warkah: "Read it on the subway to Seoul. That ending! Pass it on.",
  from: "Mira",
};
