export const bancoDeQuestoes = {
  matematica: [
    // --- FASE 1: SOMA BÁSICA (Números Grandes e Decimais) ---
    {
      id: 'mat-f1-1',
      fase: 1,
      tipo: 'completar-equacao',
      pergunta: 'O Lumi coletou 2.450 garrafas na semana 1 e 3.875 na semana 2. Qual o total?',
      partes: ['2450', '+', '3875', '=', '?'],
      opcoes: [6225, 6325, 6315, 5325],
      correta: 6325,
      explicacaoCorreta: 'Incrível! 2.450 + 3.875 resulta em 6.325 garrafas recicladas!',
      explicacaoErrada: 'Quase! Lembre-se de somar as centenas corretamente: 2450 + 3875 = 6325.'
    },
    {
      id: 'mat-f1-2',
      fase: 1,
      tipo: 'multipla-escolha',
      pergunta: 'João comprou uma cartolina (R$ 15,50), canetas (R$ 9,25) e cola (R$ 4,90). Qual o gasto total?',
      opcoes: ['R$ 28,65', 'R$ 30,65', 'R$ 29,55', 'R$ 29,65'],
      correta: 'R$ 29,65',
      explicacaoCorreta: 'Correto! Somando os decimais alinhando a vírgula: 15,50 + 9,25 + 4,90 = 29,65.'
    },
    {
      id: 'mat-f1-3',
      fase: 1,
      tipo: 'multipla-escolha',
      pergunta: 'As pontuações da equipe foram: 1.240, 980 e 1.550. Qual a soma total?',
      opcoes: [3770, 3870, 3760, 3670],
      correta: 3770,
      explicacaoCorreta: 'Isso! A equipe somou 3.770 pontos no total.'
    },

    // --- FASE 2: SUBTRAÇÃO (Cálculo de Diferença e Troco) ---
    {
      id: 'mat-f2-1',
      fase: 2,
      tipo: 'completar-equacao',
      pergunta: 'Uma reserva ambiental tinha 1.500 árvores. Após um reflorestamento, restaram apenas 745 para plantar. Quantas já foram plantadas?',
      partes: ['1500', '-', '?', '=', '745'],
      opcoes: [755, 765, 855, 745],
      correta: 755,
      explicacaoCorreta: 'Certinho! 1.500 - 755 = 745 árvores plantadas!',
      explicacaoErrada: 'Ops! 1.500 - 745 = 755. Tente subtrair as dezenas com calma.'
    },
    {
      id: 'mat-f2-2',
      fase: 2,
      tipo: 'multipla-escolha',
      pergunta: 'Um estádio tem 12.000 lugares. Se 8.750 ingressos foram vendidos, quantos lugares sobraram?',
      opcoes: [3250, 4250, 3150, 3350],
      correta: 3250,
      explicacaoCorreta: 'Exato! 12.000 - 8.750 = 3.250 lugares vazios.'
    },
    {
      id: 'mat-f2-3',
      fase: 2,
      tipo: 'multipla-escolha',
      pergunta: 'Lumi tinha R$ 50,00 e comprou um livro de R$ 32,40. Quanto ele recebeu de troco?',
      opcoes: ['R$ 17,60', 'R$ 18,60', 'R$ 17,40', 'R$ 12,60'],
      correta: 'R$ 17,60',
      explicacaoCorreta: 'Parabéns! 50,00 - 32,40 = 17,60.'
    },

    // --- FASE 3: MULTIPLICAÇÃO (Área e Grupos) ---
    {
      id: 'mat-f3-1',
      fase: 3,
      tipo: 'conectar-pares',
      pergunta: 'Ligue cada multiplicação ao seu resultado correto!',
      pares: [ 
        {id: '12x5', display: '12 x 5'}, 
        {id: '15x4', display: '15 x 3'}, 
        {id: '25x3', display: '25 x 3'} 
      ],
      alvos: [ 
        {id: 'res60b', display: '45'}, 
        {id: 'res60a', display: '60'}, 
        {id: 'res75', display: '75'} 
      ],
      correta: { 
        '12x5': 'res60a', 
        '15x4': 'res60b', 
        '25x3': 'res75' 
      },
      explicacaoCorreta: 'Muito bem! Você dominou a tabuada básica.'
    },
    {
      id: 'mat-f3-2',
      fase: 3,
      tipo: 'multipla-escolha',
      pergunta: 'Um terreno retangular tem 25 metros de comprimento e 15 metros de largura. Qual a área total?',
      opcoes: ['375 m²', '350 m²', '400 m²', '325 m²'],
      correta: '375 m²',
      explicacaoCorreta: 'Correto! 25 x 15 = 375 metros quadrados.'
    },
    {
      id: 'mat-f3-3',
      fase: 3,
      tipo: 'multipla-escolha',
      pergunta: 'Uma fábrica produz 125 brinquedos por dia. Quantos serão produzidos em 12 dias?',
      opcoes: [1500, 1250, 1450, 1550],
      correta: 1500,
      explicacaoCorreta: 'Isso! 125 x 12 = 1.500 brinquedos.'
    },

    // --- FASE 4: DIVISÃO (Repartição e Médias) ---
    {
      id: 'mat-f4-1',
      fase: 4,
      tipo: 'completar-equacao',
      pergunta: 'Temos 450 livros para dividir igualmente em 15 prateleiras. Quantos livros por prateleira?',
      partes: ['450', '÷', '15', '=', '?'],
      opcoes: [30, 25, 35, 40],
      correta: 30,
      explicacaoCorreta: 'Perfeito! 450 dividido por 15 é igual a 30 livros por prateleira.',
      explicacaoErrada: 'Pense na conta inversa: 15 vezes quanto dá 450? A resposta é 30.'
    },
    {
      id: 'mat-f4-2',
      fase: 4,
      tipo: 'multipla-escolha',
      pergunta: 'Um carro percorreu 240 km em 3 horas. Qual foi a velocidade média por hora?',
      opcoes: ['80 km/h', '70 km/h', '90 km/h', '60 km/h'],
      correta: '80 km/h',
      explicacaoCorreta: 'Exato! 240 ÷ 3 = 80.'
    },
    {
      id: 'mat-f4-3',
      fase: 4,
      tipo: 'multipla-escolha',
      pergunta: 'Uma compra de R$ 1.200,00 foi parcelada em 10 vezes sem juros. Qual o valor de cada parcela?',
      opcoes: ['R$ 120,00', 'R$ 100,00', 'R$ 12,00', 'R$ 200,00'],
      correta: 'R$ 120,00',
      explicacaoCorreta: 'Correto! Basta cortar um zero: 1200 ÷ 10 = 120.'
    }
  ],

  portugues: [
    // --- FASE 1: CLASSES GRAMATICAIS ---
    {
      id: 'pt-f1-1',
      fase: 1,
      tipo: 'conectar-pares',
      pergunta: 'Cada palavra tem sua função! Ligue a palavra à sua classe gramatical correta:',
      pares: [
        { id: 'correr', display: '🏃 Correr' },
        { id: 'feliz', display: '😊 Feliz' },
        { id: 'cachorro', display: '🐶 Cachorro' }
      ],
      alvos: [
        { id: 'adjetivo', display: 'Adjetivo (Qualidade)' },
        { id: 'substantivo', display: 'Substantivo (Nome)' },
        { id: 'verbo', display: 'Verbo (Ação)' }
      ],
      correta: {
        'correr': 'verbo',
        'feliz': 'adjetivo',
        'cachorro': 'substantivo'
      },
      explicacaoCorreta: 'Fantástico! O cachorro (substantivo) ficou feliz (adjetivo) ao correr (verbo)!',
      explicacaoErrada: 'Quase lá! Lembre-se: Verbos são ações, adjetivos dão qualidades e substantivos são os nomes das coisas.'
    },
    {
      id: 'pt-f1-2',
      fase: 1,
      tipo: 'multipla-escolha',
      pergunta: 'Leia a frase: "O pequeno pássaro cantou." Qual palavra é o ADJETIVO?',
      opcoes: ['O', 'pequeno', 'pássaro', 'cantou'],
      correta: 'pequeno',
      explicacaoCorreta: 'Isso! "Pequeno" é a característica do pássaro.',
      explicacaoErrada: 'A resposta é "pequeno", pois é a palavra que descreve como o pássaro é.'
    },
    {
      id: 'pt-f1-3',
      fase: 1,
      tipo: 'multipla-escolha',
      pergunta: 'Em qual das frases abaixo a palavra sublinhada é um VERBO?',
      opcoes: ['A _chuva_ caiu forte.', 'Nós vamos _viajar_ amanhã.', 'O _menino_ está triste.', '_Que_ dia lindo!'],
      correta: 'Nós vamos _viajar_ amanhã.',
      explicacaoCorreta: 'Exato! "Viajar" indica uma ação.',
      explicacaoErrada: 'A resposta é "viajar", pois verbos indicam ações, estados ou fenômenos da natureza.'
    },

    // --- FASE 2: ORTOGRAFIA ---
    {
      id: 'pt-f2-1',
      fase: 2,
      tipo: 'completar-equacao',
      pergunta: 'Lumi quer escrever um bilhete, mas esqueceu a regra! Complete a palavra:',
      partes: ['Aquele pa', '?', 'arinho voou para longe.'],
      opcoes: ['s', 'ss', 'ç', 'c'],
      correta: 'ss',
      explicacaoCorreta: 'Muito bem! "Passarinho" se escreve com SS porque o som de S está entre duas vogais!',
      explicacaoErrada: 'Atenção! Entre duas vogais com som forte de S, usamos SS. A resposta é "ss".'
    },
    {
      id: 'pt-f2-2',
      fase: 2,
      tipo: 'multipla-escolha',
      pergunta: 'Qual é a regra de ouro da ortografia para a letra M?',
      opcoes: ['Usamos M antes de qualquer consoante.', 'Usamos M apenas no final das palavras.', 'Usamos M antes de P e B.', 'Usamos N antes de P e B.'],
      correta: 'Usamos M antes de P e B.',
      explicacaoCorreta: 'Perfeito! É a regra básica: antes de P e B, só o M pode aparecer.',
      explicacaoErrada: 'A regra correta é: usamos a letra M sempre antes das consoantes P e B.'
    },
    {
      id: 'pt-f2-3',
      fase: 2,
      tipo: 'multipla-escolha',
      pergunta: 'Qual das palavras abaixo está escrita de forma INCORRETA?',
      opcoes: ['Exceção', 'Piscina', 'Crescer', 'Excada'],
      correta: 'Excada',
      explicacaoCorreta: 'Você tem um olho de águia! O correto é "Escada", com S.',
      explicacaoErrada: 'A palavra errada é "Excada". O jeito certo de escrever é "Escada".'
    },

    // --- FASE 3: SINÔNIMOS E ANTÔNIMOS ---
    {
      id: 'pt-f3-1',
      fase: 3,
      tipo: 'conectar-pares',
      pergunta: 'Vamos ligar os OPOSTOS (Antônimos)!',
      pares: [
        { id: 'inicio', display: 'Início' },
        { id: 'corajoso', display: 'Corajoso' },
        { id: 'rapido', display: 'Rápido' }
      ],
      alvos: [
        { id: 'lento', display: 'Lento' },
        { id: 'fim', display: 'Fim' },
        { id: 'medroso', display: 'Medroso' }
      ],
      correta: {
        'inicio': 'fim',
        'corajoso': 'medroso',
        'rapido': 'lento'
      },
      explicacaoCorreta: 'Incrível! Você ligou todos os antônimos perfeitamente.'
    },
    {
      id: 'pt-f3-2',
      fase: 3,
      tipo: 'multipla-escolha',
      pergunta: 'O Lumi estava muito "Alegre" com o jogo. Qual palavra é um SINÔNIMO de Alegre?',
      opcoes: ['Triste', 'Cansado', 'Contente', 'Zangado'],
      correta: 'Contente',
      explicacaoCorreta: 'Isso! Sinônimos são palavras com o mesmo significado.',
      explicacaoErrada: 'A resposta é "Contente". Sinônimos são palavras diferentes que significam a mesma coisa.'
    },
    {
      id: 'pt-f3-3',
      fase: 3,
      tipo: 'multipla-escolha',
      pergunta: 'Se algo é "Impossível", qual o seu ANTÔNIMO?',
      opcoes: ['Difícil', 'Complicado', 'Possível', 'Estranho'],
      correta: 'Possível',
      explicacaoCorreta: 'Exato! O prefixo "im-" indica negação, tirando ele, temos o antônimo: Possível.',
      explicacaoErrada: 'O antônimo (oposto) de Impossível é Possível.'
    },

    // --- FASE 4: COESÃO E CONECTIVOS ---
    {
      id: 'pt-f4-1',
      fase: 4,
      tipo: 'completar-equacao',
      pergunta: 'Complete a frase com a palavra que melhor conecta as ideias:',
      partes: ['Estudamos muito para a prova, ', '?', ' tiramos uma nota ótima!'],
      opcoes: ['por isso', 'mas', 'porém', 'ou'],
      correta: 'por isso',
      explicacaoCorreta: 'Excelente! A palavra "por isso" indica a consequência de ter estudado muito.',
      explicacaoErrada: 'A resposta correta é "por isso", pois mostra o resultado (consequência) de estudar muito.'
    },
    {
      id: 'pt-f4-2',
      fase: 4,
      tipo: 'multipla-escolha',
      pergunta: 'Na frase: "A menina pegou a mochila, pois ELA ia para a escola." A palavra ELA se refere a quem?',
      opcoes: ['A mochila', 'A escola', 'A menina', 'A professora'],
      correta: 'A menina',
      explicacaoCorreta: 'Correto! O pronome "Ela" substitui "A menina" para não repetir a palavra.',
      explicacaoErrada: 'O pronome "Ela" está substituindo "A menina" na frase.'
    },
    {
      id: 'pt-f4-3',
      fase: 4,
      tipo: 'multipla-escolha',
      pergunta: 'A conjunção "MAS" (sem o I) indica o quê?',
      opcoes: ['Quantidade', 'Oposição / Contrário', 'Adição', 'Tempo'],
      correta: 'Oposição / Contrário',
      explicacaoCorreta: 'Muito bem! Exemplo: "Correu muito, MAS chegou atrasado."',
      explicacaoErrada: 'A palavra "mas" indica uma ideia de oposição ou contrário (ex: queria brincar, mas choveu).'
    }
  ]
};