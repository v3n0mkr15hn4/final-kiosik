import React, { createContext, useCallback, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export const ToastContext = createContext(null);

const typeStyles = {
  success: {
    icon: CheckCircle2,
    className: 'border-green-200 bg-green-50 text-green-800',
  },
  error: {
    icon: AlertCircle,
    className: 'border-red-200 bg-red-50 text-red-800',
  },
  info: {
    icon: Info,
    className: 'border-blue-200 bg-blue-50 text-blue-800',
  },
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((current) => [...current, { id, message, type }]);

    window.setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  const value = useMemo(() => ({
    showToast,
    success: (message, duration) => showToast(message, 'success', duration),
    error: (message, duration) => showToast(message, 'error', duration),
    info: (message, duration) => showToast(message, 'info', duration),
  }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-[10000] w-[min(92vw,28rem)] space-y-3">
        {toasts.map((toast) => {
          const style = typeStyles[toast.type] || typeStyles.info;
          const Icon = style.icon;

          return (
            <div
              key={toast.id}
              role="status"
              aria-live="polite"
              className={`rounded-xl border shadow-lg p-4 animate-slide-up ${style.className}`}
            >
              <div className="flex items-start gap-3">
                <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm sm:text-base font-semibold leading-snug flex-1">{toast.message}</p>
                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="rounded-md p-1 hover:bg-black/5 transition-colors"
                  aria-label="Close notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
