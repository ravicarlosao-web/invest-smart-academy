# Workspace — ALUKA

## Overview

pnpm workspace monorepo usando TypeScript. Cada pacote gere as suas próprias dependências.
Plataforma de educação em trading de língua portuguesa.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (porta 22180 em dev)
- **API framework**: Express 5 (porta 8080)
- **Database**: Turso/libSQL + Drizzle ORM
- **Auth**: JWT (HS256) via `JWT_SECRET`
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **Build**: esbuild (bundle CJS)

## Key Commands

- `pnpm run typecheck` — typecheck completo em todos os pacotes
- `pnpm run build` — typecheck + build de todos os pacotes
- `pnpm --filter @workspace/api-spec run codegen` — regenerar hooks e Zod schemas a partir do OpenAPI spec
- `pnpm --filter @workspace/db run push` — aplicar alterações de schema (só dev)
- `pnpm --filter @workspace/api-server run dev` — correr API server localmente

## Rotas da aplicação (frontend)

### Públicas
| Rota | Página |
|------|--------|
| `/` | Landing page |
| `/entrar` | Login de aluno |
| `/cadastrar` | Registo de aluno |
| `/termos` | Termos de serviço |
| `/privacidade` | Política de privacidade |
| `/esqueci-senha` | Recuperação de senha |
| `/redefinir-senha` | Redefinição de senha |
| `/auth/google/resultado` | Callback OAuth Google |

### Autenticadas (requerem login de aluno)
| Rota | Página |
|------|--------|
| `/dashboard` | Dashboard principal |
| `/aprender` | Lista de lições |
| `/aprender/:lessonId` | Lição específica |
| `/simular` | Simulador de trading |
| `/perfil` | Perfil do utilizador |
| `/glossario` | Glossário |
| `/recursos` | Recursos |
| `/configuracoes` | Configurações |
| `/duelo` | Duelos |
| `/biblioteca` | Biblioteca de livros |
| `/biblioteca/:bookId` | Leitor de livro |
| `/estrategias` | Estratégias |
| `/video-aulas` | Video aulas |
| `/financeiro` | Painel financeiro do aluno |

### Gestão interna (área restrita)
| Rota | Descrição |
|------|-----------|
| `/ta-painel-gestao` | **Painel admin** — mostra login de e-mail+password quando não autenticado; após login com conta `administrador`/`professor`/`master`, mostra o painel de gestão |
| `/master/entrar` | Login da conta Master |
| `/master/painel` | Painel Master (só role `master`) |

> **Nota de segurança:** A URL `/ta-painel-gestao` é intencional — serve como URL secreta/não-óbvia para o acesso administrativo. Não existe uma rota `/admin` pública.

### Rotas removidas
| Rota antiga | Motivo |
|-------------|--------|
| `/admin/entrar` | Removida — o login admin passou a ser integrado directamente em `/ta-painel-gestao` |

## Autenticação administrativa

### Sistema actual (JWT-only)
1. O **Master** cria contas de administrador/professor em `/master/painel` → aba Equipa → "Criar conta"
2. O admin/professor acede a `/ta-painel-gestao` com as suas credenciais de e-mail e password
3. O backend verifica o JWT via `requireAuth` (assinatura + lista de revogação) + `requireRole` — não confia em nada vindo do frontend
4. Não existe senha partilhada nem header `x-admin-token`

### Sistema removido
- ~~Senha partilhada via `ADMIN_PASSWORD`~~
- ~~Header `x-admin-token`~~
- ~~Endpoint `POST /api/admin/login`~~
- ~~Store `useAdminStore`~~

## Segurança do backend

### Princípios aplicados
- **Não confiar no frontend** — o ID do utilizador é sempre gerado pelo servidor; o cliente pode enviar campos mas eles são ignorados quando representam risco
- **JWT + revogação** — `requireAuth` verifica a assinatura E a tabela `revoked_tokens`; logout invalida o token imediatamente
- **Roles verificadas no servidor** — o backend nunca aceita claims de role do corpo do request; usa apenas o que está dentro do JWT assinado

### Camadas de protecção

| Camada | Detalhe |
|--------|---------|
| **Helmet** | Headers de segurança: CSP strict, `frameAncestors: none` (anti-clickjacking) |
| **CORS** | Lista explícita de origens permitidas (Replit, Vercel); rejeita origens desconhecidas |
| **Rate limiting (auth)** | `/api/auth` → 15 req / 15 min (previne brute force) |
| **Rate limiting (admin)** | `/api/admin` → 60 req / 15 min (separado e mais restrito) |
| **Rate limiting (geral)** | `/api` → 200 req / 15 min |
| **JWT revogação** | Logout adiciona `jti` à tabela `revoked_tokens`; verificado em cada request |
| **bcrypt** | Passwords com 12 rounds; mínimo 8 chars para contas admin/professor |
| **Validação Zod** | Todos os endpoints de auth validados com schema Zod antes de processar |
| **ID server-side** | `userId` gerado pelo servidor (nunca aceite do cliente) |
| **Role check duplo** | `/api/admin`: `requireAuth + requireRole(...)` para todos; `requireAdminFull = requireRole("master","administrador")` para operações destrutivas |
| **Master isolado** | Conta Master em tabela separada (`master_account`), nunca exposta pelos endpoints normais |

### Níveis de acesso
| Role | Acesso |
|------|--------|
| `aluno` | Rotas autenticadas do utilizador |
| `professor` | Leitura de painel admin + gestão de conteúdo |
| `administrador` | Painel admin completo + gestão de utilizadores |
| `master` | Acesso total + criação de contas admin/professor + painel Master |

## Variáveis de ambiente necessárias

| Variável | Descrição |
|----------|-----------|
| `TURSO_DATABASE_URL` | URL da base de dados Turso |
| `TURSO_AUTH_TOKEN` | Token de autenticação Turso |
| `JWT_SECRET` | Segredo para assinar JWTs |
| `ADMIN_PASSWORD` | **Obsoleto** — já não é usado pelo sistema de auth |

## Estrutura do monorepo

```
artifacts/
  api-server/   — Express API (porta 8080)
  trade-academy/ — React frontend (porta 22180)
packages/
  db/           — Schema Drizzle + cliente Turso
  api-zod/      — Schemas Zod gerados
  api-spec/     — OpenAPI spec
```
