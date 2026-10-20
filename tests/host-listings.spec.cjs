const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const STATE = path.join(__dirname, ".auth", "host.json");

test("Mes annonces redirige vers l'accueil sans connexion", async ({ page }) => {
  await page.goto("/host/listings");

  await expect(page).toHaveURL(/\/$/);
});


test.describe("annonceur connecté", () => {
  test.skip(!fs.existsSync(STATE), "Lancer d'abord : node tests/save-auth.cjs");

  test.use({ storageState: STATE });

  test("le titre d'une annonce ouvre la page détail", async ({ page }) => {
    await page.goto("/host/listings");

    const link = page.locator(".listing-title-link").first();
    await expect(link).toBeVisible();

    const title = (await link.innerText()).trim();

    await link.click();

    await expect(page).toHaveURL(/\/property-details\/[^/]+$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
  });
});
