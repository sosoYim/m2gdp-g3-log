# CLAUDE.md — SubLyon (BailLyon)

Source of truth for team/PO rules: `agents.md` (French). This file summarizes those rules plus the actual codebase conventions.

@agents.md

## Overview

- Student-to-student short-term sublet matching app in Lyon. Two roles: **Annonceur (host)** / **Demandeur (guest)**. Stored in Firestore `users/{uid}.role` = `'host' | 'guest'`.
- UI brand name is **BailLyon** (code/package name is `sublyon`). All UI text and code comments are in **French**.
- The real app is `public/` — **Angular 22 (standalone components, signals)**. `landing/`, `design/`, `docs/`, `workers/` are nearly empty (the landing page lives in `public/src/app/pages/landing/`).
- Backend logic = **direct client-side Firebase SDK calls**. The Worker (`workers/src/index.ts`) has `/api/health` and `/api/media` (photo upload/read/delete on R2, Firebase ID token check) — see `docs/depot-annonce.md`. Front calls it via `environment.apiUrl`. `specs/openapi.yaml` is the target REST contract (`x-implemented` flags what exists) — use it as a reference for data field names.

## Commands (run from repo root)

```bash
npm run setup        # install public/ deps
npm run dev:front    # http://localhost:4200
npm run dev:back     # Worker at http://127.0.0.1:8787
npm run build        # production build -> public/dist/sublyon/browser
npm test             # Playwright (tests/*.spec.cjs, auto-starts dev server)
```

- Requires `public/src/environments/environment.ts` (gitignored; copy from `environment.example.ts`; includes `apiUrl`, `googleMapsApiKey`, `googleMapsMapId`). Firebase project: `m2gdp-g3-log-3963b` (always pass `--project m2gdp-g3-log-3963b` to `firebase deploy`). **Never commit it, never hardcode keys.** Production builds use `environment.prod.ts` instead (also gitignored, `fileReplacements` in `angular.json`; Worker URL as `apiUrl`). CI (`.github/workflows/ci.yml`) builds + runs Playwright on PRs and `main`; Hosting auto-deploy step is commented out until a project owner adds the Firebase service account secret — see `docs/deploiement.md`.
- Build budget: component CSS **4kB warning / 8kB error** (minified). `messages.css` is already ~7.9kB → put new styles in a new component.

## Structure (`public/src/app`)

```
app.routes.ts          all routes (no lazy loading, components imported directly)
core/
  firebase/firebase.ts exports auth, firestore, realtimeDatabase singletons
  auth/                Auth service — magic-link sign-in, waitForAuthState()
  guards/auth.guard.ts redirects unauthenticated users to '/'
  profile/             users/{uid} (firstName, lastName, email, role)
                       + publicProfiles/{uid} (firstName, lastInitial) readable by any signed-in user — use it to show other users' names
                       + `currentRole` signal (Je viens / J'accueille), cached in localStorage `baillyon.lastRole` — read it instead of fetching the profile role
  listing/             listings collection (ListingDocument)
  booking/             bookingRequests collection (pending|accepted|rejected)
                       + `pendingCount` signal (host sidebar badge), cached in localStorage `baillyon.pendingCount` — the sidebar refreshes it; call `setPendingCount` after changing a request status
  favorite/            users/{uid}/favorites
  messaging/           Realtime DB conversations/{id}/messages
                       + `hasUnread` signal (purple dot on the top-bar Messages icon), one shared listener per account (`watchUnread`), cached in localStorage `baillyon.hasUnread`; unread rule = `isConversationUnread`
  media/               photo upload/delete via the Worker (R2)
  maps/                Google Maps (Places suggestions + map), key in environment; disabled if empty
pages/<kebab-name>/    one folder per route (ts/html/css)
pages/landing/components/  landing sections (contact-section, footer are reused on other pages)
shared/components/     navbar (logged out), user-navbar (logged in), account-sidebar (guest), host-sidebar (host), auth-modal
```

Static images: `public/public/images/<domain>/...` → referenced as `/images/...` in templates.

## Code conventions (match existing code)

