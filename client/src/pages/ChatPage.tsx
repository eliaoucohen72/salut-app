import { useTranslation } from 'react-i18next';

export default function ChatPage() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-full p-8">
      <h1 className="text-2xl font-semibold text-warm-white dark:text-warm-white">
        {t('chat.title')}
      </h1>
      <p className="mt-2 text-warm-gray">{t('chat.placeholder')}</p>
    </div>
  );
}
