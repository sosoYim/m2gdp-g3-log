# AGENTS.md — Projet M2GDP G3 LOG

## Contexte du projet

Nom du projet : SubLyon

SubLyon est une application de mise en relation entre étudiants pour la sous-location temporaire de logements à Lyon.

Deux profils principaux :

- Annonceur : étudiant lyonnais qui souhaite sous-louer son logement pendant une absence temporaire.
- Demandeur : étudiant venant à Lyon et recherchant un logement temporaire.

L'objectif principal est de faciliter la mise en relation entre étudiants.

## Règles du projet

- Respecter les spécifications définies par le PO.
- Respecter les maquettes et la charte graphique définies par l'UX.
- Concevoir l'application en priorité pour mobile.
- Privilégier les solutions simples et rapides à développer.
- Ne pas ajouter de fonctionnalités qui ne sont pas demandées.
- Utiliser des données fictives réalistes pour les démonstrations.
- Ne jamais exposer de clé API, secret ou identifiant de service dans le dépôt GitHub.

## Architecture du dépôt

- `/landing` : site vitrine
- `/public` : application frontend
- `/workers` : backend Cloudflare Workers
- `/docs` : documentation technique
- `/design` : maquettes et artefacts UX
- `/specs` : spécifications OpenAPI, Mermaid et données JSON
- `/tests` : tests automatisés Playwright

## Stack technique prévue

Frontend :
- Progressive Web App
- Mobile-first
- HTML / CSS / JavaScript
- Librairie UI compatible avec les consignes du cours

Backend :
- Cloudflare Workers

Services :
- Firebase Authentication
- Firestore
- Firebase Realtime Database
- Cloudflare R2
- Cloudflare D1
- Firebase Hosting

Cartographie :
- LeafletJS
- Google Places API pour l'autocomplétion et le géocodage

Tests :
- Playwright

## Première fonctionnalité à développer

POC J2 :

1. Connexion utilisateur
2. Inscription utilisateur
3. Création minimale du profil utilisateur
4. Redirection vers l'accueil après authentification

Le POC doit rester simple et fonctionnel.

## Consignes pour l'IA

Avant de modifier le code :

1. Lire les spécifications présentes dans `/specs`.
2. Lire les maquettes présentes dans `/design`.
3. Vérifier l'architecture existante du projet.
4. Proposer un plan court avant une modification importante.
5. Modifier uniquement les fichiers nécessaires.
6. Ne pas inventer de fonctionnalités non spécifiées.
7. Ne jamais créer ou publier de secrets.
8. Garder les interfaces simples, lisibles et mobile-first.

Après une modification :

1. Vérifier que l'application fonctionne.
2. Vérifier qu'aucune fonctionnalité existante n'est cassée.
3. Proposer les tests Playwright nécessaires.
4. Documenter les changements importants dans `/docs`.