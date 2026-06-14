"use client";

import * as React from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Inbox,
  Wallet,
  CalendarCheck,
  GraduationCap,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

interface Item {
  id: string;
  title: string;
  body: string;
  category: string;
  href: string | null;
  read: boolean;
  createdAt: string;
}

const CATEGORY_ICON: Record<string, typeof Bell> = {
  fees: Wallet,
  attendance: CalendarCheck,
  exam: GraduationCap,
  general: Info,
  system: Info,
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function NotificationBell() {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<Item[]>([]);
  const [unread, setUnread] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  // Resurface unread/unseen notifications as beautiful on-screen toasts (seen guarantee)
  const resurfaceUnseen = React.useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      const json = await res.json();
      if (json.ok) {
        const unreadItems = json.data.items.filter((item: any) => !item.read);
        const toasted = JSON.parse(localStorage.getItem("neyo_toasted_notifications") || "[]") as string[];
        const newToasted = [...toasted];
        let hasNew = false;

        for (const item of unreadItems) {
          if (!toasted.includes(item.id)) {
            toast({
              title: item.title,
              description: item.body,
              tone: "success",
            });
            newToasted.push(item.id);
            hasNew = true;
          }
        }

        if (hasNew) {
          localStorage.setItem("neyo_toasted_notifications", JSON.stringify(newToasted));
        }
      }
    } catch {
      // Ignore
    }
  }, [toast]);

  // Live unread count via SSE (A.7 real-time) + Auto-resurface trigger.
  React.useEffect(() => {
    const es = new EventSource("/api/notifications/stream");
    es.addEventListener("unread", (e) => {
      try {
        const d = JSON.parse((e as MessageEvent).data);
        setUnread(d.unread ?? 0);
        resurfaceUnseen();
      } catch {
        /* ignore */
      }
    });
    es.onerror = () => {
      // Browser auto-reconnects; nothing to do.
    };
    return () => es.close();
  }, [resurfaceUnseen]);

  // Resurface check on mount and when coming back online
  React.useEffect(() => {
    resurfaceUnseen();

    function handleOnline() {
      resurfaceUnseen();
    }
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [resurfaceUnseen]);

  React.useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function loadInbox() {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      const json = await res.json();
      if (json.ok) {
        setItems(json.data.items);
        setUnread(json.data.unread);
      }
    } finally {
      setLoading(false);
    }
  }

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) loadInbox();
  }

  async function markAll() {
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setItems((xs) => xs.map((x) => ({ ...x, read: true })));
    setUnread(0);
  }

  async function markOne(id: string) {
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, read: true } : x)));
    setUnread((u) => Math.max(0, u - 1));
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={toggle}
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-navy-500 hover:bg-navy-100 dark:text-navy-300 dark:hover:bg-navy-800"
      >
        <Bell className="h-4.5 w-4.5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-green-500 px-1 text-[10px] font-semibold text-white ring-2 ring-warm-50 dark:ring-navy-950">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 animate-fade-in overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-pop dark:border-navy-700 dark:bg-navy-900 sm:w-96">
          <div className="flex items-center justify-between border-b border-navy-100 px-4 py-3 dark:border-navy-800">
            <p className="text-sm font-semibold text-navy-900 dark:text-navy-50">
              Notifications
            </p>
            {unread > 0 && (
              <button
                onClick={markAll}
                className="inline-flex items-center gap-1 text-xs font-medium text-green-700 hover:text-green-800 dark:text-green-400"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="space-y-3 p-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex gap-3">
                    <div className="skeleton h-9 w-9 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <div className="skeleton h-3 w-2/3" />
                      <div className="skeleton h-3 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-12 text-center">
                <Inbox className="h-8 w-8 text-navy-300 dark:text-navy-600" />
                <p className="mt-3 text-sm font-medium text-navy-700 dark:text-navy-200">
                  You&apos;re all caught up
                </p>
                <p className="mt-0.5 text-xs text-navy-400 dark:text-navy-500">
                  New alerts about fees, attendance and exams appear here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-navy-100 dark:divide-navy-800">
                {items.map((n) => {
                  const Icon = CATEGORY_ICON[n.category] ?? Info;
                  return (
                    <li
                      key={n.id}
                      className={cn(
                        "flex gap-3 px-4 py-3 transition-colors",
                        !n.read && "bg-green-50/50 dark:bg-green-900/10"
                      )}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-500 dark:bg-navy-800 dark:text-navy-300">
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-navy-900 dark:text-navy-50">
                          {n.title}
                        </p>
                        <p className="mt-0.5 text-sm text-navy-500 dark:text-navy-400">
                          {n.body}
                        </p>
                        <p className="mt-1 text-[11px] text-navy-400 dark:text-navy-500">
                          {timeAgo(n.createdAt)}
                        </p>
                      </div>
                      {!n.read && (
                        <button
                          onClick={() => markOne(n.id)}
                          aria-label="Mark read"
                          className="self-start text-navy-300 hover:text-green-600"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
