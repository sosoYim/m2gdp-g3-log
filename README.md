# {{BRAND}} — LOG

Marketplace d'échanges de logement étudiant à Lyon. Les étudiants peuvent sous-louer leur chambre ou appartement (jusqu'à 6 mois) à d'autres étudiants en stage, en vacances ou en semestre d'échange.

## Description

Deux profils : **annonceur** (publie une annonce) et **demandeur** (cherche un logement). Un utilisateur peut être les deux. Zone géographique : Métropole de Lyon.

Connexion sans mot de passe (lien magique), carte interactive, messagerie en temps réel, système de réservation et d'avis.

## Structure du dépôt

| Dossier / Fichier | Rôle |
|---|---|
| `/landing` | Site marketing statique (index.html, css, img). Géré par l'UX. Hébergé sur `<site>.web.app` |
| `/public` | PWA (React + Vite + shadcn/ui). Hébergée sur `app-<site>.web.app` |
| `/workers` | Backend : Cloudflare Worker (API REST). package.json + wrangler.toml propres |
| `/docs` | Documentation technique en Markdown |
| `/design` | Artefacts UX en HTML (charte, maquettes, prototypes) |
| `/specs` | Artefacts PO : OpenAPI, Mermaid, données JSON de seed |
| `/tests` | Tests E2E Playwright (package.json propre) |
| `agents.md` | Instructions pour les agents IA |
| `README.md` | Ce fichier |
| `firebase.json` | Config Firebase Hosting (landing + app) |
| `.firebaserc` | Alias du projet Firebase |

## Lancer en développement

```bash
# Frontend (PWA)
cd public
cp .env.example .env.local   # renseigner les variables
npm install
npm run dev                  # http://localhost:5173

# Backend (Worker)
cd workers
cp .dev.vars.example .dev.vars   # renseigner les secrets
npm install
npm run dev                      # http://localhost:8787
```

## Déployer

```bash
# Backend
cd workers
npm run deploy

# Frontend + Landing (via GitHub Actions au merge sur main)
# Ou manuellement :
npx firebase-tools deploy --only hosting
```
