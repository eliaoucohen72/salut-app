interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-w-md w-full bg-light-bg border border-light-border rounded-lg p-6 text-light-text dark:bg-navy-900 dark:border-navy-700 dark:text-warm-white">
        <h2 className="text-lg font-semibold text-accent mb-3">{title}</h2>
        <p className="text-sm mb-4">{message}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onConfirm}
            className="rounded bg-accent px-4 py-2 font-semibold text-navy-950 hover:opacity-90 transition-opacity"
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-light-border bg-light-surface px-4 py-2 text-light-text hover:opacity-90 transition-opacity dark:border-navy-700 dark:bg-navy-800 dark:text-warm-white"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
