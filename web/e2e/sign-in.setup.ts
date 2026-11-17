import { expect, test as setup } from "@playwright/test";
import { READER_STATE } from "../playwright.config";
import { GOOD_CODE } from "./constants";

/** Signs in once with the email code, the way a reader does, and saves the session for the signed-in tests. */
setup("sign in with an email code", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("reader@example.com");
  await page.getByRole("button", { name: "Email me a code" }).click();
  await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();

  await page.getByLabel("Code from the email").fill(GOOD_CODE);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).not.toHaveURL(/\/login/);
  await page.context().storageState({ path: READER_STATE });
});
