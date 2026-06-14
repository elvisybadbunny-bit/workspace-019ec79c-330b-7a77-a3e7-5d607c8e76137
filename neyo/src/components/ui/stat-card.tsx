import * as React from "react";
import { cn } from "@/lib/utils";
import { Card } from "./card";
import type { LucideIcon } from "lucide-react";

/** Sparse, visual dashboard stat card (Principle 7 — dashboard density). */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "navy",
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  tone?: "navy" | "green" | "amber" | "red";
  className?: string;
}) {
  const toneClasses = {
    navy: "bg-navy-50 text-navy-600 dark:bg-navy-800 dark:text-navy-200",
    green: "bg-green-50 text-green-600 dark:bg-green-900/40 dark:text-green-300",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300",
    red: "bg-red-50 text-red-600 dark:bg-red-900/40 dark:text-red-300",
  }[tone];

  return (
    <Card className={cn("p-5 sm:p-6", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-navy-500 dark:text-navy-400">
            {label}
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-navy-900 dark:text-navy-50">
            {value}
          </p>
          {hint && (
            <p className="mt-1 text-sm text-navy-400 dark:text-navy-500">{hint}</p>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-2xl",
              toneClasses
            )}
          >
            <Icon className="h-5 w-5" strokeWidth={2} />
          </div>
        )}
      </div>
    </Card>
  );
}
