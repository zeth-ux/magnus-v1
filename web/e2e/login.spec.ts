import { expect, test } from "@playwright/test";

test.describe("signing in", () => {
  test("a wrong code says so and keeps you on the code step", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("reader@example.com");
    await page.getByRole("button", { name: "Email me a code" }).click();
    await page.getByLabel("Code from the email").fill("000000");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.locator("#code-error")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByLabel("Code from the email")).toBeFocused();
  });

  test("a mistyped email is caught before anything is sent", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("not-an-email");
    await page.getByRole("button", { name: "Email me a code" }).click();
    await expect(page.locator("#email-error")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Check your email" })).toHaveCount(0);
  });

  test("Supabase's email limit shows a clear message", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("busy@example.com");
    await page.getByRole("button", { name: "Email me a code" }).click();
    await expect(page.locator("#email-error")).toBeVisible();
  });

  test("a signed-out visit to a signed-in page asks you to sign in, then comes back", async ({ page }) => {
    await page.goto("/me");
    await expect(page).toHaveURL(/\/login\?next=%2Fme/);
  });
});
