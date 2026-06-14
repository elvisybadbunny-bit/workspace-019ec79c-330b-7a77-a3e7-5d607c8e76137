"use client";

/**
 * B.22 Security UI — tabs:
 * - Gate passes: issue / check-by-number (gate desk) / cancel
 * - Pickup auth: search a student → who is ALLOWED to collect them (+manage)
 * - Panic: big red button (FIRE/MEDICAL/INTRUDER) → leadership SMS + staff
 *   in-app alerts; active alert banner + resolve
 */
import * as React from "react";
import {
  DoorClosed, X, Loader2, AlertCircle, Plus, Search, Siren, UserCheck,
  CheckCircle2, Ban, OctagonAlert,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";

interface Pass { id: string; passNo: string; studentName: string; admissionNo: string; reason: string; leaveAt: string; returnBy: string | null; escortName: string | null; status: string; issuedByName: string; usedAt: string | null }
interface Panic { id: string; kind: string; location: string; note: string | null; raisedByName: string; resolvedAt: string | null; resolvedBy: string | null; smsSent: number; createdAt: string }
interface PickupResult { studentId: string; studentName: string; admissionNo: string; persons: { id: string; fullName: string; relationship: string; phone: string; nationalId: string | null }[] }
interface StudentOpt { id: string; name: string; admissionNo: string }

const PASS_TONE: Record<string, "green" | "amber" | "red" | "neutral"> = { ACTIVE: "green", USED: "neutral", CANCELLED: "red", EXPIRED: "amber" };

export function GateClient({ canManage, canPanic }: { canManage: boolean; canPanic: boolean }) {
  const { toast } = useToast();
  const [passes, setPasses] = React.useState<Pass[] | null>(null);
  const [panics, setPanics] = React.useState<Panic[]>([]);
  const [error, setError] = React.useState(false);
  const [tab, setTab] = React.useState<"passes" | "pickup" | "panic">("passes");
  const [students, setStudents] = React.useState<StudentOpt[]>([]);
  const [dialog, setDialog] = React.useState<"pass" | "pickup" | "panic" | null>(null);
  const [checkNo, setCheckNo] = React.useState("");
  const [pickupQ, setPickupQ] = React.useState("");
  const [pickupResults, setPickupResults] = React.useState<PickupResult[] | null>(null);

  const load = React.useCallback(async () => {
    setError(false);
    try {
      const res = await fetch("/api/security");
      const json = await res.json();
      if (json.ok) { setPasses(json.data.passes); setPanics(json.data.panics); } else setError(true);
    } catch { setError(true); }
  }, []);
  React.useEffect(() => {
    load();
    fetch("/api/students?status=ACTIVE").then((r) => r.json()).then((j) => {
      if (j.ok) setStudents(j.data.students.map((s: { id: string; firstName: string; middleName?: string | null; lastName: string; admissionNo: string }) => ({
        id: s.id, name: [s.firstName, s.middleName, s.lastName].filter(Boolean).join(" "), admissionNo: s.admissionNo,
      })));
    }).catch(() => {});
  }, [load]);

  async function checkPass() {
    const res = await fetch("/api/security", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "usePass", passNo: checkNo }),
    });
    const json = await res.json();
    if (json.ok) { toast({ title: `Pass ${json.data.passNo} OK — ${json.data.studentName} may exit ✓`, tone: "success" }); setCheckNo(""); load(); }
    else toast({ title: json.error?.message || "Pass rejected", tone: "error" });
  }

  async function searchPickup() {
    setPickupResults(null);
    const res = await fetch(`/api/security?pickup=${encodeURIComponent(pickupQ)}`);
    const json = await res.json();
    if (json.ok) setPickupResults(json.data.results);
  }

  async function cancelPass(id: string, no: string) {
    const res = await fetch("/api/security", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancelPass", passId: id }),
    });
    const json = await res.json();
    if (json.ok) { toast({ title: `${no} cancelled`, tone: "success" }); load(); }
    else toast({ title: json.error?.message || "Failed", tone: "error" });
  }

  async function resolve(id: string) {
    const res = await fetch("/api/security", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "resolvePanic", alertId: id }),
    });
    const json = await res.json();
    if (json.ok) { toast({ title: "Alert resolved — asante", tone: "success" }); load(); }
    else toast({ title: json.error?.message || "Failed", tone: "error" });
  }

  if (error) return <LoadError onRetry={load} />;
  if (passes === null) return <div className="space-y-3"><Skeleton className="h-24 rounded-2xl" /><Skeleton className="h-48 rounded-2xl" /></div>;

  const activePanic = panics.find((p) => !p.resolvedAt);
  const tabs = [
    { key: "passes" as const, label: "Gate passes", icon: DoorClosed },
    { key: "pickup" as const, label: "Pickup authorisation", icon: UserCheck },
    { key: "panic" as const, label: "Emergency", icon: Siren },
  ];

  return (
    <div className="space-y-4">
      {activePanic && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border-2 border-red-500 bg-red-50 px-4 py-3 dark:bg-red-900/20">
          <p className="flex items-center gap-2 text-sm font-semibold text-red-700 dark:text-red-300">
            <Siren className="h-4 w-4 animate-pulse" /> ACTIVE EMERGENCY: {activePanic.kind} — {activePanic.location} (raised by {activePanic.raisedByName})
          </p>
          {canManage && <Button size="sm" variant="secondary" onClick={() => resolve(activePanic.id)}><CheckCircle2 className="h-3.5 w-3.5" /> Resolve</Button>}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors duration-200 ease-apple ${
              tab === t.key
                ? "bg-navy-900 text-white dark:bg-navy-50 dark:text-navy-900"
                : "bg-white text-navy-600 border border-navy-100 hover:bg-warm-50 dark:bg-navy-900 dark:text-navy-300 dark:border-navy-800"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "passes" && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-end gap-2">
            {canManage && <Button onClick={() => setDialog("pass")}><Plus className="h-4 w-4" /> Issue pass</Button>}
            <div className="flex items-end gap-2">
              <div>
                <Label>Check a pass at the gate</Label>
                <Input value={checkNo} onChange={(e) => setCheckNo(e.target.value)} onKeyDown={(e) => e.key === "Enter" && checkPass()} placeholder="GP-0001" className="w-36 font-mono" />
              </div>
              <Button variant="secondary" onClick={checkPass} disabled={!checkNo.trim()}><Search className="h-4 w-4" /> Check</Button>
            </div>
          </div>
          {passes.length === 0 ? (
            <EmptyState icon={DoorClosed} title="No gate passes" description="Issued passes appear here — the gate checks the GP number before any learner exits." />
          ) : (
            <div className="space-y-2">
              {passes.map((p) => (
                <Card key={p.id}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-2 p-4">
                    <div>
                      <p className="text-sm font-semibold text-navy-900 dark:text-navy-50"><span className="font-mono text-xs text-navy-400">{p.passNo}</span> {p.studentName}</p>
                      <p className="text-xs text-navy-400">
                        {p.reason} · leaves {new Date(p.leaveAt).toLocaleString("en-KE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        {p.returnBy ? ` · back by ${new Date(p.returnBy).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}` : ""}
                        {p.escortName ? ` · with ${p.escortName}` : ""} · issued by {p.issuedByName}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge tone={PASS_TONE[p.status] ?? "neutral"}>{p.status.toLowerCase()}</Badge>
                      {canManage && p.status === "ACTIVE" && (
                        <button onClick={() => cancelPass(p.id, p.passNo)} className="rounded-full p-1.5 text-navy-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20" aria-label={`Cancel ${p.passNo}`}>
                          <Ban className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "pickup" && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <Label>Who can pick this learner? (name or adm no)</Label>
              <Input value={pickupQ} onChange={(e) => setPickupQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && searchPickup()} placeholder="e.g. Achieng or KH-S-000001" className="w-64" />
            </div>
            <Button variant="secondary" onClick={searchPickup} disabled={pickupQ.trim().length < 2}><Search className="h-4 w-4" /> Look up</Button>
            {canManage && <Button onClick={() => setDialog("pickup")}><Plus className="h-4 w-4" /> Add authorised person</Button>}
          </div>
          {pickupResults !== null && (
            pickupResults.length === 0 ? (
              <p className="rounded-2xl bg-warm-50 px-4 py-3 text-sm text-navy-500 dark:bg-navy-800">No matching student.</p>
            ) : (
              pickupResults.map((r) => (
                <Card key={r.studentId}>
                  <CardHeader><CardTitle className="text-sm">{r.studentName} <span className="font-mono text-xs font-normal text-navy-400">{r.admissionNo}</span></CardTitle></CardHeader>
                  <CardContent>
                    {r.persons.length === 0 ? (
                      <p className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
                        <OctagonAlert className="h-4 w-4" /> NOBODY is authorised yet — do not release without the office.
                      </p>
                    ) : (
                      <ul className="divide-y divide-navy-50 dark:divide-navy-800">
                        {r.persons.map((p) => (
                          <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                            <div>
                              <p className="font-medium text-navy-900 dark:text-navy-50">{p.fullName} <span className="text-xs text-navy-400">({p.relationship})</span></p>
                              <p className="text-xs text-navy-400">{p.phone}{p.nationalId ? ` · ID ${p.nationalId} — check it` : ""}</p>
                            </div>
                            <Badge tone="green">authorised ✓</Badge>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              ))
            )
          )}
        </div>
      )}

      {tab === "panic" && (
        <div className="space-y-3">
          {canPanic && (
            <Card className="border-red-200 dark:border-red-900">
              <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
                <Siren className="h-10 w-10 text-red-500" />
                <p className="text-sm text-navy-500 dark:text-navy-400">Fire, medical emergency or intruder? One tap alerts every staff member and SMSes the principal and deputy instantly.</p>
                <button
                  onClick={() => setDialog("panic")}
                  className="rounded-full bg-red-600 px-8 py-3 text-base font-semibold text-white shadow-card transition-colors duration-200 ease-apple hover:bg-red-700"
                >
                  🚨 RAISE EMERGENCY ALERT
                </button>
              </CardContent>
            </Card>
          )}
          {panics.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Alert history</CardTitle></CardHeader>
              <CardContent>
                <ul className="divide-y divide-navy-50 dark:divide-navy-800">
                  {panics.map((p) => (
                    <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                      <div>
                        <p className="font-medium text-navy-900 dark:text-navy-50">{p.kind} — {p.location}</p>
                        <p className="text-xs text-navy-400">
                          {new Date(p.createdAt).toLocaleString("en-KE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} · by {p.raisedByName} · {p.smsSent} leadership SMS
                          {p.resolvedAt ? ` · resolved by ${p.resolvedBy}` : ""}
                        </p>
                      </div>
                      <Badge tone={p.resolvedAt ? "green" : "red"}>{p.resolvedAt ? "resolved" : "ACTIVE"}</Badge>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {dialog === "pass" && <PassDialog students={students} onClose={() => setDialog(null)} onDone={() => { setDialog(null); load(); }} />}
      {dialog === "pickup" && <PickupDialog students={students} onClose={() => setDialog(null)} onDone={() => { setDialog(null); toast({ title: "Authorised person added", tone: "success" }); }} />}
      {dialog === "panic" && <PanicDialog onClose={() => setDialog(null)} onDone={() => { setDialog(null); load(); }} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dialogs
// ---------------------------------------------------------------------------

const selectCls = "w-full rounded-2xl border border-navy-200 bg-white px-3.5 py-2.5 text-sm dark:border-navy-700 dark:bg-navy-900";

function Dialog({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy-950/40 p-4 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-card dark:bg-navy-900" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between">
          <h3 className="text-base font-semibold text-navy-900 dark:text-navy-50">{title}</h3>
          <button onClick={onClose} className="rounded-full p-1 text-navy-400 hover:bg-navy-50 dark:hover:bg-navy-800" aria-label="Close"><X className="h-4 w-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function PassDialog({ students, onClose, onDone }: { students: StudentOpt[]; onClose: () => void; onDone: () => void }) {
  const { toast } = useToast();
  const now = new Date(Date.now() + 3 * 3600_000).toISOString().slice(0, 16);
  const [f, setF] = React.useState({ studentId: "", reason: "", leaveAt: now, returnBy: "", escortName: "" });
  const [saving, setSaving] = React.useState(false);
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/security", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "gatePass", ...f, returnBy: f.returnBy || undefined, escortName: f.escortName || undefined }),
      });
      const json = await res.json();
      if (json.ok) { toast({ title: `Pass ${json.data.passNo} issued — quote it at the gate`, tone: "success" }); onDone(); }
      else toast({ title: json.error?.message || "Failed", tone: "error" });
    } finally { setSaving(false); }
  }

  return (
    <Dialog title="Issue a gate pass" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <Label>Student</Label>
          <select value={f.studentId} onChange={(e) => set("studentId", e.target.value)} className={selectCls}>
            <option value="">Pick a student…</option>
            {students.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.admissionNo}</option>)}
          </select>
        </div>
        <div><Label>Reason</Label><Input value={f.reason} onChange={(e) => set("reason", e.target.value)} placeholder="e.g. Dental appointment — Kiambu" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Leaves at</Label><Input type="datetime-local" value={f.leaveAt} onChange={(e) => set("leaveAt", e.target.value)} /></div>
          <div><Label>Back by (optional)</Label><Input type="datetime-local" value={f.returnBy} onChange={(e) => set("returnBy", e.target.value)} /></div>
        </div>
        <div><Label>Escort (optional)</Label><Input value={f.escortName} onChange={(e) => set("escortName", e.target.value)} placeholder="e.g. Mother — Otieno Brian" /></div>
        <Button onClick={save} disabled={saving || !f.studentId || f.reason.trim().length < 3} className="w-full">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <DoorClosed className="h-4 w-4" />} Issue pass
        </Button>
      </div>
    </Dialog>
  );
}

function PickupDialog({ students, onClose, onDone }: { students: StudentOpt[]; onClose: () => void; onDone: () => void }) {
  const { toast } = useToast();
  const [f, setF] = React.useState({ studentId: "", fullName: "", relationship: "", phone: "", nationalId: "" });
  const [saving, setSaving] = React.useState(false);
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/security", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "addPickup", ...f, nationalId: f.nationalId || undefined }),
      });
      const json = await res.json();
      if (json.ok) onDone();
      else toast({ title: json.error?.message || "Failed", tone: "error" });
    } finally { setSaving(false); }
  }

  return (
    <Dialog title="Add an authorised pickup person" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <Label>Student</Label>
          <select value={f.studentId} onChange={(e) => set("studentId", e.target.value)} className={selectCls}>
            <option value="">Pick a student…</option>
            {students.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.admissionNo}</option>)}
          </select>
        </div>
        <div><Label>Full name</Label><Input value={f.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="e.g. Otieno Brian" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Relationship</Label><Input value={f.relationship} onChange={(e) => set("relationship", e.target.value)} placeholder="Father / Aunt" /></div>
          <div><Label>Phone</Label><Input value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="07XX XXX XXX" /></div>
        </div>
        <div><Label>National ID (checked at the gate)</Label><Input value={f.nationalId} onChange={(e) => set("nationalId", e.target.value)} placeholder="12345678" /></div>
        <Button onClick={save} disabled={saving || !f.studentId || f.fullName.trim().length < 3 || !f.relationship || !f.phone} className="w-full">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />} Authorise
        </Button>
      </div>
    </Dialog>
  );
}

function PanicDialog({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const { toast } = useToast();
  const [kind, setKind] = React.useState("FIRE");
  const [location, setLocation] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  async function raise() {
    setSaving(true);
    try {
      const res = await fetch("/api/security", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "panic", kind, location }),
      });
      const json = await res.json();
      if (json.ok) {
        toast({ title: `ALERT SENT — ${json.data.notified} staff alerted, ${json.data.smsSent} leadership SMS`, tone: "error" });
        onDone();
      } else toast({ title: json.error?.message || "Failed", tone: "error" });
    } finally { setSaving(false); }
  }

  return (
    <Dialog title="🚨 Raise an emergency alert" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <Label>Emergency type</Label>
          <div className="flex flex-wrap gap-1.5">
            {["FIRE", "MEDICAL", "INTRUDER", "OTHER"].map((k) => (
              <button key={k} onClick={() => setKind(k)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${kind === k ? "bg-red-600 text-white" : "border border-navy-100 bg-white text-navy-600 dark:border-navy-800 dark:bg-navy-900 dark:text-navy-300"}`}>
                {k.charAt(0) + k.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
        <div><Label>Where?</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Science lab block" /></div>
        <Button onClick={raise} disabled={saving || location.trim().length < 2} className="w-full bg-red-600 hover:bg-red-700">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Siren className="h-4 w-4" />} SEND THE ALERT NOW
        </Button>
      </div>
    </Dialog>
  );
}

function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
      <AlertCircle className="h-4 w-4" /> Couldn&apos;t load. <button onClick={onRetry} className="font-medium underline">Retry</button>
    </div>
  );
}
