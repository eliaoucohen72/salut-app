import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserRouter } from 'react-router-dom';
import { AppContextProvider } from './context/AppContext';
import AppRoutes from './routes/AppRoutes';
import DisclaimerModal from './components/DisclaimerModal';
import LanguageSelector from './components/LanguageSelector';
import { localStorageRepository } from './repositories/LocalStorageRepository';
import { useProfile } from './hooks/useProfile';

function AppShell() {
  const { t, i18n } = useTranslation();
  const { profile, isLoading, saveProfile } = useProfile();
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    return saved !== null ? saved === 'dark' : true; // dark par défaut
  });

  const [showDisclaimer, setShowDisclaimer] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

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

  useEffect(() => {
    if (isLoading) return;

    if (profile?.language) {
      i18n.changeLanguage(profile.language);
    } else {
      localStorageRepository.getLanguage().then((savedLang) => {
        if (savedLang) i18n.changeLanguage(savedLang);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  const handleChangeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    if (profile) {
      saveProfile({ ...profile, language: lang });
    } else {
      localStorageRepository.setLanguage(lang);
    }
  };

  return (
    <div className="flex flex-col h-full bg-light-bg text-light-text dark:bg-navy-950 dark:text-warm-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-light-surface border-b border-light-border dark:bg-navy-900 dark:border-navy-700">
        <span className="text-accent font-semibold text-lg">{t('common.appTitle')}</span>
        <div className="flex items-center gap-2">
          <LanguageSelector onChangeLanguage={handleChangeLanguage} />
          <button
            type="button"
            onClick={() => setIsDark((d) => !d)}
            aria-label={isDark ? t('theme.toLight') : t('theme.toDark')}
            className="px-3 py-1.5 rounded text-sm border border-light-border hover:border-accent dark:border-navy-700 transition-colors"
          >
            {isDark ? t('theme.light') : t('theme.dark')}
          </button>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="flex-1 overflow-auto">
        <AppRoutes />
      </main>
      {showDisclaimer && <DisclaimerModal onAcknowledge={handleAcknowledge} />}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContextProvider>
        <AppShell />
      </AppContextProvider>
    </BrowserRouter>
  );
}

export default App;
