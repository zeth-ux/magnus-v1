import { mkdirSync } from "node:fs";
import path from "node:path";
import { writeBarcodeVideo } from "./barcode-video.mjs";
import { BARCODE_VIDEO, SCANNED_ISBN } from "./constants.mjs";

/** Before any test: the fake camera's video (a book barcode). */
export default function globalSetup() {
  mkdirSync(path.dirname(BARCODE_VIDEO), { recursive: true });
  writeBarcodeVideo(BARCODE_VIDEO, SCANNED_ISBN);
}
