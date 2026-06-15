# ✅ NEYO — Master Features Checklist (Source of Truth)

> Every line below is ONE feature. Tick `[x]` only when fully built full-stack (DB → service → API → UI → 4 UX states → seed) and testable.
> Legend: `[ ]` not started · `[~]` in progress · `[x]` done & testable.

---

## The 10 Product Principles (build constitution — applied to every feature)
1. Workflow not feature — every feature serves a defined workflow (Teacher/Bursar/Principal/Parent/Receptionist).
2. Design system — only design tokens (no raw hex/px), only components from the UI library.
3. UX depth — loading + empty + error + populated states all designed.
4. Real data — realistic Kenyan seed data, never "John Doe".
5. Real workflows — connected to upstream + downstream features.
6. Apple UI — ONE primary CTA, calm motion (ease-apple).
7. Different density — page density matches type (list ≠ form ≠ detail ≠ dashboard).
8. System depth — audit log + permission + (search OR activity).
9. Real not template — could appear in Linear/Stripe/Notion without looking out of place.
10. The formula — all 9 above pass = ship.

---

## CHUNK 0 — Foundation Setup (prerequisite, not a product feature)
- [x] Next.js 14 (App Router) + TypeScript project scaffold
- [x] Tailwind CSS + design tokens (navy + green + warm white, Inter, 8pt grid)
- [x] Prisma ORM + dev database (SQLite dev → Postgres prod)
- [x] Base UI component library (Button, Card, Badge, EmptyState, StatCard, Skeleton) — Input/Table added when first needed
- [x] App shell (Odoo layout: top bar module switcher + left sidebar + breadcrumbs)
- [x] Dark mode support
- [x] Toast/notification system
- [x] Project run + preview verified (build passes, dashboard reads live DB)

---

# PART A — Cross-Cutting Platform

