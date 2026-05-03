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

### 5️⃣ Executar o projeto
```bash
npm start
```

A aplicação abrirá em:

```text
http://localhost:3000
```

---

## 🔐 Variáveis de Ambiente

### Arquivo `.env.example`
```env
REACT_APP_SENHA_PROFESSOR=
REACT_APP_SENHA_ESTUDANTE=
REACT_APP_GEMINI_KEY=
```

### Nunca versionar o arquivo .env (já protegido pelo .gitignore)

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

### Liderança do Projeto
- **Bryan Duarte de Araujo Pereira** — Líder Técnico e Organizador da Base Inicial

### Desenvolvedores
- Adriel dos Santos Azevedo
- Bernardo Teixeira Oliveira
- Emmanuel Nazareth Bravo da Costa
- João Lucas Bittencourt Rocha
- João Paulo Amarilha Coelho
- José Carlos Silva Pimentel

---

## 🚀 Próximos Passos

- Backend completo com banco de dados
- Sistema real de autenticação (JWT/Auth)
- Dashboard avançado para professores
- Ranking e leaderboard
- Expansão da gamificação
- Sistema de turmas e permissões
- Versão mobile (React Native)
- Melhorias contínuas de UX/UI

---

## 📌 Status do Projeto

🟢 Estrutura consolidada
🟢 Funcionalidades principais implementadas 
🟢 IA integrada e funcional  
🟢 PWA configurado
🟢 Pronto para deploy

---

## 📄 Licença

All Rights Reserved © LumiEduca

This project is proprietary and confidential.

Unauthorized copying, modification, distribution, or use of this software is strictly prohibited without prior written permission from the authors.
