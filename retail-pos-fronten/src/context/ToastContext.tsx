"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration: number;
  createdAt: number;
}

interface ToastContextType {
  toast: {
    success: (title: string, description?: string, duration?: number) => string;
    error: (title: string, description?: string, duration?: number) => string;
    warning: (title: string, description?: string, duration?: number) => string;
    info: (title: string, description?: string, duration?: number) => string;
    dismiss: (id: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context.toast;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (
      type: ToastType,
      title: string,
      description?: string,
      duration: number = 4000
    ) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newToast: ToastItem = {
        id,
        type,
        title,
        description,
        duration,
        createdAt: Date.now(),
      };

      setToasts((prev) => {
        // Limit to max 4 visible toasts at a time
        const updated = [...prev, newToast];
        if (updated.length > 4) {
          return updated.slice(updated.length - 4);
        }
        return updated;
      });

      return id;
    },
    []
  );

  const toast = {
    success: (title: string, description?: string, duration?: number) =>
      addToast("success", title, description, duration),
    error: (title: string, description?: string, duration?: number) =>
      addToast("error", title, description, duration),
    warning: (title: string, description?: string, duration?: number) =>
      addToast("warning", title, description, duration),
    info: (title: string, description?: string, duration?: number) =>
      addToast("info", title, description, duration),
    dismiss,
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast Notification Container in Bottom-Right with full responsive adaptation */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 z-[9999] flex w-[calc(100vw-2rem)] sm:w-96 max-w-sm flex-col gap-2.5 print:hidden"
      >
        {toasts.map((item) => (
          <ToastCard key={item.id} item={item} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (item.duration <= 0) return;

    const startTime = Date.now();
    const endTime = startTime + item.duration;

    const interval = setInterval(() => {
      if (isPaused) return;

      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      const pct = (remaining / item.duration) * 100;
      setProgress(pct);

      if (remaining <= 0) {
        clearInterval(interval);
        onDismiss(item.id);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [item.id, item.duration, isPaused, onDismiss]);

  const typeConfig = {
    success: {
      icon: <CheckCircle2 size={18} className="text-emerald-600" />,
      iconBg: "bg-emerald-50 border-emerald-200/60 text-emerald-600",
      border: "border-emerald-200/70",
      barBg: "bg-emerald-500",
      badge: "Success",
    },
    error: {
      icon: <AlertCircle size={18} className="text-rose-600" />,
      iconBg: "bg-rose-50 border-rose-200/60 text-rose-600",
      border: "border-rose-200/70",
      barBg: "bg-rose-500",
      badge: "Error",
    },
    warning: {
      icon: <AlertTriangle size={18} className="text-amber-600" />,
      iconBg: "bg-amber-50 border-amber-200/60 text-amber-600",
      border: "border-amber-200/70",
      barBg: "bg-amber-500",
      badge: "Notice",
    },
    info: {
      icon: <Info size={18} className="text-brand-600" />,
      iconBg: "bg-brand-50 border-brand-200/60 text-brand-600",
      border: "border-brand-200/70",
      barBg: "bg-brand-500",
      badge: "Info",
    },
  }[item.type];

  return (
    <div
      role="alert"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`pointer-events-auto relative overflow-hidden rounded-xl border bg-white/95 p-3.5 shadow-xl backdrop-blur-md transition-all duration-200 hover:shadow-2xl animate-in fade-in slide-in-from-bottom-3 ${typeConfig.border}`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border ${typeConfig.iconBg}`}
        >
          {typeConfig.icon}
        </span>

        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-xs sm:text-sm font-bold text-stone-900 leading-tight">
            {item.title}
          </p>
          {item.description && (
            <p className="mt-1 text-xs text-stone-600 leading-snug">
              {item.description}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => onDismiss(item.id)}
          className="shrink-0 rounded-lg p-1 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
          aria-label="Dismiss toast"
        >
          <X size={15} />
        </button>
      </div>

      {/* Progress countdown indicator bar */}
      {item.duration > 0 && (
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-stone-100">
          <div
            className={`h-full transition-all ease-linear ${typeConfig.barBg}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
