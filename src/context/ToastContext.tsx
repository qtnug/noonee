'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X, ExternalLink } from 'lucide-react';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastItem {
  id: string;
  type?: 'success' | 'error' | 'info';
  title?: string;
  message: string;
  duration?: number;
  action?: ToastAction;
}

interface ToastContextType {
  showToast: (toast: Omit<ToastItem, 'id'>) => void;
  success: (message: string, action?: ToastAction, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, action?: ToastAction, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type = 'success', title, message, duration = 3500, action }: Omit<ToastItem, 'id'>) => {
      const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const newToast: ToastItem = { id, type, title, message, duration, action };

      setToasts((prev) => [...prev.slice(-3), newToast]); // Keep max 4 toasts at a time

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback(
    (message: string, action?: ToastAction, title?: string) => {
      showToast({ type: 'success', title, message, action });
    },
    [showToast]
  );

  const error = useCallback(
    (message: string, title?: string) => {
      showToast({ type: 'error', title, message });
    },
    [showToast]
  );

  const info = useCallback(
    (message: string, action?: ToastAction, title?: string) => {
      showToast({ type: 'info', title, message, action });
    },
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, success, error, info }}>
      {children}

      {/* Floating Toasts Viewport */}
      <div
        aria-live="assertive"
        className="fixed top-4 right-4 sm:top-5 sm:right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((t) => {
          const isSuccess = t.type === 'success';
          const isError = t.type === 'error';

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 sm:p-4 rounded-xl shadow-xl border backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-3 ${
                isSuccess
                  ? 'bg-white/95 text-[#0f172a] border-[#bbf7d0] shadow-emerald-500/10'
                  : isError
                  ? 'bg-white/95 text-[#0f172a] border-[#fecdd3] shadow-rose-500/10'
                  : 'bg-white/95 text-[#0f172a] border-[#fed7aa] shadow-amber-500/10'
              }`}
            >
              {/* Icon */}
              <div className="shrink-0 mt-0.5">
                {isSuccess && (
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}
                {isError && (
                  <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                )}
                {!isSuccess && !isError && (
                  <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                    <Info className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* Text content */}
              <div className="flex-1 min-w-0 pr-1">
                {t.title && (
                  <h4 className="text-[13px] font-bold leading-tight mb-0.5 text-[#0f172a]">
                    {t.title}
                  </h4>
                )}
                <p className="text-[12px] text-[#475569] leading-snug font-medium line-clamp-2">
                  {t.message}
                </p>

                {t.action && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        t.action?.onClick();
                        removeToast(t.id);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#e31837] hover:text-[#be0e27] bg-[#fff1f2] hover:bg-[#ffe4e6] px-2.5 py-1 rounded-md border border-[#fecdd3] transition-colors cursor-pointer"
                    >
                      <span>{t.action.label}</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors shrink-0 cursor-pointer"
                aria-label="Đóng thông báo"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
