const { test, expect } = require("@playwright/test");

test("la page SubLyon se charge", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "SubLyon" })
  ).toBeVisible();

  await expect(
    page.getByRole("heading", { name: "Se connecter avec votre e-mail" })
  ).toBeVisible();
});