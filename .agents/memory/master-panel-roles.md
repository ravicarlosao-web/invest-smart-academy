---
name: Master Panel & Role System
description: Architecture of the 4-role system and the dedicated Master Wing dashboard.
---

## Role System
- Roles: `"aluno" | "professor" | "administrador" | "master"`
- `requireAdmin` middleware in `admin.ts` accepts: x-admin-token OR JWT with role in `["master","administrador","professor"]`
- `adminRequest` in `apiClient.ts` sends JWT `Authorization` header for the same three roles

## Master Panel (`/master/painel`)
- File: `artifacts/trade-academy/src/pages/MasterPanel.tsx`
- Route registered in `App.tsx` outside AuthGuard (guards itself via `authUser?.role !== "master"`)
- `MasterLogin.tsx` redirects to `/master/painel` on success (was `/ta-painel-gestao`)
- Design: forced dark zinc/amber palette, independent of app theme

## Admin Panel (`/ta-painel-gestao`)
- Professor JWT: sees only `conteudo` group tabs; negocio group is hidden
- Administrador JWT: full access without admin password
- Master JWT: full access

## Subscription Stats API
- Correct path: `api.adminSubscriptions.stats()` — NOT `api.admin.subscription.stats()`
- The `api` object has a top-level `adminSubscriptions` key (separate from `admin`)

**Why:** The apiClient separates user-facing subscription calls (`api.subscription.*`) from admin-facing ones (`api.adminSubscriptions.*`). This is non-obvious from the naming.
