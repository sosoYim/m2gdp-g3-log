# Déploiement du front (Firebase Hosting)

## Environnements

| Commande | Fichier utilisé | `apiUrl` |
| --- | --- | --- |
| `npm run dev:front` (development) | `environment.ts` | `http://127.0.0.1:8787` (Worker local) |
| `npm run build` (production) | `environment.prod.ts` | `https://m2gdp-g3-log-api.m2gdp-g3-log.workers.dev` |

Le remplacement est fait par `fileReplacements` dans `public/angular.json` (configuration `production`).

Les deux fichiers sont **gitignorés** (clés Firebase / Google Maps). Pour les créer en local :

```bash
cp public/src/environments/environment.example.ts public/src/environments/environment.ts
cp public/src/environments/environment.prod.example.ts public/src/environments/environment.prod.ts
# puis remplir les valeurs (mêmes clés Firebase dans les deux fichiers)
```

## Vérifications automatiques (GitHub Actions)

`.github/workflows/ci.yml` : sur chaque PR et chaque push sur `main` :

1. build de production (`npm run build`) : erreurs de compilation, budget CSS ;
2. tests Playwright (`npm test`). Les tests « annonceur connecté » sont ignorés en CI (pas de session).

En cas d'échec, le rapport Playwright est disponible dans l'onglet **Actions** (artefact `playwright-report`).
Lancement manuel possible : **Actions** → *CI* → *Run workflow*.

### Secrets GitHub

Dépôt → **Settings → Secrets and variables → Actions** :

| Secret | Contenu |
| --- | --- |
| `ENVIRONMENT_PROD` | Contenu complet de `environment.prod.ts` (`gh secret set ENVIRONMENT_PROD < public/src/environments/environment.prod.ts`) |

### Déploiement automatique (désactivé)

L'étape de déploiement Firebase Hosting est en commentaire à la fin de `ci.yml`. Pour l'activer :

1. un **propriétaire** du projet Firebase lance `npx -y firebase-tools init hosting:github` (dépôt `sosoYim/m2gdp-g3-log`, répondre **N** aux deux questions). Il faut le droit de modifier l'IAM : avec le rôle Éditeur, erreur `403 Policy update access denied` ;
2. vérifier que le secret `FIREBASE_SERVICE_ACCOUNT_M2GDP_G3_LOG_3963B` existe, supprimer les fichiers `firebase-hosting-*.yml` générés ;
3. décommenter l'étape « Déployer sur Firebase Hosting » de `ci.yml`.

Rappel : la configuration Firebase et la clé Google Maps se retrouvent dans le JS public. La sécurité repose sur les règles Firestore / RTDB et sur la **restriction de domaine** de la clé Google Maps (Google Cloud Console).

## Déploiement manuel

```bash
npm run build
npx -y firebase-tools deploy --only hosting --project m2gdp-g3-log-3963b
```
