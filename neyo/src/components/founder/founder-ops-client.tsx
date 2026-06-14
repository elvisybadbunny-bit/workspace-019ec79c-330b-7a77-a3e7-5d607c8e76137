"use client";

import * as React from "react";
import {
  BarChart3,
  BookOpenCheck,
  CalendarClock,
  ClipboardCheck,
  Loader2,
  MessageSquareQuote,
  Plus,
  RefreshCw,
  Save,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { formatKES } from "@/lib/utils";

const TABS = ["Overview", "Build log", "Metrics", "Cadence", "Interviews"] as const;
type Tab = (typeof TABS)[number];

type Dashboard = {
  latestBuildLogs: any[];
  latestMetric: any | null;
  upcomingEntries: any[];
  recentEntries: any[];
  upcomingInterviews: any[];
  recentInterviews: any[];
  counts: {
    buildLogs: number;
    publishedBuildLogs: number;
    plannedOps: number;
    completedOps: number;
    scheduledInterviews: number;
    completedInterviews: number;
  };
};

type Payload = {
  dashboard: Dashboard;
  buildLogs: any[];
  metrics: any[];
  entries: any[];
  interviews: any[];
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}
function weekKey() {
  const d = new Date();
  const onejan = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil((((d.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}
function fmtDate(value: string | Date | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-KE", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}
function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="w-full rounded-2xl border border-navy-200 bg-white px-3.5 py-2.5 text-sm text-navy-900 transition-colors duration-200 ease-apple placeholder:text-navy-300 focus:border-navy-300 focus:outline-none focus:ring-2 focus:ring-green-500/30 dark:border-navy-700 dark:bg-navy-900 dark:text-navy-50"
    />
  );
}
function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}{hint ? <p className="text-xs text-navy-400">{hint}</p> : null}</div>;
}
function statusTone(status: string): "green" | "amber" | "neutral" | "blue" {
  if (["DONE", "PUBLISHED"].includes(status)) return "green";
  if (["PLANNED", "DRAFT", "SCHEDULED"].includes(status)) return "amber";
  if (status === "SKIPPED") return "neutral";
  return "blue";
}

const emptyBuildLog = () => ({
  dateKey: todayKey(),
  title: "",
  shippedSummary: "",
  details: "",
  screenshotRefsText: "",
  commitRef: "",
  status: "PUBLISHED",
});
const emptyMetric = () => ({
  periodKey: weekKey(),
  periodStart: todayKey(),
  periodEnd: todayKey(),
  revenueKes: 0,
  mrrKes: 0,
  payingSchools: 0,
  trialSchools: 0,
  activeSchools: 0,
  churnRiskSchools: 0,
  smsSpendKes: 0,
  notes: "",
});
const emptyEntry = () => ({
  kind: "WEEKLY_METRICS",
  periodKey: weekKey(),
  title: "",
  status: "PLANNED",
  scheduledFor: todayKey(),
  completedAt: "",
  summary: "",
  notes: "",
  decisionsText: "",
  actionItemsText: "",
  audience: "internal",
});
const emptyInterview = () => ({
  schoolName: "",
  contactName: "",
  contactRole: "Principal",
  phone: "",
  email: "",
  county: "",
  interviewDate: todayKey(),
  channel: "CALL",
  status: "SCHEDULED",
  painPointsText: "",
  quotesText: "",
  opportunitiesText: "",
  followUp: "",
});

function lines(value: string) {
  return value.split("\n").map((x) => x.trim()).filter(Boolean);
}
function actionItems(value: string) {
  return lines(value).map((task) => ({ task, owner: "", dueOn: "", done: false }));
}

export function FounderOpsClient() {
  const { toast } = useToast();
  const [tab, setTab] = React.useState<Tab>("Overview");
  const [data, setData] = React.useState<Payload | null>(null);
  const [error, setError] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [buildLog, setBuildLog] = React.useState<any>(emptyBuildLog());
  const [metric, setMetric] = React.useState<any>(emptyMetric());
  const [entry, setEntry] = React.useState<any>(emptyEntry());
  const [interview, setInterview] = React.useState<any>(emptyInterview());

  const load = React.useCallback(async () => {
    setError(false);
    try {
      const [dashboard, buildLogs, metrics, entries, interviews] = await Promise.all([
        fetch("/api/founder-ops?view=dashboard").then((r) => r.json()),
        fetch("/api/founder-ops?view=build_logs").then((r) => r.json()),
        fetch("/api/founder-ops?view=metrics").then((r) => r.json()),
        fetch("/api/founder-ops?view=entries").then((r) => r.json()),
        fetch("/api/founder-ops?view=interviews").then((r) => r.json()),
      ]);
      if (!dashboard.ok) throw new Error(dashboard.error?.message || "Could not load founder ops");
      setData({
        dashboard: dashboard.data.dashboard,
        buildLogs: buildLogs.data?.buildLogs || [],
        metrics: metrics.data?.metrics || [],
        entries: entries.data?.entries || [],
        interviews: interviews.data?.interviews || [],
      });
    } catch {
      setError(true);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  async function mutate(action: string, body: any, success: string, id?: string) {
    setSaving(true);
    try {
      const res = await fetch("/api/founder-ops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id, data: body }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(Object.values(json.error?.fields || {})[0] as string || json.error?.message || "Could not save");
      toast({ title: success, tone: "success" });
      await load();
    } catch (err: any) {
      toast({ title: err.message || "Could not save", tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function remove(section: string, id: string) {
    if (!confirm("Remove this NEYO operations record?")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/founder-ops/${section}/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message || "Could not remove");
      toast({ title: "Record removed", tone: "success" });
      await load();
    } catch (err: any) {
      toast({ title: err.message || "Could not remove", tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50/80 p-5 dark:border-red-900 dark:bg-red-950/20">
        <p className="text-sm font-medium text-red-700 dark:text-red-300">Could not load NEYO Founder Operations.</p>
        <Button onClick={load} className="mt-3" variant="secondary"><RefreshCw className="mr-2 h-4 w-4" />Retry</Button>
      </Card>
    );
  }
  if (!data) return <FounderOpsSkeleton />;

  const d = data.dashboard;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2"><Badge tone="green">F.1</Badge><span className="text-sm font-semibold text-navy-900 dark:text-navy-50">NEYO runs NEYO here</span></div>
            <p className="mt-1 max-w-2xl text-sm text-navy-500 dark:text-navy-400">Founder rhythm, build log, customer learning, metrics and investor/board updates in one place.</p>
          </div>
          <Button onClick={load} variant="secondary"><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
        </CardContent>
      </Card>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${tab === t ? "bg-navy-900 text-white shadow-card dark:bg-white dark:text-navy-950" : "border border-navy-200 bg-white/70 text-navy-600 hover:bg-white dark:border-navy-800 dark:bg-navy-900/60 dark:text-navy-300"}`}>{t}</button>)}
      </div>

      {tab === "Overview" && <Overview dashboard={d} />}
      {tab === "Build log" && <BuildLogTab rows={data.buildLogs} value={buildLog} setValue={setBuildLog} saving={saving} onSave={() => mutate("upsert_build_log", { ...buildLog, screenshotRefs: lines(buildLog.screenshotRefsText) }, "Build log saved")} onDelete={(id: string) => remove("build-logs", id)} />}
      {tab === "Metrics" && <MetricsTab rows={data.metrics} value={metric} setValue={setMetric} saving={saving} onSave={() => mutate("upsert_metric", metric, "Metrics snapshot saved")} onDelete={(id: string) => remove("metrics", id)} />}
      {tab === "Cadence" && <CadenceTab rows={data.entries} value={entry} setValue={setEntry} saving={saving} onSave={() => mutate("upsert_entry", { ...entry, completedAt: entry.completedAt ? new Date(entry.completedAt).toISOString() : null, decisions: lines(entry.decisionsText), actionItems: actionItems(entry.actionItemsText) }, "Founder cadence entry saved")} onDelete={(id: string) => remove("entries", id)} />}
      {tab === "Interviews" && <InterviewsTab rows={data.interviews} value={interview} setValue={setInterview} saving={saving} onSave={() => mutate("create_interview", { ...interview, painPoints: lines(interview.painPointsText), quotes: lines(interview.quotesText), opportunities: lines(interview.opportunitiesText) }, "Customer interview saved")} onDelete={(id: string) => remove("interviews", id)} />}
    </div>
  );
}

function FounderOpsSkeleton() {
  return <div className="space-y-4">{[0,1,2].map((i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}</div>;
}

function Overview({ dashboard }: { dashboard: Dashboard }) {
  const latestMetric = dashboard.latestMetric;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <MiniStat icon={BookOpenCheck} label="Build logs" value={dashboard.counts.buildLogs} sub={`${dashboard.counts.publishedBuildLogs} published`} />
        <MiniStat icon={CalendarClock} label="Planned ops" value={dashboard.counts.plannedOps} sub="coming up" />
        <MiniStat icon={ClipboardCheck} label="Completed ops" value={dashboard.counts.completedOps} sub="done" />
        <MiniStat icon={MessageSquareQuote} label="Scheduled interviews" value={dashboard.counts.scheduledInterviews} sub="customer learning" />
        <MiniStat icon={MessageSquareQuote} label="Done interviews" value={dashboard.counts.completedInterviews} sub="insights captured" />
        <MiniStat icon={BarChart3} label="MRR" value={latestMetric ? formatKES(latestMetric.mrrKes) : "KES 0"} sub={latestMetric?.periodKey || "no snapshot"} />
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <ListCard title="Latest build logs" rows={dashboard.latestBuildLogs} empty="No build logs yet." primary="title" secondary="shippedSummary" badge="status" />
        <ListCard title="Upcoming founder rhythm" rows={dashboard.upcomingEntries} empty="No planned founder ops yet." primary="title" secondary="summary" badge="kind" />
        <ListCard title="Upcoming customer interviews" rows={dashboard.upcomingInterviews} empty="No customer interviews scheduled." primary="schoolName" secondary="contactName" badge="status" />
        <ListCard title="Recently completed" rows={dashboard.recentEntries} empty="No completed entries yet." primary="title" secondary="summary" badge="kind" />
      </div>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, sub }: { icon: any; label: string; value: React.ReactNode; sub: string }) {
  return <Card><CardContent className="p-4"><Icon className="h-5 w-5 text-green-600" /><p className="mt-3 text-2xl font-black text-navy-950 dark:text-white">{value}</p><p className="mt-1 text-xs font-bold uppercase tracking-wide text-navy-400">{label}</p><p className="mt-1 text-xs text-navy-500 dark:text-navy-400">{sub}</p></CardContent></Card>;
}

function ListCard({ title, rows, empty, primary, secondary, badge }: { title: string; rows: any[]; empty: string; primary: string; secondary: string; badge: string }) {
  return <Card><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent>{rows.length === 0 ? <EmptyState icon={Plus} title={empty} description="Add the first record from the tabs above." /> : <div className="space-y-3">{rows.map((r) => <div key={r.id} className="rounded-2xl border border-navy-100 bg-white/70 p-3 dark:border-navy-800 dark:bg-navy-900/60"><div className="flex items-center justify-between gap-3"><p className="font-semibold text-navy-900 dark:text-navy-50">{r[primary]}</p><Badge tone={statusTone(r[badge])}>{r[badge]}</Badge></div><p className="mt-1 line-clamp-2 text-sm text-navy-500 dark:text-navy-400">{r[secondary] || fmtDate(r.dateKey || r.scheduledFor || r.interviewDate)}</p></div>)}</div>}</CardContent></Card>;
}

function BuildLogTab({ rows, value, setValue, saving, onSave, onDelete }: any) {
  return <TwoCol form={<Card><CardHeader><CardTitle>Daily build log</CardTitle></CardHeader><CardContent className="space-y-4"><Field label="Date"><Input type="date" value={value.dateKey} onChange={(e)=>setValue((p:any)=>({...p,dateKey:e.target.value}))}/></Field><Field label="Title"><Input value={value.title} onChange={(e)=>setValue((p:any)=>({...p,title:e.target.value}))}/></Field><Field label="What shipped"><Textarea rows={3} value={value.shippedSummary} onChange={(e)=>setValue((p:any)=>({...p,shippedSummary:e.target.value}))}/></Field><Field label="Details"><Textarea rows={5} value={value.details} onChange={(e)=>setValue((p:any)=>({...p,details:e.target.value}))}/></Field><Field label="Screenshot paths, one per line"><Textarea rows={3} value={value.screenshotRefsText} onChange={(e)=>setValue((p:any)=>({...p,screenshotRefsText:e.target.value}))}/></Field><Field label="Status"><select className="h-10 w-full rounded-full border border-navy-200 bg-white px-3 text-sm dark:border-navy-800 dark:bg-navy-900" value={value.status} onChange={(e)=>setValue((p:any)=>({...p,status:e.target.value}))}><option>DRAFT</option><option>PUBLISHED</option></select></Field><Button disabled={saving} onClick={onSave}>{saving?<Loader2 className="mr-2 h-4 w-4 animate-spin"/>:<Save className="mr-2 h-4 w-4"/>}Save build log</Button></CardContent></Card>} list={<Rows title="Build logs" rows={rows} empty="No build logs yet." main="title" sub="shippedSummary" section="build-logs" onDelete={onDelete}/>} />;
}
function MetricsTab({ rows, value, setValue, saving, onSave, onDelete }: any) {
  return <TwoCol form={<Card><CardHeader><CardTitle>Metrics snapshot</CardTitle></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 sm:grid-cols-3"><Field label="Period"><Input value={value.periodKey} onChange={(e)=>setValue((p:any)=>({...p,periodKey:e.target.value}))}/></Field><Field label="Start"><Input type="date" value={value.periodStart} onChange={(e)=>setValue((p:any)=>({...p,periodStart:e.target.value}))}/></Field><Field label="End"><Input type="date" value={value.periodEnd} onChange={(e)=>setValue((p:any)=>({...p,periodEnd:e.target.value}))}/></Field></div><div className="grid gap-3 sm:grid-cols-2"><Field label="Revenue KES"><Input type="number" value={value.revenueKes} onChange={(e)=>setValue((p:any)=>({...p,revenueKes:Number(e.target.value)}))}/></Field><Field label="MRR KES"><Input type="number" value={value.mrrKes} onChange={(e)=>setValue((p:any)=>({...p,mrrKes:Number(e.target.value)}))}/></Field><Field label="Active schools"><Input type="number" value={value.activeSchools} onChange={(e)=>setValue((p:any)=>({...p,activeSchools:Number(e.target.value)}))}/></Field><Field label="Paying schools"><Input type="number" value={value.payingSchools} onChange={(e)=>setValue((p:any)=>({...p,payingSchools:Number(e.target.value)}))}/></Field><Field label="Trial schools"><Input type="number" value={value.trialSchools} onChange={(e)=>setValue((p:any)=>({...p,trialSchools:Number(e.target.value)}))}/></Field><Field label="Churn risk"><Input type="number" value={value.churnRiskSchools} onChange={(e)=>setValue((p:any)=>({...p,churnRiskSchools:Number(e.target.value)}))}/></Field></div><Field label="Notes"><Textarea rows={4} value={value.notes} onChange={(e)=>setValue((p:any)=>({...p,notes:e.target.value}))}/></Field><Button disabled={saving} onClick={onSave}><Save className="mr-2 h-4 w-4"/>Save metrics</Button></CardContent></Card>} list={<Rows title="Metric snapshots" rows={rows} empty="No metric snapshots yet." main="periodKey" sub="notes" section="metrics" onDelete={onDelete}/>} />;
}
function CadenceTab({ rows, value, setValue, saving, onSave, onDelete }: any) {
  return <TwoCol form={<Card><CardHeader><CardTitle>Founder cadence</CardTitle></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 sm:grid-cols-2"><Field label="Kind"><select className="h-10 w-full rounded-full border border-navy-200 bg-white px-3 text-sm dark:border-navy-800 dark:bg-navy-900" value={value.kind} onChange={(e)=>setValue((p:any)=>({...p,kind:e.target.value}))}>{["WEEKLY_METRICS","MONTHLY_ALL_HANDS","QUARTERLY_AUDIT","ANNUAL_PLANNING","CUSTOMER_INTERVIEWS","DEMO_DAY","INVESTOR_UPDATE","BOARD_MEETING","IMPACT_REPORT"].map(x=><option key={x}>{x}</option>)}</select></Field><Field label="Period"><Input value={value.periodKey} onChange={(e)=>setValue((p:any)=>({...p,periodKey:e.target.value}))}/></Field></div><Field label="Title"><Input value={value.title} onChange={(e)=>setValue((p:any)=>({...p,title:e.target.value}))}/></Field><div className="grid gap-3 sm:grid-cols-2"><Field label="Status"><select className="h-10 w-full rounded-full border border-navy-200 bg-white px-3 text-sm dark:border-navy-800 dark:bg-navy-900" value={value.status} onChange={(e)=>setValue((p:any)=>({...p,status:e.target.value}))}><option>PLANNED</option><option>DONE</option><option>SKIPPED</option></select></Field><Field label="Scheduled"><Input type="date" value={value.scheduledFor} onChange={(e)=>setValue((p:any)=>({...p,scheduledFor:e.target.value}))}/></Field></div>{value.status==="DONE"?<Field label="Completed at"><Input type="datetime-local" value={value.completedAt} onChange={(e)=>setValue((p:any)=>({...p,completedAt:e.target.value}))}/></Field>:null}<Field label="Summary"><Textarea rows={3} value={value.summary} onChange={(e)=>setValue((p:any)=>({...p,summary:e.target.value}))}/></Field><Field label="Decisions, one per line"><Textarea rows={3} value={value.decisionsText} onChange={(e)=>setValue((p:any)=>({...p,decisionsText:e.target.value}))}/></Field><Field label="Action items, one per line"><Textarea rows={3} value={value.actionItemsText} onChange={(e)=>setValue((p:any)=>({...p,actionItemsText:e.target.value}))}/></Field><Button disabled={saving} onClick={onSave}><Save className="mr-2 h-4 w-4"/>Save cadence</Button></CardContent></Card>} list={<Rows title="Cadence entries" rows={rows} empty="No cadence entries yet." main="title" sub="summary" section="entries" onDelete={onDelete}/>} />;
}
function InterviewsTab({ rows, value, setValue, saving, onSave, onDelete }: any) {
  return <TwoCol form={<Card><CardHeader><CardTitle>Customer interview</CardTitle></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 sm:grid-cols-2"><Field label="School"><Input value={value.schoolName} onChange={(e)=>setValue((p:any)=>({...p,schoolName:e.target.value}))}/></Field><Field label="Contact"><Input value={value.contactName} onChange={(e)=>setValue((p:any)=>({...p,contactName:e.target.value}))}/></Field></div><div className="grid gap-3 sm:grid-cols-2"><Field label="Role"><Input value={value.contactRole} onChange={(e)=>setValue((p:any)=>({...p,contactRole:e.target.value}))}/></Field><Field label="County"><Input value={value.county} onChange={(e)=>setValue((p:any)=>({...p,county:e.target.value}))}/></Field></div><div className="grid gap-3 sm:grid-cols-3"><Field label="Date"><Input type="date" value={value.interviewDate} onChange={(e)=>setValue((p:any)=>({...p,interviewDate:e.target.value}))}/></Field><Field label="Channel"><select className="h-10 w-full rounded-full border border-navy-200 bg-white px-3 text-sm dark:border-navy-800 dark:bg-navy-900" value={value.channel} onChange={(e)=>setValue((p:any)=>({...p,channel:e.target.value}))}><option>CALL</option><option>VISIT</option><option>WHATSAPP</option><option>VIDEO</option></select></Field><Field label="Status"><select className="h-10 w-full rounded-full border border-navy-200 bg-white px-3 text-sm dark:border-navy-800 dark:bg-navy-900" value={value.status} onChange={(e)=>setValue((p:any)=>({...p,status:e.target.value}))}><option>SCHEDULED</option><option>DONE</option><option>CANCELLED</option></select></Field></div><Field label="Pain points, one per line"><Textarea rows={3} value={value.painPointsText} onChange={(e)=>setValue((p:any)=>({...p,painPointsText:e.target.value}))}/></Field><Field label="Exact quotes, one per line"><Textarea rows={3} value={value.quotesText} onChange={(e)=>setValue((p:any)=>({...p,quotesText:e.target.value}))}/></Field><Field label="Opportunities, one per line"><Textarea rows={3} value={value.opportunitiesText} onChange={(e)=>setValue((p:any)=>({...p,opportunitiesText:e.target.value}))}/></Field><Button disabled={saving} onClick={onSave}><Save className="mr-2 h-4 w-4"/>Save interview</Button></CardContent></Card>} list={<Rows title="Customer interviews" rows={rows} empty="No interviews yet." main="schoolName" sub="contactName" section="interviews" onDelete={onDelete}/>} />;
}
function TwoCol({ form, list }: { form: React.ReactNode; list: React.ReactNode }) { return <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">{form}{list}</div>; }
function Rows({ title, rows, empty, main, sub, section, onDelete }: any) {
  return <Card><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent>{rows.length===0?<EmptyState icon={Plus} title={empty} description="Create the first record from the form."/>:<div className="space-y-3">{rows.map((r:any)=><div key={r.id} className="rounded-2xl border border-navy-100 bg-white/70 p-3 dark:border-navy-800 dark:bg-navy-900/60"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-navy-900 dark:text-navy-50">{r[main]}</p><p className="mt-1 line-clamp-2 text-sm text-navy-500 dark:text-navy-400">{r[sub] || fmtDate(r.dateKey || r.periodStart || r.scheduledFor || r.interviewDate)}</p></div><Button size="sm" variant="ghost" onClick={()=>onDelete(r.id)} className="text-red-600"><Trash2 className="h-4 w-4"/></Button></div>{r.status?<Badge className="mt-3" tone={statusTone(r.status)}>{r.status}</Badge>:null}</div>)}</div>}</CardContent></Card>;
}
