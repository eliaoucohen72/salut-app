interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
}

export default function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  if (!message) return null;

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-red-100 text-red-900 dark:bg-red-900/60 dark:text-warm-white px-4 py-2">
      <span>{message}</span>
      {onDismiss && (
        <button type="button" onClick={onDismiss} className="text-red-900 dark:text-warm-white" aria-label="dismiss">
          ✕
        </button>
      )}
    </div>
  );
}
