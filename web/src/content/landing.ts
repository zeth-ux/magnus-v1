/**
 * Landing page content. SAMPLE data is marked: replace it with the real pilot
 * shelf (read from Supabase) once friends have listed their books.
 */

export type ShelfBook = {
  title: string;
  author: string;
  mode: "give" | "lend";
  lendFor?: string;
  readers: number;
  owner: string;
  note?: string;
  cover: string;
  coverInk: string;
};

/** SAMPLE: illustrative titles until the pilot shelf opens (9 Nov). */
export const SAMPLE_SHELF: ShelfBook[] = [
  { title: "Circe", author: "Madeline Miller", mode: "lend", lendFor: "4 weeks", readers: 2, owner: "Hafiz, near ERICA", note: "Mind the coffee ring on page 112.", cover: "#3b2618", coverInk: "#c9a24a" },
  { title: "Klara and the Sun", author: "Kazuo Ishiguro", mode: "give", readers: 1, owner: "Sofea, Sa-dong", cover: "#9cc9e3", coverInk: "#2b2a28" },
  { title: "Norwegian Wood", author: "Haruki Murakami", mode: "give", readers: 3, owner: "Mira, Gojan", cover: "#2f7a4d", coverInk: "#f1efea" },
  { title: "The Midnight Library", author: "Matt Haig", mode: "lend", lendFor: "flexible", readers: 1, owner: "Danial, Jungang", cover: "#2b2a28", coverInk: "#f1efea" },
  { title: "Educated", author: "Tara Westover", mode: "give", readers: 1, owner: "Aina, ERICA", cover: "#6e1f1f", coverInk: "#f1efea" },
  { title: "Pachinko", author: "Min Jin Lee", mode: "lend", lendFor: "2 months", readers: 2, owner: "Hafiz, near ERICA", cover: "#c9a24a", coverInk: "#3b2618" },
];

export const CREDIT_ROWS = [
  { what: "List your first book", note: "Welcome to the shelf", stamp: "+1 starter", tilt: -3 },
  { what: "Give a book", note: "It becomes theirs to keep", stamp: "+1", tilt: 2 },
  { what: "Take a book", note: "Keep it, or pass it on later", stamp: "−1", tilt: -2 },
  { what: "Borrow a book", note: "Held until you hand it back", stamp: "1 held", tilt: 3 },
] as const;

export const SAFETY_POINTS = [
  "Meet in public places, like a café near the station.",
  "Your WhatsApp number stays hidden until you accept a request.",
  "Decline or cancel any time. Report anything that feels off.",
] as const;

export const FAQ = [
  { q: "Is Bayu free?", a: "Yes. Listing, giving, borrowing and swapping cost nothing. Credits aren't money and can't be bought." },
  { q: "Who can join?", a: "Anyone who reads English books in Ansan. The pilot starts with a small group of friends and the readers they invite." },
  { q: "What if a lent book never comes back?", a: "Two weeks after the due date, the lender can report it and keeps the borrower's held credit." },
  { q: "What do you keep about me?", a: "Your name, email, area, WhatsApp number, your books and your swap history. Nothing is sold." },
  { q: "Can I delete my account?", a: "Yes. Account deletion arrives with your profile page when the shelf opens; until then, ask us in the pilot group and we'll delete it for you." },
] as const;

/** SAMPLE: an illustrative journey for one copy (Rantau ships after the pilot). */
export const SAMPLE_RANTAU = {
  stops: [
    { city: "Ansan", date: "2 Nov" },
    { city: "Seoul", date: "20 Nov" },
    { city: "KL", date: "22 Dec" },
  ],
  warkah: "Read it on the subway to Seoul. That ending! Pass it on.",
  from: "Mira",
};
