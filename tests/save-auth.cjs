/*
 * Enregistre une session connectée pour les tests annonceur.
 *
 * node tests/save-auth.cjs
 * → se connecter (lien magique) dans la fenêtre, aller sur /host/listings,
 *   la session est enregistrée dans tests/.auth/host.json (ignoré par git).
 */
const { chromium } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const STATE = path.join(__dirname, ".auth", "host.json");

(async () => {
  const browser = await chromium.launch({ headless: false, channel: "chrome" });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("http://127.0.0.1:4200/");
  console.log("Connectez-vous, puis ouvrez /host/listings...");

  await page.waitForURL("**/host/listings", { timeout: 0 });

  fs.mkdirSync(path.dirname(STATE), { recursive: true });
  await context.storageState({ path: STATE, indexedDB: true });

  console.log("Session enregistrée :", STATE);
  await browser.close();
})();
