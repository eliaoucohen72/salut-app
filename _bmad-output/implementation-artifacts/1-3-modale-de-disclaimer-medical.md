---
status: review
baseline_commit: 2c03015
---

# Story 1.3 : Modale de disclaimer médical

Status: review

## Story

As a utilisateur,
I want voir un disclaimer médical lors de ma toute première visite,
so that je comprenne que les conseils du coach ne remplacent pas un avis médical professionnel, sans que ce message ne réapparaisse à chaque visite.

## Acceptance Criteria

1. **[AC1 — Affichage au premier lancement]** Given un utilisateur ouvre l'application pour la première fois (aucun flag de disclaimer dans le storage), When l'application se charge, Then une modale `DisclaimerModal` s'affiche, expliquant que le coach ne fournit pas de diagnostic médical et recommandant de consulter un professionnel pour toute préoccupation médicale.

2. **[AC2 — Acquittement persisté]** Given la modale de disclaimer affichée, When l'utilisateur clique sur le bouton de confirmation/fermeture, Then la modale se ferme, And un indicateur (`coach_disclaimer_acknowledged: true`) est persisté via `StorageRepository`/`LocalStorageRepository`.

3. **[AC3 — Pas de réaffichage]** Given un utilisateur ayant déjà acquitté le disclaimer (indicateur présent dans le storage), When il recharge ou revisite l'application, Then la modale ne s'affiche pas.

## Tasks / Subtasks

