# ALUKA — Plataforma de Educação em Trading

> Aprende a investir sem arriscar dinheiro. Tudo em português, focado em Angola.

ALUKA é uma plataforma web completa de educação em trading: aulas estruturadas por módulos, simulador de mercado em tempo real, análise de trades por inteligência artificial, duelos 1v1, biblioteca de livros e estratégias, sistema de gamificação e vídeo aulas curadas — tudo em português.

---

## O que é o ALUKA

O ALUKA foi construído para democratizar o acesso à educação financeira em língua portuguesa, com foco no mercado angolano. Em vez de promessas de enriquecimento rápido, a plataforma aposta em conhecimento real e prática segura: o utilizador aprende no simulador sem arriscar dinheiro real.

### Funcionalidades principais

| Funcionalidade | Descrição |
|---|---|
| **40 aulas em 13 módulos** | Do básico ao avançado: Conceitos, Tipos de Mercado, Leitura de Gráficos, Suporte & Resistência, e mais |
| **Simulador de trading** | 5 tipos de gráfico (Velas, Heikin-Ashi, Barras OHLC, Linha, Área) · 6 timeframes (1S, 1m, 5m, 1h, 4h, 1D) |
| **Aluka IA** | Análise automática de cada operação: entrada, saída, gestão de risco, rácio R:R e sugestões de melhoria |
| **Duelos 1v1** | Desafios ao vivo contra outros traders — quem tiver melhor performance ganha XP extra |
| **Biblioteca** | 3 livros curados de trading + 10 estratégias detalhadas |
| **Glossário** | 122+ termos do mercado financeiro com definições claras |
| **Vídeo Aulas** | Player personalizado com desbloqueio sequencial por XP, sem anúncios |
| **Gamificação** | XP por cada acção, 54+ conquistas desbloqueáveis, missões diárias, streak de consistência |
| **Perfil & Ranking** | Dashboard pessoal com histórico de trades, winrate e posição no ranking global |

### Planos

- **Iniciante — Grátis**: Nível 1 completo, simulador ilimitado, glossário, missões e conquistas
- **Plano Mensal (15.000 AOA/mês)**: Todos os níveis, vídeo aulas, duelos 1v1, biblioteca completa e suporte prioritário. Pagamento via transferência bancária com confirmação manual pelo admin.

---

## Stack Técnica

### Frontend (`artifacts/trade-academy/`)
- **React 18** + **Vite** + **TypeScript**
- **Tailwind CSS** + **shadcn/ui** (design system)
- **lightweight-charts v5** — gráficos financeiros profissionais
- **Zustand** — gestão de estado global
- **React Router v7** — navegação SPA
- **Inter** + **JetBrains Mono** — tipografia

### Backend (`artifacts/api-server/`)
- **Express 5** + **TypeScript**
- **Drizzle ORM** + **Turso (libSQL/SQLite)** — base de dados
- **JWT** + **bcryptjs** — autenticação
- **SendGrid** — envio de emails (recuperação de senha, notificações)
- **Pino** — logging estruturado
- **esbuild** — build em CJS bundle

### Monorepo
- **pnpm workspaces** — gestão de pacotes
- **Node.js 24** + **TypeScript 5.9**
- Pacotes partilhados: `@workspace/db` (schema Drizzle), `@workspace/api-zod` (validação)

---

## Estrutura do Projecto

```
invest-smart-academy/
├── artifacts/
│   ├── trade-academy/          # Frontend React + Vite
│   │   └── src/
│   │       ├── pages/          # Landing, Dashboard, Simular, Duelo, Biblioteca…
│   │       ├── components/     # UI components (PriceChart, OrderPanel, AppLayout…)
│   │       ├── data/           # curriculum.ts, videos.ts, books.ts, strategies.ts…
│   │       ├── hooks/          # usePlanConfig, useSEO, useAppStore…
│   │       └── lib/            # apiClient.ts, utils…
│   └── api-server/             # Backend Express 5
│       └── src/
│           └── routes/         # auth, trades, progress, duelos, subscriptions, admin…
├── packages/
│   ├── db/                     # Schema Drizzle ORM + migrations
│   └── api-zod/                # Schemas de validação Zod partilhados
└── api/
    └── index.js                # Bundle de produção (Vercel/deploy)
```

---

## Desenvolvimento Local

### Pré-requisitos
- Node.js 24+
- pnpm 9+

### Instalar dependências
```bash
pnpm install
```

### Variáveis de ambiente
Cria um ficheiro `.env` na raiz ou configura no painel de secrets:
```
DATABASE_URL=         # URL da base de dados Turso (libsql://...)
DATABASE_AUTH_TOKEN=  # Token de autenticação Turso
JWT_SECRET=           # Chave secreta para JWT
GMAIL_APP_PASSWORD=   # Password de app Gmail para envio de emails
```

### Arrancar em modo desenvolvimento
```bash
# Frontend (porta 22180)
PORT=22180 BASE_PATH=/ pnpm --filter @workspace/trade-academy run dev

# API (porta 8080)
PORT=8080 pnpm --filter @workspace/api-server run dev
```

### Comandos úteis
```bash
pnpm run typecheck                              # Typecheck de todos os pacotes
pnpm run build                                  # Build completo
pnpm --filter @workspace/db run push            # Push do schema DB (dev)
```

---

## Rotas da Aplicação

| Rota | Acesso | Descrição |
|---|---|---|
| `/` | Público | Landing page |
| `/entrar` | Público | Login |
| `/cadastrar` | Público | Registo |
| `/dashboard` | Auth | Painel principal |
| `/aprender` | Auth | Lista de módulos e aulas |
| `/aprender/:lessonId` | Auth | Lição individual |
| `/simular` | Auth | Simulador de trading |
| `/video-aulas` | Auth | Vídeo aulas |
| `/duelo` | Auth | Duelos 1v1 |
| `/biblioteca` | Auth | Livros de trading |
| `/estrategias` | Auth | Estratégias de trading |
| `/glossario` | Auth | Glossário de termos |
| `/perfil` | Auth | Perfil e histórico |
| `/ta-painel-gestao` | Admin | Painel de administração |

---

## API Endpoints principais

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/auth/register` | Registo de utilizador |
| POST | `/api/auth/login` | Login |
| GET | `/api/plan-config` | Preço e nome do plano actual |
| GET | `/api/progress` | Progresso de aulas do utilizador |
| POST | `/api/trades` | Registar trade do simulador |
| GET | `/api/trades` | Histórico de trades |
| POST | `/api/duelos` | Criar/entrar em duelo |
| GET | `/api/leaderboard` | Ranking global |
| POST | `/api/subscriptions` | Submeter pedido de subscrição |
| GET | `/api/social-config` | Links de redes sociais |

---

## Licença

Projecto privado — todos os direitos reservados © 2025 ALUKA.
