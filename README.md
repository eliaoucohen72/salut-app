# Life Coach AI

*[Français](#français) | [English](#english)*

---

## Français

Une application de coaching personnel basée sur l'IA, spécialisée en sport, nutrition et qualité de vie — pas un simple assistant de chat générique.

### En quoi cette application est un "life coach" et non un assistant IA générique

- **Persona dédiée** : l'assistant ("Flex") est défini par un system prompt spécialisé en sport, nutrition et qualité de vie, avec un ton chaleureux, motivant et sans jugement ([server/src/lib/systemPrompt.ts](server/src/lib/systemPrompt.ts)).
- **Profil utilisateur persistant** : âge, poids, objectif, niveau d'activité, restrictions alimentaires sont enregistrés localement et injectés dans chaque conversation pour personnaliser les conseils ([client/src/schemas/profile.schema.ts](client/src/schemas/profile.schema.ts)).
- **Onboarding guidé** : un parcours d'accueil en plusieurs étapes collecte le profil avant la première utilisation ([client/src/components/Onboarding.tsx](client/src/components/Onboarding.tsx)).
- **Check-in quotidien proactif** : à l'ouverture d'une nouvelle conversation, le coach prend l'initiative et propose un check-in (humeur, progression vers l'objectif) plutôt qu'un écran de chat vide ([client/src/hooks/useChat.ts](client/src/hooks/useChat.ts)).
- **Calcul automatique de l'IMC** : à partir du poids et de la taille enregistrés, l'IMC et sa catégorie sont calculés et affichés directement sur la page profil ([client/src/lib/bmi.ts](client/src/lib/bmi.ts)).
- **Mise à jour des données personnelles** : l'utilisateur peut modifier à tout moment son profil (âge, poids, taille, objectif, etc.) depuis la page profil ([client/src/components/ProfileForm.tsx](client/src/components/ProfileForm.tsx)).
- **Disclaimer santé** : un avertissement explicite est affiché et doit être accepté avant utilisation, conforme aux bonnes pratiques pour les conseils liés à la santé ([client/src/components/DisclaimerModal.tsx](client/src/components/DisclaimerModal.tsx)).
- **Adaptation linguistique** : l'application répond dans la langue de l'utilisateur (FR/EN/HE supportés), avec repli sur l'anglais en cas d'ambiguïté.

### Structure du projet

Ce dépôt est un monorepo npm workspaces :

- [`client/`](client/) — application React + TypeScript + Vite (UI de chat, onboarding, profil)
- [`server/`](server/) — API Express + TypeScript (proxy vers le LLM via Groq)

### Démarrage

```bash
npm install
npm run dev    # lance le client et le serveur en parallèle
```

```bash
npm run build  # build client + serveur
npm start       # démarre le serveur en production
```

---

## English

An AI-powered personal coaching application focused on sport, nutrition, and quality of life — not just a generic chat assistant.

### What makes this app a "life coach" rather than a generic AI assistant

- **Dedicated persona**: the assistant ("Flex") is defined by a system prompt specialized in sport, nutrition, and quality of life, with a warm, motivating, non-judgmental tone ([server/src/lib/systemPrompt.ts](server/src/lib/systemPrompt.ts)).
- **Persistent user profile**: age, weight, goal, activity level, and dietary restrictions are stored locally and injected into every conversation to personalize advice ([client/src/schemas/profile.schema.ts](client/src/schemas/profile.schema.ts)).
- **Guided onboarding**: a multi-step welcome flow collects the user's profile before first use ([client/src/components/Onboarding.tsx](client/src/components/Onboarding.tsx)).
- **Proactive daily check-in**: when opening a new conversation, the coach takes the initiative and starts a check-in (mood, progress toward the goal) instead of showing an empty chat screen ([client/src/hooks/useChat.ts](client/src/hooks/useChat.ts)).
- **Automatic BMI calculation**: based on the stored weight and height, the BMI and its category are computed and shown directly on the profile page ([client/src/lib/bmi.ts](client/src/lib/bmi.ts)).
- **Editable personal data**: users can update their profile (age, weight, height, goal, etc.) at any time from the profile page ([client/src/components/ProfileForm.tsx](client/src/components/ProfileForm.tsx)).
- **Health disclaimer**: an explicit warning is shown and must be acknowledged before use, in line with best practices for health-related advice ([client/src/components/DisclaimerModal.tsx](client/src/components/DisclaimerModal.tsx)).
- **Language adaptation**: the app responds in the user's language (FR/EN/HE supported), defaulting to English when ambiguous.

### Project structure

This repository is an npm workspaces monorepo:

- [`client/`](client/) — React + TypeScript + Vite app (chat UI, onboarding, profile)
- [`server/`](server/) — Express + TypeScript API (LLM proxy via Groq)

### Getting started

```bash
npm install
npm run dev    # runs client and server in parallel
```

```bash
npm run build  # builds client + server
npm start       # starts the server in production
```
