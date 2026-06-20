# Event Storming - AcademyOS

O Event Storming mapeia o comportamento do sistema de forma cronológica e focada no negócio, independentemente de infraestrutura ou banco de dados.

## 1. Fluxo de Aprendizado Base (LMS)

*   **Comando:** `StartLesson` (Iniciar Aula)
    *   **Ator:** Aluno
    *   **Evento:** `LessonStarted`
*   **Comando:** `MarkLessonComplete` (Marcar Aula como Concluída)
    *   **Ator:** Aluno
    *   **Regra de Negócio:** Só pode ser concluída se a aula anterior foi concluída (Linearidade Opcional).
    *   **Evento:** `LessonCompleted`
*   **Política (Policy):** *Ao escutar `LessonCompleted`, verificar se foi a última aula do módulo.*
    *   **Evento Secundário:** Se sim, disparar `ModuleCompleted`.
*   **Política (Policy):** *Ao escutar `ModuleCompleted`, verificar se foi o último módulo da trilha.*
    *   **Evento Secundário:** Se sim, disparar `TrackTheoryCompleted`.

## 2. Fluxo do Simulador de Arquitetura (Simulation & Labs)

*   **Comando:** `StartSimulation` (Iniciar Simulação)
    *   **Ator:** Aluno
    *   **Evento:** `SimulationStarted` (Gera uma instância de desafio com requisitos específicos).
*   **Comando:** `SubmitArchitecturalDecision` (Submeter Decisão Arquitetural)
    *   **Ator:** Aluno
    *   **Regra de Negócio:** A decisão deve conter uma escolha de componente (Ex: RabbitMQ) e um texto justificativo (ADR).
    *   **Evento:** `DecisionSubmitted`
*   **Política (Policy):** *Ao escutar `DecisionSubmitted`, acionar o motor de avaliação (AI Mentor / Regras Estáticas).*
    *   **Comando Automático:** `EvaluateTradeOffs`
    *   **Regras de Negócio:** Se a escolha ignorar segurança em um sistema financeiro, penalizar Score. Se a escolha for muito cara para uma startup, penalizar Score de Custo.
    *   **Evento:** `TradeOffsEvaluated`
    *   **Evento Final:** `SimulationCompleted` (com o Score final anexado).

## 3. Fluxo de Progresso e Certificação

*   **Política Central de Progressão:** *Escutar `TrackTheoryCompleted` E `SimulationCompleted`.*
    *   **Regra de Negócio:** A certificação não é dada só por ler textos. O aluno precisa de Score A ou B nas simulações atreladas à trilha.
*   **Comando Automático:** `IssueCertification` (Emitir Certificação)
    *   **Evento:** `CertificationIssued`
    *   **Comando Secundário:** `NotifyUser` (Parabéns, você é um Arquiteto Nível 1).

## 4. Dependências de Módulos (Cross-Boundary)
- O **Módulo de Simulador** depende estritamente das restrições (Requisitos de Negócio) definidas pelo **Módulo de Catálogo/Trilha**.
- O **Módulo de Certificação** não deve conhecer detalhes de como a aula foi lida ou como o simulador funcionou. Ele apenas reage aos Eventos de Domínio (`SimulationCompleted` com Score > 80 e `TrackTheoryCompleted`), mantendo os sistemas desacoplados.
