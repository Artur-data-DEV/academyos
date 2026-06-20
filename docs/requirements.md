# Especificação de Requisitos - AcademyOS

Com base na visão de formar engenheiros através de trade-offs e decisões arquiteturais, este documento lista os requisitos formais que guiarão o desenvolvimento.

## 1. Requisitos Funcionais (RF)
*   **RF01:** O sistema deve permitir que o aluno navegue por Trilhas contendo Módulos e Aulas ricas em texto, imagens e diagramas (Markdown/Mermaid).
*   **RF02:** O sistema deve renderizar diagramas Mermaid de forma interativa, adaptando-se automaticamente ao tema claro/escuro (Dark Mode).
*   **RF03:** O sistema deve incluir um "Simulador de Arquitetura", permitindo que o aluno receba um cenário de negócio e escolha componentes arquiteturais.
*   **RF04:** O sistema deve calcular uma nota (Score) baseada nos trade-offs (Custo, Performance, Segurança) da arquitetura submetida.
*   **RF05:** O sistema deve rastrear a conclusão de leitura de cada aula e bloquear a emissão de certificados até que a trilha teórica e o simulador prático atinjam as métricas mínimas.

## 2. Requisitos Não Funcionais (RNF)
*   **RNF01 (Desempenho):** O carregamento de qualquer aula teórica no LMS deve ocorrer em menos de 1000ms (P95), justificando o uso maciço de renderização do lado do servidor (RSC no Next.js).
*   **RNF02 (Usabilidade):** A UI deve seguir padrões *Premium* (Sleek Dark Mode, transições fluidas de 300ms, ausência de reload de página), focando em uma experiência imersiva ("App-like").
*   **RNF03 (Escalabilidade de Conteúdo):** O sistema deve suportar a injeção e importação de documentos via "Docs as Code" (Arquivos `.md` puxados de um repositório central), permitindo a atualização massiva sem deploys do LMS.

## 3. Regras de Negócio (RN)
*   **RN01:** O conteúdo teórico nunca "reprova" o aluno. Apenas a etapa do Simulador dita a proficiência final.
*   **RN02:** Uma trilha não pode ser iniciada se houver dependências de trilhas pré-requisitadas não concluídas (A definir implementação na Fase 2).
*   **RN03:** A avaliação de Trade-offs no simulador é absoluta ao cenário. Ex: Submeter "Kafka" num cenário onde o cliente processa 10 eventos/dia gera *Penalidade de Custo e Overengineering* (-30 pontos), apesar de ser uma ferramenta robusta.

## 4. Caso de Uso Principal & Critérios de Aceitação

**Caso de Uso:** Submissão de ADR no Simulador
**Ator:** Estudante Sênior

*Fluxo Principal:*
1. O sistema apresenta um requisito: "O e-commerce precisa suportar Black Friday sem cair. Orçamento: $500/mês".
2. O estudante seleciona: Banco RDS Aurora + Cache em Redis + Fila SQS.
3. O estudante escreve uma justificativa de 100 palavras.
4. O sistema processa e retorna: "Arquitetura Aprovada. Trade-off positivo na escalabilidade com SQS. Alerta de Custo: O Aurora pode estourar o limite de $500 se não configurado como Serverless V2."

*Critérios de Aceitação:*
- **Dado que** o aluno não selecionou um componente de persistência, **quando** ele submeter a solução, **então** o sistema deve retornar erro imediato "Arquitetura Inválida: Falta banco de dados".
- **Dado que** o aluno enviou os componentes, **então** o processamento da nota deve ser finalizado em menos de 5 segundos.
