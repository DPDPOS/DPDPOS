# DPDPOS Frontend — Implementation Plan

**Project:** DPDPOS — Digital Personal Data Protection Operating System
**Stack:** Next.js (App Router) + TypeScript
**Document status:** Living document — derived from a full study of `dpdpos_backend`
**Audience:** Developers building the frontend; the design decision here must be traceable to backend reality.

---

## 0. How to read this document

This plan is written bottom-up from the backend that already exists in `dpdpos_backend/`. Nothing in it is speculative: every screen, query, mutation, and status chip maps to a real endpoint, DTO field, enum, permission string, or state machine that was read directly from the backend source.

- **§1** states the product truth and the non-negotiables the backend already imposes on us.
- **§2–§6** are the decisions: stack, visual language, information architecture, app shell, auth.
- **§7** is the data layer — the single most important engineering section.
- **§8** is the component architecture.
- **§9** is the page-by-page build spec (the bulk of the work).
- **§10** covers the four cross-cutting workflows that make the product feel like an *operating system* rather than a CRUD app.
- **§11–§16** are structure, phasing, testing, non-functional requirements, and definition of done.
- **Appendix A** is the full endpoint contract reference extracted from the backend.

---

## 1. Backend reality (the ground truth)

### 1.1 What DPDPOS is

DPDPOS converts the obligations of India's **Digital Personal Data Protection Act, 2023** and the **DPDP Rules, 2025** into an operational compliance platform: organizations, frameworks of controls and requirements, data inventories, notices and consent, Data Principal rights requests, deterministic validations, violations and remediation, an evidence vault, audit logs, reports, notifications, and an AI assistance layer.

The backend is a **multi-tenant, modular Express 5 + TypeScript + Prisma (PostgreSQL)** service with BullMQ workers (Redis), S3 presigned-URL file storage, an outbox event bus, and a frozen RBAC permission catalog. The API is versioned under `/api/v1`.

### 1.2 What the backend imposes on the frontend (non-negotiable)

These are constraints discovered in code — the UI must be designed around them:

| Constraint | Detail | Frontend consequence |
|---|---|---|
| **Tenant scoping** | Every domain record belongs to `organizationId`; the server derives it from the JWT, never from the body | The frontend never sends `organizationId` in mutation bodies. Login is the only place an org id is provided. |
| **Response envelope** | All success responses are `{ success: true, data, meta? }` | One unwrapping layer in the API client, never per-request. |
| **Error envelope** | All errors are `{ success: false, error: { code, message, details? } }` with codes `VALIDATION_ERROR` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `CONFLICT` (409), `RATE_LIMITED` (429), `SERVICE_UNAVAILABLE` (503), `INTERNAL_ERROR` (500) | A typed `ApiError` with a code-switch UI policy (see §7.4). |
| **Validation error details** | `details` is a **zod `flatten()`** object: `{ formErrors: string[], fieldErrors: Record<string, string[]> }` | Form error mapping is free — `fieldErrors` maps 1:1 to inputs. |
| **Pagination** | `meta.pagination = { page, pageSize, total, totalPages }` | A single `usePaginatedQuery` abstraction; server-side `page`/`pageSize` query params, `pageSize` max 100, default 20. |
| **Bearer access token** | `Authorization: Bearer <jwt>`; access TTL default **900 s**, refresh TTL default **7 d**; refresh token rotates on every use | Session store + silent refresh interceptor (§6.3). |
| **MFA for privileged roles** | `ORG_ADMIN`, `DPO`, `AUDITOR` get a login challenge (`mfaRequired: true` → `mfaToken`) and/or must enroll (`mfaEnrollmentRequired`) | Dedicated MFA screens; a "secure session" gating model on sensitive actions. |
| **Optimistic locking** | Rights requests, violations, remediation tasks carry a `version` int; updates pass `version` and a mismatch returns `409 CONFLICT` | Every update form on these entities must send the current `version` and render a recoverable conflict state (§7.6). |
| **Status enums** | Large closed enum sets on controls, requests, violations, remediation, evidence, runs, reports, notifications | Status is a first-class design language: chips, filters, dashboard buckets, state-machine-driven action buttons (§5.5). |
| **State machines** | Violation, remediation, and evidence lifecycles are enforced server-side | The UI must never offer an illegal transition; action availability = `canTransition(from, to)` mirrored client-side (§10.4). |
| **Async processing** | Validation runs, reports, AI requests are enqueued → `PENDING → RUNNING → COMPLETED/FAILED` | Polling + "queue-aware" UI for these resources (§7.7). |
| **Permissions** | Routes require `resource:action` strings from a frozen catalog; system roles preset: `ORG_ADMIN`, `DPO`, `COMPLIANCE_OFFICER`, `AUDITOR`, `MEMBER` | Permission-aware rendering via `<Can>` and route guards using `user.permissions` from `GET /auth/me` (§6.4). |

### 1.3 Backend module → frontend surface map

Every backend module maps to exactly one primary frontend area — **20 backend modules → 21 frontend areas** (inventory, consent, and validations each expose two screens):

| Backend module | Base path | Frontend area |
|---|---|---|
| Auth | `/auth` | Login, MFA, accept invite, session |
| Organizations | `/organizations` | Onboarding, org settings |
| Users | `/users` | People / invite management |
| Roles | `/roles` | Roles & permissions |
| Departments | `/departments` | Departments |
| Framework | `/framework` | Framework builder + roadmap |
| Controls | `/controls` | Controls register |
| Requirements | `/requirements` | Obligations register |
| Inventory (data assets) | `/data-assets` | Data inventory |
| Inventory (processing activities) | `/processing-activities` | Processing activity map |
| Consent (notices) | `/notices` | Notices |
| Consent (records) | `/consent-records` | Consent records |
| Rights | `/data-subject-requests` | Rights requests |
| Validations (rules) | `/validation-rules` | Rule library |
| Validations (runs) | `/validation-runs` | Validation runs + results |
| Violations | `/violations` | Violations board |
| Remediation | `/remediation-tasks` | Remediation |
| Evidence | `/evidence` | Evidence vault |
| Audit | `/audit` | Audit log |
| Notifications | `/notifications` | Notification center |
| Analytics | `/analytics` | Dashboard |
| Reports | `/reports` | Report center |
| AI | `/ai` | AI assistant surfaces |

### 1.4 Seed data the frontend can rely on (demo mode)

From `prisma/seed/seed.ts`:

```text
Organization : "Demo Data Fiduciary Pvt Ltd"  (id 00000000-0000-4000-8000-000000000001)
Admin user   : admin@demo.dpdpos.local / ChangeMe123!
Roles        : ORG_ADMIN, DPO, COMPLIANCE_OFFICER, AUDITOR, MEMBER
Department   : Compliance (head = admin)
```

The login screen should surface this seed account in development builds (a "use demo credentials" affordance) — it makes the capstone demo one click away.

### 1.5 Backend environments

- Backend default port: **3000** (`PORT`), frontend dev server should run on a different port (e.g. **3001**) and proxy `/api` → backend (Next rewrites, §7.8).
- Health endpoints: `GET /healthz`, `GET /readyz` (checks DB + Redis).

---

## 2. Technology decisions (with justification)

| Concern | Choice | Justification |
|---|---|---|
| Framework | **Next.js 15 (App Router), React 19, TypeScript `strict`** | Required by the brief. App Router gives route groups for auth vs. authenticated shells, Server Components for first paint, and `loading.tsx`/`error.tsx` conventions that map directly to our loading/error design. |
| Styling | **Tailwind CSS v4 + CSS custom properties as design tokens** | The design system in §5 is expressed as tokens (not ad-hoc utilities) so density, status colors, and spacing stay consistent. Tailwind v4's CSS-first config keeps tokens in one `globals.css`. |
| UI primitives | **Radix UI (headless) + our own styled components** | We deliberately **do not** pull a ready-made component library. Ready-made libraries are the #1 source of "AI-generated" looks (indigo gradients, rounded-2xl cards, generic tables). Radix gives accessible behavior (dialog, dropdown, popover, combobox, tabs, tooltip) and we own 100% of the visual layer. |
| Server state | **TanStack Query v5** | The backend is a paginated, cacheable REST API. TanStack Query gives us cache keys, refetch-on-focus/window, polling (`refetchInterval`) for async resources, optimistic updates with rollback, and mutation invalidation — all of which this product needs (§7). |
| Client state | **Zustand (small, 2 stores)** | Only *session* and *UI chrome* are client state (access token, current user, sidebar/drawer state). Everything else is server state. Zustand is minimal and has no boilerplate. |
| Forms | **React Hook Form + Zod (via `@hookform/resolvers`)** | Backend validation is Zod; we mirror the same schemas (transpiled into a shared `schemas/` folder) so client and server validation cannot drift. RHF handles the controlled/uncontrolled complexity of wizard + drawer forms. |
| Validation schemas | **Zod, mirrored from backend DTOs** | Field names, enum values, and optionality are copied 1:1 from backend `dto/*.ts` files. A code comment in each schema file records the source DTO. |
| Charts | **Hand-rolled SVG (sparklines, bars, donuts) + `recharts` only if a complex chart is needed** | Dashboard charts are deliberately simple (compliance trend, status breakdowns). Hand-rolled SVG for the 95% case keeps the bundle small and the look bespoke; recharts is a fallback. |
| Icons | **lucide-react (stroke-based, single weight)** | Consistent 1.5px stroke at 16/18/20px. No emoji anywhere in the product UI. |
| Dates | **date-fns** (tz-safe, tree-shakable) | SLA countdowns, due dates, and audit timestamps are everywhere; `date-fns` formats + our own relative-time helper. |
| Code quality | ESLint 9 + Prettier + TypeScript strict; **tsc --noEmit** in CI | Matches backend conventions (backend already uses ESLint 9 + typescript-eslint). |
| Unit/component tests | **Vitest + Testing Library + MSW** | MSW intercepts the API at the network layer using the real envelope format, so components are tested against backend-shaped contracts without a running server. |
| E2E | **Playwright** | Full journeys (onboarding → framework → validation → violation → remediation → evidence → report) with the seeded demo org. |
| Environment | Node ≥ 20, `create-next-app` with `--typescript --tailwind --eslint --app` | |

