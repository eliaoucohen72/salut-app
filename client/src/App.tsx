import { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppContextProvider } from './context/AppContext';
import AppRoutes from './routes/AppRoutes';
import DisclaimerModal from './components/DisclaimerModal';
import { localStorageRepository } from './repositories/LocalStorageRepository';

function App() {
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

  return (
    <BrowserRouter>
      <AppContextProvider>
        <div className="flex flex-col h-full bg-navy-950 text-warm-white dark:bg-navy-950 dark:text-warm-white">
          {/* Header */}
          <header className="flex items-center justify-between px-6 py-3 bg-navy-900 border-b border-navy-700">
            <span className="text-accent font-semibold text-lg">Salut Coach</span>
            <button
              type="button"
              onClick={() => setIsDark((d) => !d)}
              aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
              className="px-3 py-1.5 rounded text-sm border border-navy-700 hover:border-accent transition-colors"
            >
              {isDark ? '☀️ Clair' : '🌙 Sombre'}
            </button>
          </header>

          {/* Contenu principal */}
          <main className="flex-1 overflow-auto">
            <AppRoutes />
          </main>
        </div>
        {showDisclaimer && <DisclaimerModal onAcknowledge={handleAcknowledge} />}
      </AppContextProvider>
    </BrowserRouter>
  );
}

export default App;
