"use client";

/**
 * B.4 Academics — tabs: Subjects · Departments · Terms · Timetable · Lessons.
 * Timetable: Odoo-style weekly grid, click a cell to set subject+teacher,
 * conflict errors surface as toasts, plus the greedy Auto-fill dialog.
 * All 4 UX states; mobile = horizontal-scroll grid.
 */
import * as React from "react";
import {
  BookOpen, Building2, CalendarRange, Grid3X3, NotebookPen, Plus,
  AlertCircle, Loader2, X, Sparkles, Trash2, Check,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { TableContainer, Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";

interface Subject { id: string; name: string; code: string; curriculum: string; departmentId: string | null; departmentName: string | null; archived: boolean }
interface Dept { id: string; name: string; hodId: string | null; hodName: string | null; subjectCount: number }
interface Term { id: string; year: number; term: number; startDate: string; endDate: string; current: boolean }
interface ClassOpt { id: string; name: string }
interface Slot { id: string; dayOfWeek: number; period: number; subjectId: string; subjectName: string; subjectCode: string; teacherId: string | null; teacherName: string | null }
interface Plan { id: string; date: string; topic: string; status: string; subjectName: string; subjectCode: string; className: string; teacherName: string }
interface Staff { id: string; fullName: string; role: string }

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export function AcademicsClient({ canManage }: { canManage: boolean }) {
  const [tab, setTab] = React.useState<"subjects" | "departments" | "terms" | "timetable" | "lessons" | "generator">("subjects");
  const tabs = [
    { key: "subjects" as const, label: "Subjects", icon: BookOpen },
    { key: "departments" as const, label: "Departments", icon: Building2 },
    { key: "terms" as const, label: "Terms", icon: CalendarRange },
    { key: "timetable" as const, label: "Timetable", icon: Grid3X3 },
    { key: "lessons" as const, label: "Lesson plans", icon: NotebookPen },
    { key: "generator" as const, label: "Timetable Generator", icon: Sparkles },
  ];
  return (
    <div className="space-y-5">
      <div className="inline-flex max-w-full overflow-x-auto rounded-full border border-navy-200 p-0.5 dark:border-navy-700">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-200 ease-apple ${tab === t.key ? "bg-navy-900 text-white dark:bg-navy-50 dark:text-navy-900" : "text-navy-500"}`}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === "subjects" && <SubjectsTab canManage={canManage} />}
      {tab === "departments" && <DepartmentsTab canManage={canManage} />}
      {tab === "terms" && <TermsTab canManage={canManage} />}
      {tab === "timetable" && <TimetableTab canManage={canManage} />}
      {tab === "lessons" && <LessonsTab />}
      {tab === "generator" && <TimetableGeneratorTab canManage={canManage} />}
    </div>
  );
}

// ---- Subjects -----------------------------------------------------------------
function SubjectsTab({ canManage }: { canManage: boolean }) {
  const { toast } = useToast();
  const [subjects, setSubjects] = React.useState<Subject[] | null>(null);
  const [error, setError] = React.useState(false);
  const [dialog, setDialog] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    setError(false);
    try {
      const res = await fetch("/api/academics/subjects");
      const json = await res.json();
      if (json.ok) setSubjects(json.data.subjects); else setError(true);
    } catch { setError(true); }
  }, []);
  React.useEffect(() => { load(); }, [load]);

  async function addPreset(preset: "CBC" | "8-4-4") {
    setBusy(true);
    try {
      const res = await fetch("/api/academics/subjects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ preset }) });
      const json = await res.json();
      if (json.ok) { toast({ title: `${json.data.added} ${preset} subjects added`, tone: "success" }); load(); }
      else toast({ title: json.error?.message || "Failed", tone: "error" });
    } finally { setBusy(false); }
  }

  if (error) return <LoadError onRetry={load} />;
  if (subjects === null) return <Skeletons />;

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => setDialog(true)}><Plus className="h-4 w-4" /> New subject</Button>
          <Button variant="secondary" disabled={busy} onClick={() => addPreset("CBC")}><Sparkles className="h-4 w-4" /> Add CBC set</Button>
          <Button variant="secondary" disabled={busy} onClick={() => addPreset("8-4-4")}><Sparkles className="h-4 w-4" /> Add 8-4-4 set</Button>
        </div>
      )}
      {subjects.length === 0 ? (
        <EmptyState icon={BookOpen} title="No subjects yet" description='Use "Add CBC set" or "Add 8-4-4 set" to load the standard Kenyan subjects in one click.' />
      ) : (
        <TableContainer>
          <Table>
            <THead><TR><TH>Code</TH><TH>Subject</TH><TH>Curriculum</TH><TH>Department</TH></TR></THead>
            <TBody>
              {subjects.map((s) => (
                <TR key={s.id}>
                  <TD className="font-mono text-xs">{s.code}</TD>
                  <TD className="font-medium">{s.name}</TD>
                  <TD><Badge tone={s.curriculum === "CBC" ? "green" : s.curriculum === "8-4-4" ? "blue" : "neutral"}>{s.curriculum}</Badge></TD>
                  <TD className="text-navy-400">{s.departmentName ?? "—"}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </TableContainer>
      )}
      {dialog && <SubjectDialog onClose={() => setDialog(false)} onDone={() => { setDialog(false); load(); }} />}
    </div>
  );
}

function SubjectDialog({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const { toast } = useToast();
  const [f, setF] = React.useState({ name: "", code: "", curriculum: "BOTH" });
  const [saving, setSaving] = React.useState(false);
  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/academics/subjects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      const json = await res.json();
      if (json.ok) { toast({ title: "Subject added", tone: "success" }); onDone(); }
      else toast({ title: json.error?.message || "Failed", tone: "error" });
    } finally { setSaving(false); }
  }
  return (
    <Modal title="New subject" onClose={onClose}>
      <div className="space-y-3">
        <div><Label>Name</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. Mathematics" /></div>
        <div className="grid grid-cols-2 gap-2">
          <div><Label>Code</Label><Input value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} placeholder="MAT" /></div>
          <div>
            <Label>Curriculum</Label>
            <select value={f.curriculum} onChange={(e) => setF({ ...f, curriculum: e.target.value })} className="mt-1 w-full rounded-xl border border-navy-200 bg-white px-3 py-2 text-sm dark:border-navy-700 dark:bg-navy-800">
              <option value="BOTH">Both</option><option value="CBC">CBC</option><option value="8-4-4">8-4-4</option>
            </select>
          </div>
        </div>
        <Button onClick={save} disabled={saving || f.name.length < 2 || f.code.length < 2} className="w-full">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add subject
        </Button>
      </div>
    </Modal>
  );
}

// ---- Departments ----------------------------------------------------------------
function DepartmentsTab({ canManage }: { canManage: boolean }) {
  const { toast } = useToast();
  const [depts, setDepts] = React.useState<Dept[] | null>(null);
  const [error, setError] = React.useState(false);
  const [name, setName] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    setError(false);
    try {
      const res = await fetch("/api/academics/departments");
      const json = await res.json();
      if (json.ok) setDepts(json.data.departments); else setError(true);
    } catch { setError(true); }
  }, []);
  React.useEffect(() => { load(); }, [load]);

  async function add() {
    setSaving(true);
    try {
      const res = await fetch("/api/academics/departments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
      const json = await res.json();
      if (json.ok) { toast({ title: "Department added", tone: "success" }); setName(""); load(); }
      else toast({ title: json.error?.message || "Failed", tone: "error" });
    } finally { setSaving(false); }
  }

  if (error) return <LoadError onRetry={load} />;
  if (depts === null) return <Skeletons />;

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sciences" className="max-w-xs" />
          <Button onClick={add} disabled={saving || name.trim().length < 2}><Plus className="h-4 w-4" /> Add</Button>
        </div>
      )}
      {depts.length === 0 ? (
        <EmptyState icon={Building2} title="No departments yet" description="Group subjects under departments (Languages, Sciences, Humanities…) and assign HODs." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {depts.map((d) => (
            <Card key={d.id}>
              <CardContent className="p-4">
                <p className="text-sm font-semibold text-navy-900 dark:text-navy-50">{d.name}</p>
                <p className="mt-1 text-xs text-navy-400">{d.subjectCount} subject{d.subjectCount === 1 ? "" : "s"}{d.hodName ? ` · HOD: ${d.hodName}` : ""}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Terms -----------------------------------------------------------------------
function TermsTab({ canManage }: { canManage: boolean }) {
  const { toast } = useToast();
  const [terms, setTerms] = React.useState<Term[] | null>(null);
  const [error, setError] = React.useState(false);
  const [f, setF] = React.useState({ year: new Date().getFullYear(), term: 1, startDate: "", endDate: "", current: true });
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    setError(false);
    try {
      const res = await fetch("/api/academics/terms");
      const json = await res.json();
      if (json.ok) setTerms(json.data.terms); else setError(true);
    } catch { setError(true); }
  }, []);
  React.useEffect(() => { load(); }, [load]);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/academics/terms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      const json = await res.json();
      if (json.ok) { toast({ title: `Term ${f.term}, ${f.year} saved`, tone: "success" }); load(); }
      else toast({ title: json.error?.message || "Failed", tone: "error" });
    } finally { setSaving(false); }
  }

  if (error) return <LoadError onRetry={load} />;
  if (terms === null) return <Skeletons />;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>School terms</CardTitle></CardHeader>
        <CardContent>
          {terms.length === 0 ? (
            <EmptyState icon={CalendarRange} title="No terms set" description="Define Term 1–3 dates so reports, fees and analytics know the current term." />
          ) : (
            <ul className="divide-y divide-navy-50 dark:divide-navy-800">
              {terms.map((t) => (
                <li key={t.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="font-medium text-navy-900 dark:text-navy-50">Term {t.term}, {t.year}</span>
                  <span className="text-xs text-navy-400">{t.startDate} → {t.endDate}</span>
                  {t.current && <Badge tone="green">current</Badge>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      {canManage && (
        <Card>
          <CardHeader><CardTitle>Add / edit a term</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Year</Label><Input type="number" value={f.year} onChange={(e) => setF({ ...f, year: Number(e.target.value) })} /></div>
              <div>
                <Label>Term</Label>
                <select value={f.term} onChange={(e) => setF({ ...f, term: Number(e.target.value) })} className="mt-1 w-full rounded-xl border border-navy-200 bg-white px-3 py-2 text-sm dark:border-navy-700 dark:bg-navy-800">
                  <option value={1}>Term 1</option><option value={2}>Term 2</option><option value={3}>Term 3</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Starts</Label><Input type="date" value={f.startDate} onChange={(e) => setF({ ...f, startDate: e.target.value })} /></div>
              <div><Label>Ends</Label><Input type="date" value={f.endDate} onChange={(e) => setF({ ...f, endDate: e.target.value })} /></div>
            </div>
            <label className="flex items-center gap-2 text-sm text-navy-600 dark:text-navy-300">
              <input type="checkbox" checked={f.current} onChange={(e) => setF({ ...f, current: e.target.checked })} className="h-4 w-4 rounded border-navy-300 text-green-600 focus:ring-green-500" />
              This is the current term
            </label>
            <Button onClick={save} disabled={saving || !f.startDate || !f.endDate} className="w-full">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save term
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---- Timetable ---------------------------------------------------------------------
function TimetableTab({ canManage }: { canManage: boolean }) {
  const { toast } = useToast();
  const [classes, setClasses] = React.useState<ClassOpt[]>([]);
  const [classId, setClassId] = React.useState("");
  const [slots, setSlots] = React.useState<Slot[] | null>(null);
  const [config, setConfig] = React.useState<any>(null);
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [staff, setStaff] = React.useState<Staff[]>([]);
  const [error, setError] = React.useState(false);
  const [cell, setCell] = React.useState<{ day: number; period: number } | null>(null);
  const [autoOpen, setAutoOpen] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/classes").then((r) => r.json()).then((j) => { if (j.ok) { setClasses(j.data.classes); if (j.data.classes[0]) setClassId(j.data.classes[0].id); } });
    fetch("/api/academics/subjects").then((r) => r.json()).then((j) => j.ok && setSubjects(j.data.subjects));
    fetch("/api/conversations/recipients").then((r) => r.json()).then((j) => j.ok && setStaff((j.data.recipients ?? []).filter((u: Staff & { role: string }) => ["TEACHER", "CLASS_TEACHER", "HOD", "DEPUTY_PRINCIPAL"].includes(u.role))));
  }, []);

  const load = React.useCallback(async () => {
    if (!classId) return;
    setError(false); setSlots(null); setConfig(null);
    try {
      const res = await fetch(`/api/academics/timetable?classId=${classId}`);
      const json = await res.json();
      if (json.ok) {
        setSlots(json.data.slots);
        setConfig(json.data.config);
      } else setError(true);
    } catch { setError(true); }
  }, [classId]);
  React.useEffect(() => { load(); }, [load]);

  const grid = new Map<string, Slot>();
  for (const s of slots ?? []) grid.set(`${s.dayOfWeek}|${s.period}`, s);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select value={classId} onChange={(e) => setClassId(e.target.value)} className="rounded-full border border-navy-200 bg-white px-3 py-2 text-sm dark:border-navy-700 dark:bg-navy-900">
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {canManage && classId && (
          <Button variant="secondary" onClick={() => setAutoOpen(true)}><Sparkles className="h-4 w-4" /> Auto-fill week</Button>
        )}
      </div>

      {error ? <LoadError onRetry={load} /> : slots === null ? <Skeletons /> : (
        <div className="overflow-x-auto rounded-2xl border border-navy-100 dark:border-navy-800">
          <table className="w-full min-w-[640px] border-collapse bg-white text-xs dark:bg-navy-900">
            <thead>
              <tr className="bg-warm-50 dark:bg-navy-800">
                <th className="w-14 border-b border-navy-100 p-2 text-left font-semibold text-navy-400 dark:border-navy-800">#</th>
                {DAY_NAMES.map((d) => <th key={d} className="border-b border-navy-100 p-2 text-left font-semibold text-navy-600 dark:border-navy-800 dark:text-navy-300">{d}</th>)}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => {
                const rows = [];
                
                // Render standard period row
                rows.push(
                  <tr key={p}>
                    <td className="border-b border-navy-50 p-2 font-mono text-navy-400 dark:border-navy-800">P{p}</td>
                    {[1, 2, 3, 4, 5].map((d) => {
                      const s = grid.get(`${d}|${p}`);
                      const isLunch = s?.subjectCode === "LUNCH";
                      const isFree = s?.subjectCode === "FREE";
                      const cellBg = isLunch
                        ? "bg-red-50 hover:bg-red-100 dark:bg-red-950/20"
                        : isFree
                        ? "bg-navy-50 hover:bg-navy-100/50 dark:bg-navy-900/10"
                        : s
                        ? "bg-green-50 hover:bg-green-100 dark:bg-green-900/20"
                        : canManage
                        ? "hover:bg-navy-50 dark:hover:bg-navy-800"
                        : "";

                      return (
                        <td key={d} className="border-b border-l border-navy-50 p-1 dark:border-navy-800">
                          <button
                            disabled={!canManage || isLunch}
                            onClick={() => setCell({ day: d, period: p })}
                            className={`block w-full rounded-lg px-2 py-1.5 text-left transition-colors duration-200 ease-apple ${cellBg}`}
                          >
                            {s ? (
                              isLunch ? (
                                <span className="font-bold text-red-600 dark:text-red-400 uppercase text-[10px]">Lunch Break</span>
                              ) : isFree ? (
                                <span className="font-medium text-navy-400 dark:text-navy-500 italic">Free Study</span>
                              ) : (
                                <>
                                  <span className="font-semibold text-navy-900 dark:text-navy-50">{s.subjectCode}</span>
                                  {s.teacherName && <span className="block truncate text-[10px] text-navy-400">{s.teacherName}</span>}
                                </>
                              )
                            ) : (
                              <span className="text-navy-200 dark:text-navy-700">—</span>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );

                // Check for dynamic short break
                if (config && p === config.shortBreakStart) {
                  rows.push(
                    <tr key={`short-break-${p}`} className="bg-amber-500/10 text-center font-bold text-amber-700 dark:bg-amber-950/20 dark:text-amber-300">
                      <td className="p-2 border-b border-navy-50 font-mono text-navy-400">BREAK</td>
                      <td colSpan={5} className="p-2 border-b border-l border-navy-50 text-xs">
                        Short Break ({config.shortBreakMins} mins)
                      </td>
                    </tr>
                  );
                }

                // Check for dynamic long break
                if (config && p === config.longBreakStart) {
                  rows.push(
                    <tr key={`long-break-${p}`} className="bg-amber-500/10 text-center font-bold text-amber-700 dark:bg-amber-950/20 dark:text-amber-300">
                      <td className="p-2 border-b border-navy-50 font-mono text-navy-400">BREAK</td>
                      <td colSpan={5} className="p-2 border-b border-l border-navy-50 text-xs">
                        Long Break ({config.longBreakMins} mins)
                      </td>
                    </tr>
                  );
                }

                return rows;
              })}
            </tbody>
          </table>
        </div>
      )}

      {cell && classId && (
        <SlotDialog
          classId={classId} day={cell.day} period={cell.period}
          existing={grid.get(`${cell.day}|${cell.period}`) ?? null}
          subjects={subjects.filter((s) => !s.archived)} staff={staff}
          onClose={() => setCell(null)}
          onDone={() => { setCell(null); load(); }}
        />
      )}
      {autoOpen && classId && (
        <AutoFillDialog classId={classId} subjects={subjects.filter((s) => !s.archived)} staff={staff}
          onClose={() => setAutoOpen(false)}
          onDone={(msg) => { setAutoOpen(false); toast({ title: msg, tone: "success" }); load(); }} />
      )}
    </div>
  );
}

function SlotDialog({ classId, day, period, existing, subjects, staff, onClose, onDone }: {
  classId: string; day: number; period: number; existing: Slot | null;
  subjects: Subject[]; staff: Staff[]; onClose: () => void; onDone: () => void;
}) {
  const { toast } = useToast();
  const [subjectId, setSubjectId] = React.useState(existing?.subjectId ?? "");
  const [teacherId, setTeacherId] = React.useState(existing?.teacherId ?? "");
  const [saving, setSaving] = React.useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/academics/timetable", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set", classId, subjectId, teacherId, dayOfWeek: day, period }),
      });
      const json = await res.json();
      if (json.ok) onDone();
      else toast({ title: json.error?.message || "Failed", tone: "error" });
    } finally { setSaving(false); }
  }
  async function clear() {
    setSaving(true);
    try {
      await fetch("/api/academics/timetable", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "clear", classId, dayOfWeek: day, period }) });
      onDone();
    } finally { setSaving(false); }
  }

  return (
    <Modal title={`${DAY_NAMES[day - 1]} · Period ${period}`} onClose={onClose}>
      <div className="space-y-3">
        <div>
          <Label>Subject</Label>
          <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="mt-1 w-full rounded-xl border border-navy-200 bg-white px-3 py-2 text-sm dark:border-navy-700 dark:bg-navy-800">
            <option value="">Choose…</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
          </select>
        </div>
        <div>
          <Label>Teacher (optional — enables clash detection)</Label>
          <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className="mt-1 w-full rounded-xl border border-navy-200 bg-white px-3 py-2 text-sm dark:border-navy-700 dark:bg-navy-800">
            <option value="">—</option>
            {staff.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          {existing && <Button variant="ghost" className="text-red-600" onClick={clear} disabled={saving}><Trash2 className="h-4 w-4" /> Clear</Button>}
          <Button onClick={save} disabled={saving || !subjectId} className="flex-1">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save period
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function AutoFillDialog({ classId, subjects, staff, onClose, onDone }: {
  classId: string; subjects: Subject[]; staff: Staff[];
  onClose: () => void; onDone: (msg: string) => void;
}) {
  const { toast } = useToast();
  const [load, setLoad] = React.useState<Record<string, number>>({});
  const [teachers, setTeachers] = React.useState<Record<string, string>>({});
  const [clearExisting, setClear] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const total = Object.values(load).reduce((a, b) => a + b, 0);

  async function run() {
    setSaving(true);
    try {
      const res = await fetch("/api/academics/timetable", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "autofill", classId, weeklyLoad: load, teachers, clearExisting }),
      });
      const json = await res.json();
      if (json.ok) {
        const un = json.data.unplaced.length;
        onDone(`${json.data.placed} periods placed${un ? ` · ${un} subject(s) could not fully fit` : ""}`);
      } else toast({ title: json.error?.message || "Failed", tone: "error" });
    } finally { setSaving(false); }
  }

  return (
    <Modal title="Auto-fill the week" onClose={onClose} wide>
      <p className="mb-3 text-xs text-navy-500 dark:text-navy-400">
        Set lessons-per-week for each subject (and optionally the teacher — their clashes across other classes are avoided automatically). 40 periods available.
      </p>
      <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
        {subjects.map((s) => (
          <div key={s.id} className="flex items-center gap-2">
            <span className="w-40 truncate text-sm text-navy-800 dark:text-navy-100">{s.name}</span>
            <Input type="number" min={0} max={10} className="w-20" value={load[s.id] ?? ""} placeholder="0"
              onChange={(e) => { const v = Number(e.target.value); setLoad((p) => { const n = { ...p }; if (v > 0) n[s.id] = v; else delete n[s.id]; return n; }); }} />
            <select value={teachers[s.id] ?? ""} onChange={(e) => setTeachers((p) => ({ ...p, [s.id]: e.target.value }))}
              className="flex-1 rounded-xl border border-navy-200 bg-white px-2 py-1.5 text-xs dark:border-navy-700 dark:bg-navy-800">
              <option value="">No teacher</option>
              {staff.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
            </select>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs text-navy-600 dark:text-navy-300">
          <input type="checkbox" checked={clearExisting} onChange={(e) => setClear(e.target.checked)} className="h-3.5 w-3.5 rounded border-navy-300 text-green-600" />
          Clear existing periods first
        </label>
        <Button onClick={run} disabled={saving || total === 0 || total > 40}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Place {total} period{total === 1 ? "" : "s"}
        </Button>
      </div>
    </Modal>
  );
}

// ---- Lesson plans -------------------------------------------------------------------
function LessonsTab() {
  const { toast } = useToast();
  const [plans, setPlans] = React.useState<Plan[] | null>(null);
  const [error, setError] = React.useState(false);
  const [dialog, setDialog] = React.useState(false);
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [classes, setClasses] = React.useState<ClassOpt[]>([]);

  const load = React.useCallback(async () => {
    setError(false);
    try {
      const res = await fetch("/api/academics/lesson-plans");
      const json = await res.json();
      if (json.ok) setPlans(json.data.plans); else setError(true);
    } catch { setError(true); }
  }, []);
  React.useEffect(() => {
    load();
    fetch("/api/academics/subjects").then((r) => r.json()).then((j) => j.ok && setSubjects(j.data.subjects));
    fetch("/api/classes").then((r) => r.json()).then((j) => j.ok && setClasses(j.data.classes));
  }, [load]);

  async function setStatus(id: string, status: string) {
    const res = await fetch(`/api/academics/lesson-plans?id=${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    const json = await res.json();
    if (json.ok) load();
    else toast({ title: json.error?.message || "Failed", tone: "error" });
  }

  if (error) return <LoadError onRetry={load} />;
  if (plans === null) return <Skeletons />;

  return (
    <div className="space-y-4">
      <Button onClick={() => setDialog(true)}><Plus className="h-4 w-4" /> Plan a lesson</Button>
      {plans.length === 0 ? (
        <EmptyState icon={NotebookPen} title="No lesson plans yet" description="Teachers plan their lessons here — topic, objectives and activities per class and date." />
      ) : (
        <TableContainer>
          <Table>
            <THead><TR><TH>Date</TH><TH>Class</TH><TH>Subject</TH><TH>Topic</TH><TH>Teacher</TH><TH>Status</TH></TR></THead>
            <TBody>
              {plans.map((p) => (
                <TR key={p.id}>
                  <TD className="text-xs text-navy-400">{p.date}</TD>
                  <TD>{p.className}</TD>
                  <TD className="font-mono text-xs">{p.subjectCode}</TD>
                  <TD className="font-medium">{p.topic}</TD>
                  <TD className="text-xs text-navy-400">{p.teacherName}</TD>
                  <TD>
                    <select value={p.status} onChange={(e) => setStatus(p.id, e.target.value)} className="rounded-full border border-navy-200 bg-white px-2 py-1 text-xs dark:border-navy-700 dark:bg-navy-800">
                      <option value="PLANNED">Planned</option><option value="TAUGHT">Taught</option><option value="SKIPPED">Skipped</option>
                    </select>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </TableContainer>
      )}
      {dialog && <PlanDialog subjects={subjects} classes={classes} onClose={() => setDialog(false)} onDone={() => { setDialog(false); load(); toast({ title: "Lesson planned", tone: "success" }); }} />}
    </div>
  );
}

function PlanDialog({ subjects, classes, onClose, onDone }: {
  subjects: Subject[]; classes: ClassOpt[]; onClose: () => void; onDone: () => void;
}) {
  const { toast } = useToast();
  const [f, setF] = React.useState({ subjectId: "", classId: "", date: new Date(Date.now() + 3 * 3600_000).toISOString().slice(0, 10), topic: "", objectives: "", activities: "" });
  const [saving, setSaving] = React.useState(false);
  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/academics/lesson-plans", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      const json = await res.json();
      if (json.ok) onDone();
      else toast({ title: json.error?.message || "Failed", tone: "error" });
    } finally { setSaving(false); }
  }
  return (
    <Modal title="Plan a lesson" onClose={onClose}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Class</Label>
            <select value={f.classId} onChange={(e) => setF({ ...f, classId: e.target.value })} className="mt-1 w-full rounded-xl border border-navy-200 bg-white px-3 py-2 text-sm dark:border-navy-700 dark:bg-navy-800">
              <option value="">Choose…</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <Label>Subject</Label>
            <select value={f.subjectId} onChange={(e) => setF({ ...f, subjectId: e.target.value })} className="mt-1 w-full rounded-xl border border-navy-200 bg-white px-3 py-2 text-sm dark:border-navy-700 dark:bg-navy-800">
              <option value="">Choose…</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
        <div><Label>Date</Label><Input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></div>
        <div><Label>Topic</Label><Input value={f.topic} onChange={(e) => setF({ ...f, topic: e.target.value })} placeholder="e.g. Quadratic equations — completing the square" /></div>
        <div><Label>Objectives (optional)</Label><Input value={f.objectives} onChange={(e) => setF({ ...f, objectives: e.target.value })} /></div>
        <div><Label>Activities (optional)</Label><Input value={f.activities} onChange={(e) => setF({ ...f, activities: e.target.value })} /></div>
        <Button onClick={save} disabled={saving || !f.classId || !f.subjectId || f.topic.length < 2} className="w-full">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Save plan
        </Button>
      </div>
    </Modal>
  );
}

// ---- Timetable Generator (G.18) ------------------------------------------------------
function TimetableGeneratorTab({ canManage }: { canManage: boolean }) {
  const { toast } = useToast();
  const [data, setData] = React.useState<any>(null);
  const [error, setError] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  
  // Dialog controls
  const [teacherSubjectsDialog, setTeacherSubjectsDialog] = React.useState<string | null>(null);
  const [subjectNeedsDialog, setSubjectNeedsDialog] = React.useState<string | null>(null);
  const [classConfigDialog, setClassConfigDialog] = React.useState<string | null>(null);

  // Result report state
  const [reportResult, setReportResult] = React.useState<any>(null);

  const load = React.useCallback(async () => {
    setError(false);
    try {
      const res = await fetch("/api/academics/timetable/generator");
      const json = await res.json();
      if (json.ok) setData(json.data); else setError(true);
    } catch { setError(true); }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  async function generate() {
    if (!window.confirm("This will completely clear the current timetable slots and generate a brand-new conflict-free schedule for the whole school. Continue?")) return;
    setBusy(true);
    setReportResult(null);
    try {
      const res = await fetch("/api/academics/timetable/generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate" }),
      });
      const json = await res.json();
      if (json.ok) {
        toast({ title: "Timetable Generated successfully!", tone: "success" });
        setReportResult(json.data);
      } else {
        toast({ title: json.error?.message || "Generation failed", tone: "error" });
      }
    } catch {
      toast({ title: "Failed to connect to the generator", tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  if (error) return <LoadError onRetry={load} />;
  if (data === null) return <Skeletons />;

  return (
    <div className="space-y-6">
      {/* 1) CSP Generator Hero Banner */}
      <Card className="bg-gradient-to-r from-green-500/10 via-blue-500/10 to-navy-500/10 border border-green-200/50">
        <CardContent className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1 flex-1">
            <h2 className="text-lg font-bold text-navy-900 dark:text-navy-50 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-green-600 animate-pulse" />
              NEYO Auto Generator
            </h2>
            <p className="text-xs text-navy-500 dark:text-navy-400 max-w-xl leading-relaxed">
              Generate a perfectly optimized, completely conflict-free weekly schedule for all classes and teachers simultaneously. Auto-reserves co-curricular slots and free lessons cleanly.
            </p>
          </div>
          {canManage && (
            <Button size="lg" disabled={busy} onClick={generate} className="shadow-lg hover:shadow-green-500/20 shrink-0">
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
              Generate Timetable
            </Button>
          )}
        </CardContent>
      </Card>

      {/* 2) Solver Generation Report Card */}
      {reportResult && (
        <Card className="border border-green-500/30 bg-green-50/20">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-green-700 dark:text-green-400">Generation Result Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-navy-700 dark:text-navy-200">
              Successfully placed <span className="font-bold">{reportResult.slotsPlacedCount} lessons</span> across <span className="font-bold">{reportResult.classesCount} active classes</span> with absolutely zero teacher or class double-bookings.
            </p>
            {reportResult.unplacedLoads.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 text-xs text-amber-800 space-y-2 dark:border-amber-700/40">
                <p className="font-bold">Honest Solver Unplaced Loads Report:</p>
                {reportResult.unplacedLoads.map((ul: any, idx: number) => (
                  <p key={idx}>· {ul.classLabel} - {ul.subjectCode}: {ul.reason}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 3) Management Grid Areas */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* A) Teacher Subjects Setup */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Teacher Subjects Mapping</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-navy-400">Configure what subjects each teacher is qualified to teach so the solver can assign lessons automatically.</p>
            <div className="divide-y divide-navy-50 dark:divide-navy-800">
              {data.teachers.map((t: any) => {
                const sids = data.teacherAssoc.filter((a: any) => a.teacherId === t.id).map((a: any) => a.subjectId);
                const subNames = data.subjects.filter((s: any) => sids.includes(s.id)).map((s: any) => s.code).join(", ");
                return (
                  <button key={t.id} onClick={() => canManage && setTeacherSubjectsDialog(t.id)} disabled={!canManage}
                    className="flex w-full items-center justify-between py-2.5 text-left hover:bg-navy-50/50 rounded-lg px-2 -mx-2 transition-colors">
                    <div>
                      <p className="text-sm font-semibold text-navy-800 dark:text-navy-100">{t.fullName}</p>
                      <p className="text-xs text-navy-400">{subNames || "No subjects configured"}</p>
                    </div>
                    {canManage && <Badge tone="neutral">Edit</Badge>}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* B) Class Settings & Subject Load Needs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Class Subject Loads &amp; Configurations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-navy-400">Set weekly lessons-per-subject needs and general parameters (co-curricular name, free lessons per week) per class.</p>
            <div className="divide-y divide-navy-50 dark:divide-navy-800">
              {data.classes.map((c: any) => {
                const config = data.configs.find((cfg: any) => cfg.classId === c.id) || {
                  freePeriodsPerWeek: 4,
                  coCurricularName: "Games",
                };
                const classLabel = [c.level, c.stream].filter(Boolean).join(" ");
                return (
                  <div key={c.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-navy-800 dark:text-navy-100">{classLabel}</p>
                      <p className="text-xs text-navy-400">Co-curricular: {config.coCurricularName} · Free periods: {config.freePeriodsPerWeek}/week</p>
                    </div>
                    {canManage && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setClassConfigDialog(c.id)}>Config</Button>
                        <Button size="sm" onClick={() => setSubjectNeedsDialog(c.id)}>Needs Matrix</Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4) Modal Dialogs */}
      {teacherSubjectsDialog && (
        <TeacherSubjectsModal
          teacherId={teacherSubjectsDialog}
          subjects={data.subjects}
          currentSubjectIds={data.teacherAssoc.filter((a: any) => a.teacherId === teacherSubjectsDialog).map((a: any) => a.subjectId)}
          onClose={() => setTeacherSubjectsDialog(null)}
          onSaved={() => { setTeacherSubjectsDialog(null); load(); toast({ title: "Teacher subjects updated", tone: "success" }); }}
        />
      )}

      {subjectNeedsDialog && (
        <SubjectNeedsModal
          classId={subjectNeedsDialog}
          subjects={data.subjects}
          teachers={data.teachers}
          currentNeeds={data.needs.filter((n: any) => n.classId === subjectNeedsDialog)}
          onClose={() => setSubjectNeedsDialog(null)}
          onSaved={() => { setSubjectNeedsDialog(null); load(); toast({ title: "Class load needs updated", tone: "success" }); }}
        />
      )}

      {classConfigDialog && (
        <ClassConfigModal
          classId={classConfigDialog}
          currentConfig={data.configs.find((cfg: any) => cfg.classId === classConfigDialog) || null}
          onClose={() => setClassConfigDialog(null)}
          onSaved={() => { setClassConfigDialog(null); load(); toast({ title: "Class timetable settings updated", tone: "success" }); }}
        />
      )}

      {/* Powered by NEYO Generator footer */}
      <div className="text-center pt-8 border-t border-navy-100 dark:border-navy-800 text-xs text-navy-400">
        Powered by NEYO Generator · neyo.co.ke
      </div>
    </div>
  );
}

// ---- Submodal Components -------------------------------------------------------------
function TeacherSubjectsModal({ teacherId, subjects, currentSubjectIds, onClose, onSaved }: {
  teacherId: string; subjects: any[]; currentSubjectIds: string[]; onClose: () => void; onSaved: () => void;
}) {
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set(currentSubjectIds));
  const [saving, setSaving] = React.useState(false);

  function toggle(sid: string) {
    const next = new Set(selectedIds);
    if (next.has(sid)) next.delete(sid); else next.add(sid);
    setSelectedIds(next);
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/academics/timetable/generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_teacher_subject", teacherId, subjectIds: [...selectedIds] }),
      });
      const json = await res.json();
      if (json.ok) onSaved();
    } finally { setSaving(false); }
  }

  return (
    <Modal title="Configure Qualified Subjects" onClose={onClose} wide>
      <p className="mb-3 text-xs text-navy-400">Select which subjects this teacher teaches. The solver uses this map to auto-assign teachers during slot scheduling.</p>
      <div className="max-h-72 overflow-y-auto space-y-2 mb-4 pr-1">
        {subjects.map((s) => (
          <label key={s.id} className="flex items-center gap-2.5 rounded-lg p-2 hover:bg-navy-50 text-sm text-navy-700 dark:text-navy-200 cursor-pointer">
            <input type="checkbox" checked={selectedIds.has(s.id)} onChange={() => toggle(s.id)} className="h-4 w-4 rounded border-navy-300 text-green-600 focus:ring-green-500" />
            <span>{s.name} ({s.code})</span>
          </label>
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}</Button>
      </div>
    </Modal>
  );
}

function SubjectNeedsModal({ classId, subjects, teachers, currentNeeds, onClose, onSaved }: {
  classId: string; subjects: any[]; teachers: any[]; currentNeeds: any[]; onClose: () => void; onSaved: () => void;
}) {
  const [saving, setSaving] = React.useState(false);
  const [needs, setNeeds] = React.useState<Record<string, { lessons: number; teacherId: string }>>(() => {
    const map: Record<string, { lessons: number; teacherId: string }> = {};
    for (const s of subjects) {
      const n = currentNeeds.find((x) => x.subjectId === s.id);
      map[s.id] = { lessons: n?.lessonsPerWeek ?? 0, teacherId: n?.teacherId ?? "" };
    }
    return map;
  });

  async function save() {
    setSaving(true);
    try {
      // Save each subject need that has lessons > 0 or has changes
      for (const sid of Object.keys(needs)) {
        const item = needs[sid];
        await fetch("/api/academics/timetable/generator", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "save_need",
            classId,
            subjectId: sid,
            lessonsPerWeek: item.lessons,
            teacherId: item.teacherId || null,
          }),
        });
      }
      onSaved();
    } finally { setSaving(false); }
  }

  function updateLessons(sid: string, val: number) {
    setNeeds((p) => ({ ...p, [sid]: { ...p[sid], lessons: val } }));
  }

  function updateTeacher(sid: string, val: string) {
    setNeeds((p) => ({ ...p, [sid]: { ...p[sid], teacherId: val } }));
  }

  return (
    <Modal title="Configure Subject Loads" onClose={onClose} wide>
      <p className="mb-3 text-xs text-navy-400">Configure weekly lessons needs and the assigned subject teacher (The Input Matrix) for this class.</p>
      <div className="max-h-80 overflow-y-auto space-y-3 mb-4 pr-1">
        {subjects.map((s) => {
          const item = needs[s.id] || { lessons: 0, teacherId: "" };
          return (
            <div key={s.id} className="flex items-center gap-3 rounded-xl border border-navy-100 p-2.5 dark:border-navy-800">
              <span className="w-28 truncate text-sm font-medium text-navy-800 dark:text-navy-100">{s.name}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <Label className="text-[10px] text-navy-400">Lessons/wk</Label>
                <Input type="number" min={0} max={10} value={item.lessons || ""} placeholder="0" className="w-16 h-8 text-xs"
                  onChange={(e) => updateLessons(s.id, Number(e.target.value))} />
              </div>
              <div className="flex-1">
                <select value={item.teacherId} onChange={(e) => updateTeacher(s.id, e.target.value)}
                  className="w-full h-8 rounded-lg border border-navy-200 bg-white px-2 text-xs dark:border-navy-700 dark:bg-navy-900 text-navy-800 dark:text-navy-100">
                  <option value="">Choose Teacher…</option>
                  {teachers.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                </select>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Needs Matrix"}</Button>
      </div>
    </Modal>
  );
}

function ClassConfigModal({ classId, currentConfig, onClose, onSaved }: {
  classId: string; currentConfig: any | null; onClose: () => void; onSaved: () => void;
}) {
  const [saving, setSaving] = React.useState(false);
  const [f, setF] = React.useState({
    periodsPerDay: currentConfig?.periodsPerDay ?? 8,
    freePeriodsPerWeek: currentConfig?.freePeriodsPerWeek ?? 4,
    coCurricularCount: currentConfig?.coCurricularCount ?? 2,
    coCurricularName: currentConfig?.coCurricularName ?? "Games",
    lessonDurationMins: currentConfig?.lessonDurationMins ?? 40,
    shortBreakStart: currentConfig?.shortBreakStart ?? 2,
    shortBreakMins: currentConfig?.shortBreakMins ?? 15,
    longBreakStart: currentConfig?.longBreakStart ?? 4,
    longBreakMins: currentConfig?.longBreakMins ?? 30,
    lunchStart: currentConfig?.lunchStart ?? 6,
    lunchMins: currentConfig?.lunchMins ?? 60,
    hasRemedials: currentConfig?.hasRemedials ?? false,
    hasPreps: currentConfig?.hasPreps ?? false,
    lunchShift: currentConfig?.lunchShift ?? 1,
  });

  const set = (k: string, v: any) => setF((p) => ({ ...p, [k]: v }));

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/academics/timetable/generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_config", classId, ...f }),
      });
      const json = await res.json();
      if (json.ok) onSaved();
    } finally { setSaving(false); }
  }

  return (
    <Modal title="Configure General Schedule Rules" onClose={onClose} wide>
      <div className="space-y-4 mb-4 max-h-96 overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="cfg-periods">Periods Per Day</Label>
            <Input id="cfg-periods" type="number" min={4} max={10} value={f.periodsPerDay} onChange={(e) => set("periodsPerDay", Number(e.target.value))} />
          </div>
          <div>
            <Label htmlFor="cfg-duration">Lesson Duration (mins)</Label>
            <Input id="cfg-duration" type="number" min={10} max={120} value={f.lessonDurationMins} onChange={(e) => set("lessonDurationMins", Number(e.target.value))} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="cfg-free">Free study periods / week</Label>
            <Input id="cfg-free" type="number" min={0} max={15} value={f.freePeriodsPerWeek} onChange={(e) => set("freePeriodsPerWeek", Number(e.target.value))} />
          </div>
          <div>
            <Label htmlFor="cfg-coconname">Co-curricular Activity</Label>
            <Input id="cfg-coconname" value={f.coCurricularName} onChange={(e) => set("coCurricularName", e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="cfg-cocon">Co-curricular slots / week</Label>
            <Input id="cfg-cocon" type="number" min={0} max={4} value={f.coCurricularCount} onChange={(e) => set("coCurricularCount", Number(e.target.value))} />
          </div>
          <div className="flex flex-col gap-2 pt-5">
            <label className="flex items-center gap-2 text-sm text-navy-600 dark:text-navy-300 select-none cursor-pointer">
              <input type="checkbox" checked={f.hasRemedials} onChange={(e) => set("hasRemedials", e.target.checked)} className="h-4 w-4 rounded border-navy-300 text-green-600" />
              <span>Participates in Remedials</span>
            </label>
            <label className="flex items-center gap-2 text-sm text-navy-600 dark:text-navy-300 select-none cursor-pointer">
              <input type="checkbox" checked={f.hasPreps} onChange={(e) => set("hasPreps", e.target.checked)} className="h-4 w-4 rounded border-navy-300 text-green-600" />
              <span>Participates in Preps</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="cfg-lunchshift">Lunch Shift</Label>
            <select
              id="cfg-lunchshift"
              value={f.lunchShift}
              onChange={(e) => set("lunchShift", Number(e.target.value))}
              className="mt-1 w-full h-10 rounded-2xl border border-navy-200 bg-white px-3.5 text-sm dark:border-navy-700 dark:bg-navy-900 text-navy-800 dark:text-navy-100"
            >
              <option value={1}>Shift 1 (Period 5)</option>
              <option value={2}>Shift 2 (Period 6)</option>
              <option value={3}>Shift 3 (Period 7)</option>
            </select>
          </div>
        </div>

        <div className="border-t border-navy-100 dark:border-navy-800 pt-3 space-y-3">
          <p className="text-xs font-bold text-navy-800 dark:text-navy-100">Configure Breaks &amp; Times</p>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-[10px]">Short Break After Period</Label>
              <Input type="number" value={f.shortBreakStart} onChange={(e) => set("shortBreakStart", Number(e.target.value))} />
            </div>
            <div>
              <Label className="text-[10px]">Short Break (mins)</Label>
              <Input type="number" value={f.shortBreakMins} onChange={(e) => set("shortBreakMins", Number(e.target.value))} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-[10px]">Long Break After Period</Label>
              <Input type="number" value={f.longBreakStart} onChange={(e) => set("longBreakStart", Number(e.target.value))} />
            </div>
            <div>
              <Label className="text-[10px]">Long Break (mins)</Label>
              <Input type="number" value={f.longBreakMins} onChange={(e) => set("longBreakMins", Number(e.target.value))} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-[10px]">Lunch Break After Period</Label>
              <Input type="number" value={f.lunchStart} onChange={(e) => set("lunchStart", Number(e.target.value))} />
            </div>
            <div>
              <Label className="text-[10px]">Lunch Break (mins)</Label>
              <Input type="number" value={f.lunchMins} onChange={(e) => set("lunchMins", Number(e.target.value))} />
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Config"}</Button>
      </div>
    </Modal>
  );
}

// ---- shared bits ---------------------------------------------------------------------
function Modal({ title, children, onClose, wide }: { title: string; children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy-950/40 p-4 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div className={`w-full ${wide ? "max-w-lg" : "max-w-md"} rounded-2xl bg-white p-6 shadow-card dark:bg-navy-900`} onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between">
          <h3 className="text-base font-semibold text-navy-900 dark:text-navy-50">{title}</h3>
          <button onClick={onClose} className="rounded-full p-1 text-navy-400 hover:bg-navy-50 dark:hover:bg-navy-800" aria-label="Close"><X className="h-4 w-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
      <AlertCircle className="h-4 w-4" /> Couldn&apos;t load. <button onClick={onRetry} className="font-medium underline">Retry</button>
    </div>
  );
}
function Skeletons() {
  return <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>;
}