**Explicitly rejected (with reasons):**

- **shadcn/ui as a wholesale dependency** — acceptable as a *reference* for Radix wiring, but its default styles are exactly the "generated" look we must avoid. We write our own primitives once.
- **Redux / MobX** — overkill; TanStack Query owns server state.
- **GraphQL / tRPC** — the backend is a REST contract; we consume it as-is.
- **MUI / Ant / Chakra** — visual identity lock-in, heavy bundles, and their defaults fight our density goals.
- **next-auth** — the auth flow is custom (org id + email + password, MFA challenge, invite tokens, refresh rotation); `next-auth` adds no value and complicates the MFA/interceptor logic.
- **SWR** — TanStack Query's mutation + polling model is a better fit for the async job resources.

---

## 3. Product framing (why the UX is what it is)

The PRD (`docs/02_prd.md`) defines personas. The frontend must serve five of them on one screen at a time. We design for the **compliance operations console**, not a marketing site:

| Persona | Primary need | Where it's served |
|---|---|---|
| Founder/CEO | "Is this a problem or not, and what does the board report look like?" | Dashboard, Reports |
| DPO / Privacy lead | "What failed, why, who fixes it, by when?" | Framework, Validations, Violations, Remediation, Rights |
| Legal team | "What did we publish, what did people consent to, what's the paper trail?" | Notices, Consent, Evidence, Audit |
| Security team | "Where is the personal data, what are the controls, what evidence exists?" | Inventory, Controls, Evidence |
| Auditor | "Show me immutable, timestamped proof." | Evidence, Audit, Reports, detail views with trace footers |

**The four questions every screen must answer** (from the backend frontend plan, §2.2): *What is the current state? What needs attention? Who owns it? What is the next action?*

---

## 4. Design language — "this was not generated"

This section is the contract for the visual layer. Every component and page obeys it. The goal is the visual register of a serious engineering tool: **Linode/Linode cloud, AWS console, Stripe's internal dashboard, Sentry, PagerDuty** — dense, calm, precise, typographic.

### 4.1 What we explicitly avoid (the AI-slop checklist)

- ❌ Indigo/violet gradient hero panels, "mesh" backgrounds, glassmorphism.
- ❌ Everything rounded-2xl; pill buttons; giant drop shadows on cards.
- ❌ Emoji as icons; rainbow status dots; gradient progress bars.
- ❌ Centered, vertically-cramped, card-stack landing-page layouts inside a working console.
- ❌ Marketing copy ("Empower your compliance journey") anywhere — copy is operational and plain.
- ❌ More than one accent color. One accent, used sparingly (~10–15% of surfaces).

### 4.2 Tokens

```css
/* Palette — warm neutral (zinc family), monochrome-first */
--color-bg          : #FAFAF9;   /* app background, warm off-white */
--color-surface     : #FFFFFF;   /* cards, tables */
--color-surface-2   : #F4F4F5;   /* table header rows, wells, code blocks */
--color-border      : #E4E4E7;
--color-border-strong: #D4D4D8;
--color-ink         : #18181B;   /* primary text */
--color-ink-2       : #52525B;   /* secondary text */
--color-ink-3       : #A1A1AA;   /* muted, metadata */

/* Accent — a deep, serious "regulatory blue" (used for primary actions, active nav, focus) */
--color-accent      : #1D4ED8;
--color-accent-hover: #1E40AF;
--color-accent-soft : #EFF6FF;   /* 8% tint backgrounds for selected rows, tags */

/* Status semantics — desaturated, tinted-chip system */
--color-pass   : #15803D;  --color-pass-bg   : #F0FDF4;
--color-warn   : #B45309;  --color-warn-bg   : #FFFBEB;
--color-fail   : #B91C1C;  --color-fail-bg   : #FEF2F2;
--color-info   : #1D4ED8;  --color-info-bg   : #EFF6FF;
--color-neutral: #52525B;  --color-neutral-bg: #F4F4F5;
```

**Typography:**

- **IBM Plex Sans** (interface) — distinctive, serious, humanist; far less "default SaaS" than Inter, and its tight caps look right in an enterprise console. Self-hosted via `next/font`.
- **IBM Plex Mono** (codes, IDs, hashes, file sizes, table numbers) — control codes like `CTRL-NOTICE` and `REQ-CONSENT-01` are rendered mono everywhere.
- Scale: `11/13(px) uppercase-tracked micro-labels · 12 metadata · 13 body · 14 table/body emphasis · 16 card titles · 18 page titles · 24 metric values · 30 page hero`. Tabular numerals (`font-variant-numeric: tabular-nums`) for all dates, counts, scores, and money-free stats so columns align and SLA timers don't jitter.

**Shape & elevation:**

- Radii: `4px` inputs/buttons, `6px` cards, `8px` modals — nothing above 8px.
- Borders over shadows: every card and table is a `1px solid var(--color-border)` surface. Shadows are reserved for overlays (modal, dropdown, drawer) only.
- No gradients. No blur. 1 elevation level.
- Motion: 150–200 ms ease-out; only opacity/translate; drawers slide in from the right; row actions fade in on hover; no bounce, no spring.

**Density:**

- Table rows: 40px (compact) with an optional "comfortable" 48px toggle persisted in localStorage.
- Form controls: 36px height. Sidebar 224px collapsed to 64px icons. Content max-width none — this is a data-dense console; full-width with a 16–24px page gutter.

### 4.3 Signature details (the hand-crafted tells)

1. **Record identity bar** on every detail page: entity code (mono), status chip, created/updated by + timestamp, version badge (`v2`) for locked entities.
2. **Trace footers**: every detail view ends with *"Created by X · 12 Jun, 09:41 · Last changed by Y · 14 Jun, 17:02"* — traceability-first (§1.2 of backend frontend plan).
3. **Section headers with meta**: `Controls  ·  23 total · 12 with evidence · 4 overdue` — data in the header, not buried.
4. **Command palette (⌘K)**: jump to any page, search users/controls/violations, trigger "New …" actions. Enterprise signal, cheap to build.
5. **Empty states are actionable**: never just copy — always an icon + "what this page is for" + "why it's empty" + one primary CTA wired to the real action (e.g., "Upload first evidence", "Run first validation").
6. **Inline, right-aligned row actions** on tables (kebab or icon set) revealed on hover — tables stay calm until you engage.
7. **Keyboard shortcuts**: `g d` dashboard, `g v` violations, `n` new-in-context, `/` focus search, `j/k` next/previous row in queues.

---

## 5. Information architecture & routing

### 5.1 Route groups

```text
src/app/
├─ (auth)/                # centered minimal layout, no shell
│  ├─ login/
│  ├─ mfa/                # mfa challenge + enrollment steps
│  ├─ accept-invite/
│  └─ onboard/            # organization creation (first-run)
├─ (app)/                 # authenticated shell (§5.3)
│  ├─ layout.tsx          # AppShell: sidebar + topbar + command palette
│  ├─ dashboard/
│  ├─ framework/
│  ├─ framework/roadmap/
│  ├─ controls/
│  ├─ requirements/
│  ├─ inventory/
│  ├─ processing/
│  ├─ notices/
│  ├─ consent/
│  ├─ rights/
│  ├─ validations/
│  ├─ violations/
│  ├─ remediation/
│  ├─ evidence/
│  ├─ reports/
│  ├─ audit/
│  ├─ notifications/
│  ├─ ai/
│  ├─ users/
│  ├─ roles/
│  ├─ departments/
│  └─ settings/
└─ api/                   # Next rewrites only (§7.8)
```

