import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  root: "public",
  envDir: "..",

  plugins: [
    VitePWA({
      registerType: "autoUpdate",

      manifest: {
        name: "SubLyon",
        short_name: "SubLyon",
        description: "Sous-location étudiante à Lyon",

        start_url: "/",
        display: "standalone",

        background_color: "#ffffff",
        theme_color: "#ffffff"
      },

      devOptions: {
        enabled: true
      }
    })
  ]
});