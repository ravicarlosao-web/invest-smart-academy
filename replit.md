# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

- **trade-academy** (`artifacts/trade-academy/`) — TradeAcademy frontend app. A trading education platform with lessons, a market simulator (with $10,000 demo account), and a user profile. Built with React + Vite, react-router-dom, Tailwind v3, shadcn/ui, zustand for state, and lightweight-charts for price charts. Dark-themed. Portuguese language.
- **api-server** (`artifacts/api-server/`) — Express 5 backend with full API: auth, progress, trades, notifications, duelos, subscriptions, admin.

## Content Management (DB-driven)

All platform content is stored in the `admin_settings` table (Turso DB) under these keys:
- `content.glossary` — trading glossary terms
- `content.strategies` — trading strategies catalog
- `content.books` — book library catalog
- `content.resources` — recommended resources (brokers, tools, YouTube channels)
- `content.curriculum` — full learning path (levels + lessons + quizzes)
- `content.videos` — curated video lessons

**Auto-seed**: On API server startup, if a key is empty, it is populated from static TypeScript data files in `artifacts/api-server/src/content/`. Once an admin edits via the admin panel, the DB version takes over.

**Public routes**: `GET /api/glossary`, `/api/strategies`, `/api/books`, `/api/resources`, `/api/curriculum`, `/api/videos` — no auth required.

**Admin routes**: `GET/PUT /api/admin/glossary`, `/api/admin/strategies`, `/api/admin/books`, `/api/admin/resources`, `/api/admin/curriculum`, `/api/admin/videos` — require admin auth.

**Frontend**: Each content page fetches from API on mount with TS static data as immediate fallback. Pages: `Glossario.tsx`, `Estrategias.tsx`, `Biblioteca.tsx`, `Recursos.tsx`, `Aprender.tsx`, `Licao.tsx`.

## Subscription/Payment System

Manual payment system (5.000 AOA/month) for Angola:
- **Iniciante** levels: FREE for all users
- **Intermediário** and **Avançado** levels: require active subscription
- Payment flow: user submits payment reference → admin approves in admin panel → 30-day access
- DB table: `subscriptions` (pending/active/expired/rejected)
- Frontend: `PaymentWall` component, `useSubscriptionStore`, payment wall in `/aprender`, subscription card in `/perfil`
- Admin: "Subscrições" tab in `/admin` with approve/reject actions and stats
- API routes: `GET/POST/PATCH /api/subscription/:userId`, `GET/PATCH /api/admin/subscriptions/*`

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## API Base Path

The frontend (`trade-academy`) calls `/api` by default. This is routed to the `api-server` artifact by the shared proxy. If you move the api-server to a different path, set the `VITE_API_BASE_URL` environment variable in the trade-academy artifact to the new prefix (e.g. `/api`).

## Database (Turso)

The backend uses Turso (serverless SQLite) via `@libsql/client`. You need two secrets:
- `TURSO_DATABASE_URL` — the libsql:// URL from turso.tech
- `TURSO_AUTH_TOKEN` — the auth token

Without these, the api-server will not start. The frontend still works in local-only mode (zustand + localStorage) when the backend is unavailable.

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
