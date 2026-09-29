# 🦊 LumiEduca

## 📚 Sobre o Projeto

O **LumiEduca** é uma plataforma educacional gamificada desenvolvida com foco em **engajamento, interatividade e acompanhamento pedagógico**.

O projeto nasceu no contexto acadêmico e evoluiu para uma aplicação completa, com foco em:

- Experiência do usuário (UX/UI)
- Gamificação do aprendizado
- Organização pedagógica
- Acessibilidade e responsividade
- Escalabilidade para futuras evoluções

A proposta central é unir **tecnologia + educação + gamificação**, criando uma experiência moderna e eficiente para alunos e professores.

---

## 🎯 Objetivos

- Tornar o aprendizado mais dinâmico e envolvente  
- Aumentar o foco e participação dos alunos  
- Auxiliar professores no acompanhamento pedagógico  
- Reforçar conteúdos através de desafios interativos  
- Criar uma experiência educacional digital moderna  
- Servir como base para evolução futura (plataforma completa)

---

## ✨ Funcionalidades Atuais

### 👨‍🏫 Área do Professor
- Login com controle de acesso
- Criação de atividades personalizadas
- Associação de atividades às salas
- Adição de atividades já existentes em salas
- Gerenciamento de tarefas criadas
- Visualização de relatórios pedagógicos
- Acompanhamento de desempenho dos alunos

---

### 🎓 Área do Aluno
- Login como estudante
- Acesso às salas por código
- Visualização de atividades da sala
- Resolução de desafios personalizados
- Revisão de atividades concluídas (sem ganhar pontos novamente)
- Sistema de pontuação com estrelas ⭐
- Progresso individual por trilhas

---

### 🧠 Trilha do Lumi (Gamificação)
- Fases organizadas por dificuldade e conteúdo
- Sistema de progressão por etapas
- Feedback imediato ao responder questões
- Revisão completa ao final da fase
- Dicas inteligentes com IA (Lumi 🦊)
- Liberação de fases conforme desempenho

---

### 🤖 Inteligência Artificial (Lumi)
- Geração de dicas pedagógicas em tempo real
- Integração com API Gemini (Google Generative AI)
- Respostas dinâmicas e contextualizadas
- Sistema de fallback em caso de erro
- Aplicável tanto nas trilhas quanto nas atividades do professor

---

### 📲 PWA & Notificações
- Aplicação instalável (PWA)
- Suporte a funcionamento offline parcial
- Service Workers configurados
- Sistema de notificações push (Firebase)
- Experiência semelhante a aplicativo mobile

---

### 🎨 Interface & UX
- Design moderno e responsivo
- Layout adaptado para desktop e mobile
- Header global com navegação inteligente
- Footer padronizado em todas as páginas
- Componentização e padronização visual
- Feedback visual de acertos e erros

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- React
- JavaScript (ES6+)
- React Router DOM
- CSS (modular e global)

### Funcionalidades
- LocalStorage (persistência local)
- PWA (Workbox / Service Workers)
- Firebase Messaging (Notificações Push)
- Gemini API (IA generativa)

### Ferramentas
- Git & GitHub
- VS Code
- Vercel (deploy)

---

## 📁 Estrutura do Projeto

```text
LumiEduca/
├── backend/
│   ├── controllers/
│   ├── lib/
│   ├── middlewares/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── routes/
│   ├── services/
│   └── server.js
│
├── public/
│   ├── favicon.ico
│   ├── manifest.json
│   ├── firebase-messaging-sw.js
│   └── lumi-notification-sw.js
│
├── src/
│   ├── assets/
│   │   └── images/
│   ├── components/
│   ├── data/
│   ├── pages/
│   ├── routes/
│   ├── services/
│   ├── styles/
│   ├── App.jsx
│   └── index.js
│
├── .env.example
├── .gitignore
├── package.json
└── README.md
```
---

## 🌐 Teste Online

A plataforma LumiEduca está disponível para teste através do deploy na Vercel:

