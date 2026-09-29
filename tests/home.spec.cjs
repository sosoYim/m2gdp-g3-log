const { test, expect } = require("@playwright/test");

test("la landing page BailLyon se charge correctement", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/sublyon/i);

  await expect(
    page.getByText("Comment ça se passe ?", { exact: true })
  ).toBeVisible();

  await expect(
    page.getByText("FAQ", { exact: true })
  ).toBeVisible();

  await expect(
    page.getByText("On en parle ?", { exact: true })
  ).toBeVisible();
});