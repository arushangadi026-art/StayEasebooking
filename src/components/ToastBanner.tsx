import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export interface ToastMessage {
  id: number;
  type: 'success' | 'error';
  text: string;
}

interface ToastBannerProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

export function ToastBanner({ toast, onDismiss }: ToastBannerProps) {
  if (!toast) return null;

  const isSuccess = toast.type === 'success';

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 max-w-md w-[calc(100%-2.5rem)]"
    >
      <div
        className={`flex items-start gap-3 px-4 py-3.5 rounded-xl border shadow-lg ${
          isSuccess
            ? 'bg-[#FFFDF9] border-[#B9CBB9] text-[#27422D]'
            : 'bg-[#FFFDF9] border-[#DFB5AE] text-[#7D2922]'
        }`}
      >
        {isSuccess ? (
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-[#3A5A40]" />
        ) : (
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-[#9E3B33]" />
        )}
        <p className="text-sm font-medium leading-snug flex-1">{toast.text}</p>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="p-1 rounded hover:bg-[#F2EAE0] text-[#6A5344] cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
