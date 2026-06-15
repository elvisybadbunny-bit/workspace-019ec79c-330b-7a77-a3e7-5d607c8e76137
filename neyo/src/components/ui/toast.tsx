"use client";

import * as React from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Dynamic Island Toast System (WWDC-style premium overlay).
 * Centered at the top of the screen, mimicking Apple's Dynamic Island.
 * It features a physical high-contrast dark design, smooth morphing animation,
 * and high-visibility status indicators.
 *
 * Usage anywhere: const { toast } = useToast();
 * toast({ title: "Saved", description: "All changes committed", tone: "success" })
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

// Pastel, high-contrast colors suited for a premium dark Dynamic Island background
const toneClasses: Record<Tone, string> = {
  success: "text-green-400",
  error: "text-red-400",
  info: "text-blue-400",
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
      
      {/* Centered at the top of the viewport, perfectly aligned just below the topbar margin */}
      <div className="pointer-events-none fixed top-2.5 left-1/2 -translate-x-1/2 z-50 flex w-full max-w-sm sm:max-w-md flex-col items-center gap-2 px-4">
        {toasts.map((t) => {
          const Icon = icons[t.tone];
          return (
            <div
              key={t.id}
              className={cn(
                "pointer-events-auto flex animate-island items-center gap-3 rounded-full",
                "bg-navy-950/95 dark:bg-black/90 px-4 py-2",
                "shadow-[0_12px_32px_-4px_rgba(0,0,0,0.5)] border border-white/10 dark:border-white/5",
                "transition-all duration-300 ease-apple max-w-full"
              )}
            >
              {/* Dynamic Island Status Icon */}
              <Icon className={cn("h-4 w-4 shrink-0", toneClasses[t.tone])} />
              
              {/* Notification details */}
              <div className="min-w-0 flex-1 flex items-center gap-2">
                <span className="text-xs font-semibold text-white tracking-wide whitespace-nowrap">
                  {t.title}
                </span>
                {t.description && (
                  <span className="text-[11px] text-navy-300 dark:text-navy-400 border-l border-white/20 pl-2 truncate max-w-[140px] md:max-w-[200px]">
                    {t.description}
                  </span>
                )}
              </div>
              
              {/* Smooth close button */}
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss"
                className="text-white/40 hover:text-white rounded-full p-0.5 hover:bg-white/10 transition-colors shrink-0"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
