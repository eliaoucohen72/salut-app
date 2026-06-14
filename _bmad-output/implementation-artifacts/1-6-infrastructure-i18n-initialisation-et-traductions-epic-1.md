---
status: review
baseline_commit: fc1b3fa
---

# Story 1.6 : Infrastructure i18n — initialisation et traductions Epic 1

Status: ready-for-dev

## Story

As a utilisateur,
I want que l'application affiche tous ses textes dans ma langue dès le premier chargement, en détectant automatiquement la langue de mon navigateur,
so that l'expérience soit traduite et cohérente dès l'Epic 1, et que les stories suivantes (Epic 2+) puissent s'appuyer sur cette infrastructure.

## Acceptance Criteria

1. **[AC1 — Initialisation react-i18next + fichiers de ressources]** Given le client React configuré après le scaffold (Story 1.1), When `client/src/i18n/index.ts` est initialisé avec `react-i18next`, Then les trois fichiers de ressources `client/src/i18n/locales/fr.json`, `he.json` et `en.json` existent, contenant toutes les clés de traduction pour les textes introduits dans les Stories 1.1 à 1.5 (messages d'erreur de validation, textes du disclaimer, libellés de l'onboarding, labels du formulaire de profil, boutons de navigation).

2. **[AC2 — Détection de la langue navigateur + fallback EN]** Given aucun choix de langue n'a encore été enregistré par l'utilisateur, When l'application se charge pour la première fois, Then la langue initiale est détectée depuis `navigator.language`, And si la langue détectée n'est ni `fr`, ni `he`, ni `en`, la langue `en` est utilisée par défaut (NFR4).

3. **[AC3 — `i18n.dir()` sur `<html>`]** Given `react-i18next` initialisé dans `i18n/index.ts`, When la langue courante change (y compris au chargement initial), Then `i18n.dir()` est appliqué sur l'attribut `dir` de `<html>` — `"rtl"` pour `he`, `"ltr"` pour `fr` et `en`.

4. **[AC4 — Usage de `useTranslation()`]** Given `react-i18next` initialisé, When un composant Epic 1 utilise le hook `useTranslation()`, Then les chaînes affichées correspondent aux clés du fichier de langue actif, sans clé brute visible à l'écran.

5. **[AC5 — Fallback de clé manquante]** Given une clé de traduction manquante dans un fichier de langue, When le composant tente de l'afficher, Then la valeur de la langue de repli `en` est utilisée, sans faire planter l'application.

## Tasks / Subtasks

