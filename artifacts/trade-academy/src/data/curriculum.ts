export type Difficulty = "iniciante" | "intermediario" | "avancado";

export type LessonContent =
  | { type: "text"; title: string; body: string }
  | { type: "tip"; body: string }
  | { type: "example"; title: string; body: string };

export interface MarkChartCandle {
  o: number;
  h: number;
  l: number;
  c: number;
}

export type Question =
  | {
      type: "multiple";
      prompt: string;
      options: string[];
      correctIndex: number;
      explanation: string;
    }
  | {
      type: "truefalse";
      prompt: string;
      correct: boolean;
      explanation: string;
    }
  | {
      type: "markChart";
      prompt: string;
      /** Candles a serem desenhados (índice = posição no eixo X). */
      candles: MarkChartCandle[];
      /** Níveis-alvo de suporte (preço). */
      supports: number[];
      /** Níveis-alvo de resistência (preço). */
      resistances: number[];
      /** Tolerância em % (do range de preço) para considerar a marcação correta. Ex: 1.5 */
      tolerancePct: number;
      explanation: string;
    };

export interface Lesson {
  id: string;
  title: string;
  summary: string;
  xp: number;
  content: LessonContent[];
  questions: Question[];
}

export interface LevelDef {
  id: number;
  title: string;
  subtitle: string;
  difficulty: Difficulty;
  lessons: Lesson[];
}

