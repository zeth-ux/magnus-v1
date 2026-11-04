/**
 * The landing shelf: SAMPLE books standing in for the Ansan pilot shelf until
 * friends list their real copies (shelf opens 9 November). Titles are real
 * books; every cover and spine here is Bayu's own drawn design, not the
 * publisher's artwork. Printed in four inks plus card: ink, cobalt,
 * vermilion, mustard, on cream or kraft (docs/brand.md, "Print inks").
 */

export type CoverPattern = "songket" | "awan" | "rebung" | "pelikat" | "bintang" | "matahari" | "ombak" | "bunga" | "tikar";

export type ShelfCopy = {
  slug: string;
  title: string;
  author: string;
  mode: "give" | "lend";
  /** For a lend: how long the owner is happy to lend it. */
  lendFor?: string;
  owner: string;
  area: string;
  note: string;
  /** Thickness of the book in px at desktop size (spine height). */
  thick: number;
  /** Spine length as a share of the shelf width (0.82 to 1). */
  length: number;
  /** Cover / spine colour, the pattern ink, the text colour, and the page colour when opened. */
  colour: string;
  ink: string;
  text: string;
  flood: string;
  floodText: string;
  pattern: CoverPattern;
  /** True for the illustrative books; false for a real copy on the pilot shelf. */
  sample?: boolean;
  /** For a real copy: its id, so "Join to borrow it" can lead straight to it. */
  copyId?: string;
};

export const SHELF: ShelfCopy[] = ([
  {
    slug: "garden-of-evening-mists",
    title: "The Garden of Evening Mists",
    author: "Tan Twan Eng",
    mode: "lend",
    lendFor: "4 weeks",
    owner: "Aina",
    area: "near Hanyang ERICA",
    note: "Set in the Cameron Highlands. I read it twice and cried at the tea plantation, both times.",
    thick: 74,
    length: 0.96,
    colour: "#d9cdb4",
    ink: "#1f3fb0",
    text: "#141414",
    flood: "#f1e9d6",
    floodText: "#141414",
    pattern: "awan",
  },
  {
    slug: "circe",
    title: "Circe",
    author: "Madeline Miller",
    mode: "lend",
    lendFor: "3 weeks",
    owner: "Hafiz",
    area: "Sa-dong",
    note: "Mind the coffee ring on page 112. Worth it for the last chapter.",
    thick: 58,
    length: 0.9,
    colour: "#c23a1e",
    ink: "#141414",
    text: "#fff6e8",
    flood: "#f1e9d6",
    floodText: "#141414",
    pattern: "songket",
  },
  {
    slug: "klara-and-the-sun",
    title: "Klara and the Sun",
    author: "Kazuo Ishiguro",
    mode: "give",
    owner: "Sofea",
    area: "Jungang station",
    note: "Made me call my mum. Yours to keep.",
    thick: 52,
    length: 0.86,
    colour: "#e2b23a",
    ink: "#c23a1e",
    text: "#141414",
    flood: "#f1e9d6",
    floodText: "#141414",
    pattern: "matahari",
  },
  {
    slug: "the-midnight-library",
    title: "The Midnight Library",
    author: "Matt Haig",
    mode: "lend",
    lendFor: "flexible",
    owner: "Danial",
    area: "Gojan",
    note: "Read it in one night, which felt right.",
    thick: 62,
    length: 0.92,
    colour: "#1f3fb0",
    ink: "#e2b23a",
    text: "#f1e9d6",
    flood: "#f1e9d6",
    floodText: "#141414",
    pattern: "bintang",
  },
  {
    slug: "norwegian-wood",
    title: "Norwegian Wood",
    author: "Haruki Murakami",
    mode: "give",
    owner: "Mira",
    area: "Gojan",
    note: "Read it on the subway to Seoul. That ending! Pass it on.",
    thick: 48,
    length: 0.84,
    colour: "#f1e9d6",
    ink: "#1f3fb0",
    text: "#141414",
    flood: "#d9cdb4",
    floodText: "#141414",
    pattern: "pelikat",
  },
  {
    slug: "pachinko",
    title: "Pachinko",
    author: "Min Jin Lee",
    mode: "lend",
    lendFor: "2 months",
    owner: "Hafiz",
    area: "Sa-dong",
    note: "Bring tissues. Four generations in one book.",
    thick: 88,
    length: 1,
    colour: "#141414",
    ink: "#c23a1e",
    text: "#f1e9d6",
    flood: "#f1e9d6",
    floodText: "#141414",
    pattern: "bunga",
  },
  {
    slug: "the-gift-of-rain",
    title: "The Gift of Rain",
    author: "Tan Twan Eng",
    mode: "give",
    owner: "Aina",
    area: "near Hanyang ERICA",
    note: "Penang, 1939. Brought it from home for whoever needs a little of it.",
    thick: 66,
    length: 0.9,
    colour: "#f1e9d6",
    ink: "#c23a1e",
    text: "#141414",
    flood: "#d9cdb4",
    floodText: "#141414",
    pattern: "ombak",
  },
  {
    slug: "kafka-on-the-shore",
    title: "Kafka on the Shore",
    author: "Haruki Murakami",
    mode: "lend",
    lendFor: "4 weeks",
    owner: "Mira",
    area: "Gojan",
    note: "Talking cats. Fish falling from the sky. Don't ask, just read.",
    thick: 70,
    length: 0.94,
    colour: "#c23a1e",
    ink: "#141414",
    text: "#fff6e8",
    flood: "#f1e9d6",
    floodText: "#141414",
    pattern: "rebung",
  },
  {
    slug: "the-little-prince",
    title: "The Little Prince",
    author: "Antoine de Saint-Exupéry",
    mode: "give",
    owner: "Sofea",
    area: "Jungang station",
    note: "A spare copy. Everyone should own one.",
    thick: 40,
    length: 0.82,
    colour: "#e2b23a",
    ink: "#1f3fb0",
    text: "#141414",
    flood: "#f1e9d6",
    floodText: "#141414",
    pattern: "tikar",
  },
] satisfies ShelfCopy[]).map((copy) => ({ ...copy, sample: true }));
