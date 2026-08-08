# DPDPOS — Frontend

Next.js (App Router) + TypeScript frontend for **DPDPOS**, the Digital Personal
Data Protection Operating System — a compliance console built against the
`dpdpos_backend` API.

> **Plan first:** [implementation.md](./implementation.md) is the source of
> truth for architecture, design language, page specs, and API contracts.

## Quick start

```bash
npm install
cp .env.local.example .env.local   # adjust BACKEND_URL if needed
npm run dev                        # http://localhost:3001
```

The frontend runs on **:3001** and proxies `/api/*` to the backend on
**:3000** via Next rewrites (see `next.config.ts`). Start the backend first:

```bash
cd ../dpdpos_backend
npm run prisma:migrate && npm run prisma:seed
npm run dev                        # http://localhost:3000
```

Demo credentials (seed): `admin@demo.dpdpos.local` / `ChangeMe123!`

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Dev server on :3001 |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` / `npm run test:watch` | Vitest (unit + component, MSW) |

## Phase 0 status (component gallery)

- ✅ create-next-app (Next 16, React 19, Tailwind v4, TS strict)
- ✅ Design tokens (`src/app/globals.css`) — §4 of implementation.md
- ✅ API client + envelope/ApiError + query keys (`src/lib/api`)
- ✅ Primitives (`src/components/ui`) + DataTable
- ✅ Gallery at `/` with live `/healthz` status pill
- ✅ Vitest + MSW with envelope-shaped fixtures

Next up: Phase 1 — auth, session layer, and the app shell.
