// Writes a short Y4M video of a book's barcode (EAN-13) for Chromium's fake
// camera (--use-file-for-fake-video-capture). Generated at test time so no big
// video file lives in the repo: 640x480, a few identical frames, which
// Chromium loops.
import { writeFileSync } from "node:fs";

const L = ["0001101", "0011001", "0010011", "0111101", "0100011", "0110001", "0101111", "0111011", "0110111", "0001011"];
const R = L.map((c) => [...c].map((b) => (b === "0" ? "1" : "0")).join(""));
const G = R.map((c) => [...c].reverse().join(""));
// Which of L/G encodes each of the six left digits, picked by the first digit.
const PARITY = ["LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG", "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL"];

/** The 95 modules (1 = bar) of an EAN-13 code. */
export function ean13Modules(code) {
  if (!/^\d{13}$/.test(code)) throw new Error(`not 13 digits: ${code}`);
  const d = [...code].map(Number);
  const sum = d.slice(0, 12).reduce((s, n, i) => s + n * (i % 2 ? 3 : 1), 0);
  if ((10 - (sum % 10)) % 10 !== d[12]) throw new Error(`bad check digit: ${code}`);
  let bits = "101";
  for (let i = 1; i <= 6; i++) bits += (PARITY[d[0]][i - 1] === "L" ? L : G)[d[i]];
  bits += "01010";
  for (let i = 7; i <= 12; i++) bits += R[d[i]];
  return bits + "101";
}

export function writeBarcodeVideo(path, code, { width = 640, height = 480, frames = 8 } = {}) {
  const bits = ean13Modules(code);
  const px = 5; // px per module: 95 x 5 = 475 px, inside the middle 80% the scanner reads
  const left = Math.floor((width - bits.length * px) / 2);
  const top = Math.floor(height * 0.25);
  const bottom = Math.floor(height * 0.75);

  const y = Buffer.alloc(width * height, 255); // white paper
  for (let row = top; row < bottom; row++) {
    for (let m = 0; m < bits.length; m++) {
      if (bits[m] !== "1") continue;
      y.fill(0, row * width + left + m * px, row * width + left + (m + 1) * px);
    }
  }
  const chroma = Buffer.alloc((width / 2) * (height / 2) * 2, 128); // no colour
  const frame = Buffer.concat([Buffer.from("FRAME\n"), y, chroma]);
  const header = Buffer.from(`YUV4MPEG2 W${width} H${height} F10:1 Ip A1:1 C420jpeg\n`);
  writeFileSync(path, Buffer.concat([header, ...Array(frames).fill(frame)]));
}
