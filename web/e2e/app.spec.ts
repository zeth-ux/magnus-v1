import { expect, test } from "@playwright/test";

const TABS = [
  { label: "Browse", path: "/browse" },
  { label: "My shelf", path: "/shelf" },
  { label: "Add a book", path: "/add" },
  { label: "Activity", path: "/activity" },
  { label: "Me", path: "/me" },
];

test.describe("signed in", () => {
  for (const tab of TABS) {
    test(`${tab.label} opens without errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(tab.path);
      await expect(page).toHaveURL(new RegExp(`${tab.path}$`));
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.getByRole("navigation", { name: "App", exact: true }).getByRole("link", { name: tab.label })).toHaveAttribute("aria-current", "page");
      expect(errors).toEqual([]);
    });
  }

  test("the tabs move between pages", async ({ page }) => {
    await page.goto("/browse");
    const nav = page.getByRole("navigation", { name: "App", exact: true });
    for (const tab of TABS.slice(1)) {
      await nav.getByRole("link", { name: tab.label }).click();
      await expect(page).toHaveURL(new RegExp(`${tab.path}$`));
    }
  });

  test("Activity shows how many requests are waiting for you", async ({ page }) => {
    await page.goto("/activity");
    // The fake Supabase says 2 (my_waiting_count).
    await expect(page.getByRole("navigation", { name: "App", exact: true }).getByRole("link", { name: /Activity/ })).toContainText("2");
  });
});
