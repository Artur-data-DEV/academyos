# AcademyOS Monorepo

Plataforma EdTech B2B/B2C focada em Certificações de TI (AWS, Azure, ServiceNow), unificando um **LMS (Portal do Aluno)** e um **Simulador Adaptativo**.

## Estrutura do Projeto

- `apps/lms`: O portal web construído com Next.js 16+. Gerencia Trilhas, Módulos, Aulas (via Tiptap) e a vitrine.
- `apps/simulator`: O motor de avaliação que lê o banco de questões e registra `Attempts` diretamente via Server Actions, integrado ao LMS via sessão compartilhada.
- `packages/database`: Prisma + PostgreSQL Neon.
- `packages/auth`: Auth.js (NextAuth v5) com controle de papéis (ADMIN, INSTRUCTOR, STUDENT).
- `content/`: Scripts e conjuntos de dados brutos (`.json`, `.vcex`) usados para alimentar o banco de questões localmente.
- `skills/` e `specs/`: Documentações técnicas do repositório para onboarding de desenvolvedores e agentes de IA.

## Como Iniciar (Desenvolvimento)

### Pré-requisitos

- Node.js 18+ e [pnpm](https://pnpm.io/) v10+
- Docker & docker-compose (para o banco local)

### Passos

1. Suba o banco de dados:

   ```bash
   cd infra/docker
   docker-compose up -d
   ```

2. Instale as dependências:

   ```bash
   pnpm install
   ```

3. Rode as migrations e gere os clients:

   ```bash
   pnpm --filter @academyos/database db:push
   pnpm --filter @academyos/database db:generate
   ```

4. Inicie o ambiente de desenvolvimento usando o Turborepo:

   ```bash
   pnpm dev
   ```

   - O LMS ficará disponível em `http://localhost:3000`
   - O Simulador ficará disponível em `http://localhost:3001`

Para visualizar os dados do Prisma de forma visual, você pode rodar `pnpm --filter @academyos/database db:studio`.
