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

## Authentication

### Email/Password (default)
- Register via `POST /api/auth/register` → bcrypt hash, JWT returned
- Login via `POST /api/auth/login`
- Password reset via `/api/auth/forgot-password` → email link → `/api/auth/reset-password`

### Google OAuth 2.0
- Admin configures Google credentials at `/ta-painel-gestao` → "Integrações" tab
- Stored in `admin_settings` table under key `"auth.google"` as `{clientId, clientSecret, enabled}`
- Flow: `GET /api/auth/google` → Google → `GET /api/auth/google/callback` → redirect to `/auth/google/resultado?token=...&isNew=...`
- `GoogleAuthResultado.tsx` reads URL params, stores JWT via `useAuthStore.setFromOAuth()`, redirects
- Public status endpoint: `GET /api/auth/google/status` → `{enabled, configured, callbackUrl}`
- CSRF protection via short-lived in-memory state tokens (10-min TTL)
- Account linking: if email already exists → links Google ID to existing account; new email → creates account
- Button behaviour: if `enabled=false` → friendly toast (no technical errors shown)
- `users.google_id` column added via idempotent `ALTER TABLE` in `initDb()`

## Video Section (VideoAulas)

Videos stored as JSON blob in `admin_settings` key `"content.videos"` via GET/PUT `/api/admin/videos`. No dedicated DB table — backward-compatible with existing data.

**`VideoLesson` interface** (`artifacts/trade-academy/src/data/videos.ts`):
- `id`, `creator`, `title`, `level`, `videoUrl`, `description`, `requiredXp`, `order`, `duration`
- `category: string` — one of `VIDEO_CATEGORIES` (11 predefined: Análise Técnica, Análise de Velas, Price Action, Gestão de Risco, Psicologia de Trading, Macroeconomia, Forex, Criptomoedas, Acções & Índices, Fundamentos, Geral)
- `tags?: string[]` — optional free-form tags

**Admin panel** (`/ta-painel-gestao` → Vídeos tab):
- Form fields: Criador, Título, Nível, Ordem, **Categoria** (Select), **Tags** (comma-separated Input), URL, Descrição
- Filter bar above list: search input + category dropdown ("Todas as categorias")
- Video list grouped by category with emoji icon headers

**Student gallery** (`/video-aulas`):
- Stats row: total videos / categories / creators
- Search bar (filters by title, creator, description, tags)
- Horizontal category pill tabs (scrollable, with emoji icons)
- Creator chips (shown when ≥2 creators in current view)
- Grouped display: by category (default) → by creator within category → by creator → flat search results
- Video cards show level badge + category badge + tags

**Migration**: on load, existing videos without `category`/`tags` get defaults: `category: "Geral"`, `tags: []`.

## Required Secrets

All secrets must be set in Replit Secrets before the api-server will start:

| Secret | Description |
|---|---|
| `TURSO_DATABASE_URL` | libsql:// URL from turso.tech |
| `TURSO_AUTH_TOKEN` | Turso auth token |
| `JWT_SECRET` | Secret used to sign user login tokens |
| `ADMIN_PASSWORD` | Password for the admin panel (required — server will not start without it) |

## Database (Turso)

The backend uses Turso (serverless SQLite) via `@libsql/client`. You need two secrets:
- `TURSO_DATABASE_URL` — the libsql:// URL from turso.tech
- `TURSO_AUTH_TOKEN` — the auth token

Without these, the api-server will not start. The frontend still works in local-only mode (zustand + localStorage) when the backend is unavailable.

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
