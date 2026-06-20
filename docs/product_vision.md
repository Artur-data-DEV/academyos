# 🚀 Product Vision Document: AcademyOS

## 1. Visão do Produto
**"Formar a elite da engenharia de software global, transformando construtores de código em tomadores de decisão arquitetural."**

A plataforma existe para preencher o vácuo entre "saber programar/configurar" e "saber projetar soluções resilientes, escaláveis e de alto valor de negócio". Nosso foco não é a sintaxe da linguagem ou os cliques na interface do ServiceNow, mas a ciência da computação aplicada a trade-offs do mundo real.

## 2. Público-Alvo

### Core Persona 1: O Engenheiro em Transição (Mid-Level to Senior)
- **Quem é:** Software Engineers e Cloud Engineers que já dominam a execução técnica, mas travam quando recebem requisitos vagos ou precisam desenhar do zero.
- **Dores:** Sentem que viraram "tiradores de ticket". Não sabem justificar escolhas arquiteturais (ex: *Por que Kafka e não RabbitMQ? Por que Microsserviços e não Monolito Modular?*).

### Core Persona 2: O Especialista ServiceNow (Developer / Technical Consultant)
- **Quem é:** Profissionais do ecossistema ServiceNow que conhecem as APIs e tabelas, mas não compreendem profundamente as consequências arquiteturais de suas customizações.
- **Dores:** Dificuldade em desenhar soluções usando CSDM, governança, arquitetura escalável e gerenciamento de débito técnico. Sentem falta de materiais avançados na plataforma oficial.

### Core Persona 3: O Aspirante a Arquiteto (Staff / Principal / Architect)
- **Quem é:** Desenvolvedores Sêniores buscando o próximo passo na carreira.
- **Dores:** Precisam dominar diagramação técnica (UML/Mermaid), comunicação com stakeholders e documentação de decisões (ADRs).

## 3. Proposta de Valor
**"Aprenda com cenários, decida com trade-offs."**
Em vez de tutoriais do tipo *"siga estes 10 passos para criar um app"*, entregamos simuladores de problemas reais. Você recebe um cenário de negócio quebrado, requisitos conflitantes, um orçamento e precisa desenhar a arquitetura, justificar as escolhas e documentar a solução.

## 4. Diferenciais Competitivos
1. **Simulador Orientado a Decisões (Decision-Driven Learning):** Diferente da Udemy/Pluralsight, o aprendizado não é passivo. O usuário é jogado no "Simulador" onde suas escolhas arquiteturais geram consequências simuladas em performance, custo ou segurança.
2. **Foco Brutal em Trade-offs e ADRs:** Cada módulo de aprendizado exige a produção ou interpretação de uma *Architecture Decision Record (ADR)*.
3. **Casos Reais do Nível Enterprise:** Modelagem de domínio de marketplaces, integrações complexas legadas, CSDM em grandes corporações. Nada de "To-do lists" ou "Pokedex".
4. **Mermaid First:** Todo o design visual de arquitetura na plataforma é feito como código, treinando os profissionais nas melhores práticas de documentação de engenharia moderna (Docs as Code).

## 5. Escopo Inicial do MVP (Minimum Viable Product)
O MVP deve ser focado em provar a proposta de valor do **aprendizado orientado a cenários e trade-offs**.

*   **1 Trilha Completa de Engenharia/Arquitetura (ex: "Detran Marketplace"):** Uma trilha end-to-end simulando a modernização de um sistema governamental complexo (exigindo modelagem, governança e integração).
*   **Leitor de Aulas Rico (LMS):** O motor de renderização que já construímos, com Dark Mode premium, suporte nativo a diagramas dinâmicos (Mermaid) e navegação estruturada.
*   **O "Simulador" Básico (Modo Desafio):** Páginas onde o usuário recebe um requisito (ex: *Lidar com 1M de requisições/minuto*) e deve fazer uma escolha múltipla estruturada ou submeter um texto com a justificativa de qual fila/mensageria usar.
*   **Dashboard de Progresso Simples:** Capacidade de marcar aulas como concluídas e ver o avanço nas trilhas.

## 6. Funcionalidades Futuras (Pós-MVP)
*   **Avaliação Automática com IA (AI Mentor):** O aluno submete uma ADR de texto livre e uma IA configurada com persona de "Principal Engineer" (o Architect AI) realiza o review crítico apontando falhas de segurança ou custos escondidos na arquitetura proposta.
*   **Árvore de Habilidades (Skill Tree):** Um painel visual inspirado em RPGs onde o usuário vê sua evolução em áreas como *System Design, Cloud Sec, Data Modeling e ServiceNow Governance*.
*   **Ambientes Sandbox Reais:** Integração via API para provisionar infraestrutura real na AWS ou instâncias PDI no ServiceNow para que o usuário execute a arquitetura que desenhou.
*   **Comunidade de Prática Interna:** Fóruns no estilo StackOverflow acoplados aos simuladores, onde alunos debatem os trade-offs das decisões de outros arquitetos.

## 7. O Que NÃO Deve Fazer Parte do MVP
*   Fórum da comunidade ou chat ao vivo.
*   Geração e emissão de certificados complexos e gamificação excessiva (badges, pontuações, leaderboards).
*   Criação de dezenas de cursos curtos. (O foco é a qualidade profunda de UMA ou DUAS trilhas completas).
*   Pagamentos e sistema de assinaturas complexos (B2B, trials de diferentes níveis). O MVP pode ser para usuários beta convidados ou ter um gateway de pagamento simples (ex: Stripe Checkout único).
*   Avaliação de código/repositórios complexos do usuário (Foque primeiro na avaliação teórica dos trade-offs arquiteturais antes de avaliar o código em si).
