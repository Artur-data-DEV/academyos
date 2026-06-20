# Domain Model (DDD) - AcademyOS

Este documento define a modelagem de domínio da plataforma AcademyOS, utilizando as práticas de **Domain-Driven Design (DDD)** para garantir que o software reflita perfeitamente o negócio.

## 1. Bounded Contexts (Contextos Delimitados)

Identificamos quatro contextos principais, que devem operar com alto grau de coesão interna e baixo acoplamento externo.

### A. Contexto de Identidade e Acesso (Identity & Access)
Responsável por quem é o usuário, autenticação, autorização e perfis.
### B. Contexto de Aprendizagem (Learning & Catalog)
Responsável por estruturar o que é ensinado (Trilhas, Módulos, Aulas, Documentos).
### C. Contexto de Execução Prática (Simulation & Labs)
Responsável por avaliar as decisões do usuário, simuladores de arquitetura e ambientes sandbox.
### D. Contexto de Progressão (Progression & Certification)
Responsável por rastrear onde o usuário está, XP ganho, badges, histórico e emissão de certificados.

---

## 2. Agregados, Entidades e Value Objects

### Contexto de Aprendizagem (Learning & Catalog)
*   **Agregado Raiz:** `Track` (Trilha)
    *   **Entidades:** `Module` (Módulo), `Lesson` (Aula)
    *   **Value Objects:** `TrackSlug`, `ContentMarkdown`, `OrderIndex`
*   **Regra de Negócio:** Uma Trilha só pode ser publicada se tiver pelo menos um Módulo. As Aulas pertencem estritamente a um Módulo. A ordem das aulas dita a linearidade do conteúdo.

### Contexto de Execução Prática (Simulation & Labs)
*   **Agregado Raiz:** `SimulationScenario` (Cenário de Simulação)
    *   **Entidades:** `Challenge` (Desafio), `ArchitecturalDecision` (Decisão Arquitetural do Usuário)
    *   **Value Objects:** `TradeOffEvaluation`, `BusinessRequirement`
*   **Regra de Negócio:** Uma decisão arquitetural não é "certa" ou "errada", ela possui um `TradeOffEvaluation` (ex: ganhou performance, mas estourou o orçamento). O resultado é avaliado com base no `BusinessRequirement` inicial.

### Contexto de Progressão (Progression & Certification)
*   **Agregado Raiz:** `StudentJourney` (Jornada do Aluno)
    *   **Entidades:** `LessonProgress` (Progresso em Aula), `SimulationResult` (Resultado de Simulação), `Certification` (Certificação)
    *   **Value Objects:** `CompletionDate`, `ScoreLevel`
*   **Regra de Negócio:** Um aluno só recebe uma `Certification` se completar 100% dos `LessonProgress` de uma `Track` **E** atingir um `ScoreLevel` mínimo nas simulações (demonstrando que sabe tomar decisões, não apenas ler texto).

---

## 3. Relacionamentos entre Contextos (Context Mapping)

*   **Learning ➔ Progression:** Relacionamento de *Conformist/Downstream*. O contexto de progressão consome os IDs de Trilhas e Aulas para registrar o que foi feito, mas não dita as regras de criação de conteúdo.
*   **Simulation ➔ Progression:** O contexto de simulação emite um evento de domínio (`SimulationCompleted`) que o contexto de Progressão escuta para calcular a pontuação final do usuário.

---

## 4. Casos de Uso Principais (Use Cases)

1. **[Learning] Consumir Conteúdo Estruturado:** Um aluno navega por uma trilha técnica lendo documentos (Markdown/Mermaid) para ganhar contexto sobre um problema de engenharia.
2. **[Simulation] Submeter Decisão (ADR):** Um aluno analisa um requisito de negócio e submete uma decisão arquitetural (ex: "Usar SQS em vez de Kafka para economizar custo"). O simulador calcula os trade-offs e retorna o impacto no sistema.
3. **[Progression] Obter Certificação de Especialista:** O sistema avalia o histórico de progressos e decisões e gera um certificado atestando não apenas conhecimento teórico, mas capacidade analítica de arquitetura.
