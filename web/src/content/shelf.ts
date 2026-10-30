/**
 * The landing shelf: SAMPLE books standing in for the Ansan pilot shelf until
 * friends list their real copies (shelf opens 9 November). Titles are real
 * books; every cover and spine here is Bayu's own drawn design, not the
 * publisher's artwork.
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
};

export const SHELF: ShelfCopy[] = [
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
    colour: "#1f4d3a",
    ink: "#d9b45a",
    text: "#f3ecdc",
    flood: "#c9d8c3",
    floodText: "#12301f",
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
    colour: "#8c1c1c",
    ink: "#e2b24c",
    text: "#f7e9cf",
    flood: "#f1d9b5",
    floodText: "#4a0e0e",
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
    colour: "#f0b429",
    ink: "#c2410c",
    text: "#2a1a0c",
    flood: "#3b2412",
    floodText: "#fbe3a6",
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
    colour: "#1b2a6b",
    ink: "#f2d27a",
    text: "#eef0fb",
    flood: "#d8dcf2",
    floodText: "#121b4a",
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
    colour: "#e9e2d0",
    ink: "#2f7a4d",
    text: "#1d1a16",
    flood: "#1f5535",
    floodText: "#f3efe3",
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
    colour: "#5a1f4a",
    ink: "#ef8fb0",
    text: "#fbe9f0",
    flood: "#f4d3df",
    floodText: "#3d1232",
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
    colour: "#0f5f66",
    ink: "#9be3d6",
    text: "#e8fbf7",
    flood: "#cfe9e4",
    floodText: "#0b3f44",
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
    colour: "#b23c0c",
    ink: "#2a120a",
    text: "#fff1e6",
    flood: "#2a120a",
    floodText: "#ffd9c2",
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
    colour: "#9cc9e3",
    ink: "#1b2a6b",
    text: "#10203a",
    flood: "#1b2a6b",
    floodText: "#e6efff",
    pattern: "tikar",
  },
];
