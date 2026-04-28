export const bancoDeQuestoes = {
  matematica: [
    {
      id: 'mat-f1-1',
      fase: 1,
      tipo: 'completar-equacao',
      pergunta: 'Lumi encontrou 5 estrelas e depois encontrou mais 5. Quantas estrelas ele tem agora?',
      partes: ['5', '+', '5', '=', '?'],
      opcoes: [8, 9, 10, 11],
      correta: 10,
      explicacaoCorreta: 'Muito bem! 5 + 5 = 10. O Lumi juntou todas as estrelas!',
      explicacaoErrada: 'Quase! Para resolver, conte 5 estrelas e depois mais 5. Juntando tudo, temos 10.'
    },
    {
      id: 'mat-f1-2',
      fase: 1,
      tipo: 'multipla-escolha',
      pergunta: 'Lumi tinha 3 lápis e ganhou mais 2. Quantos lápis ele tem agora?',
      opcoes: [4, 5, 6, 7],
      correta: 5,
      explicacaoCorreta: 'Parabéns! 3 + 2 = 5.',
      explicacaoErrada: 'Conte assim: 3 lápis mais 2 lápis. O total é 5.'
    },
    {
      id: 'mat-f1-3',
      fase: 1,
      tipo: 'multipla-escolha',
      pergunta: 'Ana tinha 4 balas e ganhou mais 3. Quantas balas ela tem agora?',
      opcoes: [6, 7, 8, 9],
      correta: 7,
      explicacaoCorreta: 'Isso! 4 + 3 = 7.',
      explicacaoErrada: 'Vamos contar: 4 balas mais 3 balas dá 7 balas.'
    },

    {
      id: 'mat-f2-1',
      fase: 2,
      tipo: 'completar-equacao',
      pergunta: 'Havia 8 balões. 3 voaram. Quantos balões ficaram?',
      partes: ['8', '-', '3', '=', '?'],
      opcoes: [4, 5, 6, 7],
      correta: 5,
      explicacaoCorreta: 'Muito bem! 8 - 3 = 5.',
      explicacaoErrada: 'Quase! Comece no 8 e tire 3: 7, 6, 5. Ficaram 5 balões.'
    },
    {
      id: 'mat-f2-2',
      fase: 2,
      tipo: 'multipla-escolha',
      pergunta: 'Ana tinha 4 maçãs e deu 2 para seu amigo. Com quantas maçãs ela ficou?',
      opcoes: [1, 2, 3, 4],
      correta: 2,
      explicacaoCorreta: 'Isso! 4 - 2 = 2. Ana ficou com 2 maçãs.',
      explicacaoErrada: 'Vamos pensar: Ana tinha 4 maçãs. Se ela deu 2, sobraram 2.'
    },
    {
      id: 'mat-f2-3',
      fase: 2,
      tipo: 'multipla-escolha',
      pergunta: 'Lumi tinha 7 biscoitos e comeu 2. Quantos sobraram?',
      opcoes: [4, 5, 6, 7],
      correta: 5,
      explicacaoCorreta: 'Acertou! 7 - 2 = 5.',
      explicacaoErrada: 'Conte tirando 2 do número 7. O resultado é 5.'
    },

    {
      id: 'mat-f3-1',
      fase: 3,
      tipo: 'conectar-pares',
      pergunta: 'Ligue cada continha ao resultado correto.',
      pares: [
        { id: '2x2', display: '2 x 2' },
        { id: '3x2', display: '3 x 2' },
        { id: '4x2', display: '4 x 2' }
      ],
      alvos: [
        { id: 'res4', display: '4' },
        { id: 'res6', display: '6' },
        { id: 'res8', display: '8' }
      ],
      correta: {
        '2x2': 'res4',
        '3x2': 'res6',
        '4x2': 'res8'
      },
      explicacaoCorreta: 'Muito bem! Multiplicar por 2 é como formar pares.',
      explicacaoErrada: 'Vamos revisar: 2 x 2 = 4, 3 x 2 = 6 e 4 x 2 = 8.'
    },
    {
      id: 'mat-f3-2',
      fase: 3,
      tipo: 'multipla-escolha',
      pergunta: 'Cada caixa tem 2 brinquedos. Se temos 3 caixas, quantos brinquedos existem ao todo?',
      opcoes: [5, 6, 7, 8],
      correta: 6,
      explicacaoCorreta: 'Isso! 2 + 2 + 2 = 6.',
      explicacaoErrada: 'São 3 caixas com 2 brinquedos cada: 2 + 2 + 2 = 6.'
    },
    {
      id: 'mat-f3-3',
      fase: 3,
      tipo: 'multipla-escolha',
      pergunta: 'Lumi fez 4 grupos com 3 estrelas em cada grupo. Quantas estrelas são ao todo?',
      opcoes: [10, 11, 12, 13],
      correta: 12,
      explicacaoCorreta: 'Perfeito! 4 x 3 = 12.',
      explicacaoErrada: 'Some 3 quatro vezes: 3 + 3 + 3 + 3 = 12.'
    },

    {
      id: 'mat-f4-1',
      fase: 4,
      tipo: 'completar-equacao',
      pergunta: 'Lumi tem 6 balas para dividir igualmente entre 2 amigos. Quantas balas cada um recebe?',
      partes: ['6', '÷', '2', '=', '?'],
      opcoes: [2, 3, 4, 5],
      correta: 3,
      explicacaoCorreta: 'Isso! 6 dividido para 2 amigos dá 3 balas para cada um.',
      explicacaoErrada: 'Dividir é repartir igualmente. 6 balas para 2 amigos dá 3 para cada.'
    },
    {
      id: 'mat-f4-2',
      fase: 4,
      tipo: 'multipla-escolha',
      pergunta: 'Temos 8 lápis para dividir entre 4 crianças. Quantos lápis cada criança recebe?',
      opcoes: [1, 2, 3, 4],
      correta: 2,
      explicacaoCorreta: 'Muito bem! 8 ÷ 4 = 2.',
      explicacaoErrada: 'Repartindo 8 lápis entre 4 crianças, cada uma fica com 2.'
    },
    {
      id: 'mat-f4-3',
      fase: 4,
      tipo: 'multipla-escolha',
      pergunta: 'Lumi tem 12 adesivos e quer colocar 3 em cada página. Quantas páginas ele vai usar?',
      opcoes: [3, 4, 5, 6],
      correta: 4,
      explicacaoCorreta: 'Acertou! 12 ÷ 3 = 4.',
      explicacaoErrada: 'Pense em grupos de 3: 3, 6, 9, 12. Foram 4 grupos.'
    }
  ],

  portugues: [
    {
      id: 'pt-f1-1',
      fase: 1,
      tipo: 'conectar-pares',
      pergunta: 'Ligue cada palavra ao seu tipo correto.',
      pares: [
        { id: 'correr', display: 'Correr' },
        { id: 'feliz', display: 'Feliz' },
        { id: 'bola', display: 'Bola' }
      ],
      alvos: [
        { id: 'verbo', display: 'Ação' },
        { id: 'adjetivo', display: 'Qualidade' },
        { id: 'substantivo', display: 'Nome' }
      ],
      correta: {
        correr: 'verbo',
        feliz: 'adjetivo',
        bola: 'substantivo'
      },
      explicacaoCorreta: 'Muito bem! Correr é ação, feliz é qualidade e bola é nome.',
      explicacaoErrada: 'Vamos revisar: verbo é ação, adjetivo é qualidade e substantivo é nome.'
    },
    {
      id: 'pt-f1-2',
      fase: 1,
      tipo: 'multipla-escolha',
      pergunta: 'Na frase "O gato bonito dormiu", qual palavra mostra uma qualidade?',
      opcoes: ['gato', 'bonito', 'dormiu', 'O'],
      correta: 'bonito',
      explicacaoCorreta: 'Isso! "Bonito" mostra uma qualidade do gato.',
      explicacaoErrada: 'A palavra que mostra qualidade é "bonito".'
    },
    {
      id: 'pt-f1-3',
      fase: 1,
      tipo: 'multipla-escolha',
      pergunta: 'Qual palavra é uma ação?',
      opcoes: ['mesa', 'azul', 'pular', 'casa'],
      correta: 'pular',
      explicacaoCorreta: 'Acertou! Pular é uma ação.',
      explicacaoErrada: 'A resposta é "pular", porque indica uma ação.'
    },

    {
      id: 'pt-f2-1',
      fase: 2,
      tipo: 'completar-equacao',
      pergunta: 'Complete a palavra corretamente.',
      partes: ['pa', '?', 'arinho'],
      opcoes: ['s', 'ss', 'ç', 'x'],
      correta: 'ss',
      explicacaoCorreta: 'Muito bem! Passarinho é escrito com SS.',
      explicacaoErrada: 'A palavra correta é passarinho, com SS.'
    },
    {
      id: 'pt-f2-2',
      fase: 2,
      tipo: 'multipla-escolha',
      pergunta: 'Qual palavra está escrita corretamente?',
      opcoes: ['caza', 'casa', 'cassa', 'kasa'],
      correta: 'casa',
      explicacaoCorreta: 'Isso! Casa é escrita com S.',
      explicacaoErrada: 'A forma correta é "casa".'
    },
    {
      id: 'pt-f2-3',
      fase: 2,
      tipo: 'multipla-escolha',
      pergunta: 'Antes de P e B usamos qual letra?',
      opcoes: ['M', 'N', 'S', 'R'],
      correta: 'M',
      explicacaoCorreta: 'Perfeito! Antes de P e B usamos M.',
      explicacaoErrada: 'A regra é: antes de P e B usamos M.'
    },

    {
      id: 'pt-f3-1',
      fase: 3,
      tipo: 'conectar-pares',
      pergunta: 'Ligue cada palavra ao seu oposto.',
      pares: [
        { id: 'grande', display: 'Grande' },
        { id: 'feliz', display: 'Feliz' },
        { id: 'claro', display: 'Claro' }
      ],
      alvos: [
        { id: 'escuro', display: 'Escuro' },
        { id: 'triste', display: 'Triste' },
        { id: 'pequeno', display: 'Pequeno' }
      ],
      correta: {
        grande: 'pequeno',
        feliz: 'triste',
        claro: 'escuro'
      },
      explicacaoCorreta: 'Muito bem! Você ligou todos os opostos.',
      explicacaoErrada: 'Vamos revisar: grande é o oposto de pequeno, feliz de triste e claro de escuro.'
    },
    {
      id: 'pt-f3-2',
      fase: 3,
      tipo: 'multipla-escolha',
      pergunta: 'Qual palavra significa o mesmo que "alegre"?',
      opcoes: ['feliz', 'triste', 'bravo', 'cansado'],
      correta: 'feliz',
      explicacaoCorreta: 'Isso! Alegre e feliz têm significado parecido.',
      explicacaoErrada: 'A resposta é "feliz", pois tem significado parecido com alegre.'
    },
    {
      id: 'pt-f3-3',
      fase: 3,
      tipo: 'multipla-escolha',
      pergunta: 'Qual é o contrário de "quente"?',
      opcoes: ['morno', 'frio', 'alto', 'baixo'],
      correta: 'frio',
      explicacaoCorreta: 'Acertou! O contrário de quente é frio.',
      explicacaoErrada: 'O contrário de quente é frio.'
    },

    {
      id: 'pt-f4-1',
      fase: 4,
      tipo: 'completar-equacao',
      pergunta: 'Complete a frase.',
      partes: ['Eu escovei os dentes ', '?', ' fui dormir.'],
      opcoes: ['e', 'mas', 'ou', 'porque'],
      correta: 'e',
      explicacaoCorreta: 'Muito bem! A palavra "e" liga as duas ações.',
      explicacaoErrada: 'A melhor resposta é "e": escovei os dentes e fui dormir.'
    },
    {
      id: 'pt-f4-2',
      fase: 4,
      tipo: 'multipla-escolha',
      pergunta: 'Na frase "Maria pegou a mochila. Ela foi para a escola", quem é "Ela"?',
      opcoes: ['Maria', 'mochila', 'escola', 'professora'],
      correta: 'Maria',
      explicacaoCorreta: 'Isso! "Ela" está falando de Maria.',
      explicacaoErrada: 'A palavra "Ela" se refere à Maria.'
    },
    {
      id: 'pt-f4-3',
      fase: 4,
      tipo: 'multipla-escolha',
      pergunta: 'Qual palavra liga melhor a frase: "Eu queria brincar, ___ começou a chover."',
      opcoes: ['mas', 'e', 'ou', 'também'],
      correta: 'mas',
      explicacaoCorreta: 'Muito bem! "Mas" mostra uma ideia contrária.',
      explicacaoErrada: 'A resposta é "mas", porque a chuva atrapalhou a vontade de brincar.'
    }
  ]
};