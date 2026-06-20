# AcademyOS Monorepo

Plataforma EdTech B2B/B2C focada em Certificações de TI (AWS, Azure, ServiceNow), unificando um **LMS (Portal do Aluno)** e um **Simulador Adaptativo Nexa**.

Monorepo **Turborepo + pnpm** para compartilhar design system, autenticação, banco de dados e estado entre aplicativos.

> **Status da convergência (2026-06-20):** o LMS já consome os pacotes workspace (`@academyos/ui`, `@academyos/auth`, `@academyos/database`). O Simulador ainda opera com **Supabase** e componentes UI locais — migração planejada. Detalhes em [`specs/architecture.md`](specs/architecture.md).

---

## Estrutura da Arquitetura

### Aplicativos (`apps/`)

| App | Pacote npm | Porta | Descrição |
|-----|------------|-------|-----------|
| **LMS** | `lms` | 3000 | Portal de trilhas, módulos, aulas (Tiptap), vitrine |
| **Simulador** | `simulados-app` * | 3001 | Motor adaptativo de questões (certificações CSA, etc.) |

\* Nome será alinhado a `simulator` na Fase 0 da refatoração.

Nenhuma UI deve acessar o banco diretamente — canalizar via **services** / Server Actions.

### Pacotes (`packages/`)

| Pacote | Função |
|--------|--------|
| `@academyos/ui` | Design System (Radix + Tailwind v4), tema Nexa, Markdown + Mermaid |
| `@academyos/auth` | Auth.js (NextAuth v5), RBAC (`ADMIN`, `INSTRUCTOR`, `STUDENT`) |
| `@academyos/database` | Prisma + PostgreSQL (Neon serverless adapter) |
| `@academyos/types` | DTOs compartilhados entre LMS e Simulador |
| `@academyos/store` | Zustand (`useSimulatorStore`) |
| `@academyos/config` | ESLint e TypeScript canônicos |
| `@academyos/dataset-tools` | Scripts offline de importação/auditoria de questões |

### Documentação

- **Arquitetura canônica (gaps, imports, plano):** [`specs/architecture.md`](specs/architecture.md)
- **Skill para agentes/IA:** [`skills/academyos/SKILL.md`](skills/academyos/SKILL.md)

---

## Como Iniciar (Desenvolvimento)

### Pré-requisitos

- Node.js 18+ e [pnpm](https://pnpm.io/) v10+
- Docker (PostgreSQL local opcional)

### Passo a passo

1. **Infraestrutura de banco (local):**

   ```bash
   cd infra/docker
   docker-compose up -d
   ```

2. **Dependências:**

   ```bash
   pnpm install
   ```

3. **Prisma (LMS / pacote database):**

   ```bash
   pnpm --filter @academyos/database db:push
   pnpm --filter @academyos/database db:generate
   ```

4. **Desenvolvimento (ambos apps em paralelo):**

   ```bash
   pnpm dev
   ```

**URLs locais:**

- LMS: http://localhost:3000
- Simulador: http://localhost:3001

**Prisma Studio:**

```bash
pnpm --filter @academyos/database db:studio
```

### Variáveis de ambiente

| App | Variáveis principais |
|-----|----------------------|
| LMS | `DATABASE_URL`, `AUTH_SECRET`, providers OAuth conforme Auth.js |
| Simulador (atual) | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, etc. |
| Simulador (meta) | `DATABASE_URL`, `AUTH_SECRET` (após Fase 4) |

---

## Design e Padronização

### UI e Tailwind

**Não** criar componentes genéricos em `apps/*/src/components/ui`.

1. Implementar em `packages/ui/src/`.
2. Exportar em `packages/ui/package.json` (`exports`).
3. Importar: `import { Card } from "@academyos/ui/card"`.

Tema: importar `@academyos/ui/styles/globals.css` no `globals.css` do app. Evitar cores hex Nexa (`#171819`, `#FFD369`) — usar tokens CSS (`--primary`, `--ct-yellow`, etc.).

### Markdown e Mermaid (LMS + Simulator)

Usar `@academyos/ui/markdown` — Mermaid inicializa no cliente (`dynamic import`) para não quebrar SSR.

Em conteúdo `.md`, use um fenced code block com linguagem `mermaid` (ex.: `graph TD` / `flowchart LR`).

### Estado global

Preferir `@academyos/store` (Zustand) em vez de Context API para estado profundo (ex.: navegação do simulado).

### Scripts e dumps

Processamento massivo de questões e JSON dumps: **apenas** `packages/dataset-tools/`, não em `apps/`.

---

## Regras de importação (resumo)

Ver matriz completa em [`specs/architecture.md`](specs/architecture.md#2-regras-obrigatórias-de-importação).

- Apps → pacotes `@academyos/*` ✅
- Apps → outros apps ❌
- `@academyos/ui` → database/auth ❌
- `new PrismaClient()` fora de `@academyos/database` ❌
- Deep imports (`@academyos/auth/src/...`) ❌

---

## Scripts úteis

```bash
pnpm dev              # turbo: lms + simulator
pnpm dev:lms          # só LMS
pnpm dev:simulator    # só Simulador
pnpm build            # build de todos os pacotes/apps
pnpm lint
pnpm typecheck
pnpm import:detran    # import trilha Detran no LMS
```
