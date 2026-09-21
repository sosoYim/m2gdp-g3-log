const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests",

  use: {
    baseURL: "http://127.0.0.1:4200",
    headless: true,
    channel: "chrome"
  },

  webServer: {
    command: "npm --prefix public start -- --host 127.0.0.1 --port 4200",
    url: "http://127.0.0.1:4200",
    reuseExistingServer: true
  }
});