import { useTranslation } from 'react-i18next';

interface DisclaimerModalProps {
  onAcknowledge: () => void;
}

export default function DisclaimerModal({ onAcknowledge }: DisclaimerModalProps) {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-w-md w-full bg-navy-900 border border-navy-700 rounded-lg p-6 text-warm-white">
        <h2 className="text-lg font-semibold text-accent mb-3">{t('disclaimer.title')}</h2>
        <p className="text-sm mb-4">{t('disclaimer.body')}</p>
        <button
          type="button"
          onClick={onAcknowledge}
          className="w-full px-4 py-2 rounded bg-accent text-navy-950 font-semibold hover:opacity-90 transition-opacity"
        >
          {t('disclaimer.acknowledge')}
        </button>
      </div>
    </div>
  );
}
