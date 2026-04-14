# 🦊 LumiEduca

## 📚 Sobre o Projeto

O **LumiEduca** é uma plataforma educacional gamificada criada para aumentar o engajamento dos alunos por meio de interatividade, desafios e acompanhamento pedagógico. O projeto foi idealizado no contexto acadêmico e evoluído com foco em organização, acessibilidade e experiência do usuário.

A proposta do LumiEduca é unir **tecnologia + educação + gamificação** para tornar o aprendizado mais atrativo, moderno e eficiente.

---

## 🎯 Objetivos

- Tornar o aprendizado mais dinâmico e interessante
- Estimular participação e foco dos alunos
- Auxiliar professores no acompanhamento da turma
- Reforçar conteúdos com atividades interativas
- Criar uma experiência digital moderna para educação
- Evoluir para uma plataforma completa no futuro

---

## ✨ Funcionalidades Atuais

### 👨‍🏫 Professor
- Login como professor
- Criar desafios e tarefas
- Revisar atividades criadas
- Excluir tarefas
- Visualizar relatórios
- Acompanhar desempenho dos alunos

### 🎓 Aluno
- Login como estudante
- Acessar desafios disponíveis
- Responder atividades
- Ganhar estrelas por acertos
- Evoluir nas trilhas de aprendizagem

### ⚙️ Sistema
- Rotas organizadas
- Interface responsiva
- Armazenamento local com LocalStorage
- PWA (instalável em navegador)
- Estrutura preparada para evolução em equipe

---

## 🛠️ Tecnologias Utilizadas

- React
- JavaScript
- React Router DOM
- CSS
- LocalStorage
- Workbox / PWA
- Git / GitHub

---

## 📁 Estrutura do Projeto

```text
LumiEduca/
├── public/
├── src/
│   ├── assets/
│   └── images/
│   ├── components/
│   ├── data/
│   ├── pages/
│   ├── routes/
│   ├── styles/
│   ├── App.jsx
│   └── index.js
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── workbox-config.js
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
```

### Arquivo `.env` (local, não versionado)
```env
REACT_APP_SENHA_PROFESSOR=sua_senha
REACT_APP_SENHA_ESTUDANTE=sua_senha
```

> O arquivo `.env` é local e está protegido pelo `.gitignore`.

---

## 🌐 Fluxo de Branches

### Branches principais

- `main` → versão estável  
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

- Melhorias visuais e UX  
- Refatoração de componentes  
- Backend e banco de dados  
- Autenticação real  
- Dashboard avançado  
- Sistema de ranking  
- Expansão da gamificação  
- Deploy oficial  
- Evolução para versão mobile

---

## 📌 Status do Projeto

🟢 Base oficial concluída  
🟢 Estrutura organizada  
🟢 Fluxo Git definido  
🟢 Time pronto para desenvolvimento

---

## 📄 Licença

Projeto acadêmico desenvolvido para fins educacionais e de aprendizagem.
