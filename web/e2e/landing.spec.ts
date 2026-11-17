import { expect, test } from "@playwright/test";

test.describe("landing page", () => {
  test("renders the shelf, the sections and the footer without errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("button", { name: "Next book" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /How a book moves/ })).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("the arrows move along the shelf", async ({ page }) => {
    await page.goto("/");
    const live = page.locator(".ts-live");
    await page.getByRole("button", { name: "Next book" }).click();
    await expect(live).not.toBeEmpty();
    const first = await live.textContent();
    await page.getByRole("button", { name: "Next book" }).click();
    await expect(live).not.toHaveText(first ?? "");
  });
});
