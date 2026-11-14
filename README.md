# 🦊 LumiEduca

Plataforma educacional gamificada com IA (mascote **Lumi**), para professores e alunos.

[![Acessar LumiEduca](https://img.shields.io/badge/Acessar%20LumiEduca-FF8C00?style=for-the-badge)](https://lumieduca.vercel.app)

## 📚 Sobre o projeto

O **LumiEduca** une tecnologia, educação e gamificação para aumentar o engajamento dos alunos e apoiar o acompanhamento pedagógico dos professores.

### Funcionalidades

**Professor**
- Cadastro e login com controle de acesso
- Criação de salas e de atividades personalizadas
- Associação de atividades às salas
- Notificações para os alunos das suas salas
- Relatórios pedagógicos

**Aluno**
- Cadastro e login
- Entrada em salas por código
- Resolução de desafios, com pontuação em estrelas ⭐ (sem pontuar duas vezes a mesma questão)
- Trilhas do Lumi por matéria, com fases liberadas conforme o desempenho
- Dicas do Lumi 🦊 geradas por IA (Gemini), sem revelar a resposta correta

**Geral**
- Notificações: sino no cabeçalho com contador de não lidas e marcar como lida
- Notificações push (Firebase Cloud Messaging)
- Lembrete automático de prazo (últimas 24 h) para quem ainda não concluiu
- Página de perfil (trocar nome e senha)
- PWA instalável
- Páginas públicas de demonstração em `/demos` (sem login)
- Acessibilidade e responsividade (veja a seção própria)

## 🛠️ Tecnologias

| Camada | Tecnologias |
|---|---|
| Front-end (raiz) | React (create-react-app), React Router 6, react-hot-toast, Firebase Web SDK, Workbox |
| Back-end (`backend/`) | Node.js (ESM), Express 5, Prisma 7 (`@prisma/adapter-pg`), PostgreSQL (Neon), JWT (HS256), bcryptjs, zod, helmet, express-rate-limit |
| IA | Google Gemini API (somente no back-end) |
| Push | firebase-admin (back-end) e Firebase Messaging (front-end) |
| Testes | Back: Jest + Supertest. Front: Jest + React Testing Library |
| Deploy | Vercel (API e front) |

## 📁 Estrutura

```text
LumiEduca/
├── backend/
│   ├── api/index.js          # entrada da Vercel (exporta o app)
│   ├── config/               # prismaClient, jwt
│   ├── controllers/
│   ├── middlewares/          # auth, validar, rateLimit, errorHandler
│   ├── prisma/               # schema.prisma e migrations
│   ├── routes/
│   ├── schemas/              # validação com zod
│   ├── services/
│   ├── tests/
│   ├── app.js
│   ├── server.js
│   └── vercel.json           # rewrite para a API e agenda do cron
├── public/                   # manifest, service workers (PWA e Firebase)
├── src/
│   ├── components/
│   ├── data/
│   ├── pages/                # inclui pages/demos (públicas)
│   ├── routes/
│   ├── services/
│   ├── styles/
│   ├── App.jsx
│   └── index.js
├── .env.example
└── package.json
```

Back-end em camadas: `routes → controllers → services`, com validação em `schemas/` e autenticação em `middlewares/auth.js`.
Erros sempre no formato `{ "erro": "mensagem" }`.

## ▶️ Como rodar localmente

Pré-requisitos: Node.js e um banco PostgreSQL (branch **dev** do Neon).

### 1. Clonar

```bash
git clone https://github.com/LumiEduca/LumiEduca.git
cd LumiEduca
```

### 2. Back-end

```bash
cd backend
npm install        # roda "prisma generate" automaticamente
```

Crie `backend/.env` com as variáveis da seção abaixo e rode:

```bash
npm start          # http://localhost:5000
```

### 3. Front-end (outro terminal, na raiz)

```bash
npm install
npm start          # http://localhost:3000
```

Crie o `.env` da raiz com as variáveis do front. Sem `REACT_APP_API_URL`, o front usa `http://localhost:5000`.

## 🔐 Variáveis de ambiente (somente nomes)

**Nunca coloque valores neste README e nunca commite `.env` ou `.env.test`.**

### Back-end (`backend/.env` e painel da Vercel)

| Variável | Obrigatória | Para quê |
|---|---|---|
| `DATABASE_URL` | Sim | Conexão com o banco (pode ser a *pooled*) |
| `DIRECT_URL` | Para migrations | Conexão direta, lida pelo `prisma.config.ts` |
| `JWT_SECRET` | Sim | Assinatura do token (mínimo de 32 caracteres em produção) |
| `PORT` | Não | Porta local (padrão 5000) |
| `FRONTEND_URL` | Em produção | Origens permitidas no CORS (separadas por vírgula) |
| `GEMINI_API_KEY` | Para as dicas do Lumi | Chave da IA |
| `GEMINI_MODEL` | Não | Modelo do Gemini |
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | Para push real | Credencial do Firebase Admin em base64 |
| `CRON_SECRET` | Produção | Protege a rota do cron de lembretes |

### Front-end (`.env` da raiz e painel da Vercel)

| Variável | Para quê |
|---|---|
| `REACT_APP_API_URL` | URL da API |
| `REACT_APP_FIREBASE_API_KEY` | Config do Firebase |
| `REACT_APP_FIREBASE_AUTH_DOMAIN` | Config do Firebase |
| `REACT_APP_FIREBASE_PROJECT_ID` | Config do Firebase |
| `REACT_APP_FIREBASE_STORAGE_BUCKET` | Config do Firebase |
| `REACT_APP_FIREBASE_MESSAGING_SENDER_ID` | Config do Firebase |
| `REACT_APP_FIREBASE_APP_ID` | Config do Firebase |
| `REACT_APP_FIREBASE_VAPID_KEY` | Chave pública VAPID (push no navegador) |

Variáveis `REACT_APP_*` ficam visíveis no navegador. **Nenhum segredo vai nelas.** A chave do Gemini fica só no back-end.

### Testes do back-end (`backend/.env.test`)

`DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=test` e `ALLOW_DB_WIPE=true`. Recomenda-se também `DIRECT_URL` (conexão direta da branch de teste).
O `.env.test` **não** deve ter `FIREBASE_SERVICE_ACCOUNT_BASE64`, assim os testes nunca chamam o Firebase.

## 🧪 Testes

### Back-end

```bash
cd backend
npm test
npm test -- tests/nome-do-arquivo.test.js   # um arquivo só
```

> ⚠️ **ATENÇÃO:** a suíte **APAGA TODAS AS TABELAS** do banco apontado no `backend/.env.test`.
> O `DATABASE_URL` desse arquivo deve **sempre** ser a **branch de TESTE do Neon**, nunca dev nem produção.
> A proteção em `tests/helpers/db.js` exige `NODE_ENV=test` e `ALLOW_DB_WIPE=true`.

O banco de teste precisa ter as migrations aplicadas (veja "Banco de dados").

### Front-end

```bash
# Linux/macOS
CI=true npm test -- --watchAll=false
# PowerShell
$env:CI="true"; npm test -- --watchAll=false
```

Os testes mockam `fetch` e `localStorage`: nenhum chama a API real.

## 🗄️ Banco de dados (Prisma + Neon)

- Alterações de schema: **somente migrations aditivas** (tabela nova, coluna opcional ou com default).
- `git pull origin dev` antes de criar uma migration.
- Criar migration: `npx prisma migrate dev --name descricao`, **só apontando para a branch dev do Neon**.
- O `prisma.config.ts` lê `DIRECT_URL` do `backend/.env`. Confira o host antes de rodar.
- Aplicar migrations já existentes (teste ou produção): `npx prisma migrate deploy`, com a `DIRECT_URL` do banco certo.
- O deploy na Vercel roda só `prisma generate` (`postinstall`). **Migrations de produção são aplicadas manualmente** com `migrate deploy`, de preferência antes do merge.
- Se criar tabela nova, atualize `limparDados()` em `backend/tests/helpers/db.js` na ordem das foreign keys.

## 🔔 Notificações e Firebase

**Back-end:** o `firebaseAdmin.js` lê `FIREBASE_SERVICE_ACCOUNT_BASE64`. Usa **modo simulado** (só loga) quando `NODE_ENV=test`, quando não há credencial ou quando a credencial é inválida. A credencial nunca é impressa em log.

**Criar o projeto no Firebase:**
1. Console do Firebase → criar o projeto.
2. Registrar um app **Web** e copiar o `firebaseConfig` para as variáveis `REACT_APP_FIREBASE_*`.
3. *Configurações do projeto → Cloud Messaging → Certificados push da Web*: gerar o par de chaves (`REACT_APP_FIREBASE_VAPID_KEY`).
4. *Contas de serviço → Gerar nova chave privada*. Guarde o `.json` **fora do repositório** e converta para base64:
   `[Convert]::ToBase64String([IO.File]::ReadAllBytes("caminho\arquivo.json")) | Set-Clipboard`
   Cole só em `FIREBASE_SERVICE_ACCOUNT_BASE64` (`backend/.env` e painel da Vercel).

**Front-end:** `src/services/firebase.js` registra o token em `POST /api/v1/notificacoes/token` e o remove no logout (`DELETE`). O service worker do Firebase usa escopo próprio (`/firebase-cloud-messaging-push-scope`) e não conflita com o do PWA.

### Rotas de notificações (`/api/v1/notificacoes`)

| Método e rota | Quem | O que faz |
|---|---|---|
| `POST /token` e `DELETE /token` | Logado | Registra ou remove o token do dispositivo |
| `POST /disparar` | Professor | Notifica alunos das suas salas |
| `GET /historico` | Logado | Últimas 50 notificações |
| `GET /nao-lidas/contagem` | Logado | `{ total }` |
| `PATCH /:id/lida` | Dono | Marca uma como lida (outro usuário recebe 404) |
| `PATCH /lidas` | Logado | Marca todas como lidas |
| `GET /cron/lembretes` | Cron | Lembrete de prazo (exige `CRON_SECRET`) |

Ao associar uma atividade a uma sala (`POST /salas/:id/atividades`), os alunos matriculados recebem um aviso. Falha na notificação nunca derruba a rota.

## ⏰ Cron de lembretes

`backend/vercel.json` agenda `GET /api/v1/notificacoes/cron/lembretes` todo dia às **11:00 UTC (8h de Brasília)**.
A rota exige `Authorization: Bearer <CRON_SECRET>`, que a Vercel envia sozinha quando a variável existe no projeto. Sem `CRON_SECRET`, responde 401.
O lembrete avisa quem ainda não concluiu atividades com prazo nas próximas 24 h e **não duplica** (tabela `lembretes_atividade`).
O cron só roda no deploy de **produção**. No plano Hobby, no máximo uma execução por dia.

## ♿ Acessibilidade e responsividade

> **Versão de teste.** A paleta e os ajustes abaixo podem mudar conforme a decisão da equipe.

- Foco visível por teclado, navegação por Tab, `Esc` fecha modais e menus.
- Modal com `role="dialog"`, `aria-modal`, foco preso e devolvido ao botão de origem.
- Feedback de questões, dicas e erros anunciados por leitor de tela (`aria-live` / `role`).
- Zoom liberado no celular.
- Respeita `prefers-reduced-motion`.
- Contraste mínimo de 4,5:1 nos textos pequenos: laranja escuro `#a85200` em botões e rodapé, `#d86f00` em títulos grandes, logo mantido em `#ff8c00`, azul `#2271a8`.
- Fontes mínimas de 0,875 rem e alvos de toque de 44 px.
- Todo o CSS de acessibilidade fica sob a classe `.app-a11y`, que **não é aplicada em `/demos`**. O zoom liberado no `index.html` vale também para as demos.
- Os valores de contraste foram calculados à mão: validar com o Lighthouse.

## 🚀 Deploy (Vercel)

- **API (`backend/`):** `vercel.json` redireciona tudo para `/api/index.js`. O `postinstall` roda `prisma generate`. Cadastre as variáveis do back-end e faça **redeploy** depois de qualquer mudança.
- **Front (raiz):** o build roda `react-scripts build && npx workbox-cli generateSW --config workbox-config.js` e gera a pasta `build/`.
- **Root Directory, Output Directory e Install Command:** *a confirmar com o Bryan* (painel da Vercel).
- Cadastre as variáveis `REACT_APP_*` no projeto do front e faça redeploy.

## 🌿 Fluxo de Git

- `main`: produção. **Nunca mexer direto na `main`.**
- `dev`: integração.
- Uma branch por assunto, sempre a partir da `dev`: `feature/*`, `fix/*`, `refactor/*`, `docs/*`.
- Antes de começar: `git checkout dev && git pull origin dev`.
- PR para a `dev` com **"Create a merge commit"**.
- Commits no padrão `feat(back): ...`, `feat(front): ...`, `test(front): ...`, `docs: ...`.

### Ordem de merge dos blocos recentes

Os blocos foram desenvolvidos em cadeia (cada branch parte da anterior). Mescle **na ordem**, para manter a integridade:

1. `feature/notificacoes-back` (A)
2. `feature/firebase-real` (B)
3. `feature/notificacoes-front` (C)
4. `feature/perfil` (D)
5. `feature/acessibilidade` (E)
6. `feature/testes-front` (F)
7. `feature/readme` (G)

Antes de cada merge: `npm test` no back e no front passando.
Antes do merge do bloco A, aplicar a migration `add_lembretes_atividade` no banco de produção e cadastrar `CRON_SECRET` na Vercel.

## 👥 Equipe

**Liderança**
- **Bryan Duarte de Araujo Pereira**: Project Manager & Software Architect
- **Emmanuel Nazareth Bravo da Costa**: Tech Lead / Desenvolvedor Principal

**Desenvolvimento**
- **Adriel dos Santos Azevedo**: Desenvolvedor
- **José Carlos Silva Pimentel**: Desenvolvedor

**Análise e Qualidade (QA)**
- **João Lucas Bittencourt Rocha**: Analista de Sistemas, QA e UI/UX
- **Bernardo Teixeira Oliveira**: Analista de Sistemas e QA
- **João Paulo Amarilha Coelho**: Analista de Sistemas e QA

## 📄 Licença

All Rights Reserved © LumiEduca

Este projeto é proprietário e confidencial. Cópia, modificação, distribuição ou uso não autorizados são estritamente proibidos sem permissão prévia por escrito dos autores.