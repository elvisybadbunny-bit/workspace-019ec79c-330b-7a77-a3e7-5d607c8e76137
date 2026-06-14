import {
  GraduationCap,
  Wallet,
  CalendarCheck,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatKES } from "@/lib/utils";
import { getCurrentUser } from "@/lib/core/session";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { ActivityFeed } from "@/components/activity/activity-feed";
import { tenantDb } from "@/lib/core/tenant-db";
import { db } from "@/lib/db";
import { currentTerm } from "@/lib/services/academics.service";
import { withTenant } from "@/lib/core/tenant-context";

// Read fresh DB counts on every request (not at build time).
export const dynamic = "force-dynamic";

function nairobiNow(): Date {
  return new Date(Date.now() + 3 * 3600_000);
}
function nairobiToday(): string {
  return nairobiNow().toISOString().slice(0, 10);
}

/**
 * Dashboard — the start of every workflow (Principle 1).
 * This is a Server Component: it reads REAL counts from the database (Chunk 0
 * has Tenant + User). As feature chunks land, these tiles light up with their
 * real figures (students, fees collected today, attendance %).
 */
export default async function DashboardPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return null;

  const firstName = currentUser.fullName.split(" ")[0] ?? "there";

  const stats = await withTenant(currentUser.tenantId, async () => {
    const tdb = tenantDb();
    const today = nairobiToday();
    const now = nairobiNow();
    const term = await currentTerm(currentUser.tenantId);
    const year = term?.year ?? now.getUTCFullYear();

    const tenant = await db.tenant.findUnique({
      where: { id: currentUser.tenantId },
      select: { collectionTargetPct: true },
    });
    const targetPct = tenant?.collectionTargetPct ?? 85;

    // ---- 1) Enrolled students ----
    const [active, boys, girls, boarders] = await Promise.all([
      tdb.student.count({ where: { status: "ACTIVE" } }),
      tdb.student.count({ where: { status: "ACTIVE", gender: "M" } }),
      tdb.student.count({ where: { status: "ACTIVE", gender: "F" } }),
      tdb.hostelAllocation.count({ where: { releasedAt: null } }),
    ]);

    // ---- 2) Revenue today ----
    const todayStartUtc = new Date(`${today}T00:00:00.000Z`);
    const dayStart = new Date(todayStartUtc.getTime() - 3 * 3600_000);
    const paidToday = await tdb.payment.aggregate({
      _sum: { amount: true },
      where: { status: "PAID", paidAt: { gte: dayStart } },
    });
    const revenueToday = paidToday._sum.amount ?? 0;

    // ---- 3) Attendance today ----
    const attendanceRecords = await tdb.attendanceRecord.findMany({
      where: { date: today },
      select: { status: true },
    });
    const markedCount = attendanceRecords.length;
    let attendancePct: number | null = null;
    if (markedCount > 0) {
      const inSchool = attendanceRecords.filter((r) => r.status === "P" || r.status === "L").length;
      attendancePct = Math.round((inSchool / markedCount) * 100);
    }

    // ---- 4) Collection rate ----
    const termInvoices = term
      ? await tdb.invoice.findMany({ where: { year: term.year, term: term.term } })
      : await tdb.invoice.findMany({ where: { year } });
    const billedTerm = termInvoices.reduce((s, i) => s + i.totalKes - i.discountKes, 0);
    const collectedTerm = termInvoices.reduce((s, i) => s + Math.min(i.paidKes, i.totalKes - i.discountKes), 0);
    const collectionPct = billedTerm > 0 ? Math.round((collectedTerm / billedTerm) * 100) : 0;

    return {
      active,
      boys,
      girls,
      boarders,
      revenueToday,
      markedCount,
      attendancePct,
      collectionPct,
      targetPct,
      billedTerm,
    };
  });

  return (
    <div className="space-y-8">
      {/* Page header — one clear primary CTA (Principle 6) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-navy-900 dark:text-navy-50">
            Good morning, {firstName}
          </h1>
          <p className="mt-1 text-sm text-navy-500 dark:text-navy-400">
            Term 2 · Week 6 · {new Date().toLocaleDateString("en-KE", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>
        <Link href="/attendance">
          <Button>
            Mark today&apos;s attendance
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Stat tiles — sparse dashboard density (Principle 7) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Enrolled students"
          value={stats.active.toLocaleString("en-KE")}
          hint={stats.active === 0 ? "Add your first student" : `${stats.boys} boys · ${stats.girls} girls`}
          icon={GraduationCap}
          tone="navy"
        />
        <StatCard
          label="Fees collected today"
          value={formatKES(stats.revenueToday)}
          hint={stats.revenueToday === 0 ? "No payments today" : "M-Pesa & cash collections"}
          icon={Wallet}
          tone="green"
        />
        <StatCard
          label="Attendance today"
          value={stats.attendancePct !== null ? `${stats.attendancePct}%` : "—"}
          hint={stats.attendancePct !== null ? `${stats.markedCount} students marked` : "Register not taken"}
          icon={CalendarCheck}
          tone="amber"
        />
        <StatCard
          label="Collection rate"
          value={stats.billedTerm > 0 ? `${stats.collectionPct}%` : "—"}
          hint={stats.billedTerm > 0 ? `Target is ${stats.targetPct}%` : "No term invoices"}
          icon={TrendingUp}
          tone="navy"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent activity (G.1) — reads the audit log */}
        <div className="lg:col-span-2">
          <ActivityFeed title="Recent activity" />
        </div>

        {/* Quick actions — workflow entry points (Principle 5) */}
        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardContent>
            <QuickActions />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
