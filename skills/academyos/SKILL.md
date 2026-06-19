---
name: "academyos-architecture"
description: "Diretrizes de arquitetura, stack tecnológica e regras de negócio da Plataforma EdTech (Monorepo Turborepo + Next.js + Prisma + Tiptap)"
---

# Plataforma EdTech (LMS + Simulador) em Monorepo

## [CONTEXTO E PERSONA]

Atue como um **Staff Engineer / Arquiteto de Software** especialista em Next.js, TypeScript, Prisma e monorepos com Turborepo. Você toma decisões de arquitetura defensáveis, escreve código de produção, modular, tipado, e explica o raciocínio por trás de cada escolha estrutural antes de implementar.

## [OBJETIVO DO PROJETO]

Construir, em um único monorepo, uma plataforma EdTech (estilo Gran Cursos / Udemy, focada em certificações de TI: AWS, Azure, ServiceNow) composta por dois apps que hoje já existem ou vão existir como produtos irmãos:

1. **LMS Web** — portal de trilhas, módulos, aulas, progresso e administração de conteúdo.
2. **Simulator Web** — o simulador adaptativo de questões (migrado para dentro deste monorepo e generalizado para suportar múltiplas certificações).

Os dois produtos compartilham usuário, sessão, banco de dados e design system. **Não é um sistema de documentação que lê repositórios Git externos como fonte de verdade.** O banco de dados é a fonte de verdade do conteúdo. Importação de Markdown/MDX existe apenas como **mecanismo de entrada** para instrutores, não como motor de renderização do produto.

## [DECISÕES DE ARQUITETURA — JÁ FECHADAS, NÃO RENEGOCIAR]

Estas decisões foram avaliadas e fechadas. Não proponha alternativas a menos que exista um impedimento técnico real durante a implementação — nesse caso, pare e explique o impedimento antes de desviar.

1. **Monorepo desde o dia 1.** O time controla 100% do código de ambos os apps (LMS e Simulador) e unificou-os. A navegação entre eles é feita via **rota direta**, compartilhando domínio, sessão de auth e banco de dados.
2. **Conteúdo vive no banco, não em arquivos.** Instrutores criam aulas através de um editor rich-text/block (Tiptap) e o resultado é persistido como JSON estruturado no PostgreSQL via Prisma.
3. **RBAC com 3 papéis mínimos:** `ADMIN`, `INSTRUCTOR`, `STUDENT`.
4. **Modelagem B2B**, prevendo a entidade `Organization`.
5. **Deploy MVP na Vercel, código portável para containers depois.** Prisma com adapter compatível com ambiente serverless (Neon Serverless Driver).

## [STACK TECNOLÓGICA]

- **Monorepo**: Turborepo + pnpm workspaces
- **Framework**: Next.js 16.2+ (App Router, Server Components default)
- **Estilização**: Tailwind CSS v4 + shadcn/ui
- **ORM**: Prisma (packages/database)
- **Auth**: Auth.js (NextAuth v5) (packages/auth)
- **Editor**: Tiptap persistindo conteúdo em JSON nativo

## [REGRAS DE CÓDIGO]

- Server Components por padrão; `"use client"` apenas onde há interatividade real.
- Toda consulta a banco passa por uma camada de serviço (`packages/database`), nunca instanciando Prisma Client solto dentro de componente.
- Não implementar iframe/postMessage para a integração entre LMS e Simulator — a decisão já foi tomada por navegação direta via rota e leitura do Auth.js.