### 5.2 Route → permission gate matrix

Every `(app)` route is a client component that checks permissions *after* server-side auth (see §6.4). The map below uses the exact permission strings from `src/shared/constants/permissions.ts`.

| Route | Permission(s) required | Notes |
|---|---|---|
| `/dashboard` | `analytics:read` fallback: any authed user sees a reduced dashboard | Full board for privileged roles |
| `/framework`, `/framework/roadmap` | `framework:read`; generate button `framework:generate`; publish `framework:publish` | |
| `/controls` | `control:read`; create `control:create`; update `control:update` | |
| `/requirements` | `requirement:read`; map requires `requirement:create` | |
| `/inventory`, `/processing` | `data_asset:read` / `processing_activity:read`; writes per `…:create/update/delete` | |
| `/notices`, `/consent` | `notice:read` / `consent:read`; create/delete/withdraw gated per action | |
| `/rights` | `rights_request:read`; submit/update gated | |
| `/validations` | `validation:read`; "Run validation" button `validation:run` | |
| `/violations` | `violation:read`; assign `violation:assign`; close `violation:close` | |
| `/remediation` | `remediation:read`; updates `remediation:update` | |
| `/evidence` | `evidence:read`; upload `evidence:create`; approve/lock `evidence:approve`; export `evidence:export` | |
| `/reports` | `report:read`; generate `report:generate` | |
| `/audit` | `audit:read`; export `audit:export` | |
| `/notifications` | `notification:read`; preferences `notification:update_preferences` | |
| `/ai` | `ai:explain` (draft button `ai:draft`) | |
| `/users` | `user:read`; invite `user:create`; update `user:update` | |
| `/roles` | `role:read`; create/update `role:create`/`role:update_permissions` | |
| `/departments` | `department:read`; create `department:create` | |
| `/settings` | `organization:read`; update `organization:update` | |

### 5.3 App shell

- **Sidebar** (collapsible 224→64px): workspace switcher (org name + status), primary nav grouped as **Overview** (Dashboard), **Programme** (Framework, Controls, Obligations, Roadmap), **Operations** (Inventory, Processing, Notices, Consent, Rights), **Enforcement** (Validations, Violations, Remediation), **Proof** (Evidence, Reports, Audit), **System** (Users, Roles, Departments, AI, Settings). Nav items render only when the user holds at least the read permission for that area (§6.4).
- **Topbar**: breadcrumbs, global search (`/`), notification bell with unread dot (`GET /notifications/unread-count` polled every 60 s), user menu (name, role chips, MFA status, logout).
- **Command palette (⌘K)** mounted at shell level.
- **Notification drawer**: slide-over listing notifications with mark-read on open (`PATCH /notifications/:id/read`, `PATCH /notifications/read-all`), each with a deep-link to its `relatedEntityType/relatedEntityId`.

---

## 6. Auth & session layer

### 6.1 Flows (mirror of `auth.service.ts` + `auth-guards.md`)

**Login**
1. Form: org id, email, password → `POST /auth/login`.
2. Response A `{ mfaRequired: false, user, tokens }` → store session → redirect to intended page (or MFA enrollment banner if `mfaEnrollmentRequired`).
3. Response B `{ mfaRequired: true, mfaToken, expiresIn: 300 }` → render MFA code step (6–8 digits). `POST /auth/mfa/verify { mfaToken, code }` → tokens + user → enter app. Show a 5-minute countdown; on expiry the user must re-login.

**MFA enrollment** (triggered by `mfaEnrollmentRequired` on login or `/auth/me`):
1. `POST /auth/mfa/setup` → `{ secret, otpauthUrl }` → render secret as mono copy block + QR code (render QR client-side with `qrcode` lib from the `otpauth://` URL) + 6-step guidance.
2. `POST /auth/mfa/confirm { code }` → success state → dashboard.

**Accept invite**: `/accept-invite` — email, invite token (from URL query `?token=`), new password (≥ 8 chars) → success → login.

**Session bootstrap on reload**: read refresh token → `POST /auth/refresh` (rotates) → store new access token → `GET /auth/me` → hydrate Zustand store. If refresh fails with 401 → clear session → `/login?reason=expired`.

**Logout**: `POST /auth/logout { refreshToken }` with the current access token attached so its `jti` is denied server-side → clear local session → `/login`.

### 6.2 Token storage decision (justified)

The backend is **Bearer-token based and returns tokens in the body**; it does not support cookie auth. Realistic storage:

- **Access token → memory (Zustand)**. Never persisted. TTL 15 min.
- **Refresh token → `localStorage`** (key `dpdpos.refreshToken`) OR `sessionStorage` per a user setting. Trade-off accepted and documented: an XSS vector on the refresh token is mitigated with strict CSP, no third-party scripts, sanitized rendering, and the 7-day rotation window. `httpOnly` cookies would require backend changes — noted as a future hardening item, not a blocker.
- The API client attaches `Authorization` from memory only; the refresh interceptor reads the persisted refresh token.

### 6.3 Silent refresh & 401 policy

- The fetch wrapper intercepts any `401`:
  1. Single-flight refresh (a module-level promise so concurrent 401s trigger one refresh).
  2. Replay the original request with the new token (once).
  3. If refresh fails → hard logout → `/login?reason=session-expired` and a toast "Your session expired. Please sign in again."
- After any `403 FORBIDDEN`: show an inline "You don't have permission for this action" state and, if it's a route, a `403` screen with a back link — **never** a raw error.

### 6.4 Permission-aware rendering

- `usePermission()` hook reading `user.permissions` from the session store; `<Can perm="violation:close" fallback={…}>` component.
- **Action-level gating**: buttons render disabled-with-tooltip ("Requires DPO role") when the user can see the page but not the action — this teaches RBAC instead of hiding it.
- The sidebar hides whole areas without read permission; direct URL access renders the 403 screen (server still enforces — the UI is a convenience, not a security boundary).

### 6.5 MFA-sensitivity in the UI

Privileged actions (approve/lock evidence, publish framework, close violations, role permission changes) get a one-time **step-up confirm modal**: "This action is audited. Confirm to proceed." (No re-challenge token exists in the API, so the modal is a deliberate double-confirm + audit-awareness surface, not a fake second factor.)

---

## 7. Data layer (the heart of the build)

### 7.1 Typed API client

`src/lib/api/client.ts` — a thin fetch wrapper with:

```ts
type Envelope<T> = { success: true; data: T; meta?: { pagination: PaginationMeta } }
  | { success: false; error: ApiErrorBody };

async function api<T>(path: string, init?: RequestInit): Promise<T> // unwraps envelope
```

- Base URL: `process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api"` (dev: Next rewrite → `http://localhost:3000`).
- JSON body serialization, `Accept: application/json`, `Content-Type` on mutations.
- **Query builder** that skips `undefined` and formats dates as ISO — mirrors backend `z.coerce` expectations (e.g., `dueAt` strings, `page`/`pageSize` numbers).
- **Streaming/polling** helpers (§7.7).

### 7.2 Per-module API modules

`src/features/<module>/api.ts` — one file per module exposing typed functions, e.g.:

```ts
// features/violations/api.ts
export const violationsApi = {
  list: (q: ListViolationsQuery) => api<Paginated<Violation>>("/violations", { query: q }),
  create: (body: CreateViolationDto) => api<Violation>("/violations", { method: "POST", body }),
  update: (id: string, body: UpdateViolationDto) => api<Violation>(`/violations/${id}`, { method: "PATCH", body }),
  close: (id: string, body: CloseViolationBody) => api<Violation>(`/violations/${id}/close`, { method: "POST", body }),
};
```

### 7.3 Type generation strategy

- `src/types/api.ts` holds the domain types (mirrors Prisma shapes as exposed by response DTOs: e.g. `EvidenceFileRecord = EvidenceFile`).
- **DTO input types** are copied from backend zod schemas (`z.infer`) into `src/schemas/` with a source comment. These drive both form validation and TS types, so the client can't send a field the server rejects and can't miss a required one.
- CI check: a script diffs the enum member lists in `src/types/enums.ts` against the zod enum sources mirrored in `src/schemas/` (cheap guard against enum drift after backend migrations).

### 7.4 Error normalization & UX policy

`ApiError` class with `code`, `message`, `details`, `status`. Policy:

| Code | UX behavior |
|---|---|
| `VALIDATION_ERROR` | Map `details.fieldErrors` to form fields; toast for `formErrors`; log the raw issues in dev |
| `UNAUTHORIZED` | Refresh attempt; on failure → logout flow |
| `FORBIDDEN` | Inline permission state / 403 screen |
| `NOT_FOUND` | 404 state with "Back to list" |
| `CONFLICT` | Optimistic-lock recovery modal (§7.6) |
| `RATE_LIMITED` | Retry-after toast; disable the action briefly |
| `SERVICE_UNAVAILABLE` | Banner: "Core services are degraded — data may be stale"; poll `/readyz` and clear on recovery |
| `INTERNAL_ERROR` | Generic toast + "Report this" copy with correlation id if returned |

