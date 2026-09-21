const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests",

  use: {
    baseURL: "http://127.0.0.1:4173",
    headless: true,
    channel: "chrome"
  },

  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 4173 --strictPort",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true
  }
});