- [x] Task 1 : Étendre `StorageRepository` et `LocalStorageRepository` pour le flag de disclaimer (AC: #2, #3)
  - [x] 1.1 Ajouter à l'interface `client/src/repositories/StorageRepository.ts` : `getDisclaimerAcknowledged(): Promise<boolean>` et `setDisclaimerAcknowledged(): Promise<void>`
  - [x] 1.2 Implémenter ces deux méthodes dans `client/src/repositories/LocalStorageRepository.ts` :
    - `getDisclaimerAcknowledged()` lit `localStorage.getItem('coach_disclaimer_acknowledged')` et retourne `true` si la valeur vaut `'true'`, sinon `false`
    - `setDisclaimerAcknowledged()` écrit `localStorage.setItem('coach_disclaimer_acknowledged', 'true')`
  - [x] 1.3 Ajouter les tests correspondants dans `client/src/repositories/LocalStorageRepository.test.ts` (round-trip flag absent → `false`, après `setDisclaimerAcknowledged()` → `true`)

- [x] Task 2 : Créer le composant `DisclaimerModal` (AC: #1, #2)
  - [x] 2.1 Créer `client/src/components/DisclaimerModal.tsx` — composant overlay simple (pas de librairie de modale externe), recevant en props `onAcknowledge: () => void`
  - [x] 2.2 Le contenu textuel explique que le coach (Flex) ne fournit pas de diagnostic médical et recommande de consulter un professionnel de santé pour toute préoccupation médicale (texte en français en dur, cf. Dev Notes — i18n arrive en Story 1.6)
  - [x] 2.3 Un bouton de confirmation (ex. "J'ai compris") appelle `onAcknowledge` au clic
  - [x] 2.4 Styles cohérents avec la palette existante (navy/accent vert électrique/warm white), overlay semi-transparent recouvrant tout l'écran, modale centrée, responsive mobile/desktop

- [x] Task 3 : Câbler l'affichage conditionnel dans `App.tsx` (AC: #1, #2, #3)
  - [x] 3.1 Dans `client/src/App.tsx`, ajouter un état local `showDisclaimer: boolean` (initialisé à `false`)
  - [x] 3.2 Au montage (`useEffect`), appeler `localStorageRepository.getDisclaimerAcknowledged()` ; si `false`, passer `showDisclaimer` à `true`
  - [x] 3.3 Si `showDisclaimer === true`, afficher `<DisclaimerModal onAcknowledge={...} />` par-dessus le reste de l'UI
  - [x] 3.4 Le handler `onAcknowledge` appelle `localStorageRepository.setDisclaimerAcknowledged()` puis met `showDisclaimer` à `false`

- [x] Task 4 : Tests (AC: tous)
  - [x] 4.1 Créer `client/src/components/DisclaimerModal.test.tsx` (co-localisé) : la modale affiche le texte attendu et appelle `onAcknowledge` au clic sur le bouton
  - [x] 4.2 Créer/étendre `client/src/App.test.tsx` (créer si absent) :
    - Si `getDisclaimerAcknowledged()` retourne `false` → `DisclaimerModal` est rendue au montage
    - Si `getDisclaimerAcknowledged()` retourne `true` → `DisclaimerModal` n'est pas rendue
    - Cliquer sur le bouton de confirmation déclenche `setDisclaimerAcknowledged()` et fait disparaître la modale
  - [x] 4.3 S'assurer que `localStorage` est nettoyé entre chaque test (`beforeEach(() => localStorage.clear())`)

- [x] Task 5 : Validation finale (AC: tous)
  - [x] 5.1 `npm test -w client` — tous les tests passent (anciens + nouveaux)
  - [x] 5.2 `tsc --noEmit` sur `client` — zéro erreur

## Dev Notes

### Périmètre exact de la story

- 100% côté `client`. Aucune modification de `server/`.
- Pas d'i18n dans cette story : Story 1.6 (backlog) introduira `react-i18next` et les fichiers de traduction. Le texte du disclaimer est donc écrit **en dur en français**, conformément au pattern déjà utilisé dans `App.tsx` actuel (ex. `"Passer en mode clair"`, `"Salut Coach"`). Ne pas tenter d'introduire `useTranslation` maintenant — ce serait prématuré et hors scope (cf. architecture, l'enforcement `useTranslation` partout s'applique une fois l'infrastructure i18n en place en 1.6).
- Ne pas créer `Onboarding.tsx`, `ProfileForm.tsx`, etc. — hors scope (Stories 1.4/1.5).
- Ne pas modifier le routing (`AppRoutes.tsx`) : la modale est un overlay global affiché depuis `App.tsx`, indépendant des routes.

### Extension de `StorageRepository` — flag disclaimer

L'AC2 demande explicitement que l'indicateur soit persisté **via `StorageRepository`/`LocalStorageRepository`**, pas directement via `localStorage` dans le composant (cf. architecture §Enforcement Guidelines : "Accéder au stockage uniquement via `StorageRepository`, jamais directement via `localStorage` dans les composants/hooks métier"). Il faut donc étendre l'interface existante avec deux nouvelles méthodes :

```ts
// client/src/repositories/StorageRepository.ts
export interface StorageRepository {
  getProfile(): Promise<Profile | null>;
  saveProfile(profile: Profile): Promise<void>;
  listConversations(): Promise<Conversation[]>;
  getConversation(id: string): Promise<Conversation | null>;
  saveConversation(conversation: Conversation): Promise<void>;
  deleteConversation(id: string): Promise<void>;
  getDisclaimerAcknowledged(): Promise<boolean>;
  setDisclaimerAcknowledged(): Promise<void>;
}
```

```ts
// client/src/repositories/LocalStorageRepository.ts
const DISCLAIMER_KEY = 'coach_disclaimer_acknowledged';

async getDisclaimerAcknowledged(): Promise<boolean> {
  return localStorage.getItem(DISCLAIMER_KEY) === 'true';
}

async setDisclaimerAcknowledged(): Promise<void> {
  localStorage.setItem(DISCLAIMER_KEY, 'true');
}
```

Cela suit exactement le pattern établi en Story 1.2 : toutes les méthodes sont `async`/`Promise` même si l'implémentation est synchrone, pour rester compatible avec une future `ApiRepository` (Phase 2). Pas de validation Zod nécessaire ici — c'est un simple booléen, pas une donnée de profil/conversation.

### Pourquoi un booléen stocké comme string `'true'`/absence de clé

La clé `coach_disclaimer_acknowledged` n'existe pas du tout tant que l'utilisateur n'a pas acquitté le disclaimer (`localStorage.getItem` retourne `null` → `getDisclaimerAcknowledged()` retourne `false`). Une fois acquitté, la clé vaut la string `'true'`. Pas besoin de `JSON.stringify`/`JSON.parse` pour un simple flag.

### `DisclaimerModal` — composant attendu

Composant overlay simple, sans librairie externe (pas de `react-modal`/`radix` dans les dépendances actuelles — ne pas en ajouter). Pattern attendu, cohérent avec le style Tailwind déjà en place dans `App.tsx` (classes `bg-navy-900`, `bg-navy-950`, `text-warm-white`, `text-accent`, `border-navy-700`) :

```tsx
// client/src/components/DisclaimerModal.tsx
interface DisclaimerModalProps {
  onAcknowledge: () => void;
}

export default function DisclaimerModal({ onAcknowledge }: DisclaimerModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-w-md w-full bg-navy-900 border border-navy-700 rounded-lg p-6 text-warm-white">
        <h2 className="text-lg font-semibold text-accent mb-3">Avertissement médical</h2>
        <p className="text-sm mb-4">
          Flex, votre coach IA, fournit des conseils généraux de fitness et de nutrition à titre
          informatif uniquement. Il ne fournit pas de diagnostic médical et ne remplace pas
          l'avis d'un professionnel de santé. Consultez un médecin pour toute préoccupation
          médicale avant de suivre ces conseils.
        </p>
        <button
          type="button"
          onClick={onAcknowledge}
          className="w-full px-4 py-2 rounded bg-accent text-navy-950 font-semibold hover:opacity-90 transition-opacity"
        >
          J'ai compris
        </button>
      </div>
    </div>
  );
}
```

Le texte exact peut être ajusté légèrement, mais doit couvrir les deux points requis par l'AC1 : (1) pas de diagnostic médical, (2) recommandation de consulter un professionnel.

### Câblage dans `App.tsx`

`App.tsx` gère déjà un état local (`isDark`) avec lecture/écriture `localStorage` directe pour le thème — **ce pattern existant pour le thème n'est pas à reproduire pour le disclaimer** (le thème n'est pas couvert par `StorageRepository` et reste hors scope de cette story ; ne pas y toucher). Pour le disclaimer, utiliser `localStorageRepository` (instance exportée par `client/src/repositories/LocalStorageRepository.ts`, déjà disponible depuis Story 1.2) :

```tsx
import { useState, useEffect } from 'react';
import { localStorageRepository } from './repositories/LocalStorageRepository';
import DisclaimerModal from './components/DisclaimerModal';
// ... imports existants

function App() {
  // ... état isDark existant, inchangé

  const [showDisclaimer, setShowDisclaimer] = useState(false);

  useEffect(() => {
    localStorageRepository.getDisclaimerAcknowledged().then((acknowledged) => {
      if (!acknowledged) setShowDisclaimer(true);
    });
  }, []);

  const handleAcknowledge = () => {
    localStorageRepository.setDisclaimerAcknowledged().then(() => {
      setShowDisclaimer(false);
    });
  };

  return (
    <BrowserRouter>
      <AppContextProvider>
        <div className="...">
          {/* header, main existants inchangés */}
        </div>
        {showDisclaimer && <DisclaimerModal onAcknowledge={handleAcknowledge} />}
      </AppContextProvider>
    </BrowserRouter>
  );
}
```

Placer `DisclaimerModal` en dehors (ou en frère) du conteneur `flex flex-col h-full` principal, avec `position: fixed` (cf. classes `fixed inset-0` du composant), pour qu'elle recouvre toute la fenêtre indépendamment du layout de la page active.

### Tests — environnement

`client/vitest.config.ts` (Story 1.1) fournit déjà `environment: 'jsdom'` avec `localStorage` global et `globals: true`. Nettoyer `localStorage` avec `localStorage.clear()` dans `beforeEach` pour chaque fichier de test touchant au storage (`LocalStorageRepository.test.ts`, `App.test.tsx`).

Pour `App.test.tsx`, envelopper le rendu si nécessaire des mêmes providers que `App` utilise déjà en interne (`App` inclut déjà `BrowserRouter` et `AppContextProvider`, donc `render(<App />)` suffit, pas besoin de wrapper supplémentaire). Utiliser `findByText`/`waitFor` de `@testing-library/react` pour attendre l'effet asynchrone (`getDisclaimerAcknowledged()` retourne une `Promise`).

### ⚠️ Ne PAS faire dans cette story

- Ne pas introduire `react-i18next` ou `useTranslation` (Story 1.6)
- Ne pas créer `Onboarding.tsx`, `ProfileForm.tsx`, `Sidebar.tsx`, `ErrorBanner.tsx` (autres stories)
- Ne pas modifier `AppRoutes.tsx` ni la logique de redirection `/onboarding` (Story 1.4)
- Ne pas toucher à la logique du toggle dark/light mode existante dans `App.tsx`
- Ne pas modifier `server/`
- Ne pas ajouter de librairie de modale externe (`react-modal`, `@radix-ui/react-dialog`, etc.) — composant overlay simple en Tailwind

### Project Structure Notes

Fichiers à créer :
```
client/src/
├── components/
│   ├── DisclaimerModal.tsx
│   └── DisclaimerModal.test.tsx
└── App.test.tsx                 # nouveau (n'existe pas encore)
```

Fichiers à modifier :
```
client/src/
├── App.tsx                              # affichage conditionnel de DisclaimerModal
├── repositories/
│   ├── StorageRepository.ts             # + getDisclaimerAcknowledged / setDisclaimerAcknowledged
│   ├── LocalStorageRepository.ts        # implémentation des 2 méthodes
│   └── LocalStorageRepository.test.ts   # + tests du flag disclaimer
```

Conventions à respecter (architecture §Naming Patterns, déjà appliquées en 1.1/1.2) :
- Composant React : PascalCase (`DisclaimerModal.tsx`)
- Tests co-localisés (`DisclaimerModal.test.tsx` à côté de `DisclaimerModal.tsx`, `App.test.tsx` à côté de `App.tsx`)
- camelCase pour les méthodes du repository (`getDisclaimerAcknowledged`, `setDisclaimerAcknowledged`)
- Accès storage exclusivement via `localStorageRepository`, jamais `localStorage` direct dans `App.tsx`/`DisclaimerModal.tsx`

### Previous Story Intelligence (Story 1.2)

- `localStorageRepository` (instance exportée) et `LocalStorageRepository` (classe) existent déjà dans `client/src/repositories/LocalStorageRepository.ts` — réutiliser cette instance, ne pas en recréer une.
- Le pattern `async`/`Promise` même pour des opérations synchrones est établi et doit être suivi pour les 2 nouvelles méthodes.
- `tsc --noEmit` doit rester à zéro erreur sur `client` après modification.
- Pas d'alias `@/` configuré — imports relatifs uniquement.
- Note de Story 1.2 : `npm run lint -w client` rapporte 6 erreurs `no-unused-vars` préexistantes dans `useChat.ts`, `useHistory.ts`, `useProfile.ts` (hors scope, ne pas corriger ici sauf si cette story les touche directement — ce qui n'est pas le cas).

### References

- Architecture — Disclaimer médical : [Source: _bmad-output/planning-artifacts/architecture.md#L192] et [Source: _bmad-output/planning-artifacts/architecture.md#L434-L435]
- Architecture — Project Directory Structure (`DisclaimerModal.tsx`) : [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Architecture — Enforcement Guidelines (accès storage via repository) : [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines]
- Architecture — Naming/Structure Patterns : [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns]
- Epics — Story 1.3 AC : [Source: _bmad-output/planning-artifacts/epics.md#Story 1.3]
- Story 1.2 — Dev Notes (pattern repository, `localStorageRepository`) : [Source: _bmad-output/implementation-artifacts/1-2-repository-de-stockage-et-schema-de-profil.md#Dev Notes]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6 (bmad-create-story workflow)

### Debug Log References

### Completion Notes List

Story 1.3 créée via bmad-create-story le 2026-06-11. Analyse complète : epics.md (Story 1.3 AC), architecture.md (Disclaimer médical, Enforcement Guidelines, Project Directory Structure), Story 1.2 (pattern repository établi, `localStorageRepository` exporté), code source actuel (`App.tsx`, `AppContext.tsx`, `StorageRepository.ts`, `LocalStorageRepository.ts`, `AppRoutes.tsx`).

Point d'attention principal pour le dev agent :
1. L'AC2 exige que le flag soit persisté via `StorageRepository`/`LocalStorageRepository`, pas via `localStorage` direct — il faut donc étendre l'interface et son implémentation (2 nouvelles méthodes async), suivant exactement le pattern établi en Story 1.2.
2. Pas d'i18n disponible (Story 1.6 backlog) — texte du disclaimer en dur en français, cohérent avec les chaînes déjà en dur dans `App.tsx`.
3. Ne pas reproduire le pattern `localStorage` direct utilisé pour `theme` dans `App.tsx` — ce pattern est spécifique au thème et hors scope, ne pas l'étendre ni le "corriger" dans cette story.

Implémentation réalisée le 2026-06-11 :
- `StorageRepository.ts` : ajout des signatures `getDisclaimerAcknowledged()` / `setDisclaimerAcknowledged()`.
- `LocalStorageRepository.ts` : implémentation des deux méthodes via la clé `coach_disclaimer_acknowledged`, suivant le pattern `async`/`Promise` établi.
- `LocalStorageRepository.test.ts` : 2 nouveaux tests (flag absent → `false`, après `setDisclaimerAcknowledged()` → `true`).
- `DisclaimerModal.tsx` : nouveau composant overlay Tailwind, texte en dur en français couvrant les 2 points requis (pas de diagnostic médical, recommandation de consulter un professionnel).
- `DisclaimerModal.test.tsx` : 2 tests (affichage du texte, appel de `onAcknowledge` au clic).
- `App.tsx` : ajout de l'état `showDisclaimer`, lecture du flag au montage via `localStorageRepository.getDisclaimerAcknowledged()`, affichage conditionnel de `DisclaimerModal`, handler `onAcknowledge` appelant `setDisclaimerAcknowledged()`. Le pattern existant `theme`/`localStorage` direct n'a pas été touché.
- `App.test.tsx` (nouveau) : 3 tests couvrant l'affichage initial, la non-réaffichage après acquittement, et le clic sur le bouton de confirmation (fermeture + persistance).

Validation finale : `npm test -w client` → 8 fichiers / 28 tests passent (aucune régression). `tsc --noEmit` sur `client` → zéro erreur.

### File List

- `client/src/repositories/StorageRepository.ts` (modifié)
- `client/src/repositories/LocalStorageRepository.ts` (modifié)
- `client/src/repositories/LocalStorageRepository.test.ts` (modifié)
- `client/src/components/DisclaimerModal.tsx` (nouveau)
- `client/src/components/DisclaimerModal.test.tsx` (nouveau)
- `client/src/App.tsx` (modifié)
- `client/src/App.test.tsx` (nouveau)

## Change Log

- 2026-06-11 : Implémentation complète de la story (flag disclaimer dans `StorageRepository`/`LocalStorageRepository`, composant `DisclaimerModal`, câblage dans `App.tsx`, tests). Statut → review.

