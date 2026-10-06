import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  description?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 left-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl border shadow-lg backdrop-blur-md flex items-start gap-3 transition-all duration-300 animate-in slide-in-from-bottom-5 ${
              isSuccess
                ? 'bg-emerald-50/95 border-emerald-200 text-emerald-900'
                : isError
                ? 'bg-red-50/95 border-red-200 text-red-900'
                : 'bg-blue-50/95 border-blue-200 text-blue-900'
            }`}
          >
            {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
            {isError && <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />}
            {!isSuccess && !isError && <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />}

            <div className="flex-1 text-right">
              <div className="font-black text-sm">{toast.title}</div>
              {toast.description && (
                <div className="text-xs font-semibold opacity-90 mt-0.5">
                  {toast.description}
                </div>
              )}
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
