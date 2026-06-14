"use client";

import * as React from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Toast system (Principle 3 — Error/success surfacing).
 * Usage anywhere under <ToastProvider>:  const { toast } = useToast();
 *   toast({ title: "Saved", tone: "success" })
 */
type Tone = "success" | "error" | "info";
interface Toast {
  id: number;
  title: string;
  description?: string;
  tone: Tone;
}
interface ToastInput {
  title: string;
  description?: string;
  tone?: Tone;
}

const ToastContext = React.createContext<{
  toast: (t: ToastInput) => void;
} | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const toneClasses: Record<Tone, string> = {
  success: "text-green-600",
  error: "text-red-600",
  info: "text-blue-600",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const toast = React.useCallback((t: ToastInput) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, tone: "info", ...t }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 4000);
  }, []);

  const dismiss = (id: number) =>
    setToasts((prev) => prev.filter((x) => x.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0">
        {toasts.map((t) => {
          const Icon = icons[t.tone];
          return (
            <div
              key={t.id}
              className="pointer-events-auto flex animate-fade-in items-start gap-3 rounded-2xl border border-navy-100 bg-white p-4 shadow-pop dark:border-navy-700 dark:bg-navy-900"
            >
              <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", toneClasses[t.tone])} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-navy-900 dark:text-navy-50">
                  {t.title}
                </p>
                {t.description && (
                  <p className="mt-0.5 text-sm text-navy-500 dark:text-navy-400">
                    {t.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss"
                className="text-navy-300 hover:text-navy-600 dark:hover:text-navy-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
