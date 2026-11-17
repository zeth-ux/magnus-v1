import { expect, test } from "@playwright/test";
import { SCANNED_ISBN } from "./constants";

/** A phone with a fake camera that shows a book's barcode (e2e/barcode-video.mjs). */
test("scanning a barcode fills in the ISBN and finds the book", async ({ page }) => {
  await page.goto("/add");
  await page.getByRole("button", { name: "Scan barcode" }).click();
  await expect(page.getByLabel("Camera preview")).toBeVisible();

  await expect(page.locator("#isbn-find")).toHaveValue(SCANNED_ISBN, { timeout: 15_000 });
  // The camera turns off once it has the book, and the book is looked up.
  await expect(page.getByLabel("Camera preview")).toHaveCount(0);
  await expect(page.getByText("Klara and the Sun")).toBeVisible();
});
