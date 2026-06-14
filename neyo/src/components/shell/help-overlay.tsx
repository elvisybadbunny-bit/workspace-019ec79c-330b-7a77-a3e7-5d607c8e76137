"use client";

import * as React from "react";
import { Keyboard, X } from "lucide-react";
import { SHORTCUTS } from "@/lib/core/commands";

/**
 * Help / keyboard shortcuts overlay (G.4). Opens when the user presses "?"
 * (outside an input) or via the "neyo:open-help" event.
 */
export function HelpOverlay() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const typing =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;
      if (e.key === "?" && !typing) {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    }
    function onOpen() {
      setOpen(true);
    }
    document.addEventListener("keydown", onKey);
    window.addEventListener("neyo:open-help", onOpen);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("neyo:open-help", onOpen);
    };
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-navy-950/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div className="relative w-full max-w-sm animate-fade-in rounded-2xl border border-navy-100 bg-white p-6 shadow-pop dark:border-navy-700 dark:bg-navy-900">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Keyboard className="h-4.5 w-4.5 text-navy-500" />
            <h2 className="text-sm font-semibold text-navy-900 dark:text-navy-50">
              Keyboard shortcuts
            </h2>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="text-navy-400 hover:text-navy-700 dark:hover:text-navy-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <ul className="space-y-2.5">
          {SHORTCUTS.map((s) => (
            <li key={s.description} className="flex items-center justify-between">
              <span className="text-sm text-navy-600 dark:text-navy-300">
                {s.description}
              </span>
              <kbd className="rounded-md border border-navy-200 bg-navy-50 px-2 py-0.5 text-xs font-medium text-navy-700 dark:border-navy-700 dark:bg-navy-800 dark:text-navy-200">
                {s.keys}
              </kbd>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
