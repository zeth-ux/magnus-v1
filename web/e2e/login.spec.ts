import { expect, test, type Page } from "@playwright/test";
import { BUSY_EMAIL, GOOD_CODE } from "./constants.mjs";
import { watchForErrors } from "./watch";

async function askForCode(page: Page, email: string) {
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Email me a code" }).click();
}

test.describe("signing in", () => {
  test("a signed-out visit to a signed-in page goes to sign-in, then back to that page", async ({ page }) => {
    const watch = watchForErrors(page);
    await page.goto("/me");
    await expect(page).toHaveURL(/\/login\?next=%2Fme/);

    await askForCode(page, "reader@example.com");
    await page.getByLabel("Code from the email").fill(GOOD_CODE);
    await page.getByRole("button", { name: "Sign in" }).click();
    // Back where the reader was going, signed in (the sign-in loop we had would bounce back to /login).
    await expect(page).toHaveURL(/\/me$/);
    await expect(page.getByLabel("Your name")).toHaveValue("Zarith");
    await watch.expectClean();
  });

  test("a wrong code says so and keeps you on the code step", async ({ page }) => {
    await page.goto("/login");
    await askForCode(page, "reader@example.com");
    await page.getByLabel("Code from the email").fill("000000");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.locator("#code-error")).toContainText("That code is wrong or has expired");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByLabel("Code from the email")).toBeFocused();
  });

  test("a mistyped email is caught before anything is sent", async ({ page }) => {
    await page.goto("/login");
    await askForCode(page, "not-an-email");
    await expect(page.locator("#email-error")).toContainText("That email doesn't look right");
    await expect(page.getByRole("heading", { name: "Check your email" })).toHaveCount(0);
  });

  test("Supabase's email limit shows its own message", async ({ page }) => {
    await page.goto("/login");
    await askForCode(page, BUSY_EMAIL);
    await expect(page.locator("#email-error")).toContainText("our email is busy right now");
  });
});
