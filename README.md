# SubLyon — M2 Gestion de Projet

Application web mobile-first de mise en relation pour la sous-location temporaire de logements étudiants à Lyon.

## Stack

### Frontend
- Angular
- TypeScript
- Spartan UI
- Tailwind CSS
- PWA
- Leaflet
- Google Places API

### Backend
- Cloudflare Workers
- TypeScript

### Services
- Firebase Authentication
- Cloud Firestore
- Firebase Realtime Database
- Cloudflare D1
- Cloudflare R2
- Firebase Hosting
- Playwright

## Structure

```text
landing/       Site vitrine
public/        Application Angular
workers/       Backend Cloudflare Workers
docs/          Documentation technique
design/        Maquettes et artefacts UX
specs/         User Stories / OpenAPI / Mermaid
tests/         Tests Playwright
agents.md      Instructions IA
README.md      Documentation projet
Installation
1. Cloner le projet
git clone https://github.com/sosoYim/m2gdp-g3-log.git
cd m2gdp-g3-log
2. Installer les dépendances principales
npm install
3. Installer les dépendances Angular
npm run setup
4. Configuration Firebase

Créer le fichier :

public/src/environments/environment.ts

à partir de :

public/src/environments/environment.example.ts

Sous PowerShell :

Copy-Item public\src\environments\environment.example.ts public\src\environments\environment.ts

Puis renseigner les valeurs Firebase communiquées par l'équipe.

environment.ts est ignoré par Git et ne doit pas être envoyé sur GitHub.

Lancer le projet
Frontend Angular
npm run dev:front

Application :

http://localhost:4200
Backend Cloudflare

Dans un deuxième terminal :

npm run dev:back

API locale :

http://127.0.0.1:8787

Health check :

http://127.0.0.1:8787/api/health
Tests
npm test
Build production
npm run build

Le build Angular est généré dans :

public/dist/sublyon/browser
Commandes utiles
npm run dev:front
npm run dev:back
npm run build
npm test
npm run worker:types
npm run deploy:preview
Workflow Git

Ne pas développer directement sur main.

Créer une branche à partir de main :

git switch main
git pull origin main
git switch -c feat/nom-fonctionnalite

Exemples :

feat/auth
feat/create-listing
feat/search-listings
feat/messaging

Puis :

git add .
git commit -m "feat: description"
git push -u origin feat/nom-fonctionnalite

Après validation, la branche peut être fusionnée dans main.

Méthode de développement

Pour chaque fonctionnalité :

User Story validée
→ Maquette UX
→ Spécification technique
→ Développement
→ Test Playwright
→ Validation PO / UX