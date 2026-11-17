import { expect, type Page } from "@playwright/test";

/**
 * Collects what goes wrong on a page while a test runs: uncaught errors, and
 * console errors (our error boundary logs "[page error]" instead of throwing;
 * Chromium also logs Content-Security-Policy violations there).
 */
export function watchForErrors(page: Page) {
  const problems: string[] = [];
  page.on("pageerror", (e) => problems.push(`page error: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") problems.push(`console error: ${m.text()}`);
  });
  return {
    /** No crash screen, no uncaught error, nothing in the console. */
    async expectClean() {
      await expect(page.getByRole("heading", { name: /A gust knocked this over/ })).toHaveCount(0);
      expect(problems).toEqual([]);
    },
  };
}
