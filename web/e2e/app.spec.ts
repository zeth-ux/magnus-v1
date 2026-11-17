import { expect, test, type Locator, type Page } from "@playwright/test";
import { watchForErrors } from "./watch";

/**
 * Each tab, and something on it that only the data part of the page shows
 * (streamed in after the static shell), from the fake Supabase's data. Waiting
 * for it means a failed query or bad data can't slip past while the shell looks fine.
 */
const TABS: { label: string; short: string; path: string; data: (p: Page) => Locator; onlyAttached?: boolean }[] = [
  // On a phone the shelf shows most books as spines turned away, so "on the page" is the check here.
  { label: "Browse", short: "Browse", path: "/browse", data: (p) => p.getByText("Circe").first(), onlyAttached: true },
  { label: "My shelf", short: "Shelf", path: "/shelf", data: (p) => p.getByText("Educated").first() },
  { label: "Add a book", short: "Add", path: "/add", data: (p) => p.getByRole("button", { name: "Scan barcode" }) },
  // The meet-up card on an accepted give.
  { label: "Activity", short: "Activity", path: "/activity", data: (p) => p.getByText("Jungang station, exit 2").first() },
  // The library card's history streams in last; "Educated" earned the starter credit.
  { label: "Me", short: "Me", path: "/me", data: (p) => p.getByText(/Starter credit for listing .Educated./) },
];

/** The desktop nav, or the phone's bottom tab bar (short labels), whichever this device shows. */
const appNav = (page: Page) => page.getByRole("navigation", { name: /^App/ }).filter({ visible: true });
const tabLink = (page: Page, tab: (typeof TABS)[number]) =>
  appNav(page).getByRole("link", { name: new RegExp(`^(${tab.label}|${tab.short})\\b`) });
const shows = (page: Page, tab: (typeof TABS)[number]) =>
  tab.onlyAttached ? expect(tab.data(page)).toBeAttached() : expect(tab.data(page)).toBeVisible();

test.describe("signed in", () => {
  for (const tab of TABS) {
    test(`${tab.label} opens and shows its data`, async ({ page }) => {
      const watch = watchForErrors(page);
      await page.goto(tab.path);
      await expect(page).toHaveURL(new RegExp(`${tab.path}$`));
      await shows(page, tab);
      await expect(tabLink(page, tab)).toHaveAttribute("aria-current", "page");
      await watch.expectClean();
    });
  }

  test("the tabs move between pages", async ({ page }) => {
    await page.goto("/browse");
    for (const tab of TABS.slice(1)) {
      await tabLink(page, tab).click();
      await expect(page).toHaveURL(new RegExp(`${tab.path}$`));
      await shows(page, tab);
    }
  });

  test("Activity says how many requests are waiting for you", async ({ page }) => {
    await page.goto("/activity");
    // The fake Supabase says 2 (my_waiting_count); this is what a screen reader hears.
    await expect(tabLink(page, TABS[3])).toHaveAccessibleName(/2 waiting for you/);
  });
});