**Components**
- Files `foo-bar.ts/.html/.css`, class `FooBar` (no `Component` suffix), selector `app-foo-bar`.
- `standalone: true`, `templateUrl` + `styleUrl`, explicit `imports: [...]`.
- State via `signal()` (`loading` / `error` signals), derived values via `get` getters.
- DI via **constructor injection** `constructor(private readonly authService: Auth, ...)` (only the guard uses `inject()`).
- Inputs/outputs via `@Input()` / `@Output() EventEmitter` decorators.
- Templates use control flow `@if / @else if / @else / @for`.
- If the view doesn't update after async loading, call `ChangeDetectorRef.detectChanges()` (existing pages do this).

**Standard page loading pattern** (see `pages/host-dashboard/host-dashboard.ts`)
```ts
async ngOnInit() {
  this.loading.set(true); this.error.set('');
  try {
    const user = await this.authService.waitForAuthState();
    if (!user) { this.error.set('Utilisateur non connecté.'); return; }
    // ... service calls (independent calls via Promise.all)
  } catch (err) {
    console.error('Erreur ... :', err);
    this.error.set('Impossible de charger ...');
  } finally { this.loading.set(false); }
}
```
Template: `@if (loading()) { <div class="state-box">Chargement...</div> } @else if (error()) { <div class="state-box state-box-error">{{ error() }}</div> } @else { ... }`

**Services (`core/`)**
- `@Injectable({ providedIn: 'root' })`, class named after the domain (`Listing`, `Booking`, `Profile`).
- Use Firebase modular functions directly (`doc`, `getDoc`, `query`, `where`...); import `firestore` from `core/firebase/firebase.ts`.
- When mapping a document to an interface, default/type-guard every field (`data['x'] ?? ''`, `typeof ... === 'number' ? ... : 0`).
- Writes use `serverTimestamp()`, and `setDoc(..., { merge: true })` where relevant.
- Dates stored as `'YYYY-MM-DD'` strings, displayed with `Intl.DateTimeFormat('fr-FR', ...)`.