[![Acessar LumiEduca](https://img.shields.io/badge/Acessar%20LumiEduca-FF8C00?style=for-the-badge)](https://lumieduca.vercel.app)

Você pode testar a aplicação diretamente pelo navegador, tanto no computador quanto no celular.

Por ser uma aplicação PWA, também é possível instalar o LumiEduca no dispositivo e utilizá-lo com experiência semelhante a um aplicativo mobile.

---

## ▶️ Como Executar Localmente

### 1️⃣ Clonar o projeto
```bash
git clone https://github.com/LumiEduca/LumiEduca.git
```

### 2️⃣ Entrar na pasta
```bash
cd LumiEduca
```

### 3️⃣ Instalar dependências
```bash
npm install
```

### 4️⃣ Criar arquivo `.env`

Copie o arquivo `.env.example` e renomeie para `.env`

### 5️⃣ Configurar e subir o backend
```bash
cd backend
npm install
copy .env.example .env   # (ou "cp .env.example .env" no Linux/Mac)
npm run prisma:migrate
npm run prisma:seed
npm start
```

O backend sobe em `http://localhost:5000` e cria um banco SQLite local
(`backend/dev.db`, ignorado pelo Git) já populado com os usuários demo.

### 6️⃣ Executar o frontend
Em outro terminal, na raiz do projeto:
```bash
npm start
```

A aplicação abrirá em:

```text
http://localhost:3000
```

---

## 🔐 Variáveis de Ambiente

### Arquivo `.env.example` (raiz — frontend)
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_GEMINI_KEY=
```

### Arquivo `backend/.env.example`
```env
DATABASE_URL="file:./dev.db?connection_limit=1"
JWT_SECRET=troque-por-um-valor-aleatorio-forte
PORT=5000
```

### Nunca versionar os arquivos `.env` (já protegidos pelo .gitignore)

---

## 🧪 Usuários de Teste (Demo)

O login agora é validado por um backend real (Express + Prisma + SQLite), com
senhas armazenadas com hash. Os usuários abaixo são criados automaticamente ao
rodar `npm run prisma:seed` no backend:

### 👨‍🏫 Professor
- Usuário: Joao_Lucas  
- Senha: prof123  

### 🎓 Aluno
- Usuário: Adriel_Azevedo  
- Senha: aluno123  

> ⚠️ Esses usuários são destinados apenas para demonstração e testes da aplicação.

---

## 🌐 Fluxo de Branches

### Branches principais

- `main` → versão estáveL (produção)
- `dev` → integração de desenvolvimento

### Branches de trabalho

- `feature/*` → novas funcionalidades  
- `fix/*` → correções  
- `refactor/*` → melhorias internas  
- `docs/*` → documentação

### Exemplo
```text
feature/login-api
feature/dashboard-professor
fix/responsividade
docs/readme
```

---

## 👥 Gestão da Equipe

### 👑 Liderança do Projeto
- **Bryan Duarte de Araujo Pereira** — Project Manager & Software Architect  
- **Emmanuel Nazareth Bravo da Costa** — Tech Lead / Desenvolvedor Principal  

---

### 💻 Desenvolvimento
- **Adriel dos Santos Azevedo** — Desenvolvedor  
- **José Carlos Silva Pimentel** — Desenvolvedor  

---

### 🧪 Análise e Qualidade (QA)
- **João Lucas Bittencourt Rocha** — Analista de Sistemas, QA e UI/UX  
- **Bernardo Teixeira Oliveira** — Analista de Sistemas e QA  
- **João Paulo Amarilha Coelho** — Analista de Sistemas e QA  

---

### 🧠 Sobre a Estrutura da Equipe

A equipe foi organizada com divisão clara de responsabilidades, contemplando liderança técnica, desenvolvimento e validação de qualidade (QA), garantindo uma construção estruturada, colaborativa e focada na melhor experiência para o usuário.

---

## 🚀 Próximos Passos

- ✅ Backend com banco de dados (Express + Prisma + SQLite)
- ✅ Autenticação real (JWT + bcrypt)
- Rota de exclusão de atividades (`DELETE /atividades/:id`)
- Dashboard avançado para professores
- Ranking e leaderboard
- Expansão da gamificação
- Sistema de turmas e permissões
- Versão mobile (React Native)
- Melhorias contínuas de UX/UI

---

## 📌 Status do Projeto

- Estrutura consolidada
- Funcionalidades principais implementadas 
- IA integrada e funcional  
- PWA configurado
- Deploy publicado na Vercel
- Disponível para testes

---

## 📄 Licença

All Rights Reserved © LumiEduca

This project is proprietary and confidential.

Unauthorized copying, modification, distribution, or use of this software is strictly prohibited without prior written permission from the authors.
