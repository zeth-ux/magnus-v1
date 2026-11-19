import { expect, test } from "@playwright/test";
import { GOOD_CODE } from "./constants.mjs";
import { watchForErrors } from "./watch";

/** Circe, listed by Hafiz at Jungang station in the fake Supabase. */
const CIRCE = "/browse/00000001-0000-4000-8000-000000000001";
/** Things only signed-in readers may see: owners' names and their notes. */
const PRIVATE = /Aina|Hafiz|Sofea|Danial|Mei|Zarith|on the 4 bus|worth every page/;

test.describe("the open shelf, signed out", () => {
  test("anyone can browse the shelf, without seeing who owns what", async ({ page }) => {
    const watch = watchForErrors(page);
    await page.goto("/browse");
    await expect(page).toHaveURL(/\/browse$/);
    await expect(page.getByText("Pachinko").first()).toBeAttached();
    await expect(page.getByRole("complementary", { name: "Sign in" })).toContainText("Sign in to ask its owner");
    await expect(page.getByRole("link", { name: "Sign in" }).first()).toBeVisible();
    await expect(page.getByText("a reader").first()).toBeAttached();
    expect(await page.locator("body").innerText()).not.toMatch(PRIVATE);
    await watch.expectClean();
  });

  test("a book's page shows the book and the area, then signing in comes back to it", async ({ page }) => {
    const watch = watchForErrors(page);
    await page.goto(CIRCE);
    await expect(page.getByRole("heading", { level: 1, name: "Circe" })).toBeVisible();
    await expect(page.getByText("From a reader in Jungang station")).toBeVisible();
    expect(await page.locator("body").innerText()).not.toMatch(PRIVATE);
    // The app bar's Sign in also comes back to this book.
    await expect(page.getByRole("banner").getByRole("link", { name: "Sign in" })).toHaveAttribute("href", /next=%2Fbrowse%2F00000001/);

    await page.getByRole("link", { name: "Sign in to ask for this book" }).click();
    await expect(page).toHaveURL(/\/login\?next=%2Fbrowse%2F/);
    await page.getByLabel("Email").fill("reader@example.com");
    await page.getByRole("button", { name: "Email me a code" }).click();
    await page.getByLabel("Code from the email").fill(GOOD_CODE);
    await page.getByRole("button", { name: "Sign in" }).click();

    // Back on the same book, signed in: now it says who has it.
    await expect(page).toHaveURL(new RegExp(`${CIRCE}$`));
    await expect(page.getByRole("heading", { level: 1, name: "Circe" })).toBeVisible();
    await expect(page.getByText(/From Hafiz/)).toBeVisible();
    await watch.expectClean();
  });

  test("the wishlist filter asks you to sign in", async ({ page }) => {
    await page.goto("/browse?mode=wish");
    await expect(page.getByText("Sign in to see which books on your wishlist are on the shelf.")).toBeVisible();
  });

  for (const path of ["/shelf", "/add", "/activity"]) {
    test(`${path} still needs an account`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(new RegExp(`/login\\?next=${encodeURIComponent(path)}`));
    });
  }
});