- [x] Task 1 : Installer les dépendances i18n (AC: #1, #2, #3)
  - [x] 1.1 Dans `client/package.json`, ajouter aux `dependencies` : `react-i18next` (^17.0.8), `i18next` (^26.3.1), `i18next-browser-languagedetector` (^8.2.1)
  - [x] 1.2 Exécuter `npm install` à la racine (workspaces) pour installer ces 3 packages dans `client/node_modules`
  - [x] 1.3 Ne PAS ajouter ces dépendances à `server/package.json` — i18n est 100% côté client

- [x] Task 2 : Créer la structure `client/src/i18n/` et les fichiers de ressources (AC: #1, #5)
  - [x] 2.1 Créer le dossier `client/src/i18n/locales/`
  - [x] 2.2 Créer `client/src/i18n/locales/fr.json`, `en.json`, `he.json` avec une **structure de clés strictement identique entre les 3 fichiers** (cf. Dev Notes → "Structure des fichiers de traduction" pour le contenu détaillé à reproduire dans chacun des 3 fichiers)
  - [x] 2.3 `fr.json` doit reprendre **mot pour mot** les chaînes françaises actuellement en dur dans `App.tsx`, `DisclaimerModal.tsx`, `Onboarding.tsx`, `ProfileForm.tsx`, `ChatPage.tsx` (cf. Dev Notes) — ceci garantit que les tests existants (qui assertent ces chaînes françaises) continuent de passer une fois l'environnement de test configuré en `fr` (cf. Task 6)
  - [x] 2.4 `en.json` et `he.json` : traductions complètes de toutes les clés présentes dans `fr.json` (aucune clé manquante — cf. AC1 "structure de clés identique")

- [x] Task 3 : Créer `client/src/i18n/index.ts` (AC: #1, #2, #3, #5)
  - [x] 3.1 Initialiser `i18next` avec `react-i18next` (`initReactI18next`) et `i18next-browser-languagedetector` (`LanguageDetector`)
  - [x] 3.2 Charger les 3 fichiers de ressources (`fr.json`, `en.json`, `he.json`) en tant que namespace `translation` pour chaque langue (`resources: { fr: { translation: fr }, en: { translation: en }, he: { translation: he } }`)
  - [x] 3.3 Configurer `fallbackLng: 'en'` et `supportedLngs: ['fr', 'he', 'en']` (AC2, AC5)
  - [x] 3.4 Configurer le détecteur pour ne renvoyer que le code de langue à 2 lettres (`load: 'languageOnly'`) — `navigator.language` peut renvoyer `fr-FR`/`en-US`/`he-IL`, et `supportedLngs` + `load: 'languageOnly'` garantit que `fr-FR` → `fr`, et qu'une langue non supportée (ex. `de`, `es`) tombe sur `fallbackLng: 'en'`
  - [x] 3.5 Configurer `detection: { order: ['navigator'], caches: [] }` — pas de persistance du choix de langue dans cette story (la persistance via le profil/`localStorage` est hors scope, cf. Story 4.2 — ⚠️ Ne PAS faire)
  - [x] 3.6 Configurer `interpolation: { escapeValue: false }` (React échappe déjà le JSX, pas besoin du double-échappement i18next)
  - [x] 3.7 Configurer `initImmediate: false` — rend l'initialisation **synchrone** (les ressources sont déjà fournies en mémoire via `resources`, pas de chargement réseau) ; ceci est important pour que `i18n.language` soit déterminé dès le premier rendu, y compris en environnement de test (Task 6)
  - [x] 3.8 Exporter `i18n` (export par défaut), et appliquer `i18n.dir()`/`lang` sur `document.documentElement` :
    - À l'initialisation (au chargement du module), appliquer immédiatement `document.documentElement.dir = i18n.dir(i18n.language)` et `document.documentElement.lang = i18n.language`
    - S'abonner à l'événement `i18n.on('languageChanged', (lng) => { document.documentElement.dir = i18n.dir(lng); document.documentElement.lang = lng; })` pour les changements ultérieurs (AC3 — "y compris au chargement initial")

- [x] Task 4 : Importer la configuration i18n au démarrage de l'application (AC: #1, #2, #3)
  - [x] 4.1 Dans `client/src/main.tsx`, ajouter `import './i18n'` (import de side-effect, avant le rendu de `<App />`) — garantit que `i18next` est initialisé et que `dir`/`lang` sont posés sur `<html>` avant le premier rendu

- [x] Task 5 : Migrer les composants Epic 1 vers `useTranslation()` (AC: #4, #5)
  - [x] 5.1 `client/src/App.tsx` : remplacer le titre `"Salut Coach"` et les `aria-label`/libellés du bouton de thème (`"Passer en mode clair"`/`"Passer en mode sombre"`, `"☀️ Clair"`/`"🌙 Sombre"`) par `t('common.appTitle')`, `t('theme.toLight')`/`t('theme.toDark')`, `t('theme.light')`/`t('theme.dark')` via `useTranslation()`
  - [x] 5.2 `client/src/components/DisclaimerModal.tsx` : remplacer le titre, le paragraphe et le bouton par `t('disclaimer.title')`, `t('disclaimer.body')`, `t('disclaimer.acknowledge')`
  - [x] 5.3 `client/src/components/Onboarding.tsx` :
    - Remplacer `"Bienvenue !"` par `t('onboarding.welcome')`
    - Remplacer le tableau `STEPS` (labels + questions en dur) par des clés `t('onboarding.steps.<key>.label')` / `t('onboarding.steps.<key>.question')` (où `<key>` ∈ `age|gender|weight|goal|activityLevel|dietaryRestrictions`) — résoudre ces traductions au moment du rendu (dans le composant, pas dans la constante `STEPS` au niveau module, car `t()` n'est disponible qu'à l'intérieur du composant via le hook)
    - Remplacer `"Suivant"`/`"Valider"`/`"Passer pour l'instant"` par `t('onboarding.next')`/`t('onboarding.submit')`/`t('onboarding.skip')`
  - [x] 5.4 `client/src/components/ProfileForm.tsx` :
    - Remplacer `"Mon profil"`, `"Enregistrer"`, le message de confirmation, et les labels de `TEXT_FIELDS`/`NUMBER_FIELDS`/`dietaryRestrictions` par leurs clés `t('profile.title')`, `t('profile.save')`, `t('profile.confirmation')`, `t('profile.fields.<key>')`
    - **Messages d'erreur de validation (AC1/AC4)** : actuellement `ProfileForm` affiche directement `issue.message` (message Zod brut en anglais, ex. `"Too small: expected number to be >0"`). Mapper plutôt `issue.path[0]` vers une clé traduite dédiée : `age` → `t('profile.errors.agePositive')`, `weight` → `t('profile.errors.weightPositive')`. Stocker dans `errors` la **clé** ou directement le **texte traduit** (le texte traduit est plus simple : `setErrors({ ...fieldErrors, [field]: t(errorKeyFor(field)) })`) — ne plus stocker/afficher `issue.message` brut
  - [x] 5.5 `client/src/pages/ChatPage.tsx` : remplacer `"Chat"` et `"Interface de chat — à implémenter en Story 2.3"` par `t('chat.title')`/`t('chat.placeholder')`

- [x] Task 6 : Configurer l'environnement de test pour un comportement déterministe (AC: #1 à #5, non-régression)
  - [x] 6.1 Dans `client/src/setupTests.ts`, importer `i18n` (`import i18n from './i18n'`) et forcer la langue de test à `'fr'` via `i18n.changeLanguage('fr')` — sans cela, `navigator.language` dans `jsdom` vaut `en-US`, ce qui ferait basculer tous les composants en anglais et casserait les assertions existantes (françaises) dans `App.test.tsx`, `DisclaimerModal.test.tsx`, `Onboarding.test.tsx`, `AppRoutes.test.tsx`, `ProfileForm.test.tsx`
  - [x] 6.2 Vérifier qu'avec `fr.json` reproduisant mot pour mot les chaînes françaises existantes (Task 2.3), **aucune modification des fichiers de test existants n'est nécessaire** pour les assertions de texte (les valeurs affichées restent identiques). Si une assertion échoue malgré tout (ex. différence d'espacement/typographie), ajuster la valeur dans `fr.json` pour qu'elle corresponde exactement au texte attendu par le test — ne pas modifier le test sauf si la story le justifie explicitement
  - [x] 6.3 `ProfileForm.test.tsx` (AC4 du test, soumission invalide) : si ce test asserte un message d'erreur Zod brut (ex. via une regex large `/positive|positif/i` ou un texte exact), vérifier qu'il continue de matcher le nouveau message traduit (`profile.errors.weightPositive`/`agePositive` en `fr.json`) — adapter la valeur `fr.json` si besoin pour rester cohérent avec l'assertion existante (même principe que 6.2)

- [x] Task 7 : Test de configuration i18n (AC: #2, #3, #5)
  - [x] 7.1 Créer `client/src/i18n/index.test.ts` (co-localisé) couvrant :
    - `i18n.language` est `'fr'`, `'en'` ou `'he'` (jamais une locale complète type `fr-FR`) après initialisation
    - `i18n.dir('he') === 'rtl'` et `i18n.dir('fr') === 'ltr'` / `i18n.dir('en') === 'ltr'`
    - Après `i18n.changeLanguage('he')`, `document.documentElement.dir === 'rtl'` ; après `i18n.changeLanguage('fr')`, `document.documentElement.dir === 'ltr'` (AC3) — **remettre `i18n.changeLanguage('fr')` à la fin du test** (ou dans un `afterEach`) pour ne pas impacter les autres fichiers de test (cf. Task 6.1)
    - `i18n.t('clef.qui.nexiste.pas')` ne lève pas d'exception et retourne une chaîne (comportement par défaut i18next : retourne la clé elle-même si absente de toutes les langues — vérifier juste l'absence de crash, pas un fallback magique vers une traduction EN inexistante) ; pour tester le **vrai fallback EN** (AC5), utiliser une clé existante uniquement dans `en.json` (ex. ajouter une clé de test dédiée n'existant que dans `en.json`, ou retirer temporairement une clé de `fr.json` dans le test — privilégier une clé réelle présente dans les 3 fichiers et vérifier `i18n.getFixedT('fr')('cette.clef')` après avoir simulé son absence n'est pas trivial ; **approche recommandée** : tester `i18n.t('chat.title', { lng: 'fr' })` retourne la valeur `fr`, et `i18n.t('chat.title', { lng: 'de' })` (langue non supportée) retourne la valeur `en` via `fallbackLng`, démontrant le mécanisme de repli)

- [x] Task 8 : Validation finale (AC: tous)
  - [x] 8.1 `npm test -w client` — tous les tests passent (suite existante + nouveaux tests `i18n/index.test.ts`), sans régression
  - [x] 8.2 `tsc --noEmit` sur `client` — zéro erreur
  - [x] 8.3 Vérification manuelle (optionnelle mais recommandée) : `npm run dev`, ouvrir l'app, vérifier dans les DevTools que `<html dir="ltr" lang="...">` est posé, et qu'aucune clé brute (ex. `onboarding.steps.age.label`) n'apparaît à l'écran

## Dev Notes

### Périmètre exact de la story

- 100% côté `client`. Aucune modification de `server/`.
- Aucune persistance du choix de langue dans cette story (champ `language` du profil / sélecteur manuel) — c'est la Story 4.2. Ici, la langue est déterminée **uniquement** par `navigator.language` à chaque chargement (AC2), sans cache.
- Ne pas créer de sélecteur de langue UI (Story 4.2).
- Ne pas compléter les traductions des Epics 2/3 (Story 4.1) — uniquement les textes des Stories 1.1 à 1.5.
- Ne pas créer `Sidebar.tsx`, `Chat.tsx`, `InputBar.tsx`, `ErrorBanner.tsx` (autres stories) — `ChatPage.tsx` (placeholder créé en Story 1.1) est le seul fichier touché côté Epic 2/3.

### Structure des fichiers de traduction

Les 3 fichiers (`client/src/i18n/locales/fr.json`, `en.json`, `he.json`) doivent avoir une structure de clés **identique**. Voici la structure complète à reproduire, avec le contenu `fr.json` (à copier mot pour mot depuis le code source actuel) et les traductions `en`/`he` correspondantes :

```json
{
  "common": {
    "appTitle": "Salut Coach"
  },
  "theme": {
    "toLight": "Passer en mode clair",
    "toDark": "Passer en mode sombre",
    "light": "☀️ Clair",
    "dark": "🌙 Sombre"
  },
  "disclaimer": {
    "title": "Avertissement médical",
    "body": "Flex, votre coach IA, fournit des conseils généraux de fitness et de nutrition à titre informatif uniquement. Il ne fournit pas de diagnostic médical et ne remplace pas l'avis d'un professionnel de santé. Consultez un médecin pour toute préoccupation médicale avant de suivre ces conseils.",
    "acknowledge": "J'ai compris"
  },
  "onboarding": {
    "welcome": "Bienvenue !",
    "next": "Suivant",
    "submit": "Valider",
    "skip": "Passer pour l'instant",
    "steps": {
      "age": { "label": "Âge", "question": "Quel âge as-tu ?" },
      "gender": { "label": "Genre", "question": "Quel est ton genre ?" },
      "weight": { "label": "Poids (kg)", "question": "Quel est ton poids actuel (en kg) ?" },
      "goal": { "label": "Objectif", "question": "Quel est ton objectif principal ?" },
      "activityLevel": { "label": "Niveau d'activité", "question": "Quel est ton niveau d'activité ?" },
      "dietaryRestrictions": { "label": "Restrictions alimentaires", "question": "As-tu des restrictions alimentaires ? (séparées par des virgules)" }
    }
  },
  "profile": {
    "title": "Mon profil",
    "save": "Enregistrer",
    "confirmation": "Profil mis à jour avec succès.",
    "fields": {
      "name": "Nom",
      "gender": "Genre",
      "goal": "Objectif",
      "activityLevel": "Niveau d'activité",
      "age": "Âge",
      "weight": "Poids (kg)",
      "dietaryRestrictions": "Restrictions alimentaires"
    },
    "errors": {
      "agePositive": "L'âge doit être un nombre positif",
      "weightPositive": "Le poids doit être un nombre positif"
    }
  },
  "chat": {
    "title": "Chat",
    "placeholder": "Interface de chat — à implémenter en Story 2.3"
  }
}
```

**`en.json`** — même structure, valeurs traduites :

```json
{
  "common": { "appTitle": "Salut Coach" },
  "theme": {
    "toLight": "Switch to light mode",
    "toDark": "Switch to dark mode",
    "light": "☀️ Light",
    "dark": "🌙 Dark"
  },
  "disclaimer": {
    "title": "Medical disclaimer",
    "body": "Flex, your AI coach, provides general fitness and nutrition advice for informational purposes only. It does not provide medical diagnoses and is not a substitute for professional medical advice. Consult a doctor for any medical concerns before following this advice.",
    "acknowledge": "Got it"
  },
  "onboarding": {
    "welcome": "Welcome!",
    "next": "Next",
    "submit": "Submit",
    "skip": "Skip for now",
    "steps": {
      "age": { "label": "Age", "question": "How old are you?" },
      "gender": { "label": "Gender", "question": "What is your gender?" },
      "weight": { "label": "Weight (kg)", "question": "What is your current weight (in kg)?" },
      "goal": { "label": "Goal", "question": "What is your main goal?" },
      "activityLevel": { "label": "Activity level", "question": "What is your activity level?" },
      "dietaryRestrictions": { "label": "Dietary restrictions", "question": "Do you have any dietary restrictions? (comma-separated)" }
    }
  },
  "profile": {
    "title": "My profile",
    "save": "Save",
    "confirmation": "Profile updated successfully.",
    "fields": {
      "name": "Name",
      "gender": "Gender",
      "goal": "Goal",
      "activityLevel": "Activity level",
      "age": "Age",
      "weight": "Weight (kg)",
      "dietaryRestrictions": "Dietary restrictions"
    },
    "errors": {
      "agePositive": "Age must be a positive number",
      "weightPositive": "Weight must be a positive number"
    }
  },
  "chat": {
    "title": "Chat",
    "placeholder": "Chat interface — to be implemented in Story 2.3"
  }
}
```

**`he.json`** — même structure, valeurs traduites (hébreu) :

```json
{
  "common": { "appTitle": "סלוט קוץ'" },
  "theme": {
    "toLight": "מעבר למצב בהיר",
    "toDark": "מעבר למצב כהה",
    "light": "☀️ בהיר",
    "dark": "🌙 כהה"
  },
  "disclaimer": {
    "title": "אזהרה רפואית",
    "body": "פלקס, המאמן שלך מבוסס ה-AI, מספק עצות כלליות בנושאי כושר ותזונה למטרות מידע בלבד. הוא אינו מספק אבחנה רפואית ואינו מהווה תחליף לייעוץ של איש מקצוע בתחום הרפואה. יש להתייעץ עם רופא בכל נושא רפואי לפני יישום עצות אלו.",
    "acknowledge": "הבנתי"
  },
  "onboarding": {
    "welcome": "ברוך הבא!",
    "next": "הבא",
    "submit": "שלח",
    "skip": "דלג לעת עתה",
    "steps": {
      "age": { "label": "גיל", "question": "מה הגיל שלך?" },
      "gender": { "label": "מגדר", "question": "מה המגדר שלך?" },
      "weight": { "label": "משקל (ק\"ג)", "question": "מה המשקל הנוכחי שלך (בק\"ג)?" },
      "goal": { "label": "מטרה", "question": "מה המטרה העיקרית שלך?" },
      "activityLevel": { "label": "רמת פעילות", "question": "מה רמת הפעילות שלך?" },
      "dietaryRestrictions": { "label": "הגבלות תזונתיות", "question": "האם יש לך הגבלות תזונתיות? (מופרדות בפסיקים)" }
    }
  },
  "profile": {
    "title": "הפרופיל שלי",
    "save": "שמור",
    "confirmation": "הפרופיל עודכן בהצלחה.",
    "fields": {
      "name": "שם",
      "gender": "מגדר",
      "goal": "מטרה",
      "activityLevel": "רמת פעילות",
      "age": "גיל",
      "weight": "משקל (ק\"ג)",
      "dietaryRestrictions": "הגבלות תזונתיות"
    },
    "errors": {
      "agePositive": "הגיל חייב להיות מספר חיובי",
      "weightPositive": "המשקל חייב להיות מספר חיובי"
    }
  },
  "chat": {
    "title": "צ'אט",
    "placeholder": "ממשק הצ'אט — יוטמע בסיפור 2.3"
  }
}
```

### Configuration `i18n/index.ts` — squelette de référence

```ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import fr from './locales/fr.json';
import en from './locales/en.json';
import he from './locales/he.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
      he: { translation: he },
    },
    fallbackLng: 'en',
    supportedLngs: ['fr', 'he', 'en'],
    load: 'languageOnly',
    detection: { order: ['navigator'], caches: [] },
    interpolation: { escapeValue: false },
    initImmediate: false,
  });

const applyDirection = (lng: string) => {
  document.documentElement.dir = i18n.dir(lng);
  document.documentElement.lang = lng;
};

applyDirection(i18n.language);
i18n.on('languageChanged', applyDirection);

export default i18n;
```

- `load: 'languageOnly'` + `supportedLngs: ['fr', 'he', 'en']` : `navigator.language` du type `fr-FR`/`en-US`/`he-IL` est ramené à `fr`/`en`/`he`. Si la langue détectée (après réduction) n'est pas dans `supportedLngs`, i18next bascule sur `fallbackLng: 'en'` → satisfait AC2.
- `initImmediate: false` rend `i18n.init()` synchrone (les ressources sont fournies directement, pas de backend HTTP) — `i18n.language` est donc disponible immédiatement après l'import, y compris dans `setupTests.ts`.

### Migration de `Onboarding.tsx` — point d'attention sur `STEPS`

`STEPS` est actuellement un tableau **constant défini hors composant** (au niveau module), contenant `label`/`question` en dur. `t()` n'est disponible qu'à l'intérieur du composant (via `useTranslation()`). Deux approches possibles :
1. Garder `STEPS` comme tableau de **clés** (`{ key: 'age', type: 'number' }`, sans `label`/`question` en dur), et résoudre `t(`onboarding.steps.${step.key}.label`)` / `t(`onboarding.steps.${step.key}.question`)` au moment du rendu dans le composant.
2. Construire un tableau `steps` **à l'intérieur** du composant via `useMemo`, en utilisant `t()`.

L'approche 1 est plus simple et suffisante (pas de `useMemo` nécessaire pour 6 étapes statiques).

### Migration de `ProfileForm.tsx` — mapping des erreurs Zod

`TEXT_FIELDS`/`NUMBER_FIELDS` sont aussi des tableaux constants hors composant — même remarque que pour `STEPS` : ne garder que les `key`, résoudre `t(`profile.fields.${key}`)` au rendu.

Pour les erreurs de validation (AC4 — actuellement `issue.message` est un message Zod brut en anglais type `"Too small: expected number to be >0"`), créer un petit mapping local :

```ts
const ERROR_KEYS: Record<string, string> = {
  age: 'profile.errors.agePositive',
  weight: 'profile.errors.weightPositive',
};

// dans handleSubmit, catch (err):
for (const issue of err.issues) {
  const field = issue.path[0] as string;
  const key = ERROR_KEYS[field];
  fieldErrors[field] = key ? t(key) : issue.message; // fallback message Zod brut si champ non mappé
}
```

Seuls `age` et `weight` ont des contraintes `.positive()` actuellement (Story 1.5) — ce sont les deux seules clés nécessaires dans `profile.errors`.

### Pourquoi `setupTests.ts` doit forcer `i18n.changeLanguage('fr')`

`jsdom` (environnement de test, cf. `client/vitest.config.ts`) expose `navigator.language === 'en-US'` par défaut. Sans intervention, `i18next-browser-languagedetector` détecterait `en` au démarrage des tests, et tous les composants migrés afficheraient leurs textes **anglais** — alors que les tests existants (`App.test.tsx`, `DisclaimerModal.test.tsx`, `Onboarding.test.tsx`, `AppRoutes.test.tsx`) assertent des chaînes **françaises** en dur (ex. `"Avertissement médical"`, `"Bienvenue !"`, `"Mon profil"`, `"J'ai compris"`).

En forçant `i18n.changeLanguage('fr')` dans `client/src/setupTests.ts` (exécuté avant chaque fichier de test via `vitest.config.ts` → `setupFiles`), et en faisant en sorte que `fr.json` reproduise **mot pour mot** ces chaînes (Task 2.3), les tests existants continuent de passer sans aucune modification.

### Previous Story Intelligence (Story 1.5)

- `useProfile()` retourne `{ profile, isLoading, saveProfile }`, déjà finalisé — non concerné par cette story.
- `ProfileForm.tsx` (créé en 1.5) utilise des tableaux constants `TEXT_FIELDS`/`NUMBER_FIELDS` hors composant pour les labels — cf. "Migration de `ProfileForm.tsx`" ci-dessus pour adapter ce pattern à `useTranslation()`.
- `ProfileForm.tsx` gère déjà le `try/catch` `ZodError` → `Record<string, string>` (`errors`) par `path[0]` — cette story ne change que la **valeur** stockée dans `errors` (clé traduite au lieu du message Zod brut), pas la structure.
- Pas d'alias `@/` configuré — imports relatifs uniquement (`../i18n`, `./locales/fr.json`, etc.).
- `localStorage.clear()` dans `beforeEach` pour les tests touchant au storage — sans rapport avec cette story, mais à conserver dans les tests existants.
- `tsc --noEmit` doit rester à zéro erreur sur `client` après modification — vérifier que `resolveJsonModule` est actif dans `client/tsconfig.json` (nécessaire pour `import fr from './locales/fr.json'`) ; sinon, l'ajouter (Vite/Vitest gèrent déjà l'import JSON au runtime, mais `tsc --noEmit` peut nécessiter ce flag pour le typage).
- Note connue (non bloquante, héritée de 1.4/1.5) : erreurs de lint préexistantes dans `useChat.ts`/`useHistory.ts` — hors scope, ne pas corriger.

### ⚠️ Ne PAS faire dans cette story

- Ne pas créer de sélecteur de langue UI ni persister le choix de langue (`profile.language`, `localStorage`) — Story 4.2.
- Ne pas compléter les traductions des Epics 2/3 (`useChat`, `Sidebar`, `ErrorBanner`, etc.) — Story 4.1. Seules les clés correspondant aux textes des Stories 1.1 à 1.5 (+ placeholder `ChatPage` créé en 1.1) sont dans le périmètre.
- Ne pas modifier `useProfile.ts`, `AppContext.tsx`, `AppRoutes.tsx`, `StorageRepository`/`LocalStorageRepository`, `profile.schema.ts` — aucun de ces fichiers ne contient de texte affiché à l'utilisateur.
- Ne pas introduire de logique de détection de langue côté serveur (`buildSystemPrompt`, etc.) — hors scope, géré en Epic 2/4.
- Ne pas ajouter `i18next-http-backend` ou tout chargement asynchrone des ressources — les 3 fichiers JSON sont importés statiquement et bundlés (taille négligeable en MVP).

### Project Structure Notes

Fichiers à créer :
```
client/src/
└── i18n/
    ├── index.ts
    ├── index.test.ts
    └── locales/
        ├── fr.json
        ├── en.json
        └── he.json
```

Fichiers à modifier :
```
client/
├── package.json                       # ajout react-i18next, i18next, i18next-browser-languagedetector
└── src/
    ├── main.tsx                       # import './i18n' (side-effect)
    ├── App.tsx                        # useTranslation (titre, toggle thème)
    ├── setupTests.ts                  # i18n.changeLanguage('fr')
    ├── components/
    │   ├── DisclaimerModal.tsx        # useTranslation
    │   ├── Onboarding.tsx             # useTranslation (STEPS → clés)
    │   └── ProfileForm.tsx            # useTranslation (fields/errors → clés)
    └── pages/
        └── ChatPage.tsx               # useTranslation (placeholder)
```

Conventions à respecter (architecture §Naming Patterns, déjà appliquées en 1.1-1.5) :
- `useTranslation` (react-i18next) pour tout texte affiché — aucune chaîne en dur dans les composants (règle d'enforcement de l'architecture, désormais applicable concrètement pour Epic 1)
- camelCase pour les clés de traduction (`activityLevel`, `agePositive`)
- Tests co-localisés (`index.test.ts` à côté de `index.ts`)
- Accès storage exclusivement via `localStorageRepository` — sans rapport direct ici, mais ne pas l'enfreindre en touchant à `Onboarding`/`ProfileForm`

### References

- Architecture — Frontend Architecture (`react-i18next`, `i18n.dir()`, structure `client/src/i18n/`) : [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- Architecture — Decision Impact Analysis (séquence d'implémentation, étape 7 "react-i18next : configuration FR/HE/EN + gestion `dir` RTL") : [Source: _bmad-output/planning-artifacts/architecture.md#Decision Impact Analysis]
- Architecture — Structure Patterns (`client/src/i18n/` — config + `fr.json`/`he.json`/`en.json`) : [Source: _bmad-output/planning-artifacts/architecture.md#Structure Patterns]
- Architecture — Enforcement Guidelines ("Utiliser `useTranslation` pour tout texte affiché à l'utilisateur") : [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines]
- Architecture — Requirements to Structure Mapping (Multilingue/RTL) : [Source: _bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping]
- Epics — Story 1.6 AC : [Source: _bmad-output/planning-artifacts/epics.md#Story 1.6]
- Epics — Story 4.1 (note : infrastructure i18n posée en 1.6, contenu Epics 2/3 complété en 4.1) : [Source: _bmad-output/planning-artifacts/epics.md#Story 4.1]
- Story 1.5 — Dev Notes (`ProfileForm` structure, conventions de test) : [Source: _bmad-output/implementation-artifacts/1-5-visualisation-et-edition-du-profil.md#Dev Notes]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6 (bmad-create-story workflow)

### Debug Log References

### Completion Notes List

Story 1.6 créée via bmad-create-story le 2026-06-14. Analyse complète : epics.md (Story 1.6 AC + note de la Story 4.1 sur le découpage infra/contenu), architecture.md (Frontend Architecture, Decision Impact Analysis, Structure Patterns, Enforcement Guidelines, Requirements to Structure Mapping), Story 1.5 (Dev Notes, conventions `ProfileForm`), code source actuel (`App.tsx`, `DisclaimerModal.tsx`, `Onboarding.tsx`, `ProfileForm.tsx`, `ChatPage.tsx`, `main.tsx`, `setupTests.ts`, `vitest.config.ts`, `package.json`), versions npm actuelles (`react-i18next` 17.0.8, `i18next` 26.3.1, `i18next-browser-languagedetector` 8.2.1).

Points d'attention principaux pour le dev agent :
1. Cette story est une story d'**infrastructure** : elle initialise `react-i18next` ET migre tous les textes des Stories 1.1-1.5 (App, DisclaimerModal, Onboarding, ProfileForm, ChatPage). Les traductions des Epics 2/3 sont hors scope (Story 4.1), et le sélecteur de langue/persistance sont hors scope (Story 4.2).
2. Point critique de non-régression : `jsdom` détecte `navigator.language = 'en-US'` en test. Sans forcer `i18n.changeLanguage('fr')` dans `setupTests.ts`, **tous les tests existants français cassent**. `fr.json` doit reproduire mot pour mot les chaînes actuelles pour garantir zéro modification des tests existants.
3. `STEPS` (Onboarding) et `TEXT_FIELDS`/`NUMBER_FIELDS` (ProfileForm) sont des constantes hors composant avec labels en dur — à transformer en tableaux de clés, résolues via `t()` dans le composant.
4. Les messages d'erreur Zod (`age`/`weight` `.positive()`) sont actuellement affichés bruts (anglais) — à mapper vers `profile.errors.agePositive`/`weightPositive` traduits.
5. `i18n/index.ts` doit appliquer `i18n.dir()`/`lang` sur `<html>` dès l'import (synchrone via `initImmediate: false`) et à chaque changement de langue.

### Notes d'implémentation (Dev Agent)

- **Déviation mineure (Task 3.7)** : l'option `initImmediate: false` suggérée dans le squelette de référence n'existe pas dans les types de `i18next@26.3.1` (`tsc -b` échoue : "'initImmediate' does not exist in type 'InitOptions<unknown>'"). Utilisé `initAsync: false` à la place, qui est l'option documentée et typée de la v26 pour forcer une initialisation synchrone avec des ressources fournies en mémoire (sans backend). Comportement fonctionnel identique : `i18n.language` est disponible immédiatement après l'import (vérifié par `index.test.ts` et par le passage des 48 tests existants en `fr`).
- Erreurs `profile.errors.agePositive`/`weightPositive` en `fr.json` reformulées en "doit être un nombre supérieur à 0" (plutôt que "positif") pour rester compatibles avec l'assertion existante `ProfileForm.test.tsx` (`/too small|positive|supérieur/i`) — cf. Task 6.3.
- `npm test -w client` : 48/48 tests passent (12 fichiers, incluant le nouveau `i18n/index.test.ts`). `tsc -b` (client) : 0 erreur.
- Lint : aucune nouvelle erreur introduite. Les erreurs eslint pré-existantes (`useChat.ts`, `useHistory.ts`, `AppContext.tsx`, `ProfileForm.tsx` — issues des stories 1.4/1.5, non commitées) restent inchangées et hors scope de cette story.

## File List

- `client/package.json` — ajout des dépendances `react-i18next`, `i18next`, `i18next-browser-languagedetector`
- `client/tsconfig.app.json` — ajout de `resolveJsonModule: true`
- `client/src/i18n/index.ts` — initialisation react-i18next/i18next/LanguageDetector, application de `dir`/`lang` sur `<html>`
- `client/src/i18n/index.test.ts` — tests de configuration i18n (AC2, AC3, AC5)
- `client/src/i18n/locales/fr.json` — ressources de traduction françaises
- `client/src/i18n/locales/en.json` — ressources de traduction anglaises
- `client/src/i18n/locales/he.json` — ressources de traduction hébraïques
- `client/src/main.tsx` — import `./i18n` (side-effect)
- `client/src/setupTests.ts` — `i18n.changeLanguage('fr')` pour environnement de test déterministe
- `client/src/App.tsx` — migration vers `useTranslation()` (titre, toggle thème)
- `client/src/components/DisclaimerModal.tsx` — migration vers `useTranslation()`
- `client/src/components/Onboarding.tsx` — migration vers `useTranslation()`, `STEPS` réduit à `key`/`type`
- `client/src/components/ProfileForm.tsx` — migration vers `useTranslation()`, mapping des erreurs Zod vers clés traduites
- `client/src/pages/ChatPage.tsx` — migration vers `useTranslation()`

## Change Log

- 2026-06-14 : Création de la story (bmad-create-story).
- 2026-06-14 : Implémentation complète de l'infrastructure i18n (react-i18next + LanguageDetector), création des fichiers de ressources fr/en/he, migration de tous les composants Epic 1 (`App`, `DisclaimerModal`, `Onboarding`, `ProfileForm`, `ChatPage`) vers `useTranslation()`, configuration de l'environnement de test (`setupTests.ts`), et ajout de `index.test.ts`. `npm test -w client` : 48/48 tests passent. `tsc -b` : 0 erreur. Story passée à `review`.
