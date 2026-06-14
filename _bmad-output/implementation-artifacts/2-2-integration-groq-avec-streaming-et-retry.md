---
baseline_commit: fc1b3fa1f7a313eb53c55417dfc9015a36da8784
---

# Story 2.2: Intégration Groq avec streaming et retry

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a utilisateur,
I want que le coach me réponde en streaming, en tenant compte de mon profil, même en cas de limite de débit temporaire de l'API Groq,
so that j'obtiens des réponses rapides et personnalisées (NFR1) avec une expérience résiliente face aux erreurs transitoires (NFR2).

## Acceptance Criteria

1. **Given** `server/src/lib/systemPrompt.ts` exportant `buildSystemPrompt(profile)`
   **When** un payload `/api/chat` valide contenant un `profile` est reçu
   **Then** le system prompt généré inclut le nom, l'âge, le genre, le poids, l'objectif, le niveau d'activité et les restrictions alimentaires du profil (valeurs par défaut "unknown"/"none" si absentes), conformément au template du brief technique

2. **Given** `server/src/lib/groqClient.ts` encapsulant l'appel à l'API Groq (`llama-3.3-70b-versatile`, `stream: true`)
   **When** `POST /api/chat` est appelé avec un payload valide
   **Then** la réponse a `Content-Type: text/event-stream`
   **And** chaque chunk reçu de Groq est renvoyé au format `data: {"delta": "..."}\n\n`
   **And** le flux se termine par `data: [DONE]\n\n`

3. **Given** l'appel à Groq retourne une erreur transitoire (429 ou 5xx)
   **When** `groqClient` traite cette erreur
   **Then** jusqu'à 3 tentatives sont effectuées avec un backoff exponentiel (~500ms / 1s / 2s)

4. **Given** les 3 tentatives de retry échouent
   **When** le flux SSE est en cours
   **Then** un message `data: {"error": {"message": "...", "code": "GROQ_UNAVAILABLE"}}\n\n` est envoyé, suivi de `data: [DONE]\n\n`

5. **Given** la clé API Groq configurée via `server/.env` (`GROQ_API_KEY`)
   **When** le serveur traite une requête `/api/chat`
   **Then** la clé n'est jamais exposée dans la réponse au client ni dans les logs

## Tasks / Subtasks

