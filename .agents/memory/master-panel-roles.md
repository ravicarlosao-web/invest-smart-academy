---
name: Master Panel & Role System
description: Architecture of the 4-role system, Master Wing dashboard, and admin security model.
---

## Role System
- Roles: `"aluno" | "professor" | "administrador" | "master"`
- `requireAdmin` in `admin.ts` accepts: x-admin-token OR JWT with role in `["master","administrador","professor"]`
- `requireAdmin` now sets `(req as any).adminRole` so downstream guards can check the caller's role
- `requireAdminFull` (new) blocks professors — only master/administrador pass; applied to all destructive routes
- `adminRequest` in `apiClient.ts` sends JWT `Authorization` header for the same three roles

## Security constraints (important)
- Professor JWTs pass `requireAdmin` for content-read routes but are blocked by `requireAdminFull` on destructive routes
- Destructive routes protected by `requireAdminFull`: DELETE /users/:id, POST reset-progress, POST reset-sim, PATCH role, PATCH verify-email, PATCH xp, PATCH subscriptions/approve, PATCH subscriptions/reject, POST email-config/test
- PATCH /users/:id/role only accepts `["aluno","professor","administrador"]` — setting "master" via this endpoint is explicitly blocked to prevent privilege escalation via usersTable

## Database
- `usersTable` has `role` TEXT column with enum constraint, default "aluno"; located in `lib/db/src/schema/users.ts`
- `masterAccountTable` is entirely separate (id, email, passwordHash, createdAt) — no role column; always issues `role:"master"` JWT
- DB package is at `lib/db/` (pnpm workspace `lib/*`) — NOT inside `artifacts/`
- `[seed] master_account already seeded` confirms Master row exists on startup

## Master Panel (`/master/painel`)
- File: `artifacts/trade-academy/src/pages/MasterPanel.tsx`
- Route in `App.tsx` outside AuthGuard; guards itself via `authUser?.role !== "master"`
- `MasterLogin.tsx` redirects to `/master/painel` on success
- Design: forced dark zinc/amber palette, independent of app theme

## Admin Panel (`/ta-painel-gestao`)
- Professor JWT: sees only `conteudo` group tabs; negocio group is hidden
- Administrador JWT: full access without admin password
- Master JWT: full access

## Subscription Stats API
- Correct path: `api.adminSubscriptions.stats()` — NOT `api.admin.subscription.stats()`
- The `api` object has a top-level `adminSubscriptions` key (separate from `admin`)

**Why:** The apiClient separates user-facing subscription calls (`api.subscription.*`) from admin-facing ones (`api.adminSubscriptions.*`). This is non-obvious from the naming.
