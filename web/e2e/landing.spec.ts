import { expect, test } from "@playwright/test";
import { watchForErrors } from "./watch";

test.describe("landing page", () => {
  test("renders the shelf from Supabase, the sections and the footer, with no errors", async ({ page }) => {
    const watch = watchForErrors(page);
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // A title only the fake Supabase has (public_shelf), not one of the built-in sample books.
    await expect(page.getByText("The Vegetarian").first()).toBeAttached();
    await expect(page.getByRole("heading", { name: /How a book moves/ })).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();
    await watch.expectClean();
  });

  test("the next and previous arrows move along the shelf", async ({ page }) => {
    await page.goto("/");
    // The shelf announces the book it stops on.
    const announced = page.locator(".turning-shelf [aria-live='polite']");
    await page.getByRole("button", { name: "Next book" }).click();
    await expect(announced).not.toBeEmpty();
    const first = (await announced.textContent()) ?? "";
    await page.getByRole("button", { name: "Next book" }).click();
    await expect(announced).not.toHaveText(first);
    await page.getByRole("button", { name: "Previous book" }).click();
    await expect(announced).toHaveText(first);
  });
});
