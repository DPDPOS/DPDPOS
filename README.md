# DPDPOS — Frontend

Next.js (App Router) + TypeScript frontend for **DPDPOS**, the Digital Personal
Data Protection Operating System — a compliance console built against the
`dpdpos_backend` API.

> **Plan first:** [implementation.md](./implementation.md) is the source of
> truth for architecture, design language, page specs, and API contracts.

## Quick start (local)

```bash
npm install
cp .env.local.example .env.local   # adjust BACKEND_URL if needed
npm run dev                        # http://localhost:3001
```

The frontend runs on **:3001** and proxies `/api/*` to the backend on
**:3000** via Next rewrites (see `next.config.ts`). Start the backend first:

```bash
cd ../dpdpos_backend
npm run docker:up
npx prisma migrate deploy && npm run prisma:seed
npm run dev                        # http://localhost:3000
# optional second terminal:
npm run dev:worker
```

Demo credentials (seed):

| Field | Value |
|---|---|
| Organization ID | `00000000-0000-4000-8000-000000000001` |
| Email | `admin@demo.dpdpos.local` |
| Password | `ChangeMe123!` |

Local env (`.env.local`):

```env
BACKEND_URL=http://localhost:3000
# Leave empty — browser calls same-origin /api which rewrites to the backend
NEXT_PUBLIC_API_BASE_URL=
```

## Production / free-tier deployment

Deploy this console on **Vercel** (Hobby), pointed at a Render-hosted API.

**Full guide (all components):** in the backend repo, open  
`docs/14_deployment.md` (sibling checkout: `../dpdpos_backend/docs/14_deployment.md`).

Minimum Vercel settings:

| Variable | Example |
|---|---|
| `BACKEND_URL` | `https://dpdpos-api.onrender.com` |
| `NEXT_PUBLIC_API_BASE_URL` | *(empty)* |

After deploy, set the backend’s `FRONTEND_PUBLIC_URL` to your Vercel URL and
`API_PUBLIC_URL` to the Render API URL, then redeploy the API (needed for
Entra redirects and CLI token instructions).

Directory identity (Entra / AD) is configured in **Settings → Directory identity**
after you sign in as an org admin.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Dev server on :3001 |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` / `npm run test:watch` | Vitest (unit + component, MSW) |

## Related repos

| Repo | Purpose |
|---|---|
| `dpdpos_backend` | API + worker |
| `dpdp-cli` | npm package `dpdp-cli` (`dpdp` binary) for assessment scans |
