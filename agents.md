agents.md — Instructions for AI coding agents

This file is the single source of truth for any AI agent (Claude Code, Antigravity, Copilot, Cursor…) working in this repository. Read it fully before doing anything. When a task and this file disagree, follow this file and say so.

1. Project context

Name: {{BRAND}} (working name; see /design/charte.html once the UX has defined it) Course: M2CIM "Gestion de Projet" 2026/2027 — Université Lyon 2 (teacher: @quangfr) Project: LOG — Échanges de logement. A local marketplace where students in Lyon sublet their room or flat (up to 6 months) to other students coming for an internship, holidays or an exchange semester. The platform is a trusted intermediary: verified profiles, listing search on a map, first contact by messaging, then booking.

Two user types

host (annonceur) — a student who publishes a listing for their room/flat.
guest (demandeur) — a student looking for a place. A user can be both. Geography is always Métropole de Lyon.

Team roles: PO (specs, tickets, tests), UX (branding, mockups, landing site), DEV (this app). You act on behalf of the DEV.

What is graded — optimise for this, nothing else

Functional: the validated roadmap works end-to-end (nominal path + handled edge cases), automated Playwright tests pass.
Ergonomics: mobile-first, short clear text, consistent with the UX charter.
Realistic data: 100+ users, 100+ listings, 200+ conversations, 200+ bookings, 200+ reviews, a category list with 10+ choices, a geographic list of 100+ items (Lyon IRIS neighbourhoods / POIs), 20+ default illustrations.

What is explicitly NOT graded — do not spend effort here Code architecture, test robustness beyond the acceptance criteria, security hardening, performance, scalability, production ops. Keep everything as simple as possible.

2. Repository layout (fixed — do not restructure)
/landing        Static marketing site (index.html, css, img). Owned by UX. Hosted at <site>.web.app
/public         The PWA (React + Vite + shadcn/ui). Hosted at app-<site>.web.app
/workers        Backend: one Cloudflare Worker (REST API). Own package.json + wrangler.toml
/docs           Technical docs in Markdown (Mermaid diagrams allowed)
/design         UX artefacts in HTML (charter, mockups, prototypes)
/specs          PO artefacts: OpenAPI (openapi.yaml), Mermaid, seed JSON data
/tests          Playwright E2E tests (own package.json)
agents.md       This file
README.md       Human-facing overview + how to run
firebase.json   Hosting config for BOTH sites (landing + public) — lives at the root
.firebaserc     Firebase project alias

Three npm projects: /public, /workers, /tests. Never add a root package.json. Always cd into the right folder before npm/npx.

3. Tech stack (fixed)
Layer	Choice	Notes
Front	React 18 + TypeScript + Vite, PWA via vite-plugin-pwa	Mobile-first, bottom nav bar
UI	Tailwind + shadcn/ui, Lucide icons	Use the shadcn MCP/CLI to add components; do not hand-write primitives
Map	Leaflet + react-leaflet, OpenStreetMap tiles	Default center Lyon [45.764, 4.8357], zoom 13
Geocoding	Google Places API (Autocomplete + Geocoding), key in VITE_GOOGLE_MAPS_KEY	Restrict key by HTTP referrer
Auth	Firebase Authentication — email link (passwordless / magic link)	No password login
Backend	Cloudflare Workers (TypeScript), hono router	Single worker, REST, JSON
Data DB	Firestore (via firebase-rest-api style fetch or firebase-admin REST from the Worker)	Users, listings, bookings, reviews
Messages	Firebase Realtime Database	Conversations, live updates
Files	Cloudflare R2, bucket files	Photos, documents
Sessions	Cloudflare D1 (SQLite), db sessions	Server sessions + magic-link audit
Hosting	Firebase Hosting, 2 targets (landing, app), deployed by GitHub Actions on push to main	
Tests	Playwright (/tests)	E2E from user-story acceptance criteria

