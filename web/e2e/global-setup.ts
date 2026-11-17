import { mkdirSync } from "node:fs";
import path from "node:path";
import { writeBarcodeVideo } from "./barcode-video.mjs";
import { SCANNED_ISBN } from "./constants";

/** Before any test: the fake camera's video (a book barcode). */
export default function globalSetup() {
  const dir = path.join(__dirname, ".tmp");
  mkdirSync(dir, { recursive: true });
  writeBarcodeVideo(path.join(dir, "barcode.y4m"), SCANNED_ISBN);
}
