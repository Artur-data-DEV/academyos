# AcademyOS Monorepo

Plataforma EdTech B2B/B2C focada em Certificações de TI (AWS, Azure, ServiceNow), unificando um **LMS (Portal do Aluno)** e um **Simulador Adaptativo**.

O projeto utiliza a arquitetura de **Monorepo com Turborepo**, permitindo o compartilhamento escalável de componentes, configurações, banco de dados e estado global entre os aplicativos.

---

## 🏗️ Estrutura da Arquitetura

O ecossistema está dividido em **Aplicativos** (Frontends) e **Pacotes** (Bibliotecas internas compartilhadas).

### 🖥️ Aplicativos (`apps/`)

- **`apps/lms`**: O portal web de cursos (Next.js 16+). Gerencia Trilhas, Módulos, Aulas e a vitrine.
- **`apps/simulator`**: O motor do simulador adaptativo (Next.js 16+). Lê o banco de questões, aplica lógica de exame e registra `Attempts`. Funciona como produto irmão do LMS (sessão compartilhada).

> **Nota sobre Serviços:** Ambos os apps possuem uma pasta `src/services/`. Nenhuma UI acessa o banco de dados diretamente; tudo é canalizado via services para facilitar um futuro desacoplamento de backend.

### 📦 Pacotes Compartilhados (`packages/`)

- **`@academyos/ui`**: Design System semântico unificado (Radix UI + TailwindCSS). Exporta botões, cards, badges e progresso que reagem ao Light/Dark mode em qualquer app.
- **`@academyos/store`**: Gerenciamento de Estado Global super leve via **Zustand**. Contém stores dedicadas (ex: `simulator-store.ts`) para lidar com navegação de questões e score em Client Components sem forçar Providers pesados na raiz.
- **`@academyos/database`**: Ponto único de verdade para dados (Prisma ORM + PostgreSQL Neon). Expõe o `PrismaClient` já instanciado.
- **`@academyos/auth`**: Sistema de Autenticação Centralizado (Auth.js / NextAuth v5). Garante login unificado e controle de Role Based Access (RBAC: ADMIN, INSTRUCTOR, STUDENT).
- **`@academyos/dataset-tools`**: Ferramental de engenharia de dados, conversão de dumps e tratamento (scripts locais que operam offline e que não poluem o código dos web apps).
- **`@academyos/config`**: Configurações canônicas de ESLint e TypeScript para toda a workspace.

---

## 🚀 Como Iniciar (Desenvolvimento)

### Pré-requisitos

- Node.js 18+ e [pnpm](https://pnpm.io/) v10+
- Docker & docker-compose (para o banco local PostgreSQL)

### Passo a Passo

1. **Suba a infraestrutura de banco de dados:**

   ```bash
   cd infra/docker
   docker-compose up -d
   ```

2. **Instale todas as dependências do Monorepo:**

   ```bash
   pnpm install
   ```

3. **Inicie o schema do Prisma e gere as tipagens (ORM):**

   ```bash
   pnpm --filter @academyos/database db:push
   pnpm --filter @academyos/database db:generate
   ```

4. **Inicie o ambiente de desenvolvimento usando o Turborepo:**

   ```bash
   pnpm dev
   ```

> **URLs de Acesso Local:**
>
> - LMS: [http://localhost:3000](http://localhost:3000)
> - Simulador: [http://localhost:3001](http://localhost:3001)

### Visualizando os Dados

Para ver as tabelas do banco de forma gráfica:

```bash
pnpm --filter @academyos/database db:studio
```

---

## 🧠 Design e Padronização

### UI e Tailwind

Se você precisa de um componente de UI (como um Botão ou um Card), **NÃO** crie dentro de `apps/*/src/components`. O fluxo correto é:

1. Criar o componente semântico em `packages/ui/src/`.
2. Exportá-lo em `packages/ui/package.json`.
3. Importá-lo no app desejado: `import { Card } from "@academyos/ui/card"`.

### Gerenciamento de Estado

Se você tem variáveis que precisam viajar profundamente por vários componentes (ex: A questão atual do Simulado ou o Tema), **NÃO** use Context API nativo. Use o **Zustand** presente no pacote `@academyos/store`.

### Scripts e Dumps

Nunca misture arquivos de dump JSON ou scripts pesados de raspagem dentro da pasta `apps/`. Qualquer processamento de dados massivo ou OCR deve acontecer exclusivamente dentro de `packages/dataset-tools/`.
