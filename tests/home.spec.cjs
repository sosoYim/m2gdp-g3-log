const { test, expect } = require("@playwright/test");

test("l'application Angular SubLyon se charge", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/sublyon/i);
  await expect(page.getByText("Hello, sublyon")).toBeVisible();
});