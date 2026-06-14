"use client";

import * as React from "react";
import { Search, Menu, ChevronDown } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";
import { NotificationBell } from "./notification-bell";
import { OfflineIndicator } from "@/components/offline/offline-indicator";
import { NeyoLogo } from "@/components/brand/neyo-logo";

/**
 * Top bar (Odoo module switcher + Linear Cmd+K search affordance).
 * The module switcher and search are wired to real features in later chunks
 * (A.11 Search, A.7 Notifications). For now they present the correct surface.
 */
export function Topbar({
  tenantName,
  userName,
  userRole,
  canViewAs = false,
  onMenuClick,
}: {
  tenantName: string;
  userName: string;
  userRole: string;
  canViewAs?: boolean;
  onMenuClick: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-navy-100 bg-warm-50/90 px-3 backdrop-blur-md dark:border-navy-800 dark:bg-navy-950/90 sm:px-5">
      {/* Mobile menu */}
      <button
        onClick={onMenuClick}
        aria-label="Open menu"
        className="flex h-9 w-9 items-center justify-center rounded-full text-navy-600 hover:bg-navy-100 dark:text-navy-300 dark:hover:bg-navy-800 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Brand + module switcher */}
      <div className="flex items-center gap-2">
        <NeyoLogo variant="mark" className="h-8" title="NEYO" />
        <button className="hidden items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm font-semibold text-navy-800 hover:bg-navy-100 dark:text-navy-100 dark:hover:bg-navy-800 sm:flex">
          {tenantName}
          <ChevronDown className="h-4 w-4 text-navy-400" />
        </button>
      </div>

      {/* Cmd+K search */}
      <button
        onClick={() => window.dispatchEvent(new Event("neyo:open-search"))}
        className="ml-2 hidden h-9 max-w-xs flex-1 items-center gap-2 rounded-full border border-navy-200 bg-white px-3.5 text-sm text-navy-400 transition-colors duration-200 ease-apple hover:border-navy-300 dark:border-navy-700 dark:bg-navy-900 md:flex"
      >
        <Search className="h-4 w-4" />
        <span>Search students, fees, staff…</span>
        <kbd className="ml-auto rounded border border-navy-200 bg-navy-50 px-1.5 py-0.5 text-[10px] font-medium text-navy-500 dark:border-navy-700 dark:bg-navy-800">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1">
        <OfflineIndicator />
        <ThemeToggle />
        <NotificationBell />

        {/* User chip + logout */}
        <UserMenu userName={userName} userRole={userRole} canViewAs={canViewAs} />
      </div>
    </header>
  );
}
