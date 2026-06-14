import { useTranslation } from 'react-i18next';

interface LanguageSelectorProps {
  onChangeLanguage: (lang: string) => void;
}

export default function LanguageSelector({ onChangeLanguage }: LanguageSelectorProps) {
  const { t, i18n } = useTranslation();

  return (
    <select
      aria-label={t('language.selectorLabel')}
      value={i18n.language}
      onChange={(e) => onChangeLanguage(e.target.value)}
      className="rounded border border-light-border bg-light-bg px-3 py-1.5 text-sm text-light-text focus:outline-none focus:border-accent dark:border-navy-700 dark:bg-navy-900 dark:text-warm-white"
    >
      <option value="fr">Français</option>
      <option value="he">עברית</option>
      <option value="en">English</option>
    </select>
  );
}
