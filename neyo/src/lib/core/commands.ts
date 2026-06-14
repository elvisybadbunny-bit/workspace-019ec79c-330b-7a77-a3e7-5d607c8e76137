/**
 * App command + shortcut registry (Features G.4 + G.7).
 * Commands appear in the ⌘K palette (permission-filtered) and the "?" help
 * overlay. Each navigates somewhere; some require a permission.
 */
export interface AppCommand {
  id: string;
  label: string;
  href: string;
  /** Permission required to see/run this command (optional). */
  permission?: string;
  /** Keywords to match in the palette. */
  keywords?: string[];
}

export const APP_COMMANDS: AppCommand[] = [
  { id: "go-dashboard", label: "Go to Dashboard", href: "/dashboard", keywords: ["home"] },
  { id: "go-messages", label: "Open Messages", href: "/messages", keywords: ["chat", "inbox"] },
  {
    id: "new-student",
    label: "New student",
    href: "/students?new=1",
    permission: "student.create",
    keywords: ["register", "admit", "enrol", "enroll", "add student"],
  },
  {
    id: "import-students",
    label: "Import students (CSV / Excel / Sheets)",
    href: "/students/import",
    permission: "student.create",
    keywords: ["bulk", "upload", "csv", "excel", "sheets"],
  },
  {
    id: "view-students",
    label: "View students",
    href: "/students",
    permission: "student.view",
    keywords: ["learners", "pupils", "class"],
  },
  {
    id: "record-payment",
    label: "Record a payment",
    href: "/finance/payments",
    permission: "finance.record_payment",
    keywords: ["fees", "mpesa", "pay"],
  },
  {
    id: "view-payments",
    label: "View payments",
    href: "/finance/payments",
    permission: "finance.view",
    keywords: ["fees", "receipts"],
  },
  {
    id: "send-message",
    label: "Send a message",
    href: "/messages",
    permission: "comms.send",
    keywords: ["sms", "announce"],
  },
  {
    id: "manage-modules",
    label: "Manage modules",
    href: "/settings/modules",
    permission: "tenant.manage_modules",
  },
  {
    id: "billing",
    label: "Billing & plan",
    href: "/settings/billing",
    keywords: ["plan", "subscription", "invoice"],
  },
  {
    id: "payments-setup",
    label: "Set up M-Pesa",
    href: "/settings/payments",
    permission: "tenant.manage_settings",
    keywords: ["daraja", "paybill"],
  },
  { id: "security", label: "Security & 2FA", href: "/settings/security", keywords: ["passkey", "password"] },
  {
    id: "export-data",
    label: "Export school data",
    href: "/settings/data",
    permission: "tenant.export_data",
  },
];

/** Keyboard shortcuts shown in the "?" help overlay. */
export const SHORTCUTS: { keys: string; description: string }[] = [
  { keys: "⌘ K  /  Ctrl K", description: "Open search & commands" },
  { keys: "?", description: "Show this help" },
  { keys: "Esc", description: "Close dialogs" },
  { keys: "↑ ↓", description: "Move between results" },
  { keys: "Enter", description: "Open the selected result" },
];
