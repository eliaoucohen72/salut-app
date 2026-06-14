---
status: review
baseline_commit: fc1b3fa
---

# Story 1.4 : Flow d'onboarding conversationnel

Status: review

## Story

As a nouvel utilisateur,
I want compléter mon profil (âge, genre, poids, objectifs, restrictions alimentaires, niveau d'activité) via un flow conversationnel convivial, ou choisir de le faire plus tard,
so that le coach dispose des informations nécessaires pour personnaliser ses conseils, sans que cela soit une contrainte bloquante.

## Acceptance Criteria

1. **[AC1 — Redirection vers /onboarding]** Given un utilisateur sans profil existant accède à l'application, When la navigation tente d'afficher `/chat` ou `/profile`, Then l'utilisateur est redirigé vers `/onboarding`.

2. **[AC2 — Collecte conversationnelle]** Given la page `/onboarding` affichée, When l'utilisateur progresse dans le flow conversationnel (questions successives sur âge, genre, poids, objectif, niveau d'activité, restrictions alimentaires), Then chaque réponse est collectée et accumulée dans un état local de formulaire.

3. **[AC3 — Complétion et sauvegarde]** Given toutes les questions de l'onboarding complétées, When l'utilisateur valide la dernière étape, Then le profil est validé via `ProfileSchema` et sauvegardé via `StorageRepository.saveProfile()`, And l'utilisateur est redirigé vers `/chat`.

