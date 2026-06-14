---
baseline_commit: fc1b3fa1f7a313eb53c55417dfc9015a36da8784
---

# Story 2.1: Fondations backend de l'API chat

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a développeur,
I want une route `POST /api/chat` validée par Zod, protégée par des middlewares de sécurité (helmet, cors, rate-limit), et un gestionnaire d'erreurs centralisé,
so that l'infrastructure backend est sûre et cohérente avant d'y brancher l'appel réel à Groq (Story 2.2).

## Acceptance Criteria

1. **Given** `server/src/schemas/chat.schema.ts` définissant `ChatRequestSchema` (champs `messages: {role, content}[]` et `profile`)
   **When** une requête `POST /api/chat` est reçue
   **Then** le payload est validé via `ChatRequestSchema.parse()` avant tout traitement

2. **Given** un payload invalide (ex. `messages` manquant ou mal typé)
   **When** `POST /api/chat` est appelé
   **Then** la réponse a le statut 400 et le corps `{ "error": { "message": "...", "code": "VALIDATION_ERROR" } }`

3. **Given** le serveur Express démarré
   **When** n'importe quelle route est appelée
   **Then** les en-têtes de sécurité `helmet` sont présents dans la réponse, `cors` est configuré pour l'origine du client, et `express-rate-limit` est actif sur `/api/chat` (ex. 20 req/15min par IP)

4. **Given** un nombre de requêtes dépassant la limite configurée sur `/api/chat`
   **When** une requête supplémentaire est envoyée depuis la même IP
   **Then** la réponse a le statut 429 avec le format d'erreur `{ "error": { "message": "...", "code": "RATE_LIMITED" } }`

5. **Given** une erreur levée dans n'importe quelle route (ex. via `next(err)`)
   **When** la requête est traitée
   **Then** le middleware `errorHandler` centralisé intercepte l'erreur et répond avec `{ error: { message, code } }` et le code HTTP approprié (400/429/500)

## Tasks / Subtasks