- [x] Task 1 — `buildSystemPrompt(profile)` (AC: #1)
  - [x] Créer `server/src/lib/systemPrompt.ts` exportant `buildSystemPrompt(profile: Profile): string`
  - [x] Reprendre le "System prompt base" du PRD (§5) :
    ```
    You are Flex, a personal AI coach specializing in sport, nutrition, and quality of life.
    You are warm, motivating, and evidence-based. You never shame the user.
    You adapt your tone to the user's mood. You respond in the same language the user writes in.
    You always take the user's profile into account when giving advice.
    User profile: {profile}
    ```
  - [x] Remplacer `{profile}` par un résumé structuré du profil : `name`, `age`, `gender`, `weight`, `goal`, `activityLevel`, `dietaryRestrictions`
  - [x] Pour chaque champ optionnel absent/`undefined`, utiliser une valeur par défaut explicite : `"unknown"` pour `name`/`age`/`gender`/`weight`/`goal`/`activityLevel`, `"none"` pour `dietaryRestrictions` vide ou absent (rendu comme `"none"` si tableau vide ou `undefined`, sinon liste jointe par virgules)
  - [x] Co-localiser `server/src/lib/systemPrompt.test.ts` : vérifier la présence de chaque champ du profil dans le prompt généré, et les valeurs par défaut quand le profil est `{}`

- [x] Task 2 — `groqClient.ts` : appel Groq streaming + retry (AC: #2, #3, #5)
  - [x] Installer `groq-sdk` (`^1.2.1`, voir Latest Tech Information) en dependency de `server/`
  - [x] Créer `server/src/lib/groqClient.ts` exportant une fonction, par exemple `streamChatCompletion({ systemPrompt, messages }): AsyncIterable<string>` (ou signature équivalente acceptant un callback `onDelta`), qui :
    - Instancie `new Groq({ apiKey: process.env.GROQ_API_KEY })`
    - Appelle `groq.chat.completions.create({ model: 'llama-3.3-70b-versatile', stream: true, messages: [{ role: 'system', content: systemPrompt }, ...messages] })`
    - Itère sur les chunks du stream et expose le `delta.content` de chacun
  - [x] Implémenter la logique de retry : si l'appel initial (avant le premier chunk reçu) échoue avec un statut 429 ou 5xx (ou erreur réseau), retenter jusqu'à 3 tentatives au total avec un backoff exponentiel ~500ms / 1s / 2s entre chaque tentative
  - [x] Si les 3 tentatives échouent, la fonction doit signaler l'échec final de manière exploitable par `routes/chat.ts` (ex. lever une erreur typée avec `.code = 'GROQ_UNAVAILABLE'`, ou retourner un résultat discriminé `{ ok: false, code: 'GROQ_UNAVAILABLE' }`) — le choix exact doit permettre à la route de distinguer "échec avant tout chunk envoyé" vs "erreur en cours de stream" (voir Task 3 et Dev Notes)
  - [x] `GROQ_API_KEY` n'est lu que via `process.env` dans `groqClient.ts` ; ne jamais l'inclure dans un message d'erreur, un log, ou une valeur retournée
  - [x] Co-localiser `server/src/lib/groqClient.test.ts` : mocker le client Groq (`vi.mock('groq-sdk', ...)` ou injection) pour tester :
    - cas succès (stream de chunks → deltas exposés dans l'ordre)
    - cas retry : 2 échecs 429 puis succès → 3 appels au total, deltas reçus
    - cas échec total : 3 échecs 5xx → erreur/résultat `GROQ_UNAVAILABLE` retourné, sans appel supplémentaire

- [x] Task 3 — Route `/api/chat` en SSE (AC: #2, #4, #5)
  - [x] Modifier `server/src/routes/chat.ts` :
    - Après validation réussie de `ChatRequestSchema.parse(req.body)`, construire `systemPrompt = buildSystemPrompt(profile)` via `buildSystemPrompt` (Task 1)
    - Définir les en-têtes SSE avant d'écrire : `res.setHeader('Content-Type', 'text/event-stream')`, `res.setHeader('Cache-Control', 'no-cache')`, `res.setHeader('Connection', 'keep-alive')`, puis `res.flushHeaders()` si nécessaire
    - Appeler `groqClient` (Task 2) avec `systemPrompt` et `messages`
    - Pour chaque delta reçu : écrire `res.write(\`data: ${JSON.stringify({ delta })}\n\n\`)`
    - À la fin du stream (succès) : écrire `res.write('data: [DONE]\n\n')` puis `res.end()`
  - [x] Gestion des erreurs Groq :
    - Si l'erreur Groq survient **avant** l'envoi de tout chunk (échec dès la connexion initiale après les 3 retries) : écrire directement `data: {"error": {"message": "...", "code": "GROQ_UNAVAILABLE"}}\n\n` suivi de `data: [DONE]\n\n`, puis `res.end()` — pas de `next(err)` car les headers SSE sont déjà envoyés
    - Si l'erreur Groq survient **en cours de stream** (après que des chunks aient déjà été écrits) : même comportement — écrire le message d'erreur SSE puis `[DONE]` et fermer la connexion (pas de retry possible une fois le flux commencé)
  - [x] Les erreurs de validation Zod (payload invalide, AC déjà couvertes par Story 2.1) restent gérées par `next(err)` → `errorHandler`, **avant** que les en-têtes SSE ne soient envoyés (la validation `ChatRequestSchema.parse()` doit avoir lieu en tout premier, avant tout `res.setHeader`)
  - [x] Ne jamais inclure `GROQ_API_KEY` ou tout message d'erreur brut de la lib Groq pouvant contenir des détails sensibles dans la réponse SSE — utiliser un message générique traduisible côté client (ex. `"The coach is temporarily unavailable. Please try again."`) avec le code `GROQ_UNAVAILABLE`

- [x] Task 4 — Configuration environnement (AC: #5)
  - [x] Vérifier que `server/.env` (gitignored) contient `GROQ_API_KEY=<clé réelle>` en local — `.env.example` à la racine contient déjà `GROQ_API_KEY=`
  - [x] S'assurer que `groqClient.ts` lève une erreur explicite (gérée comme `GROQ_UNAVAILABLE` côté route, sans exposer le détail) si `process.env.GROQ_API_KEY` est absent — ne pas planter le process au démarrage

- [x] Task 5 — Tests Vitest mis à jour pour le contrat SSE (AC: #1 à #5)
  - [x] Mettre à jour `server/src/routes/chat.test.ts` : le test existant `'returns 200 with placeholder...'` ne correspond plus au comportement (la route ne renvoie plus `{ ok: true }`) — adapter pour vérifier :
    - `Content-Type: text/event-stream` sur réponse valide
    - Le corps de la réponse contient des chunks `data: {"delta": ...}` et se termine par `data: [DONE]`
    - Aucune fuite de `GROQ_API_KEY`/`gsk_` dans la réponse
  - [x] Ajouter un test pour le cas `GROQ_UNAVAILABLE` (mock `groqClient` configuré pour échouer 3 fois) : vérifier la présence de `data: {"error": {"code":"GROQ_UNAVAILABLE"...}}` suivi de `data: [DONE]`
  - [x] Conserver les tests existants (400 `VALIDATION_ERROR`, headers helmet, 429 `RATE_LIMITED`) — la validation et le rate-limit restent inchangés (Story 2.1)
  - [x] Pour les tests, mocker `groqClient`/`groq-sdk` afin de ne jamais appeler l'API Groq réelle pendant `npm test`

## Dev Notes

- **Contexte issu de la Story 2.1 (déjà fait, ne pas refaire) :** `ChatRequestSchema`, `errorHandler`, middlewares de sécurité (`helmet`, `cors`, `chatRateLimiter`), route `POST /api/chat` (actuellement placeholder `res.json({ ok: true })`). Cette story 2.2 **remplace le placeholder** par le vrai flux SSE + appel Groq. Le `ChatRequestSchema` (`messages: {role, content}[]` + `profile`) et `ProfileSchema` serveur (`server/src/schemas/profile.schema.ts`) existent déjà et sont synchronisés avec le client — ne pas les modifier.
- **Format SSE strict** (architecture §Format Patterns) : `data: {"delta": "..."}\n\n` par chunk, `data: [DONE]\n\n` en fin de flux normal, `data: {"error": {"message": "...", "code": "..."}}\n\n` suivi de `[DONE]` en cas d'erreur en cours de flux. Respecter exactement ces formats (les futurs `useChat` côté client, Story 2.3, parseront ce format).
- **Ordre de validation critique** : `ChatRequestSchema.parse(req.body)` doit s'exécuter **avant** `res.setHeader`/écriture SSE. Une fois les en-têtes SSE envoyés, on ne peut plus répondre avec un statut HTTP d'erreur classique (400/500) — toute erreur après ce point doit être véhiculée via le message `data: {"error": {...}}` dans le flux, jamais via `next(err)`.
- **Retry exponentiel** : 3 tentatives max, backoff ~500ms/1s/2s, uniquement sur erreurs 429/5xx ou erreurs réseau côté `groqClient.ts`. Le retry est invisible pour la route : `groqClient` retente en interne avant que le premier chunk ne soit écrit. Une fois qu'un chunk a été écrit vers le client, il n'y a plus de retry possible (le flux SSE est déjà ouvert) — toute erreur ultérieure devient directement `data: {"error": {"code":"GROQ_UNAVAILABLE"...}}` + `[DONE]`.
- **`buildSystemPrompt(profile)`** : utiliser le "System prompt base" du PRD §5 (Coach Persona "Flex"), avec un résumé du profil intégré à la place de `{profile}`. Valeurs par défaut explicites pour champs manquants : `"unknown"` (name/age/gender/weight/goal/activityLevel), `"none"` (dietaryRestrictions). Le system prompt est le premier message (`role: 'system'`) envoyé à Groq, suivi de l'historique `messages` du payload.
- **`groq-sdk`** : nouvelle dépendance, jamais utilisée dans le projet jusqu'ici (vérifié — absent de `package-lock.json`). Voir Latest Tech Information pour la version et l'API.
- **Sécurité clé API** (NFR/AC#5) : `GROQ_API_KEY` lu uniquement via `process.env` dans `groqClient.ts`. Aucun message d'erreur de la lib Groq (qui peut parfois inclure des détails de requête) ne doit être renvoyé tel quel au client — toujours un message générique + code `GROQ_UNAVAILABLE`.
- **Naming conventions** (architecture, section "Naming Patterns") : camelCase partout, schémas Zod en PascalCase suffixé `Schema`, pas de préfixe de version d'API.
- **Tests co-localisés** : `*.test.ts` à côté du fichier testé, Vitest. Mocker `groq-sdk`/`groqClient` dans les tests — jamais d'appel réseau réel.

### Project Structure Notes

Fichiers à créer (conformes à l'arborescence définie dans l'architecture, section "Complete Project Directory Structure") :
- `server/src/lib/systemPrompt.ts` (NEW)
- `server/src/lib/systemPrompt.test.ts` (NEW)
- `server/src/lib/groqClient.ts` (NEW)
- `server/src/lib/groqClient.test.ts` (NEW)

Fichiers à modifier :
- `server/src/routes/chat.ts` (UPDATE) — état actuel (Story 2.1) : valide via `ChatRequestSchema.parse()` puis répond `res.json({ ok: true })` (placeholder). Cette story remplace ce placeholder par la construction du system prompt + appel `groqClient` + écriture SSE, en conservant la validation Zod en tout premier (avant tout `res.setHeader`).
- `server/src/routes/chat.test.ts` (UPDATE) — le test `'returns 200 with placeholder...'` doit être adapté au nouveau contrat SSE ; les tests de validation/helmet/rate-limit existants restent valides et ne doivent pas être cassés.
- `server/package.json` (UPDATE) — ajout de `groq-sdk` en dependency.
- `package-lock.json` (UPDATE) — installation de `groq-sdk`.

Aucun conflit avec la structure définie. `server/src/lib/` n'existe pas encore et doit être créé.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.2: Intégration Groq avec streaming et retry] — AC sources
- [Source: docs/PRD-coach-ia.md#5. Coach Persona] — system prompt base "Flex", à utiliser tel quel dans `buildSystemPrompt`
- [Source: _bmad-output/planning-artifacts/architecture.md#Format Patterns] — format SSE (`data: {"delta": "..."}`, `[DONE]`, `data: {"error": {...}}`)
- [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns] — retry exponentiel Groq dans `groqClient.ts` (3 tentatives, ~500ms/1s/2s), transparent pour la route
- [Source: _bmad-output/planning-artifacts/architecture.md#Service Boundaries] — `groqClient.ts` seul point d'appel Groq, `systemPrompt.ts` seul endroit de transformation profil → prompt
- [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure] — emplacements `server/src/lib/groqClient.ts`, `server/src/lib/systemPrompt.ts`
- [Source: _bmad-output/implementation-artifacts/2-1-fondations-backend-de-lapi-chat.md] — état actuel de `routes/chat.ts`, `ChatRequestSchema`, `errorHandler`, `server.ts` (baseline pour cette story)
- [Source: server/src/schemas/profile.schema.ts] — structure `ProfileSchema` serveur (champs disponibles pour `buildSystemPrompt`)

## Git Intelligence Summary

Commit le plus récent (`fc1b3fa`, Story 1.3) ne touche que le client. La Story 2.1 (review, non encore committée séparément) a posé toute l'infrastructure backend de `/api/chat` : schémas Zod co-localisés avec tests (`*.test.ts`), middlewares dans `server/src/middleware/`, route placeholder dans `server/src/routes/chat.ts`, `server.ts` désactive `app.listen` en `NODE_ENV=test` pour permettre `supertest`. Cette story 2.2 doit suivre exactement les mêmes conventions (tests co-localisés Vitest/supertest, camelCase, pas de log de secrets) et créer le nouveau dossier `server/src/lib/`.

## Latest Tech Information

- **groq-sdk** : version `^1.2.1` (dernière stable, vérifiée via `npm view groq-sdk version`). Usage typique :
  ```ts
  import Groq from 'groq-sdk';
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const stream = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [...],
    stream: true,
  });
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content ?? '';
  }
  ```
- **Modèle** : `llama-3.3-70b-versatile` (fixé par l'architecture, ne pas changer).
- **express** : `^4.21.0` — SSE avec `res.write()`/`res.end()` fonctionne nativement, pas de lib supplémentaire nécessaire.

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6 (bmad-dev-story)

### Debug Log References

- `npx vitest run` (server) : 21 tests passés sur 5 fichiers
- `npx tsc --noEmit` (server) : erreur pré-existante `TS5103` sur `ignoreDeprecations` dans `tsconfig.json`, indépendante de cette story (vérifié via `git stash`)

### Completion Notes List

- `buildSystemPrompt(profile)` créé dans `server/src/lib/systemPrompt.ts`, reprenant le system prompt "Flex" du PRD avec résumé du profil et valeurs par défaut `"unknown"`/`"none"`.
- `groqClient.ts` ajouté : `streamChatCompletion({ systemPrompt, messages }, onDelta)` instancie `Groq`, lit `GROQ_API_KEY` via `process.env`, retente jusqu'à 3 fois (backoff 500ms/1s/2s) sur erreurs 429/5xx/réseau avant le premier delta, et retourne `{ ok: false, code: 'GROQ_UNAVAILABLE' }` sans retry une fois qu'un delta a été émis ou si la clé API est absente.
- `routes/chat.ts` remplace le placeholder par le flux SSE complet : validation Zod en premier (avant tout header), puis headers SSE, puis écriture de `data: {"delta": ...}` par chunk, message d'erreur générique `GROQ_UNAVAILABLE` si échec, terminé par `data: [DONE]`.
- `groq-sdk@^1.2.1` ajouté en dépendance de `server/`.
- `server/.env` créé localement (gitignored) à partir de `.env.example` (clé Groq vide par défaut).
- Tests : `systemPrompt.test.ts` (4 tests), `groqClient.test.ts` (4 tests, mock `groq-sdk`), `chat.test.ts` réécrit (5 tests, mock `groqClient`) — aucun appel réseau réel.

### Change Log

- 2026-06-14 : Implémentation complète de la Story 2.2 (system prompt, client Groq streaming + retry, route SSE, tests).

### File List

- `server/src/lib/systemPrompt.ts` (NEW)
- `server/src/lib/systemPrompt.test.ts` (NEW)
- `server/src/lib/groqClient.ts` (NEW)
- `server/src/lib/groqClient.test.ts` (NEW)
- `server/src/routes/chat.ts` (UPDATE)
- `server/src/routes/chat.test.ts` (UPDATE)
- `server/package.json` (UPDATE)
- `package-lock.json` (UPDATE)
- `server/.env` (NEW, gitignored)
