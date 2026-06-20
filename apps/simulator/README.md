# Ultimate Simulator Experience

## Configuração de Autenticação Supabase

### URLs de Callback OAuth

Para que a autenticação com Google funcione corretamente, você precisa configurar as URLs de callback no Supabase:

1. Acesse o [Supabase Console](https://app.supabase.com)
2. Vá para **Authentication** > **URL Configuration**
3. Adicione as seguintes URLs em **Redirect URLs**:
   - `http://localhost:3000/auth/callback` (desenvolvimento local)
   - `https://csa-adaptive-simulator.vercel.app/auth/callback` (produção)

### Variáveis de Ambiente

O projeto está configurado com as seguintes variáveis:

- `NEXT_PUBLIC_SUPABASE_URL`: URL do projeto Supabase
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Chave pública do Supabase
- `NEXT_PUBLIC_SITE_URL`: URL do site (usada para redirecionamentos - defina como `https://csa-adaptive-simulator.vercel.app` em produção)
- `SUPABASE_SERVICE_ROLE_KEY`: Chave de serviço (use apenas no servidor)

### Fluxo de Autenticação OAuth

1. Usuário clica em "Entrar com Google"
2. App redireciona para Google OAuth
3. Google redireciona de volta para `/auth/callback?code=...`
4. Handler de callback troca o código por uma sessão Supabase
5. Usuário é redirecionado para `/dashboard` ou `/login` (em caso de erro)

Se encontrar erro `Unable to exchange external code`, verifique:
- ✅ URLs de callback configuradas corretamente no Supabase
- ✅ `NEXT_PUBLIC_SITE_URL` definido corretamente em `.env.local`
- ✅ Credenciais do Google OAuth configuradas no Supabase
 (MVP)

Plataforma de simulados adaptativos para certificacao ServiceNow CSA.

Stack:
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Supabase (Auth + Postgres + RLS)
- Sem backend separado (tudo no proprio projeto Next)

## Funcionalidades

- Login, cadastro, logout e sessao persistida com Supabase Auth.
- Criacao de simulados com:
  - quantidade de questoes: `10`, `20`, `30`, `50`
  - modos: `balanced`, `review_errors`, `random`
  - filtro opcional por topico
- Geracao adaptativa:
  - prioriza `wrong`
  - depois `not_seen`
  - evita `correct` recentes (cooldown)
  - nao repete questao dentro do mesmo simulado
  - modo `balanced` distribui por topico
- Execucao do simulado com cronometro, progresso e navegacao.
- Finalizacao com persistencia completa:
  - nota, percentual, tempo
  - respostas por questao
  - acerto/erro
  - atualizacao de `user_question_stats`
- Dashboard com evolucao geral e por topico.
- Historico de simulados.
- Estatisticas por topico (acuracia + cobertura).
- Revisao de erros.

## Estrutura de pastas

```text
.
├─ CSA_EXAMTOPICS.json
├─ middleware.ts
├─ scripts/
│  └─ import-questions.mjs
├─ supabase/
│  └─ schema.sql
├─ src/
│  ├─ app/
│  │  ├─ (auth)/
│  │  │  ├─ layout.tsx
│  │  │  ├─ login/page.tsx
│  │  │  └─ signup/page.tsx
│  │  ├─ (protected)/
│  │  │  ├─ layout.tsx
│  │  │  ├─ dashboard/page.tsx
│  │  │  ├─ dashboard/new/page.tsx
│  │  │  ├─ historico/page.tsx
│  │  │  ├─ estatisticas/page.tsx
│  │  │  ├─ revisao-erros/page.tsx
│  │  │  └─ simulados/[id]/
│  │  │     ├─ page.tsx
│  │  │     └─ resultado/page.tsx
│  │  ├─ actions/
│  │  │  ├─ auth-actions.ts
│  │  │  └─ simulation-actions.ts
│  │  ├─ globals.css
│  │  ├─ layout.tsx
│  │  └─ page.tsx
│  ├─ components/
│  │  ├─ app-shell.tsx
│  │  ├─ nav-links.tsx
│  │  ├─ stat-card.tsx
│  │  ├─ forms/new-simulation-form.tsx
│  │  ├─ simulations/quiz-runner.tsx
│  │  └─ ui/
│  │     ├─ badge.tsx
│  │     ├─ button.tsx
│  │     ├─ card.tsx
│  │     └─ progress-bar.tsx
│  └─ lib/
│     ├─ adaptive/selection.ts
│     ├─ constants.ts
│     ├─ env.ts
│     ├─ server/
│     │  ├─ dashboard.ts
│     │  ├─ mappers.ts
│     │  └─ simulations.ts
│     ├─ supabase/
│     │  ├─ client.ts
│     │  ├─ middleware.ts
│     │  └─ server.ts
│     ├─ types/
│     │  ├─ database.ts
│     │  └─ domain.ts
│     ├─ utils/format.ts
│     └─ validation/
│        ├─ auth.ts
│        └─ simulation.ts
└─ .env.example
```

## Banco de dados (Supabase)

1. Abra o SQL Editor do Supabase.
2. Rode o arquivo [`supabase/schema.sql`](./supabase/schema.sql).
3. Se o banco ja existia antes, rode tambem [`supabase/patch-question-type.sql`](./supabase/patch-question-type.sql).

Esse schema cria:
- `profiles`
- `questions`
- `simulations`
- `simulation_questions`
- `user_question_stats`
- enums de status/modo
- trigger de criacao automatica de profile
- RLS policies por usuario

## Configuracao de ambiente

Crie `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Login com Google (Supabase Auth)

1. No Supabase Dashboard, acesse `Authentication > Providers > Google` e habilite o provider.
2. No Google Cloud Console (OAuth Client), configure os redirect URIs:
   - `https://<SEU-PROJETO>.supabase.co/auth/v1/callback`
3. No Supabase, configure os URLs da aplicacao:
   - `Authentication > URL Configuration > Site URL`: `https://<SEU-DOMINIO>`
   - `Authentication > URL Configuration > Redirect URLs`:
     - `https://<SEU-DOMINIO>/auth/callback`
     - `http://localhost:3000/auth/callback`
4. Na Vercel, configure:
   - `NEXT_PUBLIC_SITE_URL=https://<SEU-DOMINIO>`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server only)