The API client never throws raw `TypeError`s — network failures normalize to a `NETWORK_ERROR` envelope so UI code has one error type.

### 7.5 Query keys & invalidation map

Central table in `src/lib/api/queryKeys.ts`:

```ts
const keys = {
  dashboard: ["dashboard"],
  controls: ["controls", filter],
  violations: ["violations", filter],   // filter = {status, severity, assignedTo, page, pageSize}
  violation: (id) => ["violations", "detail", id],
  // ... one per module, list key includes the full filter object for cache precision
};
```

**Invalidation map** (mutation → invalidated keys) — critical for cross-module consistency:

| Mutation | Invalidate |
|---|---|
| Create/update/close violation | `["violations"]`, `["violations","detail",id]`, `["dashboard"]`, `["analytics"]` |
| Create/close remediation task | `["remediation"]`, `["violations","detail",violationId]` (task list lives on the violation detail), `["dashboard"]` |
| Trigger validation run | `["validation-runs"]`; when run completes: `["validation-results"]`, `["violations"]`, `["dashboard"]`, `["analytics"]` |
| Approve/lock evidence | `["evidence"]`, `["controls","detail",controlId]` (evidence coverage), `["dashboard"]` |
| Consent withdraw | `["consent"]`, `["analytics"]` |
| Framework publish | `["framework"]`, `["controls"]`, `["requirements"]`, `["dashboard"]` |
| Role permission change | `["roles"]`, `["users"]`, **session store permission refresh** (next `/me` or on focus) |
| Report create / status change | `["reports"]` |
| Notification read | `["notifications"]`, unread count key |

### 7.6 Optimistic locking (version fields)

Rights requests, violations, remediation tasks, and **validation rules** are optimistic-locked server-side (each carries a `version` int that every PATCH must send; mismatch → `409 CONFLICT`). Evidence and reports are **not** version-locked — never send `version` to those endpoints (their strict DTOs reject unknown keys). UI rules:

1. Detail stores show a **mono version badge** (`v3`).
2. Update forms pre-fill `version` from the loaded record and send it on every PATCH/close.
3. On `409 CONFLICT`: a recovery modal showing *"This record changed while you were editing."* with:
   - the other party's changed fields (diff view of `before/after` if the record includes audit data, else a plain message),
   - **Reload record** (refetch detail) and **Retry with my changes** (auto-bump version) buttons.
4. TanStack Query `onMutate` optimistic updates are rolled back only on non-409 errors; 409 triggers the modal and refetch.

### 7.7 Async resources — polling & queue-aware UI

Three resource kinds are processed by BullMQ workers and must be polled:

| Resource | Lifecycle | Poll strategy |
|---|---|---|
| Validation run | `PENDING → RUNNING → COMPLETED/PARTIAL/FAILED` | `refetchInterval: 2000` while non-terminal; toast on terminal + invalidate dependents |
| Report | `PENDING → GENERATING → COMPLETED/FAILED` | `refetchInterval: 3000`; "Download" appears on `COMPLETED`; cancel button for PENDING |
| AI request | `PENDING → PROCESSING → COMPLETED/FAILED` | `refetchInterval: 2000`; result panel updates in place |

All three share `useAsyncResource(key, terminalStates)` — one hook that polls, shows an indeterminate progress state with the resource's stage chips, and stops polling at terminal.

### 7.8 Dev proxy (Next rewrites)

```ts
// next.config.ts
rewrites: async () => [{ source: "/api/:path*", destination: `${process.env.BACKEND_URL}/api/:path*` }]
```

No CORS work needed in dev; in production the frontend is served behind the same origin or a configured `NEXT_PUBLIC_API_BASE_URL`.

---

## 8. Component architecture

### 8.1 Primitives (`src/components/ui/`)

Buttons (primary/secondary/ghost/danger, 36px), inputs, selects (Radix `Select`), combobox (Radix + own), multi-select tags, textarea with counter, date picker (native `input[type=date]` styled — avoids a heavy date lib), switch, checkbox, radio group, tabs, tooltip, badge, kbd, toast (bottom-right stack), dialog, drawer, popover, dropdown menu, breadcrumbs, skeleton, empty state, pagination bar, error state, confirm modal.

### 8.2 Data display (`src/components/ui/data/`)

- **`DataTable`** — the workhorse. Features: sticky header, sortable columns (client memoized, server filters for paginated lists), server pagination bar (showing "Showing 1–20 of 143"), column visibility toggle, row action menu, density toggle, optional row click → detail. Column alignment rules: text left, mono codes left, numbers right (tabular), dates right.
- **`StatusChip`** — one component, driven by a status→tone map per entity (§5.5). Renders label with tinted bg + dot. Filter dropdowns reuse the same map so chip and filter never disagree.
- **`MetricCard`** — label (micro uppercase), value (24px tabular), delta/sparkline, subtle hover. No gradients, no icon-in-a-circle.
- **`ScoreRing`/`ScoreBar`** — compliance score as a bar/ring with PASS/WARN/FAIL thresholds and trend sparkline.
- **`Timeline`** — vertical event log for entity history (uses audit or local state transitions), timestamped.
- **`RecordIdentity`** — code, status chip, version, created/updated meta (the §4.3 signature).
- **`SlaIndicator`** — countdown to due date with urgency tone (ok → warn ≤ 25% remaining → fail overdue).
- **`Stepper`** — for wizards and state-machine progress (violation/remediation).
- **`UploadPanel`** — presigned upload flow (§10.2).
- **`DiffView`** — before/after JSON or field diffs for audit and 409 recovery.
- **`CommandPalette`** — ⌘K.
- **`DetailDrawer`** vs **`DetailPage`** pattern: quick inspection uses the drawer; heavy workflows (editing, evidence, timeline) use a dedicated page.

### 8.3 Feature components (`src/features/<module>/components/`)

Co-located per module: filters bar, table config, form components, detail panels, workflow-specific pieces. A feature folder owns `api.ts`, `hooks.ts`, `components/`, `schemas.ts`, `types.ts` — making each module independently testable and removable.

### 8.4 Empty / loading / error states (every page must ship all three)

- **Loading**: skeleton rows matching the final table/card geometry (never a spinner-only screen).
- **Empty**: icon + title + "why it's empty" + primary CTA wired to the real action + secondary link to docs/help.
- **Error**: tone per §7.4 with retry + back actions; never a bare stack trace.

---

## 9. Page-by-page build spec

Each entry: **Purpose · Layout · Data & keys · Interactions · Permissions · Special states**. All endpoint paths are relative to `/api/v1`.

### 9.1 Dashboard (`/dashboard`)

- **Purpose**: the four questions answered in 5 seconds. Executive + operational mix.
- **Layout** (grid, 12-col):
  - Row 1 — metric row: **Compliance score** (score ring + passed/failed/total rules + trend sparkline from `GET /analytics/compliance-score`), **Open violations** (`GET /analytics/violations` byStatus), **Evidence coverage** (`GET /analytics/evidence`), **Rights requests open** (`GET /analytics/rights-requests`).
  - Row 2 — **Recent validation runs** (list w/ status chips, `GET /validation-runs`), **Open violations** (top 5, `GET /violations?status=OPEN`), **Overdue tasks** (top 5, `GET /remediation-tasks` — the list API has no due-date filter, so fetch non-terminal tasks and compute overdue client-side from `dueAt`).
  - Row 3 — **Consent pulse** (`GET /analytics/consent` granted/withdrawn), **Recent exports** (`GET /reports`, last 5), **Activity feed** (audit tail, `GET /audit?limit=10`).
- **Data**: one `GET /analytics/dashboard` (shapes: `DashboardOverview`), plus the small lists above — each its own query key so any page action invalidates just its slice.
- **Interactions**: every metric card is a link to its section; rows deep-link. "Run validation" quick action (validation:run).
- **Special states**: empty org (no framework yet) → a prominent "Build your framework" card replaces the score row; live "degraded services" banner per §7.4.

### 9.2 Onboarding (`/onboard`) — organization creation

- **Purpose**: first-run tenant bootstrap — `POST /organizations` is public (the auth endpoints `/login`, `/mfa/verify`, `/accept-invite`, `/refresh`, `/logout` are also unauthenticated; everything else requires a bearer token).
- **Form fields** (mirror `createOrganizationDtoSchema`): name*, industry, companySize, operatingRegion, companyType, maturityLevel, `isSignificantDataFiduciary` toggle (rendered with a plain-language explainer since it changes the generated framework).
- **Flow**: create org → capture org id → route to Login (org id pre-filled) → on success route to Framework wizard.
- **Special states**: validation errors mapped from `details.fieldErrors`; "id already exists" conflicts surfaced.

