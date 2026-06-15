# 🧠 NEYO — CONTEXT ANCHOR ("Save Game")

## 📌 FOUNDER ROADMAP DIRECTIVE (2026-06-13 — STANDING, non-negotiable order)
**Finish SCHOOL OS first. Build order from here = B → G → F. Do NOT start Part C (Business OS), Part D (Farm OS) or Part E (Creator OS) until the founder explicitly says so.**
1. **B.26 Premium Features** — review/flag (Bundi + hardware gated; build any rule-based pieces; tick what's already satisfied).
2. **Part G** — complete all remaining enhancement lines (G.8 polish, G.10 doc set, G.11 public landing — LAST/on-signal, G.12 sibling intelligence, G.13 Mzazi Card, G.14 demo mode, G.15 term pulse, G.18 whole-school timetable [on-signal], G.27-G.30 [on-signal], G.34 security hardening, G.35 scale — DO-AT-DEPLOY).
3. **Part F** — Internal NEYO Operations (founder ops, marketing presence, customer success, community/impact).
4. ❌ Parts C / D / E are explicitly DEFERRED until the founder reopens them. School OS is completed first.

_Last updated: 2026-06-14 · F.1 Founder Operations COMPLETE 8/8. NEYO now eats its own food at `/founder`. Chunk A (Security, Dual Roles, Brand Logo, Money-First Dashboard with Sparklines, and Hover Motion) is now 100% COMPLETE. NEXT = Biometric/Passkey Gated Critical Actions & Settings Restrictions._



## ✅ F.1 FOUNDER OPERATIONS: COMPLETE 8/8 (built + live-tested 2026-06-14, screenshots 140-146)
- FOUNDER DIRECTIVE: “Founder operations still exist in the same page of neyo.co.ke; we are eating our own food.” Implemented as a NEYO internal company cockpit inside the product at `/founder`, SUPER_ADMIN-only. This is company-level data, deliberately NOT tenant-owned.
- DB (migration `f1_founder_operations`): `NeyoBuildLog` (one official log per `dateKey`), `NeyoMetricSnapshot` (period revenue/MRR/schools/churn-risk/SMS spend), `NeyoFounderOpsEntry` (WEEKLY_METRICS/MONTHLY_ALL_HANDS/QUARTERLY_AUDIT/ANNUAL_PLANNING/CUSTOMER_INTERVIEWS/DEMO_DAY/INVESTOR_UPDATE/BOARD_MEETING/IMPACT_REPORT), `NeyoCustomerInterview` (school/contact/channel/status/pain-points/quotes/opportunities/follow-up).
- Validation/security: `founder-ops.ts`; SUPER_ADMIN-only rule; ISO dates; DONE entries require completedAt; completed interviews require at least one insight/quote/opportunity; metric guards (paying/churn-risk cannot exceed active schools).
- Service/API: `founder-ops.service.ts` uses root `db` (NOT `tenantDb`); dashboard summary + CRUD/upserts. API routes `/api/founder-ops` and `/api/founder-ops/[section]/[id]`, all `requireRole("SUPER_ADMIN")`; teacher 403 verified. `FounderOpsError` mapped in respond.ts.
- UI: `/founder` page + `FounderOpsClient`, sidebar item “NEYO Ops” under Overview (permission `platform.founder_ops`, SUPER_ADMIN only). Tabs: Overview / Build log / Metrics / Cadence / Interviews. Loading + error states included.
- Build-log mirror: `BUILD-LOG.md` added so founder has a human-readable file, while the DB is source for the app page.
- Seed: `prisma/seed.ts` seeds F.1 build log, 2026-W24 metrics, all major founder cadence entries, Karibu scheduled interview + Uhuru completed interview with pain points/quotes/opportunities.
- Verification: `npm run db:seed` ✓, `npm run typecheck` ✓, `npm run build` ✓ (warnings only), browser interaction tested: saved a build log through the visible UI (not DB direct), switched through all tabs, final screenshot 146.
- Screenshots: 140 initial Founder Ops page, 141 overview tested, 142 Build Log tab after save, 143 Metrics tab, 144 Cadence tab, 145 Interviews tab, 146 final populated overview.

## ✅ G.11 PUBLIC SCHOOL LANDING SITE: CORRECTIVE PASS COMPLETE 8/8 (2026-06-13, screenshots 137-139)
- WHY: Founder asked if G.11 was truly done. Audit found the old `/` page existed but was too thin/hardcoded (no real news detail, gallery, leaders, testimonials, activities, public-site editor, proper empty states). We treated this as a corrective pass, not a new feature.
- DB (migration `g11_public_site_content`): `PublicSiteSettings` (hero/subheading/image, history, whyChooseUs JSON, mapEmbedUrl, SEO title/description/OG image, CTA labels), `PublicSiteLeader`, `PublicSiteTestimonial`, `PublicSiteGalleryImage`, `PublicSiteActivity`, upgraded `NewsPost` with excerpt/status/featured/publishedAt. All tenant-owned models added to `TENANT_OWNED_MODELS`.
- Validation: `src/lib/validations/public-site.ts` with safe URLs (A.9 `/api/files/serve`, `/brand/*`, http/https), news slugs, publish-date rule, gallery categories, activity icons, and edit permission `tenant.manage_settings`.
- Service: `src/lib/services/public-site.service.ts` — public reads by tenant slug return ONLY published rows / PUBLISHED news; admin read includes drafts/unpublished; CRUD for settings/leaders/testimonials/gallery/activities/news; duplicate news slug guard; all writes audited `public_site.*`.
- API: public `GET /api/public-site/public?tenant=karibu-high`, `GET /api/public-site/news/[slug]?tenant=...`; admin `GET/PUT/POST /api/public-site` + `DELETE /api/public-site/[section]/[id]`, all management gated on `tenant.manage_settings`; teacher 403 verified. `PublicSiteError` mapped in respond.ts.
- Settings UI: `/settings/public-site` + `PublicSiteEditor` tabs Story/News/Gallery/People/Activities/SEO; FileUpload reuse for images; publishing-readiness counts; Settings hub + sidebar “Public Website” item. Screenshot 139.
- Public UI: `src/app/page.tsx` now fully DB-backed with dynamic metadata/OG, hero, stats, foundations, why-choose-us, academics, activities, news cards, gallery, leadership, testimonials, contact/map/socials. `src/app/news/[slug]/page.tsx` for published news detail; drafts never render. Screenshots 137 landing + 138 news detail.
- UX states: loading/error pages for settings, loading/not-found for news detail, public empty showcase section for schools that have not published optional content.
- Seed: `prisma/seed.ts` seeds Karibu public site with Kenyan story/proof points, 3 activities, 2 leaders, 2 testimonials, 2 gallery items, 2 published news posts. Verification: API payload shows news=2/gallery=2/leaders=2/testimonials=2/activities=3/why=3; `npm run typecheck` clean; `npm run build` clean (warnings only, pre-existing).

## ✅ G.15 TERM TRENDS PULSE: COMPLETE 2/2 (built + live-tested 2026-06-13, screenshots 131-132)
- DB: TermPulse (migration `g15_term_pulse`, @@unique(tenantId, weekKey) = idempotent one-row-per-ISO-week + viewable history; TENANT_OWNED_MODELS += "termPulse"). Fields: weekKey/weekStart/weekEnd, activeStudents, joinedThisWeek, attendancePct, attendancePrevPct, attendanceMarked, collectedWeekKes, weeklyTargetKes, collectionTermPct, summary, sentCount.
- Service `term-pulse.service.ts`: computePulse(tenantId, ref) reads the week that JUST ENDED (Mon→Sun, Nairobi via mondayOf/addDays/isoWeekKey) from REAL rows — B.1 enrolment + joined-this-week (admittedOn vs Nairobi week instants), B.3 attendancePctForRange (P+L÷marked) cur vs prev week, B.7 fees: PAID Payment.amount in the week vs weeklyTargetKes = billedTerm×targetPct÷TERM_WEEKS(13). buildPulseSummary() = RULE-BASED one-liner (grep-verified NO "AI"). computeAndStorePulse() upserts the week row. notifyTenantPulse() → leadershipRecipients() (active users where can(role,"owner.dashboard")) → notify() in_app + sms cascade (checkSmsQuota gate + recordUsage on allowed) → stamps sentCount. sendWeeklyPulse() iterates non-demo tenants (try/catch per tenant). latestPulse()/runPulseNow().
- CRON: CronDef gained optional `dow` (0=Sun..6=Sat Nairobi) + nairobiDow() + dueCronJobs honours it. term-pulse scheduled Mon 07:00 EAT. JOBS["term-pulse"] handler added.
- API: GET /api/term-pulse (latest, owner.dashboard) + POST (run-now). Teacher 403 HTTP-verified; principal payload verified live (2026-W23, 5 students, 92% attendance, KES 6,898 weekly target, sentCount 2).
- UI: components/owner/term-pulse-card.tsx mounted at top of owner-client (after header). Glass-first, 4 UX states (skeleton/empty "first pulse arrives Monday"/error+retry/populated). Rule summary line + 3 tiles (Attendance % w/ WoW arrow, Fees this week vs target, Enrolment + joined) + "Send now" → POST. Badge tone="neutral" weekKey, "sent to N".
- Seed: G.15 block computes+stores a live pulse for Karibu (idempotent). term-pulse-test.ts **19/19 ✓** (SELF-HEALS: deletes pulse notifications + restores SMS usage, re-stores a clean seed pulse): summary up/down/quiet + no-"AI", weekKey/Monday format, active-count match, idempotent (one row), latestPulse, notify all leaders + in-app rows + sentCount, cron due-Mon NOT-Tue.
- tsc clean, test:roles 24/24, build clean (/api/term-pulse + /owner 7.17kB). Screenshots 131 (owner desktop 1920×1080 — card w/ summary + 3 tiles) + 132 (mobile 390px). Series at 132.
- GOTCHA: tenantDb().create still needs `tenantId` in the data literal (TS type requires it even though tenantDb auto-stamps) — pass it explicitly (matches expense.service pattern).

## ✅ KNOWN ISSUE FIXED (solved 2026-06-13): The /dashboard StatCards are now fully wired to real live counts (students.count active, today's paid payments, attendance %, collection rate) using standard, correct queries and Nairobi time zones. This resolves the pre-existing Chunk-0 hardcoded placeholders. No fake data or mocks.

## ✅ G.14 DAY-ONE DEMO MODE: COMPLETE 2/2 (built + live-tested 2026-06-13, screenshots 129-130)
- DB: Tenant.isDemo (Boolean) + demoExpiresAt (DateTime?) — migration `g14_demo_mode`. (GOTCHA: node_modules was wiped mid-chunk → npm install; also two empty migration dirs from failed runs caused P3015 → rmdir the empties, keep the one with migration.sql.)
- Service `demo.service.ts`: createDemoSchool(ctx) — unique slug demo-XXXXXX, owner login (owner@<slug>.demo / Demo2026!), modules on (hostel/transport/library/lms/inventory/cafeteria), real KE seed inside withTenant (2 classes + 5 students+guardians + 2 fee structures + 5 invoices PAID/PARTIAL/UNPAID), isDemo + 24h demoExpiresAt, creates a Session (auto-login) + audit demo.created. demoStatus(tenantId) → {isDemo, expiresAt, hoursLeft} for the banner. purgeExpiredDemos() hard-deletes expired demo tenants (sessions+users first, then tenant cascade). DEMO_TTL_HOURS=24.
- API: POST /api/demo/start PUBLIC, enforceRate 5/h/IP, sets neyo_session cookie (same pattern as onboarding signup) → client redirects to /dashboard.
- Job: registry "demo-purge" + CRON_SCHEDULES daily 03:00 EAT.
- UI: /login "Try NEYO with a demo school" button (Sparkles, startDemo handler → POST → /dashboard) + subtext. App-shell amber DemoBanner (components/shell/demo-banner.tsx) when session tenant isDemo — hoursLeft + "Convert to a real school →" → /get-started?from=demo. get-started wizard takes fromDemo prop (from searchParams) → green conversion notice ("enter your REAL details, live school starts clean").
- demo-test.ts **16/16 ✓** (SELF-HEALS, deletes demo tenants it makes): slug format, isDemo flag, ~24h expiry, 5 students + 5 invoices + owner + Achieng, auto-login session, demoStatus, real-school-not-demo, valid demo NOT purged, expired demo purged + no orphans (users/students), real school survives purge.
- tsc clean, test:roles 24/24, build clean (/api/demo/start). Live-verified: POST→200 + cookie + demo-XXXXXX w/ 5 students; in-browser button → demo dashboard w/ amber banner. Screenshots 129 (login CTA) + 130 (demo banner on dashboard). Series at 130.

## ✅ G.13 MZAZI CARD: COMPLETE 3/3 (built + live-tested 2026-06-13, screenshots 126-128)
- NO new DB table — reuses A.10 DocumentVerification (permanent per-learner QR code, docType "mzazi_card", payloadHash = sha256("mzazi:tenant:student") so the code is idempotent and re-prints keep working) + B.7 invoice ledger for balances. Added G.13 seed: Karibu PaymentCredential.shortcode "522533" (non-secret Paybill; Daraja secrets stay unset).
- Service `mzazi.service.ts` (MzaziError → 404/422): cardData() (school brand + learner + balance + paybill + account=admNo + code), buildMzaziCardPdf (row-scoped), buildClassMzaziBatchPdf (all ACTIVE in a class, empty→422), **mzaziLookup(code, phone)** = PUBLIC privacy-gated check: finds learner by payloadHash, ALWAYS returns masked name ("Achieng M. O.") until normalizeKePhone(phone) matches a guardian on record, then reveals full name + LIVE balance + paybill + account. maskName() helper.
- Doc `mzazi-card-pdf.tsx`: A6 page per card — header (school+motto+brand colour G.9), MZAZI FEE CARD, learner+adm+class, balance box (red if owing / green "Cleared"), Paybill + Account no, QR → /mzazi/<code>, instruction text + Ref, "Powered by NEYO". Plain (never glass) per print rule.
- API: GET /api/students/[id]/mzazi-card (student.view, row-scoped) · GET /api/finance/mzazi-batch?classId= (finance.view) · POST /api/mzazi/[code] {phone} PUBLIC, rate-limited 20/10min/IP (enforceRate). MzaziError mapped in respond.ts.
- UI: public /mzazi/[code] page (no app shell, mobile-first 390px) + mzazi-lookup-client.tsx (phone challenge → revealed balance + step-by-step M-Pesa pay; idle/checking/revealed/wrong-phone states; "your number is only used to confirm you're the parent"). "Mzazi card" download button on student profile header (CreditCard, staff/canEdit). Per-class "Print N" link on /classes table.
- mzazi-test.ts **16/16 ✓**: single PDF %PDF, idempotent code (1 per learner), wrong-phone masked + no balance leak, right-phone full name + balance matches ledger + paybill 522533 + account=admNo, phone normalisation (07../+254..), unknown code, class batch PDF, empty class blocked.
- tsc clean, test:roles 24/24, build clean (/mzazi/[code] + 3 APIs). Live-verified: Atieno KES 33,000 revealed w/ Paybill+account; wrong phone masked. Screenshots 126 (challenge) + 127 (revealed KES 33,000 + Pay-with-M-Pesa) + 128 (A6 printed card via pdftoppm). Series at 128.
- GOTCHA: `npm run build` typechecks scripts/ too — a discriminated-union return (mzaziLookup) needs `if (res.found === true && res.ok === true)` narrowing in the test, not inline `res.ok &&` (build failed until narrowed).

## ✅ G.12 SIBLING INTELLIGENCE: COMPLETE 4/4 (built + live-tested 2026-06-13, screenshot 125)
- NO new model — siblings = students sharing a Guardian (B.1 already reuses one Guardian per family). DB: only Tenant.siblingDiscountPct added (migration `g12_sibling_discount`, default 0, seeded 5% for Karibu).
- Service `family.service.ts` (FamilyError → 404/422): familyForStudent(studentId) — siblings via shared guardianIds → ACTIVE children + per-child invoice balance + COMBINED billed/paid/balance + shared guardians + tenant discount %; row-scoped (scopeWhere). siblingCount() (badge). applySiblingDiscount(invoiceId, pct?) = round(total×pct/100) → reuses B.7 applyDiscount (over-discount guard + status + audit); BLOCKS only-children (no enrolled sibling 422) + unknown invoice 404; pct defaults to Tenant.siblingDiscountPct.
- API /api/family: GET ?studentId= (student.view) + POST {action:sibling_discount, invoiceId, pct?} (finance.manage_structure). FamilyError mapped in respond.ts.
- UI: "Family" card on the student profile (student-profile-client FamilyCard) — blue "👥 N sibling(s) in school" badge, combined-fee tiles (billed/paid/balance), per-child rows (current child highlighted green "THIS LEARNER · cleared", siblings link to /students/[id] w/ "KES X due"/"cleared"), sibling-discount note (5% + "family qualifies with N children"). Only-child = friendly "no siblings here" empty state. 4 UX states (skeleton/empty/error+retry/populated).
- "One SMS per family" line = VERIFY-AND-TICK from B.14 (comms resolveAudience dedupes guardians by phone — not rebuilt).
- Seed: Atieno linked to Achieng's guardian (Otieno Brian) as a 2nd StudentGuardian → they're siblings; Karibu siblingDiscountPct=5. Idempotent (existence-guarded).
- family-test.ts **17/17 ✓** (SELF-HEALS the test discount): sibling counts, family view both directions, combined balance = sum, only-child view, 5% discount applied + reason, only-child blocked, unknown 404.
- tsc clean, test:roles 24/24, build clean (/api/family). Screenshot 125 (Achieng profile: Family card, 1 sibling Atieno, combined KES 66k billed/33k balance, 5% discount note) QA'd. Series at 125.

## ✅ B.26 PREMIUM FEATURES: REVIEWED 2026-06-13 (verify-and-flag, no faking)
- All 13 lines are Bundi-gated (AI), hardware-gated, or native-platform → none [x]. Marked 12×[~] (real foundation/seam exists; only blocker = founder decision: creds/hardware/native toolchain) + 1×[ ] Face Recognition (camera hardware + vision model).
- Evidence per line: AI Assistant→Bundi shell G.36 paused (engine B.23) · WhatsApp Bot→A.7 whatsapp seam (WHATSAPP_TOKEN) · Parent/Teacher/Student native app→PWA installable+offline (G.2) is the app today, native packaging future · Face Recognition→hardware+vision deferred · GPS Bus Tracking→Haversine+geofence (G.17)+UI seam, needs trackers · AI Exam/Report/Timetable/Homework/Lesson/Risk→ALL have rule-based engines LIVE today (B.5 positions/means, B.5 buildComment remarks, B.4 autoFill, B.12 homework, B.4 lesson plans, B.3 chronic+anomaly / B.20 bands / B.7 arrears / B.21 welfare) — Bundi (B.23) only ADDS convenience on top, never depended on.
- No code written (review only). tsc/test:roles/build untouched-green from B.25.

## ⏭️ NEXT: PART G — finish remaining enhancement lines (founder order B→G→F)
Remaining G lines (review each; some are on-signal/at-deploy): **G.8** Tier-3 polish (data-retention scheduler, saved views/filters, bulk-select toolbar, branded email templates) · **G.10** standard doc set (ID card, transcript — invoice/report-card/admission/transfer letters DONE) + download/email + external print seam · **G.11** public subdomain landing site — BUILD LAST on founder signal · **G.12** Sibling Intelligence (family view, sibling badges, sibling discount seam — one-SMS-per-family already done at B.14) · **G.13** Mzazi Card (A6 QR fee slip) · **G.14** Day-One Demo Mode · **G.15** Term Trends Pulse (Mon digest) · **G.18** Whole-school timetable generator — on signal · **G.27-G.30** (Mwalimu pack / Promise-to-Pay / Report-Card Day / Health Check) — on signal · **G.34** Security hardening — pre-launch · **G.35** Scale to 1M — at deploy. Buildable-now picks: G.12, G.13, G.14, G.15, G.8 items, G.10 ID card/transcript.

## 🎉 B.25 ADDITIONAL MODULES — FULLY COMPLETE (2026-06-13). All sub-blocks done: Uniform Management 4/4 · School Assets 5/5 · Supplier Management 4/4 · Procurement 5/5 · Expenses Tracking 5/5 · Calendar & Events 8/8.

## ✅ B.25 CALENDAR & EVENTS: COMPLETE 8/8 (2026-06-13, screenshots 123-124)
- VERIFY-FIRST: 6 of 8 lines were BUILT AT A.17 — re-verified live + ticked with evidence, NOT rebuilt: Calendar UI (month/week/day), KE public holidays (KE_MOMENTS layer), Cultural moments live, Religious calendars opt-in (Tenant.showReligiousHolidays), Event creation w/ audience targeting (audienceRole + A.17.5 invites), iCal export (buildIcs RFC-5545).
- WhatsApp reminders = [~] DEFERRED: A.7 whatsapp.ts seam + cascade slot exist; flips on with WHATSAPP_TOKEN (founder creds), no code change. In-app calendar invites already work (A.17.5).
- **NEW — Recurring events (RRULE subset):**
  - DB (migration `b25_calendar_recurrence`): CalendarEvent += recurrence (null|WEEKLY|MONTHLY) + recurUntil (YYYY-MM-DD). Nullable → existing events unaffected.
  - Validation: eventFields += recurrence (enum) + recurUntil (isoDate) + refinements (until ≥ date; recurUntil requires a recurrence).
  - Service (calendar.service.ts): **pure expandRecurrence(firstDate, recurrence, recurUntil, from, to)** — WEEKLY = same weekday every 7d; MONTHLY = same day-of-month, months WITHOUT that day are SKIPPED not shifted (31st skips Feb/Apr/Jun/Sep/Nov — verified); bounded by recurUntil + the view range + HARD_CAP=400 safety. getOccurrences now pulls non-recurring overlapping rows AND recurring rows whose window reaches the range, then expands each series into per-date occurrences (id "<seriesId>:<date>" when >1, recurring flag set, shared seriesId; multi-day span preserved via daysBetween). createEvent/updateEvent persist the two fields. buildIcs naturally exports one VEVENT per expanded occurrence.
  - API: existing /api/calendar/events POST already passes the full validated input through — recurrence flows automatically (no route change).
  - UI (calendar-view.tsx): event dialog "Repeats" select (does-not-repeat / every week / every month) + conditional "Repeat until" date; green "🔁 weekly/monthly" badge on agenda occurrences; **delete is series-aware** — remove() strips the ":date" suffix so deleting any occurrence removes the whole stored series.
  - Seed: weekly Monday "Staff Briefing" 07:30 (TEACHER audience, until Dec 15) via nextMondayIso() helper + monthly 5th "Fees due reminder" (PARENT, until Dec 5). Idempotent (calendar block deleteMany+recreate each seed, as A.17 already did).
  - calendar-recurrence-test.ts **14/14 ✓** (SELF-HEALS): WEEKLY/MONTHLY expansion, August 5-Mondays bounding, 31st-skips-short-months, recurUntil cap, seed briefing expands 4× in July w/ shared seriesId, monthly fees once/month, new event round-trips + expands, iCal 4 VEVENTs, series-delete removes all.
- tsc clean, test:roles 24/24, build clean. Live API verified: 4 July Staff-Briefing occurrences w/ recurring:WEEKLY. Screenshots 123 (month — briefing on every Monday + fees on the 5th) + 124 (week — 🔁 weekly badge on the agenda) QA'd. Series at 124.
- GOTCHA reconfirmed: after build, kill next + `rm -rf .next` + fresh dev + WARM the route before screenshotting (stale _next/static → no hydration otherwise).

## ✅ B.25 EXPENSES TRACKING: COMPLETE 5/5 (built + live-tested 2026-06-13, screenshots 121-122)
- DB (migration `b25_expenses`): **ExpenseCategory** (@@unique tenant+name, archived) + **CostCenter** (@@unique tenant+name, archived) + **Expense** (categoryId+frozen categoryName, costCenterId?+frozen name, payee, amountKes, spentOn YYYY-MM-DD, note, receiptFileUrl/Name via A.9, status PENDING_APPROVAL|APPROVED|REJECTED, approval cols, rejectedReason, createdBy denorm). Tenant.expenseApprovalThresholdKes Int @default(20000). All 3 in TENANT_OWNED_MODELS.
- Service `expense.service.ts` (ExpenseError → 404/422/403/409): addCategory/addCostCenter (dup 409) + seedPresets (idempotent KE starters: 10 categories + 7 cost centers) + archiveCategory/archiveCostCenter (toggle); createExpense (THRESHOLD RULE: amount > threshold ⇒ PENDING_APPROVAL else auto-APPROVED "(under threshold)"; category-exists 404, archived 422, zero-amount 422; freezes category/cost-center names); approveExpense/rejectExpense (LEADERSHIP only; creator-cannot-self-approve FORBIDDEN; reject carries reason; can't decide a non-pending); expensesBoard (threshold + this-month approved/pending totals + awaiting count + active dimensions + last-50 expenses); expenseReports(month) (APPROVED grouped byCategory + byCostCenter + total, pending/rejected excluded); **approvedExpensesSinceKes(tenantId, sinceDate)** — used by B.24. All actions audited (expense.category_created/cost_center_created/presets_seeded/*_archived/created/approved/rejected).
- API GET /api/expenses (board, inventory.view) + GET ?reports=1&month=YYYY-MM + POST {action: expense|category|cost_center|seed_presets|archive_category|archive_cost_center|approve|reject} — **approve/reject gated on tenant.manage_settings (leadership), everything else inventory.manage (bursar)**. Teacher 403 on GET + POST expense both HTTP-verified.
- UI: 6th "Expenses" tab in /inventory (Receipt icon) — `ExpensesTab` in inventory-client.tsx: 3 money tiles (approved this month / awaiting approval amber / threshold) + sub-view switcher (Spend / Reports / Categories) + "Record expense" CTA. Spend = expense rows w/ status badges + Approve/Reject (canApprove only) + receipt download link. Reports = By-category + By-cost-center CSS bars + "feeds the Owner dashboard" note. Categories = add/archive category + cost-center cards. ExpenseDialog (category/cost-center/payee/amount/date/note + A.9 FileUpload receipt + "above threshold needs approval" warning) + RejectDialog. EmptyState seeds the KE presets when no categories yet. All 4 UX states (LoadError reused).
- **B.24 WIRED HONEST**: owner-dashboard profitability now = collected − payroll×3 − approvedExpensesSinceKes(last 3 months); note mentions the expense figure; the old payroll-only proxy replaced. Live-verified surplus -837k → -887k when 50k approved.
- Seed (idempotent, existence-guarded): 10 categories + 7 cost centers + 3 expenses (KPLC 12,500 approved · Jamii Cleaning 6,800 approved · Mwangi Roofing 38,000 PENDING over-threshold demo) dated in the current Nairobi month so reports/owner show data.
- expense-test.ts **20/20 ✓** (SELF-HEALS, removes TEST rows): threshold default 20k, seed presents, idempotent presets, dup category 409, under→auto-approved, over→pending, creator-self-approve blocked, different-leader approves, reject+reason, can't-approve-rejected, zero-amount blocked, report by-category 123k, rejected excluded, approvedExpensesSinceKes, archive hides, audits ≥5.
- tsc clean, test:roles 24/24, build clean. Screenshots 121 (Spend: tiles + Mwangi pending w/ Approve/Reject + 2 approved) + 122 (Reports: by-category + by-cost-center bars) QA'd. Series at 122.
- GOTCHA re-confirmed: after `npm run build`, dev served stale `_next/static` (404 MIME errors → page didn't hydrate, Playwright couldn't find tabs). FIX = kill next + `rm -rf .next` + fresh `npm run dev` + WARM the route (curl /inventory) before screenshotting so chunks compile.

## ⏭️ NEXT: B.25 — Calendar & Events (strict list order)
Most lines were BUILT at A.17 (Calendar UI month/week/day, KE public holidays, cultural moments live, religious calendars opt-in, audience-targeted events, iCal export) — REVIEW each A.17 line and verify+tick under B.25 with evidence (don't rebuild). Remaining NEW: WhatsApp reminders (creds-gated → flag [~], reuse A.7 whatsapp seam), recurring events (RRULE — buildable now: add rrule field on CalendarEvent + expand occurrences in getOccurrences). Then B.26 Premium (mostly Bundi/hardware-gated review) → Part C.

## 🔁 CHAT-TRANSFER RESUME #3 (2026-06-13, this chat — Arena workspace)
- Recovered via founder GitHub repo `elvisybadbunny-bit/workspace-019ebe72-2dde-77f6-b386-5f42116a3601` (repo had neyo/ + docs/ FULL + 124 screenshots; .env correctly NOT in git → recreated: sqlite DATABASE_URL, NEW random NEYO_MASTER_KEK, APP_BASE_URL, ROOT_DOMAIN). Restored + verified: npm install ✓, prisma generate ✓, migrate deploy ✓ (60 migrations), db:seed ✓, typecheck ✓, test:roles 24/24 ✓, build ✓ (OOM-guarded), live principal login + /api/students ✓. Playwright chromium + apt libs reinstalled. **REMIND FOUNDER: make repo private.**
- DISCOVERY (same pattern as the old B.1 resume): the previous chat had built **ALL of B.25 Procurement** AFTER the last anchor was written — full DB + service + API + the `ProcurementTab` UI inside inventory-client.tsx (wired as the 5th /inventory tab) + seed + procurement-test.ts. It was just never ticked/anchored before the chat ended. This turn = VERIFY-AND-TICK (no rebuild).

## ✅ B.25 PROCUREMENT: COMPLETE 5/5 (verify-and-tick 2026-06-13, screenshot 120)
- DB (migration `b25_procurement`): **PurchaseRequest** (title/details/neededBy/status OPEN|ORDERED|CANCELLED, requestedBy denorm) + **PurchaseQuote** (per request, supplierName frozen, amountKes, note) + **PurchaseOrder** (poNo KH-PO-#### via A.4, links request+quote+supplier, status PENDING_APPROVAL|APPROVED|SENT|DELIVERED|MATCHED|CANCELLED, approval/delivery/3-way-match columns). Tenant.poApprovalThresholdKes Int @default(50000). All in TENANT_OWNED_MODELS.
- Service `procurement.service.ts` (ProcurementError → 404/422/403): createRequest → addQuote (supplier-exists 404, closed-request 422) → createOrderFromQuote (THRESHOLD RULE: total > threshold ⇒ PENDING_APPROVAL else auto-APPROVED "(under threshold)"; request → ORDERED; poNo gen) → approveOrder (LEADERSHIP only; creator-cannot-self-approve FORBIDDEN) → markSent → recordDelivery (goods-received note + deliveredValueKes) → **threeWayMatch** (PO total vs goods received vs supplier invoice; all-equal = matchOk, any diff flagged with a human note; double-match blocked) → cancelOrder (reopens the request). procurementBoard returns thresholdKes + open/ordered requests w/ quotes cheapest-first (cheapestQuoteId) + last-50 orders. All actions audited (procurement.request_created/quote_added/po_created/po_approved/po_sent/po_delivered/po_matched/po_cancelled).
- API GET /api/procurement (board, inventory.view) + POST {action: request|quote|order|approve|send|deliver|match|cancel} — **approve gated separately on tenant.manage_settings (leadership), everything else inventory.manage (bursar)**. GET teacher 403 + POST approve teacher 403 both HTTP-verified.
- UI: 5th "Procurement" tab in /inventory (ClipboardCheck icon) — `ProcurementTab` in inventory-client.tsx: "Orders above KES X need leadership approval" notice, OPEN requests w/ quote comparison (green "BEST PRICE" highlight on cheapest + per-quote Order button), Purchase-orders pipeline w/ status badges (awaiting approval/approved/sent/delivered/matched ✓) + stage-aware buttons (Approve [canApprove only] / Send / Record delivery / 3-way match) + match note green/red; 4 dialogs (ReqDialog/QuoteDialog/DeliverDialog/MatchDialog). EmptyState when nothing in procurement. All 4 UX states.
- Seed (idempotent): "Term 3 dry foods restock" by Achieng Mary w/ 2 quotes (Naivas KES 86,500 cheapest "30-day credit" vs Kiambu General Traders KES 92,000) + 1 MATCHED PO KH-PO-000001 "Cleaning supplies — June" (KES 18,500 under threshold → auto-approved, clean 3-way match).
- procurement-test.ts **16/16 ✓** (SELF-HEALS, removes test rows): threshold default 50k, seed request 2 quotes cheapest-first, seed matched PO clean, under-threshold→auto-APPROVED, poNo gen, clean 3-way match→matchOk, over-threshold→PENDING_APPROVAL, cannot-send-unapproved, creator-cannot-self-approve, principal approves, mismatch flagged + note explains diffs, double-match blocked, cancel reopens, quote-on-ORDERED blocked, audits written.
- tsc clean, test:roles 24/24, build clean. Screenshot 120 QA'd (glass-default, Procurement tab, quote comparison w/ BEST PRICE, KH-PO-000001 matched ✓). Series at 120.

## ⏭️ NEXT: B.25 — Expenses Tracking (strict list order)
Lines: Expense categories / Cost centers / Approval workflows / Receipt photo upload + OCR (OCR = Bundi-gated, flag the OCR sub-line; manual entry works fully without it) / Reports. Design: ExpenseCategory + CostCenter (tenant-owned) → Expense (category/costCenter/amountKes/date/payee/receiptFileUrl via A.9/status PENDING|APPROVED|REJECTED) → approval threshold like Procurement (reuse poApprovalThreshold pattern or a new expenseApprovalThreshold) → reports (by category/cost-center/month) that FEED the honest B.24 profitability line (currently payroll×3 proxy; real expenses replace the proxy). Then Calendar & Events review → B.26 review → Part C.

## ✅ B.25 SUPPLIER MANAGEMENT: COMPLETE 4/4 (built + live-tested 2026-06-13, screenshot 119)
- DB (migration `b25_suppliers`): **Supplier** (@@unique tenant+name; category/phone/email/contact/kraPin/rating 0-5/notes/archived) + **SupplierContract** (title/startsOn/endsOn/valueKes/note). Both in TENANT_OWNED_MODELS. SUPPLIER_CATEGORIES = Food/Uniform/Cleaning/Stationery/Transport/Services/Other.
- Service `supplier.service.ts`: createSupplier (dup 409, normalizeKePhone 422 on bad), rateSupplier (1-5 only), archiveSupplier (hidden from directory), addContract (end≤start 422, negative 422), supplierDirectory (contracts + expired/expiringSoon ≤30d flags + daysLeft via B.17 daysUntil pattern + per-supplier hasExpiring/hasExpired/activeContracts). SupplierError mapped 404/409/422 in respond.ts. All actions audited (supplier.created/rated/contract_added/archived).
- API GET/POST /api/suppliers (GET inventory.view, POST inventory.manage — teacher 403 HTTP-verified). Actions: add/rate/archive/contract.
- UI: 4th "Suppliers" tab in /inventory (Truck icon) — supplier cards w/ ONE-TAP star ratings, contract list w/ green active / amber "Nd left" / red expired badges, per-supplier "Add contract" link, Add-supplier + Add-contract dialogs (contract dialog explains the 30-day warning).
- Seed (idempotent): Mama Wanjiku Tailors (★5, Uniform — the G.24 relay tailor now a real row) + Naivas Wholesale Kiambu (★4, Food, KRA PIN) + 2 contracts: dry-foods ending in ~20d (AMBER demo) + uniform framework to Dec (green).
- supplier-test.ts 14/14 ✓ (SELF-HEALS): seed flags, daysLeft 20, phone normalization, dup/bad-phone/rating-9/backwards-contract all rejected, expired flag, archive hides, audits. HTTP: bursar list ✓ teacher 403 ✓.
- tsc clean, build clean (/api/suppliers). Screenshot 119 QA'd (stars + renew-soon 20d left + active badges). Series at 119.

## ✅ B.25 SCHOOL ASSETS: COMPLETE 5/5 (built + live-tested 2026-06-13, screenshots 117-118)
- REVIEW-FIRST: tagging/custodian/acquiredOn existed at B.18 — ticked w/ evidence; B.25 added ONLY depreciation + maintenance.
- DB (migration `b25_asset_depreciation_maintenance`): Asset += depreciationPctPerYear Int @default(0) + nextMaintenanceOn String? + maintenance relation; NEW **AssetMaintenance** (date/kind SERVICE|REPAIR|INSPECTION|OTHER/costKes/note/byName — mirrors B.17 VehicleMaintenance). In TENANT_OWNED_MODELS ("assetMaintenance").
- Service (inventory.service.ts +): **bookValueKes()** pure straight-line fn (acquiredOn + %/yr, floors 0, no-dep/no-date = full value; unit-verified incl. 1-yr ≈75k and 10-yr floor), updateAsset (dep 0-100 guard 422, audited), logAssetMaintenance (negative cost 422, optional nextMaintenanceOn update in one call, audited), **assetRegister()** = assets + bookValueKes + maintenanceDue (next ≤ today, EAT) + maintenanceSoon (≤30d) + total spent + last-10 history. GET /api/inventory now returns assetRegister (assets carry the computed fields).
- API /api/inventory POST += actions updateAsset / assetMaintenance (inventory.manage; teacher 403 HTTP-verified).
- UI: Assets tab rows now show BOOK VALUE + "bought KES X · −N%/yr" + red "service due"/amber "service soon" badges; click row → **AssetDrawer** (right-side, z-50): value strip (book value + maintenance spent), Acquisition & depreciation editor, Log service/repair form (kind/date/cost/note), Service history list.
- Seed (idempotent + BACKFILLS old DBs via updateMany-where-dep=0): laptop 25%/yr + next service 2026-06-01 (OVERDUE demo) + 1 log (3,500 "OS re-install + new battery"); benches 10%/yr.
- asset-test.ts 15/15 ✓ (SELF-HEALS, restores seed): pure-fn spot checks, register book values, OVERDUE flag, dep>100 422, custodian update + audit, log → history 2 + spent 5,500 + due flag CLEARED by next date, negative 422. HTTP: bursar assets w/ (78,000→50,551, due=True) ✓, teacher updateAsset 403 ✓.
- tsc clean, build clean. Screenshots 117 (register w/ badges) + 118 (drawer: book value 50,551 / spent 3,500 / editor / log form / history) QA'd. Series at 118.

## ✅ CARD BALANCE FIX (founder 2026-06-13: "text not well balanced in the cards")
- ROOT CAUSE: shared CardContent had static `p-5 pt-0 sm:p-6 sm:pt-0` — standalone CardContent (no CardHeader) rendered with ZERO top padding on desktop (twMerge keeps sm:pt-0), so text hugged the card top while bottom/sides had full padding.
- FIX in ONE place (`src/components/ui/card.tsx`): CardContent now `p-5 sm:p-6 [&:not(:first-child)]:pt-0` — standalone = full equal padding all sides; after a CardHeader = top padding stripped (header already supplies it). Fixes ALL ~51 card usages at once; no per-page edits.
- BALANCE RULE recorded: start-of-card → text === text → edges/dividers, always. Screenshots 104 + 113 retaken + QA'd (owner tiles + dashboard cards now even).

## ✅ B.25 UNIFORM MANAGEMENT: COMPLETE 4/4 (built + live-tested 2026-06-13, screenshots 115-116)
- REVIEW-FIRST (per anchor warning): items + sales were ALREADY BUILT (B.18 StockItem "Uniform" + G.24 placeOrder/invoice/supplier-SMS/deliver) — ticked with evidence, NOT rebuilt. B.25 added ONLY the missing per-size layer.
- DB (migration `b25_uniform_sizes`): **UniformSize** (tenantId+itemId+size @@unique, qty Int) + StockItem.sizes relation + Tenant.uniformSizes. In TENANT_OWNED_MODELS ("uniformSize").
- Service (uniform.service.ts +): setSizeStock (upsert; uniform-category-only 422; negative 422; **master StockItem.qty auto-syncs to SUM of size rows — one stock truth**), sizeBoard (items + size rows for staff board AND family dialog), UNIFORM_SIZE_PRESETS. markDelivered now ALSO decrements the named size row.
- API /api/uniforms: GET += sizes; POST += action "sizeStock" (staff/inventory.manage only — parent 403 HTTP-verified).
- UI: /inventory NEW "Uniform sizes" tab (Shirt icon) — per-item size pills (red 0 / amber ≤3 / normal) + click-to-edit qty dialog + dashed "+ XS/+ Size 30" preset chips. Family portal OrderDialog: live size pills when sizes exist (sold-out disabled strikethrough, "(N left)" ≤3 hint, size required), free-text fallback when school keeps no sizes.
- Seed: sweater S8/M14/L12/XL6 (sum 40 = master qty), idempotent.
- uniform-sizes-test.ts 10/10 ✓ (SELF-HEALS + restores seed + deletes test order/invoice/movement): board, sum-sync 46, negative/non-uniform 422s, parent order size M ×2 → invoice + supplier SMS w/ size fired live → deliver → size 20→18 AND master 46→44, sold-out row. HTTP: bursar sizes ✓, parent write 403 ✓.
- tsc clean (NODE_OPTIONS=4096 needed when dev server runs concurrently), build clean (/inventory 9.42kB). Screenshots 115 (sizes board) + 116 (mobile dialog w/ L/M/S/XL pills) QA'd. GOTCHA: Playwright `page.locator("button",{hasText:/^X$/})` fails on tab buttons w/ icons — use getByText(...,{exact:false}).

## ⏭️ NEXT: B.25 — Procurement (strict list order)
Lines: Purchase requests / Quotations comparison / PO generation / Approval workflow per threshold / Delivery tracking + 3-way match. Design: PurchaseRequest (requester/items/status) → quotes per supplier (compare board) → PO (PO-#### via nextTenantId, links Supplier) → approval threshold (e.g. >KES 50k needs principal — Tenant setting) → delivery receipt vs PO vs invoice = 3-way match; received goods can stock-in to B.18. Then Expenses → Calendar&Events review → B.26 review → Part C.

## ✅ B.24 OWNER DASHBOARD: COMPLETE 9/9 (built + live-tested 2026-06-13, screenshots 113-114)
- DB (migration `b24_owner_dashboard`): Tenant.collectionTargetPct Int @default(85). NEW permission **owner.dashboard** → LEADERSHIP bundle (SCHOOL_OWNER/PRINCIPAL; SUPER_ADMIN all) — teacher/bursar/parent blocked (can() + HTTP 403 + page→/forbidden verified). Nav "My School" (LineChart icon, Overview, permission-gated).
- Service `owner-dashboard.service.ts` (ownerDashboard + setCollectionTarget): students live (active/boys/girls/boarders via open hostelAllocation), revenue today (PAID Payments since NAIROBI midnight = dayStart UTC-3h) + term (paidKes on current-term invoices, discount-honouring min()), collection % vs target (on-track flag), arrears buckets + top-5 debtors (names+adm+links — owner can act), staff costs from latest B.8 PayrollRun (gross/net/statutory/staff/Approved), profitability = collected − gross×3 months (honest proxy, negative shown red, note points to C.5 expenses), enrollment trend 6 months by admittedOn (UTC month keys), exam trend (published-only, mean% vs maxMarks), **ranking ANONYMIZED** (percentile of collection rate across all tenants w/ bills; raw db cross-tenant ON PURPOSE but returns ONLY percentile+cohort — never names; cohort<2 → null + friendly note). setCollectionTarget clamps 10-100 + audit owner.target_updated.
- API GET/POST /api/owner (both requirePermission owner.dashboard; POST zod targetPct 10-100).
- UI /owner + components/owner/owner-client.tsx — glass-first, 4 UX states (skeleton grid / EmptyState+retry / populated; CSS-only bar charts, no chart lib): 4 stat tiles (incl. collection bar w/ inline target editor), arrears bars + largest-balances list, staff costs + term money position (surplus red/green), enrollment bars, exam mean bars, anonymized ranking card.
- Seed: demo PayrollRun 2026-05 APPROVED now seeded idempotently using the REAL grossToNet calculator (B.24 needed staff costs; period-exists guard). KES 295,000 gross / 4 staff.
- owner-test.ts 25/25 ✓ (perm gates ×5, payload vs raw-DB truth: students 5, buckets sum 57,500, debtors sorted, payroll 2026-05 4 staff, surplus math, 6 months, CAT 1 64%, anonymization grep, target set/clamp/audit/restore). HTTP: principal full payload ✓, teacher 403 ✓, page 200/forbidden ✓.
- tsc clean, test:roles 24/24, build clean (/owner 6.07kB + /api/owner). Screenshots 113 (desktop glass — QA'd: tiles, amber 45% vs 85% bar, red aging bar, debtor links, -837k surplus honest red) + 114 (mobile 360px). Series at 114.

## 🔁 CHAT-TRANSFER RESUME #2 (2026-06-13, this chat)
- Recovered via founder GitHub repo `elvisybadbunny-bit/workspace-019ebd39-c35e-7c82-97d5-8b7394b25ac43` (repo had neyo/ + docs/ FULL versions + 108 screenshots; .env included this time). Restored: npm install ✓ 54 migrations ✓ seed ✓ typecheck ✓ test:roles 24/24 ✓ build ✓ live principal login + /api/students ✓. REMIND FOUNDER: make repo private.

## ✅ G.33 2.0 — LIQUID GLASS IS THE DEFAULT SYSTEM (founder-APPROVED 2026-06-13, built + live-tested, screenshots 104-109)
- **DB (migration `g33_liquid2_platform_setting`): PlatformSetting key-value — COMPANY-GLOBAL, NOT in TENANT_OWNED_MODELS** (same family as PlatformFlag). Key "liquid_level" = "1"|"2"|"3" (subtle/standard/deep), seeded "2".
- **Theme system: glass is DEFAULT.** Root layout html className="glass" data-liquid="2"; pre-paint script: no localStorage key = glass; "glass-dark" adds .dark; "light"/"dark" strip .glass (plain fallbacks kept). theme-toggle.tsx cycle glass → glass-dark → light → dark (Droplets icon, green droplets for glass-dark); on mount it fetches /api/platform/appearance and applies + caches data-liquid in localStorage("neyo-liquid").
- **CSS (globals.css G.33 2.0 block): token-driven** — --lg-blur/--lg-sat/--lg-card/--lg-shell/--lg-side/--lg-input/--lg-pill/--lg-sheen per html.glass, html.glass.dark, and [data-liquid="1|3"] overrides (blur 12/22/32px). Ambient liquid backdrop light (warm water + green/navy radials) AND dark (deep navy + green glow). EVERY element frosted: .bg-white cards, .bg-navy-900/800 dark cards, aside/header/.bg-warm-50 shell, inputs/selects/textareas, .bg-navy-100 pills, ⌘K palette + dialogs (heavier frost via `.fixed .rounded-2xl`), overlay scrim gets backdrop blur. **Drifting specular sheen** on rounded-2xl cards (14s CSS keyframe, off at level 1, brighter at level 3, killed by prefers-reduced-motion). Print + reduced-transparency strip everything.
- **SIDEBAR DISTINCTION FIX (founder: "left panel not distinguishable")**: app-shell aside now bg-warm-50 + border-navy-200/70 + soft right drop-shadow in base themes; glass adds: more-opaque --lg-side, vertical green tint gradient, inset edge glow + 6px side shadow. Reads as its own pane in all 4 themes.
- **Company-only API**: GET /api/platform/appearance (any signed-in user) / POST {liquidLevel} (SUPER_ADMIN only). Service platform-appearance.service.ts (AppearanceError→422 in respond.ts; audit platform.appearance_updated). LIVE-TESTED: principal GET ✓ + POST 403 ✓; super admin set 3 ✓, invalid 9 → 422 ✓; level-3 verified in browser (data-liquid=3, --lg-blur:32px) ✓; restored to 2.
- **GOTCHAS (new, recorded in PROMPT-3):** ① NEVER restyle a utility the base layer @apply's — `html.glass.dark .bg-navy-950` broke the build (circular dependency); skeleton bg now raw hex for the same reason. ② ESLint react-hooks flags ANY `use*` import inside route handlers — `useGatePass` aliased to `markGatePassUsed` in /api/security. ③ Sandbox `npm run build` can OOM — `NODE_OPTIONS="--max-old-space-size=4096" npm run build`. ④ next/image caches optimized images — renaming the file (bundi-hero-v2.png) busts it.
- Screenshots (1920×1080): 104 glass-light dashboard, 105 glass-dark dashboard, 106 liquid ⌘K search (Achieng results on frosted palette), 107 level-3 deep, 108 Bundi page, 109 glass mobile 360px. All QA'd.
- **AUTH PAGES VERIFIED GLASS (founder re-ask 2026-06-13):** /login (+ /get-started, /verify — same (auth) layout w/ .bg-warm-100 + .bg-white card, both glass-targeted) renders Liquid Glass BY DEFAULT — proven with a FRESH browser context (zero localStorage): frosted sign-in card, glass inputs, liquid wash background. The root-layout pre-paint script covers every route group incl. (auth) and (legal); no per-page work needed. Screenshots 110 (light default) / 111 (glass-dark) / 112 (mobile 360px). Series now at 112. scripts/shot-login-glass.ts kept.

## ✅ G.36 — BUNDI LAYER EXPERIENCE SHELL (B.23 design-only; founder-directed 2026-06-13)
- **FOUNDER LAWS:** never say "AI" — the mascot Bundi IS the helper; ships OFF (platform-paused) until launch through the mascot; NO feature may depend on this layer (audited: zero AI/openai/claude refs in src/; all B-module "AI swap points" are rule-based engines that work forever without it).
- modules.ts += key "bundi" (defaultOn:true BUT paused platform-wide → hidden everywhere). navigation.ts += Bundi (Feather icon, /bundi, moduleKey bundi) in Overview. Seed upserts PlatformFlag bundi paused=true note "Bundi is getting ready — meet your new helper soon." (update:{} so a deliberate release is never overwritten by reseed).
- /bundi page (requirePageUser + isPaused) + components/bundi/bundi-client.tsx: WWDC hero (transparent mascot public/brand/bundi-hero-v2.png — alpha-keyed from bundi-mascot.png via PIL, green glow, "New from NEYO" badge, "Bundi is here to help", lock pill w/ flag note), 4 preview cards (Ask Bundi/Report card remarks/Early flags/Lesson plan starters) badged "Soon", trust footer. Zero fake output, zero "AI" (grep-verified 0).
- **LAUNCH DAY = one call:** POST /api/admin/flags {moduleKey:"bundi", paused:false} → nav + page unlock for every school instantly (rehearsed live: release → enabled:true + lock gone → re-paused to ship state).
- B.23 ENGINE LINES: stay [ ] deferred-pending-AI-key + founder launch signal; checklist B.23 header notes the Bundi directive.

## ⏭️ NEXT: B.25 — Additional Modules (strict list order)
Sub-blocks in order: **Uniform Management** (items/sizes/stock per size/sales+payment tracking — NOTE: G.24 already built catalogue+orders+invoice-billing on B.18 StockItem; review overlap line-by-line, extend with per-size stock rather than rebuild) → **School Assets** (B.18 Asset model exists: tagging done; add acquisition records, depreciation auto-calc, maintenance schedule, custodian) → **Supplier Management** (records/categories/ratings/contracts w/ expiry) → **Procurement** (purchase requests → quotation comparison → PO → approval thresholds → delivery + 3-way match) → **Expenses Tracking** (categories/cost centers/approvals/receipt photo upload (OCR=Bundi-gated, flag)/reports — completes the honest B.24 profitability line) → **Calendar & Events** (most lines BUILT at A.17 — verify+tick; remaining: WhatsApp reminders [creds-gated], recurring events RRULE). Then B.26 Premium (mostly Bundi/hardware-gated review) → Part C.

## ✅ B.22 SECURITY: COMPLETE (built + live-tested, screenshots 101-102 Full HD)
- DB (migration `20260612190000_b22_security`): **GatePass** (GP-####, leaveAt/returnBy/escort, ACTIVE|USED|EXPIRED|CANCELLED, usedAt gate-stamp), **PickupPerson** (relationship/phone/nationalId, soft-removed via active), **PanicAlert** (kind/location, smsSent, resolvedBy). All in TENANT_OWNED_MODELS.
- Permissions: security.view/manage → RECEPTIONIST (gate desk) + LEADERSHIP. **panic.raise → ALL 14 staff roles** (any mwalimu can pull the alarm; parents/students excluded).
- Service rules (security-test.ts 14 ✓): one ACTIVE pass per student 409; useGatePass case-insensitive, USED stamp, re-use rejected w/ "do not allow exit", unknown 404; cancel only ACTIVE; pickup add/lookup (by name or adm)/soft-remove; **raisePanic → in-app to EVERY staff (9 verified, category "emergency") + SMS to PRINCIPAL/DEPUTY/OWNER only (2 fired live, quota-recorded), parents NOT alerted (verified)**; resolve + double-resolve 409.
- API /api/security (GET passes+panics + ?pickup= lookup; POST gatePass/usePass/cancelPass/addPickup/removePickup/panic/resolvePanic — panic gated separately on panic.raise). UI /gate + security/gate-client.tsx — 3 tabs: Gate passes (issue + check-by-number box), Pickup authorisation (lookup w/ red "NOBODY authorised" warning + ID-check note), Emergency (big red RAISE button + ACTIVE banner + history). Nav: Security (DoorClosed, security.view).
- Visitor management line ticked (was BUILT at A.18 + B.16 link). CCTV = hardware-deferred flag.

## ✅ G.33 LIQUID GLASS THEME (founder loved WWDC25; THEME-ONLY until he verifies):
- globals.css `html.glass` block: ambient radial wash (green/navy/white — design rules, no purple), frosted .bg-white/.bg-warm-50/aside/header via backdrop-filter blur+saturate, inset specular highlight, prefers-reduced-transparency fallback, @media print FORCES plain (founder rule: never in documents). **GOTCHA: app-shell wraps content in .bg-warm-100 which sits OVER body — glass CSS must target both `html.glass body, html.glass .bg-warm-100`.**
- theme-toggle.tsx now 3-way cycle light→dark→glass (Droplets icon); layout.tsx pre-paint script handles "glass". LIGHT stays default (founder rule). Screenshot 103 (Full HD glass dashboard) QA'd.
- Performance: CSS-only, GPU-composited; no JS per frame. Promote to default ONLY on founder signal after his own device tests.

## 📌 G.34 SECURITY HARDENING (founder "AVOID HACKING") — recorded as a pre-launch block; baseline A.14 already strong (told founder honestly: HTTPS/HSTS/CSP, Argon2id, AES-256-GCM, immutable audit, rate limits, fail-closed tenancy). Remaining = dependency audit CI, pen test, session rotation, per-tenant 2FA enforcement, backup drill.
## 📌 G.35 SCALE TO 1M USERS (founder question) — answered YES by architecture (stateless Next horizontal scale, Neon Postgres prod, indexed tenant-scoped queries, externalizable jobs, R2, queueable comms); block records the deploy-time steps: Neon swap + RLS sql (already written), Redis rate limits, pooling/replicas, k6 load test, CDN.

## ✅ G.31 AUTO-PRINT QUEUE (founder: "INVOICES PRINT THEMSELVES"; built + live-tested, screenshots 99-100 at 1920×1080)
- DB (migration `20260612180000_g31_print_queue`): **PrintJob** (kind INVOICE|RECEIPT|CLASS_BATCH, refId, classId/classLabel frozen, url = PDF endpoint, QUEUED|PRINTED|FAILED, queuedBy). In TENANT_OWNED_MODELS.
- Service `print-queue.service.ts`: queuePrint (DEDUPES identical un-printed jobs), queueInvoiceAfterPayment (balance auto-computed into the title), queueReceiptForPayment, queueClassBatch (all invoices of a structure's class, grouped for distribution), queuedJobs (grouped by classLabel + printedToday), markPrinted (double-print 409).
- **AUTO-QUEUE HOOKS (no tap, founder rule)**: ① reception recordWalkInPayment (CASH + manual M-Pesa) → receipt; ② finance applyPaymentToInvoice → updated invoice; ③ M-Pesa onPaymentPaid → receipt + invoice. All best-effort try/catch — printing must never break the ledger. Bank slips wire into the same hooks when bank integration lands (B.7 deferred line).
- **HOW PRINTING WORKS (no special hardware)**: /print-station page stays open at reception → polls /api/print-queue every 10s → each job's PDF loads in a hidden iframe → contentWindow.print() to the default printer → marks PRINTED. Pause/resume button. PRINTER/PC OFF = jobs simply stay QUEUED (persistence verified: 4 jobs) and flush on reopen — this IS the founder's "if the printer is off it is queued" requirement, no driver/daemon needed. Access: reception.operate OR finance.view.
- print-queue-test.ts (12 ✓): cash auto-queue, payment auto-queue w/ balance in title, dedupe, M-Pesa double-queue, class batch 3×F2E grouped, double-print 409, offline persistence, teacher 403.
- NOTE: full silent printing without ANY dialog needs kiosk mode (chrome --kiosk-printing) on the reception PC — one-line setup note for founder deployments; the queue+iframe flow works regardless.

## ✅ G.32 FULL-WIDTH DESKTOP (founder: "SCREEN SHOULD BE FULL VIEW 1080"): app-shell max-w-7xl cap REMOVED (w-full). **STANDING RULE: desktop screenshots now 1920×1080** (founder said the old 1280px shots "don't look full"). Screenshots 99 (print station w/ queued receipt + F2E invoice "bal KES 16,000") + 100 (dashboard) at Full HD, QA'd.

## 📌 G.27-G.30 APPROVED & RECORDED (founder "ADD G 27 28 29 G 30") — checklist blocks added, BUILD ON FOUNDER SIGNAL: G.27 Mwalimu Day-One Pack (teacher print pack), G.28 Fee Promise-to-Pay, G.29 Report-Card Day Mode, G.30 NEYO Health Check (company churn dashboard).

## 📌 AUTOMATED FEE REMINDERS (founder re-asked): ALREADY LIVE since B.7 — sendFeeReminders cron daily 09:00 EAT, overdue → guardian SMS w/ balance, 3-day dedupe, quota-checked (checklist B.7 line ticked w/ evidence). Confirmed to founder, nothing new needed.

## ✅ B.21 MEDICAL/CLINIC: COMPLETE 5/5 (built + live-tested, screenshots 97-98)
- DB (migration `20260612170000_b21_clinic`): **StudentMedical** (one per student: bloodGroup, conditions, allergies JSON, SHA number), **ClinicVisit** (complaint/treatment/medicationGiven/referredTo, parentNotifiedAt), **MedicationPlan** + **MedicationDose** (per-dose trail). All in TENANT_OWNED_MODELS.
- Permissions: clinic.view/manage → SUPPORT_STAFF (school nurse role-stand-in) + **DEPUTY (added after 403 hit in screenshot run — deputy has a CUSTOM list, not the LEADERSHIP bundle; remember to add new perms BOTH places)** + LEADERSHIP.
- **ALLERGY SAFETY (3 surfaces, all verified)**: visit w/ matching medication → warning string returned + toast; startMedication matching allergy → BLOCKED 422; cafeteria kitchenToday() += foodAllergies from allergyRegister() (cooks see "Atieno — Groundnuts").
- Referral visits SMS the guardian (fired live: "...referred to Kiambu Level 5 Hospital. Please contact the school immediately."), quota-checked + recorded.
- Medication: plans w/ dosage/frequency/dates; giveDose trail (who+when+note); stop; dose-on-stopped 422; double-stop 409.
- healthReport: year visits/referrals/allergic/active-med counts + frequent visitors ≥3/yr. childHealth (scopeWhere) for the family portal: visits+allergies+bloodGroup, other-family 404.
- API /api/clinic (GET dashboard + ?file= + ?child=; POST profile/visit/medication/dose/stopMedication). UI /clinic + clinic-client.tsx — 4 tabs (Visits, Allergy register w/ red badges, Medications w/ Give-dose, Health report tiles + frequent visitors). Nav: Clinic (Stethoscope, clinic.view).
- Seed: Atieno O+ asthma + [Penicillin, Groundnuts] + SHA-1184422 + 1 visit (inhaler) + 1 plan w/ 1 dose; Kiprono B+. Reset block clears all 4 tables. clinic-test.ts (15 ✓, SELF-HEALS).
- tsc clean, build clean (/clinic 7.16kB), test:roles 24/24.

## ✅ G.26 THEME: REVERTED TO LIGHT DEFAULT (founder "JUST LET THE DEFAULT BE JUST THE LIGHT"): layout.tsx html has NO dark class; inline script ADDS dark only when localStorage neyo-theme==="dark"; theme-toggle default false. Checklist line struck-through + updated.

## ✅ B.20 DISCIPLINE: COMPLETE 5/5 (built + live-tested, screenshots 95-96)
- DB (migration `20260612160000_b20_discipline`): **DisciplineIncident** (8 KE categories, MINOR/MAJOR/SEVERE → points 1/3/5, actionTaken, parentNotifiedAt), **Suspension** (start/end, reason, conditions, ACTIVE|COMPLETED|REVOKED), **CounselingNote** (sessionType, followUpOn — CONFIDENTIAL). All in TENANT_OWNED_MODELS.
- Permissions: discipline.view/manage → TEACHER+CLASS_TEACHER (report only, scoped via teacherClassIds — outside-class 403 verified) + DEPUTY + LEADERSHIP. **counseling.confidential → PRINCIPAL/DEPUTY/LEADERSHIP ONLY** — gates counseling notes AND suspension issue/close (teachers report, deputies suspend — real KE school protocol). Teacher+bursar read-counseling blocked (verified). Audit row for counseling deliberately EXCLUDES the note text (verified no leak). Family portal childDiscipline (scopeWhere) returns incidents+suspensions, NEVER counseling; reporter names hidden from families.
- AUTO PARENT SMS: MAJOR/SEVERE incidents + every suspension → primary guardian (quota-checked + recordUsage; both fired live in tests; parentNotifiedAt stamped; "parent SMS ✓" badges).
- Behavior board: year demerit totals, bands GOOD <3 / WATCH 3-7 / AT_RISK ≥8, worst-first.
- API /api/discipline (GET scoped lists + ?counseling=1 + ?child= family view; POST incident/suspend/completeSuspension/counseling). UI /discipline + discipline-client.tsx — 4 tabs (Counseling tab HIDDEN unless counseling.confidential), severity pills (MAJOR amber/SEVERE red), "Major and severe incidents SMS the parent automatically" notice. Nav: Discipline (ShieldAlert, discipline.view).
- Seed: 2 Kamau incidents (minor lateness + major noisemaking w/ parentNotifiedAt). Reset block clears all 3 tables. discipline-test.ts (18 ✓, SELF-HEALS incl. smsPerTerm reset 1240).
- tsc clean, build clean (/discipline 7.2kB), test:roles 24/24. Screenshots 95 (incidents, DARK MODE visibly default) + 96 (behavior board) QA'd.

## ✅ G.25 STAMP REDESIGNED (founder 2026-06-12 follow-up): RECTANGLE rubber-stamp look — BLUE double-border frame, blue school name w/ logo at left, RED date through the middle between band rules, blue P.O. Box bottom line, -2° tilt, NO "digital stamp" wording (founder explicitly banned it). school-stamp.tsx now takes {schoolName, county, addressLine, logoDataUrl, dateText} + width (ratio 2.6:1). invoice-pdf passes addressLine. Screenshot 94 retaken + QA'd.

## ✅ G.21-G.26 FOUNDER BATCH (one turn, all live-tested via scripts/founder-batch-test.ts 20 ✓):
- **G.21 School type**: Tenant.schoolType DAY|BOARDING|DAY_AND_BOARDING (+ uniformSupplierName/Phone) in migration `20260612150000_g20_founder_batch`. In school-profile schema/service/API. setting DAY auto-disables the hostel module (tenantModule upsert in updateSchoolProfile — verified). Karibu seeded DAY_AND_BOARDING + "Mama Wanjiku Tailors" +254722334455.
- **G.22 Platform pause**: PlatformFlag model — **NOT in TENANT_OWNED_MODELS (company-global!)**. platform-flags.service: pausedModuleKeys/isPaused/listFlags/setFlag(audited). getModuleStates now checks paused FIRST (overrides tenant-enable → nav vanishes everywhere). API /api/admin/flags requireRole(SUPER_ADMIN). Verified: pause cafeteria w/ note → hidden for all; release → back.
- **G.23 Packages**: plans.ts rebuilt — Free Karibu/**Msingi(NEW 4,500)**/Pro/Elite each w/ tagline, includedModules entitlements, support tier, perStudentPerTerm seam, overage; ADD_ONS (6: sms_topup_1000/extra_storage/hostel_module/transport_module/inventory_module/priority_support); estimateTermCost(). Billing service untouched (grandfathering intact); plan-gating of modules = wire later when founder wants enforcement.
- **G.24 Uniform shop**: StockItem.imageUrl + UniformOrder model (UO-####, status PLACED→SENT_TO_SUPPLIER→DELIVERED, invoiceId REQUIRED). uniform.service: catalogue (Uniform-category sellables), placeOrder (scopeWhere row-scoping! invoice at placement + SMS to supplier — fired live), listOrders, markDelivered (stock decrement + SALE movement). API /api/uniforms (family portal.parent OR staff inventory.manage). UI: UniformCard (portal/uniform-card.tsx) on family-portal child view — photo grid, Order dialog w/ size, order tracker badges.
- **G.25 Invoice upgrade**: invoice-pdf.tsx → **A5**, compact styles, school LOGO in header (logoAsDataUrl reads from local storage — react-pdf can't fetch auth'd URLs), "Powered by NEYO · neyo.co.ke" footer, **SchoolStamp** (documents/school-stamp.tsx) auto-placed bottom-right. **BIG GOTCHA: react-pdf <Image> REJECTS SVG data-URIs ("Only HTTP(S) protocols") — stamp drawn with react-pdf's native <Svg><Circle> primitives + Text layers instead.** Stamp = double ring, school name, logo-or-initials, date, county, "OFFICIAL DIGITAL STAMP". Screenshot 94 (A5 PAID invoice w/ stamp + NEYO footer; stamp moved left of QR after visual QA).
- **G.26 Dark default**: html className="dark" + inline head script (remove dark only if localStorage neyo-theme==="light"); theme-toggle defaults dark. PDFs stay light.
- tsc clean, build clean, test:roles 24/24. Founder-batch test SELF-CONTAINED (resets flags/orders, restores hostel module + stock).

## ✅ B.19 CAFETERIA: COMPLETE 4/4 (built + live-tested 2026-06-12, screenshots 91-93)
- DB (migration `20260612140000_b19_cafeteria`, diff+deploy): **MealPlanEntry** (@@unique(tenant,dayOfWeek,mealType) — upsert edits in place) + **MealCard** (MC-#### card no, meals JSON, termFeeKes, invoiceId REQUIRED — founder rule baked into the schema). In TENANT_OWNED_MODELS.
- Permissions: cafeteria.view/manage → LEADERSHIP + BURSAR (manage); SUPPORT_STAFF got cafeteria.view (kitchen crew reads menu/headcount). Module key "cafeteria" + nav (UtensilsCrossed). Seed enables it for Karibu.
- Service `cafeteria.service.ts`: weekMenu/setMenuEntry (upsert); **kitchenStock REUSES B.18 Kitchen Store** (store name contains "Kitchen" — one stock truth); issueForMeal wraps B.18 stockOut(reason "Kitchen — <meal>"); **issueCard = INVOICE FIRST then card** (nextTenantId, UNPAID, due +14d), one-active-card-per-term 409, cancelCard; kitchenToday = headcount/meal (active cards + ALL boarders via hostelAllocation — boarding fee covers meals) + today's menu + low stock.
- API GET/POST /api/cafeteria (setMenu/issueCard/cancelCard/kitchenIssue). UI /cafeteria + cafeteria-client.tsx — Kitchen today (3 headcount tiles w/ today's dish, boarders note, low-stock strip, kitchen store list, Issue-food dialog), Week menu (7×3 click-to-edit grid), Meal cards (issue dialog w/ meal toggles + invoice-rule notice, cancel, live invoice status badges).
- Seed: 21 menu entries (real dishes: uji/githeri/pilau Friday/ugali na omena/matumbo) + Wanjiru's MC-0001 lunch card billed to KH-INV-MEAL01 (UNPAID). Reset block clears mealCard/mealPlanEntry.
- cafeteria-test.ts (14 ✓, SELF-HEALS): 21 entries, upsert-no-dup, kitchen-store reuse, issue 18→14 w/ traced reason, MC-0001→KH-INV-MEAL01, new card → invoice → FAMILY PORTAL (verified), dup-card 409, double-cancel 409, headcount math (lunch 5 = 4 boarders + 1 card), today's menu 3 meals. GOTCHA: cancelled test cards must be deleted in cleanup (listCards showed orphan "—" invoice) — test fixed.
- HTTP: bursar full ✓, teacher 403 ✓. tsc clean, build clean, test:roles 24/24. Screenshots 91 (kitchen board), 92 (week menu grid), 93 (issue-card dialog w/ rule notice) QA'd. NOTE: a 2nd redundant `npm run build` HUNG after a clean first build — don't double-build, kill + check .next exists.

## 📸 INVOICE PDFs SCREENSHOTTED FOR FOUNDER (88-90, rendered via pdftoppm/poppler-utils):
88 = store-sale invoice (sweater, UNPAID stamp, QR verify, print-tracking "Copy #1 — every print is tracked"), 89 = PARTIAL fee invoice, 90 = PAID IN FULL green stamp. B.7 invoice-pdf.tsx w/ G.9 branding (motto "Elimu ni Mwanga"), learner/adm/class/due header, paid vs balance rows, guardian line, QR + verify code. pdftoppm pattern: `pdftoppm -png -r 90 -f 1 -l 1 in.pdf out`.

## 📌 FOUNDER STANDING RULE (2026-06-12): "ALL SERVICES CONNECTED TO STUDENT INVOICES"
Every chargeable service MUST bill the student's B.7 invoice (shows on family portal, payable via STK). Status: boarding fees ✓(B.16 invoiceBoarders) · transport fees ✓(B.17 invoiceRiders) · store sales ✓(B.18 sellToStudent) · library fines ✓(billFineToInvoice). PATTERN: nextTenantId(INVOICE) + db.invoice.create UNPAID + due +14d (or chosen) + idempotency where batch. APPLY to B.19 Cafeteria (meal plans), B.25 uniform sales, any future charge.

## ✅ B.18 INVENTORY/STORES: COMPLETE 6/6 (built + live-tested 2026-06-12, screenshots 85-87)
- DB (migration `20260612130000_b18_inventory`, diff+deploy pattern): **Store**, **StockItem** (qty balance, reorderLevel, sellPriceKes = sellable, trackExpiry), **StockBatch** (batchNo/expiry), **StockMovement** (IN|OUT|SALE|ADJUST, SALE carries studentId+invoiceId — the proof chain), **Asset** (auto AST-#### tag, condition). All in TENANT_OWNED_MODELS.
- Permissions: NEW inventory.view/manage → LEADERSHIP + **BURSAR** (stores+uniform sales are bursar territory). New module key "inventory" in modules.ts + nav (Boxes icon). **Seed now enables ALL built modules for Karibu (hostel/library/transport/lms/inventory) — transport & lms were OFF and hidden from nav before (gotcha found this turn).**
- Service rules (all live-tested, scripts/inventory-test.ts 21 ✓): dup store/item 409, insufficient 409, batch REQUIRED on stock-in for trackExpiry items 422, FIFO batch depletion on OUT (earliest expiry first — verified B-2026-05 consumed before B-2026-06), reorder alerts (rice 4≤6, cleared after top-up), expiry alerts ≤30d + expired strips. **sellToStudent**: price×qty → REAL invoice (verified on Achieng's ledger AND family portal w/ Pay button) + stock decrement + SALE movement linking student+invoice. **billFineToInvoice** (library.service): unpaid fine → invoice, double-bill 422, "Add to invoice" button beside "Collect cash".
- API: GET/POST /api/inventory (?movements=; actions addStore/addItem/in/out/sell/addAsset). UI: /inventory + inventory-client.tsx — Stock tab (3-colour alert strip amber-reorder/orange-expiring/red-expired, item rows w/ In/Out/Sell buttons, movements drill-down), Assets tab (tag badges + condition + value). Sell dialog shows the rule: "billed to the student's fee invoice... family can pay via M-Pesa".
- Seed: Main Store (sweater KES 1,200 + exercise book KES 120 sellables) + Kitchen Store (maize flour 18 bales w/ 2 batches one expiring in 14d; rice 4 bags LOW), 1 IN movement, 2 assets. Reset block clears all 5 inventory tables.
- HTTP verified: bursar full access + live sale (sweater→KH-INV-000010→parent portal UNPAID 1,200 w/ Pay button); teacher 403, parent 403.
- tsc clean, build clean (/inventory 8.44kB + /api/inventory), test:roles 24/24. Screenshots 85 (stock w/ alert strips), 86 (sell dialog w/ invoice-rule notice), 87 (mobile portal: "School sweater × 1 (school store)" KES 1,200 + Pay) QA'd.

## ⏭️ NEXT: B.23 — AI Intelligence Layer (strict list order)
Lines are AI-key-gated (founder OpenAI/Claude cred needed): report comments, lesson plans, KCSE prediction, risk detection, photo marks-grading, AI tutor... REVIEW each line: anything buildable rule-based gets built, the rest flagged DEFERRED-pending-AI-key; then proceed B.24 Owner Dashboard (buildable now).

## ✅ B.17 TRANSPORT: COMPLETE (built + live-tested 2026-06-12, screenshots 82-84)
- DB (migration `20260612120000_b17_transport`, manual diff+deploy pattern): **TransportRoute** (stops JSON ordered, termFeeKes, vehicleId/driverId), **Driver** (@@unique(tenant,licenseNo), licenseExpiry), **Vehicle** (@@unique(tenant,regNo), capacity, insuranceExpiry + inspectionExpiry — KE NTSA compliance), **VehicleMaintenance** (type/cost/odometer/garage), **FuelLog** (litres/cost/odometer/station), **TransportAssignment** (one open row per student, pickupStop). All in TENANT_OWNED_MODELS.
- Permissions: NEW transport.view/manage → LEADERSHIP only for now (no dedicated TRANSPORT role in the 16; SUPPORT_STAFF could get view later if founder asks). Nav /transport fixed student.view → transport.view. Parent + librarian 403 verified.
- Service `transport.service.ts` (TransportError mapped 404/409/422): EXPIRY_WARN_DAYS=30 → insurance/inspection/DL "expiring" flags (daysUntil helper). **km/L consumption** = km between last two fill-ups ÷ newest litres (needs odometer on both; 7 km/L verified). Assignment rules: one-route-per-student, bus-capacity FULL 409, pickupStop must be in route.stops 422. invoiceRiders → idempotent B.7 invoices by description "Transport — <route> — Term N YYYY" (same pattern as B.16 boarding; nextTenantId INVOICE).
- API: GET/POST /api/transport (?riders= ?vehicle=; actions addRoute/addDriver/addVehicle/maintenance/fuel/assign/release/invoice). UI: /transport + transport-client.tsx — tabs Routes (cards w/ stops chain + seats-left + Riders board + Invoice riders), Fleet (compliance badges red-insurance/amber-NTSA/green-compliant + km/L + vehicle file w/ fuel & maintenance logs + Log dialogs), Drivers (DL badges). GPS notice: "arrives with tracker hardware — flagged for later, never faked".
- Seed: KCB 123A Toyota Coaster 33-seat (insurance expiring in ~20d → red badge demo) + KDA 456B Isuzu NQR 51-seat (compliant); drivers Omondi Peter (DL ok) + Wafula John (DL expiring); Route A Kasarani (9,000/term, 4 stops) + Route B Githurai (7,500/term); riders Wanjiru@Mwiki + Kiprono@Seasons; 2 fuel logs → 7 km/L + 1 service 18,500. Reset block clears all 6 transport tables.
- transport-test.ts (21 ✓, SELF-HEALS): seat math 31/33, dup route/DL/regNo 409s, expiry alerts, km/L, vehicle-file totals (21,240/18,500/118L), one-route-per-student, invalid stop, capacity-full, release rules, invoices 2×9,000 idempotent, no-fee blocked. HTTP verified + 403s.
- GOTCHA hit AGAIN this session: node_modules AND playwright cache both wiped (separate moments). Recovery worked as documented: npm install + prisma generate; npx playwright install chromium + apt libs.
- tsc clean, build clean (/transport 9.27kB + /api/transport), test:roles 24/24. Screenshots 82 (route cards w/ stops chain), 83 (fleet w/ red insurance badge vs green compliant + 7 km/L), 84 (vehicle file: fuel/maintenance logs + KES totals) QA'd.

## ✅ B.16 HOSTEL: COMPLETE (built + live-tested 2026-06-12, screenshots 79-81)
- DB (migration `20260612110000_b16_hostel` — manual `migrate diff --script` + `migrate deploy` pattern again): **Hostel** (gender BOYS|GIRLS|MIXED, masterId, boardingFeeKes/term), **HostelRoom** (capacity = beds), **HostelAllocation** (bed-level, open while releasedAt null, denormalized studentName/admissionNo), **HostelAttendance** (@@unique(tenant,student,date), IN|OUT|LEAVE). VisitorLog += studentId (boarder visit link). All in TENANT_OWNED_MODELS.
- Permissions: NEW hostel.view/hostel.manage → HOSTEL_MASTER + LEADERSHIP. Nav /hostel fixed attendance.view → hostel.view. NEW seed login: **hostel@karibuhigh.ac.ke (Barasa Wekesa, HOSTEL_MASTER, KH-U-000009)**.
- Service `hostel.service.ts` rules (ALL live-tested in scripts/hostel-test.ts, 20 ✓): gender rule (girl→boys' 422), one-bed-per-student, bed-taken/room-full 409, auto-pick first free bed, dup hostel/room 409, release + double-release 409. **Curfew**: sheet = current boarders sorted room+bed; markCurfew idempotent upsert + URGENT guardian SMS on NEW OUT marks only (no dup SMS on re-mark — prev-status check), quota-checked + recordUsage. **Boarding fees**: invoiceBoarders → REAL B.7 invoices via nextTenantId(INVOICE), idempotent by description "Boarding — <hostel> — Term N YYYY". boarderVisitors reads VisitorLog by studentId.
- API: GET/POST /api/hostel (?board= ?curfew=&date= ?visitors=; actions addHostel/addRoom/allocate/release/curfew/invoice). UI: /hostel + hostel-client.tsx — Dorms tab (occupancy cards w/ progress bar + "Invoice boarders" + room/bed board w/ Allocate per empty bed (gender-filtered student list) + release) and Curfew tab (hostel+date pickers, IN/OUT/LEAVE pills, "Out sends URGENT SMS" notice, save w/ marked count).
- Seed: Simba House (BOYS, master Barasa, 15k/term, 2 rooms × 4 beds) + Chui House (GIRLS, 1 room × 6); boarders Kamau+Kiprono (Simba R1), Achieng+Atieno (Chui R1); last-night curfew (Kiprono LEAVE w/ note). Reset block clears hostelAttendance/Allocation/Room/Hostel.
- hostel-test.ts SELF-HEALS (resets hostel tables + invoice/Boarding rows + **smsPerTerm→1240** + reseeds — the quota-inflation gotcha bit AGAIN mid-test (7441/5000 blocked the SMS assertion); the reset is now BAKED INTO the test).
- HTTP verified: master hostels/board/curfew ✓; teacher 403, parent 403, master→finance 403.
- TICKED B.3 "Hostel attendance" (was BLOCKED until B.16) — same turn.
- tsc clean, build clean (/hostel 7.6kB + /api/hostel), test:roles 24/24. Screenshots 79 (dorm cards), 80 (bed board: Chui R1 Achieng/Atieno + 4 empty w/ Allocate), 81 (mobile curfew register w/ In/Out/Leave pills) QA'd.
- Visitor line [~]: hostel-side link + read DONE; reception desk form student-picker = small A.18 polish later.


## ✅ B.15 LIBRARY: COMPLETE 6/6 (built + live-tested 2026-06-12, screenshots 75-77)
- DB (migration `b15_library_g19_classchat` — created via `prisma migrate diff --script` + `migrate deploy` because `migrate dev` PROMPTS interactively on the Conversation unique-index change; sandbox is non-interactive → REMEMBER this pattern for future index-adding migrations): **LibraryBook** (@@unique(tenantId,isbn), copiesTotal, shelf/category, optional fileUrl digital copy) + **BookIssue** (denormalized studentName/admissionNo, dueDate, returnedAt, fineKes, finePaid). Both in TENANT_OWNED_MODELS.
- Permissions: NEW library.view + library.manage → LIBRARIAN (finally has real work) + LEADERSHIP bundle. Nav /library fixed from student.view → library.view.
- Service `library.service.ts`: FINE POLICY = KES 10/day overdue, **Sundays excluded** (overdueDays walks days skipping getUTCDay()===0; unit-verified Jun1→Jun8 = 6 days = KES 60). MAX_OPEN_ISSUES=3/student. Rules live-tested: availability ("All N copies out"), dup-copy block, dup-ISBN 409, past-due-date 422, 3-book limit, double-return 409, on-time return = fineKes 0 + finePaid auto-true. findByBarcode(isbn) returns availability + current holders w/ live fines. readingHistory row-scoped via scopeWhere (parent other-child 404 verified). unpaidFines ledger + markFinePaid.
- API: GET/POST /api/library (?q / ?barcode= / ?view=open|fines; actions addBook/issue/return/finePaid), GET /api/library/history?studentId= (library.view OR portal.parent).
- UI: /library + library-client.tsx — tabs Catalog (search + availability badges + Add-book dialog w/ scan-or-type ISBN field + digital-copy upload), Out now (live "9d late · KES 90" badges + Return + unpaid-fines Collect), Issue a book (barcode-first: scan→Find→availability card showing who holds copies; fallback catalog/student dropdowns; default due +14d). Family portal: "Library books" card (LibraryCard in portal/library-card.tsx) w/ out/overdue/returned badges.
- Barcode note for founder: any phone scanner app or KES-500 USB scanner acts as a KEYBOARD (HID wedge) — it types the ISBN into the field and presses Enter; the Enter key triggers lookup. No special hardware integration needed.
- Seed: 4 KE books (River and the Source/Blossoms/KLB Math Bk3/Kamusi TUKI, 46 copies) + Achieng issue due +7d + Kamau OVERDUE ~10d (live fine demo). Reset block clears bookIssue/libraryBook + class-bound conversations.
- LIVE-TESTED `scripts/library-test.ts` (24 ✓ — script SELF-HEALS: resets library tables + reseeds at start, because a crashed mid-run previously left dirty state). HTTP: librarian catalog/barcode/open-issues ✓, librarian finance 403 ✓, parent own-child history ✓, bursar library write 403 ✓.

## ✅ G.19 CLASS GROUP CHAT: BUILT (founder asked "ADD A GROUP CHAT FOR THE CLASSES" — spec'd as G.19 + built same turn on the A.8 engine)
- DB: Conversation += classId (@@unique(tenantId,classId)) — set = THE class group chat; in same migration.
- Service `class-chat.service.ts`: openClassChat(user, classId) = canJoin gate (families via scopeWhere child-in-class; teachers via teacherClassIds; leadership always) → get-or-create GROUP convo "Form 2 East — Class Group" → **SYNC membership every open** (chatMemberIds = classTeacherId ∪ timetable teacherIds ∪ guardian userIds ∪ student userIds; createMany missing, deleteMany departed). ClassChatError 403/404 mapped.
- API: POST /api/class-chat {classId} → {conversationId} for deep-link. UI: ClassChatButton (portal/library-card.tsx) on family-portal child header + teacher My-Classes cards → /messages?open=<id> (NEW deep-link param in messages-client, placed AFTER openConvo definition).
- Full A.8 features inherited free: attachments, unread badges, SSE live updates, read receipts.
- LIVE-TESTED (in library-test.ts): create +3 members, same-conversation for teacher & parent, teacher message → student reads it, njoroge 403, parent other-class 403. HTTP: parent opens chat, chebet posts "PTA meeting", parent reads ✓. Screenshot 78 (mobile chat w/ Swahili messages, green own-bubble).
- GOTCHA: reseed deletes class-bound conversations → chat messages are wiped with classes (expected); re-post demo messages if needed for screenshots.
- tsc clean, build clean (/library 8.23kB + 3 APIs), test:roles 24/24. Screenshots 75 (catalog), 76 (out-now w/ live fine), 77 (barcode issue flow), 78 (class chat mobile) QA'd.

## ⏭️ NEXT: B.16 — Hostel (strict list order)
Lines: Hostel + dorm registration / Room allocation / Bed allocation / Hostel attendance (curfew) — UNBLOCKS the B.3 "Hostel attendance" line / Hostel fees (wire to B.7 invoicing) / Visitor tracking (A.18 VisitorLog exists — link). HOSTEL_MASTER role exists (student.view, attendance.view/record).

## ✅ B.14 COMMUNICATION: COMPLETE (built + live-tested 2026-06-12, screenshots 73-74)
- DB (migration `b14_communication`): **BulkMessage** ledger (audienceType SCHOOL_GUARDIANS|CLASS_GUARDIANS|ROLE, audienceLabel frozen at send, channel sms|in_app, recipient/sent/skipped counts, costKes, sender). In TENANT_OWNED_MODELS.
- Service `src/lib/services/comms.service.ts`: resolveAudience() — guardian audiences DEDUPE BY PHONE (one SMS per family, siblings share guardian = G.12 sibling intelligence line delivered); ROLE audience = active users of a role. bulkSend(dryRun) = preview (recipients+cost+quota) / real send (SMS via sms.ts seam w/ school-name prefix; in_app via A.7 notify() dispatcher). checkSmsQuota on BOTH paths; recordUsage after. audienceOptions() computes live family counts per class.
- **TEACHER RESTRICTION** (assertAudienceAllowed): TEACHER/CLASS_TEACHER/HOD/DEAN → CLASS_GUARDIANS of teacherClassIds() ONLY; school-wide/role sends 403 "sent by the school office". audienceOptions returns teacherScoped:true + own classes only. Leadership/bursar/receptionist (comms.send holders) get full audiences.
- CommsError mapped: QUOTA→402, FORBIDDEN→403, NOT_FOUND→404, else 422.
- API: GET/POST /api/comms (comms.send). UI: /comms page + comms-client.tsx — audience cards w/ live family counts, SMS/in-app channel toggle, 480-char composer w/ segment counter, **MANDATORY preview step** ("Check recipients & cost" → green card w/ count + KES estimate + quota warnings → "Confirm & send"), any edit invalidates preview; Sent-messages ledger panel. Nav: "Broadcast" (Megaphone, comms.send) in Overview.
- Seed: 1 sent school-wide broadcast in ledger (idempotent).
- LIVE-TESTED `scripts/comms-test.ts` (15 ✓): audiences (principal full 5 fam/2 classes/11 roles; chebet 1 class 0 roles; njoroge fail-closed 0); dry run 5 families KES 4; class send 3 F2E families (dev-console SMS visibly fired ×3); quota 1240→1243; ledger row; TEACHER role in-app → njoroge inbox row; chebet school-wide/other-class/role all blocked; quota-cap dry-run allowed:false + real send throws (restored after). HTTP: principal GET/dryRun/role-send ✓, chebet teacherScoped ✓ + school-wide 403, parent 403.
- **GOTCHA hit AGAIN: smsPerTerm usage inflated (14,890/5,000) by old test runs → reset to 1240.** If quota errors appear in dev, reset usageCounter smsPerTerm to 1240.
- WhatsApp/email lines marked [~]: transports + cascade slots exist; flip on with WHATSAPP/RESEND env keys (founder creds) — no code change needed.
- tsc clean, build clean (/comms 5.6kB + /api/comms), test:roles 24/24. Screenshots 73 (principal compose w/ cost preview card) + 74 (teacher mobile, class-scoped notice) QA'd.

## ⏭️ NEXT: B.15 — Library (strict list order)
Lines: Book catalog / Issue-return tracking / Fines auto-calc / Barcode scanning (phone) / Digital library / Reading history per student. LIBRARIAN role exists (student.view only — will need library permissions). Nav "Library" href=/library already points at a page that may 404 — build it.

## ✅ B.13 LMS: COMPLETE (built + live-tested 2026-06-12, screenshots 69-72)
- DB (migration `b13_lms`): **HomeworkSubmission** (@@unique(homeworkId,studentId), text/fileUrl, late flag, gradePct/feedback/gradedBy), **Quiz** + **QuizQuestion** (options JSON, correctIndex — server-only) + **QuizAttempt** (@@unique(quizId,studentId), answers JSON, score/total/scorePct), **ForumThread** + **ForumPost** (authorRole for chips, locked). All in TENANT_OWNED_MODELS.
- A.9 storage now accepts **.doc/.docx** (ALLOWED set + extFor + local-provider content-types) — ticks "Notes upload (PDF, DOC)".
- Service `src/lib/services/lms.service.ts`: LmsError (ALREADY_DONE/CLOSED/LOCKED → 409 in respond.ts). Access helpers: teachers reuse B.12 teacherClassIds(); families via familyClassIds() (scopeWhere→children's classIds, fail-closed "__none__"); forumClassIds() switches on role. KEY SECURITY: getQuizPaper strips correctIndex; submitQuizAttempt grades SERVER-side, returns review (corrections) only after grading; one-attempt unique; dueDate closes; resubmit-after-grade blocked; lockThread teacher-only.
- APIs: `/api/lms/submissions` (GET sheet, POST grade — homework.assign), `/api/lms/quizzes` (GET list/results, POST create, PUT publish — homework.assign), `/api/lms/forum` (shared: homework.assign OR portal.parent; actions thread/post/lock, lock re-gated to homework.assign), `/api/portal/lms` (portal.parent: quizzes list, paper, submitHomework, attemptQuiz).
- LEADERSHIP got portal.teacher + homework.assign added to the LEADERSHIP bundle (oversight; teacherClassIds null = all). test:roles still 24/24.
- UI staff: `/lms` page (academics.view + redirect to /portal if no homework.assign) + `src/components/lms/lms-client.tsx` — tabs Quizzes (builder dialog: tick-the-correct-answer circles, add/remove options/questions; publish/hide; results drill-down), Hand-ins (homework picker → roster missing/handed-in/graded + GradeDialog w/ typed answer + file link + feedback), Discussions (class picker, threads, ThreadView w/ lock — ThreadView imported from portal lms-cards).
- UI family: `src/components/portal/lms-cards.tsx` (SubmitWorkDialog, QuizzesCard + TakeQuizDialog w/ option buttons + instant result + per-question review, ForumCard + ThreadView + NewThreadDialog). parent-portal-client: homework rows now show submission status badges (handed in ✓ / late / graded N% + teacher feedback) + Hand in / Re-submit buttons; QuizzesCard + ForumCard added; childDetail exposes child.classId + homework[].submission.
- Seed: published "Quadratics check-in quiz" (3 MCQs) + Kamau attempt 67%, Atieno ungraded hand-in (Swahili note), forum thread "Revision plan for CAT 2" + Achieng STUDENT reply. **achieng@karibuhigh.ac.ke STUDENT login now SEEDED** (was created ad-hoc in old chat — now permanent: studentLogin field in studentSeed, linked via Student.userId).
- **SEED ORPHAN GOTCHA FIXED FOR GOOD**: reset block now deletes ALL student-bound rows (examResult/exam/invoice/feeStructure/attendanceRecord/cbcAssessment/homeworkSubmission/quizAttempt) before student deleteMany — reseed verified 0 orphans, no manual clearing needed anymore.
- LIVE-TESTED `scripts/lms-test.ts` (22 ✓): hand-in→teacher sheet→grade 85%→portal shows grade+feedback→resubmit blocked; paper hides correctIndex; auto-grade 3/3=100%; 2nd attempt 409; other-family paper blocked; draft hidden→publish visible; njoroge blocked everywhere; forum read/reply/lock/parent-other-class blocked. HTTP-verified via curl: chebet quizzes/sheet, achieng quiz list 100% + paper 409 + lock 403, bursar 403 on forum+quizzes.
- Screenshots 69 (quizzes list), 70 (per-student results 67%/100%/not attempted), 71 (Hand-ins grading roster), 72 (mobile portal: quiz 100% badge, notes download, class discussion) — QA'd. GOTCHA: achieng IS the student → `button:has-text('Achieng')` hits the topbar user chip; click the card via admission number `KH-S-000001`. Cookie banner: dismiss BEFORE tapping cards.
- Emoji-in-JSX cleaned (📘/📄 → lucide icons) — keep using icons, not emoji glyphs.
- tsc clean, build clean (/lms 5.95kB + 4 APIs), test:roles 24/24.
- DEFERRED (flagged in checklist, not faked): video lessons (needs R2/CDN), WebRTC live classes (TURN/SFU), AI tutor (B.23).

## ⏭️ NEXT: B.14 — Communication (strict list order)
Lines: Bulk SMS to class/school (A.7 sms seam + quota), pre-send quota check (limits.service exists), notification dispatcher (A.7 notify() exists — verify+wire), WhatsApp notifications (DEFERRED-creds), email notifications (Resend seam exists — DEFERRED-creds for live send), targeted messaging per role (A.8 conversations + role filters).

## ✅ B.12 TEACHER PORTAL: COMPLETE (built + live-tested 2026-06-12, screenshots 65-68)
- DB (migration `b12_teacher_portal`): **Homework** (classId, subjectId, teacherId+teacherName denorm, title, instructions, dueDate YYYY-MM-DD, optional fileUrl/fileName via A.9) + **ClassNote** (same shape, fileUrl REQUIRED). Both in TENANT_OWNED_MODELS. B.13 LMS will REUSE these models (submissions/grading added there).
- Permissions: NEW `portal.teacher` + `homework.assign` → TEACHER, CLASS_TEACHER, HOD, DEAN_OF_STUDIES. Leadership passes via SUPER/manual. PARENT/STUDENT/BURSAR 403 (verified live).
- **Teacher scoping rule (teacher-portal.service `teacherClassIds()`)**: a teacher "owns" a class when classTeacherId=them OR they appear on its timetable (teacherId on TimetableSlot). Fail-closed `["__none__"]` when neither (njoroge verified). Returns `null` for leadership = unrestricted oversight. THIS IS WIDER than B.1 scopeWhere (classTeacher only) — by design: subject teachers must assign homework to classes they teach but don't own.
- Service `src/lib/services/teacher-portal.service.ts`: teacherHome (class cards w/ student counts + subjects-I-teach from timetable + open-homework count + today's lessons Nairobi-day-aware), listHomework/createHomework (due-date-in-past 422)/deleteHomework (ONLY assigning teacher or leadership), listNotes/createNote/deleteNote, classReport (summary tiles + per-student 30d attendance % / absence count / latest-exam avg). TeacherPortalError mapped in respond.ts (404/403/422).
- Validation: `src/lib/validations/teacher-portal.ts` (homeworkCreateSchema, noteCreateSchema).
- APIs: GET /api/teacher (home), GET/POST/DELETE /api/teacher/homework, GET/POST/DELETE /api/teacher/notes, GET /api/teacher/timetable (reuses B.4 teacherTimetable — ticks "View own timetable"), GET /api/teacher/report?classId=.
- UI: /teacher page ("My classes") + `src/components/teacher/teacher-portal-client.tsx` — 4 pill tabs: Overview (today's lessons, class cards w/ one-tap Register→/attendance Marks→/exams Roster→/students?classId=, weekly timetable grid), Homework (list + Assign dialog w/ A.9 FileUpload attachment), Notes (upload+download), Class report (tiles + student table w/ red/amber absence badges). All 4 UX states. Nav: "My Classes" (icon School, permission portal.teacher) in Overview section.
- **students-client now reads ?classId= deep-link** (pre-filters roster) — added alongside existing ?new=1 handler.
- **Family portal (B.10/B.11) EXTENDED**: childDetail() += homework[] (due/overdue flag) + notes[]; parent-portal-client += "Homework" + "Class notes" cards (Download buttons). TICKED: B.10 "View homework", B.11 "View assignments" + "Download notes" (all previously BLOCKED on B.12).
- Seed: 1 homework (KLB Bk 3 Quadratics, due +7d) + 1 class note (real tiny PDF written into `.uploads/tenants/<id>/notes/` so portal download works) by Chebet for F2E. Seed reset block now ALSO deletes homework/classNote/timetableSlot/lessonPlan before schoolClass deleteMany (they're class-bound — previously 56 orphan slots accumulated across reseeds; FIXED).
- LIVE-TESTED service (`scripts/teacher-portal-test.ts`, all ✓): scoping (chebet 1 class / njoroge fail-closed / principal null), home aggregates, own timetable 2 slots, homework create→parent portal sees it, njoroge assign-to-F2E blocked, past dueDate 422, cross-teacher delete blocked, notes create/delete scoping, classReport (3 students · 82% att · CAT 1 mean 64%) + njoroge 403, principal sees all. HTTP-verified same via curl (login jars) incl. parent PDF download (%PDF bytes) + parent POST homework 403.
- Screenshots 65 (overview), 66 (homework tab), 66b (assign dialog), 67 (class report), 68 (family portal homework+notes, mobile 360px) — all QA'd. Note: dialogs close via ✕ button not Escape (script uses getByLabel("Close")).
- "Lesson plans (AI assist)" = [~]: plans live at B.4 /academics (linked from /teacher footer); AI at B.23.
- tsc clean, build clean (/teacher 9.04kB + 4 APIs), test:roles 24/24.
- GOTCHA REMINDERS hit again this session: node_modules wiped (npm install + prisma generate first), exam/invoice orphans after class reseed (cleared examResult/exam/invoice/feeStructure/attendanceRecord then reseeded — 0 orphans verified).

## ⏭️ NEXT: B.13 — LMS (strict list order)
Lines: Notes upload (PDF, DOC — ClassNote EXISTS, extend types/.doc + tick), Quizzes with auto-grade (NEW), Assignments + submissions (Homework EXISTS — add Submission model + grading), Discussion forums (NEW), Video lessons (streaming — likely defer pending R2/storage), Live online classes (WebRTC — defer pending infra), AI tutor (B.23-flag).


## 🔁 CHAT-TRANSFER RESUME (2026-06-11, new chat)
- Project recovered via founder's GitHub repo `elvisybadbunny-bit/workspace-019eb68a-...` (public clone -> founder makes private after). Repo root contained `neyo/`, `docs/`, `screenshots/` — moved `neyo/` to `/home/user/neyo`. `.env` was correctly NOT in git -> recreated (DATABASE_URL sqlite, NEW random NEYO_MASTER_KEK, APP_BASE_URL). NOTE: new KEK = any DEK-encrypted secrets from the old sandbox (e.g. seeded payment creds) won't decrypt; seed re-provisions DEKs — irrelevant for dev, fine.
- Restored + verified: npm install ✓, migrate dev ✓ (incl migration b1_students), db:seed ✓, typecheck ✓, test:roles 24/24 ✓, npm run build ✓, live login as principal + /api/students returns seeded students ✓.
- DISCOVERY: the previous chat had built MOST of B.1 *after* the last anchor was written (migration b1_students, student.service, validations, 8 API routes, students list + profile + classes UIs, seed: 2 classes/5 students/guardians/1 PARENT login).

## ✅ B.1 AUDIT RESULTS (live-tested this turn — scripts/b1-audit{,2,3}.ts kept as regression scripts)
- A.3.8 TEACHER row-scoping: DONE — scopeWhere() (student.service) limits TEACHER/CLASS_TEACHER to classes where classTeacherId=user.id, fail-closed ("__none__" when no class). VERIFIED: teacher f.chebet sees only 3 Form 2 East students, zero leakage, `q` filter cannot widen scope (scope ANDed with filters).
- A.3.9 PARENT row-scoping: DONE — scopeWhere() via Guardian(userId)->StudentGuardian links, fail-closed. VERIFIED: parent sees exactly 1 child (Achieng Mary Otieno); direct getStudent() on another child BLOCKED.
- TICKED in checklist: A.3.8, A.3.9, and B.1 lines: registration, profile, NEYO login ID (optional createLogin), admission no (KH-S-000NNN atomic — verified 000006/000007), edit w/ audit diff (action `student.update`, metadata.changes), documents storage, + G.9 per-student requirements tracking (8 seeded from master at create; fulfilled toggle works).
- Soft-delete: student deletes are soft (deletedAt), hidden from lists, restorable — G.6 pattern applied ("student" in SOFT_DELETE_MODELS).
- Audit action names: student.create / student.update / student.delete. AuditLog columns: actorName/entityType/entityId/metadata (no "detail").
- Guardian input uses fullName (not name); listStudents include guardians -> nested {guardian:{...}} shape.

## ✅ B.1 BULK IMPORT: DONE (built + live-tested this turn)
- DB (migration b1_bulk_import): StudentImport (fileName, source csv|xlsx|paste, totalRows/createdRows/failedRows, errorRows JSON, createdBy*). In TENANT_OWNED_MODELS.
- Validation: src/lib/validations/student-import.ts — IMPORT_FIELDS (incl fullName convenience + ignore), HEADER_SYNONYMS (EN+Swahili: jina/simu/mzazi/darasa...), MAX_IMPORT_ROWS=1000, importPreviewSchema/importCommitSchema/importedRowSchema.
- Service: src/lib/services/student-import.service.ts — detectDelimiter (tab beats comma -> Sheets paste = TSV), parseDelimited (RFC-4180 quotes/CRLF), parseXlsx (exceljs, Date cells -> YYYY-MM-DD, formula .result), autoMapColumns (2-PASS: exact synonym matches FIRST then fuzzy-contains — GOTCHA: 1-pass fuzzy mis-mapped "Parent Phone"->guardianName), buildCandidates (fullName split, gender M/F/male/boy/mvulana..., date 14/03/2010 KE day-first or ISO, normalizeKePhone returns null not throw), previewImport (class resolution, in-file dupes by name+dob, possible-existing vs DB), commitImport (skipInvalid or ABORT, auto-CREATES unknown classes [last word=stream heuristic], admissionNo kept if provided else nextTenantId atomic, guardian REUSED by phone -> siblings share one Guardian, G.9 requirements seeded from master, per-row failure capture, StudentImport history row, audit student.bulk_import), listImports. ImportError -> respond.ts 422.
- API: POST /api/students/import/preview (multipart file OR JSON text/rows; re-preview with adjusted mapping), GET+POST /api/students/import (history / commit). All requirePermission("student.create") — note BURSAR does NOT have student.create (verified 403; principal/registrar do).
- UI: /students/import (requirePagePermission student.create) + components/students/import-wizard.tsx — 3-step (Upload .csv/.xlsx OR paste-from-Sheets textarea / mapping chips w/ per-column select + re-preview + sample table + issues panel + skip-invalid checkbox / result card w/ failed-row reasons) + Recent imports history card. All 4 UX states. "Import" button added on /students header (canCreate).
- LIVE-TESTED (scripts/import-test.ts kept as regression): messy CSV 5 rows -> preview total5/valid4/invalid1 (gender X, bad date, bad phone all flagged w/ row numbers), commit created 4 + 1 failed w/ reason; Brian KH-S-000NNN; Kevin+Brian share guardian (reused by phone ✓); "Grade 4 Blue" class auto-created ✓; history + audit rows ✓. HTTP as principal: paste-TSV preview -> commit 2 created -> /api/students?q finds them -> history shows "by Wanjiru Kamau"; teacher preview 403 ✓. Test students cleaned up after. tsc clean, build ✓ (/students/import 7.15kB), test:roles 24/24.

## ✅ B.1 SEARCH GAPS: DONE (built + live-tested this turn)
- listStudents (student.service): q now also matches guardian phone — digit-detection regex builds candidate set {raw, 0->+254, 254->+254, bare 7/1 -> +254} and ORs `guardians.some.guardian.phone contains` each. Fragments work ("0712223" finds the child). Name/adm search unchanged.
- search.service (A.11): NEW optional `user?: SessionUser` param on search()/typeahead(). Students block runs ONLY when user passed AND can(role,"student.view"); applies scopeWhere(user) (A.3.8/9 row-scoping NOW EXPORTED from student.service) ANDed with name/adm/guardian-phone OR. Hit: type "student", subtitle "KH-S-000001 · Form 2 East", href /students/[id]. Both routes (/api/search + /api/reception/search) now pass user.
- ⌘K palette: GraduationCap icon for student type. APP_COMMANDS += new-student (/students?new=1), import-students (/students/import), view-students — all permission-filtered. students-client reads ?new=1 -> opens NewStudentDialog -> history.replaceState clean URL.
- LIVE-TESTED (scripts/search-test.ts kept as regression): phone in 4 formats finds child in list ✓; ⌘K "Achieng" -> student hit w/ deep-link + person hit (bursar) ✓; ⌘K by phone ✓; PARENT search other child -> NO student hit ✓; TEACHER search outside own class -> blocked ✓; cross-tenant (Uhuru) -> 0 Karibu students ✓; search() without user -> students gated out ✓. HTTP verified same via /api/search as principal + parent. tsc ✓, build ✓, test:roles 24/24 ✓.

## ⏭️ REMAINING B.1 WORK (build NEXT, in this order):
3. **Stream filter `[~]`**: explicit stream facet (SchoolClass.stream) in filter bar.
4. **Transfer management `[ ]`**: transfer workflow (mark TRANSFERRED + destination school + date + docs note; audit).
5. **Alumni management `[ ]`**: GRADUATED view/directory (filter + simple alumni page section).
6. THEN -> B.2 Admissions (links A.18.6 inquiries) or B.3 Attendance (founder choice; B.3 wires G.2 offline queuedPost).
- Bulk import (PDF/photo/WhatsApp universal) stays deferred until AI layer (B.23).
- G.10 doc set: student ID card PDF should come when B.1 polish or B.7 docs land (use getSchoolProfile() branding).

## REPO / GITHUB STATE
- Founder's GitHub: repo `workspace-019eb68a-ba58-76f2-914d-2adcd8eea8bd` under user `elvisybadbunny-bit` (told to make PRIVATE after our clone). Future code-transfer between chats: founder re-uploads/pushes; we clone.
- Local git in /home/user/neyo is the clone; remote origin points at the public URL (will 404/auth-fail once private — that's fine, we don't push from sandbox).

## FOUNDER FEEDBACK (2026-06-11) handled this turn + tracked:
- "Mobile dashboard is white" → ROOT CAUSE: /settings had NO page.tsx → the "Settings" nav link 404'd (the blank/white page). Dashboard mobile itself is fine (warm-white bg, correct). FIXED by building /settings hub.
- Added founder-requested blocks to FEATURES-CHECKLIST: **G.9** School Profile/Branding/Joining-requirements (mostly DONE this turn), **G.10** Document set + external cloud-print seam (TODO across B-modules), **G.11** Public subdomain landing site (Tenri-style) — BUILD LAST, ON FOUNDER SIGNAL (spec recorded). Printing = founder wants BOTH download/email PDFs AND external print-shop seam.

## G.9 School Profile & Branding: DONE (5/7 lines; 2 deferred to B.1/B-modules)
- DB (migration g9_school_profile): Tenant += motto, vision, mission, about, logoUrl, brandPrimary, brandAccent, addressLine, socialLinks(JSON), joiningRequirements(JSON array of {label,category,quantity?,mandatory}).
- Validation: src/lib/validations/school-profile.ts (schoolProfileSchema, joiningRequirementSchema cat=uniform|books|supplies|fees|documents|other, socialLinksSchema). Service: src/lib/services/school-profile.service.ts (getSchoolProfile/updateSchoolProfile, JSON parse helpers, audit school.profile.update). API: GET/PUT /api/school-profile (requirePermission tenant.manage_settings).
- UI: /settings (NEW hub page — fixes 404, permission-filtered cards incl School Profile first). /settings/school = SchoolProfileEditor client (logo FileUpload reusing A.9, brand colour pickers <input type=color>+hex, vision/mission/about textareas, contacts+5 socials, joining-requirements editor [add/remove/category/qty/required toggle], sticky Save). Nav: "School Profile" (icon Building2) added to SYSTEM section; also "Settings" hub now real.
- Seed: Karibu High profile (motto "Elimu ni Mwanga — Knowledge is Light", vision/mission/about, brand #1c2740/#1f9d5f, address, socials) + 8 joining requirements (uniform/books/supplies/documents/fees). Made the A.18 cash-payment seed idempotent (deleteMany mpesaRef CASH-SEED0001 first — was crashing reseed on unique constraint).
- VERIFIED: tsc clean, build ✓ (/settings 185B real page, /settings/school 6.49kB), test:roles 24/24, API GET/PUT round-trip works (motto+reqs), reseeded after test. Screenshots: m3-settings-hub.png (mobile, fixes the white page), 24-school-profile.png, 25-joining-reqs.png. Script: scripts/shot-school.ts removed; scripts/shot-mobile.ts removed.

## STILL TODO from founder asks:
- G.9: per-student joining-requirements tracking (issued/received) → DO AT B.1 admission. Document branding (logo/colours/motto on receipts/reports/ID) → as B-module docs are built (use getSchoolProfile()).
- G.10: standard doc set (fee statement/invoice/report card/ID card/transcript/admission letter) + download/email + external cloud-print provider SEAM → build alongside the owning B-modules (B.7 finance docs, B.1 ID cards, etc.).
- G.11: public subdomain landing site → LAST, on founder signal. Full spec in checklist (hero+image, about/vision/mission/stats, academics, news list+detail, gallery, leadership, testimonials, socials, contact+map, enroll→A.18.6 inquiry; image uploads via A.9; per-school SEO/OG so Google indexes subdomain; editable from Settings). Subdomain routing already exists (A.2 middleware) — landing renders on tenant subdomain WITHOUT app shell.

## 🎉 PART A (Platform Foundation) COMPLETE — A.1 through A.20 all done.
Remaining Part-A items are DEFERRED-pending-founder only: A.1 OAuth(4-6,13,14 Google/Apple/Microsoft creds), A.2.4 custom domain (DNS), A.3.8/A.3.9 TEACHER/PARENT row-scoping (BLOCKED until B.1 Student/Class models — DO THESE when B.1 lands), plus all "provide later" external keys (Daraja, SMS/AT, Resend, WhatsApp, VAPID, R2, Redis, Sentry/PostHog/BetterStack/Logtail, thermal printer). Everything buildable-without-creds is built + live-tested.

## A.20 Brand & Design: DONE (all 6 lines)
- NEW component: src/components/ui/table.tsx (TableContainer/Table/THead/TBody/TR/TH/TD — Odoo list-view primitive, align prop, dark mode). Completes the component-library line.
- NEW: src/components/brand/neyo-logo.tsx <NeyoLogo variant="full|mark|wordmark"> — inline SVG (renders in sandboxed preview), navy tile + white N + green leaf, wordmark uses currentColor. Wired into topbar (mark, replaced the plain "N" div) + login page (mark).
- Raster assets (generate_image) in public/brand/: bundi-mascot.png (scholarly navy owl + green grad-cap, mascot line), wordmark-light.png, wordmark-dark.png, pattern-tile.png, icon.png(256). Favicons: public/favicon.ico (16/32/48 via `magick ... -define icon:auto-resize`), favicon-16.png, favicon-32.png. Wired metadata.icons in src/app/layout.tsx.
- Design tokens: already in tailwind.config.ts (Chunk 0). Added `safelist` (regex bg-(navy|green)-(50..950) + bg-warm-(50..200)) so /brand swatches built from `bg-navy-${shade}` template literals render (Tailwind can't scan dynamic class names — GOTCHA recorded).
- /brand style-guide page: src/app/(app)/brand/page.tsx (requirePageUser — docs, any signed-in user) + src/components/brand/brand-showcase.tsx (client): logo lockups (inline + raster), Bundi, color swatches, pattern tile, full component library incl. Table, EmptyState, cultural-moments lookup table (KE_MOMENTS this year). Nav: "Brand" (icon Palette) in SYSTEM section.
- docs/BRAND.md: design DNA, tokens table, logo/icon/mascot/pattern inventory, component list, EDIT POINTS.
- VERIFIED: tsc clean, lint 0 errors, build ✓ (/brand 4.73kB), test:roles 24/24. Screenshots 21-brand-top.png, 22-brand-components.png, 23-brand-colors.png (swatches fixed). Scripts: scripts/shot-brand.ts.
- ESLint config from A.19 has `@next/next/no-img-element` OFF, so <img> in brand-showcase is fine.

## ✅ B.1 STREAM FILTER: DONE (this turn)
- studentFilterSchema.stream + StudentFilters.stream + listStudents `schoolClass: { is: { stream } }` + ?stream= in /api/students GET + "All streams" rounded-full select in students-client (derived: unique non-null streams from /api/classes, hidden when school has no streams). Live-tested: East 3/3 ✓, unknown stream 0 ✓, teacher row-scope still wins over filter ✓. tsc/build/test:roles all green. scripts/stream-test.ts kept.

## 🆕 PART G ADDITIONS (proposed + recorded this turn; founder said "free to add unique features"):
- G.12 Sibling Intelligence (family view, sibling badges, one-SMS-per-family saving ~40% SMS cost, sibling discount seam) — NEXT TO BUILD after B.1 completes (G.12.1+2 buildable now; SMS line wires A.7; discount at B.7).
- G.13 Mzazi Card (printable A6 QR slip per student: adm no + fee snapshot + paybill; QR -> live balance after guardian-phone challenge; feature-phone-first) — build alongside B.7 fees.
- G.14 Day-One Demo Mode (one-click sandboxed demo tenant, auto-expiring) — build pre-launch.
- G.15 Term Trends Pulse (Monday 7am digest to leadership via A.7 cascade + A.12 cron) — build after B.3 attendance + B.7 fees give it data.

## ✅ B.1 TRANSFER MANAGEMENT: DONE (this turn)
- DB (migration b1_transfers): StudentTransfer (destinationSchool/County, transferDate YYYY-MM-DD, reason, previousClassId [for undo], letterCode [idempotent verification], reversedAt, createdBy*). Student.transfers relation. In TENANT_OWNED_MODELS.
- Validation: transferStudentSchema + TRANSFER_REASONS (relocation|fees|boarding|discipline|other + free note) in validations/student.ts.
- Service (student.service): transferStudent (⚠️ ROW-SCOPED via scopeWhere — found in live-testing that CLASS_TEACHER could transfer students outside their class; FIXED + regression-tested), status->TRANSFERRED + classId=null (seat freed), dup transfer -> StudentError DUPLICATE, audit student.transfer. undoTransfer: reversedAt set, status->ACTIVE, previousClassId restored (skips if class deleted/archived), audit student.transfer_undone. activeTransfer(). getStudent now includes transfers (active only, take 1).
- Letter (G.10 doc set #1): documents/transfer-letter-pdf.tsx — A4, school brandPrimary colour + motto + address (G.9), particulars table, QR verify + ref TRF-XXXXXXXX, principal signature line. document.service.buildTransferLetterPdf: idempotent letterCode (re-download reuses verification), previous-class label fallback.
- API: POST/DELETE /api/students/[id]/transfer (student.edit), GET /api/students/[id]/transfer/letter (student.view + canViewStudent row-guard) -> application/pdf attachment.
- UI (student-profile-client): amber "Transferred out" banner (destination/date/reason + Transfer letter download + Undo w/ confirm), "Transfer out…" secondary button (hidden when already transferred), TransferDialog (destination/county/date/reason select/note, validates >=3 chars).
- LIVE-TESTED (scripts/transfer-test.ts kept, 16 assertions): transfer ✓ seat freed ✓ dup blocked ✓ %PDF + QR verifyDocument ✓ idempotent code ✓ audits ✓ undo restores exact class ✓ second undo blocked ✓ + HTTP: transfer/letter(200 application/pdf)/undo as principal; CLASS_TEACHER outside-own-class BLOCKED, own-class works. tsc/build/test:roles green. NOTE: f.chebet is CLASS_TEACHER (has student.edit); plain TEACHER lacks student.edit.

## ✅ B.1 ALUMNI MANAGEMENT: DONE (this turn) — 🎉 B.1 STUDENT MANAGEMENT COMPLETE (11/12; only "Bulk import PDF/photo/WhatsApp" deferred to B.23 AI)
- DB (migration b1_alumni): Student.graduationYear Int? + finalClassLabel String? (class label survives the freed seat).
- Service: updateStudent now stamps graduationYear=currentYear + finalClassLabel when status enters GRADUATED, clears both when leaving it. NEW listAlumni(user, year?) (row-scoped, groupBy year pills desc, 500 cap) + graduateClass(user, classId, year?) (row-scoped — CLASS_TEACHER only own class; bulk updateMany ACTIVE->GRADUATED + classId=null; audit student.class_graduated).
- API: GET /api/students/alumni?year= (student.view) + POST {classId, year?} (student.edit).
- UI: /students/alumni page + alumni-client.tsx — "All years"/"Class of YYYY · n" filter pills, alumnus cards (avatar/adm/Class-of badge/final class) linking to profiles, "Graduate a class" dialog (class picker w/ counts + year + preview line). All 4 UX states. "Alumni" button on /students header.
- LIVE-TESTED (scripts/alumni-test.ts kept, 11 assertions): year+label stamped ✓ directory+pills ✓ year filter ✓ un-graduate clears ✓ bulk 3/3 Class of 2030 ✓ class emptied ✓ audit ✓ class-teacher other-class BLOCKED ✓ restore ✓. HTTP: API+page 200. tsc/build(4.68kB)/test:roles green.

## ✅ B.3 ATTENDANCE CORE: DONE (first 4 lines, this turn — founder approved (a))
- DB (migration b3_attendance): AttendanceRecord (studentId, classId-at-marking, date YYYY-MM-DD Nairobi, status P|A|L|E, note, smsSentAt dedupe, markedBy*) @@unique([tenantId,studentId,date]) -> IDEMPOTENT upsert (offline replay = no-op). In TENANT_OWNED_MODELS.
- Validation: validations/attendance.ts (markRegisterSchema marks<=200 + notifyAbsent, registerQuerySchema, historyQuerySchema, ATTENDANCE_STATUSES).
- Service: attendance.service.ts — nairobiToday(), assertClassInScope (TEACHER/CLASS_TEACHER -> own classTeacherId only), getRegister (active students + marks merged), markRegister (filters marks to class students [defense], upsert each, audit attendance.marked w/ counts, optional notifyAbsentees), notifyAbsentees (primary guardian first, A.5 checkSmsQuota gate + recordUsage, smsSentAt dedupe, audit attendance.absent_sms), attendanceHistory (row-scoped: explicit student verified via scopeWhere else visible-set filter), attendanceOverview (per-class marked/present/absent/done; teachers see own only). AttendanceError mapped in respond.ts (404/403/422).
- API: GET /api/attendance (overview | ?classId= register), POST (attendance.record), GET /api/attendance/history. attendance.view incl PARENT/STUDENT; attendance.record = teachers+leadership (parent POST 403 verified).
- UI: /attendance page + components/attendance/attendance-client.tsx — date strip (◀ Today ▶, future disabled), overview cards (done=green present badge + absent count, in-progress amber), Register: one-tap status pill cycles P→A→L→E (green/red/amber/navy), default ALL PRESENT, sticky save bar w/ live counts + "SMS guardians of absentees" checkbox + offline indicator; SAVE = G.2 queuedPost("/api/attendance") -> "Saved offline — will sync" toast when queued. All 4 UX states; 360px-first.
- Seed: yesterday's registers for all 5 students (1 absent Kamau, 1 late "Matatu delay"), today left unmarked for demo.
- LIVE-TESTED (scripts/attendance-test.ts kept): teacher sees ONLY own class in overview+register (other-class 403) ✓ mark 3 (1 absent) ✓ absent SMS sent w/ correct KE text + quota counted ✓ re-mark idempotent (3 rows, no dups) ✓ SMS deduped ✓ parent history = own child only ✓ yesterday seed 5 rows ✓ HTTP: overview/register as chebet, parent POST 403, page 200. tsc/build(6.51kB)/test:roles green.
- B.3 REMAINING (later lines): hostel attendance (B.16 dep), teacher/support-staff attendance, analytics, QR/RFID/fingerprint/face (hardware/AI deferred).

## ✅ G.16 PROMOTION ENGINE + STREAM RESHUFFLE: DONE (this turn, founder approved)
- DB (migration g16_promotion): PromotionRun (kind promotion|reshuffle, summary, moves JSON = undo source-of-truth [{studentId, fromClassId, toClassId, graduated?, prevStatus?, prevGradYear?, prevFinalLabel?}], undoneAt). In TENANT_OWNED_MODELS.
- Service promotion.service.ts: parseLevel/nextLevel (KE: Form 1-3 -> +1, Form 4 -> graduate; Grade 1-8 -> +1, Grade 9 -> graduate; PP1 -> PP2 -> Grade 1; unknown -> null = SKIP never guess). promotionPlan (per-class from/to/students/toExists + unmapped list). commitPromotion (TOP-LEVEL-FIRST ordering so no student promoted twice; graduate path sets GRADUATED+year+finalClassLabel+classId=null [B.1 alumni]; destination classes auto-created same stream/curriculum; move-log; audit promotion.committed). reshufflePlan/commitReshuffle (level needs >=2 streams; strategies size|gender|alpha — round-robin deal, gender alternates; preview = per-stream count/B/G/moved flags; commit logs only actual moves; audit promotion.reshuffled). listRuns + undoRun (full reverse incl graduation reverts; double-undo CONFLICT; audit promotion.undone). PromotionError mapped (404/422).
- API: GET/POST /api/promotion, POST /api/promotion/reshuffle {level,strategy,commit}, POST /api/promotion/undo. ALL requirePermission("class.manage") — leadership only (CLASS_TEACHER denied, verified can()=false + HTTP 403).
- UI: /students/promotion (requirePagePermission class.manage) + components/students/promotion-client.tsx — 2 tabs: "New academic year" (plan table w/ graduates badge + will-be-created chips + unmapped warning + Class-of year input + 2-step confirm) / "Reshuffle streams" (level select [only multi-stream levels], strategy pills + disabled "By performance — coming with Exams" chip, preview cards w/ moved-highlights, Apply). Run history card w/ one-click Undo. "New year" button on /students header.
- LIVE-TESTED (scripts/promotion-test.ts kept, 14 assertions): parser ✓ plan(F4->graduate, F1 West->Form 2 West will-create) ✓ commit 5 promoted/2 graduated ✓ alumni fields ✓ class auto-created ✓ UNDO restores every classId+status exactly ✓ double-undo blocked ✓ reshuffle sizes balanced (2/2) ✓ gender commit + undo ✓ history both kinds ✓ teacher 403 ✓. HTTP: plan/page/403 verified. tsc/build(6.58kB)/test:roles green. Cleanup: test classes/students removed, empty leftover Form 3 East deleted (seed state restored: Form 2 East 3 + Form 1 West 2).

## 📌 FOUNDER DIRECTIVES (2026-06-11, late session — STANDING RULES):
0. **CHECKLIST POLICY (founder re-confirmed 2026-06-12 after questioning):** updating FEATURES-CHECKLIST.md is CORRECT and expected, in exactly this form: (a) tick [ ]->[x]/[~] only after live-tested full-stack, (b) append italic evidence note (what/where/test proof/screenshot #) — never altering the original line wording, (c) new feature blocks only in Part G and only when founder-requested or founder-pre-approved. NEVER delete lines, never untick, never build off-list. Founder explicitly chose "keep doing it this way".
1. **FOLLOW THE FEATURES LIST IN ORDER — NO SKIPPING.** B.1 done, B.3 first-4-lines were an approved exception; from here: B.2 Admissions is NEXT, then resume B.3 remaining lines, B.4, B.5... in checklist order. Part G items only when founder approves explicitly.
2. **GENERATE SCREENSHOTS every feature** (founder wants to SEE how it looks). Series in /home/user/screenshots: old chat ended at 28; this chat added 29-38 (29 students toolbar, 30 import step1, 31 import preview [mapping+issues+badges], 32 alumni, 33 promotion plan, 34 reshuffle tab, 35 attendance overview, 36 attendance one-tap register [Absent red pill], 37 transfer banner, 38 ⌘K student search). Visually QA'd: 31/33/36/38 confirmed production-grade; teacher sidebar correctly filtered in 36.
- Screenshot env: playwright chromium + apt libs reinstalled this session (node_modules NOT snapshotted — rerun `npx playwright install chromium` + the apt-get line from ENV section). Script pattern: scripts/shot-new-features.ts (login via fetch within page.evaluate, domcontentloaded + fixed waits; NEVER networkidle [SSE hangs]). GOTCHA: tsx can't run scripts from /tmp (module resolution) — keep shot scripts inside neyo/scripts/.

## ✅ B.2 ADMISSIONS: COMPLETE (all 9 lines, this turn)
- DB (migration b2_admissions): AdmissionApplication (applicationNo KH-ADM-NNNNNN unique/tenant, status state-machine, applicant+guardian fields, interview date/time/calendarEventId, depositRequired/PaidKes/At/Ref, decisionNote, letterCode, studentId @unique, inquiryId, source online|walk_in|inquiry). In TENANT_OWNED_MODELS.
- Validation: validations/admission.ts (applySchema w/ kePhone [reception.ts kePhone now EXPORTED], decisionSchema w/ action enum). GOTCHA fixed: service ALSO normalizes guardianPhone (defense vs Zod-bypassing callers — convertInquiry path).
- Service admission.service.ts: submitApplication (PUBLIC, dup guard child+phone open-app 409), convertInquiry (A.18 -> application, inquiry CONTACTED, "Pending Name" split, gender placeholder M for staff to fix in review), decide() w/ TRANSITIONS map (invalid-state 422): review/schedule_interview (creates A.17 calendar event type=meeting)/offer(depositRequiredKes)/waitlist/reject/withdraw/record_deposit(OFFER only)/admit (BLOCKS if deposit unpaid; creates B.1 student via createStudent w/ guardian+G.9 reqs+optional classId; links studentId; inquiry -> ENROLLED). pipeline(). buildAdmissionLetterPdf (documents/admission-letter-pdf.tsx: OFFER vs ADMITTED wording, deposit para, joining-requirements box, QR idempotent). AdmissionError mapped 404/409/422.
- API: POST /api/admissions/apply (PUBLIC, rate-limited 10/h/IP enforceRate(key,limit,windowSec — NOTE seconds not ms), tenant via resolveTenantSlug({host,searchTenant,headerTenant})), GET/POST /api/admissions (+?inquiry= convert) + POST /api/admissions/[id] (decide) + GET /[id]/letter — staff routes student.create (CLASS_TEACHER 403 verified).
- UI: /admissions (nav "Admissions" UserPlus, moduleKey students, permission student.create) — Kanban board APPLIED/REVIEW/INTERVIEW/OFFER/WAITLIST + closed strip + inquiry banner w/ "Start application" + walk-in dialog + right-side AppDrawer (stage-aware actions: review/interview date+time/offer w/ deposit/record deposit/admit w/ class picker + disabled-until-deposit + letter download + open student profile). PUBLIC /apply (auth layout, school name from subdomain, success card w/ application no).
- Seed: 3 applications (Baraka APPLIED online, Zawadi REVIEW walk-in, Collins OFFER deposit 2000/5000).
- LIVE-TESTED (scripts/admissions-test.ts kept, 13 assertions): apply ✓ dup 409 ✓ interview->calendar event ✓ admit blocked before deposit ✓ deposit->admit-> student created (guardian +254 ✓ after fix, 8 reqs) ✓ re-admit blocked ✓ letter %PDF + QR ✓ inquiry convert + CONTACTED ✓ board ✓. HTTP: public apply 200 w/ ?tenant= override, teacher 403. Screenshots 39-apply-public, 40-admissions-board (inquiry banner + deposit progress visible), 41-admissions-drawer (Admit disabled w/ amber deposit warning) — QA'd ✓. tsc/build(7.33kB + /apply 3.27kB)/test:roles green.

## ✅ B.3 REMAINING BUILDABLE LINES: DONE (this turn) — B.3 now complete except hostel(B.16-blocked) + 4 hardware-deferred
- DB (migration b3_staff_attendance): StaffAttendance (userId/userName/role denorm, date Nairobi, clockInAt/clockOutAt) @@unique(tenant,user,date). In TENANT_OWNED_MODELS.
- Service staff-attendance.service.ts: CLOCKING_ROLES (13 staff roles — NOTE roles are DEAN_OF_STUDIES + HOSTEL_MASTER, there is NO "SECURITY"/"DEAN" role), clockIn/clockOut (self-service, double 422 ALREADY/NOT_CLOCKED_IN), staffDaySheet (mine + sheet when staff.view; presentCount/expected), attendanceAnalytics(windowDays 7-60): trend [date,pct,marked] P+L=in-school, classesToday, chronic (3+ absences, top 20, links), anomalies (class-day pct 25+ pts below class window avg, min 6 records + 3/day). GOTCHA: .filter(Boolean) doesn't narrow TS types — use flatMap (build failed on it; also note `npm run build` typechecks scripts/ too, so test scripts must be type-clean).
- API: GET/POST /api/attendance/staff (requireUser; sheet only when can(staff.view)), GET /api/attendance/analytics?days= (attendance.view). StaffAttendanceError -> 422.
- UI: AttendanceTabs (Class registers · Staff · Insights[hidden for PARENT/STUDENT]) wraps the B.3 register client. StaffAttendanceTab: clock card ("Clocked in at 07:58" / Clock in/out buttons / "Day complete") + leadership day-sheet (n/m in badge). InsightsTab: trend bar chart (green>=90/amber>=75/red), per-class progress bars, chronic list w/ profile links, amber anomaly cards ("Worth a phone call?"). All 4 UX states.
- Seed: 10 weekdays history (Kamau absent every 3rd day -> chronic; day-3 anomaly Form 2 East mostly absent) + 3 staff clock-ins today (principal/deputy/receptionist 07:45-08:15).
- LIVE-TESTED (scripts/staff-att-test.ts kept): clock in/out ✓ doubles 422 ✓ sheet 4/8 ✓ parent canClock=false ✓ trend 9 weekdays-in-14 ✓ Kamau chronic(3) ✓ anomaly Form 2 East 0% vs 81% ✓. Screenshots 42-staff-attendance, 43-attendance-insights (QA'd ✓ — trend bars + follow-up + anomaly all visible). tsc/build(/attendance 8.67kB + 2 new APIs)/test:roles green.
- Screenshot GOTCHA: page.click("text=X") can hit ⌘K palette items (palette opens on stray clicks. Topbar search?) — use page.locator("button",{hasText:/^X$/}).first().click() + press Escape before screenshots.

## ✅ G.17 GPS-VERIFIED STAFF CLOCK-IN: DONE (founder-requested this turn, all 4 lines)
- DB (migration g17_gps_clockin): Tenant.gpsLat/gpsLng/gpsRadiusM (null=off) + StaffAttendance.gpsVerified/gpsLat/gpsLng/gpsDistanceM.
- Service: distanceMetres() Haversine (sanity-checked CBD->Westlands 3008m). clockIn(user, gps?): fence ON => no gps -> 422 GPS_REQUIRED; too far -> 422 OUT_OF_RANGE w/ human distance ("You are 3.0 km from school — clock-in only works within 300 m of the gate."); in range -> gpsVerified=true + distance stored + audited. Fence OFF => works as before (unverified). staffDaySheet returns geofenceOn/gpsRadiusM + per-row gpsVerified/gpsDistanceM.
- API: POST /api/attendance/staff accepts optional lat/lng (Zod -90..90/-180..180).
- UI: settings/school-profile-editor.tsx NEW geofence card (lat/lng/radius inputs + "Use my current location" navigator.geolocation helper + green "Geofence on · 300 m" badge; save sends ""=off). staff-attendance-client: getGps() helper (enableHighAccuracy, 10s timeout), clock-in attaches GPS when geofenceOn (blocks w/ toast if denied), "GPS required (300m)" pill + "location verified" on clock card, green 📍 verified badge per day-sheet row w/ distance tooltip.
- Seed/dev state: Karibu geofence LEFT ON at -1.2921,36.8219 r=300 (Nairobi CBD) — demo realism. Playwright can grant geolocation: newContext({geolocation:{...}, permissions:["geolocation"]}).
- LIVE-TESTED (scripts/gps-test.ts kept, 7 assertions): Haversine ✓ fence-off-no-GPS allowed-unverified ✓ fence-on-no-GPS GPS_REQUIRED ✓ 3km OUT_OF_RANGE w/ km message ✓ at-gate verified 61m ✓ row stores coords ✓. Screenshots 44-gps-clockin (clocked in + "location verified ✓" toast, QA'd) + 45-geofence-settings. tsc/build/test:roles green.
- NOTE: browser geolocation needs HTTPS in production (localhost OK in dev) — already satisfied by Vercel deploy.

## ✅ B.4 ACADEMICS: DONE (9/11 lines; course-mgmt + university deferred-flagged)
- DB (migration b4_academics): Department (name unique/tenant, hodId), Subject (code unique/tenant, curriculum, departmentId, archived), AcademicTerm (year+term unique, current), TimetableSlot (@@unique(tenant,class,day,period) + teacher index), LessonPlan (teacher-owned, status PLANNED|TAUGHT|SKIPPED). All in TENANT_OWNED_MODELS.
- Validation: validations/academics.ts — subject/department/term(refine end>start)/slot/autoFill/lessonPlan schemas + KE_SUBJECT_PRESETS (real CBC 9 + 8-4-4 12 subject sets).
- Service academics.service.ts: departments CRUD (dup 409, HOD name resolution), subjects CRUD + addSubjectPreset (skips existing codes), terms upsert (current flag clears others) + currentTerm(tenantId) FOR B.5/B.7 REUSE, getTimetable/teacherTimetable (B.12 reuse), setSlot w/ TEACHER DOUBLE-BOOKING detection (same teacher+day+period any class -> CONFLICT w/ human message), clearSlot, autoFill GREEDY (pass1 one-per-day, pass2 doubles; school-wide teacher busy-map; returns placed/unplaced — never overplaces), lesson plans (teachers OWN-scoped list/create/status, leadership all, FORBIDDEN on others' plans). AcademicsError -> 404/409/403/422.
- API: /api/academics/{subjects,subjects/[id],departments,terms,timetable,lesson-plans}. GET=academics.view, mutations=academics.manage EXCEPT lesson-plans POST/PATCH=academics.view (own-scoped in service).
- UI: /academics 5 tabs (Subjects [presets buttons + table], Departments [card grid + inline add], Terms [list + editor w/ current checkbox], Timetable [class picker + 8x5 grid, click-cell modal w/ subject+teacher+clear, Auto-fill dialog w/ per-subject load+teacher + 40-period cap], Lessons [table w/ status select + plan dialog]). All 4 UX states.
- Seed: 4 departments, 9 8-4-4 subjects w/ depts, 3 terms (T2 current), 8 timetable slots F2E (MAT=Chebet Mon P1+Tue P2), 1 lesson plan (Chebet, "Quadratic equations — completing the square", KLB Bk 3 ref).
- LIVE-TESTED (scripts/academics-test.ts kept, 13 assertions): subjects+dup 409 ✓ terms+current ✓ slots 8 ✓ teacherTimetable MAT-only ✓ DOUBLE-BOOKING BLOCKED ✓ autofill 12/12 avoiding Chebet's busy periods ✓ MAT 1-per-day spread ✓ lesson own-scope + others-blocked 403 ✓. Screenshots 46-subjects, 47-timetable (recaptured w/ populated F2E — select class FIRST, default was empty F1W), 48-terms. tsc/build(9.36kB + 6 APIs)/test:roles green.

## 📌 G.18 RECORDED (founder spec 2026-06-11): Whole-school timetable generator — BUILD LATER ON FOUNDER SIGNAL. Full spec in checklist G.18: per-level subject needs config, teacher-subject-class matrix, co-curricular/games/PE/assembly blocks reserved first, one-click whole-school constraint solve (all classes at once, conflicts impossible), per-teacher view + publish notification (A.7), per-class printable A4 (G.9 branding) + student portal view (B.11), versioned regeneration w/ undo. Foundation already exists: TimetableSlot model, setSlot clash detection, autoFill per-class greedy, teacherTimetable(). When building: extend autoFill to multi-class solver (iterate classes by constraint-tightness, backtrack on dead ends).

## ✅ B.5 EXAMINATION CORE: DONE (9/14 lines; transcripts/progress/per-teacher analytics need multi-term data; KCSE+photo-grading = B.23 AI)
- DB (migration b5_exams — NOTE: node_modules+playwright cache were wiped this session, reinstalled npm install + npx playwright install chromium + apt libs): Exam (year/term/type/maxMarks/published), ExamSubject (@@unique exam+subject), ExamResult (@@unique exam+student+subject — idempotent target). In TENANT_OWNED_MODELS.
- NEW PERMISSIONS: exam.view + exam.manage added to catalogue + ACADEMICS_FULL + HOD/TEACHER/CLASS_TEACHER (view) + PARENT/STUDENT (view — published gate in service). exam.manage added to WRITE_PERMISSIONS (session.ts). test:roles still 24/24.
- Validation: validations/exams.ts — examSchema (subjectIds 1-20), marksSchema (marks 0-200 nullable=clear), cbcLevel (EE>=80/ME>=65/AE>=50/BE), grade844 (KNEC A..E bands).
- Service exam.service.ts: listExams/createExam/publishExam (audited), getMarksSheet (subject-mapped check + scopeWhere row-scoping — teacher own classes ONLY), saveMarks (idempotent upsert, over-max INVALID, null deletes, allowed-set defense), examSummary (per-student totals -> overall + class positions w/ shared ties, positions over FULL cohort then filtered to visible — parent sees own child w/ true position; class means + subject means; curriculum picks CBC/8-4-4 grading), studentReport (PARENT/STUDENT blocked unless exam.published). ExamError -> 404/403/422.
- Report card (G.10 #3): documents/report-card-pdf.tsx (G.9 branding, grade-coloured table, summary boxes, position/cohort, remarks, QR) + buildComment rule-based remarks (CBC vs 8-4-4 phrasing; B.23 AI swap point) + document.service.buildReportCardPdf (verification code RPT-XXXXXXXX).
- API: GET/POST /api/exams, GET/POST /api/exams/[id] (summary / publish toggle), GET/POST /api/exams/marks (sheet/save), GET /api/exams/[id]/report/[studentId] (PDF).
- UI: /exams (nav "Exams" ClipboardList under academics module) — exams list w/ draft/published badges -> detail: Results tab (means badges strip, ranked table w/ pos/class-pos/total/avg/grade badge/PDF link, Release results / Unpublish button) + Enter marks tab (class+subject pickers -> autosave grid w/ per-student number inputs, saved-at indicator, Save now). All 4 UX states.
- Seed: "CAT 1 — Term 2" published, 5 subjects × 3 F2E students = 15 marks (Achieng 85% EE top, Kamau 64% AE, Atieno 47% BE).
- LIVE-TESTED (scripts/exam-test.ts kept, 14 assertions): grading fns ✓ teacher own-sheet + F1W blocked ✓ autosave update + over-max 422 ✓ positions monotonic w/ ties ✓ class mean 65%/MAT 74% ✓ parent own-child-only + TRUE cohort position ✓ unpublished blocked for parent / published OK ✓ PDF %PDF + QR ✓. Screenshots 49-exam-results (QA'd — positions/grades/means/PDF links visible), 50-marks-entry. tsc/build(7.5kB + 4 APIs)/test:roles green.

## ✅ B.5 FOLLOW-UPS (founder feedback, this turn):
1. MARKS-ENTRY ALIGNMENT BUG FIXED — shared <Input> has a w-full wrapper div that stretched over student names (screenshot 50 showed inputs covering adm nos). Fix: raw <input> w/ w-20 shrink-0 inline classes in the marks grid. LESSON: never use the shared Input inside flex list rows — its wrapper is w-full by design.
2. INTER-STREAM + CLASS-LEVEL COMPARISON ADDED — examSummary now returns classMeans (ranked, w/ rank field + student counts, computed over FULL cohort not just visible rows) + levelMeans (level aggregated across streams). UI: "Stream comparison" card (rank badges + green/amber/red bars) + "Overall by class level" card on Results tab. Live-tested w/ 2 streams (F2E 65% #1 vs F1W 48% #2; levels both present); screenshots 50 (fixed) + 51 re-captured + QA'd. Ties verified visible in table (two pos-3 students).

## ✅ B.6 CBC MANAGEMENT: COMPLETE (all 6 lines, this turn)
- DB (migration b6_cbc): CbcStrand (subjectId+name unique/tenant, learningOutcome) + CbcAssessment (APPEND-ONLY history: studentId/strandId/level 1-4/comment/date/teacher). In TENANT_OWNED_MODELS.
- Validation: validations/cbc.ts — strandSchema/assessSchema (level 1-4 nullable=skip), LEVEL_LABELS (code/label/PARENT-FRIENDLY line per level), KICD_STRAND_PRESETS (real outcomes: ENG 4 strands, KIS 3 in Kiswahili, MAT 4, ISC 3, SST 3).
- Service cbc.service.ts: listStrands/createStrand (dup 409)/addStrandPreset; getAssessSheet (scopeWhere row-scoped, latest level per learner shown); saveAssessments (CREATES rows — history preserved, latest used in profiles; allowed-set defense); studentCompetencies (latest-per-strand, grouped by subject, avgLevel + overall code, parentFriendly lines). CbcError -> 404/409/403.
- KICD PDF (G.10 #4): documents/cbc-report-pdf.tsx ("COMPETENCY BASED ASSESSMENT REPORT", per-area blocks, level colours EE green/ME blue/AE amber/BE red, rubric legend strip, parent lines w/ teacher quotes, QR) + document.service.buildCbcReportPdf (CBC-XXXXXXXX codes).
- API: /api/cbc/strands (GET view/POST manage+preset), /api/cbc/assess (GET/POST exam.enter_marks), /api/cbc/report/[studentId] (exam.view; ?format=pdf).
- UI: /cbc (nav "CBC" Layers icon, academics module) — Strands tab (grouped by area, KICD preset buttons per eligible subject, obs counts), Assess tab (class+strand pickers, outcome banner, ONE-TAP rubric pills w/ "last: AE on date" context, Record N observations), Learner report tab (typeahead search -> profile cards w/ overall badges + parent-friendly lines + KICD PDF button).
- Seed: English (CBC) ENGC + 3 KICD strands + 9 observations across 3 learners (one teacher comment "Confident narrator during oral work").
- LIVE-TESTED (scripts/cbc-test.ts kept, 11 assertions): strands+dup 409 ✓ teacher own-class sheet + other blocked ✓ HISTORY kept (3->6 rows) ✓ profile uses LATEST level ✓ parent-friendly line ✓ parent other-child blocked ✓ PDF %PDF + QR ✓. Screenshots 52-cbc-strands + 53-cbc-assess (QA'd — rubric pills + last-observation context visible). tsc/build(7.03kB + 3 APIs)/test:roles green.

## ✅ B.7 FINANCE PART 1: DONE (5 lines this turn — structures/batch/manual/offline-pay/aging)
- DB (migration b7_fees_invoices): FeeStructure (level+year+term unique) + FeeItem + Invoice (invoiceNo unique/tenant via A.4 "INVOICE"->KH-INV-NNNNNN, totalKes/paidKes/status UNPAID|PARTIAL|PAID derived, dueDate, structureId?). In TENANT_OWNED_MODELS.
- Service finance.service.ts: listStructures/createStructure (dup 409); batchInvoice (level-matching ACTIVE students, IDEMPOTENT — skips already-invoiced from same structure); createManualInvoice; applyPaymentToInvoice (ledger move w/ status transition — Part 2 wires M-Pesa onto this); listInvoices (scopeWhere — PARENT own-child verified; q filter name/inv/adm); arrearsAging (Nairobi-today buckets current/1-30/31-60/60+, totals, collectionRate). FinanceError -> 404/409/422.
- API: /api/finance/structures (GET view / POST manage_structure / POST {batch:true} create_invoice), /api/finance/invoices (GET ?status&q&aging=1 / POST manual / PATCH ?id= record_payment).
- UI: /finance page (was 404 — nav existed since Chunk 0!) — FinanceClient tabs: Overview (3 StatCards + aging bucket bars amber/orange/red), Invoices (search + status filter + table w/ balance red + Pay dialog prefilled), Fee structures (cards w/ itemised list + "Invoice the level" batch dialog), "M-Pesa payments ↗" link to A.6 page. All KES-formatted, 4 UX states.
- Seed: Form 2 structure (Tuition 18,500 + Boarding 12,000 + Activity 2,500 = KES 33,000) + 3 invoices: Achieng PAID, Kamau PARTIAL 15k/33k due-20d (d30 bucket), Atieno UNPAID due-65d (d90 bucket).
- LIVE-TESTED (scripts/finance-test.ts kept, 12 assertions): dup structure 409 ✓ batch idempotent (0 created/3 skipped) ✓ UNPAID->PARTIAL->PAID ✓ aging buckets 18k/33k + outstanding 51k + rate 49% ✓ parent own-child-only ✓ search ✓. Screenshots 54-finance-overview (QA'd — aging bars + bursar's filtered sidebar visible), 55-finance-invoices, 56-fee-structures. tsc/build(8.15kB + 2 APIs)/test:roles green.

## ✅ B.7 FINANCE PART 2: DONE — B.7 COMPLETE except bank integration (deferred, founder bank APIs)
- DB (migration b7_part2): Payment.invoiceId (links A.6 payments to invoices) + Invoice.discountKes/discountReason/reminderSentAt.
- Service: stkForInvoice (balance-guarded, links payment, A.6 initiateStkPush — mock in dev), onPaymentPaid HOOK (called from payment.service.handleCallback on PAID: applies amount to invoice ledger w/ effectiveStatus honouring discounts + receipt SMS quota-checked "Payment of KES X received (REF). Balance: KES Y." — SMS failure never breaks ledger), applyDiscount (B.7.11 — over-discount blocked; FULL WAIVER -> PAID [bug found+fixed: due==0 must be PAID]), sendFeeReminders (B.7.12 — overdue UNPAID/PARTIAL, primary guardian, 3-day dedupe via reminderSentAt, quota gate, audit). listInvoices/arrearsAging now honour discountKes in balances.
- Jobs: registry "fee-reminders" daily 09:00 EAT + JOBS map (iterates all tenants).
- API: POST /api/finance/invoices/[id] {action:"stk"|"discount"} (record_payment / manage_structure).
- UI: invoice rows now have [M-Pesa][Cash] buttons; StkDialog (phone + amount prefilled w/ balance, explains parent flow). Screenshot 57 QA'd.
- TESTING BUGS FOUND+FIXED: (1) mock parseCallback expects {success:true} not resultCode — test fixed; (2) full-waiver status stayed UNPAID — effectiveStatus now returns PAID at due==0; (3) seed had inflated smsPerTerm usage 9921/5000 -> quota blocked reminders — reset to 1240 (NOTE: A.18 walk-in tests increment usage; watch for drift).
- LIVE-TESTED (scripts/finance2-test.ts kept, 14 assertions): STK PENDING+linked ✓ mock callback PAID ✓ invoice auto-applied 15k->20k ✓ receipt SMS w/ balance ✓ ledger audit ✓ over-balance blocked ✓ bursary 20k ✓ full waiver PAID ✓ over-discount blocked ✓ reminders 2 SMS w/ KE wording ✓ 3-day dedupe ✓ audit ✓. tsc/build/test:roles green.

## ✅ B.7+ FOUNDER REQUESTS (this turn): DESK STK + INVOICE PRINT TRACKING
- Desk STK: studentOpenInvoices() + /api/reception/fees (GET open invoices / POST STK; gated reception.operate + finance.record_payment — RECEPTIONIST already had both). Reception desk += "M-Pesa fees" action -> StkFeesDialog (student typeahead via reception search, invoice dropdown w/ balance prefilled, phone+amount, SIM-toolkit explainer copy). Works for feature phones — STK prompt is SIM-toolkit, no app. Live-tested as Mwangi Susan: STK 2,000 -> mock callback -> invoice 15k->17k + receipt SMS. Screenshot 58 QA'd. NOTE: receptionist email is frontoffice@karibuhigh.ac.ke.
- Print tracking (migration b7_print_tracking): Invoice.printCount/lastPrintedAt/lastPrintedBy. documents/invoice-pdf.tsx (G.10 #5): status STAMP (PAID IN FULL green / PARTIALLY PAID red / UNPAID), itemised totals w/ discount line, PAYMENTS RECEIVED table (date/method/mpesaRef), guardian, "Copy #N — every print is tracked" + QR. buildInvoicePdf: EVERY render increments count + stamps who/when + audit finance.invoice_printed. UI: Print button (ghost) on every invoice row + 🖨 N badge. GET /api/finance/invoices/[id]/pdf (finance.view). Live-tested: 2 prints -> +2, 2 audits, lastPrintedBy correct, QR verifies.

## ✅ B.8 PAYROLL: COMPLETE (all 8 lines, this turn)
- DB (migration b8_payroll): StaffSalary (userId unique; basic+house/transport/other+sacco+loan), PayrollRun (period unique/tenant, DRAFT|APPROVED), Payslip (runId+userId unique; full statutory columns). staffSalary+payrollRun in TENANT_OWNED_MODELS (payslip scoped via run).
- KE STATUTORY CALC (payroll.service.ts — pure fns, unit-verified): PAYE_BANDS 2024/25 monthly [24000@10%, 32333@25%, 500000@30%, 800000@32.5%, ∞@35%] + PERSONAL_RELIEF 2400; SHIF 2.75% min 300; NSSF 6% Tier I (cap 8k) + Tier II (cap 72k) => max employee 4,320; AHL 1.5%; taxable = gross - NSSF - SHIF - AHL (post-2025 deductibility). grossToNet() spot-checks: 50k->{paye 5846, shif 1375, nssf 3000, ahl 750}, 24k->paye 0, 8k->shif floor 300. EDIT POINT: constants at top of file when rates gazetted.
- Service: listSalaries (all active staff w/ configured flag), setSalary (upsert + audit), runPayroll(period, overtime{userId:KES}) — gross=basic+allowances+OT, net=statutoryNet-sacco-loan; dup period 409; approveRun locks (re-approve 422); runDetail. PayrollError mapped.
- API: /api/payroll (GET views salaries|runs|run&id; POST salary|run|approve) — ANY-of staff.manage OR finance.manage_structure (try/catch chain). /api/payroll/payslip/[id] — staff download OWN slip (403 others), admins any.
- Payslip PDF (G.10 #6): payslip-pdf.tsx — EARNINGS/STATUTORY DEDUCTIONS (PAYE/SHIF/NSSF/AHL)/OTHER (SACCO/loan)/NET PAY green box, QR verified, "Confidential".
- UI: /payroll (nav "Payroll" Banknote, staff module, staff.manage perm; page guard is ANY-of via manual can() check — requirePagePermission is ALL-of, GOTCHA) — Salaries tab (table w/ not-set badges + edit dialog), Runs tab (cards w/ gross/PAYE/net + status) -> RunDetail (full statutory table + payslip links + Approve & lock), NewRunDialog (month + per-staff OVERTIME inputs B.8.8).
- Seed: 4 salaries (principal 85k+28k allow, deputy 65k+21k, class teacher 45k+14k, receptionist 28k+9k) + demo run 2026-05 (persisted for demos).
- LIVE-TESTED (scripts/payroll-test.ts kept, 14 assertions): all statutory spot-checks ✓ run 4 staff ✓ dup 409 ✓ OT in gross ✓ PAYE matches calculator ✓ net-sacco ✓ approve locks ✓ totals ✓. Screenshot 59 QA'd (full breakdown table). tsc/build(6.58kB + 2 APIs)/test:roles green.

## ✅ B.9 HUMAN RESOURCES: COMPLETE (all 8 lines, this turn)
- DB (migration b9_hr — NOTE node_modules+playwright wiped AGAIN this session, npm install + npx playwright install chromium + apt libs rerun): StaffProfile (userId unique; TSC/ID/KRA/quals/employmentDate/contractType PERMANENT|CONTRACT|BOM|INTERN/contractEndDate/emergencyContact), LeaveRequest (type/start/end/days/status PENDING|APPROVED|REJECTED|CANCELLED + decidedBy*), JobPosting+JobApplication (status NEW|SHORTLISTED|INTERVIEWED|HIRED|REJECTED), Appraisal (period/score 1-5/reviewer), DisciplinaryRecord, TrainingRecord. All in TENANT_OWNED_MODELS (jobApplication scoped via posting).
- Service hr.service.ts: LEAVE_TYPES KE allowances (annual 30/sick 14/maternity 90/paternity 14/compassionate 7/study 10 — EDIT POINT); staffDirectory, upsertProfile, promoteStaff (audited role change; self-change FORBIDDEN; PARENT/STUDENT/SUPER_ADMIN roles INVALID), leaveBalances (year-scoped APPROVED days vs allowance), applyForLeave (BALANCE enforcement), decideLeave (self-approve FORBIDDEN, re-decide INVALID; APPROVED -> A.17 createEvent "Name — Annual leave"), listLeave (mineOnly), postings CRUD + setApplicationStatus, addAppraisal/addDisciplinary/addTraining, staffFile (all sections + balances). HrError -> 404/403/422.
- API: /api/hr single hub (GET views directory|leave|mine|postings|file&userId; POST actions profile|promote|leave_apply[ANY STAFF self-service via requireUser]|leave_decide|posting|application|app_status|appraisal|disciplinary|training — writes staff.manage).
- UI: /staff page (was 404!) + components/hr/staff-client.tsx — Directory (TSC/contract badges + File drawer: HR record, leave balances grid, appraisals w/ stars, training, red disciplinary; manage buttons Edit record/Change role/Appraise/Training/Disciplinary), Leave tab (My leave balances 2x3 grid + Apply dialog w/ remaining hints + Approvals list w/ Approve/Reject), Recruitment tab (postings w/ applicant pipeline selects + Post job/Log applicant dialogs). Modal z-[60] (sits above the file drawer's z-50 — layering note).
- Seed: Chebet profile (TSC/584211, Moi Univ, since 2021) + PENDING study leave ("KNEC marking training" 3d) + "Kiswahili / CRE teacher" posting w/ 2 applicants (Mercy SHORTLISTED, Hassan NEW).
- LIVE-TESTED (scripts/hr-test.ts kept, 12 assertions): directory+TSC ✓ apply 5d ✓ over-balance 422 ✓ SELF-APPROVE blocked ✓ approve -> balance 25/30 + calendar event ✓ re-decide blocked ✓ promotion audited + SELF-promote blocked ✓ staff file all sections ✓ recruitment status ✓. Screenshot 60 QA'd (balances + pending approval visible). tsc/build(/staff 10kB + /api/hr)/test:roles green.

## ✅ B.10 PARENT PORTAL: COMPLETE (8/9 lines; homework BLOCKED until B.12 — flagged)
- NEW permission portal.parent (PARENT role; catalogue + matrix; test:roles still 24/24).
- Service parent-portal.service.ts: myChildren (cards w/ 30d attendance %, last absent, aggregate fee balance, latest PUBLISHED exam), childDetail (60d attendance, all invoices w/ balances, published-exam groups w/ avg %, contacts = child's classTeacherId + PRINCIPAL/DEPUTY), parentStk (ROW-SCOPE GUARD on invoice's student THEN B.7 stkForInvoice). PortalError -> 404.
- API: /api/portal (GET children|child&id, POST stk) — all portal.parent.
- UI: /portal "My children" (nav "My children" HeartHandshake, permission portal.parent — parents see Dashboard+My children+Calendar+Messages only) — child cards (attendance/fee tiles, new-results flag) -> child detail (Fees card FIRST w/ Pay buttons + bursary lines, Results w/ Report card PDFs, 60-day attendance badge timeline, "Talk to the school" message buttons). Mobile screenshot taken (parents are on phones). PayDialog explains M-Pesa prompt + SMS receipt.
- SEED DRIFT GOTCHA (hit + fixed this turn): a db reset mid-history left exam/invoice seed rows pointing at OLD student ids (Achieng had 0 invoices/results). FIX: cleared examResult/exam/invoice/feeStructure and re-seeded — seed.ts upserts guard against dup KEYS but NOT against orphaned rows from previous student generations. If portal/exam data looks empty: clear those 4 tables + npm run db:seed.
- LIVE-TESTED (scripts/portal-test.ts kept, 9 assertions): own child only ✓ aggregates (91% attendance, CAT 1 flag) ✓ detail sections ✓ OTHER CHILD blocked ✓ parent STK -> callback -> +1,000 applied + receipt SMS ✓ OTHER FAMILY'S INVOICE STK blocked ✓. Screenshots 61-63 (children cards / child detail w/ paid badge + report card + attendance timeline / mobile 390px) QA'd ✓. tsc/build(/portal 6.2kB)/test:roles green.

## ✅ B.11 STUDENT PORTAL: COMPLETE (5/7; assignments->B.12, notes->B.13 flagged) — FOUNDER DECISION: SHARED FAMILY PORTAL
- Founder 2026-06-12: "parents and students use same portal as other students dont have phones" — STUDENT role granted portal.parent; /portal serves BOTH. scopeWhere(STUDENT) = { userId: user.id } (already existed from A.3) -> student sees exactly their own linked record.
- childDetail += timetable (class TimetableSlots w/ subject codes) -> new Timetable card (Mon-Fri × period grid) on the shared portal child view. Service verified 8 slots; API returns timetable key.
- Student login created + persisted: achieng@karibuhigh.ac.ke / Karibu2026! (NEYO-STUD-0001, linked to Student.userId via the B.1 createLogin pattern).
- LIVE-TESTED (scripts/student-portal-test.ts kept, 7 assertions): student sees ONLY own record ✓ timetable 8 ✓ fees/results/attendance ✓ other-student blocked ✓ own report 85% EE ✓ other report blocked ✓. Screenshot 64 (student session, role chip "Student", filtered sidebar). tsc/build/test:roles green.
- CHECKLIST DISCIPLINE REMINDER (founder called this out): tick FEATURES-CHECKLIST in the SAME TURN as the anchor — never anchor-only. B.10+B.11 both ticked.

## NEXT (strict list order): **B.12 TEACHER PORTAL** — Enter marks (own subjects — B.5 sheet EXISTS row-scoped, verify+tick) / Record attendance (own class — B.3 EXISTS, verify+tick) / View class roster (B.1 row-scoped list EXISTS) / View own timetable (B.4 teacherTimetable EXISTS — needs UI) / Upload notes (A.9 storage — needs Note model or defer to B.13) / Assign homework (NEW Homework model — UNBLOCKS B.10+B.11 homework lines!) / Lesson plans AI assist (plans EXIST; AI=B.23 flag) / Per-class reports. Build: homework model + teacher home view; verify-and-tick the existing engines. — Salary processing (gross→net) / Payslip PDF (G.9 branding) / PAYE calculation (KE 2024+ bands: 10%/25%/30%/32.5%/35%, personal relief 2,400/mo) / NHIF->SHA (2.75% of gross, min 300) / NSSF Tier I+II (6% each side, tiered caps) / SACCO deductions / Loan deductions / Overtime calc + approval. All computable with public KE rates — no external creds. Needs: StaffSalary model (basic + allowances) + PayrollRun + Payslip. After B.8 -> B.9 HR. — remaining lines: M-Pesa STK push for INVOICES (wire A.6 initiateStkPush -> on callback PAID apply to invoice via applyPaymentToInvoice; dev mock proves flow) / Receipt PDF + SMS to parent (extend A.10 receipt w/ invoice context + A.7 SMS seam on payment) / Idempotent M-Pesa refs (A.6 @unique — verify in invoice flow test) / Daraja verification on every record (A.6 queryPaymentStatus button in invoice context) / Scholarships, discounts, bursaries (Invoice discount/waiver lines or separate model) / Fee reminders auto-SMS sequence (A.12 cron job + A.7 cascade + quota check; overdue invoices -> guardian SMS w/ dedupe). Bank integration (Equity/KCB) = DEFER (needs bank APIs/founder accounts). After B.7 -> B.8 Payroll. — Competency tracking (basic) / Learning outcomes tagging / CBC report forms (KICD format) / Rubrics (4-point scale — cbcLevel exists, extend to strand-level) / Teacher formative assessments / Parent-friendly CBC reports. Reuses: Subject (CBC), ExamResult pattern, report-card PDF, cbcLevel. After B.6 -> B.7 FINANCE (the money module: fee structures -> invoices -> M-Pesa via A.6 -> receipts; unlocks G.13 Mzazi Card). — Exam setup (name/term/type — currentTerm() ready) / Subject mapping per exam / Marks entry sheet (grid, autosave) / CBC auto-grading (EE/ME/AE/BE) / Position calculation / Mean score / Report card PDF (co-branded, G.9 branding; AI comments seam->B.23) / CAT management / Result slips / Transcripts / Performance analytics / Student progress tracking / KCSE prediction (AI deferred) / Photo-grading (AI deferred). B.5 also UNBLOCKS G.16 performance-rank reshuffle strategy. — Subjects management / Classes (exists from B.1 — verify+tick) / Streams (exists — verify+tick) / Academic calendar (CBC terms; A.17 calendar exists — add term structure) / Departments / Timetable generator (auto+manual — BIG) / Lesson planning / Course management / CBC support / 8-4-4 support / University curriculum support. Assess each line: several partially exist; timetable is the heavy lift. After B.4 -> B.5 Examination.
Remember: when B-module docs are built, apply G.9 branding via getSchoolProfile() (pattern proven in transfer letter).
(Superseded note: B.1 core + A.3.8/9 row-scoping were ALREADY BUILT by the previous chat after the old anchor was written, and have now been audited + live-verified + ticked. The keystone models Student/SchoolClass/Guardian/StudentGuardian/StudentDocument/StudentRequirement exist; "student" is in SOFT_DELETE_MODELS; B.1 models are in TENANT_OWNED_MODELS.)

## ENV / SANDBOX (persists across sessions reminders)
- docs/ at /home/user/docs. Project root /home/user/neyo.
- node_modules NOT snapshotted → `cd /home/user/neyo && npm install` if missing. For screenshots also: `npx playwright install chromium` + `sudo apt-get install -y libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 libxkbcommon0 libatspi2.0-0 libxdamage1 libasound2 libxcomposite1 libxrandr2 libgbm1 libpango-1.0-0 libcairo2`.
- DEV SERVER: `(setsid npm run dev </dev/null >/tmp/dev.log 2>&1 &) ; sleep 14` then wait for port 3000. AFTER `npm run build` you MUST `rm -rf .next` before `npm run dev` (else "Cannot find the middleware module" 500).
- Prisma: ALWAYS `./node_modules/.bin/prisma` (bare npx pulls v7 which rejects schema). Migrate: `./node_modules/.bin/prisma migrate dev --name X`. Seed: `npm run db:seed`.
- pkill -9 -f next-server returns -1 (kills the calling shell, harmless) — just re-run the next command; don't combine pkill with other steps you need to keep.
- Image gen: occasionally returns "no images" (text-only) — just retry with a shorter prompt.

---
_Earlier: after A.19 CI/CD + DevOps (A.1-A.19 done)_

## A.19 CI/CD + DevOps: DONE (all 6 lines; config+docs, no DB/UI)
- npm scripts added (package.json): typecheck (tsc --noEmit), migrate:deploy (prisma migrate deploy), worker (tsx scripts/worker.ts), test (=test:roles).
- CI (A.19.1): .github/workflows/ci.yml — on PR + push to main: npm ci, prisma:generate, prisma validate, migrate:deploy (CI sqlite), typecheck, test:roles, lint, build. CI env DATABASE_URL=file:./dev.db + a dummy NEYO_MASTER_KEK. concurrency cancel-in-progress.
- Vercel web deploy (A.19.2): .github/workflows/deploy-web.yml (push main, guarded by repo var ENABLE_VERCEL_DEPLOY==true; vercel pull/build/deploy --prod; runs migrate:deploy w/ PROD_DATABASE_URL first). vercel.json (framework nextjs, buildCommand prisma generate+migrate deploy+next build, CRON */1 -> /api/jobs/tick).
- Fly worker deploy (A.19.3): .github/workflows/deploy-worker.yml (push main on jobs/prisma/worker/docker paths, guarded by ENABLE_FLY_DEPLOY==true). Dockerfile.worker (node:20-slim + openssl, npm ci + npm i bullmq ioredis, cp worker.ts.example->worker.ts, prisma generate, CMD tsx scripts/worker.ts). fly.toml (app neyo-worker, no [[services]], [processes] worker). scripts/worker.ts gitignored (generated at build).
- Branch protection (A.19.4): documented in docs/DEPLOY.md §2 (require PR + approvals + status check "CI / Typecheck, tests & build" + up-to-date). .github/CODEOWNERS (replace @your-github-username) + .github/pull_request_template.md.
- Migrations auto-applied (A.19.5): migrate:deploy in CI + Vercel deploy job + vercel.json buildCommand. Forward-only; never reset prod.
- Rollback (A.19.6): docs/DEPLOY.md §7 — Vercel "Promote to Production" instant rollback, Fly releases rollback, git revert, DB restore-from-snapshot (additive vs destructive guidance).
- NEW route handler: GET /api/jobs/tick — Vercel-Cron entrypoint, authorizes on `Authorization: Bearer <CRON_SECRET>` env (the existing POST stays SUPER_ADMIN). Runs tick({}) -> due cron jobs + A.16 webhook retry (EVERY_MINUTE_JOBS). respond.ts `fail` now imported there.
- ESLint set up (was missing — `next lint` was interactive/blocking CI): installed eslint@8 + eslint-config-next@14.2.5 + @typescript-eslint/{eslint-plugin,parser}@7 (devDeps). .eslintrc.json extends next/core-web-vitals + plugin:@typescript-eslint/recommended; no-explicit-any OFF, no-unused-vars WARN (^_ ignore), ban-ts-comment OFF; ignores worker.ts.example + migrations. `npm run lint` exits 0 (warnings only).
- .gitignore += scripts/worker.ts, .vercel.
- VALIDATED LOCALLY: all 3 workflow YAML + vercel.json + fly.toml parse; typecheck clean; prisma validate ok; migrate:deploy "no pending"; test:roles 24/24; npm run lint exit 0; npm run build ✓ (/api/jobs/tick present). No live deploy possible in sandbox (needs founder hosting accounts) — deploy jobs gated behind ENABLE_* repo vars so repo stays green pre-connect.
- FOUNDER TODO (provide later): push neyo/ as GitHub repo root; set secrets VERCEL_TOKEN/VERCEL_ORG_ID/VERCEL_PROJECT_ID/PROD_DATABASE_URL/FLY_API_TOKEN + vars ENABLE_VERCEL_DEPLOY/ENABLE_FLY_DEPLOY=true; configure branch protection per DEPLOY.md §2; set runtime env (DATABASE_URL Postgres, CRON_SECRET, NEYO_MASTER_KEK, + provide-later keys); `vercel link` + `fly launch`.

_Earlier: after A.18 Receptionist Operations (A.1-A.18 done)_

## A.18 Receptionist Operations: DONE (all 8 lines, full-stack, live-tested)
- DB (migration a18_reception): VisitorLog (name, phone, idNumber, purpose, host, badgeNo "V-001", signedInAt/signedOutAt), AdmissionInquiry (parentName, phone, studentName, gradeWanted, curriculum CBC|8-4-4, notes, status NEW|CONTACTED|ENROLLED|CLOSED), PhoneMessage (callerName, callerPhone, forUserId/forUserName, message, conversationId). All 3 added to Tenant relations + tenant-tables TENANT_OWNED_MODELS.
- Permission: NEW "reception.operate" (granted to RECEPTIONIST + LEADERSHIP) + added to session.ts WRITE_PERMISSIONS. test:roles 24/24 green.
- Validations: src/lib/validations/reception.ts (kePhone/kePhoneOptional helpers reuse normalizeKePhone from auth.ts; visitorSignInSchema, walkInPaymentSchema [amount coerce int, method cash|mpesa, mpesaRef], admissionInquirySchema, phoneMessageSchema).
- Service: src/lib/services/reception.service.ts — nairobiDayBounds() (UTC+3 today window), nextBadgeNo (per-tenant per-day count -> V-00N), signInVisitor/signOutVisitor/todayVisitors/getVisitor, recordWalkInPayment (NO STK; cash->synthetic CASH-<base36> ref, mpesa->manual ref w/ dup guard on Payment.mpesaRef unique; status=PAID, provider cash|mpesa_manual, audit payment.walkin), captureInquiry/todayInquiries, relayPhoneMessage (reuses A.8 createConversation DIRECT + sendMessage -> staff inbox; keeps PhoneMessage log), receptionDashboard (today's visitors/onSite/inquiries/calls/payments[raw db, status PAID, deletedAt null]/collected), dayEndSummary (totals + lists), staffForRelay. ReceptionError NOT_FOUND|DUPLICATE. respond.ts maps it (409 dup / 404).
- API routes (all requirePermission reception.operate; payments also finance.record_payment): GET/POST /api/reception/visitors, POST /api/reception/visitors/[id]/signout, POST /api/reception/payments, GET/POST /api/reception/inquiries (+audit), GET/POST /api/reception/calls, GET /api/reception/staff, GET /api/reception/summary, GET /api/reception/search?q (reuses A.11 search), GET /api/reception (dashboard).
- UI: src/components/reception/reception-desk.tsx (client) — PersonSearch (debounced typeahead dropdown via /api/reception/search), 4 StatCards, action bar (Sign in visitor=primary green + Record payment/New inquiry/Relay call + Day-end summary link opening /api/reception/summary), 4 list cards (visitors w/ badge+on-site/signed-out badges + print/sign-out actions, inquiries, relayed calls, payments), 4 dialogs (VisitorDialog/PaymentDialog/InquiryDialog/CallDialog using shared Dialog + useSaver), BadgePrint modal (#visitor-badge, window.print()). All 4 UX states. Page: (app)/reception/page.tsx (requirePagePermission reception.operate, passes schoolName). Nav: "Front Desk" (icon ConciergeBell — NOTE lucide has ConciergeBell not Concierge; permission reception.operate) in OVERVIEW.
- Print CSS: globals.css @media print added `body:has(#visitor-badge)` rules to print ONLY the badge (80mm centered).
- Seed: 2 visitors (Otieno James on-site/V-001, Njeri Catherine signed-out/V-002), 1 inquiry (Wanjiru Mary->Kamau Junior Grade 4 CBC), 1 cash walk-in payment (KES 5000, CASH-SEED0001), 1 relayed call (Achieng Mary->bursar). createConversation imported in seed already.
- LIVE-TESTED: scripts/reception-test.ts — badge increments to V-003; sign-out sets timestamp; cash payment PAID+synthetic ref; mpesa duplicate ref -> DUPLICATE blocked; phone relay creates conversation + message in bursar inbox; day-end totals correct. HTTP as Mwangi Susan (RECEPTIONIST): dashboard + summary return seeded data (2 visitors/1 onsite/1 inquiry/1 call/KES5000). tsc clean, build clean (/reception 7.92kB + 9 api routes). Screenshot 20-reception.png (populated, role-filtered nav correct). Scripts: scripts/reception-test.ts, scripts/shot-reception.ts.
- ENV NOTE: node_modules was cleared this session (snapshot exclusion) — had to `npm install`, `npx playwright install chromium`, and re-run the apt-get libs (libnss3 ... libcairo2) for screenshots. dev.db + source persisted. Daraja verification button = reuses A.6 queryPaymentStatus (activates with founder sandbox creds). Thermal printer device = hardware seam (browser print works now).

_Earlier: after A.17 Calendar (A.1-A.17 done)_

## A.17 Calendar (Shared): DONE (all 5 lines, full-stack, live-tested)
- DB (migration a17_calendar): CalendarEvent (title, description, date "YYYY-MM-DD", endDate (multi-day), startTime/endTime "HH:MM" or null=all-day, location, type=event|meeting|exam|holiday|sports|deadline, audienceRole (null=whole school else a Role), createdById). NEW Tenant.showReligiousHolidays Boolean @default(true). calendarEvent added to tenant-tables TENANT_OWNED_MODELS.
- Permissions: NEW "calendar.view" (granted to ALL 16 roles — shared school calendar) + "calendar.manage" (LEADERSHIP + DEPUTY/DEAN/HOD/TEACHER/CLASS_TEACHER). calendar.manage added to session.ts WRITE_PERMISSIONS (also added api.manage there). test:roles 24/24 green.
- Validations: src/lib/validations/calendar.ts (createEventSchema w/ refinements via withRefinements() helper [endDate>=date, endTime>startTime]; updateEventSchema = withRefinements(eventFields.partial()); calendarPrefsSchema; EVENT_TYPES; audience enum = "all"|Role). NOTE: can't .partial() a ZodEffects — base object `eventFields` defined separately, refinements applied via helper.
- Service: src/lib/services/calendar.service.ts:
  - getOccurrences({from,to,viewerRole,seeAll,showReligious}) — MERGES tenant CalendarEvent rows (multi-day overlap: date<=to AND (endDate??date)>=from) with the A.15 KE_MOMENTS holiday layer (cultural-calendar.ts) projected onto each year in range; religious moments skipped when showReligious=false; audience filter (seeAll OR !audienceRole OR audienceRole===viewerRole). Returns Occurrence[] (source event|holiday, readonly for holidays).
  - createEvent/updateEvent/deleteEvent (tenantDb, audience "all"->null). CalendarError NOT_FOUND.
  - inviteAudience (A.17.5) — notify() (A.7, in_app, href /calendar) to all active users (or role-filtered), excludes creator.
  - buildIcs (A.17.4) — RFC-5545 VCALENDAR/VEVENT, CRLF lines, all-day=VALUE=DATE w/ exclusive DTEND (next day), timed=DTSTART;TZID=Africa/Nairobi, escapes ;,\n, X-WR-TIMEZONE.
  - getCalendarPrefs/setCalendarPrefs (showReligiousHolidays on Tenant).
- API routes: GET/POST /api/calendar/events (GET requires calendar.view + ?from&to YYYY-MM-DD; POST calendar.manage + optional notify->invites + audit), PATCH/DELETE /api/calendar/events/[id] (calendar.manage + audit), GET /api/calendar/ics (calendar.view; 13-month window last-month..+12; returns text/calendar attachment <slug>-calendar.ics), PUT /api/calendar/prefs (tenant.manage_settings). respond.ts maps CalendarError (404).
- UI: src/components/calendar/calendar-view.tsx (client) — month grid (Mon-first, 42 cells, today=green pill, +N more, multi-day dots), week+day = AgendaList (day cards w/ type badge, time/location/audience/description, delete for non-holiday), event type colour dots + legend, view switcher pill (month/week/day), keyboard nav (←/→ step, T=today), iCal download link, New event dialog (title/date/type/times/location/audience/notes/notify checkbox; uses native date/time inputs + selects). All 4 UX states (skeleton/empty/error+retry/populated). Page: (app)/calendar/page.tsx (requirePagePermission calendar.view, passes canManage). Nav: "Calendar" (icon CalendarDays, permission calendar.view) in OVERVIEW section.
- Seed: 4 Karibu High events (Form 2 Parents' Meeting [PARENT, timed], Mid-term Break [multi-day holiday Aug6-10], Inter-house Sports Day [sports, timed], End of Term 2 Exams [multi-day exam Aug25-29]). Uses current year.
- LIVE-TESTED: scripts/cal-test.ts — occurrences merge; audience (PARENT sees PTA, STUDENT doesn't); religious-off hides Christmas but keeps Jamhuri; iCal valid (VEVENTs, TZID for timed + VALUE=DATE for all-day); inviteAudience count. HTTP: June API returns Madaraka+Eid holiday layer; iCal 200 text/calendar attachment w/ 19 VEVENTs. tsc clean, npm run build clean (/calendar 7.75kB + 4 api routes). Screenshots 18-calendar-month.png (Aug 2026, multi-day spans render) + 19-calendar-week.png. Test scripts: scripts/cal-test.ts, scripts/shot-calendar.ts.
- GOTCHA hit + fixed: after `npm run build` (which writes .next for prod), starting `npm run dev` against that .next threw "Cannot find the middleware module" 500. FIX: rm -rf .next before dev after a build. (Recorded for future turns.)

_Earlier: after A.16 Public API & Webhooks (A.1-A.16 done)_

## A.16 Public API & Webhooks: DONE (all 6 lines, full-stack, live-tested)
- DB (migration a16_public_api_webhooks): ApiKey (keyHash=SHA-256, keyPrefix display, scopes JSON, expiresAt/revokedAt, createdById), WebhookSubscription (url, events JSON, signingSecret, active, lastDeliveryAt), WebhookDelivery (status PENDING|DELIVERED|FAILED, attempts, maxAttempts=6, nextAttemptAt, responseStatus/Body, error). All 3 added to Tenant relations + tenant-tables.ts TENANT_OWNED_MODELS.
- Permission: NEW "api.manage" added to PERMISSIONS catalogue + WRITE list + LEADERSHIP bundle (so SUPER_ADMIN/SCHOOL_OWNER/PRINCIPAL). test:roles still 24/24 green.
- Validations: src/lib/validations/api-keys.ts (createApiKeySchema, createWebhookSchema, updateWebhookSchema, WEBHOOK_EVENTS=[payment.recorded,payment.failed,subscription.updated,user.created,notification.sent]).
- Services:
  - src/lib/services/api-key.service.ts: createApiKey (returns plaintext token ONCE; token=neyo_sk_<base64url 32B>; stores SHA-256 hash + 12-char prefix), listApiKeys, revokeApiKey, resolveBearerToken (no-tenant lookup via raw db, touches lastUsedAt), scopeAllows("*" wildcard), keyStatus(active/revoked/expired), hashToken. ApiKeyError.
  - src/lib/services/webhook.service.ts: list/create/update/deleteWebhook, sendTestEvent, dispatchEvent(tenantId,event,data) [fans out to matching active subs, creates delivery, fires 1st attempt non-blocking], attemptDelivery (HMAC sign + fetch w/ 8s AbortController timeout; on fail schedule backoff or FAIL), retryDueDeliveries (job body; picks PENDING w/ nextAttemptAt<=now), signPayload/verifySignature. WebhookError. BACKOFF_SEC=[0,60,300,1800,7200,21600], MAX_ATTEMPTS=6.
  - Signature header: `X-NEYO-Signature: t=<unix>,v1=<hmac-sha256 hex of ${t}.${rawBody}>` using sub.signingSecret. Also sends X-NEYO-Event, X-NEYO-Delivery headers.
- Bearer auth helper: src/lib/api/bearer.ts authenticateApiRequest(req, requiredScope?) -> {ok, tenantId, keyId, scopes} | {ok:false, response}. Enforces per-key rate limit (reuses A.14 checkRate, key `apikey:<id>`, 120/60s) -> 429 w/ Retry-After + X-RateLimit-*; scope check -> 403 INSUFFICIENT_SCOPE; missing/invalid -> 401.
- Jobs (A.12 reuse): registry.ts JOBS["webhook-deliver"]=retryDueDeliveries; NEW EVERY_MINUTE_JOBS=["webhook-deliver"] + jobs.service dueCronJobs() now unions EVERY_MINUTE_JOBS so the retry queue runs on every /api/jobs/tick (scheduler hits it each minute).
- API routes: management = session-gated (requirePermission("api.manage")) + audit-logged: GET/POST /api/api-keys, DELETE /api/api-keys/[id], GET/POST /api/webhooks, PATCH/DELETE /api/webhooks/[id], POST /api/webhooks/[id]/test. Public = Bearer-gated: GET /api/v1/me (scope reports.view) returns tenant + tenant-scoped counts + scopes + serverTime. respond.ts maps ApiKeyError + WebhookError.
- UI: src/components/settings/developer-panel.tsx (ApiKeysSection + WebhooksSection, all 4 UX states: skeleton/empty/error+retry/populated; one-time secret reveal banner w/ Copy; create forms; revoke/pause/remove/send-test; copy signing secret). Page: (app)/settings/developer/page.tsx (requirePagePermission("api.manage")). Nav: "Developer" item (icon Webhook, permission api.manage) in navigation.ts SYSTEM section.
- Seed: 1 sample API key (dev token: neyo_sk_devKaribuHighSampleToken000000000000000) + 1 webhook (signingSecret whsec_devKaribuHighSampleSigningSecret00) for Karibu High. createHash import added to seed.ts.
- LIVE-TESTED (dev server): /api/v1/me 401 no-auth, 401 bad-token, 200 valid (Karibu High, 9 users); rate limit 120 then 429 w/ Retry-After:51 + X-RateLimit headers; webhook dispatch -> DELIVERED attempt1 HTTP200 w/ receiver-verified HMAC sigValid=true (scripts/wh-test.ts + local node receiver); retry: dead URL -> PENDING attempt1 nextAttempt+60s -> retry job -> attempt2 nextAttempt+300s (backoff growing, scripts/wh-retry-test.ts). tsc clean, npm run build clean (/settings/developer 6.36kB + all 6 api routes present). Screenshot /home/user/screenshots/17-developer.png (populated, on-brand).
- Repeatable test scripts: scripts/wh-test.ts, scripts/wh-retry-test.ts, scripts/shot-developer.ts.

_Earlier: after A.15 i18n (A.1-A.15 done)_

## A.15 Internationalization: DONE
- DB: User.language (en|sw). Migration a15_language. session.ts SessionUser.language added.
- lib/i18n/dictionaries.ts: en+sw dicts, translate(lang,key,vars) w/ {{var}}, LANGUAGES. lib/i18n/cultural-calendar.ts: KE_MOMENTS (Madaraka/Mashujaa/Jamhuri/Huduma/Christmas/Eid/KCSE) + momentsInMonth/onDate/nextMoment (A.17 will render).
- components/i18n/lang-provider.tsx (LangProvider + useT) seeded from user.language in (app)/layout (inside PermissionsProvider). API POST /api/me/language.
- UI: sidebar labels translated via NAV_I18N; language switcher (EN/Kiswahili) in user-menu; sign-out label translated.
- Verified: EN/SW translate + interpolation, calendar lookups, language persists, invalid lang 422.

_Earlier: after A.14 Security_

## A.14 Security: DONE (7 code lines; 3 doc/operational in SECURITY.md)
- next.config.mjs headers(): CSP (allows inline styles + data: imgs + Safaricom connect-src), HSTS(prod only), X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy.
- src/lib/security/rate-limit.ts: checkRate/enforceRate/clientIp + RateLimitError(429). Applied: onboarding signup (5/h/IP, verified 429), OTP+magic already limited. Redis swap documented for multi-instance.
- Audit immutability: app only INSERTs AuditLog (verified, 0 update/delete). prisma/rls/audit-immutable.sql = Postgres triggers blocking UPDATE/DELETE.
- Argon2id (A.1.2) + AES-256-GCM (A.2.7) verified/ticked.
- Legal: (legal)/layout + /privacy + /terms (KE DPA 2019). components/legal/cookie-consent.tsx in root layout.
- SECURITY.md: ODPC reg + DPO, breach process (72h), pen-test — founder operational actions.
- respond.ts maps RateLimitError.

_Earlier: after A.13 Observability_

## A.13 Observability: core DONE (providers activate with keys)
- Dep: pino (external in next.config). lib/observability/: logger.ts (pino + secret redaction), capture.ts (captureError/captureMessage seam -> SENTRY_DSN), analytics.ts (track seam -> POSTHOG_KEY), health.ts (runHealthChecks: DB + Redis/Storage configured-state), alerts.ts (sendOpsAlert reuses A.7 cascade).
- respond.ts handleError now calls captureError.
- API: GET /api/health (200/503, point Better Stack here). Public page /status (real checks, Stripe-style).
- Verified: health operational+DB latency, status page, captureError logs, analytics event, pino REDACTS password.
- ACTIVATE: SENTRY_DSN(+@sentry/nextjs), POSTHOG_KEY(+posthog-node), LOGTAIL_TOKEN(+@logtail/pino). Better Stack = no key, just /api/health.

_Earlier: after A.12 Background Jobs_

## A.12 Background Jobs: DONE (in-process now; BullMQ activates with REDIS_URL)
- DB: JobRun (name,status,progress,attempts,result,error,timing) — platform-level, NOT tenant-scoped. Migration a12_jobs.
- lib/jobs/registry.ts: JOBS map (subscription-state-machine, recycle-purge), CRON_SCHEDULES (Nairobi EAT 01:00/02:00), nairobiTime/dueCronJobs (UTC+3).
- lib/jobs/jobs.service.ts: runJob (retry MAX_ATTEMPTS=3 + BACKOFF_MS + progress + JobRun), enqueue (Redis->bullmq-adapter else in-process), tick({only,force}), recentRuns. JobError mapped (400).
- lib/jobs/bullmq-adapter.ts: opaque dynamic import of 'bullmq' (avoids webpack bundling); activates with REDIS_URL. scripts/worker.ts.example = separate worker (npm i bullmq ioredis).
- API: GET /api/jobs, POST /api/jobs/tick (SUPER_ADMIN). UI: /settings/jobs (SUPER_ADMIN, URL-only/page-guarded; not in sidebar).
- Verified: retry succeeds on attempt 3, always-fail -> FAILED after 3, cron-due matches Nairobi times, 403 for non-admin, run-now works.
- ⭐ PROD: set REDIS_URL (Upstash) + npm i bullmq ioredis + deploy worker + cron hits /api/jobs/tick every minute.

_Earlier: PART G COMPLETE (G.1-G.7). Resume PDF roadmap at A.12._

## G.2 PWA + Offline: DONE
- public/manifest.webmanifest + icons (icon-512/192, apple-touch). public/sw.js (network-first nav, cache-first static, never API; /offline fallback). Root layout metadata: manifest + appleWebApp + icons.
- lib/offline/queue.ts: IndexedDB outbox; queuedPost(url,body,label) (online->POST w/ Idempotency-Key, else enqueue), syncQueue() (replays, drops on 2xx/4xx, keeps on 5xx/offline), listQueued/queueCount/remove. lib/offline/use-online.ts.
- components/offline/pwa-provider.tsx (register SW + auto-sync on 'online'), offline-indicator.tsx (topbar Offline/Sync pill). Mounted in app-shell + topbar.
- TEST: real browser at localhost (SW needs secure context; NOT in Arena iframe).
- ⭐ FIRST REAL OFFLINE ACTION wires at B.3 Attendance: mark-attendance button -> queuedPost().

## PART G STATUS: ALL DONE (G.1 activity, G.2 PWA/offline, G.3 wizard, G.4 help, G.5 view-as, G.6 soft-delete/recycle, G.7 ⌘K actions). G.8 polish = ongoing/optional.

_Earlier: after Part G G.1,G.4,G.7,G.6,G.5,G.3_

## G.3 First-Run Setup Wizard: DONE
- DB: Tenant.curriculum + onboardedAt. Migration g3_onboarding.
- validations/onboarding.ts (signupSchema, inviteSchema). services/onboarding.service.ts: signupSchool (atomic: assertSlugUsable + tenant + ensureTenantDek + initialiseModules + Argon2 owner SCHOOL_OWNER + session + audit tenant.created/auth.login), inviteStaff. OnboardingError mapped (409).
- API: POST /api/onboarding/signup (PUBLIC, sets cookie), POST /api/onboarding/invite (user.manage_roles).
- UI: PUBLIC /get-started 4-step wizard (school+SlugField / curriculum+modules / owner+password / done). Login page links it. (auth)/layout widened (children center; login + magic pages now self-set max-w-sm).
- Verified: signup creates school+owner+DEK+modules, auto-login, dashboard shows school; dup slug 409, reserved 422.

## G.5 In-school "View As" (read-only): DONE
- DB: Session.viewAsReadOnly. Migration g5_view_as. getSessionContext returns viewAsReadOnly; requirePermission BLOCKS WRITE_PERMISSIONS when viewAsReadOnly.
- services/view-as.service.ts: startViewAs (leaders only, same-tenant, not another leader, read-only) / stopViewAs. audit view_as.started/stopped.
- API: POST /api/view-as, POST /api/view-as/stop.
- UI: blue ViewAsBanner (vs amber super-admin ImpersonationBanner) in (app)/layout; "View as staff…" in UserMenu (canViewAs prop threaded shell->topbar->user-menu); ViewAsLauncher picks staff (reuses /api/conversations/recipients).
- Verified: view-as teacher -> /me=teacher, reads ok, writes 403 read-only, stop restores, bursar 403, can't view another leader.

## G.6 Soft-delete + Recycle Bin: DONE
- DB: Payment.deletedAt/deletedById. Migration g6_soft_delete. SOFT_DELETE_MODELS=["payment"] in tenant-tables.ts (add "student" in B.1).
- tenantDb() now: hides deletedAt!=null on reads (opt back in with args.includeDeleted=true), and rewrites delete/deleteMany -> soft-delete updateMany(deletedAt). Hard purge uses raw db.
- services/recycle.service.ts: listDeleted/restore/purge (audited). RecycleError mapped.
- API: DELETE /api/payments/[id] (finance.manage_structure), GET /api/recycle-bin, POST /api/recycle-bin/action (tenant.manage_settings).
- UI: /settings/recycle-bin + trash icon on payments-list (permission-gated). Sidebar "Recycle Bin".
- Verified: 403 for accountant, soft-delete hides row, bin lists, restore, purge removes from DB.

## PART G — founder-approved enhancements (NOT in original PDF). Build remaining in order.
- G.1 Activity Feed: DONE — services/activity.service.ts (entityActivity/tenantActivity/describeAction), /api/activity, components/activity/activity-feed.tsx (reusable; on dashboard, drop <ActivityFeed entityType entityId/> on detail pages).
- G.4 Help overlay: DONE — components/shell/help-overlay.tsx (press "?"), core/commands.ts SHORTCUTS. Mounted in app-shell.
- G.7 ⌘K command actions: DONE — core/commands.ts APP_COMMANDS (permission-filtered) merged into command-palette.tsx.
- Founder said: keep suggesting new enhancements as we go (add to Part G).

_Earlier: after A.11 Search (Cmd+K live; tsvector documented for prod)_

## A.11 Search: DONE (LIKE now; tsvector for prod)
- services/search.service.ts: search()/typeahead() tenant-scoped across users/payments/conversations (add entities as modules land). prisma/rls/search.sql documents Postgres tsvector+GIN.
- API GET /api/search?q=. UI: components/shell/command-palette.tsx (⌘K/Ctrl+K, debounced, keyboard nav) mounted in app-shell; topbar search dispatches "neyo:open-search".
- Verified: person/payment/conversation hits; <2 chars empty; tenant isolation (Uhuru 0 Karibu hits).

_Earlier: after A.10 Document Generation (core done; thermal+bulk seamed)_

## A.10 Document Generation: core DONE
- Deps: @react-pdf/renderer, exceljs (both external in next.config). qrcode already in.
- DB: DocumentVerification (code @unique, payloadHash). Migration a10_doc_verification. In TENANT_OWNED_MODELS.
- documents/csv.ts (toCsv, BOM+escape), xlsx.ts (toXlsx via exceljs), qr.ts (qrDataUrl, verifyUrl), receipt-pdf.tsx (renderReceiptPdf, co-branded header + QR + amount box).
- services/document.service.ts: hashPayload, issueVerification, verifyDocument, buildPaymentReceiptPdf (payment -> code -> QR -> PDF).
- API: GET /api/payments/[id]/receipt (PDF download), POST /api/export (csv|xlsx), public page /verify/[code] (no auth).
- payment.service.listPayments added. UI: components/finance/payments-list.tsx + /finance/payments (export menu + per-row PDF receipt), components/ui/export-menu.tsx (drop anywhere). globals.css @media print updated.
- Verified: receipt PDF %PDF + filename; CSV escaping; XLSX bytes; public verify genuine/not-found.
- PARTIAL: thermal printer (Web Bluetooth, device-only) + bulk async (BullMQ needs Redis A.12) -> seams.

_Earlier: after A.9 File Uploads & Storage (DONE; R2 activates with creds)_

## A.9 File Uploads & Storage: COMPLETE & VERIFIED
- Deps: sharp (resize/EXIF strip), @aws-sdk/client-s3 + s3-request-presigner (R2). All marked external in next.config.mjs serverComponentsExternalPackages.
- DB: StoredFile (tenant-owned, key @unique). Migration a9_storage.
- src/lib/storage/provider.ts (interface + STORAGE_CONFIGURED), r2-provider.ts (R2 via S3 presign; activates with R2_ACCOUNT_ID/R2_ACCESS_KEY_ID/R2_SECRET_ACCESS_KEY/R2_BUCKET[/R2_PUBLIC_BASE]), local-provider.ts (dev, stores ./.uploads served via /api/files/serve).
- src/lib/services/storage.service.ts: buildKey (tenants/<id>/<cat>/<uuid>.ext), presignUpload, recordFile (10MB cap, type allowlist), uploadProcessedImage (sharp resize<=1200 + EXIF strip), devPut, readObject, deleteFile. StorageError mapped in respond.ts.
- API: /api/files/presign, /confirm, /dev-put (PUT, dev), /serve (tenant 403 guard), /image (multipart resize), /[id] DELETE.
- UI: components/ui/file-upload.tsx (FileUpload + AttachmentChip), WIRED into A.8 messages-client composer (attachments now fully working).
- Verified: presign->PUT->confirm->serve; cross-tenant serve 403; image 2000x1500 -> 1200x900 no EXIF; bad type 415.
- ⭐ R2 GO-LIVE: founder sets R2_* env. Reuse storage for B.1 student photos, A.10 docs.

_Earlier: after A.8 In-App Messaging (core done; attachments need A.9)_

## A.8 In-App Messaging: core DONE; attachments -> A.9
- DB: Conversation(type DIRECT|GROUP|ANNOUNCEMENT), ConversationParticipant(lastReadAt, role), Message(attachmentUrl/Name fields ready). Migration a8_messaging. Conversation+Message in TENANT_OWNED_MODELS (Participant scoped via conversation).
- validations/messaging.ts; services/messaging.service.ts: createConversation(DIRECT dedup), sendMessage(participant+announcement-lock, bumps convo, fan-out to createInApp notif), listConversations(unread + 1:1 title resolve), getMessages(markRead+receipts), totalUnread, searchMessages. MessagingError mapped in respond.ts.
- API: GET/POST /api/conversations, GET/POST /api/conversations/[id]/messages, GET /api/conversations/[id]/stream (SSE 3s), GET /api/conversations/recipients.
- UI: components/messaging/messages-client.tsx (list+thread+composer, live SSE, mobile back). /messages page. Sidebar "Messages" (Overview). Message notifications deep-link /messages?c=ID.
- Seed: Karibu DM (teacher Njoroge<->bursar Achieng, M-Pesa fee thread), GROUP "Form 2 Teachers", ANNOUNCEMENT "Closing Day".
- Verified: list/unread, open+receipts, send, announcement 403, recipients(8), SSE tick.

_Earlier: after A.7 Notifications (core done; external transports seamed)_

## A.7 Notifications: core DONE; SMS/Email/WhatsApp/Push activate with keys
- DB: Notification (in-app inbox), NotificationPreference (per-user optOut JSON), NotificationTemplate. Migration a7_notifications. Notification+Template in TENANT_OWNED_MODELS.
- core/channels.ts: CASCADE_ORDER [in_app,push,whatsapp,sms,email] + costKes + configured(env). notifications/template.ts renderTemplate({{var}}). Seams: notifications/{sms,email,whatsapp,push}.ts (dev console).
- services/notification.service.ts: createInApp, notify(cascade, opt-out aware, audit), previewCost, listForUser, markRead/markAllRead, setOptOut, getUnreadCount.
- API: GET /api/notifications, POST /read, GET /stream (SSE unread every 5s), POST /send (comms.send; by recipientIds or role), POST /cost-preview.
- UI: components/shell/notification-bell.tsx (live SSE badge + drawer + mark-read; empty/loading states). Replaced static bell in topbar.
- Seed: 3 notifications for Karibu principal (fees/attendance/exam).
- Verified: inbox/unread, SSE event, mark-all, cost preview KES, send-to-role, 403 without comms.send.
- ACTIVATE TRANSPORTS via .env: AT_API_KEY+AT_USERNAME (SMS), RESEND_API_KEY (email), WHATSAPP_TOKEN (WhatsApp), VAPID_PUBLIC_KEY+VAPID_PRIVATE_KEY (push).

_Earlier: after A.6 Payment Routing_

## A.6 Payment Routing: DONE (STK live-activates when founder adds Daraja creds)
- DB: PaymentCredential (per-tenant; secrets ENCRYPTED via A.2.7), Payment (mpesaRef @unique, checkoutRequestId @unique). Migration a6_payment_routing. Both in TENANT_OWNED_MODELS.
- src/lib/payments/provider.ts (interface), daraja-provider.ts (REAL Safaricom calls: oauth/stkpush/stkpushquery + parseCallback + verifyWebhookToken), mock-provider.ts (dev).
- src/lib/services/payment.service.ts: savePaymentCredentials (encrypt), getPaymentConfigStatus, initiateStkPush, handleCallback (IDEMPOTENT, dup mpesaRef guard), queryPaymentStatus, reconcile. pickProvider = Daraja if creds active else dev mock. PaymentError mapped in respond.ts.
- API: POST/GET /api/payments/credentials, POST /api/payments/stk (finance.record_payment), POST /api/payments/webhook/[slug] (token via ?t=, always 200), GET /api/payments/status/[id], POST /api/payments/simulate-callback (DEV only).
- UI: /settings/payments + components/settings/payments-manager.tsx (masked secrets). Sidebar "Payments" (tenant.manage_settings).
- VERIFIED via mock: stk->PENDING->callback->PAID(mpesaRef)->idempotent replay->reconcile; creds stored encrypted (no plaintext) + decrypt round-trip.
- ⭐ TO GO LIVE: founder enters Daraja creds on Payments page + set .env DARAJA_WEBHOOK_TOKEN + APP_BASE_URL (public). Then also switch A.5 billing chargeViaSeam to call initiateStkPush.

_Earlier: after A.5 Billing & Subscriptions_

## ⚠️ INFRA NOTE: node_modules is NOT snapshotted — if commands fail with "module missing", run `npm install` in /home/user/neyo first. ALSO: use ./node_modules/.bin/prisma (npm scripts do) — bare `npx prisma` pulls Prisma 7 which rejects our schema. Local pinned = 5.17.

## A.5 Billing & Subscriptions: DONE (2 lines partial via seams)
- DB: Subscription (planKey,status,grandfatheredPrice,period,graceEndsAt), SubscriptionPayment (mpesaRef unique), UsageCounter (tenant,metric,periodKey). Migration a5_billing. Both added to TENANT_OWNED_MODELS.
- core/plans.ts: free_karibu(0)/pro(9000)/elite(22000) KES/term + limits + overageAllowance + maxAddOns.
- services/billing.service.ts: ensureSubscription, subscribeToPlan (grandfathers price; chargeViaSeam auto-confirms in dev, fails closed in prod — real Daraja STK = A.6), runSubscriptionStateMachine (ACTIVE->GRACE(14d)->SUSPENDED, NEVER deletes data), BillingError.
- services/limits.service.ts: checkLimit/checkSmsQuota/recordUsage/getAllLimitStatuses, currentPeriodKey (YYYY-T{1,2,3}).
- API: GET /api/billing, POST /api/billing/subscribe (requirePermission tenant.manage_settings), POST /api/billing/run-state-machine (SUPER_ADMIN, cron stand-in). respond.ts maps BillingError.
- UI: /settings/billing + components/settings/billing-manager.tsx (status badge, usage bars, plan picker). Sidebar "Billing" (always visible).
- Seed: Karibu=Pro (usage 312 students/28 staff/1240 sms), Uhuru=Free Karibu.
- PARTIAL: M-Pesa STK (seam->A.6 needs Daraja creds); Receipt PDF (A.10) + SMS (A.7).
- Auto-downgrade intentionally NOT built (spec says excluded).

_Earlier: after A.4 Identity Generation (ALL 5 lines DONE)_

## A.4 Identity Generation: COMPLETE & VERIFIED
- src/lib/core/identity.ts: ENTITY_CODES (STUDENT=S, INVOICE=INV, STAFF=T...), DEFAULT_PADDING=6, prefixFromSlug (karibu-high->KH), entityCode().
- src/lib/services/identity.service.ts: nextTenantId(tenantId, entityType, {padding}) -> "KH-S-000247" using ATOMIC db.idSequence.upsert({update:{lastValue:{increment:1}}}) (NOT interactive tx — that exhausted SQLite pool under load). peekNextTenantId (display only). generateNeyoLoginId() (NEYO-xxxx, collision-checked).
- Proven: 50 parallel calls -> 50 unique contiguous ids; per-tenant + per-entity counters independent; padding override works.
- test-roles.ts now has 24 assertions (added A.4 identity tests). USE nextTenantId at entity creation starting in B.1.

_Earlier: after A.3.10 (cross-role test suite) — A.3 DONE except 8/9 (blocked by B.1)_

## A.3 line 10 "Cross-role test suite": DONE
- scripts/_assert.ts (tiny harness), scripts/test-roles.ts (21 assertions). npm run test:roles. Exit 1 on fail (CI-ready). Needs seed (2 schools).
- A.3 STATUS: lines 1-7,10 DONE. Lines 8 (TEACHER own-class) & 9 (PARENT own-child) BLOCKED until B.1 Student/Class models — build row-scoping helpers then.

## A.3 line 7 "Server-component redirect on forbidden": DONE
- src/lib/core/page-guards.ts: requirePageUser (->/login), requirePagePermission(...perms) & requirePageRole(...roles) -> redirect("/forbidden").
- src/app/forbidden/page.tsx calm screen. Applied to /settings/modules (tenant.manage_modules) + /settings/data (tenant.export_data).
- TESTING NOTE: Next 14 redirect() in a dynamic Server Component returns HTTP 200 with a CLIENT-SIDE redirect payload (curl sees 200). Verify by body content: unauthorized body has NO page content + contains "/forbidden"; real browsers redirect. Don't trust curl status for RSC redirects.

## A.3 line 6 "Sidebar nav role-filtered": DONE
- navigation.ts: NavItem.permission added; filterNavigation(sections, enabledSet, hasPermission) composes module + permission filters.
- Sidebar (client) calls usePermissions().has and filters NAVIGATION by both. System items Modules(perm tenant.manage_modules)/Data(tenant.export_data) gated; Security/Settings always shown.
- Verified per role: principal full; bursar=Students/Finance/Library; librarian minimal; etc.

## A.3 lines 4+5 "frontend permissions": DONE
- components/auth/permissions-provider.tsx: PermissionsProvider (seeded from server via permissionsForRole in (app)/layout, re-syncs from /api/auth/permissions). Hooks: usePermissions() {role,permissions,has,hasAny,hasAll}, usePermission(perm).
- components/auth/can.tsx: <Can permission|anyOf|allOf fallback>. USE ONLY IN CLIENT TREES.
- components/dashboard/quick-actions.tsx: client component gating dashboard actions by permission.
- IMPORTANT RSC LESSON: don't pass icon component functions (or any function props) from a Server Component into a client component. Sidebar/AppShell now take enabledModules: string[] and filter NAVIGATION client-side (was passing navSections with icon fns -> 500).
- Verified: principal sees 3 quick actions, bursar 2, teacher 1, student/librarian fallback; all dashboards 200.

## A.3 lines 1+2+3 "Roles/permissions core": DONE
- roles.ts: 16 roles enum verified (single source of truth).
- src/lib/core/permissions.ts: PERMISSIONS catalogue + ROLE_PERMISSIONS for all 16 roles; can(role,perm) (SUPER_ADMIN=all), permissionsForRole(role), assertMatrixComplete().
- session.ts: added requirePermission(...perms) guard (alongside requireRole).
- API GET /api/auth/permissions -> {role, permissions[]}. /api/modules/[key] now uses requirePermission("tenant.manage_modules").
- Verified: matrix spot-checks pass; bursar 403 on module toggle; principal ok.

_Earlier: after A.2.10 tenant data export — A.2 DONE (except line 4 deferred)_

## A.2 line 10 "Tenant data export": COMPLETE & VERIFIED
- src/lib/services/export.service.ts: exportTenantData(tenantId) -> {manifest, school, users, modules, auditLog}; tenant-scoped via withTenant+tenantDb; REDACTS passwordHash/totpSecret/encryptedDek. recordExportAudit.
- API GET /api/tenant/export (requireRole owner/principal/super_admin) -> downloadable JSON (Content-Disposition).
- UI: /settings/data + components/settings/data-export-card.tsx (blob download). Sidebar "Data" added.
- Verified: 403 for non-leadership, secrets absent, tenant isolation (Uhuru export = 2 users), audit tenant.data_exported.
- A.2 STATUS: lines 1,2,3,5,6,7,8,9,10 DONE. Line 4 "Custom domain (Elite)" DEFERRED (needs real DNS at deploy).

## A.2 line 9 "Tenant impersonation (audit-logged)": COMPLETE & VERIFIED
- DB: Session.impersonatedUserId. Migration a2_impersonation.
- session.ts: getSessionContext() returns {user(=effective), isImpersonating, realUser, token}. getCurrentUser() now returns the EFFECTIVE user (impersonated when impersonating) — all tenant-scoped code auto-acts as target school.
- src/lib/services/impersonation.service.ts: startImpersonation (SUPER_ADMIN only, blocks impersonating another admin, audits in target tenant), stopImpersonation.
- API: POST /api/admin/impersonate {targetUserId}, POST /api/admin/impersonate/stop.
- UI: components/shell/impersonation-banner.tsx (amber sticky banner + Exit). (app)/layout.tsx uses getSessionContext, renders banner, skips subdomain guard while impersonating.
- Seed: NEYO super-admin support@neyo.co.ke (NEYO-ADMIN-001, SUPER_ADMIN, pwd Karibu2026!). 11 users total.
- TODO later: a support-console UI to pick a tenant/user (currently start via API). Audit actions: support.impersonation_started/_stopped.

## A.2 line 7 "Per-tenant encryption keys (DEK/KEK)": COMPLETE & VERIFIED
- DB: Tenant.encryptedDek/dekIv/dekTag (wrapped per-tenant DEK). Migration a2_tenant_dek.
- Master KEK: env NEYO_MASTER_KEK (base64 of 32 bytes; added to .env). PROD: load from KMS in src/lib/crypto/kek.ts getKek().
- src/lib/crypto/kek.ts: wrap/unwrapWithKek + explicit-key variants (for rotation). AES-256-GCM.
- src/lib/crypto/envelope.ts: generateDek + encrypt/decryptWithDek (compact "v1:iv:tag:ct" string).
- src/lib/services/encryption.service.ts: ensureTenantDek, encryptForTenant, decryptForTenant, rotateKek(oldKek,newKek). DEKs lazily provisioned.
- Seed calls ensureTenantDek for both schools. Proven: per-tenant DEKs differ, round-trip, cross-tenant decrypt blocked, tamper detected, KEK rotation keeps data readable.
- USE THIS in A.6 to store per-tenant M-Pesa credentials.

## A.2 line 6 "Per-tenant module toggling": COMPLETE & VERIFIED
- DB: TenantModule(tenantId, moduleKey, enabled) @@unique([tenantId,moduleKey]). Migration a2_tenant_modules. Added to TENANT_OWNED_MODELS.
- Registry src/lib/core/modules.ts: MODULES (students+finance are core/locked; hostel/transport/library/lms defaultOn:false).
- Service src/lib/services/module.service.ts: getModuleStates/getEnabledModuleKeys/setModule(audit)/initialiseModules. ModuleError mapped in respond.ts.
- API: GET /api/modules; PATCH /api/modules/[key] (requireRole owner/principal/deputy/super_admin).
- UI: /settings/modules + ModulesManager (Toggle switch, optimistic). Sidebar filtered via filterNavigation(NAVIGATION, enabledKeys) in (app)/layout.tsx; nav items tagged moduleKey. Added ui/toggle.tsx. Sidebar/AppShell accept navSections prop.
- Seed: Karibu (boarding) = hostel+library ON; Uhuru (day) = defaults. 14 module rows.

## A.2 line 5 "Tenant slug uniqueness + reserved words": COMPLETE & VERIFIED
- src/lib/validations/tenant.ts: tenantSlugSchema (lowercase a-z0-9 single-hyphen, 3-40), createTenantSchema, slugify(name).
- src/lib/services/tenant.service.ts: checkSlug (INVALID/RESERVED/TAKEN), assertSlugUsable (throws SlugError), suggestSlug (appends -2,-3...).
- API GET /api/tenant/slug-check?slug=&name=. respond.ts now maps SlugError (409/422) + TenantIsolationError (403).
- UI: src/components/ui/slug-field.tsx (debounced live check, 4 states). Ready for signup/settings (A.5).
- RESERVED_SUBDOMAINS shared from subdomain.ts.

## A.2 line 3 "Wildcard subdomain routing": COMPLETE & VERIFIED
- src/lib/core/subdomain.ts: slugFromHost + resolveTenantSlug (prod subdomain; dev overrides ?tenant= and x-neyo-tenant header; RESERVED_SUBDOMAINS filter). Env ROOT_DOMAIN (default neyo.co.ke).
- src/middleware.ts: edge middleware injects x-neyo-tenant-slug header.
- src/lib/core/current-tenant.ts: currentTenantSlug() + currentSubdomainTenant(). API GET /api/tenant/current.
- src/lib/services/tenant.service.ts: getTenantBySlug/getTenantById.
- ENFORCEMENT in (app)/layout.tsx: subdomain present & != user's tenant -> redirect /wrong-school. Login page shows resolved school name.
- Verified: resolution for both schools, reserved/unknown -> null, cross-tenant subdomain blocked (307 /wrong-school).

## A.2 lines 1+2+8 "Tenant isolation": COMPLETE & VERIFIED
- src/lib/core/tenant-context.ts: AsyncLocalStorage withTenant(tenantId, fn) / getTenantId / requireTenantId.
- src/lib/core/tenant-tables.ts: TENANT_OWNED_MODELS = [user, idSequence, auditLog]. ADD every new tenant-owned model here.
- src/lib/core/tenant-db.ts: tenantDb() = Prisma $extends that auto-injects where.tenantId on reads/bulk, stamps tenantId on create, verifies tenant on findUnique/update/delete (throws TenantIsolationError), and FAILS CLOSED if no tenant in scope.
- src/lib/core/with-tenant-session.ts: runInTenantSession(fn) bridges session->tenant; gives {user, db}.
- prisma/rls/policies.sql: real Postgres RLS to apply on deploy (SQLite has no RLS). Uses SET app.tenant_id GUC.
- Seed now has 2 schools: karibu-high (8 users) + uhuru-academy (2 users: principal@uhuruacademy.ac.ke, bursar@uhuruacademy.ac.ke; pwd Karibu2026!). Cross-tenant regression test passes.

_Earlier: A.1 Authentication (all non-OAuth lines done)_

## A.1 line 7 "WebAuthn / passkey": COMPLETE & VERIFIED (server side; ceremony is browser-only)
- Libs: @simplewebauthn/server@10 + /browser@10. RP config in src/lib/core/webauthn.ts (env WEBAUTHN_RP_ID / WEBAUTHN_ORIGIN; dev=localhost).
- NOTE on v10 API: registrationInfo uses credentialID/credentialPublicKey/counter; verifyAuthenticationResponse takes `authenticator:{credentialID,credentialPublicKey,counter,transports}`.
- DB: Credential (publicKey b64url, counter, transports, deviceLabel), WebAuthnChallenge (purpose REGISTER/LOGIN). Migration a1_webauthn_passkeys.
- Service src/lib/services/passkey.service.ts: getRegistrationOptions/verifyRegistration/getLoginOptions/verifyLogin(+2FA via maybeConvertToTotpChallenge)/listPasskeys/deletePasskey.
- API: /api/auth/passkey/{register/options,register/verify,login/options,login/verify,[id] DELETE}.
- UI: login "passkey" step (startAuthentication), settings PasskeysCard (startRegistration).
- TESTABLE ONLY in real browser at localhost (WebAuthn needs secure context + authenticator; NOT in Arena preview iframe).

## A.1 line 8 "2FA via TOTP": COMPLETE & VERIFIED
- Libs: otplib (RFC 6238) + qrcode (inline data-URI). No external account.
- DB: User.totpSecret/totpEnabled/totpVerifiedAt; models RecoveryCode (hashed, single-use), TotpChallenge (short-lived). Migrations a1_totp_2fa, a1_totp_challenge.
- Service `src/lib/services/totp.service.ts`: startTotpSetup/enableTotp(+recovery codes)/disableTotp/checkSecondFactor(TOTP or recovery)/createTotpChallenge/solveTotpChallenge/maybeConvertToTotpChallenge.
- ENFORCEMENT: all 3 login routes (otp/verify, password/login, magic/callback) call maybeConvertToTotpChallenge -> if 2FA on, NO session; returns {twoFactorRequired, challengeToken} (magic redirects /login?challenge=).
- API: /api/auth/2fa/{setup,enable,disable,verify}. Login page has a "twofactor" step (OtpInput). Settings: /settings/security + components/settings/two-factor-card.tsx. Sidebar has "Security".

## A.1 line 12 "Logout everywhere": COMPLETE & VERIFIED
- Service `destroyAllSessionsForUser(userId)` deletes all Session rows for a user, audit-logs `auth.logout_everywhere`.
- API `POST /api/auth/logout-everywhere` (requires session, clears current cookie).
- UI: "Sign out all devices" in `components/shell/user-menu.tsx` (confirm step).
- Verified cross-session: device1 logout-everywhere invalidates device2.

## ALSO TICKED (were built earlier inside A.1.1): phone OTP rate limit, verify-attempt limit, HttpOnly/Secure/SameSite cookie, login+logout audit.
## DEFERRED (need founder external accounts): Google/Apple/Microsoft OAuth, account linking, OAuth disconnect.

## A.1 line 3 "Magic link via email": COMPLETE & VERIFIED
- DB: `MagicLink` (hashed single-use token, expiry, consumedAt). Migration `a1_magic_links`.
- Email seam: `src/lib/notifications/email.ts` (dev console; swap for Resend in A.7). `appBaseUrl()` reads `APP_BASE_URL`.
- Service: `src/lib/services/magic-link.service.ts` — `requestMagicLink` (rate-limited, 15-min), `consumeMagicLink` (single-use, session + audit).
- API: `POST /api/auth/magic/request`, `GET /api/auth/magic/callback?token=` (sets cookie, redirects /dashboard or /login/magic?error=CODE).
- UI: `/login` magic + magic-sent steps (dev clickable link); error landing `(auth)/login/magic/page.tsx`.

## A.1 line 2 "Email + password backup login": COMPLETE & VERIFIED
- Argon2id via `@node-rs/argon2` (prebuilt; marked external in `next.config.mjs` → `experimental.serverComponentsExternalPackages`).
- Service: `setUserPassword`, `loginWithPassword` (generic anti-enumeration error, uniform timing). Audit-logged.
- Zod: `loginEmailSchema`, `setPasswordSchema`. API: `POST /api/auth/password/login`.
- UI: `PasswordInput` (show/hide). `/login` now toggles phone ↔ email methods (steps: phone/code/email/success).
- Seed: all 8 staff have dev password `Karibu2026!` (emails in seed table).

> In a new chat, paste Prompts 1/2/3 + this file to resume instantly.

## 0) SANDBOX TIP — running the dev server
The sandbox kills a plain `... &` background job. Use this exact pattern:
```bash
cd /home/user/neyo
(setsid npm run dev </dev/null >/tmp/dev.log 2>&1 &) ; sleep 12
# ...run curl tests...
pkill -9 -f next-server   # to stop
```

## 1) What we have successfully built
- **A.1 line 1 "Phone + OTP login (KE-first)": COMPLETE & VERIFIED (all 8 chunks).**
  - DB models: `OtpCode` (hashed code, expiry, attempts, consumedAt), `Session` (opaque token behind HttpOnly cookie).
  - Zod + phone normalizer `normalizeKePhone` (→ +254XXXXXXXXX); request/verify schemas.
  - `auth.service.ts`: crypto OTP gen, SHA-256 hash, constant-time compare, rate limit (3/15min), attempt limit (5), session create, AuditLog on login/logout. SMS seam in `notifications/sms.ts` (dev console; swap for Africa's Talking in A.7).
  - API: `POST /api/auth/otp/request`, `POST /api/auth/otp/verify` (sets cookie), `POST /api/auth/logout`, `GET /api/auth/me`.
  - UI: `Input`, `Label`, `OtpInput` (auto-advance/paste/backspace) added to library.
  - Pages: `(auth)/login` (phone→code→success), `(auth)/layout`. `(app)/layout` is now SESSION-GUARDED (redirects to /login) and passes the REAL user to the shell. Logout via `UserMenu`.
  - 4 UX states: `login/loading.tsx`, `(app)/loading.tsx`, global `error.tsx`, success card + toasts.
  - Seed: 8 Kenyan staff across roles (Principal/Bursar/Deputy/Teacher/ClassTeacher/Receptionist/Accountant/Librarian), normalized phones, idempotent.
- **Chunk 0 — Foundation Setup: COMPLETE & VERIFIED.**
  - Next.js 14 (App Router) + TypeScript project at `/home/user/neyo`.
  - Tailwind design tokens (navy + green + warm white, Inter 400/500/600/700, 8pt grid, apple easing, soft shadows, rounded-full / rounded-2xl).
  - Prisma ORM wired to a **SQLite dev DB** (`prisma/dev.db`). Migration `chunk0_foundation` applied.
  - Base UI library: Button, Card, Badge, StatCard, EmptyState, Skeleton, Toast (provider + useToast).
  - Odoo app shell: Topbar (module switcher + Cmd+K search surface + bell + user chip + dark toggle), Sidebar (role-ready nav), Breadcrumbs, responsive drawer on mobile.
  - Dashboard page reads **real DB counts**.
  - `npm run build` passes clean; dev server serves `/` → `/dashboard` (HTTP 200).

## 2) Current database schema state (`neyo/prisma/schema.prisma`)
- Provider: **sqlite** (dev). Switch to **postgresql** + Neon for prod.
- Models include: `Tenant`, `User` (16-role string), `IdSequence`, `AuditLog`, `OtpCode`, `Session`, `MagicLink`, `RecoveryCode`, `TotpChallenge`, `Credential`, `WebAuthnChallenge`, `TenantModule`, `Subscription`, `SubscriptionPayment`, `UsageCounter`, `PaymentCredential`, `Payment`, `Notification`, `NotificationPreference`, `NotificationTemplate`, `Conversation`, `ConversationParticipant`, `Message`, `StoredFile`, `DocumentVerification`, `JobRun`, `ApiKey`, `WebhookSubscription`, `WebhookDelivery`, `CalendarEvent`, `VisitorLog`, `AdmissionInquiry`, `PhoneMessage`.
- 16 roles canonical list lives in `src/lib/core/roles.ts` (NOT a Prisma enum, because SQLite; validated via Zod).
- Login test phones: Principal 0712345678 · Bursar 0733221100 · Receptionist 0729334455 (see seed for all 8). Dev password for all staff: `Karibu2026!`.

## 3) Exact folder paths of key files
- Design tokens: `neyo/tailwind.config.ts`
- Global CSS: `neyo/src/app/globals.css`
- Prisma schema: `neyo/prisma/schema.prisma`
- Seed: `neyo/prisma/seed.ts`
- DB client singleton: `neyo/src/lib/db.ts`
- Helpers (cn, formatKES, formatPhoneKE): `neyo/src/lib/utils.ts`
- Roles: `neyo/src/lib/core/roles.ts`
- Sidebar nav config: `neyo/src/lib/core/navigation.ts`
- UI components: `neyo/src/components/ui/*`
- App shell: `neyo/src/components/shell/*`
- Root layout (Inter + ToastProvider): `neyo/src/app/layout.tsx`
- App route group layout: `neyo/src/app/(app)/layout.tsx`
- Dashboard: `neyo/src/app/(app)/dashboard/page.tsx`
- Memory: `docs/PROMPT-1-SYSTEM-IDENTITY.md`, `docs/PROMPT-2-EXECUTION-PROTOCOL.md`, `docs/PROMPT-3-DESIGN-CONTINUITY.md`, `docs/FEATURES-CHECKLIST.md`, `docs/CONTEXT-ANCHOR.md`

## 4) Commands to run the project
```bash
cd /home/user/neyo
npm install            # only if node_modules missing (not snapshotted)
./node_modules/.bin/prisma migrate dev   # apply migrations
npm run db:seed        # seed Kenyan data
npm run dev            # http://localhost:3000
```

## VISUAL QA (2026-06-11): captured screenshots via Playwright (chromium; needed sudo apt-get libnss3 etc.). Screenshots in /home/user/screenshots. Quality: dashboard/login/wizard/dark-mode/⌘K/mobile all production-grade (Odoo+Apple+Linear). FIXED a global double-focus-ring bug: globals.css now excludes input/textarea/select from the global :focus-visible ring (they get their wrapper ring). Screenshot script at neyo/scripts/screenshots.ts (use waitUntil domcontentloaded + fixed waits; networkidle hangs due to SSE).

## 5) NEXT feature to build
**PART B — B.1 Student Management** (see "NEXT" section at top of this file).

FOUNDER LATER (unchanged): Daraja, OAuth, SMS/Email/WhatsApp/VAPID, R2, Redis/Upstash, Sentry/BetterStack/PostHog/Logtail, custom domain DNS, thermal printer.
PENDING IN-CODE: A.3 lines 8/9 row-scoping (build in/after B.1).
