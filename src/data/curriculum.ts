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
