# Arquitetura Evolutiva - AcademyOS

O princípio deste design é maximizar a velocidade de entrega no curto prazo (já que o time é de apenas 1 desenvolvedor), ao mesmo tempo em que as decisões tomadas não impedem a escala futura.

## Fase 1: MVP (A atual)
**Objetivo:** Validar o product-market fit rápido e barato.
*   **Arquitetura:** Monólito Modular (Monorepo Turborepo).
*   **Stack:** Next.js (App Router), Prisma (ORM), PostgreSQL (Neon Serverless).
*   **Por que não usar Microserviços agora?** Overhead de infraestrutura. Um desenvolvedor solo perderia mais tempo configurando CI/CD, service mesh e tracing distribuído do que escrevendo regras de negócio.
*   **Por que não usar Filas (Kafka/SQS)?** O volume de transações é baixo. Processamentos pesados (ex: validação básica de simulador) podem ser feitos via Server Actions ou Background Jobs simples (Inngest/Cron) atrelados ao Vercel/Next.js.

## Fase 2: Crescimento Constante
**Objetivo:** Manter a performance com aumento de usuários e simulações mais complexas (IA).
*   **Novo Componente: Cache (Redis).**
    *   **Quando introduzir?** Quando as requisições de leitura de Trilhas (conteúdo Markdown estático pesado) começarem a sobrecarregar o Banco de Dados.
*   **Novo Componente: Backend Dedicado (Ex: Go ou Python).**
    *   **Quando introduzir?** Quando implementarmos o **AI Mentor**. Processar embeddings de IA ou validar código de arquitetura em Serverless Functions do Next.js pode estourar timeouts (Vercel tem limite de 10s-60s) e custar muito caro. Separar apenas este worker de IA para uma API dedicada traz estabilidade.

## Fase 3: Mobilidade e Desacoplamento
**Objetivo:** Lançar aplicativos Mobile e expor APIs para empresas B2B (Integração com LMS corporativos).
*   **Novo Componente: Event-Driven Architecture (Filas/Topics).**
    *   **Quando introduzir?** Quando dezenas de sistemas internos e externos precisarem reagir ao evento `CertificationIssued` (ex: disparar webhook pro Slack do cliente, postar no LinkedIn, gerar PDF assinado). Usar RabbitMQ ou SQS aqui desacopla os processos e evita lentidão na requisição do usuário.
*   **Novo Componente: BFF (Backend For Frontend).**
    *   **Quando introduzir?** O app Mobile consumirá os mesmos dados que a Web, mas com requisitos de payload menores. Criar uma camada GraphQl ou um BFF REST específico para Mobile evita sobrecarga da rede celular.

## Fase 4: Escala Empresarial Global
**Objetivo:** Alta disponibilidade (99.99%), resiliência geográfica e times múltiplos.
*   **Novo Componente: Microserviços Reais e Kubernetes.**
    *   **Quando introduzir?** Apenas quando o faturamento pagar um time inteiro de Engenharia. Cada Bounded Context (Learning, Simulation, Progression) vira um serviço mantido por uma squad dedicada.
    *   **Por que Kubernetes agora?** Escalabilidade granular. O serviço de Simulador precisará de muito mais CPU do que o serviço de Catálogo. K8s permitirá escalar esses pods independentemente e rodar laboratórios dockerizados de alunos em ambientes isolados.

---
> [!WARNING]
> **A Regra de Ouro do Solo Dev:** Não pule etapas. Tentar implementar a Fase 4 estando na Fase 1 não é demonstrar senioridade, é garantir que o projeto falhe por excesso de complexidade técnica não essencial.