- [x] Task 1 — Schéma de validation `ChatRequestSchema` (AC: #1, #2)
  - [x] Créer `server/src/schemas/chat.schema.ts` avec Zod v4 :
    - `ChatRequestSchema = z.object({ messages: z.array(z.object({ role: z.enum(['user','assistant','system']), content: z.string() })), profile: ProfileSchema })`
    - Copier/synchroniser `ProfileSchema` dans `server/src/schemas/profile.schema.ts` (mêmes champs que `client/src/schemas/profile.schema.ts`, tous optionnels — voir Dev Notes)
    - Exporter le type inféré `ChatRequest = z.infer<typeof ChatRequestSchema>`
  - [x] Vérifier que `messages` accepte un tableau vide (pas de minimum requis pour ce niveau de fondation)

- [x] Task 2 — Middleware de sécurité (AC: #3, #4)
  - [x] Installer les dépendances dans `server/` : `helmet`, `cors`, `express-rate-limit` (versions v8 récentes — voir Latest Tech Information)
  - [x] Créer `server/src/middleware/security.ts` exportant :
    - `securityHeaders` = configuration `helmet()`
    - `corsMiddleware` = `cors({ origin: process.env.CLIENT_URL })` (lire `CLIENT_URL` depuis `.env`, déjà présent dans `.env.example`)
    - `chatRateLimiter` = `rateLimit({ windowMs: 15 * 60 * 1000, max: 20, ... })` configuré pour répondre au format d'erreur du projet (voir AC #4) via un `handler` personnalisé qui appelle `next()` avec une erreur `RATE_LIMITED` (ou répond directement avec le format `{ error: { message, code } }` et status 429)
  - [x] Appliquer `securityHeaders` et `corsMiddleware` globalement dans `server.ts`
  - [x] Appliquer `chatRateLimiter` uniquement sur la route `/api/chat`

- [x] Task 3 — Gestionnaire d'erreurs centralisé (AC: #2, #5)
  - [x] Créer `server/src/middleware/errorHandler.ts` exportant un middleware Express à 4 arguments `(err, req, res, next)` :
    - Si `err` est une `ZodError` → status 400, `{ error: { message: <message lisible>, code: 'VALIDATION_ERROR' } }`
    - Si `err` porte un code/status déjà défini (ex. erreur custom avec `.code` et `.status`) → réutiliser ces valeurs (ex. `RATE_LIMITED` → 429)
    - Sinon → status 500, `{ error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } }`
    - `console.error(err)` pour logging MVP (pas de log de la clé API ou de données sensibles)
  - [x] Enregistrer `errorHandler` en DERNIER middleware dans `server.ts` (après toutes les routes)

- [x] Task 4 — Route `POST /api/chat` (AC: #1, #2, #5)
  - [x] Créer `server/src/routes/chat.ts` exportant un `express.Router()` avec `router.post('/', handler)`
  - [x] Dans le handler : valider `req.body` via `ChatRequestSchema.parse()`. En cas d'échec, l'exception `ZodError` doit être passée à `next(err)` (try/catch ou wrapper) pour être traitée par `errorHandler`
  - [x] Pour cette story (fondations uniquement, pas d'appel Groq) : si la validation réussit, répondre temporairement avec un placeholder simple (ex. `res.json({ ok: true })`) — l'intégration Groq/SSE réelle est hors scope (Story 2.2)
  - [x] Monter le router dans `server.ts` sous `/api/chat`

- [x] Task 5 — Câblage `server.ts` (AC: #3)
  - [x] Ordre des middlewares dans `server.ts` : `helmet` → `cors` → `express.json()` → routes (`/api/chat` avec `chatRateLimiter`) → `errorHandler` (dernier)
  - [x] Conserver la route `/health` existante

- [x] Task 6 — Tests Vitest (AC: #1 à #5)
  - [x] `server/src/schemas/chat.schema.test.ts` : validation de payloads valides/invalides
  - [x] `server/src/middleware/errorHandler.test.ts` : vérifier le format de réponse pour ZodError, erreur custom, erreur générique
  - [x] `server/src/routes/chat.test.ts` (via `supertest` ou appel direct de l'app Express) :
    - POST valide → 200 (placeholder), pas de fuite de `GROQ_API_KEY`
    - POST invalide (`messages` manquant) → 400 `VALIDATION_ERROR`
    - Vérifier présence des headers `helmet` (ex. `x-content-type-options`)
    - Dépassement du rate limit → 429 `RATE_LIMITED` (peut nécessiter d'appeler la route 21 fois dans le test, ou de configurer une limite basse injectable pour le test)
  - [x] Installer `supertest` + `@types/supertest` en devDependency de `server/` si utilisé

## Dev Notes

- **Aucun appel à Groq dans cette story.** `groqClient.ts` et `systemPrompt.ts` sont Story 2.2. La route `/api/chat` répond avec un placeholder après validation réussie — l'objectif est uniquement la sécurité, la validation et la gestion d'erreurs.
- **Format d'erreur global** (non-SSE) : `{ "error": { "message": string, "code": string } }`, codes HTTP 400/429/500. C'est la SEULE forme de réponse d'erreur pour cette story (le format SSE `data: {"error": {...}}` n'apparaît qu'en Story 2.2).
- **`ChatRequestSchema`** : `messages: {role, content}[]` + `profile`. Le `ProfileSchema` côté serveur doit être une copie synchronisée de `client/src/schemas/profile.schema.ts` (actuel — tous champs optionnels sauf validations sémantiques type `.positive()` pour `age`/`weight`) :
  ```ts
  export const ProfileSchema = z.object({
    name: z.string().optional(),
    age: z.number().positive().optional(),
    gender: z.string().optional(),
    weight: z.number().positive().optional(),
    goal: z.string().optional(),
    activityLevel: z.string().optional(),
    dietaryRestrictions: z.array(z.string()).optional(),
    language: z.string().optional(),
    onboardingSkipped: z.boolean().optional(),
  });
  ```
  [Source: client/src/schemas/profile.schema.ts]
- **Clé API Groq** : `server/.env` (`GROQ_API_KEY`) — n'est pas utilisée dans cette story mais doit rester absente de tout log/réponse. `.env.example` existe déjà à la racine avec `GROQ_API_KEY=`, `PORT=3001`, `CLIENT_URL=http://localhost:5173`.
- **CORS** : utiliser `CLIENT_URL` depuis `.env` comme origine autorisée (déjà défini dans `.env.example`, mais `server/.env` réel doit être créé localement par le développeur — gitignored).
- **Naming conventions** (architecture, section "Naming Patterns") :
  - camelCase pour tous les champs JSON/TS (`dietaryRestrictions`, `activityLevel`)
  - Schémas Zod en PascalCase suffixé `Schema` (`ChatRequestSchema`, `ProfileSchema`), types inférés sans suffixe (`ChatRequest`, `Profile`)
  - Pas de préfixe de version d'API (`/api/chat`, pas `/api/v1/chat`)
- **Tests co-localisés** : `*.test.ts` à côté du fichier testé (pas de dossier `__tests__`), Vitest (déjà en devDependency de `server/package.json`).

### Project Structure Notes

Fichiers à créer (conformes à l'arborescence définie dans l'architecture, section "Complete Project Directory Structure") :
- `server/src/schemas/chat.schema.ts` (NEW)
- `server/src/schemas/profile.schema.ts` (NEW — copie synchronisée du schéma client)
- `server/src/middleware/security.ts` (NEW)
- `server/src/middleware/errorHandler.ts` (NEW)
- `server/src/routes/chat.ts` (NEW)

Fichier à modifier :
- `server/src/server.ts` (UPDATE) — état actuel : app Express minimale avec `express.json()` et route `/health` uniquement (pas de middlewares de sécurité, pas de routes API, pas d'errorHandler). Cette story ajoute le câblage complet sans casser `/health`.

Pas de conflit avec la structure définie. Aucune variance détectée.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.1: Fondations backend de l'API chat] — AC sources
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security] — helmet v8, cors, express-rate-limit (20 req/15min sur `/api/chat`), clé Groq jamais exposée
- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns] — format d'erreur `{ error: { message, code } }`, codes 400/429/500
- [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns] — toutes les routes passent par `next(err)` vers `errorHandler` centralisé
- [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure] — emplacements de fichiers (`server/src/routes/chat.ts`, `server/src/middleware/`, `server/src/schemas/`)
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] — `ChatRequestSchema` (messages + profile), types inférés via `z.infer`
- [Source: client/src/schemas/profile.schema.ts] — structure actuelle de `ProfileSchema` à synchroniser côté serveur

## Git Intelligence Summary

Commits récents (Epic 1, Stories 1.2/1.3) : focus client uniquement (`LocalStorageRepository`, `DisclaimerModal`, schémas Zod, tests co-localisés `*.test.ts`/`*.test.tsx`). Aucun pattern backend établi encore — cette story est la première à toucher `server/src/`. Le pattern de tests co-localisés et l'usage de Zod v4 avec types inférés observés côté client doivent être répliqués côté serveur.

## Latest Tech Information

- **helmet** : v8.x (compatible Express 4/5, `app.use(helmet())` activé par défaut avec les en-têtes de sécurité standards — `Content-Security-Policy`, `X-Content-Type-Options`, etc.)
- **cors** : v2.x, `app.use(cors({ origin: process.env.CLIENT_URL }))`
- **express-rate-limit** : v8.x — API : `rateLimit({ windowMs, max, standardHeaders: true, legacyHeaders: false, handler: (req, res, next) => next(rateLimitError) })`. Le `handler` permet de déléguer le formatage de la réponse 429 à `errorHandler` pour respecter le format `{ error: { message, code } }`.
- **express** actuel dans `server/package.json` : `^4.21.0` — toutes ces libs sont compatibles Express 4.

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6 (claude-sonnet-4-6)

### Debug Log References

- `npx vitest run` (server/) : 3 fichiers de test, 12 tests, tous passants.
- `npx tsc --noEmit` (server/) : échoue avec `TS5103: Invalid value for '--ignoreDeprecations'` — erreur préexistante dans `server/tsconfig.json` (`"ignoreDeprecations": "6.0"` incompatible avec TypeScript 5.9.3 installé), non liée à cette story, fichier non modifié.

### Completion Notes List

- `ChatRequestSchema` et `ProfileSchema` créés dans `server/src/schemas/`, synchronisés avec le schéma client.
- Middlewares `helmet`, `cors`, `express-rate-limit` (20 req/15min sur `/api/chat`) créés dans `server/src/middleware/security.ts`, avec un `handler` de rate-limit qui délègue le format d'erreur 429 (`RATE_LIMITED`) à `errorHandler`.
- `errorHandler` centralisé créé dans `server/src/middleware/errorHandler.ts`, gérant `ZodError` (400/`VALIDATION_ERROR`), erreurs custom avec `.status`/`.code` (ex. 429/`RATE_LIMITED`), et erreurs génériques (500/`INTERNAL_ERROR`). Logge via `console.error` sans exposer de données sensibles.
- Route `POST /api/chat` créée (`server/src/routes/chat.ts`) : valide via `ChatRequestSchema.parse()`, répond `{ ok: true }` (placeholder, intégration Groq en Story 2.2), propage les erreurs de validation via `next(err)`.
- `server/src/server.ts` mis à jour : ordre des middlewares `helmet` → `cors` → `express.json()` → routes (`/health`, `/api/chat` avec `chatRateLimiter`) → `errorHandler`. `app.listen` désactivé en environnement `test` (NODE_ENV=test, défini automatiquement par Vitest) pour permettre les tests `supertest` sans conflit de port.
- Dépendances ajoutées dans `server/` : `helmet`, `cors`, `express-rate-limit` (dependencies) ; `@types/cors`, `supertest`, `@types/supertest` (devDependencies). Script `test` ajouté à `server/package.json`.
- Tests Vitest co-localisés créés et passants : `chat.schema.test.ts` (5 tests), `errorHandler.test.ts` (3 tests), `chat.test.ts` (4 tests via supertest, incluant la vérification du 429/`RATE_LIMITED` au-delà de la limite et l'absence de fuite de `GROQ_API_KEY`/clé Groq dans la réponse).

### File List

- `server/src/schemas/profile.schema.ts` (NEW)
- `server/src/schemas/chat.schema.ts` (NEW)
- `server/src/schemas/chat.schema.test.ts` (NEW)
- `server/src/middleware/errorHandler.ts` (NEW)
- `server/src/middleware/errorHandler.test.ts` (NEW)
- `server/src/middleware/security.ts` (NEW)
- `server/src/routes/chat.ts` (NEW)
- `server/src/routes/chat.test.ts` (NEW)
- `server/src/server.ts` (MODIFIED)
- `server/package.json` (MODIFIED)
- `package-lock.json` (MODIFIED — installation des nouvelles dépendances)

## Change Log

- 2026-06-14 : Implémentation complète de la story (Tasks 1-6) — schémas Zod, middlewares de sécurité (helmet/cors/rate-limit), gestionnaire d'erreurs centralisé, route `POST /api/chat` (placeholder), tests Vitest/supertest (12 tests passants).
