# Architecture Specification (AcademyOS)

Este documento descreve as decisões arquiteturais da Plataforma EdTech (LMS + Simulator). A arquitetura é moldada em volta de um **Monorepo** focado em maximizar a integração entre o portal de conteúdo e o motor de testes adaptativos.

## 1. Topologia do Monorepo (Turborepo)

- `apps/lms`: Next.js App Router para o Portal do Aluno, vitrine de cursos e backoffice.
- `apps/simulator`: Next.js App Router para o motor de simulado focado em certificações.
- `packages/database`: Fonte de verdade central. Prisma Client instanciado como Singleton usando `@neondatabase/serverless` para lidar com pooling de conexões no Edge/Serverless.
- `packages/auth`: Auth.js (NextAuth v5) centralizando sessões, cookies e controle de acesso (RBAC).
- `packages/types`: Payloads e DTOs compartilhados entre UI, banco de dados e as respostas do simulador.
- `packages/ui`: Design System com shadcn/ui e TailwindCSS v4.
- `content/`: Pasta auxiliar fora do build principal contendo dumps de bancos de questões, scripts parsers em JS/Python e arquivos fonte.

## 2. Padrão de Persistência de Aulas (Tiptap)

A decisão para o editor foi o **Tiptap**. Em vez de persistir Markdown ou HTML em banco, a aula (`Lesson`) persiste a árvore AST nativa do ProseMirror/Tiptap como JSON no PostgreSQL (`content: Json`).
Vantagens:
- Renderização limpa no frontend.
- Fácil injeção de componentes React ricos (ex: blocos interativos, quizzes no meio da aula).

Para reaproveitamento de materiais antigos (ex: arquivos Markdown importados), utilizamos uma rota em `apps/lms/src/app/api/import-mdx` que executa o `remark` gerando um `mdast`, que é então traduzido para o JSON do Tiptap. O MDX não é usado em runtime.

## 3. Integração LMS ↔ Simulator (Sem Iframe)

Ambos os projetos rodam lado a lado compartilhando o mesmo apex domain em produção (ex: `lms.academya.com` e `simulator.academya.com`).
Isso permite que o cookie do `packages/auth` com as credenciais do usuário trafegue entre os domínios.

- Quando um usuário clica em "Iniciar Simulado" numa `Lesson`, ocorre uma simples navegação direta por link (`<a>` tag) para o `simulator.academya.com/assessment/[id]`.
- O Simulator lê as permissões do usuário no Auth.js.
- Durante o teste, o Simulator chama suas próprias Server Actions (`submitAssessmentAttempt`) que gravam os resultados na entidade `Attempt` chamando o `packages/database`.
- Ao retornar para o LMS, o LMS simplesmente lê a tabela `Attempt` ou `Progress` recém atualizada e exibe as métricas de performance. Não há necessidade de Webhooks ou `postMessage`.

## 4. Deploy Serverless (Vercel)

- O projeto aproveita o **Remote Caching** do Turborepo.
- Ao atualizar o `apps/simulator`, apenas ele é "buildado", enquanto pacotes não afetados usam o cache nativo.
- As integrações de banco de dados e Auth.js usam a mesma variável de ambiente `DATABASE_URL` e `AUTH_SECRET` configuradas nos projetos Vercel.
- Para rodar de forma isolada do Vercel no futuro, já foi estabelecido o uso de Dockerfiles com target `standalone` otimizados para imagens Alpine.
