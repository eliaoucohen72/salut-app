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
