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

## Content Management (Dedicated DB Tables)

All platform content is stored in dedicated Turso DB tables (not as JSON blobs in admin_settings):

| Table | Rows (seed) | Description |
|---|---|---|
| `glossary_terms` | 121 | Term, definition, category, sort_order |
| `strategies` | 10 | Full strategy data; arrays stored as JSON strings |
| `books` | 3 | Book metadata + HTML content column |
| `resource_sections` | 4 | Section title, icon, color |
| `resource_items` | 24 | Individual resource, linked to section_id |
| `curriculum_levels` | 12 | Level id, title, subtitle, difficulty |
| `curriculum_lessons` | 40 | Lesson id, level_id, title, summary, xp, content (JSON), questions (JSON) |

**Schema files**: `lib/db/src/schema/glossaryTerms.ts`, `strategies.ts`, `books.ts`, `resources.ts`, `curriculum.ts` — all exported from `lib/db/src/schema/index.ts`.

**Auto-seed**: `artifacts/api-server/src/seed.ts` — on startup, checks if each table is empty via `COUNT(*)`, inserts all demo data from `artifacts/api-server/src/content/*.ts` if empty. Idempotent and non-fatal.

**Public routes**: `GET /api/glossary`, `/api/strategies`, `/api/books`, `/api/resources`, `/api/curriculum` — no auth required. Each route queries the proper table and transforms to the expected frontend format (arrays stored as JSON are parsed back).

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
