# GuroZord EvoApi

Bot de moderação para grupos de WhatsApp, construído sobre a [Evolution API](https://github.com/EvolutionAPI/evolution-api). O GuroZord automatiza tarefas comuns de administração de grupo: abertura/fechamento programado, ranking de membros mais ativos, controle de inatividade (aviso e remoção automática) e mensagens de boas-vindas personalizáveis.

## Funcionalidades

- **Abertura e fechamento automático de grupos** em horários configuráveis (cron).
- **Ranking de atividade** (`/top`, `/top week`, `/top month`, `/top all`) com contagem de mensagens por semana, mês e geral.
- **Controle de inatividade**: avisa e/ou remove automaticamente membros sem interação após X dias, configurável por grupo.
- **Mensagens personalizáveis** por grupo, com presets prontos (`basic`, `fancy`) ou customização manual de cada template.
- **Sincronização de grupos e membros** do WhatsApp com o banco de dados (`/sync`).
- **Comandos via WhatsApp** para configuração feita pelos próprios administradores dos grupos.
- **API de dashboard** (HTTP) para consultar grupos, membros e controlar abertura/fechamento remotamente.
- **Webhook da Evolution API** para processar eventos de mensagens e atualizações de participantes em tempo real.

## Stack

- [Node.js](https://nodejs.org/) + [TypeScript](https://www.typescriptlang.org/)
- [Fastify](https://fastify.dev/) — servidor HTTP
- [Prisma](https://www.prisma.io/) + PostgreSQL — persistência de dados
- [BullMQ](https://docs.bullmq.io/) + Redis — agendamento de jobs (abertura/fechamento de grupos, checagem de inatividade, sincronização)
- [Evolution API](https://github.com/EvolutionAPI/evolution-api) — integração com o WhatsApp (via Baileys)
- [Zod](https://zod.dev/) — validação de variáveis de ambiente e comandos
- [Winston](https://github.com/winstonjs/winston) — logs

## Arquitetura

```
src/
├── clients/         # Clientes HTTP/WhatsApp (Evolution API)
├── config/          # Validação de variáveis de ambiente (env.ts)
├── factory/          # Injeção de dependências dos serviços (Services)
├── http/
│   ├── app.ts        # Setup do Fastify
│   ├── routes/        # Rotas do dashboard
│   └── webhooks/      # Webhook da Evolution API (eventos do WhatsApp)
├── jobs/             # Filas e jobs agendados (BullMQ)
├── lib/              # Utilitários (prisma, logger, formatação, etc.)
├── persistence/      # Repositórios de acesso ao banco
├── services/         # Regras de negócio (grupos, ranking, mensagens, templates)
└── types/            # Tipos e schemas compartilhados
```

## Pré-requisitos

- Node.js 24+
- Docker e Docker Compose (para PostgreSQL, Redis e Evolution API)
- Uma instância da [Evolution API](https://github.com/EvolutionAPI/evolution-api) configurada com um número de WhatsApp conectado

## Configuração

1. Clone o repositório e instale as dependências:

   ```bash
   npm install
   ```

2. Crie um arquivo `.env` na raiz do projeto com as variáveis necessárias:

   ```env
   NODE_ENV=development
   PORT=3001
   HOST=0.0.0.0

   DATABASE_URL=postgresql://usuario:senha@localhost:5433/gurozord
   REDIS_URI=redis://127.0.0.1:6380

   EVOLUTION_API_URL=http://localhost:8081
   EVOLUTION_INSTANCE=gurozord
   AUTHENTICATION_API_KEY=sua-chave-da-evolution-api

   BOT_WHATSAPP_NUMBER=5500000000000
   TEST_WHATSAPP_NUMBER=5500000000000

   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=postgres
   POSTGRES_DB=gurozord
   ```

3. Suba os serviços de infraestrutura (PostgreSQL, Redis e Evolution API):

   ```bash
   docker compose up -d postgres redis evolution-api
   ```

4. Rode as migrations do Prisma:

   ```bash
   npx prisma migrate deploy
   ```

5. Inicie a aplicação em modo desenvolvimento:

   ```bash
   npm run dev
   ```

## Build e produção

```bash
npm run build
npm start
```

A aplicação também pode ser executada via `docker compose up -d`, que sobe PostgreSQL, Redis, Evolution API e o próprio GuroZord em containers, ou via [PM2](https://pm2.keymetrics.io/) usando o `ecosystem.config.js` incluído no projeto.

## Comandos do bot (WhatsApp)

Disponíveis para qualquer membro:

| Comando | Descrição |
|---|---|
| `/hello` | Testa se o bot está respondendo. |
| `/whoami` | Mostra como o bot identifica o remetente. |
| `/gurozord` | Apresenta o bot. |
| `/top [week\|month\|all]` | Exibe o ranking dos 10 membros mais ativos do grupo. |
| `/list inactive [dias]` | Lista membros inativos há X dias (usa configuração do grupo se omitido). |

Disponíveis apenas para o **dono do grupo** (e que seja administrador):

| Comando | Descrição |
|---|---|
| `/config [nome-do-grupo] HH:MM HH:MM` | Define horário de abertura e fechamento do grupo. |
| `/inactivity_config [nome-do-grupo] [dias-aviso] [dias-banimento]` | Configura os limites de inatividade (0 desativa). |
| `/preset [nome-do-grupo] [basic\|fancy]` | Aplica um conjunto pronto de mensagens ao grupo. |

Disponíveis apenas em produção, ou em desenvolvimento para o número definido em `TEST_WHATSAPP_NUMBER`:

| Comando | Descrição |
|---|---|
| `/get groups` | Lista todos os grupos conhecidos pela Evolution API. |
| `/get all settings` | Lista as configurações atuais de todos os grupos. |
| `/sync` | Sincroniza grupos e membros do WhatsApp com o banco de dados. |

## API HTTP

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/health` | Health check básico da aplicação. |
| `GET` | `/dashboard/health` | Health check do dashboard. |
| `GET` | `/dashboard/groups` | Lista todos os grupos com suas configurações. |
| `GET` | `/dashboard/groups/:groupId` | Detalhes de um grupo específico. |
| `GET` | `/dashboard/groups/:groupId/members` | Lista os membros de um grupo. |
| `POST` | `/dashboard/groups/:groupId/open` | Abre o grupo manualmente. |
| `POST` | `/dashboard/groups/:groupId/close` | Fecha o grupo manualmente. |
| `PUT` | `/dashboard/groups/:groupId/times` | Atualiza os horários de abertura/fechamento. |

O webhook da Evolution API é registrado automaticamente e processa os eventos `messages.upsert` e `group-participants.update`.

## Scripts disponíveis

| Script | Descrição |
|---|---|
| `npm run dev` | Inicia em modo desenvolvimento com hot-reload. |
| `npm run build` | Compila o TypeScript para `dist/`. |
| `npm start` | Inicia a versão compilada. |
| `npm run lint` / `npm run lint:fix` | Verifica/corrige problemas de lint. |
| `npm run format` | Formata o código com Prettier. |

## Deploy

O deploy é automatizado via GitHub Actions (`.github/workflows/deploy.yml`): a cada push na branch `main`, o workflow conecta via SSH ao servidor, atualiza o código, gera o `.env` de produção, builda a aplicação, garante que os containers do Docker Compose estejam no ar e roda as migrations do Prisma.