### 9.3 Framework builder (`/framework`) + Roadmap (`/framework/roadmap`)

- **Purpose**: generate the compliance programme from a profile; inspect the phased roadmap; publish.
- **Generate wizard** (`POST /framework/generate`):
  1. **Profile**: industry (text + suggestions), maturity (`basic|intermediate|advanced` segmented control), data sensitivity (`low|medium|high`), department count, processor count, SDF toggle.
  2. **Preview**: the wizard calls `generate` with `publish: false`, then renders the returned control set grouped by **roadmap phase** (Foundation / Operations / Oversight / Significant Fiduciary) with due dates — because the backend builds the roadmap from templates (`selectTemplatesForProfile` + `buildRoadmapJson`), the preview is real, not mocked.
  3. **Confirm**: `POST /framework/publish { frameworkId }` (or `generate` with `publish: true`).
- **Data**: `GET /framework/roadmap?frameworkId` returns `roadmapJson` (phases + controls + due dates) — render as a vertical phase stepper with controls as rows.
- **Controls register** (`/controls`, `GET /controls?frameworkId&status&page&pageSize`): filter chips by status; create control modal (`POST /controls`); edit drawer (`PATCH /controls/:id`) — owner (user combobox), due date, status select, `legalBasisRef` mono.
- **Obligations register** (`/requirements`): list w/ `unmapped=true` toggle; map-to-control drawer (`POST /requirements/:id/map`).
- **Special states**: no framework yet → empty state CTA opens wizard; publish requires `framework:publish` (disabled-with-tooltip otherwise).

### 9.4 Inventory (`/inventory`) + Processing (`/processing`)

- **Purpose**: the data map — what personal data exists, its sensitivity, retention, owner, department; and the processing activities per asset.
- **Assets table** (`GET /data-assets` — note: this list endpoint is **unpaginated** (no `page`/`pageSize` query schema); render with client-side pagination/virtualization, or raise a backend follow-up to add server pagination): columns assetName (code style), assetType, category, sensitivity **chip** (LOW/MEDIUM/HIGH/CRITICAL → neutral/warn/warn/fail tones), department, owner, status, retentionPeriod, storageLocation; row action: edit (drawer), archive (confirm modal, `DELETE /data-assets/:id`).
- **Asset detail page** (`GET /data-assets/:id`): record identity bar; linked processing activities (`GET /processing-activities?dataAssetId=`); linked consent records count; edit form.
- **Create asset drawer**: fields per `createDataAssetDtoSchema` — sensitivity as segmented chips, department/owner comboboxes.
- **Processing activity drawer**: purpose*, dataAssetId (locked when opened from an asset), sourceSystem, recipientType, processorName, legalBasis, retentionRule, notes.
- **Special states**: archive confirm explains soft-delete ("record is archived, not deleted — traceability preserved").

### 9.5 Notices (`/notices`) + Consent (`/consent`)

- **Notices**: list (`GET /notices`) with version column (mono); create form (title, content textarea with character count up to 20 000, `effectiveFrom` date); detail drawer shows content + linked consent count; soft-delete confirm (`DELETE /notices/:id`).
- **Consent records**: table (`GET /consent-records` filters: dataAssetId, noticeId, consentState, dataSubjectIdentifier) — dataSubjectIdentifier (mono), purpose, notice version, asset, state chip, grantedAt/withdrawnAt; **withdraw action** (`POST /consent-records/:id/withdraw`) with confirm modal explaining the consequence; create drawer (`POST /consent-records`) with `proofFileId` optional link to evidence.
- **Special states**: withdrawn rows show strikethrough-free but muted style with a "Withdrawn · date" tag; consent state chips use the neutral/warn tones.

### 9.6 Rights requests (`/rights`)

- **Purpose**: the SLA-tracked data principal queue.
- **Table** (`GET /data-subject-requests` filters requestType/status/assignedTo): requesterReference (mono), type chip, status chip, assignee, openedAt, **SLA countdown** (due = opened + 7 days, computed client-side; backend provides no due field on create — see note), version badge.
- **Submit drawer** (`POST /data-subject-requests`): requestType select (7 types), requesterReference*, assignee (optional).
- **Detail page**: timeline of status changes; **assign** (`PATCH` with version + assignedTo), **advance status** stepper honoring the rights state machine (`SUBMITTED → ASSIGNED → IN_PROGRESS → RESPONDED/REJECTED → CLOSED`), resolution summary textarea on close/reject (with version).
- **Special states**: 409 conflict modal (§7.6); SLA urgency tones (§8.2).
- **SLA note**: the backend defines SLA per request type in `RIGHTS_REQUEST_SLA_DAYS` — 30 days for ACCESS/CORRECTION/COMPLETION/UPDATING/ERASURE/NOMINATION, **45 days for GRIEVANCE_REDRESSAL**, default 30. Mirror this constant client-side; countdown = `openedAt` + SLA days. (`dueAt` is nullable on the model and the create DTO doesn't accept it — show "—" when it's null.)

### 9.7 Validations (`/validations`)

- **Two tabs**: **Runs** and **Rules**.
- **Runs**: list (`GET /validation-runs?status`) with trigger type (MANUAL/SCHEDULED), status chip, started/finished, duration; **"Run validation"** button (`POST /validation-runs` `{ triggerType: "MANUAL" }`) → poll via `useAsyncResource`; run detail (`GET /validation-runs/:id`) shows results list — ruleCode (mono), title, status chip (PASS/FAIL/SKIPPED/ERROR), score, explanation, `evidenceRequiredFlag`, linked control, **"Create violation"** action from a FAIL result (`POST /violations` with `validationResultId`).
- **Rules**: library table (`GET /validation-rules?category&activeOnly`) — ruleCode, title, category chip (NOTICE/CONSENT/RETENTION/RIGHTS), severity, `activeFlag` toggle (PATCH — **validation rules are version-locked**: send the current `version` with the toggle); create/edit drawer with `legalBasisRef`.
- **Special states**: running run → indeterminate progress + stage chips; FAIL results render the full explanation block (§1.2 of the implementation plan: what failed, why, evidence missing, fix, owner, due).
- **One violation per FAIL result**: `@@unique([organizationId, validationResultId])` — once a violation exists for a result, replace "Create violation" with a link to the existing violation; handle a raced 409 with the conflict modal.

### 9.8 Violations (`/violations`)

- **Purpose**: the enforcement board.
- **Board**: kanban-lite columns by status (`OPEN · TRIAGE · ASSIGNED · IN_PROGRESS · PENDING_EVIDENCE · VALIDATED · CLOSED/ARCHIVED` collapsed) OR dense table with status filter chips + severity filter — default table, board as toggle. Data: `GET /violations?status&severity&assignedTo`.
- **Row/detail**: title, severity chip (LOW→CRITICAL = neutral/warn/warn/fail), status, assignee, due, version, source link (`validationResultId`), resolution summary when present.
- **Actions** (each gated by `canTransition` mirror + permission): triage, assign (combobox), start, request evidence, validate, close (modal with resolutionSummary + version), archive. Assignments/status via `PATCH /violations/:id` with version; close via `POST /violations/:id/close`.
- **Linked remediation tasks** on detail: list (`GET /remediation-tasks?violationId=`) with their own state stepper; create task drawer.
- **Special states**: 409 recovery; `evidenceRequiredFlag` renders "evidence required" chip linking to evidence filtered by `violationId`; terminal rows muted.

### 9.9 Remediation (`/remediation`)

- **Purpose**: the fix-it queue.
- **Table** (`GET /remediation-tasks` filters status/violationId/assignedTo): taskTitle, violation code (mono), source chip (AUTO/MANUAL), status chip, assignee, due, version.
- **Actions**: start, submit (→ PENDING_VERIFICATION with `verificationNotes`), verify (→ VERIFIED), rework, cancel, close (modal with `resolutionSummary` + version). All via `PATCH /remediation-tasks/:id` + `POST /remediation-tasks/:id/close`, always with version.
- **Auto-task indicator**: tasks with source AUTO show "Auto-created from validation failure" tooltip.
- **Special states**: 409 recovery; overdue SLA tones.

### 9.10 Evidence (`/evidence`)

- **Purpose**: the proof vault — lifecycle-first.
- **Table** (`GET /evidence` filters status/controlId/violationId, paginated): fileName (mono), mimeType + size, status chip (6 states), tags, control code, uploadedBy/at.
- **Detail page**: record identity; **lifecycle stepper** (`UPLOADED → TAGGED → MAPPED → UNDER_REVIEW → APPROVED → LOCKED`); actions: tag (tag editor modal), map to control (combobox), submit review, approve (confirm), lock (confirm, audited); download via `GET /evidence/:id/download` (opens presigned URL); audit trail for the file.
- **Upload flow** — presigned pipeline (§10.2): `POST /evidence` (initiate) → PUT to presigned URL → `PATCH /evidence/:id/confirm { fileHash, fileSizeBytes }` (hash computed client-side via Web Crypto SHA-256).
- **Export pack**: `POST /evidence/export` (filters) returns `{ jobId, status: "PENDING" }` and enqueues an export job. **No status endpoint is exposed in the evidence routes** — during Phase 5 confirm how the export worker surfaces completion (e.g., a Report row) and poll that instead, or raise a backend follow-up for a job-status endpoint.
- **Special states**: LOCKED files show a lock glyph + no action menu; `approve/lock` requires `evidence:approve` (disabled-with-tooltip).