**Styling**
- Mostly **plain CSS in component CSS files** (Tailwind utility classes are barely used in templates). Spartan UI only loads its preset CSS; no `hlm` components are used yet.
- Keep the `/* ===== SECTION ===== */` comment style. Semantic kebab-case class names (`.stat-card`, `.new-listing-btn`).
- **Colors: use the semantic tokens from `src/styles.css`** (`var(--bl-…)`), not hex. Prefix `bl-` because `--color-*` belongs to Tailwind/Spartan.

  | Token | Hex | Use |
  | --- | --- | --- |
  | `--bl-primary` | `#7034F4` | accent: links ("Retour à la liste"), buttons, star, "Profil vérifié", payment notice text |
  | `--bl-primary-hover` | `#6026DC` | primary button hover |
  | `--bl-heading` | `#19154F` | page titles, "Proposé par …", amenity icons, photo counter |
  | `--bl-secondary` | `#16229C` | secondary actions ("Mettre en pause", "Supprimer"), text of info notices ("Le loyer est réglé directement…") |
  | `--bl-text` | `#111110` | all black text (price, section titles, body) — the project's black |
  | `--bl-text-muted` | `#70768F` | secondary text (city, details line, Arrivée/Départ, minimum stay, small notes) |
  | `--bl-bg-accent` | `#ECE8FE` | light purple backgrounds (badges, notices, icon tiles, hovers) |
  | `--bl-icon-placeholder` | `#A174F5` | empty-image placeholder icon (listing without photo) |
  | `--bl-bg-footer` | `#E7E8FD` | bottom block background (contact section) |
  | `--bl-white` | `#FFFFFD` | white text on purple (selected role in Je viens / J'accueille) |

  **Always use a token** when the color is in this palette (CSS `var(--bl-…)`, Tailwind arbitrary classes `text-[var(--bl-primary)]`). If a needed color has no token, propose adding one to `src/styles.css` + this table instead of hardcoding it.
  Off-palette hex still in the code (`#171925`, `#17194f`, `#eee9ff`, `#777c92`, `#5f24df`, greys/borders…) is left as is on purpose: the team reviews all colors in a **pre-release color check**. Don't silently remap them to a "close" token; leave them or ask.
- **Font: Montserrat** (Google Fonts in `src/index.html`, first in `--font-sans`). Use `font-family: inherit` on buttons/inputs.
- **Font sizes: use tokens** `var(--bl-fs-…)`:

  | Token | Size | Use |
  | --- | --- | --- |
  | `--bl-fs-title` | 27px | page title |
  | `--bl-fs-section` | 22px | section titles ("Présentation", "Ce que le logement propose") |
  | `--bl-fs-subtitle` | 21px | subtitle ("Proposé par …") |
  | `--bl-fs-price` | 30px | price |
  | `--bl-fs-price-unit` | 15px | "/ mois" |
  | `--bl-fs-body` | 14px | body text, buttons |
  | `--bl-fs-small` | 12px | small text, labels, notes, badges |

  Same sizes on mobile and desktop.
- Buttons: height `48px`, radius `7px`
- Responsive: `@media (max-width: 900px)` is most common (also 760/600px). Desktop layout + max-width breakpoints, but **always check the mobile view**.
- Minimum layout width **360px**: on narrower phones a script in `src/index.html` sets the viewport to `width=360` so the browser scales the whole page down. Design/test down to 360px only.
- Account screen layout: `<app-user-navbar />` + `.account-layout` (grid `270px | 1fr`) containing the sidebar + `.account-content`, then `<app-contact-section />` `<app-footer />` at the bottom.
- Global Leaflet marker/popup styles live in `src/styles.css` (`.baillYon-map-marker`).

**Dev-only code** — mark anything temporary (mock data, debug helpers) with `TODO(dev) À SUPPRIMER` comments so it can be found with `grep -rn "TODO(dev)"` and removed before release. Mock data seeding: `core/dev/seed-host-data.ts`, exposed as `await seedHostData()` in the browser console in dev mode only. Address migration for existing listings: `await migrateListingAddress()` (`core/dev/migrate-listing-address.ts`).

**Large forms** — shared field styles can live in a global stylesheet imported from `src/styles.css` (e.g. `pages/host-listing-form/listing-form-fields.css`, `lf-` classes) to keep each component under the CSS budget. Reorder lists with `@angular/cdk/drag-drop` (already installed).

**Security rules** — update alongside any new collection/field/write:
- Exact listing address is private: `listings/{id}/private/address` (owner only); the public doc only has `arrondissement` + approximate lat/lng. See `docs/depot-annonce.md`.
- Firestore: `firestore.rules` (currently all `listings` writes are `false` → host listing creation needs owner-based rules)
- Realtime DB: `database.rules.json`

## Workflow: Figma screenshot → feature

The user usually provides Figma screenshots and expects both the UI and the working feature.

1. **Analyze the screenshot**: layout (navbar/sidebar/content sections), text (copy the French as-is), map colors/spacing/radius to the palette above. If exact px values are unclear, reuse values from the most similar existing page.
2. **Reuse first**: identify which navbar/sidebar applies and open the closest existing page to follow its structure and CSS (host screens → `host-dashboard`; guest account → `renter-account` / `saved-listings`; list + map → `rental-search-results`; detail → `property-details`; chat → `messages`).
3. **Check the data**: confirm the needed data exists in `core/` services and `specs/openapi.yaml` schemas. If missing, add a method to the existing service (new service only for a new domain). Keep field names consistent with existing collections.
4. **Propose a short plan**, then implement (agents.md rule). New page = `pages/<name>/` (3 files) + register in `app.routes.ts` (`canActivate: [authGuard]` if login required; host screens under `host/...`). Update sidebar navigation (e.g. the `HostSection` type) if needed.
5. **Don't add features that aren't in the screenshot.** If a button's behavior is unclear, ask or just wire the link.
6. **Verify**: `npm run build` passes (check budget warnings); if possible check desktop + mobile widths on the dev server; confirm security rules are updated; propose Playwright tests (`tests/*.spec.cjs`, CommonJS, assert French text with `getByText`).

## Git

- Never work directly on `main`; use `feat/<feature>` branches. Conventional commits (`feat: ...` / `fix: ...`).
- Document significant changes in `docs/` (agents.md rule).
