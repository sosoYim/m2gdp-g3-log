export const environment = {
  firebase: {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
    databaseURL: ""
  },

  /*
   * URL du Worker Cloudflare (API).
   * Production : Worker déployé sur Cloudflare
   */
  apiUrl: "https://m2gdp-g3-log-api.m2gdp-g3-log.workers.dev",

  /*
   * Google Maps (Places + carte) — étape 1 « Déposer une annonce ».
   * Clé du projet m2gdp-g3-log-3963b, restreinte aux domaines de l'app.
   * Vide = saisie libre de l'adresse.
   */
  googleMapsApiKey: "",

  /*
   * Map ID (marqueurs). Vide = DEMO_MAP_ID (développement).
   */
  googleMapsMapId: ""
};