### 9.11 Reports (`/reports`)

- **Purpose**: the report center + board pack.
- **Table** (`GET /reports` filters reportType/status, paginated): title, type chip, format chip, status chip, generatedBy, timestamps.
- **Generate modal**: reportType select (8 types incl. BOARD_PACK), title (defaults from type), format (PDF/CSV/EXCEL, default CSV), optional date range params → `POST /reports` → poll → download link.
- **Cancel** for PENDING (`DELETE /reports/:id`); FAILED rows show error message with retry.
- **Special states**: polling states per §7.7; download opens presigned URL.

### 9.12 Audit (`/audit`)

- **Purpose**: the immutable trace, auditor-facing.
- **Search interface** (`GET /audit` filters entityType, actionType, actorUserId, dateFrom/dateTo, cursor, limit): dense log rows — timestamp (tabular), actor (user link), actionType chip, entityType:entityId (mono), correlationId (mono, copy button).
- **Entity history view** (`GET /audit/entity/:entityType/:entityId`): a **Timeline** of every change with `beforeJson/afterJson` diffed via `DiffView` — the "traceability" payoff screen.
- **Export** (`POST /audit/export`): date range + format (csv/pdf) → async → poll → download.
- **Permissions**: `audit:read` / `audit:export`. This page is read-mostly by AUDITOR/DPO.

### 9.13 Notifications (`/notifications`) + AI (`/ai`)

- **Notifications center**: list w/ filters (status, type), mark-read row actions, preferences panel (`GET/PUT /notifications/preferences` — email/inApp/slack toggles). Bell drawer reuse of the same hooks.
- **AI surfaces** (per `ai.routes.ts`):
  - **Explain** — on a FAIL validation result or violation detail: "Explain this failure" panel → `POST /ai/explain { entityType, entityId }` → poll `GET /ai/requests/:id` → rendered markdown explanation with a "AI-assisted, not a compliance decision" disclaimer.
  - **Summarize** — evidence/violation/validation-run detail: `POST /ai/summarize`.
  - **Draft** — notice composer ("Draft from outline") and remediation plan composer: `POST /ai/draft { draftType, context }` → insert into the editor as a starting draft the user must review.
  - **Usage** — `GET /ai/usage` behind an "AI usage" panel in Settings.
- **Special states**: AI request FAILED → explanation panel shows error + retry; all AI output is read-only preview with "copy" and "insert into editor" (never auto-saves).

### 9.14 People & access (`/users`, `/roles`, `/departments`) + Settings

