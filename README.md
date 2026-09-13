# 🏠 SubLyon — Projet G3 LOG

Application web mobile-first de sous-location temporaire entre étudiants à Lyon.

## 👥 Équipe

- 1 PO
- 1 UX
- 2 DEV

---

## ✅ Avancement DEV

L'environnement technique du projet est prêt.

- [x] Repository GitHub configuré
- [x] Structure du projet créée
- [x] VS Code + GitHub Copilot configurés
- [x] `agents.md` configuré pour l'Agentic Coding
- [x] Node.js / npm configurés
- [x] Vite configuré
- [x] Firebase SDK installé
- [x] Projet Firebase créé
- [x] Firebase Authentication configuré
- [x] Connexion par lien magique e-mail testée avec succès
- [x] Firestore créé et connecté
- [x] Règles Firestore initiales configurées
- [x] Frontend connecté à Firebase

⚠️ L'interface actuelle est uniquement un POC technique.

Le développement réel de l'application commencera après validation des maquettes UX et des User Stories du PO.

---

## 🚀 Récupérer le projet

Cloner le repository :

```bash
git clone https://github.com/sosoYim/m2gdp-g3-log.git
```

Entrer dans le projet :

```bash
cd m2gdp-g3-log
```

Ouvrir avec VS Code :

```bash
code .
```

Installer les dépendances :

```bash
npm install
```

Pour les DEV, récupérer également le fichier `.env` auprès de l'équipe DEV afin de connecter Firebase.

Lancer le projet :

```bash
npm run dev
```

Puis ouvrir :

```text
http://localhost:5173/
```

---

## 📁 Architecture

```text
m2gdp-g3-log/
│
├── landing/     # Site vitrine
├── public/      # Application web / PWA
├── workers/     # Backend Cloudflare Workers
├── docs/        # Documentation
├── design/      # Maquettes et travaux UX
├── specs/       # User Stories et spécifications PO
├── tests/       # Tests Playwright
│
├── agents.md
├── README.md
├── package.json
└── vite.config.js
```

Cette structure suit l'organisation demandée dans le cours. :contentReference[oaicite:0]{index=0}

---

## 🔄 Récupérer les dernières modifications

Avant de travailler :

```bash
git pull origin main
```

Pour voir les fichiers modifiés :

```bash
git status
```

---

## ⏭️ Prochaine étape

Les DEV attendent maintenant :

- les maquettes UX ;
- la charte graphique ;
- les User Stories du PO ;
- les critères d'acceptation ;
- le retour du professeur.

Une fois ces éléments validés, le développement de l'application SubLyon pourra commencer.