## Import da base JSON

Com banco criado e variaveis prontas:

```bash
npm run import:questions
```

O script:
- le `CSA_EXAMTOPICS.json`
- normaliza opcoes/respostas
- remove sufixos de artefato no enunciado (ex.: `(file 7)`, `(duplicate)`)
- descarta duplicatas de conteudo no mesmo lote de importacao
- define `question_type` (`single_choice` ou `multi_select`) quando a coluna existir
- faz `upsert` na tabela `questions` por `id`

### Import usando dump OCR (ExamTopics.zip)

1. Extraia o ZIP para `data/raw-examtopics`.
2. Gere base estruturada do dump:

```bash
npm run build:dump
```

Isso gera:
- `CSA_EXAMTOPICS_FROM_DUMP.json` (inclui itens `ready`, `missing_answer_key`, `low_confidence`)
- cache OCR em `data/ocr-cache` para retomar rapido

3. Para importar so questoes prontas:

```bash
npm run import:questions:ready
```

Observacao importante:
- No dump atual, as questoes `363-385` vieram sem linha de gabarito no PDF de respostas (apenas `Reveal Solution`), entao ficam marcadas como `missing_answer_key`.

## Rodando localmente

```bash
npm install
npm run dev
```

Acesse:
- `http://localhost:3000/login`

## Regras adaptativas implementadas

Para cada usuario e questao:
- status: `wrong`, `correct` ou ausente (tratado como `not_seen`)
- prioridade de selecao:
  1. `wrong`
  2. `not_seen`
  3. `correct` (com cooldown para evitar repeticao imediata)

Modos:
- `balanced`: distribui por topico e aplica prioridade adaptativa em cada topico.
- `review_errors`: foco total em erros, com fallback para nao vistas/corretas.
- `random`: sorteio puro aleatorio.

## Scripts

- `npm run dev` - ambiente local
- `npm run build` - build de producao
- `npm run lint` - lint
- `npm run import:questions` - import da base JSON
- `npm run build:dump` - OCR + parser dos PDFs de respostas
- `npm run import:questions:dump` - importa `CSA_EXAMTOPICS_FROM_DUMP.json`
- `npm run import:questions:ready` - importa apenas questoes `ready`

## Observacoes

- O MVP foi estruturado para evolucao incremental sem retrabalho grande.
- Toda a logica de negocio principal esta no projeto Next.js, sem API/backend separado.
