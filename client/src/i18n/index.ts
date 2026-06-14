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
    initAsync: false,
  });

const applyDirection = (lng: string) => {
  document.documentElement.dir = i18n.dir(lng);
  document.documentElement.lang = lng;
};

applyDirection(i18n.language);
i18n.on('languageChanged', applyDirection);

export default i18n;
