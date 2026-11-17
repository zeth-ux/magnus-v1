import { expect, test } from "@playwright/test";
import { SCANNED_ISBN, SCANNED_TITLE } from "./constants.mjs";
import { watchForErrors } from "./watch";

/**
 * A phone with a fake camera that shows a book's barcode (e2e/barcode-video.mjs).
 * Linux Chromium has no BarcodeDetector, so this covers the ZXing reader, not the
 * native one Chrome on Android uses: a real phone is still the check for that.
 */
test("scanning a barcode fills in the ISBN and finds the book", async ({ page }) => {
  const watch = watchForErrors(page);
  await page.goto("/add");
  await page.getByRole("button", { name: "Scan barcode" }).click();

  await expect(page.locator("#isbn-find")).toHaveValue(SCANNED_ISBN, { timeout: 15_000 });
  // The camera turns off once it has the book, and the book is looked up.
  await expect(page.getByLabel("Camera preview")).toHaveCount(0);
  await expect(page.getByText(SCANNED_TITLE)).toBeVisible();
  await watch.expectClean();
});
