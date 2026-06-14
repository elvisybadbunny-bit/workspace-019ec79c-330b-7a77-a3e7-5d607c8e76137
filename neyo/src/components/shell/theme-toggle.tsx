"use client";

import * as React from "react";
import { Moon, Sun, Droplets } from "lucide-react";

/**
 * G.33 2.0 — LIQUID GLASS is the DEFAULT SYSTEM (founder-approved 2026-06-13).
 * Theme cycle: GLASS (light, default) → GLASS-DARK → LIGHT → DARK.
 * Persisted in localStorage("neyo-theme"). Absence of a key = glass.
 *
 * Liquidity level (data-liquid="1|2|3") is COMPANY-set (NEYO only) via
 * /api/platform/appearance → cached in localStorage("neyo-liquid") so the
 * pre-paint script applies it with no flash. Schools cannot change it.
 */
type Theme = "glass" | "glass-dark" | "light" | "dark";
const ORDER: Theme[] = ["glass", "glass-dark", "light", "dark"];

function apply(theme: Theme) {
  const el = document.documentElement;
  el.classList.toggle("glass", theme === "glass" || theme === "glass-dark");
  el.classList.toggle("dark", theme === "dark" || theme === "glass-dark");
}

export function ThemeToggle() {
  const [theme, setTheme] = React.useState<Theme>("glass");

  React.useEffect(() => {
    const stored = localStorage.getItem("neyo-theme") as Theme | null;
    const t: Theme = stored && ORDER.includes(stored) ? stored : "glass";
    setTheme(t);
    apply(t);

    // Sync the COMPANY liquidity level (non-blocking; cached for pre-paint).
    fetch("/api/platform/appearance")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const level = j?.data?.liquidLevel;
        if (level === "1" || level === "2" || level === "3") {
          document.documentElement.setAttribute("data-liquid", level);
          localStorage.setItem("neyo-liquid", level);
        }
      })
      .catch(() => {});
  }, []);

  function cycle() {
    const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
    setTheme(next);
    apply(next);
    localStorage.setItem("neyo-theme", next);
  }

  const LABELS: Record<Theme, string> = {
    glass: "Liquid Glass — switch to Liquid Glass dark",
    "glass-dark": "Liquid Glass dark — switch to plain light",
    light: "Plain light — switch to plain dark",
    dark: "Plain dark — switch to Liquid Glass",
  };

  const icon =
    theme === "glass" ? (
      <Droplets className="h-4.5 w-4.5" />
    ) : theme === "glass-dark" ? (
      <Droplets className="h-4.5 w-4.5 text-green-400" />
    ) : theme === "light" ? (
      <Sun className="h-4.5 w-4.5" />
    ) : (
      <Moon className="h-4.5 w-4.5" />
    );

  return (
    <button
      onClick={cycle}
      aria-label={LABELS[theme]}
      title={LABELS[theme]}
      className="flex h-9 w-9 items-center justify-center rounded-full text-navy-500 transition-colors duration-200 ease-apple hover:bg-navy-100 dark:text-navy-300 dark:hover:bg-navy-800"
    >
      {icon}
    </button>
  );
}