Golden rule of the architecture: the browser never talks to Firestore, RTDB, R2 or D1 directly. The browser only calls (a) Firebase Auth SDK to sign in and (b) our Worker at /api/* with Authorization: Bearer <Firebase ID token>. The Worker holds all secrets and does all reads/writes.

4. Environment & secrets

Never commit secrets. .gitignore must contain .env*, *.json service account keys, .wrangler/, node_modules/, dist/, test-results/.

Where	Variable	Purpose
/public/.env.local	VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_APP_ID, VITE_FIREBASE_DATABASE_URL	Firebase web config (public by design)
/public/.env.local	VITE_API_URL	Worker URL (http://localhost:8787 in dev)
/public/.env.local	VITE_GOOGLE_MAPS_KEY	Places API
Worker secret	FIREBASE_SERVICE_ACCOUNT	Full service-account JSON as a string (npx wrangler secret put)
Worker secret	SESSION_SECRET	Random 32+ chars for signing session ids
/workers/wrangler.toml [vars]	FIREBASE_PROJECT_ID, ALLOWED_ORIGINS	Non-secret config
/workers/.dev.vars	same secrets for local dev	git-ignored

Provide /public/.env.example and /workers/.dev.vars.example with empty values and a comment per key.

5. Setup procedure (run this when the repo is empty or a step is missing)

Work through the checklist in order. Before each step, check whether it is already done (file exists, command succeeds) and skip it if so. After each step, commit with the message given. If a step needs a human (login in a browser, paste a key, enable a console setting), stop, tell the human exactly what to do and what you need back, then continue.

Step 0 — Prerequisites check
bash
node -v        # need >= 20
npm -v
git status
npx firebase-tools --version || npm i -g firebase-tools
npx wrangler --version       # installed locally in /workers at step 3

Ask the human for: Firebase project id, Cloudflare account (logged in via wrangler login), Google Maps API key. Do not invent them.

Step 1 — Repo skeleton → commit chore: repo skeleton

Create every folder from §2 with a .gitkeep or a starter file, README.md, .gitignore, .editorconfig. Create /docs/architecture.md with the Mermaid diagram from §10.

Step 2 — Front (/public) → commit feat(front): vite react pwa + shadcn
bash
cd public
npm create vite@latest . -- --template react-ts
npm i firebase react-router-dom leaflet react-leaflet @tanstack/react-query zod
npm i -D vite-plugin-pwa tailwindcss @tailwindcss/vite @types/leaflet
npx shadcn@latest init   # style: default, base color: neutral, CSS variables: yes
npx shadcn@latest add button input label card sheet dialog tabs badge avatar skeleton form toast select textarea
vite.config.ts: tailwind plugin, PWA plugin (manifest name from {{BRAND}}, theme colour from /design/charte.html or 
#111827 fallback), @ alias to src.
Folder structure: src/lib/firebase.ts, src/lib/api.ts (fetch wrapper adding the ID token), src/routes/, src/components/, src/features/<feature>/.
Routes (bottom nav): / home, /search (list ⇄ map toggle, filter sheet), /listing/:id, /listing/new, /messages, /bookings, /profile, /login, /signup.
Verify: npm run dev serves, npm run build passes with zero TS errors.
Step 3 — Backend (/workers) → commit feat(workers): hono api skeleton
bash
cd workers
npm init -y
npm i hono
npm i -D wrangler typescript @cloudflare/workers-types
npx wrangler login            # HUMAN
npx wrangler d1 create sessions
npx wrangler r2 bucket create files
wrangler.toml: name = "{{BRAND}}-api", main = "src/index.ts", compatibility_date = today, [[d1_databases]] binding = "DB", [[r2_buckets]] binding = "FILES", [vars] from §4.
package.json scripts: "dev": "wrangler dev", "deploy": "wrangler deploy", "migrate": "wrangler d1 migrations apply sessions".
migrations/0001_sessions.sql (see §7).
src/index.ts: Hono app, CORS restricted to ALLOWED_ORIGINS, GET /api/health, auth middleware (§6), routers per resource (§8).
Secrets: npx wrangler secret put FIREBASE_SERVICE_ACCOUNT and SESSION_SECRET (HUMAN pastes values). Mirror in .dev.vars.
Verify: npm run dev then curl localhost:8787/api/health → {"ok":true}.
Step 4 — Firebase → commit chore(firebase): hosting + rules

HUMAN in console (tell them precisely): create project → Authentication → Sign-in method → Email/Password → enable "Email link (passwordless sign-in)" → Firestore (production mode, region europe-west1) → Realtime Database (locked mode, europe-west1) → Project settings → Service accounts → generate key → Web app → copy config. Then from the root:

bash
npx firebase-tools login          # HUMAN
npx firebase-tools init hosting   # public dir: public/dist, SPA: yes, GitHub Actions: yes
firebase.json: two hosting targets — landing (dir landing, no build) and app (dir public/dist, SPA rewrite to /index.html, predeploy: cd public && npm ci && npm run build).
.firebaserc with targets. Run npx firebase-tools target:apply hosting landing <site-id> and ... app <site-id> (HUMAN creates the second site in console → Hosting → Add another site).
firestore.rules and database.rules.json: deny all client access (allow read, write: if false;) — the Worker uses the service account and bypasses rules. Deploy rules.
Verify: npx firebase-tools deploy --only hosting succeeds and both URLs load.
Step 5 — Auth POC (J2 deliverable) → commit feat(auth): magic link sign-in + session

Implement §6 end to end. Acceptance tests (must pass, also as Playwright tests in /tests/auth.spec.ts using the Firebase Auth emulator or a test inbox):

Valid existing email → link is sent, confirmation screen shown.
Clicking the link opens the app, initialises the session, redirects to /.
Unknown email → account is created and the user lands on /signup already signed in (step-by-step form: first/last name, user type, photo, postal address with autocomplete).
Malformed email → blocking error under the field, no email sent.
Link older than 15 min or already used → redirect to /login with an "expired" toast.
Step 6 — Tests (/tests) → commit test: playwright setup
bash
cd tests && npm init -y && npm i -D @playwright/test && npx playwright install chromium

playwright.config.ts with baseURL from env (http://localhost:5173 by default), mobile viewport (Pixel 7), traces on failure. One spec per user story, named after the GitHub issue: US-12-create-listing.spec.ts.

Step 7 — Seed data → commit data: seed generator + fixtures

/specs/data/*.json generated by /workers/scripts/seed.ts (run with npx tsx), pushed through the Worker's admin endpoint POST /api/admin/seed (protected by SESSION_SECRET header, dev only). Targets from §1. Use real Lyon addresses/arrondissements, French names, realistic prices (250–900 €/month), dates in the current academic year. Default illustrations: 20+ images in /public/public/img/defaults/ keyed by room type.

Step 8 — GitHub → HUMAN

Ask the human to: create the repo m2gdp-gX-log, push, add @quangfr as collaborator, create a Project with a "Backlog" table view grouped by parent Epic, statuses Draft / Ready / Todo / In progress / To validate / Done. You create the first issues (§11).

6. Authentication & session flow
Firestore
D1 sessions
Worker
Firebase Auth
Browser (React)
Firestore
D1 sessions
Worker
Firebase Auth
Browser (React)
sendSignInLinkToEmail(email, {url: APP_URL/auth/callback})
(email sent)
signInWithEmailLink(email, link)
ID token (JWT)
POST /api/auth/session Authorization: Bearer <idToken>
verify JWT (Google public keys, aud = project id)
get users/{uid} (create with status "onboarding" if missing)
INSERT session (id, uid, created_at, expires_at)
{sessionId, user}
every /api/* call with Bearer <idToken>
Client: window.localStorage keeps the email between sending and clicking the link (emailForSignIn). Keep the Firebase user signed in (SDK persistence) and always send the fresh ID token.
Worker auth middleware: verify the Firebase ID token on every /api/* route except /api/health. Put {uid, email} in c.var.user. Cache Google certs in memory.
Session (D1) is used for audit + the "expired link" rule (15 min) + the "already used" rule; it is not a cookie. Keep it simple.
users/{uid}.status: onboarding until the signup form is complete, then active. Front redirects onboarding users to /signup.
7. Data model
Firestore (collection → document fields)
users/{uid}: email, firstName, lastName, role: 'host'|'guest'|'both', photoUrl, address {label, lat, lng, postalCode, sector}, university, bio, status, ratingAvg, ratingCount, createdAt, updatedAt
listings/{id}: hostId, title, description, type: 'room_in_flat'|'studio'|'flat'|'room_at_owner', price (€/month), deposit, availableFrom, availableTo, minNights, address {…same as user}, geo {lat, lng, geohash}, sector (postal code), amenities: string[], photos: string[] (R2 URLs), status: 'draft'|'published'|'paused'|'booked', ownerAgreement: boolean, createdAt, updatedAt
bookings/{id}: listingId, hostId, guestId, from, to, status: 'requested'|'accepted'|'declined'|'cancelled'|'completed', message, createdAt
reviews/{id}: bookingId, authorId, targetId, rating 1–5, comment, createdAt
favorites/{uid}: { listingIds: string[] }
ref/sectors and ref/amenities: reference lists (also in /specs/data/).

Always store createdAt/updatedAt as ISO strings. Ids are Firestore auto-ids. Denormalise what the list views need (e.g. hostName, hostPhotoUrl, firstPhoto on listings) — no joins.

Realtime Database
conversations/{convId}: { listingId, participants: {uid: true}, lastMessage, lastAt }
messages/{convId}/{msgId}: { from, text, at, type: 'text'|'booking_request'|'booking_update' }
userConversations/{uid}/{convId}: true

convId = sorted ${uidA}_${uidB}_${listingId}.

D1 (migrations/0001_sessions.sql)
sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY, uid TEXT NOT NULL, email TEXT NOT NULL,
  created_at TEXT NOT NULL, expires_at TEXT NOT NULL, used_at TEXT
);
CREATE INDEX idx_sessions_uid ON sessions(uid);
R2

Keys: users/{uid}/avatar.{ext}, listings/{id}/{n}.{ext}, users/{uid}/docs/{name}. Max 5 MB per upload, images only for photos. Serve through GET /api/files/* (Worker streams from R2) — do not make the bucket public.

8. REST API contract

Base: /api. JSON in/out. Errors: { error: { code, message } } with proper HTTP status. Keep /specs/openapi.yaml in sync — when you add or change a route, update the OpenAPI file in the same commit.

Method	Route	Purpose
GET	/health	liveness
POST	/auth/session	create session after Firebase sign-in
GET / PATCH	/me	current user profile
POST	/me/avatar	multipart upload → R2
GET	/listings?q&sector&type&minPrice&maxPrice&from&to&lat&lng&radiusKm&sort	search
POST	/listings	create (host only)
GET / PATCH / DELETE	/listings/:id	read / edit / soft-delete (owner)
POST	/listings/:id/photos	upload
GET / PUT	/me/favorites	favourites
POST	/bookings	request
GET	`/bookings?role=host	guest`
PATCH	/bookings/:id	accept / decline / cancel
POST	/reviews	after completed booking
GET	/conversations, /conversations/:id/messages	via RTDB
POST	/conversations/:id/messages	send
POST	/geo/geocode	proxy to Google Geocoding (keeps key server-side for this call)
POST	/admin/seed	dev only

Distance filtering: compute haversine in the Worker on the candidate set (filter by sector/geohash prefix first). Good enough at this scale.

9. Coding conventions
TypeScript strict everywhere. zod schemas in /workers/src/schemas/ are the validation source; export the inferred types and copy the schema file to /public/src/lib/schemas.ts (a tiny sync script npm run sync-schemas in /workers).
Front: feature folders, React Query for server state, no Redux. Forms with react-hook-form + shadcn Form. All text in French (UI language), code identifiers in English. Bottom navigation with 5 items: Accueil, Recherche, Annonces (+), Messages, Profil.
Mobile-first: design at 390 px, test at 390 and 1024. Touch targets ≥ 44 px. One primary action per screen.
Worker: one file per resource in src/routes/, thin handlers, Firestore access through src/lib/firestore.ts (REST wrapper with service-account OAuth token, cached ~50 min).
Commit messages: Conventional Commits, reference the issue: feat(listings): map view (#23).
Branches: main (deployed) and short-lived feat/<issue-number>-<slug>. Squash merge.
Never delete data destructively in shared environments; use status fields.
Do not add libraries beyond §3 without stating why in the commit body.
10. Definition of Done for any user story
Acceptance criteria of the GitHub issue are implemented (nominal path + listed error cases).
cd public && npm run build and cd workers && npx tsc --noEmit pass.
Playwright spec for the story exists and passes locally (cd tests && npx playwright test).
/specs/openapi.yaml updated if the API changed; /docs/<feature>.md written or updated (short, with a Mermaid diagram if there is a flow).
Deployed: cd workers && npm run deploy, front deployed by GitHub Actions on merge to main.
Issue moved to To validate with a comment: what to test, URL, test account.
11. GitHub issues to create at bootstrap

Epics (no label, just a parent issue): Accueil & Compte, Annonces, Recherche & Carte, Réservation, Messagerie, Profil & Préférences, Données & Seed, Infra & Qualité. First stories under Accueil & Compte: Se connecter par lien magique, Créer son compte pas à pas, Afficher l'accueil avec le menu bas. Story title: < 15 words, starts with a verb, persona if useful. Body template: 💡 Contexte & happy path · ✅ Critères d'acceptation · 🟢 Prérequis · 🧑‍💻 Specs techniques (checkboxes) · 🚫 Exclusions. Technical tasks that need no PO/UX validation get a [Task], [API] or [Data] prefix in the title.

12. How to behave
Plan first, then act. For any story, write a 5–10 line plan (files to touch, API changes, tests) before coding.
Verify, don't assume. Run the build, run the tests, curl the endpoint, open the page. Report actual output.
Ask when blocked by a human-only step (console settings, secrets, account access). Otherwise do not ask; pick the simplest option that satisfies the acceptance criteria and say what you chose.
Smallest change that passes. No refactors, no abstractions "for later", no extra features. Remember what is graded.
Fake the back when it is not ready. If a backend piece is missing, ship the front with clearly marked stub data (// FAKE) and a disabled/greyed button so the UI stays coherent — this is explicitly allowed by the course.
French in the UI, no spelling mistakes. Run a spell check on any French strings you add.
Keep this file current. When a decision here changes, edit agents.md in the same PR.