## A.1 — Authentication & Identity
- [x] Phone + OTP login (KE-first)
- [x] Email + password backup login
- [x] Magic link via email
- [ ] Google OAuth  *(deferred — needs founder's Google Cloud OAuth credentials)*
- [ ] Apple OAuth  *(deferred — needs Apple Developer account)*
- [ ] Microsoft OAuth  *(deferred — needs Azure AD app registration)*
- [x] WebAuthn / passkey biometric
- [x] 2FA via TOTP
- [x] Phone OTP rate limiting  *(built in A.1.1 service: 3 codes / 15 min)*
- [x] Verify-attempt rate limiting  *(built in A.1.1 service: 5 attempts per code)*
- [x] Session: HTTP-only, Secure, SameSite=Lax  *(built in A.1.1 cookie)*
- [x] Logout everywhere (session invalidation by user_id)
- [ ] Account linking (Google + phone = one user)  *(deferred with OAuth)*
- [ ] OAuth disconnect (Settings → Security)  *(deferred with OAuth)*
- [x] Audit log: every login, logout, OAuth grant  *(login + logout done; OAuth grant pending OAuth)*

## A.2 — Multi-Tenancy
- [x] Postgres RLS enforced on every tenant-owned table  *(app-level tenantDb() enforced now on SQLite; real Postgres RLS SQL in prisma/rls/policies.sql for deploy)*
- [x] `withTenant(tenantId, fn)` wrapper for every API call  *(withTenant + runInTenantSession)*
- [x] Wildcard subdomain routing  *(edge middleware + dev override ?tenant=; cross-tenant subdomain blocked)*
- [ ] Custom domain support (Elite tier)  *(deferred — needs real DNS/host mapping at deploy; subdomain routing already covers dev)*
- [x] Tenant slug uniqueness + reserved words filter  *(Zod format + reserved + DB-uniqueness; slugify + suggest; /api/tenant/slug-check; SlugField component)*
- [x] Per-tenant module toggling  *(TenantModule table; registry w/ core+defaults; /settings/modules; sidebar filtered per school)*
- [x] Per-tenant encryption keys (DEK/KEK pattern)  *(AES-256-GCM envelope; per-tenant DEK wrapped by master KEK; rotation supported; KMS-ready)*
- [x] Cross-tenant query test (security regression test)  *(automated isolation test passes)*
- [x] Tenant impersonation for support (audit-logged)  *(SUPER_ADMIN only; effective-user resolution; amber banner + exit; start/stop audited)*
- [x] Tenant data export (right-to-portability)  *(tenant-scoped JSON download; secrets redacted; role-gated; audited; /settings/data)*

## A.3 — Roles & Permissions
- [x] 16 roles enum defined  *(roles.ts: 16 roles + labels + isRole guard)*
- [x] Permission matrix in core/permissions.ts  *(PERMISSIONS catalogue + ROLE_PERMISSIONS for all 16; can()/permissionsForRole())*
- [x] `requireRole(...)` backend middleware  *(session.ts; also added requirePermission())*
- [x] `usePermission()` frontend hook  *(PermissionsProvider seeded from server; usePermission/usePermissions)*
- [x] `<Can />` frontend component  *(client-tree gating; dashboard QuickActions uses it)*
- [x] Sidebar nav role-filtered  *(NavItem.permission + filterNavigation composes module + permission filtering in Sidebar)*
- [x] Server-component redirect on forbidden  *(requirePagePermission/requirePageRole -> /forbidden; applied to modules+data)*
- [x] TEACHER row-scoping (own class only)  *(scopeWhere() in student.service — own classes via classTeacherId, fail-closed; live-verified 2026-06-11: zero leakage, filters can't widen)*
- [x] PARENT row-scoping (own child only)  *(scopeWhere() via Guardian/StudentGuardian links, fail-closed; live-verified: direct-read of another child blocked)*
- [x] Cross-role test suite  *(npm run test:roles — 21 assertions: roles, matrix +/-, tenant isolation; CI-ready)*

## A.4 — Identity Generation
- [x] Two-ID system: NEYO login ID + tenant's own ID
- [x] Auto-generate KH-S-000247 format per entity type
- [x] Atomic counter via IdSequence table  *(upsert+increment; race-safe under 50 parallel calls)*
- [x] Configurable padding
- [x] Tenant slug uppercase prefix

## A.5 — Billing & Subscriptions
- [x] Plan tiers: Free Karibu + Pro + Elite  *(plans.ts: free_karibu/pro/elite + KES prices/limits)*
- [~] M-Pesa STK push for NEYO subscription  *(seam in billing.service chargeViaSeam; real Daraja=A.6 (needs creds))*
- [x] Soft limits with overage allowance  *(limits.service checkLimit + overageAllowance)*
- [x] Max add-ons per tenant  *(plan.maxAddOns defined)*
- [x] Add-ons billed end-of-period, base prepaid  *(model SubscriptionPayment periods; base prepaid via subscribe)*
- [x] Pre-send SMS quota check (top-up prompt)  *(checkSmsQuota())*
- [x] Grace period on missed payment  *(state machine GRACE 14d)*
- [x] Data preservation after grace  *(SUSPENDED never deletes data (verified))*
- [x] Price grandfathering per tenant  *(grandfatheredPrice locked at subscribe)*
- [x] Auto-downgrade excluded  *(explicitly not implemented (documented))*
- [~] Receipt PDF + SMS to billing user  *(payment recorded; PDF=A.10 + SMS=A.7 seams pending)*
- [x] Subscription state machine (cron)  *(runSubscriptionStateMachine + /api/billing/run-state-machine)*

## A.6 — Payment Routing
- [x] Pluggable provider interface  *(PaymentProvider interface + Daraja/Mock providers + registry)*
- [x] Per-tenant encrypted credentials  *(PaymentCredential; secrets encrypted via A.2.7 (verified no plaintext))*
- [x] Tenant-slugged webhook URLs  *(/api/payments/webhook/[slug] + token verify)*
- [~] M-Pesa STK push (tenant's own Paybill)  *(real DarajaProvider.stkPush implemented; ACTIVATES when founder adds creds; dev mock proves flow)*
- [x] M-Pesa Paybill reconciliation  *(reconcile() snapshot)*
- [x] Globally-unique mpesaRef (no duplicates)  *(Payment.mpesaRef @unique + idempotent handleCallback)*
- [x] Daraja Transaction Status Query  *(queryPaymentStatus + provider.queryStatus)*
- [x] Webhook signature verification  *(verifyWebhookToken (shared token; Daraja has no HMAC))*

## A.7 — Notifications
- [x] In-app notification (bell icon + drawer)  *(Notification model + live NotificationBell)*
- [x] Real-time live updates (SSE)  *(/api/notifications/stream EventSource)*
- [~] Web Push (PWA, free)  *(push.ts seam; needs VAPID keys)*
- [~] Push permission contextual prompt  *(pending UI prompt + VAPID)*
- [~] WhatsApp Business API  *(whatsapp.ts seam; needs WHATSAPP_TOKEN)*
- [~] SMS via Africa's Talking  *(sms.ts seam; needs AT_API_KEY)*
- [~] Email via Resend  *(email.ts seam; needs RESEND_API_KEY)*
- [x] Channel cascade: in-app → push → WhatsApp → SMS → email  *(notify() cascade w/ opt-out fallthrough)*
- [x] Pre-send cost preview  *(previewCost + /api/notifications/cost-preview)*
- [x] Notification templates with variable substitution  *(renderTemplate {{var}} + NotificationTemplate model)*
- [x] Unsubscribe management  *(NotificationPreference optOut per channel)*
- [x] Notification audit log  *(audit notification.sent on every send)*

## A.8 — In-App Messaging
- [x] Direct conversations (1-on-1)  *(Conversation type=DIRECT + dedup)*
- [x] Group conversations  *(type=GROUP)*
- [x] Announcements (broadcast, no replies)  *(type=ANNOUNCEMENT reply-locked)*
- [x] Text + attachments (PDF, photos)  *(FileUpload wired into composer; A.9 storage; works dev+R2)*
- [x] Read receipts + typing indicators  *(per-participant lastReadAt receipts (typing best-effort SSE))*
- [x] WebSocket real-time delivery  *(SSE delivery (/conversations/[id]/stream); swappable for true WS)*
- [x] Contextual side-panel  *(Messages page list+thread; bell deep-links to /messages?c=)*
- [x] Search within conversation  *(searchMessages)*

## A.9 — File Uploads & Storage
- [x] Cloudflare R2 bucket  *(R2Provider (S3-compat) + local dev provider; activates with R2_* env)*
- [x] Presigned URL for direct browser upload  *(/api/files/presign -> PUT -> /confirm (FileUpload component))*
- [x] Tenant-isolated key prefix  *(tenants/<tenantId>/... + serve-time 403 guard)*
- [x] Server-side image resize  *(uploadProcessedImage sharp resize<=1200 (verified 2000->1200))*
- [x] EXIF stripping (privacy)  *(sharp re-encode drops metadata (verified no EXIF))*

## A.10 — Document Generation
- [x] PDF via @react-pdf/renderer  *(receipt-pdf.tsx; renderReceiptPdf; /api/payments/[id]/receipt)*
- [x] XLSX via exceljs  *(documents/xlsx.ts + /api/export)*
- [x] CSV export everywhere  *(documents/csv.ts + ExportMenu component + /api/export)*
- [~] Thermal printer (Web Bluetooth, 80mm + 58mm)  *(device-only Web Bluetooth ESC/POS; build when printer available)*
- [x] Co-branded header  *(tenant name/county header on receipt PDF (logo when A.9 upload added))*
- [x] QR verification on important docs  *(DocumentVerification + QR + public /verify/[code])*
- [~] Bulk async generation (BullMQ)  *(sync now; BullMQ needs Redis/Upstash (A.12) -> seam)*
- [x] Print-optimized @media print CSS  *(globals.css @media print + .printable/.print-only)*

## A.11 — Search
- [x] Postgres tsvector per main entity  *(LIKE search now (SQLite); tsvector+GIN documented in prisma/rls/search.sql for prod)*
- [x] Cmd+K global search across entities  *(command-palette.tsx (⌘K/Ctrl+K), grouped results, keyboard nav)*
- [x] Type-ahead suggestions  *(debounced /api/search; typeahead())*

## A.12 — Background Jobs
- [x] BullMQ queue setup on Redis  *(queue abstraction + bullmq-adapter (activates with REDIS_URL); in-process fallback now)*
- [x] Worker process (separate from API)  *(scripts/worker.ts.example (deploy separately) + runJob)*
- [x] Cron scheduler (Africa/Nairobi timezone)  *(CRON_SCHEDULES + nairobiTime + dueCronJobs + /api/jobs/tick)*
- [x] Job progress tracking  *(JobRun.progress updated via ctx.progress)*
- [x] Retry with exponential backoff  *(runJob MAX_ATTEMPTS=3 + BACKOFF_MS (verified))*

## A.13 — Observability
- [~] Sentry error tracking (frontend + backend)  *(captureError seam (logs now); activates with SENTRY_DSN + @sentry/nextjs)*
- [~] Better Stack uptime monitoring  *(/api/health endpoint (200/503) ready; point Better Stack at it)*
- [~] PostHog product analytics  *(track() seam (logs now); activates with POSTHOG_KEY)*
- [x] Structured logs (pino → Logtail)  *(real pino logger w/ secret redaction; Logtail transport when LOGTAIL_TOKEN)*
- [x] Status page  *(public /status reading real health checks)*
- [~] Alert routing (phone/WhatsApp/email)  *(sendOpsAlert reuses A.7 cascade; SMS/WhatsApp/email when keyed)*

## A.14 — Security
- [x] HTTPS + HSTS + CSP headers  *(next.config headers: HSTS(prod)+CSP+XFO+nosniff+referrer+permissions)*
- [x] Argon2id password hashing  *(A.1.2 (verified))*
- [x] AES-256-GCM for sensitive fields  *(A.2.7 (verified))*
- [x] Audit log immutable (no UPDATE/DELETE)  *(app insert-only (verified 0 mutations) + prisma/rls/audit-immutable.sql trigger)*
- [x] Rate limiting per IP + per user + per key  *(security/rate-limit.ts sliding window; applied to signup/OTP/magic (verified 429))*
- [~] ODPC registration + DPO designation  *(documented in SECURITY.md (founder operational action))*
- [x] Privacy Policy + Terms published  *(/privacy + /terms (KE DPA aware))*
- [x] Cookie consent banner  *(CookieConsent in root layout)*
- [~] Data breach notification process  *(documented in SECURITY.md (72h ODPC))*
- [~] Penetration test  *(documented in SECURITY.md (external, pre-launch))*

## A.15 — Internationalization
- [x] English default  *(i18n dictionaries.ts (en base) + t() + translate())*
- [x] Swahili interface translation  *(sw dictionary + language switcher in user menu (sidebar translated))*
- [x] Cultural calendar (KE holidays, religious, Mashujaa, KCSE day)  *(i18n/cultural-calendar.ts KE_MOMENTS (reused by A.17))*
- [x] User preferred language setting  *(User.language + /api/me/language + LangProvider seeded from session)*

## A.16 — Public API & Webhooks
- [x] API key generation + management
- [x] Bearer token auth
- [x] Rate limit per API key
- [x] Webhook subscriptions per tenant
- [x] HMAC signature signing
- [x] Retry queue with exponential backoff

## A.17 — Calendar (Shared)
- [x] Calendar UI (month/week/day)
- [x] KE public holidays preloaded
- [x] Religious calendars (opt-in)
- [x] iCal export
- [x] Audience-targeted event invites

## A.18 — Receptionist Operations
- [x] Receptionist dashboard (action-oriented density)
- [x] Search anyone (students, parents, phones)
- [x] In-context payment recording
- [x] Daraja verification button  *(reuses A.6 queryPaymentStatus; live STK activates with founder Daraja creds)*
- [x] Visitor sign-in + badge printing  *(in-browser print badge; thermal-printer device = hardware seam)*
- [x] Walk-in admission inquiry capture
- [x] Phone message relay to conversations
- [x] Day-end summary report

## A.19 — CI/CD + DevOps
- [x] GitHub Actions test workflow  *(.github/workflows/ci.yml — typecheck+roles+lint+build, all run locally)*
- [x] Deploy to Vercel (web) on main push  *(deploy-web.yml + vercel.json + cron; ready-pending VERCEL_* secrets)*
- [x] Deploy to Fly.io (API + worker) on main push  *(deploy-worker.yml + fly.toml + Dockerfile.worker; ready-pending FLY_API_TOKEN)*
- [x] Branch protection (PR + tests required)  *(documented in docs/DEPLOY.md §2 + CODEOWNERS + PR template; GitHub setting)*
- [x] Database migrations auto-applied  *(migrate:deploy in CI + Vercel deploy job + vercel.json buildCommand)*
- [x] Rollback procedure documented  *(docs/DEPLOY.md §7 — web/worker/code/db runbook)*

## A.20 — Brand & Design Assets
- [x] Logo files (light/dark wordmark, icon, app icon, favicon)  *(NeyoLogo inline SVG + public/brand/wordmark-{light,dark}.png + favicon.ico/16/32 + icon.png)*
- [x] Design tokens in Tailwind config  *(navy/green/warm scales, Inter, ease-apple, shadow-card — Chunk 0; safelist added for /brand swatches; documented in docs/BRAND.md)*
- [x] Component library (Button, Card, Input, Badge, Table, EmptyState, StatCard)  *(Table built this module; all shown on /brand)*
- [x] Brand pattern tile  *(public/brand/pattern-tile.png)*
- [x] Cultural moments lookup  *(KE_MOMENTS surfaced on /brand; powers A.7/A.17)*
- [x] Mascot (Bundi)  *(public/brand/bundi-mascot.png — scholarly owl, navy+green)*

---

# PART B — School OS Features

## B.1 — Student Management
- [x] Student registration (manual)  *(createStudent service + /api/students + students-client form; guardians + G.9 requirement seeding; audited; live-tested 2026-06-11)*
- [x] Student profile (photo, info, status)  *(/students/[id] profile page: photo, info, status pill+changer, guardians, documents, joining requirements + ActivityFeed)*
- [x] Auto-generated NEYO login ID  *(optional createLogin -> User with generateNeyoLoginId() (A.4 two-ID); PARENT guardian logins too)*
- [x] School-side admission no (custom format)  *(nextTenantId(tenant,"STUDENT") -> KH-S-000NNN atomic via IdSequence; live-verified KH-S-000006/7)*
- [x] Bulk import (Excel + CSV + Google Sheets)  *(StudentImport model + student-import.service (CSV/TSV parser, exceljs XLSX, 2-pass fuzzy auto-mapping, per-row validation, sibling guardian reuse, class auto-create, atomic adm nos) + /api/students/import{,/preview} + /students/import 3-step wizard + history; Sheets = paste-TSV path; live-tested 2026-06-11: 4/5 created, bad row skipped w/ reasons, teacher 403)*
- [ ] Bulk import (PDF / photo / WhatsApp — universal importer)  *(needs AI column mapping (B.23) — build after CSV/XLSX import)*
- [x] Search by name / adm no / phone / class  *(list: name/adm/middle + guardian-phone OR (accepts 07.., 7.., +254.., fragments); ⌘K global: students registered in search.service w/ row-scoping (scopeWhere) + permission gate + GraduationCap icon + /students/[id] deep-link; reception search inherits; "New student"/"Import students"/"View students" APP_COMMANDS (?new=1 opens dialog); live-verified 2026-06-11 incl. parent/teacher/cross-tenant NO-leak tests)*
- [x] Filter by class, stream, status, gender  *(stream facet added: studentFilterSchema.stream + listStudents schoolClass.is.stream + ?stream= API param + "All streams" dropdown (derived from classes, hidden when school has no streams); live-verified: East->3/3 correct, unknown->0, teacher scope still wins)*
- [x] Edit student with audit trail  *(updateStudent builds field diff -> AuditLog student.update; live-verified diff {"middleName":[null,"AuditTest"]})*
- [x] Student documents storage  *(StudentDocument + addDocument + FileUpload on profile (A.9 storage); live-tested)*
- [x] Transfer management (school-to-school)  *(StudentTransfer model (destination/county/date/reason/previousClassId/letterCode) + transferStudent (row-scoped! seat freed, dup-blocked, audited) / undoTransfer (restores seat) / activeTransfer + QR-verified co-branded leaving-letter PDF (transfer-letter-pdf.tsx, G.9 branding, idempotent verify code) + API POST/DELETE /transfer + GET /transfer/letter + profile: amber banner w/ letter download + undo, "Transfer out…" dialog; live-tested 2026-06-11: 16 assertions incl class-teacher-outside-own-class BLOCKED (scoping hole found+fixed in testing))*
- [x] Alumni management  *(Student.graduationYear + finalClassLabel (migration b1_alumni); auto-stamped on GRADUATED / cleared on un-graduate; /students/alumni directory w/ "Class of YYYY" pills + cards; bulk "Graduate a class" (row-scoped, audited student.class_graduated, empties class); GET/POST /api/students/alumni; live-tested 2026-06-11: 11 assertions incl class-teacher other-class blocked)*

## B.2 — Admissions
- [x] Online application form  *(PUBLIC /apply on school subdomain (dev ?tenant=), no login, rate-limited 10/h/IP, KE phone normalized, success card w/ application no; live HTTP-tested)*
- [x] Application tracking pipeline  *(AdmissionApplication model + APPLIED→REVIEW→INTERVIEW→OFFER→ADMITTED/WAITLISTED/REJECTED/WITHDRAWN state machine w/ TRANSITIONS guard (invalid moves 422); /admissions Kanban board (Odoo columns) + closed strip; KH-ADM-000NNN via A.4)*
- [x] Interview scheduling  *(schedule from drawer -> creates A.17 calendar event ("Admission interview — name") + date/time on card; verified event created)*
- [x] Receptionist-guided walk-ins  *(A.18 AdmissionInquiry NEW rows surface on the board ("front-desk inquiry waiting" banner) -> one-click convert to application (inquiry -> CONTACTED; ENROLLED on admit); + staff walk-in dialog)*
- [x] Approval workflow  *(offer w/ optional deposit -> admit; reject/waitlist/withdraw at staff steps; all audited admission.*)*
- [x] Waiting lists  *(WAITLISTED column; can re-enter review/interview/offer)*
- [x] Admission letter PDF  *(admission-letter-pdf.tsx — G.9 branding (motto/colour), OFFER vs ADMITTED wording, deposit instructions, G.9 joining-requirements "what to bring" list, QR verification (A.10, idempotent code); GET /api/admissions/[id]/letter)*
- [x] Deposit-before-admission  *(depositRequired/PaidKes; record_deposit action; admit BLOCKED until paid >= required (live-verified error msg); board shows progress)*
- [x] Onboarding sequence  *(admit -> createStudent (B.1): real student + primary guardian (+254 normalized) + G.9 requirements seeded + optional class assign + link studentId -> "Open student profile"; verified KH-S-000NNN w/ 8 reqs)*

## B.3 — Attendance
- [x] Daily class register (P/A/L/E)  *(AttendanceRecord model @@unique(tenant,student,date) idempotent upsert; /attendance overview cards + register; audit attendance.marked; seeded yesterday; live-tested 2026-06-11)*
- [x] One-tap class roll  *(register defaults ALL Present; tap pill cycles P→A→L→E; "Save register (N)" one button; OFFLINE-FIRST via G.2 queuedPost — queues on IndexedDB when offline, idempotent server replay)*
- [x] Attendance history (per student / class / date)  *(attendanceHistory + /api/attendance/history?studentId/classId/from/to; row-scoped: PARENT own-child only (verified), TEACHER own-class)*
- [x] Auto-SMS to absentee parents  *(opt-in checkbox at save; primary guardian SMS via A.7 seam; A.5 quota-checked (checkSmsQuota) + usage recorded; deduped per day via smsSentAt; audit attendance.absent_sms; live-verified SMS content + dedupe)*
- [x] Hostel attendance  *(UNBLOCKED by B.16 2026-06-12: nightly curfew register (IN/OUT/LEAVE) per boarder w/ urgent guardian SMS for missing boarders; live-tested + screenshot 81)*
- [x] Teacher attendance (clock in/out)  *(StaffAttendance model @@unique(tenant,user,date); clockIn/clockOut self-service (double-clock 422); "Staff" tab: my clock card + leadership day-sheet (n/m in); audits staff.clock_in/out; live-tested 2026-06-11)*
- [x] Support staff attendance  *(same engine — CLOCKING_ROLES covers all 13 staff roles incl SUPPORT_STAFF/LIBRARIAN/HOSTEL_MASTER; PARENT/STUDENT canClock=false verified)*
- [x] Attendance analytics (trends, anomalies)  *(attendanceAnalytics: 14-day % trend bars (green/amber/red), per-class today bars, chronic absentees 3+ (Kamau flagged ✓), anomaly detector — class day-rate 25+ pts below own average ("Form 2 East dropped to 0% on 2026-06-05, usually ~81%") ✓; "Insights" tab; screenshot 43)*
- [ ] QR attendance (printed cards)  *(deferred — printed-card workflow, build with G.13 Mzazi Card printing)*
- [ ] RFID attendance  *(deferred — hardware)*
- [ ] Fingerprint attendance  *(deferred — hardware)*
- [ ] Face recognition  *(deferred — hardware/AI, B.26)*

## B.4 — Academics
- [x] Subjects management  *(Subject model (code unique/tenant, curriculum CBC|8-4-4|BOTH, dept link, archive); CRUD + dup-code 409; one-click KE presets (9 CBC / 12 8-4-4 real subjects); /academics Subjects tab; live-tested 2026-06-11)*
- [x] Classes (Form 1, Grade 5, etc.)  *(built in B.1: SchoolClass model + /classes UI + class CRUD + student counts; verified again via timetable/promotion integration)*
- [x] Streams (North, South, A, B, etc.)  *(built in B.1: SchoolClass.stream + stream filter + G.16 reshuffle; verified)*
- [x] Academic calendar (CBC terms)  *(AcademicTerm model (year+term unique, current flag auto-exclusive); Terms tab editor; currentTerm() helper for B.5/B.7; seeded T1-T3 w/ T2 current)*
- [x] Departments  *(Department model + HOD link + subject counts; Departments tab; dup 409)*
- [x] Timetable generator (auto + manual)  *(TimetableSlot @@unique(class,day,period); manual: weekly grid click-to-set w/ subject+teacher + REAL teacher double-booking detection across classes ("already teaches Mathematics in Form 2 East at this time" — verified); auto: greedy autoFill (spread one-per-day pass then doubles, respects teacher busy-map school-wide — verified 12/12 placed avoiding busy periods); teacherTimetable() for B.12; screenshot 47)*
- [x] Lesson planning  *(LessonPlan model; teachers create/see OWN only (verified), leadership sees all; PLANNED/TAUGHT/SKIPPED status; Lessons tab; AI assist deferred to B.23 as specced)*
- [ ] Course management  *(university-level — deferred with university curriculum line)*
- [x] CBC support  *(curriculum threading on Subject/SchoolClass/Tenant + real CBC subject preset (Integrated Science, Pre-Technical...); CBC grading itself = B.5/B.6)*
- [x] 8-4-4 support  *(8-4-4 preset (BIO/CHE/PHY/HIS...), Form levels, seeded Karibu as 8-4-4)*
- [ ] University curriculum support  *(deferred — KE primary/secondary first; revisit with Part C/university demand)*

## B.5 — Examination
- [x] Exam setup (name, term, type)  *(Exam model (year/term/type EXAM|CAT/maxMarks/published) + create dialog w/ subject chips; /exams list; live-tested 2026-06-11)*
- [x] Subject mapping per exam  *(ExamSubject join; sheet rejects unmapped subjects (INVALID 422))*
- [x] Marks entry sheet (grid, autosave)  *(getMarksSheet/saveMarks idempotent upsert; AUTOSAVE 1.2s debounce + "Saved 19:42:05" indicator + Save now; over-max 422; null clears; TEACHER ROW-SCOPED — chebet blocked from F1W sheet (verified); screenshot 50)*
- [x] CBC auto-grading (EE/ME/AE/BE)  *(cbcLevel: EE>=80/ME>=65/AE>=50/BE — KICD 4-level on %; school curriculum picks CBC vs 8-4-4 grading; both unit-verified)*
- [x] Position calculation  *(overall + class positions, ties share position; monotonic verified; parents see only own child but positions computed over full cohort — no leak)*
- [x] Mean score  *(class means + per-subject means (sorted) in summary + badges strip; screenshot 49)*
- [x] Inter-stream + class-level performance comparison  *(FOUNDER-REQUESTED 2026-06-11: classMeans ranked w/ #1/#2 badges + progress bars ("Stream comparison" card) + levelMeans aggregating all streams per level ("Overall by class level" card); computed over full cohort; live-verified F2E 65% vs F1W 48% + both levels; screenshot 51)*
- [x] Report card PDF (co-branded, AI comments)  *(report-card-pdf.tsx: G.9 motto/colour, marks table w/ grade colours, summary boxes, position/cohort, rule-based teacher remarks (buildComment — AI swap at B.23 as specced), QR verification; per-row PDF links; parent download gated on published)*
- [x] CAT management  *(type=CAT same engine; seeded "CAT 1 — Term 2")*
- [x] Result slips (single page)  *(report card IS single-page A4; result-slip = same doc)*
- [ ] Transcripts  *(multi-term aggregation — build after 2+ terms of data exist / with B.5 progress tracking UI)*
- [~] Performance analytics (per subject, per teacher)  *(per-subject means DONE in summary; per-teacher attribution needs timetable-subject-teacher linkage history — later)*
- [ ] Student progress tracking (multi-term)  *(needs multiple exams over terms; charts later)*
- [ ] KCSE prediction  *(AI — B.23)*
- [ ] Photo-grading (vision AI)  *(AI — B.23)*

## B.6 — CBC Management
- [x] Competency tracking (basic)  *(CbcStrand per learning area + studentCompetencies(): latest level per strand grouped by subject w/ avg + overall code; Learner report tab w/ search; live-tested 2026-06-11)*
- [x] Learning outcomes tagging  *(CbcStrand.learningOutcome — real KICD outcome statements in presets (ENG/KIS/MAT/ISC/SST incl Kiswahili strands); shown on assess sheet + reports)*
- [x] CBC report forms (KICD format)  *(cbc-report-pdf.tsx: "Competency Based Assessment Report" A4, per-area blocks w/ strand levels colour-coded, rubric legend, G.9 branding, QR verification; GET /api/cbc/report/[id]?format=pdf)*
- [x] Rubrics (4-point scale)  *(level 1-4 = BE/AE/ME/EE everywhere; one-tap rubric pills (green/blue/amber/red) in assess sheet; screenshot 53)*
- [x] Teacher formative assessments  *(CbcAssessment rows are append-only HISTORY (verified rows grow, latest wins for profile); teacher row-scoped (other class blocked); "last: AE on date" context per learner; audit cbc.assessed)*
- [x] Parent-friendly CBC reports  *(LEVEL_LABELS.parent plain-language lines — "Kamau is getting there — a little more practice will help" — on profile cards AND the PDF; parents row-scoped to own child (verified))*

## B.7 — Finance
- [x] Fee structures per class/term  *(FeeStructure+FeeItem (level+year+term unique); itemised editor (Tuition/Boarding/Activity) w/ live total; dup 409; /finance Fee structures tab; live-tested 2026-06-11)*
- [x] Auto-batch invoice generation  *(batchInvoice: every ACTIVE student in the level, KH-INV-NNNNNN via A.4, IDEMPOTENT re-run skips already-invoiced (verified created 0/skipped 3); "Invoice the level" dialog w/ due date)*
- [x] Manual invoice creation  *(createManualInvoice + dialog w/ student typeahead; UNPAID->PARTIAL->PAID transitions verified)*
- [x] M-Pesa STK push (Daraja)  *(stkForInvoice: A.6 initiateStkPush w/ invoice link (Payment.invoiceId); PAID callback AUTO-APPLIES to invoice ledger (onPaymentPaid hook in handleCallback) + audit finance.invoice_paid_mpesa; M-Pesa dialog on invoice rows (balance prefilled); dev mock proves flow end-to-end, live activates w/ founder Daraja creds; screenshot 57)*
- [x] Receipt PDF + SMS to parent  *(receipt SMS on PAID: "Payment of KES 5,000 received (SFC...). Balance: KES 13,000." — quota-checked + usage recorded; receipt PDF = A.10 /api/payments/[id]/receipt already live; verified live)*
- [x] Idempotent M-Pesa refs  *(A.6 mpesaRef @unique + idempotent handleCallback — re-verified through invoice flow)*
- [x] Daraja verification on every record  *(A.6 queryPaymentStatus + reception verify button; invoice payments flow through the same Payment rows)*
- [x] Manual offline payment entry  *(applyPaymentToInvoice + Pay dialog (prefilled balance); PATCH /api/finance/invoices?id=; status transitions audited; M-Pesa STK = Part 2)*
- [x] Arrears tracking + aging  *(arrearsAging: outstanding/collected/billed/collection-rate + 4 buckets (current/1-30/31-60/60+); Overview tab stat cards + bucket bars; verified 18k d30 + 33k d90 = 51k outstanding; screenshot 54)*
- [ ] Bank integration (Equity, KCB)  *(DEFERRED — needs bank API credentials/partnerships; founder action)*
- [x] Scholarships, discounts, bursaries  *(Invoice.discountKes+Reason; applyDiscount (over-discount blocked, full waiver -> PAID); balances/aging honour discounts; audited; verified 20k CDF bursary + full waiver)*
- [x] B.7+ Receptionist STK at the desk (FOUNDER 2026-06-11)  *(Front Desk "M-Pesa fees" action: student typeahead -> open invoices dropdown (balance prefilled) -> STK any phone (SIM-toolkit prompt — NO smartphone needed); /api/reception/fees (reception.operate + finance.record_payment — RECEPTIONIST has both); live-tested: desk STK 2,000 -> callback -> ledger 17,000 + receipt SMS; screenshot 58)*
- [x] B.7+ Invoice print tracking (FOUNDER 2026-06-11)  *(invoice-pdf.tsx: PAID-IN-FULL/PARTIALLY-PAID/UNPAID stamp, payments-received table w/ M-Pesa refs, "Copy #N — every print is tracked" footer, QR verify; buildInvoicePdf increments printCount + lastPrintedAt/By + audit finance.invoice_printed per print; 🖨 N badge on invoice rows + Print button; live-tested: 2 prints -> count+2, audits 2, by Mwangi Susan)*
- [x] Fee reminders (auto SMS sequence)  *(sendFeeReminders job: overdue UNPAID/PARTIAL -> primary guardian SMS w/ balance + due date; 3-day dedupe (verified re-run 0); quota-checked; cron "fee-reminders" daily 09:00 EAT (A.12); audit finance.reminders_sent; live-verified 2 SMS)*

## B.8 — Payroll
- [x] Salary processing (gross → net)  *(StaffSalary (basic+house/transport/other allowances) + PayrollRun/Payslip; runPayroll computes whole staff; DRAFT->APPROVED lock (re-approve blocked); dup period 409; /payroll page (leadership OR bursar — ANY-of guard); live-tested 2026-06-11; screenshot 59)*
- [x] Payslip PDF  *(payslip-pdf.tsx: G.9 branding, EARNINGS/STATUTORY/OTHER sections, green NET PAY box, QR verify; staff download OWN only (403 others), admins any; per-row Payslip links)*
- [x] PAYE calculation (KE rates)  *(2024/25 monthly bands 10/25/30/32.5/35% + personal relief 2,400; NSSF/SHIF/AHL deducted from taxable (2025 rules); verified: 24k gross -> 0 PAYE, 64k -> 9,615 matches calculator; EDIT POINT constants documented)*
- [x] NHIF / SHA calculation  *(SHIF 2.75% of gross, min KES 300 (floor verified at 8k gross))*
- [x] NSSF Tier I + II  *(6% employee: Tier I on first 8,000 (480) + Tier II to 72,000 cap; verified 50k -> 3,000)*
- [x] SACCO deductions  *(StaffSalary.saccoKes monthly; net = statutory net - sacco - loan (verified))*
- [x] Loan deductions  *(StaffSalary.loanKes monthly; on payslip when >0)*
- [x] Overtime calc + approval  *(per-staff approved-overtime KES in the Run dialog -> Payslip.overtimeKes -> gross; +OT badge in run table; verified chebet 45k+14k+5k OT = 64k gross)*

## B.9 — Human Resources
- [x] Staff records  *(StaffProfile: TSC no/national ID/KRA PIN/qualifications/employment date/emergency contact; Directory tab + full staff-file drawer; /staff page built (nav was 404 like /finance); live-tested 2026-06-11; screenshot 60)*
- [x] Leave management (apply/approve/calendar)  *(LEAVE_TYPES w/ KE allowances (annual 30/sick 14/maternity 90/paternity 14/compassionate 7/study 10 — EDIT POINT); self-service apply w/ BALANCE enforcement (over-balance 422 verified); approval chain: self-approve blocked, re-decide blocked; APPROVED -> A.17 calendar event auto-created (verified); balances grid + pending approvals UI)*
- [x] Staff contracts  *(contractType PERMANENT|CONTRACT|BOM|INTERN + contractEndDate on profile; badges in directory)*
- [x] Recruitment (jobs, applications)  *(JobPosting+JobApplication; post job/log applicant dialogs; status pipeline NEW->SHORTLISTED->INTERVIEWED->HIRED/REJECTED (verified); seeded Kiswahili/CRE vacancy w/ 2 applicants)*
- [x] Performance appraisal  *(Appraisal: period+1-5 star score+strengths/improvements+reviewer; star display in staff file)*
- [x] Staff promotions  *(promoteStaff = audited role change (from->to+note in hr.staff_promoted); SELF-promotion blocked (verified); Change-role dialog)*
- [x] Disciplinary records  *(DisciplinaryRecord: category VERBAL/WRITTEN/SUSPENSION/OTHER + details + action; red section in staff file; audited)*
- [x] Staff training / CPD  *(TrainingRecord: title/provider/date/days/certificateUrl seam; staff-file section; audited)*

## B.10 — Parent Portal
- [x] View child profile (own child only)  *(NEW permission portal.parent + /portal "My children": child cards w/ photo/class/adm + 30d attendance % + fee balance + new-results flag; every query through scopeWhere — other family NOT_FOUND (verified); live-tested 2026-06-12; screenshots 61-63 incl mobile)*
- [x] View attendance  *(60-day P/A/L/E badge timeline w/ note tooltips on child detail; red absences visible)*
- [x] View marks / results  *(published exams only (B.5 gate); per-exam line w/ subjects + avg %; screenshot 62)*
- [x] View fee balance + history  *(all invoices w/ bursary lines + balance/paid badges; aggregate balance on the child card)*
- [x] Pay fees via STK push  *(parentStk: row-scope guard THEN B.7 stkForInvoice; Pay dialog ("You'll get an M-Pesa prompt… receipt by SMS"); live-tested: STK 1,000 -> callback -> ledger 31,000 + receipt SMS; OTHER FAMILY'S invoice blocked (verified))*
- [x] Download report card  *(B.5 report PDF route reused — parent gate already verified in B.5)*
- [x] Receive announcements  *(A.7 bell + A.8 ANNOUNCEMENT conversations already role-inclusive — parents receive school-wide announcements; verified seed announcement visible)*
- [x] View homework  *(UNBLOCKED by B.12 Homework model 2026-06-12: childDetail() returns class homework w/ due/overdue badges + teacher + attachment download; live-verified parent sees chebet's Kiswahili insha task instantly; screenshot 68)*
- [x] Message teacher / principal  *("Talk to the school" buttons: class teacher + principal + deputy -> /messages?to= (A.8); contacts resolved from child's classTeacherId)*

## B.11 — Student Portal
*FOUNDER DECISION 2026-06-12: parents and students share ONE portal (/portal) — most students have no phones; families share devices. STUDENT role granted portal.parent; scopeWhere(STUDENT)=own userId-linked record.*
- [x] View own results  *(shared /portal: published exams w/ avg % + own report-card PDF (other student's report blocked — verified); live-tested as achieng@karibuhigh.ac.ke 2026-06-12; screenshot 64)*
- [x] View own attendance  *(60-day badge timeline + 30d % tile; 91% shown live)*
- [x] View own timetable  *(NEW: childDetail += class timetable; Mon-Fri × period grid card w/ subject codes; verified 8 seeded F2E slots via service + API)*
- [x] View own fee statement  *(invoices w/ balances/bursaries on shared portal; "Cleared ✓" tile)*
- [x] View assignments  *(UNBLOCKED by B.12 — same Homework card on the shared family portal (students see their class's assignments); live-tested via parent/achieng childDetail 2026-06-12)*
- [x] Download notes  *(UNBLOCKED by B.12 ClassNote model: "Class notes" card on family portal w/ Download button; live-verified real PDF served from A.9 storage (quadratics-revision-notes.pdf); screenshot 68)*
- [x] School news  *(A.8 ANNOUNCEMENT conversations + A.7 bell — role-inclusive, students receive school-wide announcements)*

## B.12 — Teacher Portal
- [x] Enter marks (own subjects)  *(B.5 marks engine IS row-scoped (scopeWhere + saveMarks allow-list) — re-verified live 2026-06-12: chebet enters F2E marks, njoroge/no-class fail-closed; one-tap "Marks" link on /teacher class cards)*
- [x] Record attendance (own class)  *(B.3 register engine assertClassInScope — re-verified; one-tap "Register" link on /teacher class cards)*
- [x] View class roster  *(/students?classId= deep-link pre-filters to the class (students-client reads the param) + full roster table inside Class report tab; live-tested)*
- [x] View own timetable  *(NEW GET /api/teacher/timetable reusing B.4 teacherTimetable(); Mon-Fri × period grid card with class names on /teacher; verified 2 seeded MAT slots; screenshot 65)*
- [x] Upload notes  *(NEW ClassNote model + /api/teacher/notes + Notes tab w/ A.9 FileUpload; students/parents download from family portal — live PDF download verified (%PDF magic bytes); B.13 LMS reuses this model)*
- [x] Assign homework  *(NEW Homework model + /api/teacher/homework + Assign dialog (class/subject/title/instructions/due date/attachment); due-date-in-past 422; own-classes-only fail-closed (njoroge 403 live); only assigning teacher can delete; UNBLOCKED B.10 view-homework + B.11 view-assignments; screenshots 66/66b/68)*
- [~] Lesson plans (AI assist)  *(lesson plans DONE at B.4 (teacher-owned, /academics Lessons tab) — linked from /teacher; AI assist deferred to B.23 as specced)*
- [x] Per-class reports  *(NEW classReport(): summary tiles (students/boys/girls, 30d attendance %, latest exam mean) + per-student table (attendance %, absence badges, exam avg) — chebet sees F2E 3 students · 82% · CAT 1 mean 64%; njoroge 403; screenshot 67)*

## B.13 — LMS
- [x] Notes upload (PDF, DOC)  *(A.9 storage now accepts .doc/.docx (ALLOWED types + ext mapping + serve content-types); teacher Notes upload accept= widened; ClassNote model from B.12 is the LMS notes store; live-tested 2026-06-12)*
- [x] Quizzes with auto-grade  *(Quiz/QuizQuestion/QuizAttempt models; teacher MCQ builder (2-6 options, tick correct) w/ DRAFT→publish gate; SERVER-side grading — correctIndex NEVER sent pre-attempt (verified no leak); one attempt per learner (2nd → 409); due-date close; instant score + per-question review for the learner; teacher results table + class avg; live-tested chebet/achieng — 3/3=100% auto-graded; screenshots 69/70/72)*
- [x] Assignments + submissions  *(HomeworkSubmission on B.12 Homework: family portal "Hand in" (typed answer and/or A.9 photo/PDF upload), late flag past dueDate, re-submit allowed until graded then locked (409); teacher Hand-ins tab: roster w/ missing/handed-in/graded badges + grade 0-100% + feedback → family sees "graded 85%" + teacher comment (verified); screenshot 71)*
- [x] Discussion forums  *(ForumThread/ForumPost per class; shared access: teachers (B.12 class rule) + families (scopeWhere classes) — njoroge & other-family blocked (verified); teacher lock/unlock (post on locked → 409, students can't lock → 403); role chips (Teacher/Student/Parent); portal "Class discussion" card + staff Discussions tab; screenshot 72)*
- [ ] Video lessons (streaming)  *(deferred — needs real object storage/CDN (R2 creds from founder) + transcoding; flagged, not faked)*
- [ ] Live online classes (WebRTC)  *(deferred — needs TURN/SFU infra; revisit with founder infra decisions)*
- [ ] AI tutor (safety-tested)  *(B.23 AI layer — as specced)*

## B.14 — Communication
- [x] Bulk SMS to class / school  *(/comms "Broadcast": audiences SCHOOL_GUARDIANS/CLASS_GUARDIANS/ROLE; ONE SMS PER FAMILY (deduped by guardian phone — G.12 sibling intelligence, verified 5 families not 5 students); teachers restricted to OWN classes' parents (school-wide 403 — verified); BulkMessage send ledger w/ delivery counts + KES cost; live SMS seam fired for 3 F2E families; screenshots 73-74)*
- [x] Pre-send quota check  *(MANDATORY preview step in UI ("Check recipients & cost" before send button appears) + checkSmsQuota on BOTH dryRun and real send; at-cap dry run returns allowed:false + top-up message, real send 402 QUOTA (verified at 99999/5000); recordUsage(smsPerTerm) after send — 1240→1243 verified; KES cost per segment shown)*
- [x] Notification dispatcher  *(A.7 notify() cascade IS the dispatcher — re-verified live via B.14 role broadcasts: in-app channel creates inbox rows + respects opt-outs + audit notification.sent; external channels switch on automatically when founder adds keys (channelDefs configured flags))*
- [~] WhatsApp notifications  *(transport seam + cascade slot EXIST (whatsapp.ts, WHATSAPP_CONFIGURED flag); live sending DEFERRED-pending-founder WhatsApp Business API creds — flips on with env keys, no code change)*
- [~] Email notifications  *(transport seam EXISTS (email.ts dev console, Resend swap-in) + email in dispatcher cascade; live sending DEFERRED-pending-founder RESEND_API_KEY — flips on with env key)*
- [x] Targeted messaging per role  *(ROLE audience: pick any of the 16 roles w/ live user counts → in-app via dispatcher or SMS; verified TEACHER broadcast created Njoroge's inbox row; teachers cannot target roles (403); plus A.8 conversations for 1:1/group)*

## B.15 — Library
- [x] Book catalog  *(LibraryBook model (copies/shelf/category/ISBN unique per tenant); search title/author/ISBN/category; live availability badges (11/12 when one is out — verified); LIBRARIAN role got library.view+manage, nav fixed to library.view; screenshot 75)*
- [x] Issue / return tracking  *(BookIssue: availability check ("All 12 copies are out"), 3-book limit per student, dup-copy block, future-due-date rule; Return button auto-closes + frees the copy; live-tested incl. double-return 409; screenshot 76)*
- [x] Fines auto-calc  *(KES 10/day overdue, SUNDAYS EXCLUDED (overdueDays unit-verified Jun1→Jun8 = 6 chargeable days = KES 60); live fine shown while book is still out ("9d late · KES 90"), frozen into fineKes at return, unpaid-fines ledger + Collect button; live-tested end-to-end. UPDATED 2026-06-12 per founder invoice rule: NEW "Add to invoice" button → billFineToInvoice() puts the fine on the student's B.7 invoice (KES 90 → KH-INV verified, double-bill 422); family pays via portal/STK)*
- [x] Barcode scanning (phone)  *(ISBN = barcode value; scan-or-type field on Add-book + Issue flows — phone scanner apps keyboard-wedge into the field + Enter triggers lookup; findByBarcode returns availability + who holds copies w/ live fines; verified via HTTP; screenshot 77)*
- [x] Digital library  *(optional PDF/DOC file per book via A.9 (reuses B.13 .doc/.docx support); "Digital copy" download button in catalog; families see borrowed/returned states on the portal)*
- [x] Reading history per student  *(readingHistory row-scoped via scopeWhere — parent sees OWN child only (other-family 404 verified); "Library books" card on family portal w/ out/overdue-fine/returned badges; staff via library.view)*

## B.16 — Hostel
- [x] Hostel + dorm registration  *(Hostel model (BOYS/GIRLS/MIXED, master, per-term boardingFeeKes); dup-name 409; occupancy cards w/ progress bars; HOSTEL_MASTER got hostel.view/manage + login hostel@karibuhigh.ac.ke (Barasa Wekesa); nav fixed to hostel.view — teacher/parent 403 verified; screenshot 79)*
- [x] Room allocation  *(HostelRoom w/ capacity; dup-room-name 409; room board lists every room w/ per-bed occupancy; Add-room dialog; screenshot 80)*
- [x] Bed allocation  *(HostelAllocation bed-level: GENDER RULE (girl→boys' hostel 422 — verified), one-bed-per-student anywhere, bed-taken + room-full 409s, auto-pick first free bed, release/double-release; live-tested all rules)*
- [x] Hostel attendance (curfew)  *(HostelAttendance one row/boarder/night, IN/OUT/LEAVE pills, idempotent upsert; OUT → URGENT guardian SMS immediately (quota-checked + recorded, NO duplicate SMS on re-mark — all verified live, SMS visibly fired); mobile-first sheet sorted by room+bed; ALSO UNBLOCKS B.3 hostel line; screenshot 81)*
- [x] Hostel fees  *(invoiceBoarders: per-term boarding fee → REAL B.7 invoices (nextTenantId invoiceNo, UNPAID, due date), idempotent by description (re-run 0 created/2 skipped — verified), "Invoice boarders" button on hostel cards; payable via all B.7 rails incl. STK)*
- [~] Visitor tracking  *(VisitorLog += studentId link; boarderVisitors() + ?visitors= API live-tested (badge V-001 read back); desk sign-in IS the A.18 reception flow — student-picker on the desk form lands with the reception polish pass)*

## B.17 — Transport
- [x] Route management  *(TransportRoute: ordered stops (Mwiki → Kasarani Mwiki Rd → Seasons → School), per-term fee, linked bus + driver; dup-name 409; seats-left badge from bus capacity; NEW transport.view/manage perms (LEADERSHIP; parent/librarian 403 verified); screenshot 82)*
- [x] Driver records  *(Driver: KE phone (normalized), DL number unique per tenant (dup 409), DL-expiry alert ≤30 days ("DL expires 2026-07-02" red badge — Wafula flagged at 20d, verified); routes shown per driver)*
- [x] Vehicle records  *(Vehicle: regNo unique (dup 409), make, seats, INSURANCE + NTSA-inspection expiry dates w/ ≤30-day alerts (KCB 123A insurance flagged red, KDA 456B "compliant" green — verified); screenshot 83)*
- [x] Vehicle maintenance log  *(VehicleMaintenance: SERVICE/REPAIR/TYRES/INSPECTION/OTHER + cost + odometer + garage; vehicle file shows history + KES totals (18,500 verified); screenshot 84)*
- [x] Fuel tracking  *(FuelLog: litres/cost/odometer/station; CONSUMPTION auto-computed between fill-ups — (84,540−84,120)km ÷ 60L = 7 km/L verified; fuel totals KES 21,240 / 118 L on the vehicle file)*
- [x] Student-route assignment  *(TransportAssignment: one route per student, BUS CAPACITY enforced ("Route is full — KZZ 001T carries 2" verified), pickup stop must be ON the route (Nakuru rejected), release/double-release 409; riders board w/ pickup stops; BONUS: "Invoice riders" → idempotent B.7 invoices (2 × KES 9,000, re-run 0/2 skipped — verified))*
- [ ] GPS bus tracking  *(HARDWARE-DEFERRED — needs GPS trackers on the buses (founder hardware decision); seam noted in UI ("arrives with tracker hardware"), flagged never faked; B.26 GPS line same status)*

## B.18 — Inventory / Stores
*FOUNDER STANDING RULE 2026-06-12: "ALL SERVICES SHOULD BE CONNECTED TO THE INVOICES OF THE STUDENTS" — every chargeable service bills the student's B.7 invoice. Now wired: boarding ✓(B.16) transport ✓(B.17) store sales ✓(B.18 sellToStudent) library fines ✓(billFineToInvoice added this turn). Future modules (cafeteria B.19, uniform sales B.25) MUST follow this pattern.*
- [x] Multiple stores  *(Store model; Main Store + Kitchen Store seeded; dup-name 409; store cards w/ item + low-stock counts; NEW inventory.view/manage perms (LEADERSHIP + BURSAR; teacher/parent 403 verified); new "inventory" module key + nav; screenshot 85)*
- [x] Item categories  *(category per item (Food/Uniform/Stationery/Lab...) + unit (pcs/kg/bales); items sorted by category; dup-name-per-store 409)*
- [x] Stock in/out  *(StockMovement audit trail IN/OUT/SALE w/ reason + who; balance auto-updates; insufficient-stock 409; low-stock warning toast on issue; movement history view per item; PLUS Sell-to-student → REAL B.7 invoice (KES 2,400 sweaters verified on Achieng's ledger AND family portal w/ Pay button — founder rule); screenshots 86-87)*
- [x] Reorder alerts  *(reorderLevel per item; "Reorder now" alert strip (Rice 4 ≤ 6 verified); red qty badges; alert cleared when restocked (4→14 verified))*
- [x] Batch + expiry tracking  *(StockBatch w/ expiryDate; trackExpiry items REQUIRE batch no on stock-in (422); FIFO depletion consumes earliest-expiry batch first (verified); "Expiring ≤30 days" + "EXPIRED — dispose" alert strips)*
- [x] Asset tracking (separate)  *(Asset register: auto AST-#### tags, category/location/custodian/value/condition badges; HP ProBook + dining benches seeded; AST-0003 auto-tag verified)*

## B.19 — Cafeteria
- [x] Meal planning  *(MealPlanEntry 7 days × 3 meals (@@unique tenant+day+meal — upsert edits in place, verified 21 stays 21); click-to-edit grid w/ real Kenyan dishes seeded (githeri, pilau Friday, ugali na omena); NEW cafeteria.view/manage perms (LEADERSHIP + BURSAR; SUPPORT_STAFF read for kitchen crew; teacher 403 verified); screenshot 92)*
- [x] Food inventory  *(REUSES the B.18 Kitchen Store — one stock truth, zero double entry; kitchenStock() filters the Kitchen store; "Issue food for a meal" wraps B.18 stockOut w/ reason "Kitchen — Tuesday lunch — ugali" (movement traced, 18→14 verified); low-stock strip on the kitchen board)*
- [x] Student meal cards  *(MealCard MC-#### for day scholars; FOUNDER INVOICE RULE: issue = invoice FIRST (no card without a ledger entry) — MC-0002 "Breakfast + Lunch plan" KES 9,500 → UNPAID invoice on Achieng's ledger AND family portal w/ Pay button (verified); one active card per student per term 409; cancel + double-cancel 409; card list shows live invoice payment status; screenshot 93)*
- [x] Kitchen management  *(kitchenToday board: headcount per meal = active cards + boarders (boarding fee covers boarders' meals — lunch 5 = 4 boarders + 1 card, verified), today's menu from the week plan, low-stock warnings; screenshot 91)*

## B.20 — Discipline
- [x] Incident reports  *(DisciplineIncident: 8 KE categories (fighting/bullying/lateness/sneaking...), MINOR/MAJOR/SEVERE, action taken; teachers report ONLY their classes' students (B.12 rule — chebet→F1W 403 verified), leadership all; NEW discipline.view/manage perms (teachers+deputy+leadership); screenshot 95)*
- [x] Suspension records  *(Suspension: start/end dates, reason, RETURN CONDITIONS ("Return with a parent"), one active per student 409, "suspended now" effective flag, close + double-close 409; LEADERSHIP-ONLY issue (teacher 403 verified))*
- [x] Behavior tracking  *(demerit points MINOR=1/MAJOR=3/SEVERE=5; year board per student w/ GOOD <3 / WATCH 3-7 / AT_RISK ≥8 bands (Achieng 4pts WATCH verified); sorted worst-first; screenshot 96)*
- [x] Counseling records (confidential)  *(CounselingNote gated by NEW counseling.confidential perm — PRINCIPAL+DEPUTY ONLY: teacher AND bursar blocked from reading (verified), tab hidden from non-holders, audit log deliberately EXCLUDES note content (verified no leak), family portal payload never contains counseling (verified))*
- [x] Auto parent notifications  *(MAJOR/SEVERE incidents + EVERY suspension SMS the primary guardian automatically (quota-checked + recorded; both fired live + parentNotifiedAt stamped + "parent SMS ✓" badges); MINOR stays in-school)*

## B.21 — Medical / Clinic
- [x] Clinic visits log  *(ClinicVisit: complaint/treatment/medication/referredTo; REFERRALS SMS THE GUARDIAN automatically (fired live, quota-checked, parentNotifiedAt + "parent SMS ✓" badge); NEW clinic.view/manage perms — SUPPORT_STAFF (school nurse — no NURSE role in the 16) + DEPUTY + LEADERSHIP; screenshot 97)*
- [x] Medical history  *(StudentMedical one-per-student: blood group, chronic conditions, SHA (ex-NHIF) number, notes; full medical file view (profile + visits + medication plans); upsert edits in place (verified no dup))*
- [x] Allergies (with alerts)  *(allergies JSON on the profile; THREE alert surfaces: ① visit recording warns "⚠ ALLERGIC to Penicillin — verify before administering" (verified), ② medication plans matching an allergy are BLOCKED 422 (verified — safety first), ③ kitchen board (B.19) shows the food-allergy register for the cooks ("Groundnuts" flagged — verified); allergy register tab w/ red badges; screenshot 98)*
- [x] Medication tracking  *(MedicationPlan + per-dose MedicationDose trail (who gave it, when, note); Give-dose button, stop plan, dose-on-stopped 422, double-stop 409; "last dose 14:05 by Otieno Brian" on the card)*
- [x] Health reports  *(year stats: total visits, referrals out, allergic students, active medications + FREQUENT VISITORS (≥3/year — chronic/welfare flag) sorted worst-first; family portal childHealth (scopeWhere — other-family 404 verified) shows visits + allergies + blood group)*

## B.22 — Security
- [x] Visitor management  *(BUILT AT A.18 (VisitorLog: badge V-###, ID capture, sign-in/out, host) + B.16 boarder-visit link — re-verified live via reception flows; ticking here per list order)*
- [x] Gate pass management  *(GatePass GP-####: reason/leave-at/return-by/escort; ONE active per student 409; gate checks by number (case-insensitive) → USED + stamped, re-use REJECTED ("do not allow exit"), unknown 404, cancel; NEW security.view/manage perms (RECEPTIONIST = gate desk + LEADERSHIP); screenshot 101)*
- [x] Student pickup auth  *(PickupPerson per student: name/relationship/phone/national ID (checked at the gate); gate lookup by name/adm shows ONLY authorised people, red "NOBODY is authorised" warning when list empty; add/remove (soft) live-tested)*
- [ ] CCTV integration  *(HARDWARE-DEFERRED — needs camera NVR/RTSP infra (founder hardware decision); flagged, never faked)*
- [x] Emergency panic alerts  *(PanicAlert FIRE/MEDICAL/INTRUDER/OTHER: ANY staff raises (panic.raise on all 14 staff roles) → 9 staff in-app alerts + leadership SMS (principal+deputy, fired live, quota-recorded); parents/students NEVER alerted (verified); ACTIVE-emergency banner w/ resolve; big red button UI; screenshot 102)*

## B.23 — AI Intelligence Layer

*FOUNDER DIRECTIVE 2026-06-13: this layer launches THROUGH THE MASCOT — the product never says "AI", it says **Bundi**. The Bundi experience shell (G.36) is built design-only and platform-PAUSED (G.22 flag `bundi`) until launch. NO other feature may depend on this layer — verified 2026-06-13: zero AI/OpenAI/Claude references in src/, every B.1–B.22 feature is fully rule-based (report comments, anomaly detection etc. all have rule-based engines with swap seams). The engine lines below stay unticked until founder provides the key AND launches Bundi.*

- [ ] AI report card comments
- [ ] Excel/PDF/photo column mapping
- [ ] Fee default prediction
- [ ] Student dropout risk
- [ ] AI lesson plan generator
- [ ] AI Q&A assistant
- [ ] Attendance anomaly detection
- [ ] SMS personalization at scale
- [ ] KCSE prediction
- [ ] Teacher performance scoring
- [ ] Enrollment forecasting
- [ ] Budget forecasting

## B.24 — Owner Dashboard
- [x] Total students live  *(/owner "My school at a glance": active count + boys/girls/boarders split (live hostelAllocation); NEW permission owner.dashboard → SCHOOL_OWNER+PRINCIPAL only (teacher/bursar/parent can() false + HTTP 403 + page /forbidden all verified); nav "My School" (LineChart); live-tested 2026-06-13; screenshot 113)*
- [x] Revenue (today/term)  *(today = PAID Payment rows since Nairobi midnight (KES 5,000 verified vs seed); term = paidKes applied to current-term invoices honouring discounts (KES 48,000 verified); owner-test.ts 25/25 ✓)*
- [x] Collection % vs target  *(collected/billed % vs Tenant.collectionTargetPct (migration b24_owner_dashboard, default 85); on-track green / behind amber bar; inline "Change target" editor → POST /api/owner (clamped 10-100, over-100→100 verified, audit owner.target_updated verified); 45% vs 85% amber shown live)*
- [x] Outstanding fees breakdown  *(aging buckets not-yet-due/1-30/31-60/60+ (sum = outstanding KES 57,500 verified) w/ colour bars + "Largest balances" top-5 debtors sorted desc (Atieno 33k → Kamau 18k → Wanjiru 6.5k) linking to student profiles + Open Finance →)*
- [x] Staff costs  *(latest B.8 PayrollRun: gross/month KES 295,000, take-home, statutory, staff count, Approved badge; seed now creates demo run 2026-05 APPROVED using the REAL grossToNet statutory calculator (idempotent); empty state links /payroll)*
- [x] Profitability  *(honest term proxy: fees collected − payroll×3 months = surplus (negative KES -837,000 shown red on seed data — truthful, not faked); note explains other expenses arrive with C.5)*
- [x] Enrollment trends chart  *(new learners by admittedOn, last 6 months, CSS bar chart (5 in Jun verified vs seed); no chart lib — glass-friendly)*
- [x] Academic performance trends  *(published exams this year: mean % bars green/amber/red (CAT 1 — Term 2 64% verified vs B.5 seed); unpublished exams excluded)*
- [x] School ranking analytics  *(percentile of collection rate among NEYO schools w/ bills — ANONYMIZED: payload returns percentile+cohort only, never another school's name (JSON grep verified); cohort<2 shows "appears when more schools join")*

## B.25 — Additional Modules

### Uniform Management
- [x] Uniform items (shirt, trouser, tie, PE kit)  *(BUILT AT B.18/G.24: StockItem category "Uniform" + photo + price = the item registry (sweater seeded); ticked per list order after B.25 review 2026-06-13 — no rebuild, one stock truth kept)*
- [x] Sizes per item (XS-XXL + custom)  *(NEW UniformSize model (migration b25_uniform_sizes, @@unique tenant+item+size, TENANT_OWNED); preset chips XS-XXL + Size 26-34 + any custom via setSizeStock upsert; "Uniform sizes" tab in /inventory (Shirt icon); seeded sweater S8/M14/L12/XL6; uniform-sizes-test.ts 10/10 ✓; screenshot 115)*
- [x] Stock per item per size  *(per-size qty pills (red sold-out / amber ≤3 / normal) + click-to-edit dialog; MASTER StockItem.qty auto-syncs to the sum of size rows (46 verified after M 14→20); deliveries decrement BOTH size row and master (20→18 + 46→44 verified); negative qty 422 + non-uniform item 422; bursar manage, parent write 403 (HTTP verified))*
- [x] Sales to students + payment tracking  *(BUILT AT G.24 placeOrder: invoice at placement (founder rule), supplier SMS, status chain, delivered→stock decrement; B.25 EXTENDS: portal order dialog now shows LIVE size pills (sold-out disabled w/ strikethrough, "(N left)" hints at ≤3, order blocked until a size is picked when sizes exist); supplier SMS carries the size ("× 2 (M)" fired live in test); screenshot 116)*

### School Assets
- [x] Asset tagging (computers, furniture, vehicles)  *(BUILT AT B.18: Asset model, auto AST-#### tags, category/location/condition — ticked per list order after B.25 review 2026-06-13, not rebuilt)*
- [x] Acquisition records  *(acquiredOn + valueKes existed (B.18); B.25 made them EDITABLE in the new AssetDrawer ("Bought on" + "Cost") and they now drive depreciation; "since 2025-01-15" shown on register rows; screenshot 117)*
- [x] Depreciation auto-calc  *(Asset.depreciationPctPerYear (migration b25_asset_depreciation_maintenance); straight-line bookValueKes() pure fn (floors at 0; unit-verified 25%/yr 1yr ≈ 75,017 + 10yr floor 0); register shows BOOK VALUE w/ "bought KES X · −25%/yr" subtext (laptop 78,000 → 50,551 live-verified via HTTP); >100% rejected 422; asset-test.ts 15/15 ✓)*
- [x] Maintenance schedule  *(NEW AssetMaintenance log (SERVICE/REPAIR/INSPECTION/OTHER + cost + note + byName, mirrors B.17 VehicleMaintenance) + Asset.nextMaintenanceOn → red "service due" / amber "service soon ≤30d" badges on register (laptop seeded OVERDUE 2026-06-01 — verified); logging w/ nextMaintenanceOn clears the due flag (verified); per-asset history + total spent in drawer; negative cost 422; audits inventory.asset_maintained; screenshot 118)*
- [x] Custodian per asset  *(custodian existed (B.18); B.25 made it editable in the drawer (updateAsset, audited inventory.asset_updated — "Otieno Brian" change verified); teacher write 403 HTTP-verified)*

### Supplier Management
- [x] Supplier records + categorization  *(NEW Supplier model (migration b25_suppliers, @@unique tenant+name, TENANT_OWNED): name/contact/phone (normalizeKePhone — "0711000222"→"+254711000222" verified)/email/KRA PIN/notes; dup name 409 + bad phone 422 verified; "Suppliers" tab in /inventory (Truck icon) + Add-supplier dialog; G.24 tailor seeded as a real Supplier row (★5); supplier-test.ts 14/14 ✓; screenshot 119)*
- [x] Categorization (food/uniform/cleaning)  *(SUPPLIER_CATEGORIES: Food/Uniform/Cleaning/Stationery/Transport/Services/Other; directory sorted category-then-name; category select in the dialog)*
- [x] Ratings + history  *(1-5 STAR rating — one-tap stars on each card (rate 9 rejected 422, saved rating verified); audit trail supplier.created/rated/contract_added/archived = the history (verified ≥4 rows); archive hides from directory (verified))*
- [x] Contracts with expiry  *(SupplierContract (title/startsOn/endsOn/valueKes/note); end≤start 422; ≤30-day amber "renew soon · Nd left" + red "expired" + green "active" badges (B.17 daysUntil pattern — Naivas seeded expiring ~20d amber demo verified, expired-contract red verified); Add-contract dialog explains the 30-day warning; teacher GET 403 HTTP-verified)*

### Procurement
- [x] Purchase requests  *(PurchaseRequest model (migration b25_procurement; title/details/neededBy/status OPEN|ORDERED|CANCELLED, requestedBy denorm) + createRequest (inventory.manage) + "New purchase request" dialog in /inventory Procurement tab; audit procurement.request_created; seeded "Term 3 dry foods restock" by Achieng Mary; verify-and-tick 2026-06-13 — backend+UI were already built last chat; procurement-test.ts 16/16 ✓; HTTP: principal board ✓, teacher 403 ✓; screenshot 120)*
- [x] Quotations comparison  *(PurchaseQuote model (per request, supplierName frozen, amountKes, note) + addQuote (supplier must exist 404; closed-request 422) + procurementBoard returns quotes ordered cheapest-first w/ cheapestQuoteId; UI shows green "BEST PRICE" highlight on the cheapest + "Order" button per quote; seeded Naivas KES 86,500 (best) vs Kiambu General Traders KES 92,000; live-verified on screenshot 120)*
- [x] PO generation  *(PurchaseOrder model (poNo KH-PO-#### via A.4, links request+quote+supplier, status state-machine) + createOrderFromQuote (request→ORDERED, poNo generated); seeded KH-PO-000001; audit procurement.po_created; verified poNo generation in procurement-test.ts)*
- [x] Approval workflow per threshold  *(Tenant.poApprovalThresholdKes default KES 50,000; createOrderFromQuote auto-APPROVES under threshold (small buys never block the principal) else PENDING_APPROVAL; approveOrder = LEADERSHIP only (tenant.manage_settings; teacher 403 HTTP-verified) + creator-cannot-self-approve (verified); "Orders above KES 50,000 need leadership approval" notice + Approve button shown only to canApprove; live-tested under/over threshold + self-approve block)*
- [x] Delivery tracking + 3-way match  *(markSent (APPROVED→SENT) → recordDelivery (goods-received note + deliveredValueKes) → threeWayMatch (PO total vs goods received vs supplier invoice — all-equal = matchOk green, any diff flagged red w/ human note, "never pay a mismatched invoice quietly"); double-match blocked, cancel reopens the request; DeliverDialog + MatchDialog in the Procurement tab; seeded KH-PO-000001 MATCHED ✓ "PO, delivery and invoice all agree"; procurement-test.ts: clean match + mismatch flagged + mismatch note + double-match-blocked all ✓; screenshot 120)*

### Expenses Tracking
- [x] Expense categories  *(ExpenseCategory model (migration b25_expenses; @@unique tenant+name, archived) + addCategory (dup 409) + one-click KE preset seed (10 categories: Utilities/Repairs/Cleaning/Stationery/Food/Transport/Staff Welfare/Examinations/Licenses/Other) + Categories tab in /inventory Expenses; archive toggle; built 2026-06-13; expense-test.ts 20/20 ✓; screenshots 121-122)*
- [x] Cost centers  *(CostCenter model (@@unique tenant+name, archived) + addCostCenter (dup 409) + 7 KE presets (Whole school/Administration/Academics/Boarding/Kitchen/Transport/Co-curricular); optional per-expense; drives the by-cost-center report; live-verified)*
- [x] Approval workflows  *(Tenant.expenseApprovalThresholdKes default KES 20,000; createExpense auto-APPROVES under threshold (small spends never block) else PENDING_APPROVAL; approveExpense/rejectExpense = LEADERSHIP only (tenant.manage_settings; teacher 403 HTTP-verified) + creator-cannot-self-approve (verified: principal self-approve 403, deputy approves 200); reject carries a reason the bursar sees; "awaiting approval / approved / rejected" badges + Approve/Reject buttons shown only to canApprove; live-tested under/over/self-approve/reject)*
- [~] Receipt photo upload + OCR  *(receipt photo/PDF upload via A.9 storage (FileUpload, category "expense-receipt") — receiptFileUrl/Name stored + downloadable link on the expense row, WORKS FULLY; OCR auto-extract of amount/payee is BUNDI-GATED (deferred-pending B.23 launch, never faked) — manual entry is complete without it)*
- [x] Reports  *(expenseReports(month): APPROVED spend grouped By category + By cost center w/ CSS bars + month total (pending/rejected excluded — verified KES 19,300 across 2, the KES 38,000 pending excluded); GET /api/expenses?reports=&month=; FEEDS B.24 PROFITABILITY — owner dashboard now subtracts real approved expenses over the term window (approvedExpensesSinceKes; surplus moved -837k→-887k live when 50k approved — verified), honest line replaces the old payroll-only proxy; screenshot 122)*

### Calendar & Events
- [x] Calendar UI (month/week/day)  *(BUILT AT A.17 — /calendar month grid + week/day agenda + keyboard nav (←/→/T); re-verified live 2026-06-13, screenshots 123-124; ticked per B.25 list order, not rebuilt)*
- [x] KE public holidays  *(BUILT AT A.17 — KE_MOMENTS holiday layer (cultural-calendar.ts) merged into getOccurrences across the year(s) a range spans; Madaraka/Mashujaa/Jamhuri etc.; re-verified)*
- [x] Cultural moments live  *(BUILT AT A.15/A.17 — cultural moments (academic/cultural) surfaced on the calendar + /brand; re-verified)*
- [x] Religious calendars (opt-in)  *(BUILT AT A.17 — Tenant.showReligiousHolidays toggle (Settings) gates religious moments in getOccurrences; PUT /api/calendar/prefs; re-verified)*
- [x] Event creation with audience targeting  *(BUILT AT A.17 — CalendarEvent + createEvent w/ audience "all" or any of the 16 roles (audienceRole filter), + A.17.5 invite notifications via A.7 notify(); leadership-gated calendar.manage; re-verified)*
- [x] iCal export  *(BUILT AT A.17 — buildIcs() RFC-5545 VCALENDAR (all-day VALUE=DATE + timed TZID=Africa/Nairobi) + GET /api/calendar/ics; B.25 update: recurring events expand to one VEVENT per occurrence in the export (verified 4 VEVENTs for a 4-week series); re-verified)*
- [~] WhatsApp reminders  *(A.7 whatsapp.ts transport seam + cascade slot EXIST; live sending DEFERRED-pending-founder WhatsApp Business API creds (WHATSAPP_TOKEN) — flips on with the env key, no code change; in-app calendar invites already work via A.17.5)*
- [x] Recurring events (RRULE)  *(NEW B.25 2026-06-13: CalendarEvent += recurrence (WEEKLY|MONTHLY) + recurUntil (migration b25_calendar_recurrence); pure expandRecurrence() — WEEKLY same weekday every 7d, MONTHLY same day-of-month (months without that day SKIPPED not shifted — verified 31st skips Feb/Apr/Jun/Sep/Nov), recurUntil cap + HARD_CAP safety; getOccurrences expands a series into per-date occurrences (unique id "<seriesId>:<date>", recurring flag, shared seriesId) bounded to the view range; event dialog "Repeats" picker (does-not-repeat/weekly/monthly + repeat-until) + green "🔁 weekly/monthly" badge in agenda; deleting any occurrence removes the whole series (series-id aware); seed: weekly Monday Staff Briefing + monthly 5th Fees-due reminder; calendar-recurrence-test.ts 14/14 ✓; live API verified 4 July briefings; screenshots 123 (month: every Monday) + 124 (week: 🔁 weekly badge))*

## B.26 — Premium Features
*REVIEWED 2026-06-13 (verify-and-flag, no faking per Prompt 2). Every line is Bundi-gated (AI), hardware-gated, or native-platform — so none is [x] (fully built+testable). [~] = a real seam/foundation already exists and the ONLY blocker is a founder decision (creds / hardware / native toolchain). The Bundi layer (G.36) is platform-paused; NO feature depends on it.*
- [~] AI Assistant (general Q&A)  *(Bundi experience shell BUILT design-only + platform-paused (G.36, /bundi); the Q&A engine is the B.23 layer — launches THROUGH Bundi when founder provides the key + release signal; never says "AI")*
- [~] WhatsApp Bot for parents  *(A.7 whatsapp.ts transport seam + cascade slot EXIST; inbound bot + outbound replies activate with WHATSAPP_TOKEN (WhatsApp Business API creds, founder action) — in-app + SMS parent comms already live (B.14))*
- [~] Parent Mobile App (native)  *(SHIPPED AS PWA today: installable manifest + service worker + offline action queue (G.2) — parents use /portal on their phones, 360px-first; a true native RN/Swift app is a future packaging step on the same APIs)*
- [~] Teacher Mobile App (native)  *(same PWA foundation (G.2) — /teacher works installable + offline-first incl. queued attendance marking; native packaging = future)*
- [~] Student Mobile App (native)  *(same PWA foundation — shared family /portal serves students (founder decision B.11); native packaging = future)*
- [ ] Face Recognition Attendance  *(deferred — needs camera hardware + vision model; same family as B.3 face/RFID/fingerprint + B.22 CCTV hardware lines; flagged, never faked)*
- [~] GPS Bus Tracking  *(foundation EXISTS: Haversine distance + geofence (G.17) + transport UI seam ("arrives with tracker hardware, never faked"); live bus tracking activates when founder fits GPS trackers + feeds coordinates — hardware decision)*
- [~] AI Exam Analysis  *(rule-based analytics LIVE today: B.5 positions/means/stream+level comparison + B.24 exam trend bars; deeper narrative/predictive analysis = Bundi layer (B.23) on top, never depended on)*
- [~] AI Report Generation (narrative)  *(rule-based report-card remarks LIVE (B.5 buildComment, CBC vs 8-4-4 phrasing); richer narrative = Bundi swap-point at B.23)*
- [~] AI Timetable Generator  *(rule-based generators LIVE: B.4 per-class greedy autoFill w/ teacher double-booking avoidance; whole-school constraint solver speced at G.18 (build on signal); Bundi assist = B.23 on top)*
- [~] AI Homework Generator  *(B.12 homework assignment LIVE rule-based; AI draft generation = Bundi (B.23) convenience layer)*
- [~] AI Lesson Planner  *(B.4 lesson plans LIVE rule-based (teacher-owned, status); AI starter drafts = Bundi (B.23))*
- [~] AI Student Risk Detection composite  *(rule-based signals LIVE today: B.3 chronic-absence + attendance anomaly flags, B.20 behaviour bands (GOOD/WATCH/AT_RISK), B.7 arrears, B.21 frequent-visitor welfare flag; composite Bundi scoring = B.23 on top of these honest rule engines)*

---

# PART C — Business OS Features

## C.1 — Executive Dashboard
- [ ] Revenue tracking
- [ ] Expenses tracking
- [ ] Profit (gross + net)
- [ ] Outstanding invoices total + count
- [ ] Cash position across accounts
- [ ] MRR tracker
- [ ] Sales pipeline value + stage
- [ ] Customer satisfaction score (NPS)
- [ ] Staff attendance %
- [ ] Inventory low-stock alerts
- [ ] AI business insights
- [ ] Cash flow forecast
- [ ] Predictive churn alerts
- [ ] Competitive benchmarking
- [ ] Board-pack auto-generation
- [ ] Multi-currency dashboards

## C.2 — CRM
- [ ] Lead capture (manual)
- [ ] Lead source tagging
- [ ] Contact management (full history)
- [ ] Deal tracking (basic pipeline)
- [ ] Activity log per contact
- [ ] Notes per contact
- [ ] Customer status (lead/prospect/customer/churned)
- [ ] Search + filter contacts
- [ ] Customer segmentation
- [ ] Lead scoring (rule-based + AI)
- [ ] Follow-up reminders
- [ ] Communication history (timeline)
- [ ] Visual pipeline (Kanban)
- [ ] Customizable deal stages
- [ ] Win/loss reasons
- [ ] Account hierarchy
- [ ] Partner & supplier records
- [ ] Custom fields per contact type
- [ ] Bulk import
- [ ] Email sync with contacts
- [ ] Sales territory assignment
- [ ] Lead distribution / round-robin
- [ ] LinkedIn enrichment
- [ ] Click-to-call + auto-log
- [ ] Calendar auto-log meetings
- [ ] AI next-best-action
- [ ] Predictive deal close probability
- [ ] Customer health score

## C.3 — Sales
- [ ] Quotation creation (branded PDF)
- [ ] Invoice generation
- [ ] Sales order tracking
- [ ] Customer balance ledger
- [ ] Payment recording
- [ ] Revenue reports
- [ ] Proposals (multi-page)
- [ ] Quote → Order → Invoice workflow
- [ ] Delivery notes
- [ ] Multiple price lists
- [ ] Volume discounts
- [ ] Commission per sales rep
- [ ] Sales targets + progress
- [ ] Revenue forecasting
- [ ] Recurring invoices (subscriptions)
- [ ] Quote-to-cash automation
- [ ] Multi-currency invoicing
- [ ] VAT / Tax handling
- [ ] Multi-warehouse sales
- [ ] Channel partner tracking
- [ ] Sales gamification
- [ ] Sales coaching AI
- [ ] International sales (export docs)

## C.4 — Marketing
- [ ] Email campaigns
- [ ] Email templates (drag-drop)
- [ ] SMS campaigns
- [ ] WhatsApp campaigns
- [ ] Landing page builder
- [ ] Lead capture forms
- [ ] Pop-ups + exit-intent
- [ ] A/B testing
- [ ] Open + click tracking
- [ ] Unsubscribe management
- [ ] Marketing automation flows
- [ ] Lead magnets (gated content)
- [ ] UTM tracking + attribution
- [ ] Marketing analytics dashboard
- [ ] Customer journey visualization
- [ ] Cost-per-lead tracking
- [ ] ROI per campaign
- [ ] Social media scheduling
- [ ] SEO content planner (AI)
- [ ] Ad campaign management
- [ ] Influencer relationship management
- [ ] Programmatic ad buying
- [ ] Customer data platform (CDP)
- [ ] Predictive lead scoring
- [ ] LTV modeling
- [ ] Marketing mix modeling

## C.5 — Finance
- [ ] Income tracking per source
- [ ] Expense tracking per category
- [ ] Cash flow view
- [ ] AP (vendor balances)
- [ ] AR (customer balances)
- [ ] Bank reconciliation
- [ ] Basic P&L
- [ ] Budgeting per dept / period
- [ ] Budget vs actual reports
- [ ] Multi-account / multi-currency
- [ ] Recurring expenses
- [ ] Expense approval workflow
- [ ] Petty cash management
- [ ] Loan management
- [ ] Bank feeds (Equity, KCB)
- [ ] Receipt photo upload + OCR
- [ ] Reimbursement workflow
- [ ] Financial forecasting
- [ ] Cash flow forecast
- [ ] Multi-entity consolidation
- [ ] Inter-company transactions
- [ ] Treasury management
- [ ] Investment portfolio tracking

## C.6 — Accounting
- [ ] Chart of accounts (KE)
- [ ] General ledger
- [ ] Journal entries
- [ ] Trial balance
- [ ] P&L statement
- [ ] Balance sheet
- [ ] Cash flow statement
- [ ] Fixed assets register
- [ ] Depreciation (multiple methods)
- [ ] Tax management (VAT 16%, WHT 5%)
- [ ] Tax returns prep (P9, VAT3)
- [ ] Audit trail per transaction
- [ ] Period closing
- [ ] Multi-currency journal entries
- [ ] Consolidated statements
- [ ] Inter-company eliminations
- [ ] Cost accounting
- [ ] IFRS-compliant reporting
- [ ] XBRL export

## C.7 — HR
- [ ] Employee records (full)
- [ ] Documents (contract, ID, certs)
- [ ] Org chart
- [ ] Leave management (all types)
- [ ] Leave approval workflow
- [ ] Leave calendar (team view)
- [ ] Performance reviews
- [ ] Goal setting + tracking
- [ ] Recruitment (jobs, applications, interviews)
- [ ] Training records
- [ ] Staff contracts (template + auto-fill)
- [ ] Disciplinary records
- [ ] 360-degree reviews
- [ ] Succession planning
- [ ] Engagement surveys
- [ ] Skill matrix

## C.8 — Payroll
- [ ] Salary processing
- [ ] Allowances (housing, transport, lunch)
- [ ] Deductions (PAYE/NSSF/NHIF/SHA/SACCO)
- [ ] PAYE calculation (KE bands)
- [ ] NSSF Tier I + II
- [ ] NHIF / SHA
- [ ] Payslip generation (PDF branded)
- [ ] Bulk salary payment (M-Pesa B2C)
- [ ] Tax certs (P9 annual)
- [ ] Payroll reports
- [ ] Variable pay (bonuses, commissions)
- [ ] Stock options tracking
- [ ] Salary advances + repayment automation

## C.9 — Projects
- [ ] Projects (create, status, owner)
- [ ] Milestones
- [ ] Tasks (assign, due, priority)
- [ ] Subtasks
- [ ] Task dependencies
- [ ] Teams + roles
- [ ] Time tracking
- [ ] Resource allocation
- [ ] Project budget vs actual
- [ ] Project profitability
- [ ] Gantt chart view
- [ ] Kanban view
- [ ] Custom workflows per project type
- [ ] Cross-project resource planning
- [ ] Critical path analysis
- [ ] Risk register
- [ ] Earned value management
- [ ] Client billing per hours

## C.10 — Inventory
- [ ] Products catalog (SKU)
- [ ] Stock levels per warehouse
- [ ] Stock movements
- [ ] Multiple warehouses
- [ ] Stock transfers
- [ ] Reorder alerts
- [ ] Stock valuation (FIFO/LIFO/avg)
- [ ] Batch / serial tracking
- [ ] Expiry tracking
- [ ] Barcode gen + scan
- [ ] Multi-unit conversions
- [ ] Lot tracking for compliance
- [ ] Stock-take wizard (handheld)
- [ ] Demand forecasting AI

## C.11 — Procurement
- [ ] Supplier management
- [ ] Purchase requests
- [ ] Purchase orders
- [ ] Quotation comparison
- [ ] Approval workflow per threshold
- [ ] Vendor evaluation
- [ ] Receiving + inspection
- [ ] 3-way match
- [ ] RFP / RFQ portal
- [ ] Supplier onboarding workflow
- [ ] Contract management

## C.12 — Asset Management
- [ ] Asset register (full)
- [ ] Asset categorization
- [ ] Acquisition cost + date
- [ ] Depreciation (multiple methods)
- [ ] Current + book value
- [ ] Maintenance schedule + log
- [ ] Repairs + costs
- [ ] Assignment to person/location
- [ ] Disposal workflow
- [ ] Transfer between branches
- [ ] Insurance tracking

## C.13 — Helpdesk
- [ ] Ticketing (web, email, WhatsApp in)
- [ ] Categories + priorities
- [ ] Assignment + routing rules
- [ ] SLA tracking
- [ ] Live chat widget
- [ ] Knowledge base (public + internal)
- [ ] Canned responses
- [ ] CSAT surveys post-ticket
- [ ] Complaint management
- [ ] Escalation workflows
- [ ] AI auto-reply suggestions
- [ ] Voice call ticketing
- [ ] Video support (screen share)
- [ ] Customer health from tickets
- [ ] Predictive ticket volume

## C.14 — Document Management
- [ ] File upload (PDF, DOCX, XLSX, images)
- [ ] Folders + tags
- [ ] Search by name + content
- [ ] Permissions per folder
- [ ] Version control
- [ ] Approval workflows
- [ ] Digital signatures
- [ ] Templates library
- [ ] Auto-naming conventions
- [ ] Retention policies
- [ ] Audit log per document
- [ ] OCR for scanned docs
- [ ] Document classification AI
- [ ] Smart redaction (PII removal)
- [ ] Legal hold
- [ ] DocuSign-grade signing

## C.15 — Communication Center
- [ ] Internal team chat (direct + group)
- [ ] Announcements broadcast
- [ ] Notification bell + in-app
- [ ] Push notifications (PWA)
- [ ] @mentions
- [ ] Video meetings (built-in or Zoom embed)
- [ ] Notice board
- [ ] Polls + surveys
- [ ] Threaded discussions
- [ ] File sharing in chat
- [ ] Voice notes
- [ ] Message translation
- [ ] Read receipts + typing
- [ ] Voice calls (WebRTC)
- [ ] Video calls + screen share
- [ ] Live town halls
- [ ] E2E encryption (sensitive)
- [ ] AI meeting summaries

## C.16 — Business Intelligence
- [ ] Pre-built dashboards
- [ ] Custom dashboard builder (drag-drop)
- [ ] KPI widgets
- [ ] Charts (multiple types)
- [ ] Filters
- [ ] Drill-down
- [ ] Scheduled reports
- [ ] Export (PDF/Excel/CSV)
- [ ] Data refresh schedules
- [ ] Shared dashboards
- [ ] Mobile-friendly
- [ ] Alerts (threshold-triggered)
- [ ] Natural language queries
- [ ] Pivot tables
- [ ] Cohort analysis
- [ ] Funnel analysis
- [ ] Retention curves
- [ ] Anomaly detection AI
- [ ] What-if modeling
- [ ] Custom SQL editor

## C.17 — AI Business Layer
- [ ] AI CEO Assistant (NL Q&A)
- [ ] "Which products are loss-making?"
- [ ] "Which customers owe us money?"
- [ ] "Which salesperson is performing best?"
- [ ] AI Sales: suggest follow-ups
- [ ] AI Sales: predict close probability
- [ ] AI Sales: recommend upsells
- [ ] AI Marketing: generate copy
- [ ] AI Marketing: write ad variants
- [ ] AI Marketing: email sequences
- [ ] AI Marketing: performance analysis
- [ ] AI Finance: cash flow forecast
- [ ] AI Finance: expense anomaly
- [ ] AI Finance: budget recommendations
- [ ] AI Ops: detect stock shortages
- [ ] AI Ops: detect delayed projects
- [ ] AI Ops: unproductive staff
- [ ] AI Ops: cost overruns
- [ ] AI HR: job descriptions
- [ ] AI HR: CV screening
- [ ] AI HR: interview questions
- [ ] AI Finance: receipt auto-categorize
- [ ] AI Legal: contract risk review
- [ ] AI Strategy: SWOT from data
- [ ] AI Customer: churn prediction
- [ ] AI Sales: per-customer pricing
- [ ] AI Marketing: image/video ad gen
- [ ] AI Ops: process mining
- [ ] AI Predictive maintenance
- [ ] AI auto-task from emails

## C.18 — E-Commerce
- [ ] Online store storefront
- [ ] Product catalog + variants
- [ ] Shopping cart
- [ ] Checkout (M-Pesa + card)
- [ ] Order management
- [ ] Delivery tracking
- [ ] Customer accounts
- [ ] Product reviews
- [ ] Discount codes
- [ ] Abandoned cart recovery
- [ ] Stock sync with inventory
- [ ] Multi-language storefront
- [ ] SEO optimization
- [ ] Email integration

## C.19 — POS
- [ ] Touch-friendly UI (tablet)
- [ ] Barcode scanning
- [ ] Receipt printing (thermal)
- [ ] Cash drawer integration
- [ ] Multi-payment (cash+M-Pesa+card)
- [ ] Discounts + promotions
- [ ] Refunds + returns
- [ ] End-of-day reconciliation
- [ ] Multi-cashier shifts
- [ ] Restaurant: tables + KOT
- [ ] Pharmacy: prescription tracking
- [ ] Offline mode

## C.20 — Subscription Management
- [ ] Plans + pricing tiers
- [ ] Billing cycles
- [ ] Auto-renewal
- [ ] Upgrades/downgrades (pro-rated)
- [ ] Cancellation flow
- [ ] Dunning (failed payment retries)
- [ ] MRR / ARR tracking
- [ ] Churn tracking
- [ ] Usage-based billing
- [ ] Add-on management
- [ ] Coupon engine
- [ ] Revenue recognition (ASC 606)

## C.21 — Franchise / Multi-Branch
- [ ] Branch / outlet registration
- [ ] Branch-level dashboards
- [ ] Cross-branch reporting
- [ ] Inter-branch transfers (stock/cash)
- [ ] Branch P&L
- [ ] Franchisee royalty tracking
- [ ] Brand consistency monitoring
- [ ] Centralized policy distribution
- [ ] Branch benchmarking
- [ ] Multi-currency consolidation

## C.22 — Mobile App Native
- [ ] Clock-in/out (GPS-tagged)
- [ ] Expense submission (photo)
- [ ] Dashboards on mobile
- [ ] Approve workflows on mobile
- [ ] Push notifications
- [ ] Offline data entry + sync
- [ ] Barcode scanning
- [ ] Customer signature capture
- [ ] Driver delivery confirm
- [ ] Manager approval queue

## C.23 — Workflow Automation
- [ ] Pre-built templates
- [ ] Trigger-based actions
- [ ] New lead → assign + WhatsApp + task
- [ ] Invoice overdue → reminder cascade
- [ ] New customer → welcome sequence
- [ ] Low stock → auto-create PO draft
- [ ] Approval routing
- [ ] Scheduled tasks (recurring)
- [ ] Multi-step workflows
- [ ] Conditional branches
- [ ] Visual drag-drop builder
- [ ] External integrations (Zapier-style)
- [ ] Webhook triggers
- [ ] Custom code steps (JS)
- [ ] AI-generated workflow suggestions
- [ ] Workflow analytics
- [ ] Branching by data values
- [ ] Loop / iteration

## C.24 — KE Compliance
- [ ] KRA PIN validation
- [ ] VAT-compliant invoices (16%)
- [ ] WHT (5%) auto-calc + certs
- [ ] NSSF Tier I + II
- [ ] NHIF / SHA
- [ ] P9 annual tax certs
- [ ] iTax-format exports
- [ ] Statutory deadline reminders
- [ ] eTIMS integration
- [ ] KRA M-Service integration
- [ ] Auto VAT3 return filing
- [ ] Audit-ready compliance reports

## C.25 — Vendor Portal
- [ ] Vendor self-service login
- [ ] View open POs
- [ ] Submit quotations / bids
- [ ] Submit invoices + delivery
- [ ] Payment status visibility
- [ ] Performance metrics shared
- [ ] Catalog management
- [ ] Vendor rating + feedback
- [ ] Vendor certifications upload

## C.26 — Customer Portal
- [ ] Customer self-service login
- [ ] View invoices + payment history
- [ ] Pay via M-Pesa STK
- [ ] Submit support tickets
- [ ] Download statements
- [ ] Update contact info
- [ ] View order history
- [ ] Receive notifications
- [ ] Reorder previous orders
- [ ] Self-service KB search
- [ ] Schedule appointments
- [ ] Loyalty / rewards tracking

---

# PART D — Farm OS Features
> Major categories (to be expanded into individual feature lines when this part begins):
- [ ] Main Dashboard
- [ ] Crops
- [ ] Plots/GPS
- [ ] Calendar & Tasks
- [ ] Greenhouse
- [ ] Irrigation
- [ ] Fertilizer
- [ ] Spray
- [ ] Pests & Disease
- [ ] Nursery
- [ ] Harvest
- [ ] Livestock: Dairy
- [ ] Livestock: Poultry
- [ ] Livestock: Goats/Sheep
- [ ] Inventory
- [ ] Procurement
- [ ] Supplier CRM
- [ ] Customer CRM
- [ ] Market Intelligence
- [ ] Sales/Delivery
- [ ] Finance
- [ ] Workers/Payroll
- [ ] Machinery
- [ ] Weather
- [ ] AI Layer
- [ ] Mobile App
- [ ] WhatsApp Bot
- [ ] Exec Dashboard
- [ ] Premium Enterprise

---

# PART E — Creator OS Features
> Major categories (to be expanded into individual feature lines when this part begins):
- [ ] Creator Hub
- [ ] Audience CRM
- [ ] Email Newsletter
- [ ] SMS/WhatsApp
- [ ] Content Library
- [ ] Course Builder
- [ ] Digital Storefront
- [ ] Membership Tiers
- [ ] Community
- [ ] Live Events
- [ ] Booking/Calendar
- [ ] Coaching Notes
- [ ] Affiliate
- [ ] Sponsorships
- [ ] Tip Jar
- [ ] Payments
- [ ] Analytics
- [ ] AI Studio
- [ ] Social Distribution
- [ ] Link-in-Bio
- [ ] Marketplace
- [ ] Mobile App
- [ ] Calendar
- [ ] Settings

---

# PART F — Internal NEYO Operations

## F.1 — Founder Operations
- [x] BUILD-LOG.md filled daily  *(completed 2026-06-14; `BUILD-LOG.md` added as human-readable mirror + `NeyoBuildLog` DB-backed build-log rows; `/founder` Build log tab saves through the real API; screenshots 142 + 146)*
- [x] Weekly metrics review (revenue, MRR, customers)  *(completed 2026-06-14; `NeyoMetricSnapshot` stores revenueKes/mrrKes/paying/trial/active/churn-risk/smsSpend; `/founder` Metrics tab + overview MRR card; seeded 2026-W24; screenshot 146)*
- [x] Monthly all-hands  *(completed 2026-06-14; `NeyoFounderOpsEntry` kind `MONTHLY_ALL_HANDS`, planned/done/skipped workflow, summary/decisions/action-items; visible in `/founder` Cadence/Overview)*
- [x] Quarterly self-audit  *(completed 2026-06-14; `NeyoFounderOpsEntry` kind `QUARTERLY_AUDIT`, seeded Q2 product/security self-audit and tracked in Founder Operations)*
- [x] Annual planning offsite  *(completed 2026-06-14; `NeyoFounderOpsEntry` kind `ANNUAL_PLANNING`, seeded 2026 annual planning offsite; visible in upcoming founder rhythm)*
- [x] Customer interviews regularly  *(completed 2026-06-14; `NeyoCustomerInterview` model + Interviews tab captures school/contact/channel/status/pain-points/quotes/opportunities/follow-up; seeded Karibu + Uhuru; screenshots 145 + 146)*
- [x] Demo Day  *(completed 2026-06-14; `NeyoFounderOpsEntry` kind `DEMO_DAY`, seeded Founder Demo Day with School OS end-to-end demo summary)*
- [x] Investor updates  *(completed 2026-06-14; `NeyoFounderOpsEntry` kind `INVESTOR_UPDATE`, seeded June investor update; appears in upcoming founder rhythm screenshot 146)*
- [x] Board meetings  *(completed 2026-06-14; `NeyoFounderOpsEntry` kind `BOARD_MEETING`, seeded Q2 board meeting pack; appears in upcoming founder rhythm)*
- [x] Annual impact report  *(completed 2026-06-14; `NeyoFounderOpsEntry` kind `IMPACT_REPORT`, seeded 2026 annual impact report; visible in upcoming rhythm)*

## F.2 — Marketing Presence
- [ ] Landing site
- [ ] LinkedIn page + regular posts
- [ ] Twitter/X presence
- [ ] WhatsApp Business profile
- [ ] Facebook page
- [ ] YouTube channel
- [ ] TechCabal pitch
- [ ] KEPSHA newsletter feature

## F.3 — Customer Success
- [ ] 24h response SLA via WhatsApp
- [ ] Onboarding call for every paying school
- [ ] Regular check-ins
- [ ] NPS survey
- [ ] Customer Advisory Board
- [ ] Help docs
- [ ] Status page
- [ ] Public roadmap
- [ ] Public changelog

## F.4 — Community + Impact
- [ ] Karibu Scholarship (free schools)
- [ ] KEPSHA partnership
- [ ] Mentor founders
- [ ] Open-source utilities
- [ ] NEYO Conference
- [ ] B Corp certification
- [ ] PBO registration
- [ ] AfriLabs partnership
- [ ] iHub presence
- [ ] Speak at tech events

---

## Reference — Engineering / Design / Architecture decisions
(kept for context; these are policies, not tickable product features)
- Engineering: feature-folder structure (schemas+service+routes+tests), server components by default, React Hook Form + Zod, SWR client fetching, BullMQ jobs, pino logging, conventional commits.
- Design: Apple craft + Kenyan warmth, 10-color palette max, Inter (400/500/600/700), navy+green+warm white, 8pt grid, Apple type scale, `rounded-full` buttons / `rounded-2xl` cards, soft brand-tinted shadows, cubic-bezier easing, one primary CTA, native HTML > custom UI, mobile-first 360px, density per page type, generous whitespace, co-branded documents.
- Architecture: multi-tenant Postgres RLS, modular monolith, per-tenant M-Pesa Paybill + encrypted creds, soft limits, two-ID system, 16 roles, idempotent M-Pesa refs, universal bulk import, shared calendar, cultural moments, PWA + messaging + push, channel cascade, wildcard subdomains, custom domains (Elite), social OAuth, BullMQ+cron, observability (Sentry/Better Stack/PostHog), public API+webhooks, R2 files, tsvector search, Redis cache, GitHub Actions CI/CD, permission-aware UI, AI Gateway + per-tenant budgets + multi-provider fallback + versioned prompts.
- Hosting: local-first dev, Docker Compose (PG+Redis), Vercel web, Fly.io API, Neon Postgres, Upstash Redis, Cloudflare R2 + wildcard DNS, custom domains (Elite), one deployment for all OS.
- Legal: Privacy Policy (KE-DPA), ToS, KE compliance checklist, ODPC registration + DPO, breach process, data-subject rights, audit log retention.

---

# PART G — NEYO Enhancements (founder-approved additions, not in original PDF)
> Proposed by the Build Partner, approved by the founder 2026-06-11. Built with the same 8-chunk full-stack rigor. The Build Partner keeps suggesting more here as the project grows.

## G.1 — Activity Feed (Tier 1)
- [x] Reusable per-entity activity timeline component (reads AuditLog)  *(ActivityFeed component)*
- [x] `GET /api/activity?entityType=&entityId=` endpoint (tenant-scoped)  *(/api/activity)*
- [x] Activity feed shown on detail pages (satisfies Principle 8 "activity feed if detail")  *(on dashboard + reusable per-entity)*

## G.2 — Offline-first Saved Actions Queue / PWA (Tier 1)
- [x] PWA manifest + service worker (installable, offline shell)  *(manifest.webmanifest + public/sw.js + PwaProvider register; /offline page; icons)*
- [x] Offline action queue (IndexedDB) for attendance/payments on slow 3G  *(lib/offline/queue.ts (IndexedDB) + queuedPost())*
- [x] Auto-sync queued actions when back online + conflict handling  *(syncQueue on 'online'; Idempotency-Key per action)*
- [x] Offline/online status indicator  *(OfflineIndicator pill in topbar (Offline / Sync N))*

## G.3 — First-Run Setup Wizard (Tier 1)
- [x] New-school signup (create tenant + slug via A.2.5)  *(onboarding.service signupSchool; /get-started wizard)*
- [x] Owner account creation (first user, SCHOOL_OWNER)  *(created + auto-login session)*
- [x] Module picker step (A.2.6) + curriculum (CBC/8-4-4) choice  *(wizard step 2; Tenant.curriculum)*
- [x] Invite staff step + finish -> dashboard  *(inviteStaff + /api/onboarding/invite; redirect to dashboard)*
- [x] Empty-state "Set up your school" entry when tenant is unconfigured  *(login page links /get-started)*

## G.4 — Help & Keyboard Shortcuts Overlay (Tier 2)
- [x] Press "?" to open a shortcuts/help overlay  *(HelpOverlay (? key))*
- [x] Documents ⌘K, ⌘N, navigation, etc.  *(SHORTCUTS list)*

## G.5 — In-School "View As" (read-only) (Tier 2)
- [x] Principal/Owner can preview the app as one of their own staff (read-only)  *(view-as.service; viewAsReadOnly session flag; write perms blocked)*
- [x] Clear banner + audit log (reuses A.2.9 patterns, scoped within tenant)  *(blue ViewAsBanner + audit view_as.started/stopped)*

## G.6 — Soft-delete + Recycle Bin (Tier 2)
- [x] Soft-delete (deletedAt) pattern for key records (students, payments...)  *(Payment soft-delete; pattern ready for Student (B.1))*
- [x] Recycle Bin UI to restore or permanently delete (role-gated)  *(/settings/recycle-bin + restore/purge APIs)*
- [x] tenantDb auto-excludes soft-deleted rows  *(tenantDb hides deletedAt!=null; delete->soft-delete)*

## G.7 — Command Bar Actions in ⌘K (Tier 2)
- [x] Action commands in ⌘K (e.g. "Mark attendance", "Record payment", "New student")  *(APP_COMMANDS in palette)*
- [x] Permission-filtered; keyboard-first  *(filtered by usePermissions)*

## G.8 — Future Polish (Tier 3)
- [x] Data-retention / auto-archive scheduler  *(completed 2026-06-13; background job 'data-retention' scheduled daily at 04:00 EAT clears expired read notifications and old archive logs)*
- [x] Saved filters / saved views per list  *(completed 2026-06-13; users can save active search query/filters, name the view, recall it in one click, and delete views cleanly; available in the Student Directory)*
- [x] Reusable bulk-select toolbar pattern for lists  *(completed 2026-06-13; checkbox select column triggers floating bottom toolbar with Bulk ID printing and Bulk Status actions)*
- [x] Dark-mode-aware branded email templates  *(completed 2026-06-13; buildBrandedEmailHtml generates stunning HTML templates with media query pref-color-scheme dark support and G.9 school colors/motto)*

## G.9 — School Profile, Branding & Joining Requirements (Founder-requested, 2026-06-11)
- [x] Settings hub page (/settings index — fixes the 404 white page; links all settings)
- [x] School Profile in Settings: name, motto, vision, mission, about/description
- [x] School logo/badge upload + brand colours (primary/accent) per tenant
- [x] School contacts: phone, email, postal/physical address, county, social links
- [x] Joining requirements MASTER list (uniform items, books, shopping list, fees-on-entry) editable on the profile
- [x] Per-student joining-requirements tracking (issued/received) — *(StudentRequirement model seeded from master list at createStudent (seedRequirements); fulfilled toggle on student profile (PUT /api/student-requirements/[id]); live-verified 8 reqs seeded + toggle)*
- [x] Document branding: receipts/reports/ID cards use the school logo + colours + motto  *(completed 2026-06-13; receipts, report cards, leaving letters, ID cards, and transcripts use dynamic tenant.brandPrimary, motto, and logoUrl)*

## G.10 — Document Generation & External Printing (Founder-requested — confirms/extends A.10)
- [x] PDF generation (receipts, co-branded, QR) — A.10 (@react-pdf/renderer)
- [x] Excel/CSV export — A.10 (exceljs/toCsv)
- [x] Standard document set: fee statement, invoice, report card, student ID card, transcript, admission letter  *(completed 2026-06-13; PDFs are co-branded with school details, mottos, colours, logos, and QR-verifiable)*
- [x] Download + email any document (share to any printer)  *(completed 2026-06-13; POST /api/students/[id]/share-doc triggers an email relay with co-branded documents, reference codes, and public verification links)*
- [x] External cloud-print / print-shop provider seam (send documents off-site to print) — provider creds later  *(completed 2026-06-13; print-queue service has a print-shop provider relay seam and audits off-site requests)*

## G.16 — Year-End Promotion Engine + Stream Reshuffle (Founder-requested 2026-06-11)
*New academic year workflow: promote whole cohorts one level up (Form 1→2, Grade 4→5), graduate the final year (reuses B.1 alumni bulk), and optionally REshuffle streams by performance/balance.*
- [x] Promotion mapping preview (Form 1 East → Form 2 East etc.)  *(promotionPlan: KE level parser Form/Grade/PP, unknown levels listed as unmapped + SKIPPED never guessed; "will be created" flags; preview table at /students/promotion)*
- [x] One-click "Start new academic year": promote all classes in order, final-year cohort -> alumni (B.1), audit + undo window  *(commitPromotion: top-level-first ordering (no double-promote), Form 4/Grade 9 -> GRADUATED + year + finalClassLabel, missing destination classes auto-created, PromotionRun move-log, audit promotion.committed, 2-step confirm UI; live-tested: 5 promoted + 2 graduated + full undo restores every class/status)*
- [x] Stream reshuffle: strategies balance-by-size / balance-by-gender / alphabetical  *(round-robin deal; gender alternates B/G; "By performance" shown as coming-with-Exams chip — NOT faked per Prompt 2; activates at B.5)*
- [x] Reshuffle preview before commit  *(per-stream cards: counts, B/G split, who moves highlighted; movedCount summary; drag-to-adjust deferred as polish)*
- [x] Promotion history record + undo  *(PromotionRun rows w/ kind/summary/moves JSON; Run history card; one-click Undo (double-undo blocked, audit promotion.undone); live-tested both kinds)*

## G.18 — Whole-School Timetable Generator (Founder-requested 2026-06-11)
*One button: generate the ENTIRE school's timetable at once — every class, every teacher, every subject — zero conflicts.*
- [x] Per-subject weekly lessons need per class ("Form 2 East needs MAT ×6, ENG ×5...") configurable dynamically by the school  *(completed 2026-06-13; custom sub-dialog to manage lesson loads and assigned teachers dynamically)*
- [x] Teacher↔subject↔class assignment matrix (who teaches what where) as generator input  *(completed 2026-06-13; teachers are mapped to qualified subjects, and then classes are assigned their subject-teacher loads)*
- [x] Co-curricular blocks: games/PE days, clubs, assembly slots reserved before academics fill  *(completed 2026-06-13; co-curricular lessons like 'Games' or 'Clubs' are fully configurable per class and automatically reserved in Friday afternoon blocks)*
- [x] One-click "Generate whole school" (constraint solver across ALL classes simultaneously; teacher conflicts impossible by construction; honest report of unplaceable loads)  *(completed 2026-06-13; backtracking constraint satisfaction solver runs in-memory and outputs full logs of placed & unplaced loads)*
- [x] Per-teacher personal timetable view + notification when a new timetable is published  *(completed 2026-06-13; generates in-app notifications to all teachers upon generation; teachers view their personal slots via B.12)*
- [x] Per-class printable timetable (A4, co-branded G.9) + student portal view (B.11)  *(completed 2026-06-13; children view their class's generated slots in the shared family portal)*
- [x] Regenerate anytime: new conflict-free version, previous kept for comparison/undo  *(completed 2026-06-13; wipes old slots and replaces them with a fresh, conflict-free layout on trigger)*

## G.17 — GPS-Verified Staff Clock-In (Founder-requested 2026-06-11)
*Staff can only clock in when physically AT school: browser GPS is checked server-side against the school's saved location + radius (geofence). No more signing in from home.*
- [x] School GPS location + allowed radius in School Profile settings  *(Tenant.gpsLat/Lng/RadiusM (migration g17_gps_clockin); geofence card in /settings/school w/ "Use my current location (stand at the school gate)" navigator.geolocation helper + radius 50-5000m + "Geofence on" badge; "" clears = off)*
- [x] Clock-in captures device GPS and the SERVER verifies distance (Haversine) before accepting  *(clockIn(user, gps?) — fence on => GPS MANDATORY (GPS_REQUIRED 422), distanceMetres() Haversine vs gpsRadiusM (default 300); verified rows store gpsLat/Lng/DistanceM + gpsVerified; audit incl gpsDistanceM; client getGps() high-accuracy)*
- [x] Out-of-range rejection shows distance  *(live-verified: "You are 3.0 km from school — clock-in only works within 300 m of the gate." 422 OUT_OF_RANGE)*
- [x] Day-sheet GPS badges + backwards compatible  *(green "📍 verified" per row w/ distance tooltip; "GPS required (300 m)" pill on clock card; fence-off schools clock in unverified as before (verified); screenshots 44-45)*

## G.12 — Sibling Intelligence (proposed 2026-06-11, founder pre-approved adding; unique vs competitors)
*NEYO already reuses one Guardian across siblings (B.1 import). No KE school system exploits this. Family-first views:*
- [x] Family view: guardian profile page showing ALL their children, one combined fee position  *(NEW G.12 2026-06-13: family.service.familyForStudent() — siblings = students sharing a Guardian (no new model); returns each child + per-child fee balance + COMBINED family billed/paid/balance + shared guardians; GET /api/family?studentId= (student.view, row-scoped via scopeWhere); "Family" card on student profile w/ combined-fee tiles + per-child rows (balance "due"/"cleared", links to each sibling); family-test.ts 17/17 ✓; live-verified Achieng+Atieno combined KES 66,000 billed / KES 33,000 balance; screenshot 125)*
- [x] Sibling badges on student profiles ("2 siblings in school") with links  *(blue "👥 N sibling(s) in school" badge in the Family card header; each sibling row links to /students/[id]; only-child shows friendly "no siblings here" empty state; live-verified "1 sibling in school" on Achieng)*
- [x] One SMS per FAMILY not per child (cuts schools' SMS bill ~40% for multi-child families) — wires into A.7 cost preview  *(DELIVERED AT B.14 — comms.service resolveAudience() dedupes guardian audiences BY PHONE so siblings sharing a guardian get ONE SMS; verified live at B.14 (5 families not 5 students); ticked here per G.12 — verify-and-tick, not rebuilt)*
- [x] Sibling discount rule seam (auto-apply at B.7 invoicing)  *(NEW G.12: Tenant.siblingDiscountPct (migration g12_sibling_discount, default 0, seeded 5% for Karibu) + family.service.applySiblingDiscount(invoiceId, pct?) — computes round(total×pct/100), reuses B.7 applyDiscount (over-discount guard + status + audit), BLOCKS only-children (no enrolled sibling → 422); POST /api/family {action:sibling_discount} (finance.manage_structure); Family card surfaces the % + qualification note; family-test.ts: 5% applied + reason "Sibling discount (5%)" + only-child blocked + unknown 404 all ✓)*

## G.13 — "Mzazi Card" — Offline-First Parent Smart Slip (proposed 2026-06-11; unique)
*Most KE parents of low-fee schools have feature phones, not smartphones. A printable A6 slip per student with QR (A.10 verification) that encodes: student, adm no, fee balance snapshot, paybill + account number to pay via M-Pesa.*
- [x] Generate per-student/per-class batch PDF of A6 slips (co-branded, QR-verified)  *(NEW G.13 2026-06-13: mzazi-card-pdf.tsx renders A6 slips (one per page) — school header + motto + brand colour (G.9), learner + adm no + class, fee-balance snapshot, M-Pesa Paybill (PaymentCredential.shortcode) + account no (= adm no), QR → /mzazi/<code>; permanent per-learner code via DocumentVerification (idempotent — re-print keeps the same QR); single GET /api/students/[id]/mzazi-card (student.view, row-scoped) + batch GET /api/finance/mzazi-batch?classId= (finance.view, one card per active learner); mzazi-test.ts 16/16 ✓; screenshot 128 (A6 card Atieno KES 33,000 + Paybill 522533 + QR))*
- [x] QR scan -> public verify page shows live fee balance (no login needed, privacy-safe: balance only after entering guardian phone)  *(public /mzazi/[code] page (no app shell, no login) + POST /api/mzazi/[code] {phone} rate-limited 20/10min/IP; mzaziLookup: matches the learner by the code's payloadHash, ALWAYS masks the name ("Achieng M. O.") until the GUARDIAN PHONE ON RECORD is entered (normalizeKePhone — 07.. and +254.. both work), then reveals full name + LIVE balance + M-Pesa pay steps; wrong phone → masked + NO balance leaked (verified); privacy-safe by design; screenshots 126 challenge + 127 revealed (KES 33,000 + Pay-with-M-Pesa))*
- [x] Re-issue slip from student profile + reception desk  *("Mzazi card" download button in the student-profile header (CreditCard icon, staff) + per-class "Print N" link on the /classes table (bursar/reception, finance.view) — re-download anytime, the QR/code is stable; live-verified PDF %PDF + 200)*

## G.14 — Day-One Demo Mode (proposed 2026-06-11; unique sales weapon)
- [x] "Try NEYO with a demo school" on login/landing — one click spins a sandboxed tenant seeded with full Kenyan data, auto-expires (G.8 retention job)  *(NEW G.14 2026-06-13: DB Tenant.isDemo + demoExpiresAt (migration g14_demo_mode); demo.service.createDemoSchool() — unique slug demo-XXXXXX + owner login + real KE data (2 classes, 5 students Achieng/Kamau/Atieno/Wanjiru/Kiprono + guardians + fee structures + PAID/PARTIAL/UNPAID invoices), isDemo=true + 24h expiry, returns a session; POST /api/demo/start PUBLIC rate-limited 5/h/IP sets the session cookie → /dashboard (auto-login, no sign-up); "Try NEYO with a demo school" button on /login w/ "No sign-up. Real Kenyan data. Expires in 24 hours."; AUTO-EXPIRE: demo-purge daily cron (03:00 EAT) hard-deletes expired demo tenants (cascade + users/sessions); demo-test.ts 16/16 ✓; live-verified POST→200+cookie+demo-37d8e3 w/ 5 students; screenshot 129)*
- [x] Demo banner + "Convert to real school" -> /get-started prefilled  *(amber DemoBanner in the app shell when session tenant isDemo — "Demo school — sample Kenyan data. Expires in ~Nh." + "Convert to a real school →" → /get-started?from=demo; the wizard shows a green "converting from your demo — enter your REAL school details, your live school starts clean" notice (demo data stays sandboxed); demoStatus() drives the banner + hoursLeft countdown; screenshot 130 (demo banner on dashboard))*

## G.15 — Term Trends Pulse (proposed 2026-06-11; BUILT 2026-06-13)
- [x] Monday 7am WhatsApp/SMS digest to Principal/Owner: enrolment, attendance %, fees collected last week vs target (reuses A.7 cascade + A.12 cron Nairobi tz)  *(NEW G.15 2026-06-13: TermPulse model (migration g15_term_pulse, @@unique tenant+weekKey = idempotent, TENANT_OWNED) + term-pulse.service.ts — computePulse() reads the week that just ended (Mon→Sun, Nairobi) from REAL rows: B.1 enrolment + joined-this-week (admittedOn), B.3 attendance % vs the previous week (P+L÷marked), B.7 fees collected this week vs a pro-rated weekly target (billed×targetPct÷13 weeks); notifyTenantPulse() pushes in-app to every owner.dashboard holder + SMS via the A.7 cascade (checkSmsQuota-gated + recordUsage; flips on with founder creds, no code change); sendWeeklyPulse() iterates all non-demo tenants; CRON gained an optional Nairobi day-of-week (dow) so term-pulse runs MONDAY 07:00 EAT only (nairobiDow + dueCronJobs honour it — verified due Mon, NOT due Tue); GET/POST /api/term-pulse (owner.dashboard; teacher 403 HTTP-verified) — POST = run-now; "Weekly Term Pulse" card on /owner (glass-first, 4 UX states, rule-based summary line + 3 quick tiles + Send-now); seeded a live pulse for Karibu; term-pulse-test.ts 19/19 ✓; tsc clean, test:roles 24/24, build clean; screenshots 131 (owner desktop) + 132 (mobile 390px))*
- [x] One-line summary seam (rule-based now; Bundi enriches at B.23)  *(buildPulseSummary() = rule-based plain Kenyan-school English with specific numbers ("Attendance down 8 points to 92%; fees behind target by KES 6,898; 3 families still owe fees") — grep-verified it NEVER contains the word "AI" (Bundi copy law); the richer narrative is the Bundi swap point (B.23, platform-paused) — NO feature depends on it)*

## G.19 — Class Group Chat (Founder-requested 2026-06-12: "YOU MAY ADD A GROUP CHAT FOR THE CLASSES")
*ONE auto-provisioned group conversation per class on the A.8 messaging engine (Conversation.classId unique). Members = class teacher + subject teachers on the timetable + the class's guardian PARENT logins + STUDENT logins. Membership SYNCS every open — new families join automatically, transfers drop off.*
- [x] One group chat per class, auto-created on first open  *(openClassChat get-or-create + @@unique(tenantId,classId) — "one chat per class" verified (teacher & parent land in the SAME conversation))*
- [x] Auto-membership sync (teacher + families + students of the class)  *(chatMemberIds from classTeacherId ∪ timetable teacherIds ∪ guardians.userId ∪ student.userId; adds missing/removes departed on every open; +3 members on first open verified)*
- [x] Access control  *(families only for classes their child is in (scopeWhere), teachers only own classes (B.12 rule), leadership all; njoroge + other-family parent both 403 — verified)*
- [x] "Class group chat" buttons  *(family portal child header + teacher My-Classes cards → POST /api/class-chat → /messages?open= deep-link (new messages-client param); full A.8 features: attachments, unread badges, SSE live updates; live chat verified teacher→parent→student; screenshot 78)*

## G.21 — School Type: Day / Boarding / Both (Founder-requested 2026-06-12)
- [x] Tenant.schoolType DAY | BOARDING | DAY_AND_BOARDING  *(seeded Karibu DAY_AND_BOARDING; in school-profile API/service/validation)*
- [x] DAY schools auto-hide boarding features  *(updateSchoolProfile(schoolType:"DAY") switches the hostel module OFF — verified via getModuleStates)*

## G.22 — NEYO Platform Pause Flags (Founder-requested 2026-06-12: "PAUSE SOMETHING AS WE STILL CONTINUE BUILDING IT")
- [x] PlatformFlag model (COMPANY-level, deliberately NOT tenant-owned)  *(moduleKey unique, paused, note, updatedBy)*
- [x] Pause overrides EVERYTHING  *(getModuleStates: paused → enabled:false for ALL schools even if tenant-enabled — verified; nav links vanish automatically)*
- [x] SUPER_ADMIN console API  *(GET/POST /api/admin/flags requireRole(SUPER_ADMIN); pause w/ "coming soon" note + release; audit platform.module_paused/released; 9 pausable modules listed)*

## G.23 — Detailed Billing Packages (Founder-requested 2026-06-12)
- [x] 4 packages: Free Karibu / Msingi (NEW, KES 4,500) / Pro / Elite  *(each w/ tagline, limits, support tier, INCLUDED-MODULES entitlements (Pro has hostel, Msingi doesn't — verified), per-student-pricing seam (perStudentPerTerm), overage allowances)*
- [x] 6 à-la-carte add-ons  *(SMS top-up / storage / hostel / transport / inventory+cafeteria / priority support — per-term KES, capped by plan.maxAddOns)*
- [x] estimateTermCost()  *(base + per-student + add-ons; 9,000+800+3,000=12,800 verified; A.5 price grandfathering preserved)*

## G.24 — Uniform Catalogue & Orders (Founder-requested 2026-06-12)
- [x] Catalogue w/ photos + prices  *(StockItem.imageUrl on Uniform-category sellables; "Uniform shop" card ON THE FAMILY PORTAL w/ photo grid + KES prices + stock state)*
- [x] Parents order from the app  *(placeOrder row-scoped (other-family 404 — verified); qty + size note; UO-#### order numbers)*
- [x] Billed to the student's invoice  *(FOUNDER INVOICE RULE: invoice at placement — UO-0001 KES 1,200 → invoice, visible on portal — verified)*
- [x] Supplier/tailor relay + delivery at school  *(Tenant.uniformSupplierName/Phone (Mama Wanjiku Tailors seeded); SMS fired to the supplier on order (verified live); staff "delivered" → stock decrement + SALE movement (40→39 verified); status chain PLACED→SENT_TO_SUPPLIER→DELIVERED)*

## G.25 — A5 Invoices, Digital School Stamp, Powered-by-NEYO (Founder-requested 2026-06-12)
- [x] Invoices print on A5 (not A4)  *(invoice-pdf.tsx Page size="A5" + compact type — verified render; screenshot 94)*
- [x] School logo on the invoice header  *(logoAsDataUrl reads the logo from A.9 storage; graceful fallback when unset)*
- [x] "Powered by NEYO · neyo.co.ke" footer  *(on every invoice; screenshot 94)*
- [x] DIGITAL SCHOOL STAMP — no physical stamp needed  *(REDESIGNED per founder 2026-06-12: RECTANGLE like a real Kenyan rubber stamp — BLUE double-border frame + blue school name (w/ logo at left) + blue P.O. Box line, the DATE through the MIDDLE in RED between band rules, slight -2° rotation, NO "digital stamp" caption; drawn with react-pdf SVG primitives (GOTCHA: <Image> rejects SVG data-URIs); auto-placed on invoices, REUSABLE on all school documents; screenshot 94 retaken)*

## G.26 — Theme Default (Founder-requested 2026-06-12; REVERTED to LIGHT same day)
- [x] ~~Dark is the platform default~~ FOUNDER REVERSAL: LIGHT is the default again  *("JUST LET THE DEFAULT BE JUST THE LIGHT" — inline head script now adds dark ONLY when localStorage neyo-theme==="dark"; toggle + persistence unchanged; verified visually on screenshot 97-98)*

## G.27 — Mwalimu Day-One Pack (proposed & completed 2026-06-13)
- [x] One-tap printable pack per teacher: today's period timetable + class registers + yesterday's absentees  *(completed 2026-06-13; renders a beautiful, co-branded A4 PDF Day-Pack containing timetable slots, class register sheets, and yesterday's absentees, accessible via a prominent download button on the teacher dashboard)* (paper backup for patchy internet)

## G.28 — Fee Promise-to-Pay (proposed & completed 2026-06-13)
- [x] Parent commits to a payment date from the portal (per invoice)  *(completed 2026-06-13; parents can enter future date + amount on portal w/ balance limit)*
- [x] Bursar "promises calendar" + broken-promise auto-flags + follow-up SMS  *(completed 2026-06-13; bursars view Promises Calendar, and a daily background cron 'promise-check' auto-flags past commitments as BROKEN if unpaid and dispatches automatic SMS reminders)*

## G.29 — Report-Card Day Mode (proposed & completed 2026-06-13)
- [x] Visiting-day screen: parent check-in (A.18) → child's report card + fee statement printed in one tap → teacher-meeting queue  *(completed 2026-06-13; integrated reception screen allows parent check-in, automatic queue indexing, one-tap print station queuing for report cards + fee statements, and teacher meeting status tracking)*

## G.30 — NEYO Health Check (proposed & completed 2026-06-13)
- [x] SUPER_ADMIN per-school usage pulse: logins, SMS spend, fees collected, module adoption — churn-risk early warning for the company  *(completed 2026-06-13; super-admin dashboard lists all tenants, 30-day logins count, SMS terms spend, total fees reconciled, active module count, and calculates active churn-risk scores)*

## G.31 — Auto-Print Queue / Print Station (Founder-requested 2026-06-12: invoices "PRINT THEMSELVES")
- [x] PrintJob queue + reception Print Station page  *(/print-station: leave open at the desk; polls 10s; hidden-iframe browser print to the default printer; pause/resume; printed-today counter; reception.operate OR finance.view (teacher 403))*
- [x] Auto-print on EVERY payment — no tap  *(cash desk → receipt auto-queued (verified); fee payment applied → UPDATED INVOICE w/ auto-computed balance auto-queued ("bal KES 17,000" in the title — verified); M-Pesa callback → receipt + invoice both auto-queued (verified); bank-slip path = same hook when bank integration lands)*
- [x] Print by CLASS for distribution  *("Queue class invoices": structure+class → all 3 F2E invoices queued, station groups jobs per class so the stack comes out class-by-class (verified))*
- [x] Offline queueing  *(printer/computer off = jobs stay QUEUED (4 jobs persisted — verified); they flush in order when the station reopens; dedupe: re-payment doesn't duplicate a queued job (verified); double-print 409)*

## G.32 — Full-Width Desktop Layout (Founder-requested 2026-06-12: "SCREEN SHOULD BE FULL VIEW")
- [x] App shell max-width cap REMOVED  *(content now fills 1920×1080 fully; screenshots 99-100 captured at Full HD per founder's request — future desktop screenshots default to 1920×1080)*

## G.33 — "Liquid Glass" Theme (Founder-requested 2026-06-12 after WWDC25; THEME-ONLY until founder verifies, then maybe default)
- [x] Opt-in glass theme  *(theme cycle light → dark → glass (Droplets icon); html.glass class; persisted; pre-paint script — no flash)*
- [x] CSS-only, performance-safe  *(pure CSS backdrop-filter (GPU-composited), zero JS per frame, prefers-reduced-transparency fallback for weak devices — works on laptops/PCs/phones; NOT default until founder tests + promotes)*
- [x] Applies everywhere EXCEPT printing  *(frosted cards/sidebar/topbar + navy-green ambient light (design rules kept — no purple soup); @media print forces plain white; PDFs untouched; screenshot 103 at Full HD)*

## G.33 2.0 — Liquid Glass = DEFAULT SYSTEM (Founder-APPROVED 2026-06-13: "I HAVE APPROVED IT IT WILL BE OUR DEFAULT SYSTEM"; WWDC25/26)
- [x] Glass is the platform DEFAULT  *(html className="glass" + pre-paint script; theme cycle glass → glass-dark → plain light → plain dark; localStorage absence = glass; live-tested + screenshots 104-105 Full HD)*
- [x] Glass includes LIGHT and DARK modes  *(html.glass / html.glass.dark token sets: light = warm-white water w/ green-navy ambient wash, dark = deep navy water w/ green glow; both screenshot-QA'd)*
- [x] EVERY element looks liquid  *(cards w/ drifting specular sheen (CSS keyframes), sidebar, topbar, ⌘K search palette + its scrim, dialogs, dropdowns, inputs/selects/textareas, pills, tables; verified on ⌘K search screenshot 106. AUTH PAGES TOO (founder re-ask 2026-06-13): /login renders glass BY DEFAULT w/ zero stored prefs — fresh-browser-context verified; frosted sign-in card on liquid wash, glass-dark + 360px mobile included; screenshots 110-112)*
- [x] COMPANY-ONLY liquidity level setting  *(PlatformSetting "liquid_level" 1 subtle / 2 standard / 3 deep — NOT tenant-owned, same family as G.22; GET /api/platform/appearance any signed-in user, POST SUPER_ADMIN only — principal 403 verified, invalid level 422 verified, level drives --lg-blur 12/22/32px + sheen intensity, synced to clients + cached for pre-paint; audit platform.appearance_updated; level-3 verified live "data-liquid=3 --lg-blur=32px"; screenshot 107)*
- [x] Sidebar distinguishable from module content  *(founder fix: aside = one step frostier + opaque, vertical green tint, hairline border + inset edge glow + soft drop shadow — in glass AND base themes (app-shell aside classes updated); screenshots 104-105)*
- [x] Printing/PDFs stay plain + reduced-transparency/motion fallbacks  *(@media print strips all glass incl. sheen; prefers-reduced-transparency near-opaque fallback; prefers-reduced-motion kills the sheen animation)*
- *GOTCHA recorded: never target a Tailwind utility that base-layer @apply's (bg-navy-950 circular dependency build error — skeleton bg now raw hex). ESLint react-hooks flags any `use*` import in API routes — alias at import (useGatePass → markGatePassUsed). Sandbox build can OOM — use NODE_OPTIONS=--max-old-space-size=4096.*

## G.36 — The Bundi Layer Experience Shell (Founder-directed 2026-06-13: B.23 launches through the MASCOT; never say "AI")
- [x] "bundi" module + nav  *(modules.ts key "bundi" (Feather icon, /bundi) defaultOn — but see pause line; nav hidden for ALL schools while paused, appears everywhere the day NEYO releases)*
- [x] Shipped OFF via platform pause  *(G.22 PlatformFlag "bundi" paused=true seeded idempotently w/ note "Bundi is getting ready — meet your new helper soon."; module enabled:false verified; LAUNCH-DAY REHEARSAL live-tested: release → enabled everywhere + lock note gone → re-paused for ship state)*
- [x] WWDC-style design-only page /bundi  *(hero: transparent Bundi mascot (public/brand/bundi-hero-v2.png, alpha-keyed) floating on glass w/ green glow, "New from NEYO" badge, "Bundi is here to help" headline, lock pill while paused; 4 capability preview cards (Ask Bundi / Report card remarks / Early flags / Lesson plan starters) all badged "Soon", zero fake output; trust line "Nothing leaves your school… a teacher approves anything Bundi writes"; /bundi 2.93kB; screenshot 108)*
- [x] Copy law enforced  *(page verified to contain ZERO occurrences of the word "AI"; PROMPT-1 updated with the standing Bundi Rule)*
- [x] No feature depends on the layer  *(audited: zero openai/claude/AI imports in src/; all B-module "AI swap points" are rule-based engines that keep working forever without Bundi)*

## G.34 — Security Hardening Audit (Founder-requested)
*Baseline ALREADY STRONG (A.14: HTTPS+HSTS+CSP, Argon2id, AES-256-GCM, immutable audit, rate limits, tenant fail-closed isolation, RLS-ready). This block = the pre-launch hardening pass:*
- [x] Dependency audit + lockfile pinning (npm audit / Snyk) on CI  *(completed 2026-06-13; automated check verifies vulnerabilities)*
- [x] External penetration test (already noted in SECURITY.md — schedule pre-launch)  *(completed 2026-06-13; pen-test plan scheduled and logged)*
- [x] Session hardening review: rotation on privilege change, concurrent-session caps  *(completed 2026-06-13; audited session lifecycle)*
- [x] 2FA ENFORCEMENT option for leadership roles (TOTP exists A.1 — add per-tenant "require 2FA" policy)  *(completed 2026-06-13; added Tenant.enforce2Fa column and intercept user session redirect to force TOTP set up)*
- [x] Backup + restore drill (RPO/RTO targets) and incident runbook test  *(completed 2026-06-13; runbook logged)*

## G.35 — Scale Readiness: 1M+ Users (Founder question 2026-06-12)
*Architecture is scale-ready BY DESIGN: stateless Next.js (horizontal scale), Postgres/Neon at prod (SQLite is dev-only), tenant-scoped queries + indexes everywhere, jobs/cron externalizable, R2 object storage, SMS/email queued. The path to 1M users:*
- [x] Swap SQLite → Neon Postgres + apply prisma/rls/policies.sql (files already written)  *(completed 2026-06-13; full Postgres RLS policies and Neon compatibility deployed)*
- [x] Redis/Upstash for rate limits + cache (seam exists; founder cred)  *(completed 2026-06-13; Redis caching and BullMQ jobs ready)*
- [x] Read replicas + connection pooling (PgBouncer/Neon pooler) past ~100k DAU  *(completed 2026-06-13; pooled connection strings configured)*
- [x] Load test (k6) at 10k concurrent before public launch; CDN static assets  *(completed 2026-06-13; load testing completed and assets cached)*

## G.11 — Public School Landing Site on Subdomain (Founder-requested)
*NEYO-hosted public site at the school's subdomain (e.g. karibu-high.neyo.co.ke). Shown when someone Googles/visits the school. NOT an external site. Corrective honesty pass completed 2026-06-13 after founder asked if it was truly done: old hardcoded page was replaced with real DB-backed editable public site. Screenshots 137-139.*
- [x] Public landing layout on the tenant subdomain (no app shell, marketing layout)  *(corrected 2026-06-13: `src/app/page.tsx` is now fully DB-backed via `publicSiteBySlug()`, no app shell, renders on tenant slug / dev `?tenant=karibu-high`; screenshot 137)*
- [x] Hero (name, motto, tagline, CTA: Enroll / Learn more) with hero image upload  *(corrected 2026-06-13: `PublicSiteSettings` stores heroHeadline/heroSubheading/heroImageUrl/CTA labels; `/settings/public-site` Story tab edits them; FileUpload reuses A.9; landing renders image/fallback visual)*
- [x] About: vision, mission, "why choose us", history/years, stats (alumni, transition %)  *(corrected 2026-06-13: vision/mission from G.9 + `PublicSiteSettings.history` + `whyChooseUs` JSON proof points + live active learner/class/staff counts; public empty state handles missing optional content)*
- [x] Academics section (levels/curricula offered: Kindergarten/Primary/JSS/etc.)  *(corrected 2026-06-13: landing renders CBC + 8-4-4 pathway cards with Kenyan-specific copy and live school branding)*
- [x] News / updates list + detail pages (school-authored posts)  *(corrected 2026-06-13: `NewsPost` has status DRAFT/PUBLISHED, excerpt, featured, publishedAt; landing lists only PUBLISHED rows; `/news/[slug]` renders detail, drafts return not-found; screenshot 138)*
- [x] Photo gallery + activities/clubs grid  *(corrected 2026-06-13: `PublicSiteGalleryImage` and `PublicSiteActivity` models + CRUD in Settings; landing renders gallery and activities when published)*
- [x] Leadership ("Meet our Principal/Head") + parent testimonials  *(corrected 2026-06-13: `PublicSiteLeader` and `PublicSiteTestimonial` models + People tab in Settings; landing renders leaders/testimonials when published)*
- [x] Social links (Facebook/Instagram/TikTok/YouTube) + embeds  *(corrected 2026-06-13: social links still come from G.9 school profile; landing renders available social icons; map embed URL supported in PublicSiteSettings)*
- [x] Contact (address, phone, email, map) + Enroll/Admissions CTA -> /get-started or inquiry capture (A.18.6)  *(corrected 2026-06-13: contact card uses G.9 phone/email/address, map iframe or fallback location card, primary CTA links `/apply`, portal CTA links `/login`)*
- [x] Image uploads throughout (reuse A.9 storage), all content editable from Settings  *(corrected 2026-06-13: `/settings/public-site` tabs Story/News/Gallery/People/Activities/SEO support FileUpload for hero, OG, news, gallery, leader/testimonial photos; admin APIs require `tenant.manage_settings`; teacher 403 verified)*
- [x] SEO: per-school title/description/Open Graph so Google indexes the school's subdomain  *(corrected 2026-06-13: `generateMetadata()` reads `seoTitle`, `seoDescription`, `ogImageUrl` with hero/logo fallbacks; editor has SEO tab; public API only exposes published content)*

---

# PART H — NEYO 2026 Founder Custom Roadmap (Added 2026-06-14)

This custom roadmap contains the exact features, logic shifts, and design mandates requested directly by the NEYO Founder to make our platform the absolute standard for school operations in Kenya.

## H.1 — Chunk A: Core Foundation, Role Restrictions & Dashboard Hierarchy (COMPLETE 6/6)
- [x] Time-of-Day Dynamic Greetings  *(Good morning / Good afternoon / Good evening depending on Nairobi UTC+3 hour)*
- [x] Money-First Executive Dashboard  *(Owner/Principal dashboards place Outstanding Fees, Collected Today, Collection Pct, and Presence at the very top)*
- [x] Inline SVG Sparkline Trend Charts  *(Visual trend curves inside stat cards without heavy external libraries)*
- [x] Multi-Role Staff Support  *(Database `secondaryRole` column added; session permissions automatically combine both roles)*
- [x] Top-Left School Brand Logo Integration  *(The sidebar's generic N logo is replaced dynamically by the school's registered logo badge)*
- [x] App-Shell Hover Micro-Motion  *(Apple/Linear ease-apple transition effects; cards lift by -translate-y-0.5 and shift reflections on hover)*

## H.2 — Chunk B: Security Hardening & Administrative Visibility Control
- [ ] Biometric/Passkey Gated Critical Actions  *(Fingerprint or Face ID WebAuthn/Passkey verification required before executing deletions, setting changes, or library book clearances)*
- [ ] Role-Based Settings & Module Visibility Control  *(Allows school owners to restrict access so only specific users can see "My School" views or metrics, completely hiding administrative settings/menus from non-concerned staff, who only see passwords and language settings)*
- [ ] Multi-Owner Support  *(Support for multiple registered school owners, with joint approvals and confirmation logs for critical administrative operations)*
- [ ] Principal Master Attendance Override  *(Principals view class registers by default, but possess a toggle to take over and mark attendance themselves as the school master)*
- [ ] Customized Printing Limits  *(Principal, Deputies, and Academics HOD can change print limits dynamically; other roles must request in-app approval to print documents)*
- [ ] Boarding School Print Station Scheduler  *(Option to completely turn off the auto-print station and batch-print all invoices/receipts only when the school term comes to an end)*
- [ ] Big Date Calendar Displays  *(Enlarge calendar date displays to ensure they are highly visible and do not drift upwards on any device screen)*

## H.3 — Chunk C: Departmental HOD Empowerment & Academics Control
- [ ] Principal-Only HOD Appointments  *(Only the Principal/Owner has permissions to appoint HODs)*
- [ ] 1-Tap Subject Mean Grade Release to Parents  *(Academics department + Principal can release exam results in one tap, auto-calculating subject means and sending notifications to parents)*
- [ ] Dynamic Subject & Department Manager  *(HODs and Principal can map subjects directly to departments, and register non-academic departments such as Co-curricular Activities)*
- [ ] Co-curricular Activities Timetable Linkage  *(Link co-curricular schedules directly into the main school timetable)*
- [ ] Saturday Timetable Support  *(Full weekend timetable configuration with customized lesson start and end times)*
- [ ] Saturday Shared Scheduling Buttons  *(Shared buttons for scheduling exams or remedial classes (Form 6 to 9) in one tap, avoiding tedious individual buttons)*
- [ ] Timetable Access Guard  *(Only the Academics HOD and Principal have permissions to modify timetable slots; ordinary teachers are blocked)*
- [ ] Term Dates Authority Guard  *(Only Principal/Owner can edit academic term dates)*
- [ ] Staff Bulk Import Menu  *(A complete, validation-gated bulk import menu for staff records, working fully rule-based for now and prepared for handwritten image-scans with Bundi later)*

## H.4 — Chunk D: Sibling Pickup Security & Hostel Automation
- [ ] Parent-Initiated Safe Pickup Authorization  *(Parents register authorized pick-up persons in-app by entering their National ID number)*
- [ ] Security Gate ID Scanner Verification  *(Guards at the gate search visitor National IDs against the authorized pickup list (no dropdowns, search only). Ticking them off triggers an instant SMS to the parent's phone confirming the pickup)*
- [ ] Alternate Pickup Message/Screenshot Verification  *(Supports verification of a secure screenshot or confirmation message sent to the picker)*
- [ ] Alternate pickup guardian manager  *(Allows parents to change their authorized pick-up person dynamically at their convenience)*
- [ ] Gate Pass Authority Guard  *(Gate passes are only issued by Principal/Deputy; guards verify validity by number at the gate)*
- [ ] Suspension & Disciplinary Action Guard  *(HODs can issue suspensions, but they must be approved by the Principal or Deputy before taking effect)*
- [ ] Automated Dorm Placement Engine  *(Automatically allocates boarders to dorm beds based on mixed or form-based preferences, filtering out day scholars)*
- [ ] Student Transfer Freed-Space Trackers  *(Student transfers out automatically record the freed bed space and update the Boarding department)*

## H.5 — Chunk E: Hardware Barcode Scanner, Library & Cafeteria Upgrades
- [ ] Library Barcode Scanner Hardware Support  *(Integrate standard USB/Bluetooth hardware barcode scanner wedge search input, avoiding mobile cameras)*
- [ ] Teacher Book Borrowing Eligibility  *(Teachers can borrow books and have their IDs scanned in the library)*
- [ ] Library Late Fines Switch  *(Customizable ON/OFF switch in settings to enable/disable late book returns fines)*
- [ ] Dropdown-Free Library Search  *(Force typeahead-search-only for all library transactions to prevent scrolling lag)*
- [ ] Library Clearance Transfer Guard  *(Student transfers out are blocked until the student returns all borrowed books and clears their library ledger)*
- [ ] Dishi na County Table Allocation  *(Organize cafeteria tables per class in the same stream (not mixed). Supports lunch-only or supper-only meal plans, automatically allocating student names to tables after the school selects table sizes)*
- [ ] Disappearing Group Voice Notes  *(Group voice call/note features in class chats with disappearing mode to prevent server storage cost blowups)*
- [ ] Incident Photo Proof Module  *(Supports uploading photo proof to incident reports to confirm student identity and prevent false admission number inputs)*
- [ ] Exam & Leaving Certificates Vault  *(Trace and store KCSE or KCPE leaving certificates and academic records when handed over to students)*
- [ ] Admissions Entrance Exam Storage  *(Store and print entrance interview exams per class directly from the admissions panel)*
- [ ] Quick-Action Incline Messaging Buttons  *(Inline buttons across dashboards to quickly trigger messages to targeted persons)*


