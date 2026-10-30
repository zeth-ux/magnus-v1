// Renders the PWA icons from the Bayu mark. Run: node scripts/make-icons.mjs
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const mark = (pad) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
<rect width="512" height="512" fill="#dceef7"/>
<g transform="translate(${pad} ${pad}) scale(${(512 - 2 * pad) / 64})" fill="none" stroke="#2b2a28" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
<path d="M10 50 L32 45 L54 50 L54 20 L32 15 L10 20 Z" fill="#f1efea"/><path d="M32 15 L32 45"/>
<path d="M35 18 C 41 10, 48 10, 54 13"/><path d="M38 23 C 45 17, 51 18, 57 21"/></g></svg>`;

await mkdir("public/icons", { recursive: true });
const jobs = [
  ["public/icons/icon-192.png", 192, 40],
  ["public/icons/icon-512.png", 512, 40],
  ["public/icons/icon-maskable-512.png", 512, 110], // safe zone for maskable icons
  ["src/app/apple-icon.png", 180, 60],
];
for (const [file, size, pad] of jobs) {
  await sharp(Buffer.from(mark(pad))).resize(size, size).png().toFile(file);
  console.log("wrote", file);
}
