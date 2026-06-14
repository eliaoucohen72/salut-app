---
status: ready-for-dev
baseline_commit: fc1b3fa
---

# Story 1.5 : Visualisation & édition du profil

Status: review

## Story

As a utilisateur,
I want consulter et modifier mon profil à tout moment depuis une page dédiée,
so that mes informations restent à jour et continuent d'influencer automatiquement les conseils du coach.

## Acceptance Criteria

1. **[AC1 — Affichage du profil existant]** Given un utilisateur ayant un profil existant, When il accède à `/profile`, Then `ProfileForm` affiche les valeurs actuelles du profil (nom, âge, genre, poids, objectif, niveau d'activité, restrictions alimentaires).

2. **[AC2 — Sauvegarde]** Given la page `/profile` affichée avec des champs modifiés, When l'utilisateur soumet le formulaire, Then les nouvelles valeurs sont validées via `ProfileSchema` et persistées via `StorageRepository.saveProfile()`, And un message de confirmation visuel est affiché.

3. **[AC3 — Mise à jour AppContext]** Given le profil mis à jour, When la sauvegarde réussit, Then `AppContext` est mis à jour avec le nouveau profil, le rendant immédiatement disponible pour toute consommation future (ex. construction du system prompt par Epic 2).

4. **[AC4 — Validation des erreurs]** Given la page `/profile` affichée avec des données invalides (ex. poids négatif), When l'utilisateur soumet le formulaire, Then des messages d'erreur de validation sont affichés, et la sauvegarde n'a pas lieu.

## Tasks / Subtasks

- [x] Task 1 : Étendre `ProfileSchema` pour valider les contraintes sémantiques (AC: #4)
  - [x] 1.1 Dans `client/src/schemas/profile.schema.ts`, ajouter des contraintes de validation sémantique aux champs numériques existants : `age: z.number().positive().optional()`, `weight: z.number().positive().optional()` (un poids/âge négatif ou nul doit échouer `.parse()`)
  - [x] 1.2 Ne PAS modifier la structure des champs existants (`name`, `gender`, `goal`, `activityLevel`, `dietaryRestrictions`, `language`, `onboardingSkipped`) — uniquement ajouter `.positive()` sur `age` et `weight`
  - [x] 1.3 Adapter `client/src/schemas/profile.schema.test.ts` : ajouter des cas de test pour `age`/`weight` négatifs ou nuls → `parse()` lève une `ZodError` ; valeurs positives ou `undefined` → valides
  - [x] 1.4 Vérifier que les tests existants (`Onboarding.test.tsx`, etc.) ne sont pas cassés par l'ajout de `.positive()` — les valeurs de test utilisées dans l'onboarding (âge/poids positifs) restent valides

- [x] Task 2 : Créer le composant `ProfileForm` (AC: #1, #2, #3, #4)
  - [x] 2.1 Créer `client/src/components/ProfileForm.tsx` — composant fonctionnel formulaire classique (tous les champs visibles simultanément, contrairement à `Onboarding.tsx` qui est conversationnel — cf. Dev Notes pour la distinction)
  - [x] 2.2 Au montage, initialiser l'état local du formulaire à partir de `useProfile().profile` (si `profile === null`, initialiser avec un objet vide `{}` — cas théorique car `AppRoutes` redirige déjà vers `/onboarding` si `profile === null`, mais le composant doit être défensif)
  - [x] 2.3 Champs du formulaire, tous contrôlés (`useState` ou état unique `Partial<Profile>`) : `name` (texte), `age` (nombre), `gender` (texte), `weight` (nombre, kg), `goal` (texte), `activityLevel` (texte), `dietaryRestrictions` (texte libre séparé par virgules, converti en `string[]` à la soumission — réutiliser la même logique de conversion que `Onboarding.tsx`)
  - [x] 2.4 Conversion des champs numériques : saisie vide → `undefined` (pas `NaN`), même pattern que `Onboarding.tsx` (`ProfileSchema` accepte `undefined` via `.optional()` mais rejette `NaN`)
  - [x] 2.5 À la soumission (`handleSubmit`, `e.preventDefault()`) : appeler `saveProfile(formData)` dans un bloc `try/catch` — si `saveProfile` lève une `ZodError` (validation échoue dans `LocalStorageRepository.saveProfile` via `ProfileSchema.parse()`), capturer l'erreur et afficher les messages de validation (AC4) sans naviguer ni afficher de confirmation
  - [x] 2.6 Si `saveProfile` réussit (pas d'exception) : afficher un message de confirmation visuel temporaire (ex. bandeau/texte "Profil mis à jour" — état local `useState<boolean>`, pas besoin de `i18n` ni de composant `ErrorBanner` séparé, cf. ⚠️ Ne PAS faire)
  - [x] 2.7 Affichage des erreurs de validation (AC4) : parser `error.issues` (format Zod) pour extraire les champs en erreur et afficher un message par champ concerné (ex. "Le poids doit être positif" sous le champ `weight`) — état local `Record<string, string>` pour mapper `field → message`
  - [x] 2.8 Styles cohérents avec la palette existante (`bg-navy-900`, `border-navy-700`, `text-warm-white`, `text-accent`, bouton `bg-accent text-navy-950`), réutiliser les classes déjà présentes dans `Onboarding.tsx`/`DisclaimerModal.tsx`

- [x] Task 3 : Remplacer `ProfilePage` par `ProfileForm` (AC: #1)
  - [x] 3.1 Modifier `client/src/pages/ProfilePage.tsx` pour rendre `<ProfileForm />` au lieu du placeholder actuel

- [x] Task 4 : Tests (AC: tous)
  - [x] 4.1 Créer `client/src/components/ProfileForm.test.tsx` (co-localisé) couvrant :
    - Affichage des valeurs actuelles du profil au montage (AC1) — render avec un profil pré-rempli dans `AppContext`/`localStorage`
    - Soumission avec des valeurs modifiées valides → `saveProfile` appelé avec les nouvelles valeurs, message de confirmation affiché (AC2, AC3)
    - Soumission avec `weight` négatif (ou `age` négatif) → message d'erreur affiché, `saveProfile`/`localStorageRepository.saveProfile` ne persiste PAS la valeur invalide (AC4)
    - `localStorage.clear()` dans `beforeEach`
  - [x] 4.2 Étendre `client/src/schemas/profile.schema.test.ts` (cf. Task 1.3)

- [x] Task 5 : Validation finale (AC: tous)
  - [x] 5.1 `npm test -w client` — tous les tests passent (aucune régression sur les 37 tests existants + nouveaux)
  - [x] 5.2 `tsc --noEmit` sur `client` — zéro erreur

## Dev Notes

### Périmètre exact de la story

- 100% côté `client`. Aucune modification de `server/`.
- Pas d'i18n disponible (Story 1.6 backlog) — tout le texte est en dur en français, cohérent avec `Onboarding.tsx`/`DisclaimerModal.tsx`. **Ne pas introduire `useTranslation`**.
- Ne pas créer `Sidebar.tsx`, `Chat.tsx`, etc. — hors scope (Epic 2/3).
- Ne pas modifier `Onboarding.tsx`, `OnboardingPage.tsx`, `AppRoutes.tsx`, `useProfile.ts` au-delà de ce qui est strictement nécessaire (voir ci-dessous, `useProfile.ts` ne devrait PAS avoir besoin d'être modifié — il expose déjà `{ profile, isLoading, saveProfile }`).

### `useProfile` — déjà prêt, ne pas modifier

`client/src/hooks/useProfile.ts` (implémenté en Story 1.4) expose déjà tout le nécessaire :
```ts
export function useProfile() {
  const { profile, setProfile } = useAppContext();
  const [isLoading, setIsLoading] = useState(true);
  // ... getProfile() au montage, peuple AppContext.profile
  const saveProfile = async (newProfile: Profile): Promise<void> => {
    await localStorageRepository.saveProfile(newProfile); // valide via ProfileSchema.parse(), lève ZodError si invalide
    setProfile(newProfile);
  };
  return { profile, isLoading, saveProfile };
}
```
- `saveProfile` lève une `ZodError` (via `LocalStorageRepository.saveProfile` → `ProfileSchema.parse()`) si les données sont invalides, et **ne met PAS à jour `AppContext`** dans ce cas (l'erreur est levée avant `setProfile`). C'est la base du mécanisme AC4 : `ProfileForm` doit catcher cette erreur.
- AC3 ("AppContext mis à jour après sauvegarde réussie") est déjà garanti par `saveProfile` — `ProfileForm` n'a rien de spécial à faire pour ça au-delà d'appeler `saveProfile`.

### Distinction `ProfileForm` vs `Onboarding`

`Onboarding.tsx` (Story 1.4) est **conversationnel** : une question à la fois, navigation séquentielle. `ProfileForm` (cette story) est un **formulaire classique** : tous les champs visibles et modifiables simultanément, avec un seul bouton de soumission. Ne pas réutiliser la structure conversationnelle de `Onboarding.tsx` — seule la logique de conversion des champs (numériques, `dietaryRestrictions`) et les conventions de style sont à réutiliser.

### Validation Zod — étendre `ProfileSchema` (point critique AC4)

`ProfileSchema` actuel (`client/src/schemas/profile.schema.ts`) :
```ts
export const ProfileSchema = z.object({
  name: z.string().optional(),
  age: z.number().optional(),
  gender: z.string().optional(),
  weight: z.number().optional(),
  goal: z.string().optional(),
  activityLevel: z.string().optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
  language: z.string().optional(),
  onboardingSkipped: z.boolean().optional(),
});
```
Aucune contrainte sémantique actuellement — un `weight: -5` est valide selon le schéma actuel, ce qui rend AC4 impossible à satisfaire sans modification. Ajouter `.positive()` à `age` et `weight` :
```ts
age: z.number().positive().optional(),
weight: z.number().positive().optional(),
```
`ProfileSchema.parse()` lèvera alors une `ZodError` pour `weight <= 0` ou `age <= 0`. `error.issues` (tableau Zod) contient `{ path: ['weight'], message: '...' }` — utiliser `path[0]` pour mapper l'erreur au champ concerné dans `ProfileForm`.

### Gestion de l'erreur de validation côté `ProfileForm` (AC4)

```tsx
import { ZodError } from 'zod';
// ...
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setErrors({});
  setShowConfirmation(false);
  try {
    await saveProfile(formData);
    setShowConfirmation(true);
  } catch (err) {
    if (err instanceof ZodError) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of err.issues) {
        const field = issue.path[0] as string;
        fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
    }
  }
};
```
- Ne pas avaler silencieusement les erreurs non-`ZodError` (cohérent avec le pattern établi en 1.2/1.4 : pas de `try/catch` superflu pour des cas qui ne peuvent pas survenir — ici le `try/catch` est justifié car `ZodError` est un cas attendu et explicitement testé par AC4).

### Conversion des champs (réutiliser le pattern `Onboarding.tsx`)

```ts
// Numérique : saisie vide → undefined (pas NaN)
const parsed = trimmed === '' ? undefined : Number(trimmed);
const value = Number.isNaN(parsed) ? undefined : parsed;

// dietaryRestrictions : texte séparé par virgules → string[]
const items = inputValue.split(',').map((s) => s.trim()).filter(Boolean);
```
Pour l'affichage initial (AC1), l'inverse est nécessaire : `dietaryRestrictions: string[]` → texte affiché dans l'input (`(profile.dietaryRestrictions ?? []).join(', ')`).

### Message de confirmation (AC2)

Pas de composant `ErrorBanner.tsx`/toast à créer (hors scope, cf. ⚠️). Un simple texte conditionnel suffit :
```tsx
{showConfirmation && (
  <p className="text-sm text-accent mb-4">Profil mis à jour avec succès.</p>
)}
```

### ⚠️ Ne PAS faire dans cette story

- Ne pas introduire `react-i18next` ou `useTranslation` (Story 1.6)
- Ne pas créer `ErrorBanner.tsx`, `Sidebar.tsx`, `Chat.tsx`, `InputBar.tsx` (autres stories)
- Ne pas modifier `server/`
- Ne pas modifier `Onboarding.tsx`, `OnboardingPage.tsx`, `AppRoutes.tsx` — `ProfileForm` est un nouveau composant indépendant, la route `/profile` existe déjà et pointe vers `ProfilePage` (seul `ProfilePage.tsx` change)
- Ne pas modifier `useProfile.ts` — il expose déjà tout le nécessaire (`profile`, `saveProfile`)
- Ne pas changer la structure des champs existants de `ProfileSchema` (noms, types de base) — uniquement ajouter `.positive()` sur `age`/`weight`
- Ne pas implémenter de debounce/auto-save — soumission explicite via bouton uniquement

### Project Structure Notes

Fichiers à créer :
```
client/src/
└── components/
    ├── ProfileForm.tsx
    └── ProfileForm.test.tsx
```

Fichiers à modifier :
```
client/src/
├── schemas/
│   ├── profile.schema.ts        # ajout .positive() sur age, weight
│   └── profile.schema.test.ts   # tests de validation négative/nulle
└── pages/
    └── ProfilePage.tsx           # rend <ProfileForm /> au lieu du placeholder
```

Conventions à respecter (architecture §Naming Patterns, déjà appliquées en 1.1-1.4) :
- Composant React : PascalCase (`ProfileForm.tsx`)
- Tests co-localisés
- camelCase pour les champs du profil (`activityLevel`, `dietaryRestrictions`)
- Accès storage exclusivement via `localStorageRepository`, et uniquement depuis `useProfile` (jamais directement dans `ProfileForm.tsx`)
- Pas de mutation directe d'état — spread/`map`/`filter` uniquement

### Previous Story Intelligence (Story 1.4)

- `useProfile()` retourne `{ profile, isLoading, saveProfile }` — `profile` est lu depuis `AppContext` (déjà peuplé par l'appel `useProfile()` fait dans `AppRoutes.tsx`, pas besoin de refaire `getProfile()` dans `ProfileForm`).
- `saveProfile(profile)` valide via `ProfileSchema.parse()` (dans `LocalStorageRepository.saveProfile`) **avant** persistance — si invalide, lève `ZodError`, rien n'est écrit en `localStorage`, et `AppContext` n'est pas mis à jour.
- Pour tester un composant utilisant `useAppContext`/`useProfile`, envelopper le rendu avec `<AppContextProvider>...</AppContextProvider>` (pas besoin de `BrowserRouter`/`MemoryRouter` ici — `ProfileForm` ne navigue pas).
- `localStorage.clear()` dans `beforeEach` pour tous les nouveaux tests touchant au storage (`client/vitest.config.ts` fournit `environment: 'jsdom'`).
- Pas d'alias `@/` configuré — imports relatifs uniquement.
- `tsc --noEmit` doit rester à zéro erreur sur `client` après modification.
- Note connue (non bloquante, héritée de 1.4) : erreurs de lint préexistantes dans `useChat.ts`/`useHistory.ts` — hors scope, ne pas corriger.

### References

- Architecture — Frontend Architecture (composants `ProfileForm`, routing `/profile`) : [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- Architecture — Requirements to Structure Mapping (Onboarding & Profil) : [Source: _bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping]
- Architecture — Data Architecture (ProfileSchema, validation Zod) : [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture]
- Architecture — Communication Patterns (AppContext, hooks seuls points d'accès au repository) : [Source: _bmad-output/planning-artifacts/architecture.md#Communication Patterns]
- Architecture — Process Patterns (erreurs frontend via composant, pas `alert()`) : [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns]
- Epics — Story 1.5 AC : [Source: _bmad-output/planning-artifacts/epics.md#Story 1.5]
- Story 1.4 — Dev Notes (`useProfile`, pattern de conversion de champs, conventions de test) : [Source: _bmad-output/implementation-artifacts/1-4-flow-donboarding-conversationnel.md#Dev Notes]
- Story 1.2 — Dev Notes (`ProfileSchema`, `LocalStorageRepository`, validation) : [Source: _bmad-output/implementation-artifacts/1-2-repository-de-stockage-et-schema-de-profil.md#Dev Notes]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6 (bmad-create-story workflow)

### Debug Log References

### Completion Notes List

Story 1.5 créée via bmad-create-story le 2026-06-14. Analyse complète : epics.md (Story 1.5 AC + contexte Epic 1), architecture.md (Frontend Architecture, Data Architecture, Communication/Process Patterns, Requirements to Structure Mapping), Story 1.4 (Dev Notes, `useProfile` finalisé, patterns de conversion de champs établis), code source actuel (`useProfile.ts`, `ProfilePage.tsx`, `Onboarding.tsx`, `DisclaimerModal.tsx`, `AppContext.tsx`, `ProfileSchema`).

Points d'attention principaux pour le dev agent :
1. `useProfile.ts` est déjà finalisé (Story 1.4) — ne pas le modifier. `ProfileForm` consomme `{ profile, saveProfile }` directement.
2. AC4 (validation, ex. poids négatif) nécessite d'**étendre `ProfileSchema`** avec `.positive()` sur `age`/`weight` — sans cette modification, l'AC est impossible à satisfaire car le schéma actuel accepte n'importe quel nombre.
3. `saveProfile` lève une `ZodError` en cas d'échec de validation (ne met pas à jour `AppContext`, n'écrit pas en `localStorage`) — `ProfileForm` doit catcher cette erreur spécifiquement pour afficher les messages par champ (AC4).
4. `ProfileForm` est un formulaire classique (tous champs visibles), à ne pas confondre avec le flow conversationnel de `Onboarding.tsx` — seule la logique de conversion de champs et les classes Tailwind sont à réutiliser.
5. AC3 (mise à jour `AppContext`) est automatique via `saveProfile` — aucune logique additionnelle requise.

### Dev Agent Implementation Notes (1.5)

- `ProfileSchema` étendu avec `.positive()` sur `age` et `weight` (AC4) ; 4 nouveaux cas de test ajoutés dans `profile.schema.test.ts`.
- `ProfileForm.tsx` créé : formulaire classique contrôlé par état unique `Partial<Profile>` + état séparé pour `dietaryInput` (texte brut, converti en `string[]` à la soumission). Réutilise les conventions de style de `Onboarding.tsx`.
- Synchronisation initiale du formulaire avec `useProfile().profile` : `useProfile` charge le profil de façon asynchrone (`getProfile()` dans un `useEffect`), donc un `useEffect` déclenché sur `isLoading` (true → false) synchronise `formData`/`dietaryInput` une seule fois au chargement initial — évite d'écraser les saisies de l'utilisateur après une sauvegarde (qui met aussi à jour `profile` dans `AppContext`).
- Gestion AC4 : `try/catch` autour de `saveProfile`, `ZodError.issues` mappés vers `Record<string, string>` par `path[0]`, affichés sous chaque champ concerné.
- `ProfilePage.tsx` simplifié pour rendre uniquement `<ProfileForm />`.
- `AppRoutes.test.tsx` (créé en amont de cette story, hors scope strict mais nécessaire pour la cohérence) : test vérifiant le texte "Profil" sur `/profile` mis à jour vers "Mon profil" (titre du nouveau `ProfileForm`).
- Tests : `ProfileForm.test.tsx` créé (3 tests : affichage AC1, soumission valide AC2/AC3, soumission invalide AC4). Suite complète : 43/43 tests passent. `tsc --noEmit` : 0 erreur.

## File List

- `client/src/schemas/profile.schema.ts` (modifié — `.positive()` sur `age`/`weight`)
- `client/src/schemas/profile.schema.test.ts` (modifié — tests de validation `age`/`weight`)
- `client/src/components/ProfileForm.tsx` (créé)
- `client/src/components/ProfileForm.test.tsx` (créé)
- `client/src/pages/ProfilePage.tsx` (modifié — rend `<ProfileForm />`)
- `client/src/routes/AppRoutes.test.tsx` (modifié — assertion "Profil" → "Mon profil")

## Change Log

- 2026-06-14 : Création de la story (bmad-create-story).
- 2026-06-14 : Implémentation complète (Tasks 1-5) — `ProfileSchema` étendu (`.positive()` sur age/weight), `ProfileForm` créé, `ProfilePage` mis à jour, tests ajoutés (schema + ProfileForm), `AppRoutes.test.tsx` ajusté. Statut → review.