- **Users**: table (`GET /users`, paginated) — name, email, status chip (ACTIVE/INVITED/DISABLED), roles chips, lastLoginAt; **invite drawer** (`POST /users` email/name/roleIds) → success state explains the email invite + how to resend (resend = re-invite); update drawer (name, status incl. disable with confirm).
- **Roles**: table (`GET /roles`) — name, isSystemRole badge (locked, can't edit permissions), permission count; **permission editor** (create: `POST /roles`; update: `PATCH /roles/:id/permissions`) — permission groups render as the backend catalog grouped by module (organization, users, roles, departments, framework, inventory, consent, rights, validations, violations, remediation, evidence, reports, analytics, notifications, ai, audit), each group a checkbox list; a "select all" per group; system roles show read-only.
- **Departments**: list + create (`POST /departments` name/headUserId).
- **Settings**: org profile form (`GET/PATCH /organizations/:id` incl. SDF toggle explainer), AI usage panel, notification preferences, session info (MFA status + enroll link).

---

## 10. Cross-cutting workflows (the "operating system" moments)

### 10.1 Framework generation wizard

1. **Profile step** → 2. **Generation** (POST `generate`, `publish:false`) → 3. **Phase preview** (roadmap grouped by phase, due dates, counts) → 4. **Publish** (confirm modal, audited) → invalidate framework/controls/requirements/dashboard.
Loading UX: the generate call is synchronous (no job) but may take a moment — show per-step skeleton; keep the profile in the wizard's Zustand draft store so a failure doesn't lose input.

### 10.2 Evidence upload pipeline (presigned)

1. Select file → hash it (SHA-256, streaming) + capture size/MIME.
2. `POST /evidence` `{ fileName, mimeType, description?, controlId?, violationId?, tags? }` → `{ id, uploadUrl, … }`.
3. `PUT uploadUrl` with `Content-Type` + the bytes (direct to S3 — no backend proxy).
4. `PATCH /evidence/:id/confirm { fileHash, fileSizeBytes }` → server verifies.
5. Invalidate `["evidence"]`, `["controls","detail",controlId]`, `["dashboard"]`.
UploadPanel states: idle → hashing (progress) → uploading (progress) → confirming → done; failure at each stage with retry; files > size limit or wrong MIME rejected client-side *and* by the server.

### 10.3 Validation → violation → remediation chain

1. "Run validation" → poll run → results.
2. FAIL results offer "Create violation" (`POST /violations` with `validationResultId`).
3. Violation detail → auto-created remediation task (source AUTO) or manual create.
4. Task stepper: start → submit → verify → close; violation stepper advances in parallel (IN_PROGRESS ↔ PENDING_EVIDENCE ↔ VALIDATED → CLOSED).
5. Close actions require resolutionSummary + version; every step invalidates dashboard/analytics so the score reacts immediately.

### 10.4 State machines mirrored in UI

Client-side `canTransition(from, to)` maps are copied from the backend domain classes (`violation-lifecycle.state-machine.ts`, `remediation-task-lifecycle.state-machine.ts`, `rights-request-lifecycle.state-machine.ts`). Action menus are generated from the current status: available transitions become enabled items; the UI never offers `CLOSED → *`. Evidence transitions are enforced server-side via `assertTransition` (sequential: UPLOADED → TAGGED → MAPPED → UNDER_REVIEW → APPROVED → LOCKED), so the detail page renders a progress trail. Rights stepper: `SUBMITTED → ASSIGNED → IN_PROGRESS → RESPONDED → CLOSED`, with `REJECTED` terminal from SUBMITTED/ASSIGNED/IN_PROGRESS; closure and rejection both require a resolution summary.

---

## 11. Frontend project structure

```text
dpdpos/
├─ implementation.md
├─ README.md
├─ package.json  /  next.config.ts  /  tsconfig.json  /  eslint.config.mjs
├─ vitest.config.ts  /  playwright.config.ts  /  .env.local.example
└─ src/
   ├─ app/
   │  ├─ (auth)/login/  (auth)/mfa/  (auth)/accept-invite/  (auth)/onboard/
   │  ├─ (app)/…  (routes from §5.1, each with page.tsx + optional layout/loading/error)
   │  ├─ api/ (rewrites only)
   │  └─ globals.css  (tokens from §4.2)
   ├─ components/
   │  ├─ ui/  (primitives)      ├─ ui/data/  (DataTable, chips, timeline…)
   │  ├─ layout/ (AppShell, Sidebar, Topbar, CommandPalette)
   │  ├─ charts/ (sparkline, score bar/ring, donut)
   │  └─ feedback/ (toasts, banners, conflict modal, 403/404/500 screens)
   ├─ features/
   │  ├─ auth/  dashboard/  framework/  controls/  requirements/  inventory/
   │  ├─ processing/  notices/  consent/  rights/  validations/  violations/
   │  ├─ remediation/  evidence/  reports/  audit/  notifications/  ai/
   │  ├─ users/  roles/  departments/  settings/
   │  │   each: api.ts · hooks.ts · schemas.ts · types.ts · components/
   ├─ hooks/        (usePaginatedQuery, useAsyncResource, usePermission, useSession…)
   ├─ lib/
   │  ├─ api/       (client.ts, queryKeys.ts, invalidation.ts)
   │  ├─ auth/      (session store, refresh interceptor)
   │  ├─ utils/     (dates, hashing, formatters, cn())
   │  └─ constants/ (status maps, permission groups, phase/severity metadata)
   ├─ state/        (session store, ui store)
   ├─ schemas/      (zod mirrors of backend DTOs)
   └─ types/        (API domain types, enums)
```

---

## 12. Implementation phases

Each phase ends in something demo-able. Backend is assumed running (`docker:up`, migrate, seed).

| Phase | Scope | Demoable outcome |
|---|---|---|
| **0 — Scaffold** (½ wk) | create-next-app, tokens/globals, primitives (button/input/badge/chip/table skeleton), API client + envelope, queryKeys, env/rewrites, Vitest+MSW setup | Component gallery page; `/healthz` wired to a status pill |
| **1 — Auth & shell** (1 wk) | login, MFA challenge + enrollment, accept invite, session store, refresh interceptor, route guards, AppShell, sidebar, topbar, notification bell, 403/404/500, toasts | Full login→dashboard journey with seeded demo org; logout; session expiry |
| **2 — Programme** (1–1.5 wk) | onboarding, framework wizard + roadmap + publish, controls register + edit, requirements + map | Generate a real framework from profile; publish; see roadmap phases; edit a control |
| **3 — Operations** (1–1.5 wk) | inventory (assets + processing), notices, consent records + withdraw, rights queue + SLA + close | Register an asset, link processing activity, record consent, withdraw, submit and close a rights request |
| **4 — Enforcement** (1.5 wk) | validations (rules + runs + polling + results), violations board + lifecycle, remediation tasks + stepper, auto-task chain | Run validation, see FAIL results, create violation, drive it to CLOSED with a remediation task |
| **5 — Proof** (1–1.5 wk) | evidence vault + presigned upload + lifecycle + export, reports + polling + download, audit search + entity timeline + export | Upload evidence to a control, approve + lock it, export an evidence pack, generate a board pack report, inspect an entity's audit trail |
| **6 — Intelligence & polish** (1 wk) | AI explain/summarize/draft + usage, command palette, keyboard shortcuts, density toggle, empty-state pass, dashboard deltas, Playwright journeys | "Explain this failure" on a real violation; ⌘K navigation; polished demo script |

**Acceptance criteria per phase** (aligned to PRD §14): every screen ships loading/empty/error states; every mutation is permission-gated; every list honors pagination; every detail shows a trace footer.

---

## 13. Testing strategy

| Layer | Tool | What we test |
|---|---|---|
| Unit | Vitest | state machines mirrors (transition availability), queryKey builders, date/SLA utils, hash util, schema mirrors |
| Component | Testing Library + MSW | DataTable (sort/paginate/empty), StatusChip map, forms (field errors from `details.fieldErrors`), conflict modal (409), presigned UploadPanel states, permission gating `<Can>` |
| Integration (hooks) | Testing Library + MSW | `usePaginatedQuery`, `useAsyncResource` polling lifecycle (PENDING→COMPLETED stops polling), refresh interceptor single-flight |
| E2E | Playwright (seeded demo org) | login (incl. MFA challenge), framework generate→publish, validation run→violation→remediation→close, evidence upload→lock→export, report generate→download, audit entity timeline, 403 route direct-hit |
| Visual/regression | Playwright `toHaveScreenshot` on the design-system gallery + key pages | enforces the §4 design contract |

**Permission matrix tests**: a data table of role→permission→(visible/disabled/hidden) driven by `SYSTEM_ROLE_PRESETS` — catches both over- and under-exposure in the UI.

---

## 14. Non-functional requirements

**Performance**
- Route-level code splitting (Next default); dashboard charts are client-only islands; tables virtualize only if a page exceeds ~500 rows (not expected at capstone scale).
- Server state cached with generous `staleTime` (30–60 s) except async resources (polling).
- All list endpoints server-paginated; never fetch-all-then-filter.

**Security**
- No secrets in client: `NEXT_PUBLIC_*` only; backend URL and rewrite destination server-side only.
- Strict CSP header in prod; no third-party scripts; escape everything (React default) — sanitized markdown for AI output.
- Access token memory-only (§6.2); logout denies `jti` server-side; sensitive action modals.

**Accessibility (WCAG 2.1 AA)**
- Full keyboard operation (Radix gives us dialog/dropdown/menu behavior), visible focus rings in accent color, `prefers-reduced-motion` disables transitions, status conveyed by icon + text *and* color, tables with real `th` scope, aria-live regions for toasts and async completion, contrast ≥ 4.5:1 for body text.

**Observability**
- Error boundary per route group → friendly 500 screen; API client logs normalized errors with the server's `correlationId` in dev; a `window.onerror` handler forwards to console (no third-party logger in MVP).

---

## 15. Definition of done (what "finished" means)

1. Every one of the 21 backend surfaces (§1.3) has a working UI wired to the real endpoints.
2. Auth, MFA (challenge + enrollment), invite acceptance, silent refresh, and logout all work against the seeded org.
3. All five system roles render correct navigation/action availability (permission matrix test green).
4. The four workflows in §10 are demoable end-to-end.
5. Every page passes loading/empty/error + 403/404/500 states.
6. Design-system gallery + Playwright screenshots enforce §4 (no gradient/emoji/pill-slop regressions).
7. Typecheck, lint, unit, component, and e2e suites are green in CI.

---

## Appendix A — Endpoint contract reference (from backend source)

Base `/api/v1`. All routes except `POST /organizations` (public bootstrap) and `/auth/login|mfa/verify|accept-invite|refresh` require `Authorization: Bearer`. Envelope: `{ success, data, meta? }`. Errors: `{ success:false, error:{ code, message, details? } }`.

### Auth
| Method | Path | Body / query | Notes |
|---|---|---|---|
| POST | `/auth/login` | `{ organizationId, email, password }` | Returns `{mfaRequired:false,user,tokens}` or `{mfaRequired:true,mfaToken,expiresIn:300}` |
| POST | `/auth/mfa/verify` | `{ mfaToken, code }` | |
| POST | `/auth/accept-invite` | `{ organizationId, email, inviteToken, password(≥8) }` | |
| POST | `/auth/mfa/setup` | — | → `{ secret, otpauthUrl }` |
| POST | `/auth/mfa/confirm` | `{ code }` | |
| POST | `/auth/refresh` | `{ refreshToken }` | rotates |
| POST | `/auth/logout` | `{ refreshToken }` | attach bearer to deny jti |
| GET | `/auth/me` | — | → `{ id, organizationId, email, name, status, roles[], permissions[], mfaEnabled, mfaEnrollmentRequired }` |

### Organizations · Users · Roles · Departments
| Method | Path | Notes |
|---|---|---|
| POST | `/organizations` | public; `{ name*, industry?, companySize?, operatingRegion?, companyType?, maturityLevel?, isSignificantDataFiduciary? }` |
| GET/PATCH | `/organizations/:id` | `organization:read/update` |
| GET | `/users` | `user:read`; paginated |
| POST | `/users` | `user:create`; `{ email, name, roleIds? }` (invite) |
| PATCH | `/users/:id` | `user:update`; `{ name?, status? }` |
| GET | `/roles` | `role:read` |
| POST | `/roles` | `role:create`; `{ name, description?, permissions[] }` |
| PATCH | `/roles/:id/permissions` | `role:update_permissions`; `{ permissions[] }` |
| GET | `/departments` | `department:read` |
| POST | `/departments` | `department:create`; `{ name, headUserId? }` |

### Framework · Controls · Requirements
| Method | Path | Notes |
|---|---|---|
| POST | `/framework/generate` | `framework:generate`; `{ name?, industryProfile*, maturityLevel(basic|intermediate|advanced)*, dataSensitivity(low|medium|high), departmentCount, processorCount, isSdf, publish }` |
| GET | `/framework/roadmap?frameworkId` | `framework:read` |
| POST | `/framework/publish` | `framework:publish`; `{ frameworkId? }` |
| GET | `/controls?frameworkId&status&page&pageSize` | `control:read` |
| POST | `/controls` | `control:create`; `{ frameworkId, code, title, description?, ownerUserId?, dueAt?, legalBasisRef?, status? }` |
| PATCH | `/controls/:id` | `control:update`; partial |
| GET | `/requirements?frameworkId&controlId&unmapped&page&pageSize` | `requirement:read` |
| POST | `/requirements` | `requirement:create` |
| POST | `/requirements/:id/map` | `requirement:create`; `{ controlId }` |

### Inventory
| Method | Path | Notes |
|---|---|---|
| POST | `/data-assets` | `data_asset:create`; `{ assetName*, assetType*, category*, sensitivity*(LOW|MEDIUM|HIGH|CRITICAL), description?, storageLocation?, retentionPeriod?, departmentId?, ownerUserId? }` |
| GET | `/data-assets`, `/data-assets/:id` | `data_asset:read` |
| PATCH | `/data-assets/:id` | `data_asset:update` |
| DELETE | `/data-assets/:id` | `data_asset:delete` (soft archive) |
| POST | `/processing-activities` | `processing_activity:create`; `{ dataAssetId*, purpose*, sourceSystem?, recipientType?, processorName?, legalBasis?, retentionRule?, notes? }` |
| GET | `/processing-activities?dataAssetId` | `processing_activity:read` |
| GET/PATCH/DELETE | `/processing-activities/:id` | read / update / soft delete |

### Consent
| Method | Path | Notes |
|---|---|---|
| POST | `/notices` | `notice:create`; `{ title*, content*, effectiveFrom? }` |
| GET | `/notices`, `/notices/:id` | `notice:read` |
| DELETE | `/notices/:id` | `notice:delete` |
| POST | `/consent-records` | `consent:create`; `{ dataSubjectIdentifier*, noticeId?, dataAssetId?, purpose*, grantedAt?, proofFileId? }` |
| GET | `/consent-records?dataAssetId&noticeId&consentState&dataSubjectIdentifier` | `consent:read` |
| GET | `/consent-records/:id` | `consent:read` |
| POST | `/consent-records/:id/withdraw` | `consent:withdraw` |

### Rights
| Method | Path | Notes |
|---|---|---|
| POST | `/data-subject-requests` | `rights_request:create`; `{ requestType*(7), requesterReference*, assignedTo? }` |
| GET | `/data-subject-requests?requestType&status&assignedTo` | `rights_request:read` |
| GET | `/data-subject-requests/:id` | `rights_request:read` |
| PATCH | `/data-subject-requests/:id` | `rights_request:update`; **requires `version`** + `assignedTo?/status?/resolutionSummary?` |

### Validations
| Method | Path | Notes |
|---|---|---|
| POST | `/validation-rules` | `validation:run`; `{ ruleCode*, title*, description?, legalBasisRef?, severity?, category?(NOTICE|CONSENT|RETENTION|RIGHTS) }` |
| GET | `/validation-rules?category&activeOnly`, `/validation-rules/:id` | `validation:read` |
| PATCH | `/validation-rules/:id` | `validation:run`; **requires `version`** + title/description/legalBasisRef/severity/activeFlag |
| POST | `/validation-runs` | `validation:run`; `{ triggerType?: "MANUAL" }` → async |
| GET | `/validation-runs?status` | `validation:read` (PENDING/RUNNING/COMPLETED/PARTIAL/FAILED) |
| GET | `/validation-runs/:id` | `validation:read`; includes results (PASS/FAIL/SKIPPED/ERROR + explanation + score + evidenceRequiredFlag + controlId) |

### Violations · Remediation
| Method | Path | Notes |
|---|---|---|
| POST | `/violations` | `violation:create`; `{ validationResultId?, severity*, title*, description?, assignedTo?, dueAt? }` |
| GET | `/violations?status&severity&assignedTo` | `violation:read` |
| GET | `/violations/:id` | `violation:read` |
| PATCH | `/violations/:id` | `violation:assign`; **requires `version`** + status/assignee/due/resolutionSummary |
| POST | `/violations/:id/close` | `violation:close`; `{ version, resolutionSummary* }` |
| POST | `/remediation-tasks` | `remediation:update`; `{ violationId*, taskTitle*, taskDescription?, assignedTo?, dueAt? }` |
| GET | `/remediation-tasks?status&violationId&assignedTo` | `remediation:read` |
| GET | `/remediation-tasks/:id` | `remediation:read` |
| PATCH | `/remediation-tasks/:id` | `remediation:update`; **requires `version`** + status/notes/summary |
| POST | `/remediation-tasks/:id/close` | `remediation:update`; `{ version, resolutionSummary* }` |

### Evidence
| Method | Path | Notes |
|---|---|---|
| POST | `/evidence` | `evidence:create`; initiate → `{ fileName, mimeType, description?, controlId?, violationId?, tags? }` → `{ evidence, uploadUrl }` (presigned PUT, 1 h) |
| PATCH | `/evidence/:id/confirm` | `{ fileHash, fileSizeBytes }` (sets hash/size; status stays UPLOADED until tagged) |
| GET | `/evidence?status&controlId&violationId&page&pageSize` | `evidence:read`; returns `{ items, total, page, pageSize }` in data |
| GET | `/evidence/:id` | `evidence:read` → `{ evidence, downloadUrl }` |
| GET | `/evidence/:id/download` | `evidence:read` → presigned GET |
| PATCH | `/evidence/:id/tag` | `{ tags, description? }` |
| PATCH | `/evidence/:id/map` | `{ controlId }` |
| PATCH | `/evidence/:id/submit-review` | — |
| PATCH | `/evidence/:id/approve` | `evidence:approve` |
| PATCH | `/evidence/:id/lock` | `evidence:approve` |
| POST | `/evidence/export` | `evidence:export`; filters → `{ jobId, status: "PENDING" }` (no poll endpoint exposed — see §9.10) |

### Audit · Notifications · Analytics · Reports · AI
| Method | Path | Notes |
|---|---|---|
| GET | `/audit?entityType&actionType&actorUserId&dateFrom&dateTo&cursor&limit` | `audit:read`; cursor-paginated |
| GET | `/audit/entity/:entityType/:entityId` | `audit:read`; entity history with before/after |
| POST | `/audit/export` | `audit:export`; `{ dateFrom?, dateTo?, format(csv|pdf) }` → async |
| GET | `/notifications?status&notificationType&page&pageSize` | `notification:read` |
| GET | `/notifications/unread-count` | `notification:read` |
| PATCH | `/notifications/:id/read`, `/notifications/read-all` | `notification:read` |
| GET | `/notifications/preferences` | `notification:read` |
| PUT | `/notifications/preferences` | `notification:update_preferences`; `{ email?, inApp?, slack? }` |
| GET | `/analytics/dashboard` | `analytics:read` → `{ complianceScore, violations, evidence, rightsRequests, consent }` |
| GET | `/analytics/compliance-score` | → `{ score, totalRules, passed, failed, trend? }` |
| GET | `/analytics/violations` | → `{ total, byStatus, bySeverity }` |
| GET | `/analytics/evidence` | → `{ totalControls, controlsWithEvidence, coveragePercent }` |
| GET | `/analytics/rights-requests` | → `{ total, open, closed, avgResolutionDays, byType }` |
| GET | `/analytics/consent` | → `{ totalRecords, granted, withdrawn }` |
| GET | `/analytics/validations` | summary |
| GET | `/reports?reportType&status&page&pageSize` | `report:read` |
| POST | `/reports` | `report:generate`; `{ reportType*(8), title?, format?(PDF|CSV|EXCEL, default CSV), parameters?{dateFrom,dateTo} }` → async |
| GET | `/reports/:id`, `/reports/:id/download` | `report:read` |
| DELETE | `/reports/:id` | `report:generate` (cancel pending) |
| POST | `/ai/explain` | `ai:explain`; `{ entityType(validation_result|violation), entityId }` → async |
| POST | `/ai/summarize` | `ai:explain`; `{ entityType(evidence|violation|validation_run), entityId }` → async |
| POST | `/ai/draft` | `ai:draft`; `{ draftType(notice|remediation_plan), context? }` → async |
| GET | `/ai/requests/:id` | `ai:explain`; poll result |
| GET | `/ai/usage` | `ai:explain` |

### State machines (must mirror in UI — §10.4)
- **Violation:** `OPEN → TRIAGE → ASSIGNED → IN_PROGRESS → PENDING_EVIDENCE → VALIDATED → CLOSED`; `ARCHIVED` from any non-terminal. CLOSED only from VALIDATED.
- **Remediation:** `PENDING → IN_PROGRESS → PENDING_VERIFICATION → VERIFIED → CLOSED`; `CANCELLED` from any non-terminal. CLOSED only from VERIFIED.
- **Evidence:** `UPLOADED → TAGGED → MAPPED → UNDER_REVIEW → APPROVED → LOCKED` (sequential; enforced by `assertTransition` in `evidence-lifecycle.ts`).
- **Rights:** `SUBMITTED → ASSIGNED → IN_PROGRESS → RESPONDED → CLOSED`; `REJECTED` (terminal) from SUBMITTED/ASSIGNED/IN_PROGRESS. SLA per `RIGHTS_REQUEST_SLA_DAYS`: 30 days (45 for GRIEVANCE_REDRESSAL).
- **Control:** `NOT_STARTED → IN_PROGRESS → IMPLEMENTED → VERIFIED`.

### Permission catalog (frozen — `PERMISSIONS`, 60 strings)
`organization:create|read|update` · `user:create|read|update|invite` · `role:create|read|update_permissions|assign` · `department:create|read|update` · `framework:generate|read|publish` · `control:create|read|update` · `requirement:create|read` · `data_asset:create|read|update|delete` · `processing_activity:create|read|update|delete` · `notice:create|read|delete` · `consent:create|read|withdraw` · `rights_request:create|read|update` · `validation:run|read` · `violation:create|read|assign|close` · `remediation:read|update` · `evidence:create|read|approve|export` · `report:generate|read` · `analytics:read` · `notification:read|update_preferences` · `ai:explain|draft` · `audit:read|export`

---

*End of plan. When a backend contract changes, update this document's Appendix A first, then the affected feature folders — the doc is the contract tracker.*