4. **[AC4 — Skip]** Given la page `/onboarding` affichée, When l'utilisateur choisit l'option "passer pour l'instant" / "skip", Then un objet `{ onboardingSkipped: true }` est persisté via `StorageRepository.saveProfile()` (aucun champ de profil réel n'est renseigné), And l'utilisateur est redirigé vers `/chat` sans être bloqué.

5. **[AC5 — Pas de redirection si profil existant ou skip]** Given un utilisateur ayant déjà un profil complet sauvegardé, ou ayant utilisé le skip (`onboardingSkipped: true`), When il accède à l'application, Then il n'est plus redirigé automatiquement vers `/onboarding`.

## Tasks / Subtasks

- [x] Task 1 : Câbler `useProfile` sur `LocalStorageRepository` (AC: #1, #3, #4, #5)
  - [x] 1.1 Remplacer le stub de `client/src/hooks/useProfile.ts` par une implémentation réelle exposant `{ profile: Profile | null, isLoading: boolean, saveProfile: (profile: Profile) => Promise<void> }`
  - [x] 1.2 Au montage (`useEffect`), appeler `localStorageRepository.getProfile()` ; stocker le résultat dans `AppContext` via `setProfile` (le hook lit/écrit l'état du contexte, pas un état local séparé — cf. Dev Notes)
  - [x] 1.3 `saveProfile(profile)` appelle `localStorageRepository.saveProfile(profile)` (validation `ProfileSchema` déjà gérée dans le repository), puis `setProfile(profile)` pour mettre à jour `AppContext`
  - [x] 1.4 Adapter/étendre `client/src/hooks/useProfile.test.ts` (déjà existant depuis Story 1.1/1.2 avec un stub) pour couvrir : chargement initial depuis le repository, `saveProfile` persiste et met à jour le contexte

- [x] Task 2 : Créer le composant `Onboarding` conversationnel (AC: #2, #3, #4)
  - [x] 2.1 Créer `client/src/components/Onboarding.tsx` — composant fonctionnel affichant une séquence de questions une à la fois (étape courante dans un état local `useState`), style "chat" convivial (pas un formulaire classique avec tous les champs visibles)
  - [x] 2.2 Questions dans l'ordre : âge (`age`, number), genre (`gender`, choix ou texte libre), poids (`weight`, number), objectif (`goal`, texte/choix), niveau d'activité (`activityLevel`, choix), restrictions alimentaires (`dietaryRestrictions`, liste/texte libre séparé par virgules)
  - [x] 2.3 Chaque réponse est accumulée dans un état local `Partial<Profile>` au fil des étapes (navigation "suivant" entre questions)
  - [x] 2.4 Bouton "suivant"/valider sur la dernière étape : appelle `ProfileSchema.parse()` implicitement via `saveProfile` (qui valide), puis `saveProfile(profileData)`, puis navigue vers `/chat` (`useNavigate`)
  - [x] 2.5 Bouton/lien "passer pour l'instant" visible à chaque étape : appelle `saveProfile({ onboardingSkipped: true })` puis navigue vers `/chat`
  - [x] 2.6 Styles cohérents avec la palette existante (classes `bg-navy-*`, `text-warm-white`, `text-accent`, `border-navy-700` déjà utilisées dans `App.tsx`/`DisclaimerModal.tsx`)

- [x] Task 3 : Remplacer `OnboardingPage` par `Onboarding` (AC: #2, #3, #4)
  - [x] 3.1 Modifier `client/src/pages/OnboardingPage.tsx` pour rendre `<Onboarding />` au lieu du placeholder actuel

- [x] Task 4 : Logique de redirection dans `AppRoutes` (AC: #1, #5)
  - [x] 4.1 Dans `client/src/routes/AppRoutes.tsx`, utiliser `useProfile()` pour lire `profile` et `isLoading` (cf. Dev Notes — éviter un flash de redirection avant chargement)
  - [x] 4.2 Si `profile === null` ET chargement terminé : routes `/chat`, `/chat/:conversationId`, `/profile` redirigent vers `/onboarding` (via `<Navigate to="/onboarding" replace />`)
  - [x] 4.3 Si `profile !== null` (profil complet OU `{ onboardingSkipped: true }`) : pas de redirection automatique vers `/onboarding` — l'utilisateur peut toujours y accéder manuellement si souhaité, mais ce n'est pas requis par les ACs
  - [x] 4.4 Pendant le chargement initial (`isLoading === true`), ne rediriger nulle part (`AppRoutes` retourne `null`) pour éviter un flash vers `/onboarding` puis retour

- [x] Task 5 : Brancher `useProfile` dans `App.tsx` pour peupler `AppContext` (AC: #1, #5)
  - [x] 5.1 `useProfile()` est appelé dans `AppRoutes.tsx` (rendu sous `AppContextProvider` dans `App.tsx`), ce qui déclenche le chargement du profil au montage et peuple `AppContext.profile`

- [x] Task 6 : Tests (AC: tous)
  - [x] 6.1 Créer `client/src/components/Onboarding.test.tsx` (co-localisé) : navigation entre les étapes, accumulation des réponses, `saveProfile` appelé avec les données complètes à la fin, redirection vers `/chat`, bouton skip appelle `saveProfile({ onboardingSkipped: true })` et redirige vers `/chat`
  - [x] 6.2 Créer `client/src/routes/AppRoutes.test.tsx` : sans profil → accès à `/chat`, `/profile` et `/` redirige vers `/onboarding` ; avec profil (ou `onboardingSkipped: true`) → pas de redirection, `/onboarding` reste accessible directement
  - [x] 6.3 S'assurer que `localStorage` est nettoyé entre chaque test (`beforeEach(() => localStorage.clear())`)

- [x] Task 7 : Validation finale (AC: tous)
  - [x] 7.1 `npm test -w client` — tous les tests passent (37/37, anciens + nouveaux)
  - [x] 7.2 `tsc --noEmit` sur `client` — zéro erreur

## Dev Notes

### Périmètre exact de la story

- 100% côté `client`. Aucune modification de `server/`.
- Pas d'i18n disponible (Story 1.6 backlog) — tout le texte de l'onboarding est en dur en français, cohérent avec le pattern déjà utilisé dans `App.tsx`/`DisclaimerModal.tsx` (ex. "Passer en mode clair", "J'ai compris"). **Ne pas introduire `useTranslation`** — prématuré, Story 1.6 s'en chargera.
- Ne pas créer `ProfileForm.tsx`, `Sidebar.tsx`, etc. — hors scope (Stories 1.5, Epic 3).
- Ne pas toucher `ChatPage.tsx`/`ProfilePage.tsx` au-delà de ce qui est strictement nécessaire pour la redirection (rien à modifier dans leur contenu, le placeholder reste).

### `useProfile` — de stub à implémentation réelle (point critique)

`client/src/hooks/useProfile.ts` est actuellement un stub :
```ts
import type { Profile } from '../schemas/profile.schema';

export function useProfile() {
  return {
    profile: null as Profile | null,
    saveProfile: async (_profile: Profile): Promise<void> => {},
  };
}
```

Il doit devenir l'unique point d'accès à `localStorageRepository` pour le profil (architecture §Communication Patterns : "Les hooks (`useChat`, `useProfile`, `useHistory`) sont les seuls points d'accès au `StorageRepository`"). Pattern attendu :

```ts
import { useEffect, useState } from 'react';
import type { Profile } from '../schemas/profile.schema';
import { localStorageRepository } from '../repositories/LocalStorageRepository';
import { useAppContext } from '../context/AppContext';

export function useProfile() {
  const { profile, setProfile } = useAppContext();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    localStorageRepository.getProfile().then((p) => {
      setProfile(p);
      setIsLoading(false);
    });
  }, []);

  const saveProfile = async (newProfile: Profile): Promise<void> => {
    await localStorageRepository.saveProfile(newProfile);
    setProfile(newProfile);
  };

  return { profile, isLoading, saveProfile };
}
```

**Important** : `AppContext.profile` reste la source de vérité partagée (architecture §Communication Patterns : "`AppContext` est le seul point de partage d'état global"). `useProfile` lit/écrit `AppContext` via `setProfile`, il ne maintient pas un état dupliqué. `isLoading` est local au hook (pas besoin de l'exposer via `AppContext`), mais `AppRoutes` doit pouvoir y accéder pour éviter le flash de redirection (Task 4.4) — appeler `useProfile()` directement dans `AppRoutes.tsx` (ou dans `App.tsx` et exposer `isLoading` via un mécanisme simple, voir ci-dessous).

### Où appeler `useProfile()` pour déclencher le chargement initial

`useProfile()` doit être appelé **une seule fois au montage** pour déclencher `getProfile()` et peupler `AppContext`. Options :
- **Option recommandée** : appeler `useProfile()` dans `AppRoutes.tsx` (Task 4.1) — ce composant a déjà besoin de `profile` et `isLoading` pour décider des redirections, donc un seul appel suffit pour les deux usages (chargement + décision de redirection). `Onboarding.tsx` appellera `useProfile()` séparément pour `saveProfile` (le hook est idempotent : un second appel refait un `getProfile()`, ce qui est sans effet de bord néfaste mais légèrement redondant — acceptable en MVP, ne pas sur-ingiérer avec un cache).
- Ne PAS dupliquer la logique de lecture `localStorageRepository.getProfile()` ailleurs — toujours via `useProfile()`.

### Logique de redirection — `AppRoutes.tsx`

État actuel :
```tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import OnboardingPage from '../pages/OnboardingPage';
import ChatPage from '../pages/ChatPage';
import ProfilePage from '../pages/ProfilePage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/onboarding" replace />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/chat/:conversationId" element={<ChatPage />} />
      <Route path="/profile" element={<ProfilePage />} />
    </Routes>
  );
}
```

Pattern attendu (garde de route inline, pas de composant `ProtectedRoute` séparé — pas demandé par les ACs, éviter la sur-ingénierie) :
```tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import OnboardingPage from '../pages/OnboardingPage';
import ChatPage from '../pages/ChatPage';
import ProfilePage from '../pages/ProfilePage';
import { useProfile } from '../hooks/useProfile';

export default function AppRoutes() {
  const { profile, isLoading } = useProfile();

  if (isLoading) {
    return null; // ou un loader minimal — éviter le flash de redirection
  }

  const requiresOnboarding = profile === null;

  return (
    <Routes>
      <Route path="/" element={<Navigate to={requiresOnboarding ? '/onboarding' : '/chat'} replace />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route
        path="/chat"
        element={requiresOnboarding ? <Navigate to="/onboarding" replace /> : <ChatPage />}
      />
      <Route
        path="/chat/:conversationId"
        element={requiresOnboarding ? <Navigate to="/onboarding" replace /> : <ChatPage />}
      />
      <Route
        path="/profile"
        element={requiresOnboarding ? <Navigate to="/onboarding" replace /> : <ProfilePage />}
      />
    </Routes>
  );
}
```

Points clés :
- `profile === null` → redirection (aucun profil sauvegardé, premier lancement).
- `profile` non-`null` mais `{ onboardingSkipped: true }` (aucun autre champ rempli) → **pas de redirection** (AC5). `ProfileSchema.parse({ onboardingSkipped: true })` est un objet valide non-`null`, donc `profile !== null` suffit comme condition — pas besoin de vérifier `onboardingSkipped` explicitement.
- Le `<Route path="/">` actuel redirige toujours vers `/onboarding` — avec cette story, `/` doit refléter l'état du profil (vers `/chat` si profil existant, sinon `/onboarding`), sinon AC5 serait violé pour la route `/`.

### Composant `Onboarding` — flow conversationnel

PRD §6 : "Onboarding as a friendly conversational flow, not a form". Implémenter une séquence d'étapes affichées une à la fois (pas un long formulaire avec tous les champs visibles simultanément), avec navigation "suivant" et accumulation de l'état :

```tsx
// client/src/components/Onboarding.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Profile } from '../schemas/profile.schema';
import { useProfile } from '../hooks/useProfile';

type StepKey = 'age' | 'gender' | 'weight' | 'goal' | 'activityLevel' | 'dietaryRestrictions';

const STEPS: StepKey[] = ['age', 'gender', 'weight', 'goal', 'activityLevel', 'dietaryRestrictions'];

export default function Onboarding() {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Partial<Profile>>({});
  const { saveProfile } = useProfile();
  const navigate = useNavigate();

  const isLastStep = stepIndex === STEPS.length - 1;

  const handleNext = async (value: Partial<Profile>) => {
    const updated = { ...answers, ...value };
    setAnswers(updated);
    if (isLastStep) {
      await saveProfile(updated);
      navigate('/chat');
    } else {
      setStepIndex((i) => i + 1);
    }
  };

  const handleSkip = async () => {
    await saveProfile({ onboardingSkipped: true });
    navigate('/chat');
  };

  // ... rendu de la question correspondant à STEPS[stepIndex], bouton skip toujours visible
}
```

Détails de mapping des champs (cf. `ProfileSchema`, tous optionnels) :
- `age?: number` — input numérique
- `gender?: string` — texte libre ou boutons de choix (ex. "Homme" / "Femme" / "Autre")
- `weight?: number` — input numérique (kg)
- `goal?: string` — texte libre ou choix (ex. "Perte de poids" / "Prise de muscle" / "Forme générale")
- `activityLevel?: string` — choix (ex. "Sédentaire" / "Modéré" / "Actif")
- `dietaryRestrictions?: string[]` — saisie texte libre séparée par virgules, convertie en `string[]` (`.split(',').map(s => s.trim()).filter(Boolean)`)

Validation : `saveProfile` (via `localStorageRepository.saveProfile`) appelle déjà `ProfileSchema.parse()` — si une valeur numérique est invalide (ex. champ vide converti en `NaN`), `ProfileSchema.parse()` lèvera une `ZodError`. Pour l'AC3, s'assurer que les valeurs collectées sont du bon type avant l'appel (ex. `Number(inputValue)` avec garde contre `NaN`/chaîne vide → `undefined` plutôt que `NaN`, car `ProfileSchema` accepte `undefined` via `.optional()` mais pas `NaN` via `z.number()`).

### ⚠️ Ne PAS faire dans cette story

- Ne pas introduire `react-i18next` ou `useTranslation` (Story 1.6)
- Ne pas créer `ProfileForm.tsx`, `Sidebar.tsx`, `ErrorBanner.tsx`, `Chat.tsx`, `InputBar.tsx` (autres stories)
- Ne pas modifier `server/`
- Ne pas créer de composant `ProtectedRoute` générique ou de système de garde de route complexe — la logique inline dans `AppRoutes.tsx` (cf. pattern ci-dessus) suffit pour les ACs de cette story
- Ne pas implémenter de validation de formulaire avancée/messages d'erreur détaillés par champ — Story 1.5 (`ProfileForm`) couvrira l'édition complète avec affichage d'erreurs ; ici, suffisamment de garde-fous pour que `ProfileSchema.parse()` ne lève pas sur une saisie normale
- Ne pas toucher au toggle dark/light mode existant dans `App.tsx`, ni à `DisclaimerModal`

### Project Structure Notes

Fichiers à créer :
```
client/src/
├── components/
│   ├── Onboarding.tsx
│   └── Onboarding.test.tsx
└── routes/
    └── AppRoutes.test.tsx          # nouveau (n'existe pas encore)
```

Fichiers à modifier :
```
client/src/
├── hooks/
│   ├── useProfile.ts                # stub → implémentation réelle (localStorageRepository + AppContext)
│   └── useProfile.test.ts           # adapter les tests existants au nouveau comportement
├── pages/
│   └── OnboardingPage.tsx           # rend <Onboarding /> au lieu du placeholder
└── routes/
    └── AppRoutes.tsx                # logique de redirection basée sur useProfile()
```

Conventions à respecter (architecture §Naming Patterns, déjà appliquées en 1.1/1.2/1.3) :
- Composant React : PascalCase (`Onboarding.tsx`)
- Tests co-localisés
- camelCase pour les champs du profil (`activityLevel`, `dietaryRestrictions`)
- Accès storage exclusivement via `localStorageRepository`, et uniquement depuis `useProfile` (jamais directement dans `Onboarding.tsx`/`AppRoutes.tsx`)
- Pas de mutation directe d'état — spread/`map`/`filter` uniquement

### Previous Story Intelligence (Story 1.3)

- `localStorageRepository` (instance exportée) existe dans `client/src/repositories/LocalStorageRepository.ts` — réutiliser, ne pas en recréer.
- `ProfileSchema.parse()` lève une `ZodError` si invalide — laisser remonter l'erreur, ne pas l'avaler silencieusement dans `saveProfile`/`Onboarding` (cohérent avec le pattern établi en 1.2 : pas de `try/catch` superflu).
- Pattern `async`/`Promise` systématique pour les opérations repository, même si synchrones en interne.
- `tsc --noEmit` doit rester à zéro erreur sur `client` après modification.
- Pas d'alias `@/` configuré — imports relatifs uniquement.
- Note connue (non bloquante) : `npm run lint -w client` rapporte des erreurs `no-unused-vars` préexistantes dans `useChat.ts`/`useHistory.ts`/`useProfile.ts` liées aux stubs — la modification de `useProfile.ts` dans cette story devrait résoudre l'erreur le concernant spécifiquement (le paramètre `_profile` du stub disparaît avec la vraie implémentation), mais ne pas chercher à corriger celles de `useChat.ts`/`useHistory.ts` (hors scope).
- `client/vitest.config.ts` fournit `environment: 'jsdom'` avec `localStorage` global et `globals: true` — nettoyer `localStorage` avec `localStorage.clear()` dans `beforeEach` pour tous les nouveaux tests touchant au storage.
- Pour tester des composants utilisant `useNavigate`/`useAppContext`, envelopper le rendu avec `<BrowserRouter><AppContextProvider>...</AppContextProvider></BrowserRouter>` (ou `MemoryRouter` pour contrôler la route initiale dans les tests de redirection `AppRoutes`).

### References

- Architecture — Frontend Architecture (routing, redirection `/onboarding`) : [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- Architecture — Decision Impact Analysis (séquence React Router avant UI) : [Source: _bmad-output/planning-artifacts/architecture.md#Decision Impact Analysis]
- Architecture — Communication Patterns (AppContext, hooks seuls points d'accès au repository) : [Source: _bmad-output/planning-artifacts/architecture.md#Communication Patterns]
- Architecture — Enforcement Guidelines : [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines]
- Architecture — Naming/Structure Patterns : [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns]
- Architecture — Requirements to Structure Mapping (Onboarding & Profil) : [Source: _bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping]
- PRD — UX direction (onboarding conversationnel, palette) : [Source: docs/PRD-coach-ia.md#6]
- Epics — Story 1.4 AC : [Source: _bmad-output/planning-artifacts/epics.md#Story 1.4]
- Story 1.2 — Dev Notes (ProfileSchema, LocalStorageRepository, pattern repository) : [Source: _bmad-output/implementation-artifacts/1-2-repository-de-stockage-et-schema-de-profil.md#Dev Notes]
- Story 1.3 — Dev Notes (pattern d'accès via localStorageRepository, conventions de test) : [Source: _bmad-output/implementation-artifacts/1-3-modale-de-disclaimer-medical.md#Dev Notes]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6 (bmad-create-story workflow)

### Debug Log References

### Completion Notes List

Story 1.4 créée via bmad-create-story le 2026-06-14. Analyse complète : epics.md (Story 1.4 AC + contexte Epic 1 complet), architecture.md (Frontend Architecture, Decision Impact Analysis, Communication Patterns, Naming/Structure Patterns, Enforcement Guidelines, Requirements to Structure Mapping), PRD-coach-ia.md (§6 direction UX onboarding conversationnel), Story 1.2 et 1.3 (Dev Notes, patterns établis), code source actuel (`AppRoutes.tsx`, `OnboardingPage.tsx`, `AppContext.tsx`, `useProfile.ts` stub, `App.tsx`, `ProfileSchema`, `types/index.ts`).

Points d'attention principaux pour le dev agent :
1. `useProfile.ts` est encore un stub (Story 1.1) — cette story le transforme en implémentation réelle branchée sur `localStorageRepository` + `AppContext`. C'est le changement le plus structurant de la story.
2. La logique de redirection doit être bidirectionnelle : sans profil → redirection vers `/onboarding` (AC1) ; avec profil (y compris `{ onboardingSkipped: true }`) → PAS de redirection (AC5), y compris pour la route `/` qui redirige actuellement toujours vers `/onboarding`.
3. Éviter le flash de redirection au chargement initial : `isLoading` du hook `useProfile` doit gater le rendu des routes tant que `getProfile()` n'a pas résolu.
4. Le texte de l'onboarding reste en dur en français (pas d'i18n avant Story 1.6), suivant le pattern déjà établi en Story 1.3 pour `DisclaimerModal`.
5. Validation numérique : convertir les saisies vides en `undefined` plutôt qu'en `NaN` avant l'appel à `saveProfile`, car `ProfileSchema` (`z.number().optional()`) accepte `undefined` mais rejette `NaN`.

Implémentation réalisée le 2026-06-14 :
- `useProfile.ts` : remplacement du stub par une implémentation réelle — `getProfile()` au montage peuple `AppContext.profile` via `setProfile`, `saveProfile(profile)` persiste via `localStorageRepository.saveProfile()` (validation Zod incluse) puis met à jour `AppContext`. Expose `{ profile, isLoading, saveProfile }`.
- `Onboarding.tsx` (nouveau) : composant conversationnel à 6 étapes (âge, genre, poids, objectif, niveau d'activité, restrictions alimentaires), une question à la fois, accumulation dans un état local `Partial<Profile>`. Bouton "Suivant"/"Valider" sur la dernière étape (sauvegarde + redirection `/chat`), bouton "Passer pour l'instant" visible à chaque étape (sauvegarde `{ onboardingSkipped: true }` + redirection `/chat`). Conversion des saisies numériques vides en `undefined` (pas `NaN`), `dietaryRestrictions` convertie depuis une saisie texte séparée par virgules.
- `OnboardingPage.tsx` : rend désormais `<Onboarding />` au lieu du placeholder.
- `AppRoutes.tsx` : appelle `useProfile()` ; pendant `isLoading`, ne rend rien (évite le flash de redirection). Si `profile === null`, `/chat`, `/chat/:conversationId`, `/profile` et `/` redirigent vers `/onboarding`. Si `profile !== null` (profil complet ou `{ onboardingSkipped: true }`), pas de redirection automatique ; `/onboarding` reste accessible directement dans tous les cas.
- Tests ajoutés : `useProfile.test.ts` (3 tests : chargement initial, chargement profil existant, `saveProfile`), `Onboarding.test.tsx` (2 tests : skip, parcours complet des 6 étapes), `AppRoutes.test.tsx` (6 tests : redirections avec/sans profil, `onboardingSkipped`, accès direct à `/onboarding`).
- Lint : correction des 2 nouveaux problèmes introduits par cette story (`no-useless-assignment` dans `Onboarding.tsx`, `react-hooks/exhaustive-deps` dans `useProfile.ts`). Les 5 erreurs de lint préexistantes (`AppContext.tsx`, `useChat.ts`, `useHistory.ts`) restent hors scope, non modifiées par cette story.

Validation finale : `npm test -w client` → 10 fichiers / 37 tests passent (aucune régression). `tsc --noEmit` sur `client` → zéro erreur.

### File List

- `client/src/hooks/useProfile.ts` (modifié)
- `client/src/hooks/useProfile.test.ts` (modifié)
- `client/src/components/Onboarding.tsx` (nouveau)
- `client/src/components/Onboarding.test.tsx` (nouveau)
- `client/src/pages/OnboardingPage.tsx` (modifié)
- `client/src/routes/AppRoutes.tsx` (modifié)
- `client/src/routes/AppRoutes.test.tsx` (nouveau)

## Change Log

- 2026-06-14 : Implémentation complète de la story (câblage `useProfile` sur `LocalStorageRepository`, composant `Onboarding` conversationnel à 6 étapes, redirection `/onboarding` basée sur l'état du profil dans `AppRoutes`, tests). Statut → review.

