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

- **trade-academy** (`artifacts/trade-academy/`) — TradeAcademy frontend app. A trading education platform with lessons, a market simulator (with $10,000 demo account), and a user profile. Built with React + Vite, react-router-dom, Tailwind v3, shadcn/ui, zustand for state, and lightweight-charts for price charts. Dark-themed. Portuguese language. No backend — all data is static/local.
- **api-server** (`artifacts/api-server/`) — Express 5 backend. Currently only has a health check endpoint. Can be extended for user data persistence, leaderboards, etc.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