export const LEVELS: LevelDef[] = [
  {
    id: 1,
    title: "Conceitos Básicos",
    subtitle: "O que é trading e como o mercado funciona",
    difficulty: "iniciante",
    lessons: [
      {
        id: "1-1",
        title: "O que é trading?",
        summary: "Entenda a ideia central por trás de comprar e vender ativos.",
        xp: 20,
        content: [
          {
            type: "text",
            title: "Definição simples",
            body: "Trading é o ato de comprar e vender ativos financeiros (como ações, moedas ou criptomoedas) com o objetivo de obter lucro a partir das variações de preço. Diferente do investimento de longo prazo, o trader busca aproveitar movimentos de curto e médio prazo.",
          },
          {
            type: "example",
            title: "Exemplo prático",
            body: "Você compra 1 BTC por $30.000. Algumas semanas depois, vende por $33.000. Seu lucro é de $3.000. Isso é trading.",
          },
          {
            type: "tip",
            body: "Trading exige estudo e disciplina. Não é loteria — é uma habilidade que se desenvolve com prática.",
          },
        ],
        questions: [
          {
            type: "multiple",
            prompt: "Qual é o principal objetivo de um trader?",
            options: [
              "Guardar dinheiro por décadas sem mexer",
              "Lucrar com a variação de preço dos ativos",
              "Doar capital para empresas",
              "Pagar impostos antecipadamente",
            ],
            correctIndex: 1,
            explanation: "O trader busca lucrar com movimentos de preço, geralmente em prazos mais curtos que o investidor tradicional.",
          },
          {
            type: "truefalse",
            prompt: "Trading é igual a investimento de longo prazo.",
            correct: false,
            explanation: "Trading foca em movimentos de curto/médio prazo; investimento de longo prazo busca crescimento ao longo de anos.",
          },
        ],
      },
      {
        id: "1-2",
        title: "O que é mercado financeiro?",
        summary: "Onde compradores e vendedores se encontram.",
        xp: 20,
        content: [
          {
            type: "text",
            title: "Mercado financeiro",
            body: "É o ambiente (físico ou digital) onde ativos são negociados. Inclui bolsas de valores, mercado de câmbio (Forex), corretoras de cripto e muito mais. O preço se forma pelo encontro entre oferta e demanda.",
          },
          {
            type: "example",
            title: "Oferta e demanda",
            body: "Se muita gente quer comprar Bitcoin e poucos querem vender, o preço sobe. Se muitos querem vender e poucos comprar, o preço cai.",
          },
        ],
        questions: [
          {
            type: "multiple",
            prompt: "O que faz o preço de um ativo subir?",
            options: [
              "Mais vendedores que compradores",
              "Mais compradores que vendedores",
              "O governo decide",
              "A corretora aumenta",
            ],
            correctIndex: 1,
            explanation: "Quando a demanda supera a oferta, o preço tende a subir.",
          },
        ],
      },
    ],
  },
  {
    id: 2,
    title: "Tipos de Mercado",
    subtitle: "Forex, ações e criptomoedas",
    difficulty: "iniciante",
    lessons: [
      {
        id: "2-1",
        title: "Forex, ações e cripto",
        summary: "Conheça os três principais mercados.",
        xp: 25,
        content: [
          {
            type: "text",
            title: "Forex",
            body: "Mercado de câmbio onde se negociam pares de moedas (ex: EUR/USD). É o maior mercado do mundo, opera 24h em dias úteis.",
          },
          {
            type: "text",
            title: "Ações",
            body: "Pequenas frações da propriedade de uma empresa. Negociadas em bolsas como B3 (Brasil) ou NYSE (EUA).",
          },
          {
            type: "text",
            title: "Criptomoedas",
            body: "Ativos digitais como BTC e ETH. Operam 24/7, são bastante voláteis e descentralizados.",
          },
        ],
        questions: [
          {
            type: "multiple",
            prompt: "Qual mercado opera 24/7, inclusive aos finais de semana?",
            options: ["Forex", "Ações brasileiras", "Criptomoedas", "Renda fixa"],
            correctIndex: 2,
            explanation: "Cripto é negociada o tempo todo, incluindo fins de semana e feriados.",
          },
          {
            type: "truefalse",
            prompt: "EUR/USD é um par de moedas do Forex.",
            correct: true,
            explanation: "Sim, representa quantos dólares valem 1 euro.",
          },
        ],
      },
    ],
  },
  {
    id: 3,
    title: "Leitura de Gráficos",
    subtitle: "Candlesticks e timeframes",
    difficulty: "iniciante",
    lessons: [
      {
        id: "3-1",
        title: "Anatomia do candlestick",
        summary: "Cada vela conta uma história.",
        xp: 30,
        content: [
          {
            type: "text",
            title: "O que é uma vela",
            body: "Cada candlestick (vela) representa o movimento de preço em um período. Contém 4 informações: abertura, fechamento, máxima e mínima.",
          },
          {
            type: "text",
            title: "Cores",
            body: "Vela verde: o fechamento foi maior que a abertura (alta). Vela vermelha: o fechamento foi menor que a abertura (baixa).",
          },
          {
            type: "tip",
            body: "O 'corpo' da vela é a área entre abertura e fechamento. As 'sombras' (pavios) mostram máxima e mínima do período.",
          },
        ],
        questions: [
          {
            type: "multiple",
            prompt: "Uma vela verde indica que:",
            options: [
              "O preço caiu no período",
              "O preço subiu no período (fechou acima da abertura)",
              "Ninguém negociou",
              "Houve pausa no mercado",
            ],
            correctIndex: 1,
            explanation: "Verde = fechamento acima da abertura, ou seja, alta no período.",
          },
          {
            type: "truefalse",
            prompt: "As sombras da vela mostram a máxima e a mínima do período.",
            correct: true,
            explanation: "Exato — o corpo mostra abertura/fechamento; as sombras mostram extremos.",
          },
        ],
      },
    ],
  },
  {
    id: 4,
    title: "Suporte e Resistência",
    subtitle: "Os níveis que o mercado respeita",
    difficulty: "intermediario",
    lessons: [
      {
        id: "4-1",
        title: "Identificando suporte e resistência",
        summary: "Onde o preço tende a parar e reverter.",
        xp: 35,
        content: [
          {
            type: "text",
            title: "Suporte",
            body: "Nível de preço onde a demanda costuma aparecer e impedir quedas adicionais. É como um 'piso' temporário.",
          },
          {
            type: "text",
            title: "Resistência",
            body: "Nível onde a oferta aparece e impede que o preço suba mais. É como um 'teto' temporário.",
          },
          {
            type: "tip",
            body: "Quanto mais vezes um nível é testado e respeitado, mais forte ele se torna — até ser rompido.",
          },
        ],
        questions: [
          {
            type: "multiple",
            prompt: "Suporte é:",
            options: [
              "Um nível onde o preço tende a parar de cair",
              "Uma corretora",
              "Um indicador técnico",
              "Um tipo de ordem",
            ],
            correctIndex: 0,
            explanation: "Suporte = piso. Resistência = teto.",
          },
          {
            type: "markChart",
            prompt: "Marque o suporte e a resistência principais deste gráfico arrastando as linhas até os níveis testados várias vezes.",
            candles: [
              {"o":120,"h":120.38,"l":117.83,"c":118},{"o":118,"h":118.18,"l":113.61,"c":114},{"o":114,"h":114.46,"l":109.39,"c":110},{"o":110,"h":110.68,"l":105.58,"c":106},{"o":106,"h":106.29,"l":103.53,"c":104.2},{"o":104.2,"h":105.66,"l":103.6,"c":105},{"o":105,"h":108.53,"l":104.79,"c":108},{"o":108,"h":112.17,"l":107.41,"c":112},{"o":112,"h":116.52,"l":111.37,"c":116},{"o":116,"h":120.24,"l":115.79,"c":120},{"o":120,"h":124.53,"l":119.39,"c":124},{"o":124,"h":126.4,"l":123.45,"c":125.8},{"o":125.8,"h":125.98,"l":123.42,"c":124},{"o":124,"h":124.52,"l":120.63,"c":121},{"o":121,"h":121.12,"l":117.42,"c":118},{"o":118,"h":118.2,"l":113.33,"c":114},{"o":114,"h":114.64,"l":109.84,"c":110},{"o":110,"h":110.63,"l":105.51,"c":106},{"o":106,"h":106.34,"l":104.29,"c":104.5},{"o":104.5,"h":107.17,"l":104.32,"c":107},{"o":107,"h":111.16,"l":106.56,"c":111},{"o":111,"h":115.51,"l":110.53,"c":115},{"o":115,"h":119.64,"l":114.53,"c":119},{"o":119,"h":122.64,"l":118.58,"c":122},{"o":122,"h":125.84,"l":121.7,"c":125.5},{"o":125.5,"h":125.87,"l":122.9,"c":123},{"o":123,"h":123.62,"l":118.41,"c":119},{"o":119,"h":119.24,"l":114.44,"c":115},{"o":115,"h":115.2,"l":110.52,"c":111},{"o":111,"h":111.22,"l":106.62,"c":107},{"o":107,"h":107.66,"l":103.78,"c":104.3},{"o":104.3,"h":108.69,"l":103.75,"c":108},{"o":108,"h":113.69,"l":107.63,"c":113},{"o":113,"h":118.37,"l":112.86,"c":118},{"o":118,"h":122.4,"l":117.77,"c":122},{"o":122,"h":126.01,"l":121.88,"c":125.9},{"o":125.9,"h":126.02,"l":123.72,"c":124},{"o":124,"h":124.6,"l":119.39,"c":120},{"o":120,"h":120.15,"l":115.39,"c":116},{"o":116,"h":116.3,"l":112.35,"c":113},{"o":113,"h":116.62,"l":112.54,"c":116},{"o":116,"h":120.11,"l":115.71,"c":120},{"o":120,"h":124.63,"l":119.76,"c":124},{"o":124,"h":126.2,"l":123.53,"c":125.7},{"o":125.7,"h":125.93,"l":122.7,"c":123},{"o":123,"h":123.59,"l":117.48,"c":118},{"o":118,"h":118.13,"l":113.82,"c":114},{"o":114,"h":114.19,"l":109.35,"c":110},{"o":110,"h":110.32,"l":105.54,"c":106},{"o":106,"h":106.18,"l":104.22,"c":104.4},{"o":104.4,"h":108.65,"l":103.82,"c":108},{"o":108,"h":114.41,"l":107.34,"c":114},{"o":114,"h":119.43,"l":113.74,"c":119},{"o":119,"h":123.34,"l":118.62,"c":123},{"o":123,"h":125.75,"l":122.42,"c":125.6},{"o":125.6,"h":126.06,"l":121.63,"c":122},{"o":122,"h":122.23,"l":117.52,"c":118},{"o":118,"h":118.4,"l":112.41,"c":113},{"o":113,"h":113.67,"l":107.35,"c":108}
            ],
            supports: [104],
            resistances: [126],
            tolerancePct: 4,
            explanation: "O preço tocou repetidamente a região de 104 (suporte) e 126 (resistência), revertendo em ambas. Quanto mais toques sem rompimento, mais forte o nível.",
          },
        ],
      },
    ],
  },
  {
    id: 5,
    title: "Tendências",
    subtitle: "Alta, baixa e lateralização",
    difficulty: "intermediario",
    lessons: [
      {
        id: "5-1",
        title: "Identificando tendências",
        summary: "Topos e fundos contam o sentido do mercado.",
        xp: 35,
        content: [
          {
            type: "text",
            title: "Tendência de alta",
            body: "Topos e fundos cada vez mais altos. O mercado faz correções, mas continua subindo.",
          },
          {
            type: "text",
            title: "Tendência de baixa",
            body: "Topos e fundos cada vez mais baixos. O mercado faz repiques, mas continua caindo.",
          },
          {
            type: "text",
            title: "Lateralização",
            body: "Preço oscilando dentro de uma faixa, sem direção clara. Também chamado de 'range'.",
          },
        ],
        questions: [
          {
            type: "multiple",
            prompt: "Tendência de alta é caracterizada por:",
            options: [
              "Topos e fundos descendentes",
              "Topos e fundos ascendentes",
              "Preço sempre constante",
              "Volume zero",
            ],
            correctIndex: 1,
            explanation: "Topos e fundos cada vez mais altos = alta confirmada.",
          },
        ],
      },
    ],
  },
  {
    id: 6,
    title: "Indicadores Técnicos",
    subtitle: "Médias móveis, RSI e MACD",
    difficulty: "intermediario",
    lessons: [
      {
        id: "6-1",
        title: "Médias móveis e RSI",
        summary: "Ferramentas clássicas de análise técnica.",
        xp: 40,
        content: [
          {
            type: "text",
            title: "Média Móvel",
            body: "Média do preço dos últimos N períodos. Suaviza ruído e ajuda a identificar a tendência. Ex: MM20 = média dos últimos 20 candles.",
          },
          {
            type: "text",
            title: "RSI (Índice de Força Relativa)",
            body: "Oscila entre 0 e 100. Acima de 70 sugere sobrecompra; abaixo de 30 sugere sobrevenda. Não é sinal automático de compra/venda — é um aviso.",
          },
        ],
        questions: [
          {
            type: "multiple",
            prompt: "RSI acima de 70 indica:",
            options: ["Sobrevenda", "Sobrecompra", "Falha técnica", "Nada"],
            correctIndex: 1,
            explanation: "RSI > 70 = ativo possivelmente sobrecomprado. RSI < 30 = sobrevendido.",
          },
        ],
      },
    ],
  },
  {
    id: 7,
    title: "Gestão de Risco",
    subtitle: "A habilidade que separa traders de apostadores",
    difficulty: "avancado",
    lessons: [
      {
        id: "7-1",
        title: "Stop Loss e tamanho de posição",
        summary: "Nunca arrisque mais do que pode perder.",
        xp: 45,
        content: [
          {
            type: "text",
            title: "Stop Loss",
            body: "Ordem automática que fecha sua operação se o preço atingir um nível pré-definido de perda. É inegociável: todo trade precisa de stop.",
          },
          {
            type: "text",
            title: "Regra dos 1-2%",
            body: "Não arrisque mais que 1-2% do seu capital por operação. Se você tem $10.000, sua perda máxima por trade deve ser $100-$200.",
          },
          {
            type: "tip",
            body: "Sobreviver é mais importante que acertar. Quem perde tudo, sai do jogo.",
          },
        ],
        questions: [
          {
            type: "multiple",
            prompt: "Quanto do seu capital se recomenda arriscar por operação?",
            options: ["50%", "20%", "1-2%", "100%"],
            correctIndex: 2,
            explanation: "A regra clássica é arriscar apenas 1-2% por trade — preserva o capital em sequências negativas.",
          },
          {
            type: "truefalse",
            prompt: "Operar sem stop loss é uma boa estratégia para iniciantes.",
            correct: false,
            explanation: "Operar sem stop é a forma mais rápida de zerar a conta. Sempre use stop.",
          },
        ],
      },
    ],
  },
  {
    id: 8,
    title: "Estratégias Reais",
    subtitle: "Combinando tudo o que aprendeu",
    difficulty: "avancado",
    lessons: [
      {
        id: "8-1",
        title: "Pullback em tendência",
        summary: "Uma das estratégias mais simples e robustas.",
        xp: 50,
        content: [
          {
            type: "text",
            title: "A ideia",
            body: "Em uma tendência de alta clara, espere o preço fazer uma correção (pullback) até um suporte ou média móvel. Quando aparecer sinal de reversão (vela de força), entre comprado.",
          },
          {
            type: "text",
            title: "Stop e alvo",
            body: "Stop logo abaixo do fundo do pullback. Alvo: próxima resistência ou múltiplo do risco (ex: 2:1 ou 3:1 risco-retorno).",
          },
        ],
        questions: [
          {
            type: "multiple",
            prompt: "Em uma estratégia de pullback de alta, o melhor momento para comprar é:",
            options: [
              "No topo, quando todos compram",
              "Após uma correção, próximo a um suporte",
              "Quando a tendência muda para baixa",
              "Aleatoriamente",
            ],
            correctIndex: 1,
            explanation: "Comprar no pullback oferece risco menor e relação risco-retorno melhor.",
          },
        ],
      },
    ],
  },
];

export const TOTAL_LESSONS = LEVELS.reduce((acc, l) => acc + l.lessons.length, 0);
