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
      candles: MarkChartCandle[];
      supports: number[];
      resistances: number[];
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
  audioUrl?: string | null;
  audioEnabled?: boolean;
}

export interface LevelDef {
  id: number;
  title: string;
  subtitle: string;
  difficulty: Difficulty;
  lessons: Lesson[];
}

export const LEVELS: LevelDef[] = [
  /* =========================================================
     NÍVEL 1 — CONCEITOS BÁSICOS
  ========================================================= */
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
      {
        id: "1-3",
        title: "Participantes do mercado",
        summary: "Quem são os grandes players e como eles influenciam os preços.",
        xp: 25,
        content: [
          {
            type: "text",
            title: "Os principais participantes",
            body: "O mercado é composto por diferentes tipos de participantes, cada um com objetivos distintos: bancos centrais, bancos comerciais, fundos de investimento, empresas (hedgers), traders de varejo (como você) e market makers.",
          },
          {
            type: "text",
            title: "Bancos e fundos institucionais",
            body: "Os grandes bancos e fundos movimentam volumes enormes — bilhões de dólares por dia. Eles são chamados de 'smart money' (dinheiro inteligente). Quando compram ou vendem, criam movimentos significativos no mercado.",
          },
          {
            type: "text",
            title: "Market Makers",
            body: "São entidades que garantem liquidez colocando ordens de compra e venda simultaneamente. Ganham na diferença entre o preço de compra (bid) e venda (ask) — chamada de spread.",
          },
          {
            type: "tip",
            body: "Como trader de varejo, você está do lado mais fraco. Por isso, seguir a tendência (não lutar contra ela) é geralmente mais seguro.",
          },
        ],
        questions: [
          {
            type: "multiple",
            prompt: "O que é 'spread' em trading?",
            options: [
              "O lucro total de uma operação",
              "A diferença entre o preço de compra (bid) e venda (ask)",
              "O valor de uma alavancagem",
              "O tamanho de um lote padrão",
            ],
            correctIndex: 1,
            explanation: "O spread é a diferença entre bid e ask — é o custo implícito de operar. Market makers ganham nessa diferença.",
          },
          {
            type: "truefalse",
            prompt: "Os bancos e fundos institucionais têm pouca influência no mercado.",
            correct: false,
            explanation: "Pelo contrário — instituições movimentam volumes massivos e são os principais formadores de tendência.",
          },
        ],
      },
      {
        id: "1-4",
        title: "Como funciona uma corretora",
        summary: "A infraestrutura por trás de cada operação que você faz.",
        xp: 25,
        content: [
          {
            type: "text",
            title: "O papel da corretora",
            body: "A corretora é a intermediária entre você e o mercado. Ela executa suas ordens, custodia seu capital e fornece a plataforma de trading. Em troca, cobra spreads, comissões ou taxas de overnight (swap).",
          },
          {
            type: "text",
            title: "Tipos de ordens",
            body: "Ordem a mercado: executada imediatamente ao preço atual. Ordem limitada (limit): só executa no preço que você definir ou melhor. Ordem stop: ativa quando o preço atinge um nível específico.",
          },
          {
            type: "example",
            title: "Exemplo de ordem limitada",
            body: "BTC está a $40.000. Você coloca uma ordem de compra limitada a $38.500. Sua ordem só é preenchida se o preço cair até $38.500 — não antes.",
          },
          {
            type: "tip",
            body: "Escolha corretoras regulamentadas por órgãos reconhecidos (FCA, ASIC, CVM no Brasil). Regulamentação protege seu capital.",
          },
        ],
        questions: [
          {
            type: "multiple",
            prompt: "Uma ordem limitada de compra a $100 será executada quando:",
            options: [
              "O preço subir até $110",
              "O preço cair até $100 ou abaixo",
              "A corretora decidir",
              "O mercado fechar",
            ],
            correctIndex: 1,
            explanation: "Ordens limitadas de compra só executam ao preço definido ou a um preço melhor (mais baixo).",
          },
          {
            type: "truefalse",
            prompt: "Ordens a mercado garantem exatamente o preço que você vê na tela.",
            correct: false,
            explanation: "Ordens a mercado executam ao melhor preço disponível naquele momento, que pode ser ligeiramente diferente do preço exibido (slippage).",
          },
        ],
      },
    ],
  },

  /* =========================================================
     NÍVEL 2 — TIPOS DE MERCADO
  ========================================================= */
  {
    id: 2,
    title: "Tipos de Mercado",
    subtitle: "Forex, ações, cripto, futuros e muito mais",
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
            body: "Mercado de câmbio onde se negociam pares de moedas (ex: EUR/USD). É o maior mercado do mundo, com volume diário de mais de $7 trilhões. Opera 24h em dias úteis.",
          },
          {
            type: "text",
            title: "Ações",
            body: "Pequenas frações da propriedade de uma empresa. Negociadas em bolsas como B3 (Brasil) ou NYSE (EUA). Pagam dividendos e valorizam conforme a empresa cresce.",
          },
          {
            type: "text",
            title: "Criptomoedas",
            body: "Ativos digitais como BTC e ETH. Operam 24/7, são bastante voláteis e descentralizados. Sem regulação central, com mercado acessível globalmente.",
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
      {
        id: "2-2",
        title: "Futuros e derivativos",
        summary: "Contratos que permitem lucrar com preços futuros.",
        xp: 30,
        content: [
          {
            type: "text",
            title: "O que são derivativos?",
            body: "Derivativos são contratos financeiros cujo valor deriva de outro ativo (ação, commoditie, moeda, índice). Os principais são: contratos futuros, opções e CFDs (Contratos por Diferença).",
          },
          {
            type: "text",
            title: "Contratos Futuros",
            body: "Um acordo para comprar ou vender um ativo a um preço definido hoje, mas com entrega futura. Ex: contrato futuro de petróleo (WTI) ou mini-índice (WIN) na B3. Muito usado por especuladores e hedgers.",
          },
          {
            type: "text",
            title: "CFDs — Contratos por Diferença",
            body: "Permitem especular sobre a variação de preço de um ativo sem possuí-lo. Você troca a diferença entre o preço de entrada e saída. São populares em Forex e cripto por permitirem alavancagem.",
          },
          {
            type: "tip",
            body: "CFDs com alavancagem amplificam tanto os lucros quanto as perdas. Use com cautela e sempre com stop loss.",
          },
        ],
        questions: [
          {
            type: "multiple",
            prompt: "O que é um CFD?",
            options: [
              "Uma ação de empresa",
              "Um contrato que troca a diferença de preço de um ativo",
              "Uma criptomoeda descentralizada",
              "Uma conta de poupança",
            ],
            correctIndex: 1,
            explanation: "CFD (Contract for Difference) permite especular sobre variações de preço sem possuir o ativo subjacente.",
          },
          {
            type: "truefalse",
            prompt: "Contratos futuros obrigam as partes a um acordo em data futura.",
            correct: true,
            explanation: "Futuros são contratos padronizados que obrigam compra/venda de um ativo a preço e data definidos.",
          },
        ],
      },
      {
        id: "2-3",
        title: "Sessões de mercado e horários",
        summary: "Quando o mercado está mais ativo e por quê isso importa.",
        xp: 25,
        content: [
          {
            type: "text",
            title: "As quatro sessões principais",
            body: "O mercado Forex opera em 4 grandes sessões: Tóquio (23h–8h BRT), Londres (5h–14h BRT), Nova York (9h–18h BRT) e Sydney (19h–4h BRT). O horário de maior volume é a sobreposição Londres + Nova York (9h–14h BRT).",
          },
          {
            type: "text",
            title: "Por que os horários importam?",
            body: "Maior volume = maior liquidez = spreads menores e menos manipulação. Nos horários de menor volume (como madrugada BRT), os movimentos são mais imprevisíveis e os spreads aumentam.",
          },
          {
            type: "example",
            title: "Sessão de Londres + Nova York",
            body: "Das 9h às 14h BRT, Londres e Nova York estão abertas ao mesmo tempo. Este é o período com mais volume do dia — ideal para scalping e day trading no Forex.",
          },
          {
            type: "tip",
            body: "Para cripto, não há sessões fixas — mas o volume ainda tende a ser maior durante o horário da sessão americana.",
          },
        ],
        questions: [
          {
            type: "multiple",
            prompt: "Qual sobreposição de sessões tem o maior volume no Forex?",
            options: [
              "Tóquio + Sydney",
              "Londres + Tóquio",
              "Londres + Nova York",
              "Nova York + Sydney",
            ],
            correctIndex: 2,
            explanation: "A sobreposição Londres + Nova York (9h–14h BRT) concentra o maior volume diário do Forex.",
          },
          {
            type: "truefalse",
            prompt: "Operar durante baixo volume é sempre mais seguro.",
            correct: false,
            explanation: "Baixo volume significa menor liquidez, spreads maiores e movimentos mais erráticos — geralmente mais arriscado.",
          },
        ],
      },
    ],
  },

  /* =========================================================
     NÍVEL 3 — LEITURA DE GRÁFICOS
  ========================================================= */
  {
    id: 3,
    title: "Leitura de Gráficos",
    subtitle: "Candlesticks, padrões e timeframes",
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
            body: "Cada candlestick (vela) representa o movimento de preço em um período. Contém 4 informações: abertura (open), fechamento (close), máxima (high) e mínima (low) — OHLC.",
          },
          {
            type: "text",
            title: "Cores",
            body: "Vela verde (alta): o fechamento foi maior que a abertura. Vela vermelha (baixa): o fechamento foi menor que a abertura.",
          },
          {
            type: "tip",
            body: "O 'corpo' é a área entre abertura e fechamento. As 'sombras' (pavios) mostram máxima e mínima do período.",
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
      {
        id: "3-2",
        title: "Padrões de candlestick",
        summary: "Como grupos de velas revelam intenção do mercado.",
        xp: 35,
        content: [
          {
            type: "text",
            title: "Padrões de reversão",
            body: "Doji: abertura e fechamento quase iguais (indecisão). Pin Bar (martelo): corpo pequeno no topo com sombra longa abaixo — sinal de reversão de alta. Engolfo de alta: vela verde grande 'engole' a vela vermelha anterior.",
          },
          {
            type: "text",
            title: "Padrões de continuação",
            body: "Marubozu: vela sem sombras, indica força direcional total. Doji dragonfly numa tendência de alta indica continuação. Spinning top (pião): indecisão, pode ser pausa antes de continuar.",
          },
          {
            type: "example",
            title: "Pin Bar de alta",
            body: "Imagine o preço caindo. Aparece uma vela com sombra muito longa abaixo e corpo pequeno no topo. Isso significa que os compradores rejeitaram os preços baixos com força — possível reversão de alta.",
          },
          {
            type: "tip",
            body: "Padrões isolados têm pouco valor. Combinados com suporte/resistência e tendência, tornam-se sinais de alta probabilidade.",
          },
        ],
        questions: [
          {
            type: "multiple",
            prompt: "O que é um Doji?",
            options: [
              "Vela com corpo grande e sem sombras",
              "Vela onde abertura e fechamento são quase iguais (indecisão)",
              "Vela que sempre indica queda",
              "Padrão de três velas verdes",
            ],
            correctIndex: 1,
            explanation: "O Doji indica equilíbrio entre compradores e vendedores — o mercado está indeciso.",
          },
          {
            type: "multiple",
            prompt: "O padrão 'Engolfo de alta' ocorre quando:",
            options: [
              "Uma vela vermelha envolve a vela verde anterior",
              "Uma vela verde envolve completamente a vela vermelha anterior",
              "Duas velas verdes aparecem seguidas",
              "O volume cai drasticamente",
            ],
            correctIndex: 1,
            explanation: "Engolfo de alta: vela verde que 'engloba' o corpo inteiro da vela vermelha anterior — sinal de reversão bullish.",
          },
        ],
      },
      {
        id: "3-3",
        title: "Timeframes — qual usar?",
        summary: "A escolha do timeframe define seu estilo de trading.",
        xp: 30,
        content: [
          {
            type: "text",
            title: "O que é timeframe?",
            body: "Timeframe é o período representado por cada vela. No gráfico de 1 hora (H1), cada vela mostra 1 hora de negociação. No diário (D1), cada vela = 1 dia inteiro.",
          },
          {
            type: "text",
            title: "Timeframes e estilos",
            body: "Scalping: M1, M5 — dezenas de operações por dia. Day trading: M15, H1 — abre e fecha operações no mesmo dia. Swing trading: H4, D1 — mantém posições por dias ou semanas. Position trading: W1, MN — meses a anos.",
          },
          {
            type: "text",
            title: "Análise top-down",
            body: "A técnica mais eficaz é começar pelo timeframe maior (ex: D1) para identificar a tendência principal, depois ir ao menor (ex: H1 ou M15) para encontrar a entrada. Nunca opere só no timeframe menor sem ver o contexto maior.",
          },
          {
            type: "tip",
            body: "Iniciantes devem começar com H1 ou H4. Timeframes muito baixos (M1, M5) amplificam o ruído e dificultam as decisões.",
          },
        ],
        questions: [
          {
            type: "multiple",
            prompt: "Qual estilo de trading mantém posições por dias ou semanas?",
            options: ["Scalping", "Day trading", "Swing trading", "Arbitragem"],
            correctIndex: 2,
            explanation: "Swing trading usa timeframes maiores (H4, D1) e mantém posições por dias ou semanas.",
          },
          {
            type: "truefalse",
            prompt: "A análise top-down começa pelo timeframe menor e vai para o maior.",
            correct: false,
            explanation: "Top-down começa pelo timeframe MAIOR (tendência principal) e afunila para o menor (entrada).",
          },
        ],
      },
      {
        id: "3-4",
        title: "Tipos de gráfico",
        summary: "Linha, barras, candlestick e Heikin Ashi — qual é o melhor?",
        xp: 25,
        content: [
          {
            type: "text",
            title: "Gráfico de linha",
            body: "Liga os preços de fechamento por uma linha. Simples, mas perde informação de máxima, mínima e abertura. Útil para visão geral de tendência.",
          },
          {
            type: "text",
            title: "Gráfico de barras (OHLC)",
            body: "Cada barra mostra abertura, máxima, mínima e fechamento. Mais informativo que a linha, mas visualmente mais difícil que o candlestick.",
          },
          {
            type: "text",
            title: "Heikin Ashi",
            body: "Variação do candlestick que usa médias. As velas ficam mais 'suaves', facilitando a visualização de tendências. Desvantagem: os preços não são os reais do mercado.",
          },
          {
            type: "tip",
            body: "A maioria dos traders profissionais usa candlestick padrão. Heikin Ashi é útil para identificar tendências, mas não para entradas precisas.",
          },
        ],
        questions: [
          {
            type: "multiple",
            prompt: "Qual tipo de gráfico mostra os 4 preços (abertura, máxima, mínima, fechamento) de forma mais visual?",
            options: ["Gráfico de linha", "Gráfico de barras OHLC", "Candlestick japonês", "Ponto e figura"],
            correctIndex: 2,
            explanation: "O candlestick é visualmente o mais intuitivo para analisar OHLC de cada período.",
          },
          {
            type: "truefalse",
            prompt: "O Heikin Ashi mostra os preços exatos do mercado.",
            correct: false,
            explanation: "O Heikin Ashi usa médias calculadas — os preços exibidos não são os preços reais negociados.",
          },
        ],
      },
    ],
  },

  /* =========================================================
     NÍVEL 4 — SUPORTE E RESISTÊNCIA
  ========================================================= */
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
              {"o":120,"h":120.38,"l":117.83,"c":118},{"o":118,"h":118.18,"l":113.61,"c":114},{"o":114,"h":114.46,"l":109.39,"c":110},{"o":110,"h":110.68,"l":105.58,"c":106},{"o":106,"h":106.29,"l":103.53,"c":104.2},{"o":104.2,"h":105.66,"l":103.6,"c":105},{"o":105,"h":108.53,"l":104.79,"c":108},{"o":108,"h":112.17,"l":107.41,"c":112},{"o":112,"h":116.52,"l":111.37,"c":116},{"o":116,"h":120.24,"l":115.79,"c":120},{"o":120,"h":124.53,"l":119.39,"c":124},{"o":124,"h":126.4,"l":123.45,"c":125.8},{"o":125.8,"h":125.98,"l":123.42,"c":124},{"o":124,"h":124.52,"l":120.63,"c":121},{"o":121,"h":121.12,"l":117.42,"c":118},{"o":118,"h":118.2,"l":113.33,"c":114},{"o":114,"h":114.64,"l":109.84,"c":110},{"o":110,"h":110.63,"l":105.51,"c":106},{"o":106,"h":106.34,"l":104.29,"c":104.5},{"o":104.5,"h":107.17,"l":104.32,"c":107},{"o":107,"h":111.16,"l":106.56,"c":111},{"o":111,"h":115.51,"l":110.53,"c":115},{"o":115,"h":119.64,"l":114.53,"c":119},{"o":119,"h":122.64,"l":118.58,"c":122},{"o":122,"h":125.84,"l":121.7,"c":125.5},{"o":125.5,"h":125.87,"l":122.9,"c":123},{"o":123,"h":123.62,"l":118.41,"c":119},{"o":119,"h":119.24,"l":114.44,"c":115},{"o":115,"h":115.2,"l":110.52,"c":111},{"o":111,"h":111.22,"l":106.62,"c":107},{"o":107,"h":107.66,"l":103.78,"c":104.3},{"o":104.3,"h":108.69,"l":103.75,"c":108},{"o":108,"h":113.69,"l":107.63,"c":113},{"o":113,"h":118.37,"l":112.86,"c":118},{"o":118,"h":122.4,"l":117.77,"c":122},{"o":122,"h":126.01,"l":121.88,"c":125.9},{"o":125.9,"h":126.02,"l":123.72,"c":124},{"o":124,"h":124.6,"l":119.39,"c":120},{"o":120,"h":120.15,"l":115.39,"c":116},{"o":116,"h":116.3,"l":112.35,"c":113},{"o":113,"h":116.62,"l":112.54,"c":116},{"o":116,"h":120.11,"l":115.71,"c":120},{"o":120,"h":124.63,"l":119.76,"c":124},{"o":124,"h":126.2,"l":123.53,"c":125.7},{"o":125.7,"h":125.93,"l":122.7,"c":123},{"o":123,"h":123.59,"l":117.48,"c":118},{"o":118,"h":118.13,"l":113.82,"c":114},{"o":114,"h":114.19,"l":109.35,"c":110},{"o":110,"h":110.32,"l":105.54,"c":106},{"o":106,"h":106.5,"l":103.8,"c":104}
            ],
            supports: [104],
            resistances: [126],
            tolerancePct: 4,
            explanation: "O preço tocou repetidamente a região de 104 (suporte) e 126 (resistência), revertendo em ambas. Quanto mais toques sem rompimento, mais forte o nível.",
          },
        ],
      },
      {
        id: "4-2",
        title: "Rompimentos e armadilhas",
        summary: "Quando o preço cruza um nível — e quando é uma falsa ruptura.",
        xp: 40,
        content: [
          {
            type: "text",
            title: "Rompimento verdadeiro (breakout)",
            body: "Ocorre quando o preço fecha além do nível de suporte ou resistência com volume elevado. Após o rompimento, o antigo nível inverte seu papel: resistência vira suporte, e suporte vira resistência.",
          },
          {
            type: "text",
            title: "Falso rompimento (fake-out / bull trap)",
            body: "O preço perfura o nível, mas volta rapidamente para dentro da faixa. Armadilhas são comuns em resistências de topo — o preço sobe ligeiramente acima, atrai compradores e depois despenca.",
          },
          {
            type: "example",
            title: "Como confirmar o rompimento",
            body: "Aguarde o fechamento da vela além do nível (não apenas a sombra). Observe se o volume aumentou no rompimento. Um reteste do nível após o rompimento é sinal de confirmação.",
          },
          {
            type: "tip",
            body: "Nunca entre imediatamente quando o preço 'toca' um nível — espere confirmação. Paciência elimina a maioria dos fake-outs.",
          },
        ],
        questions: [
          {
            type: "multiple",
            prompt: "Após um rompimento verdadeiro de resistência, o que acontece com esse nível?",
            options: [
              "Deixa de existir",
              "Vira um novo suporte",
              "O preço sempre volta para baixo dele",
              "Nada muda",
            ],
            correctIndex: 1,
            explanation: "Quando uma resistência é rompida, ela se torna suporte — fenômeno chamado de 'troca de papéis'.",
          },
          {
            type: "truefalse",
            prompt: "Volume alto num rompimento aumenta a probabilidade de ser um rompimento verdadeiro.",
            correct: true,
            explanation: "Volume elevado confirma interesse real no movimento — rompimentos de baixo volume são frequentemente falsos.",
          },
        ],
      },
      {
        id: "4-3",
        title: "Níveis psicológicos e zonas de preço",
        summary: "Por que números redondos têm tanto poder nos gráficos.",
        xp: 35,
        content: [
          {
            type: "text",
            title: "Números redondos",
            body: "Preços como $100, $1.000, $50.000 (BTC) ou $1,2000 (EUR/USD) atraem ordens em massa. Traders e algoritmos colocam ordens nesses níveis porque são fáceis de lembrar e monitorar.",
          },
          {
            type: "text",
            title: "Zonas vs. linhas exatas",
            body: "Na prática, suporte e resistência são zonas, não preços exatos. Em vez de $100,00, pense em '$98–$102'. O preço raramente respeita um número exato — trabalhe com margens.",
          },
          {
            type: "text",
            title: "Confluência de níveis",
            body: "Quando um nível de suporte/resistência coincide com um número redondo E com um nível histórico relevante E com uma média móvel importante, esse é um ponto de altíssima probabilidade.",
          },
          {
            type: "tip",
            body: "Sempre trace suas zonas com base nos fechamentos de vela, não apenas nas sombras. Fechamentos são mais significativos.",
          },
        ],
        questions: [
          {
            type: "multiple",
            prompt: "Por que níveis psicológicos (números redondos) têm importância em trading?",
            options: [
              "São apenas superstição",
              "Muitos traders e algoritmos colocam ordens nesses preços",
              "Os bancos centrais fixam esses preços",
              "São definidos pelas corretoras",
            ],
            correctIndex: 1,
            explanation: "Números redondos concentram ordens de muitos participantes — isso cria suporte/resistência natural.",
          },
          {
            type: "truefalse",
            prompt: "Suporte e resistência são sempre preços exatos (ex: $100,00).",
            correct: false,
            explanation: "Na prática são zonas. O preço raramente respeita um número exato — trabalhe com intervalos.",
          },
        ],
      },
    ],
  },

  /* =========================================================
     NÍVEL 5 — TENDÊNCIAS
  ========================================================= */
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
      {
        id: "5-2",
        title: "Linhas de tendência",
        summary: "Como traçar e usar trendlines corretamente.",
        xp: 35,
        content: [
          {
            type: "text",
            title: "Como traçar",
            body: "Em tendência de alta: conecte os fundos crescentes com uma linha reta. Em tendência de baixa: conecte os topos decrescentes. Você precisa de pelo menos 2 pontos para traçar, mas 3 ou mais validam a linha.",
          },
          {
            type: "text",
            title: "Uso da linha de tendência",
            body: "A linha de tendência de alta funciona como suporte dinâmico — quando o preço toca e respeita, pode ser uma oportunidade de compra. Quando rompe, o sinal é de enfraquecimento da tendência.",
          },
          {
            type: "example",
            title: "Exemplo clássico",
            body: "BTC sobe de $20k para $60k conectando 3 fundos crescentes. Quando o preço volta e toca a linha pela 4ª vez, traders a usam como entrada de compra. Se a linha for rompida com fechamento abaixo, a tendência de alta está em questão.",
          },
          {
            type: "tip",
            body: "Linhas de tendência mais íngremes (>60°) são menos confiáveis. Ângulos entre 30° e 50° tendem a ser mais sustentáveis.",
          },
        ],
        questions: [
          {
            type: "multiple",
            prompt: "Para traçar uma linha de tendência de alta válida, você conecta:",
            options: [
              "Os topos crescentes",
              "Os fechamentos aleatórios",
              "Os fundos crescentes",
              "As máximas e mínimas alternadas",
            ],
            correctIndex: 2,
            explanation: "Tendência de alta: linhas conectando fundos crescentes (suporte dinâmico).",
          },
          {
            type: "truefalse",
            prompt: "Uma linha de tendência válida precisa de pelo menos 2 pontos de contato.",
            correct: true,
            explanation: "2 pontos mínimo para traçar, mas 3 ou mais aumentam a confiabilidade da linha.",
          },
        ],
      },
      {
        id: "5-3",
        title: "Canais de preço",
        summary: "Quando o preço se move entre dois limites paralelos.",
        xp: 30,
        content: [
          {
            type: "text",
            title: "O que é um canal",
            body: "Um canal é formado por duas linhas paralelas — a linha de tendência principal e uma linha de canal desenhada pelos topos (em alta) ou fundos (em baixa). O preço tende a oscilar entre as duas linhas.",
          },
          {
            type: "text",
            title: "Estratégia de canal",
            body: "Em canal de alta: comprar próximo à linha inferior, sair (ou vender) próximo à linha superior. O canal funciona até ser rompido.",
          },
          {
            type: "text",
            title: "Rompimento do canal",
            body: "Quando o preço fecha abaixo do canal de alta, é sinal de enfraquecimento. Se fechar acima do canal, pode indicar aceleração da tendência (boa notícia para quem está comprado).",
          },
          {
            type: "tip",
            body: "Canais horizontais (laterais) são excelentes para estratégias de range: comprar no suporte, vender na resistência.",
          },
        ],
        questions: [
          {
            type: "multiple",
            prompt: "Num canal de alta, onde é a zona de compra preferida?",
            options: [
              "Perto da linha superior do canal",
              "Perto da linha inferior do canal",
              "No meio do canal",
              "Fora do canal",
            ],
            correctIndex: 1,
            explanation: "A linha inferior do canal de alta é o suporte dinâmico — zona de entrada para compradores.",
          },
          {
            type: "truefalse",
            prompt: "Um rompimento acima do canal de alta é sempre sinal negativo.",
            correct: false,
            explanation: "Rompimento acima pode indicar aceleração bullish — bom para quem está comprado.",
          },
        ],
      },
    ],
  },

  /* =========================================================
     NÍVEL 6 — INDICADORES TÉCNICOS
  ========================================================= */
  {
    id: 6,
    title: "Indicadores Técnicos",
    subtitle: "Médias móveis, RSI, MACD e Bandas de Bollinger",
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
      {
        id: "6-2",
        title: "MACD — o oscilador de tendência",
        summary: "Como usar o MACD para confirmar entradas e divergências.",
        xp: 40,
        content: [
          {
            type: "text",
            title: "O que é o MACD",
            body: "MACD (Moving Average Convergence Divergence) é formado pela diferença entre a EMA12 e EMA26. Quando o MACD cruza acima da linha de sinal (EMA9 do MACD), é sinal de compra. Quando cruza abaixo, sinal de venda.",
          },
          {
            type: "text",
            title: "Histograma",
            body: "O histograma mostra a diferença entre o MACD e sua linha de sinal. Barras crescendo = momentum de alta aumentando. Barras diminuindo = momentum enfraquecendo.",
          },
          {
            type: "text",
            title: "Divergência — o sinal mais poderoso",
            body: "Divergência bearish: preço faz topo mais alto, mas MACD faz topo mais baixo. Isso indica enfraquecimento da alta. Divergência bullish: preço faz fundo mais baixo, MACD faz fundo mais alto — possível reversão de alta.",
          },
          {
            type: "tip",
            body: "O MACD é um indicador defasado (lagging). Use para confirmar tendência, não para prever reversões isoladamente.",
          },
        ],
        questions: [
          {
            type: "multiple",
            prompt: "O que é uma divergência bearish no MACD?",
            options: [
              "MACD e preço fazem topos mais altos juntos",
              "Preço faz topo mais alto, mas MACD faz topo mais baixo",
              "O histograma está positivo",
              "O MACD cruza acima da linha de sinal",
            ],
            correctIndex: 1,
            explanation: "Divergência bearish: preço sobe a novos topos mas o MACD não confirma — sinal de enfraquecimento.",
          },
          {
            type: "truefalse",
            prompt: "O MACD é um indicador antecipado (leading) que prevê movimentos futuros.",
            correct: false,
            explanation: "O MACD é um indicador defasado (lagging) baseado em médias móveis — confirma tendências já em curso.",
          },
        ],
      },
      {
        id: "6-3",
        title: "Bandas de Bollinger",
        summary: "Medindo volatilidade e identificando condições extremas.",
        xp: 40,
        content: [
          {
            type: "text",
            title: "Estrutura das Bandas",
            body: "As Bandas de Bollinger são compostas por 3 linhas: banda superior (MM20 + 2 desvios padrão), linha central (MM20) e banda inferior (MM20 - 2 desvios padrão).",
          },
          {
            type: "text",
            title: "Squeeze — explosão de volatilidade",
            body: "Quando as bandas se estreitam muito (squeeze), indica baixa volatilidade. Esse estado geralmente precede um movimento explosivo. Quando o preço rompe fora das bandas após um squeeze, prepare-se para um grande movimento.",
          },
          {
            type: "text",
            title: "Toque nas bandas",
            body: "Em mercados laterais (range), o toque na banda inferior pode ser compra e na superior pode ser venda. Em tendências fortes, o preço pode 'caminhar' ao longo da banda — não entre contra a tendência só por estar na banda.",
          },
          {
            type: "example",
            title: "Squeeze histórico do BTC",
            body: "Antes de grandes movimentos do Bitcoin (como em 2020), o BTC ficou semanas com as bandas muito estreitas. O squeeze precedeu o rali de $10k para $60k.",
          },
        ],
        questions: [
          {
            type: "multiple",
            prompt: "O 'Squeeze' das Bandas de Bollinger indica:",
            options: [
              "Alta volatilidade",
              "Baixa volatilidade que geralmente precede um grande movimento",
              "Tendência de baixa confirmada",
              "Que o RSI está sobrecomprado",
            ],
            correctIndex: 1,
            explanation: "Squeeze = bandas estreitas = baixa volatilidade. É frequentemente o 'silêncio antes da tempestade'.",
          },
          {
            type: "truefalse",
            prompt: "Em tendências fortes, tocar a banda superior sempre é sinal de venda.",
            correct: false,
            explanation: "Em tendências fortes, o preço pode 'caminhar' pela banda superior por muito tempo — não entre contra a tendência.",
          },
        ],
      },
      {
        id: "6-4",
        title: "Volume e OBV",
        summary: "O volume confirma ou desmente o preço.",
        xp: 35,
        content: [
          {
            type: "text",
            title: "Por que o volume importa",
            body: "Volume é o número de contratos ou moedas negociadas em um período. Movimentos de preço com volume alto são mais confiáveis. Movimentos sem volume são suspeitos.",
          },
          {
            type: "text",
            title: "OBV — On Balance Volume",
            body: "Indicador cumulativo: soma o volume nos dias de alta e subtrai nos dias de baixa. Quando o OBV sobe junto com o preço = confirmação. Quando o OBV cai enquanto o preço sobe = divergência bearish.",
          },
          {
            type: "text",
            title: "Volume em rompimentos",
            body: "Rompimentos de suporte/resistência com volume muito acima da média têm muito mais probabilidade de sucesso. Rompimentos de baixo volume são frequentemente fake-outs.",
          },
          {
            type: "tip",
            body: "Preço + Volume + Suporte/Resistência = a combinação mais robusta para qualquer análise técnica.",
          },
        ],
        questions: [
          {
            type: "multiple",
            prompt: "O que indica um rompimento de resistência com volume muito acima da média?",
            options: [
              "Provável falso rompimento",
              "Maior probabilidade de rompimento verdadeiro",
              "Que o mercado vai reverter imediatamente",
              "Que os spreads vão aumentar",
            ],
            correctIndex: 1,
            explanation: "Volume alto confirma interesse real — rompimentos com volume elevado têm mais probabilidade de sucesso.",
          },
          {
            type: "truefalse",
            prompt: "Se o preço sobe mas o OBV cai, isso é um sinal positivo.",
            correct: false,
            explanation: "OBV caindo enquanto o preço sobe = divergência bearish — o volume não confirma a alta, sinal de fraqueza.",
          },
        ],
      },
    ],
  },

  /* =========================================================
     NÍVEL 7 — GESTÃO DE RISCO
  ========================================================= */
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
      {
        id: "7-2",
        title: "Relação risco-retorno (R:R)",
        summary: "Por que a matemática do trading favorece quem pensa antes de entrar.",
        xp: 45,
        content: [
          {
            type: "text",
            title: "O que é R:R",
            body: "A relação risco-retorno compara o quanto você arrisca (distância até o stop) com o quanto você pode ganhar (distância até o alvo). R:R de 1:2 significa: arrisca $100 para ganhar $200.",
          },
          {
            type: "text",
            title: "A matemática da sobrevivência",
            body: "Com R:R de 1:2, você pode errar 60% das vezes e ainda ser lucrativo. Com R:R de 1:1, você precisa acertar mais de 50%. Com R:R menor que 1:1, você precisa acertar muito mais que 50% — matematicamente difícil no longo prazo.",
          },
          {
            type: "example",
            title: "Cálculo prático",
            body: "10 trades com R:R 1:2 arriscando $100 cada: Se acertar 4 e errar 6: Lucro = 4×$200 = $800. Perda = 6×$100 = $600. Resultado líquido: +$200 com apenas 40% de acerto!",
          },
          {
            type: "tip",
            body: "Nunca aceite um trade com R:R abaixo de 1:1,5. Prefira sempre 1:2 ou melhor.",
          },
        ],
        questions: [
          {
            type: "multiple",
            prompt: "Com R:R de 1:3, se você acertar 30% dos trades, você será:",
            options: [
              "Lucrativo",
              "No zero a zero",
              "Prejuízo",
              "Impossível calcular",
            ],
            correctIndex: 0,
            explanation: "30% de acerto com R:R 1:3: 3 ganhos de $300 = $900; 7 perdas de $100 = $700. Resultado: +$200. Lucrativo!",
          },
          {
            type: "truefalse",
            prompt: "Um R:R de 1:1 garante lucros se você acertar 50% dos trades.",
            correct: false,
            explanation: "Com 1:1 e 50% de acerto você fica no zero, mas os custos de spread/comissão vão gerar prejuízo líquido.",
          },
        ],
      },
      {
        id: "7-3",
        title: "Drawdown e proteção do capital",
        summary: "Como sobreviver a sequências negativas sem quebrar.",
        xp: 50,
        content: [
          {
            type: "text",
            title: "O que é drawdown",
            body: "Drawdown é a queda percentual do pico máximo do capital até o vale mais baixo antes de uma nova máxima. Ex: conta foi a $12.000 e caiu a $9.000 — drawdown de 25%.",
          },
          {
            type: "text",
            title: "Por que o drawdown é traiçoeiro",
            body: "Para recuperar uma perda de 50%, você precisa de 100% de ganho. Perda de 25% exige 33% de ganho para recuperar. Perda de 10% exige apenas 11%. Por isso, manter drawdowns pequenos é crítico.",
          },
          {
            type: "text",
            title: "Regras de proteção",
            body: "Muitos traders profissionais definem regras como: 'Se minha conta cair 10% neste mês, paro de operar e revejo minha estratégia.' Isso evita que um período ruim destrua meses de trabalho.",
          },
          {
            type: "tip",
            body: "Sequências de 5-10 perdas seguidas são normais mesmo em boas estratégias. Prepare-se psicologicamente e financeiramente para isso.",
          },
        ],
        questions: [
          {
            type: "multiple",
            prompt: "Se sua conta sofreu um drawdown de 50%, quanto precisa ganhar para recuperar?",
            options: ["50%", "75%", "100%", "25%"],
            correctIndex: 2,
            explanation: "$10k cai para $5k (-50%). Para voltar a $10k a partir de $5k, precisa dobrar = +100%.",
          },
          {
            type: "truefalse",
            prompt: "10 perdas seguidas indicam que a estratégia não funciona.",
            correct: false,
            explanation: "Mesmo estratégias com 60% de acerto podem ter 10 perdas consecutivas por estatística. O longo prazo define o resultado.",
          },
        ],
      },
    ],
  },

  /* =========================================================
     NÍVEL 8 — ESTRATÉGIAS REAIS
  ========================================================= */
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
      {
        id: "8-2",
        title: "Estratégia de rompimento (Breakout)",
        summary: "Capturando grandes movimentos desde o início.",
        xp: 55,
        content: [
          {
            type: "text",
            title: "A lógica do breakout",
            body: "Quando o preço fica consolidado por tempo suficiente numa faixa estreita (range), a energia acumulada tende a explodir ao romper o nível. Traders de breakout entram quando o rompimento é confirmado.",
          },
          {
            type: "text",
            title: "Critérios para entrar",
            body: "1. Consolidação clara (mínimo 10-20 velas em range). 2. Rompimento com fechamento além da faixa. 3. Volume acima da média no momento do rompimento. 4. Entrada na abertura da próxima vela após o fechamento de rompimento.",
          },
          {
            type: "text",
            title: "Gestão da posição",
            body: "Stop: dentro da faixa de consolidação (abaixo do nível rompido). Alvo: medir a altura da consolidação e projetar a partir do ponto de rompimento.",
          },
          {
            type: "tip",
            body: "Padrões de alta probabilidade para breakout: triângulos, cunhas, retângulos e padrões de cabeça e ombros invertidos.",
          },
        ],
        questions: [
          {
            type: "multiple",
            prompt: "Onde fica o stop loss numa estratégia de breakout de alta?",
            options: [
              "Acima do rompimento",
              "Dentro da zona de consolidação (abaixo do nível rompido)",
              "Muito longe do preço",
              "Não se usa stop em breakouts",
            ],
            correctIndex: 1,
            explanation: "Se o rompimento é verdadeiro, o preço não deve voltar para dentro da faixa — stop dentro da consolidação valida essa lógica.",
          },
          {
            type: "truefalse",
            prompt: "Breakouts de baixo volume tendem a ser mais confiáveis.",
            correct: false,
            explanation: "O oposto: breakouts precisam de volume alto para confirmação. Baixo volume = suspeita de fake-out.",
          },
        ],
      },
      {
        id: "8-3",
        title: "Price Action — Pin Bar e Engolfo",
        summary: "Entradas de alta precisão com padrões de velas.",
        xp: 60,
        content: [
          {
            type: "text",
            title: "A filosofia do Price Action",
            body: "Price Action é a arte de ler o mercado apenas pelo movimento do preço, sem indicadores. Os padrões de vela revelam a psicologia coletiva dos participantes em tempo real.",
          },
          {
            type: "text",
            title: "Pin Bar em zonas chave",
            body: "A Pin Bar (martelo/shooting star) é a mais poderosa entrada de Price Action. Quando aparece em: suporte/resistência forte + nível de Fibonacci + final de tendência, tem altíssima probabilidade. A sombra longa mostra rejeição de preço.",
          },
          {
            type: "text",
            title: "Engolfo (Engulfing)",
            body: "Padrão de duas velas: a segunda engole completamente o corpo da primeira. Engolfo de alta num suporte = compra. Engolfo de baixa numa resistência = venda. Quanto maior o corpo do engolfo e menor a sombra, mais forte o sinal.",
          },
          {
            type: "example",
            title: "Setup completo",
            body: "BTC em suporte forte + retração de Fibonacci 61,8% + aparece Pin Bar de alta com sombra baixa longa. Entrada: abertura da próxima vela. Stop: abaixo da sombra da Pin Bar. Alvo: resistência mais próxima.",
          },
        ],
        questions: [
          {
            type: "multiple",
            prompt: "Uma Pin Bar de alta (martelo) tem sombra longa:",
            options: [
              "Acima do corpo",
              "Abaixo do corpo",
              "Em ambos os lados iguais",
              "Não tem sombra",
            ],
            correctIndex: 1,
            explanation: "Martelo: sombra longa abaixo = compradores rejeitaram preços baixos com força. Shooting star: sombra longa acima = vendedores rejeitaram preços altos.",
          },
          {
            type: "truefalse",
            prompt: "No Price Action, indicadores como RSI e MACD são essenciais.",
            correct: false,
            explanation: "Price Action puro usa apenas preço e volume. Indicadores são considerados derivativos do preço — o preço em si contém toda a informação.",
          },
        ],
      },
      {
        id: "8-4",
        title: "Fibonacci como ferramenta",
        summary: "A sequência matemática que o mercado 'respeita'.",
        xp: 55,
        content: [
          {
            type: "text",
            title: "Por que Fibonacci?",
            body: "A sequência de Fibonacci (0, 1, 1, 2, 3, 5, 8...) gera razões matemáticas presentes na natureza e, curiosamente, nos mercados financeiros. Os níveis mais usados: 23,6%, 38,2%, 50%, 61,8% e 78,6%.",
          },
          {
            type: "text",
            title: "Retração de Fibonacci",
            body: "Após um movimento de alta, o preço frequentemente corrige para um dos níveis de Fibonacci antes de continuar. Trace do fundo ao topo de um movimento e observe onde o preço 'respeita' o nível. O 61,8% é chamado de 'razão áurea'.",
          },
          {
            type: "text",
            title: "Confluência com outros fatores",
            body: "Fibonacci isolado tem valor limitado. O poder vem quando um nível de Fibonacci coincide com suporte/resistência, média móvel ou nível psicológico. Essa confluência cria zonas de altíssima probabilidade.",
          },
          {
            type: "tip",
            body: "O nível de 61,8% (razão áurea) é o mais respeitado pelos traders profissionais. Quando o preço faz pullback até 61,8% com sinal de vela, é uma das melhores entradas em tendência.",
          },
        ],
        questions: [
          {
            type: "multiple",
            prompt: "Qual nível de Fibonacci é chamado de 'razão áurea'?",
            options: ["23,6%", "38,2%", "50%", "61,8%"],
            correctIndex: 3,
            explanation: "O nível 61,8% deriva diretamente da razão áurea (φ ≈ 1,618) e é o nível de Fibonacci mais respeitado no trading.",
          },
          {
            type: "truefalse",
            prompt: "Fibonacci é mais poderoso quando coincide com outros fatores técnicos.",
            correct: true,
            explanation: "Confluência de Fibonacci com suporte/resistência, médias móveis ou níveis psicológicos cria as melhores zonas de entrada.",
          },
        ],
      },
    ],
  },

  /* =========================================================
     NÍVEL 9 — PSICOLOGIA DO TRADING
  ========================================================= */
  {
    id: 9,
    title: "Psicologia do Trading",
    subtitle: "A guerra mais difícil é contra você mesmo",
    difficulty: "avancado",
    lessons: [
      {
        id: "9-1",
        title: "Emoções e tomada de decisão",
        summary: "Medo, ganância e como eles sabotam seus trades.",
        xp: 55,
        content: [
          {
            type: "text",
            title: "O maior inimigo do trader",
            body: "Estudos mostram que a maioria dos traders perde dinheiro não por falta de estratégia, mas por falhas emocionais. Medo e ganância são os dois vilões principais.",
          },
          {
            type: "text",
            title: "Medo",
            body: "Medo de perder: você move o stop, fecha trade cedo ou não entra em setups válidos. Medo de perder ganhos: você sai cedo e perde o movimento maior. FOMO (Fear of Missing Out): você entra tarde em movimentos já avançados.",
          },
          {
            type: "text",
            title: "Ganância",
            body: "Você não fecha quando atinge o alvo, esperando mais. Você aumenta o tamanho da posição após ganhos (overtrading). Você não respeita o stop e 'aguenta' a perda esperando reverter.",
          },
          {
            type: "example",
            title: "O ciclo da destruição",
            body: "Trade vai bem → ganância → não fecha no alvo. Trade reverte → medo → não fecha no stop. Perda grande → raiva → overtrading para recuperar → mais perdas.",
          },
          {
            type: "tip",
            body: "Escreva seu plano de trade ANTES de entrar: entrada, stop, alvo, tamanho. Execute o plano mecanicamente. Não improvise durante o trade.",
          },
        ],
        questions: [
          {
            type: "multiple",
            prompt: "FOMO em trading significa:",
            options: [
              "Um tipo de ordem de compra",
              "Medo de perder um movimento — entrar tarde num trade já avançado",
              "Um indicador técnico",
              "Estratégia de scalping",
            ],
            correctIndex: 1,
            explanation: "FOMO (Fear of Missing Out) leva traders a entrar em posições tarde, com risco elevado e recompensa limitada.",
          },
          {
            type: "truefalse",
            prompt: "Mover o stop loss para evitar uma perda é uma boa prática de gestão.",
            correct: false,
            explanation: "Mover o stop contra você é uma das piores práticas — viola sua gestão de risco e frequentemente resulta em perdas maiores.",
          },
        ],
      },
      {
        id: "9-2",
        title: "Vieses cognitivos do trader",
        summary: "Os atalhos mentais que distorcem suas decisões.",
        xp: 50,
        content: [
          {
            type: "text",
            title: "Viés de confirmação",
            body: "Você busca apenas informações que confirmam o que já acredita e ignora evidências contrárias. Ex: você quer comprar BTC e só lê notícias positivas, ignorando sinais técnicos de baixa.",
          },
          {
            type: "text",
            title: "Efeito de recência",
            body: "Dar peso excessivo aos eventos mais recentes. Depois de 5 ganhos seguidos, você acha que é invencível. Depois de 5 perdas, acha que nunca mais vai ganhar. Ambas as percepções são irracionais.",
          },
          {
            type: "text",
            title: "Aversão à perda",
            body: "A dor de uma perda de $100 é psicologicamente 2x mais intensa que o prazer de um ganho de $100. Isso leva traders a segurar perdedores (esperando recuperar) e vender ganhadores cedo demais.",
          },
          {
            type: "text",
            title: "Overconfidence",
            body: "Após uma série de ganhos, o trader aumenta tamanho, opera mercados desconhecidos e abandona suas regras. Uma sequência de sorte é confundida com habilidade.",
          },
        ],
        questions: [
          {
            type: "multiple",
            prompt: "O viés de aversão à perda faz o trader:",
            options: [
              "Fechar ganhos cedo e segurar perdedores",
              "Aumentar posições em todos os trades",
              "Usar stop sempre",
              "Operar apenas cripto",
            ],
            correctIndex: 0,
            explanation: "A dor da perda é maior que o prazer do ganho — isso faz traders fecharem ganhos cedo e aguardarem perdas reverterem.",
          },
          {
            type: "truefalse",
            prompt: "Uma sequência de 10 ganhos seguidos prova que você é um trader excepcional.",
            correct: false,
            explanation: "Pode ser habilidade, mas pode ser sorte estatística. O tamanho da amostra (10 trades) é pequeno demais para conclusões.",
          },
        ],
      },
      {
        id: "9-3",
        title: "Disciplina, rotina e o diário de trading",
        summary: "Os hábitos que constroem traders profissionais.",
        xp: 55,
        content: [
          {
            type: "text",
            title: "O diário de trading",
            body: "O diário é a ferramenta mais subutilizada do trader. Registre cada operação: por que entrou, como gerenciou, resultado, como se sentiu. Sem dados, você repete os mesmos erros indefinidamente.",
          },
          {
            type: "text",
            title: "Rotina pré-mercado",
            body: "Profissionais têm uma rotina antes de operar: revisar posições abertas, marcar níveis de suporte/resistência no gráfico, verificar agenda econômica, definir os setups do dia. Isso elimina decisões impulsivas.",
          },
          {
            type: "text",
            title: "Regras inegociáveis",
            body: "Defina regras que você nunca quebra: máximo de perda diária ($X ou Y%), número máximo de trades por dia, não operar em notícias de alto impacto, parar após N perdas seguidas.",
          },
          {
            type: "tip",
            body: "Trading é um negócio. Trate-o como tal: tenha um plano, registre resultados, analise os dados e melhore continuamente.",
          },
        ],
        questions: [
          {
            type: "multiple",
            prompt: "Qual é o principal benefício do diário de trading?",
            options: [
              "Impressionar outros traders",
              "Identificar padrões de erros e acertos para melhorar continuamente",
              "Calcular impostos automaticamente",
              "Prever o mercado com mais precisão",
            ],
            correctIndex: 1,
            explanation: "O diário cria dados objetivos sobre seu desempenho — sem ele, você repete os mesmos erros sem perceber.",
          },
          {
            type: "truefalse",
            prompt: "Ter uma perda máxima diária pré-definida é limitante e desnecessário.",
            correct: false,
            explanation: "Limitar perdas diárias protege seu capital de destruição emocional em dias ruins — é uma das regras mais importantes.",
          },
        ],
      },
    ],
  },

  /* =========================================================
     NÍVEL 10 — PRICE ACTION AVANÇADO E ORDER FLOW
  ========================================================= */
  {
    id: 10,
    title: "Price Action Avançado",
    subtitle: "Order flow, liquidez e confluências de alta probabilidade",
    difficulty: "avancado",
    lessons: [
      {
        id: "10-1",
        title: "Order Flow e liquidez",
        summary: "Como os grandes players movem o mercado e onde estão as ordens.",
        xp: 65,
        content: [
          {
            type: "text",
            title: "O que é Order Flow",
            body: "Order Flow é a análise do fluxo de ordens que entram no mercado. O preço se move porque grandes ordens de compra ou venda são executadas. Entender onde essas ordens estão posicionadas é vantagem competitiva.",
          },
          {
            type: "text",
            title: "Zonas de liquidez",
            body: "Liquidez se concentra onde muitos traders têm seus stops. Máximas anteriores (onde estão stops de shorts), mínimas anteriores (onde estão stops de longs) e níveis redondos são zonas de alta liquidez. Grandes players 'caçam' essas zonas para executar suas ordens.",
          },
          {
            type: "text",
            title: "Stop hunt — a armadilha dos grandes",
            body: "Frequentemente o preço perfura brevemente uma zona de liquidez (aciona os stops), coleta essa liquidez e reverte rapidamente na direção oposta. Isso é chamado de 'stop hunt' ou 'sweep de liquidez'.",
          },
          {
            type: "example",
            title: "Identificando stop hunt",
            body: "BTC estava a $40k. Fica lateralizando entre $38k e $42k por semanas. Bruscamente cai para $37,5k (below a mínima de $38k), aciona stops, e reverte rapidamente para $43k. Os grandes coletaram liquidez para executar compras.",
          },
        ],
        questions: [
          {
            type: "multiple",
            prompt: "O que é um 'stop hunt' em trading?",
            options: [
              "Uma estratégia de busca de ativos baratos",
              "Movimento que perfura zonas de liquidez para acionar stops antes de reverter",
              "Um tipo de ordem stop limit",
              "Ferramenta de gestão de risco",
            ],
            correctIndex: 1,
            explanation: "Stop hunt: o preço vai brevemente além de um nível chave para acionar stops e coletar liquidez, depois reverte.",
          },
          {
            type: "truefalse",
            prompt: "Zonas de máximas e mínimas anteriores têm alta concentração de ordens stop.",
            correct: true,
            explanation: "Traders colocam stops além de máximas/mínimas anteriores — isso cria zonas de liquidez que grandes players exploram.",
          },
        ],
      },
      {
        id: "10-2",
        title: "Padrões de reversão avançados",
        summary: "Cabeça e ombros, duplos topos e triângulos.",
        xp: 60,
        content: [
          {
            type: "text",
            title: "Cabeça e Ombros (H&S)",
            body: "Padrão clássico de reversão de tendência de alta. Composto por: ombro esquerdo (topo), cabeça (topo mais alto) e ombro direito (topo mais baixo). Quando o preço rompe a 'linha de pescoço' (neckline) com volume, confirma a reversão.",
          },
          {
            type: "text",
            title: "Duplo Topo e Duplo Fundo",
            body: "Duplo topo: preço testa resistência duas vezes sem superar — padrão bearish. Duplo fundo: preço testa suporte duas vezes sem romper — padrão bullish. O sinal de entrada é o rompimento do nível entre os dois topos/fundos.",
          },
          {
            type: "text",
            title: "Triângulos",
            body: "Triângulo simétrico: topos descendentes + fundos ascendentes (indecisão). Triângulo ascendente: resistência horizontal + fundos ascendentes (bullish). Triângulo descendente: suporte horizontal + topos descendentes (bearish).",
          },
          {
            type: "tip",
            body: "O alvo de preço após o rompimento de H&S é calculado subtraindo a altura da cabeça ao neckline do ponto de rompimento.",
          },
        ],
        questions: [
          {
            type: "multiple",
            prompt: "O padrão Cabeça e Ombros indica:",
            options: [
              "Continuação de alta",
              "Reversão de tendência de alta para baixa",
              "Lateralização prolongada",
              "Aceleração de alta",
            ],
            correctIndex: 1,
            explanation: "H&S é um dos padrões de reversão mais confiáveis — sinaliza fim de tendência de alta e possível início de baixa.",
          },
          {
            type: "truefalse",
            prompt: "Um triângulo ascendente é geralmente bullish.",
            correct: true,
            explanation: "Triângulo ascendente: fundos crescentes + resistência horizontal. Os compradores estão ganhando força — rompimento é tipicamente para cima.",
          },
        ],
      },
      {
        id: "10-3",
        title: "Confluências e setups de alta probabilidade",
        summary: "Combinando múltiplos fatores para entradas precisas.",
        xp: 70,
        content: [
          {
            type: "text",
            title: "O conceito de confluência",
            body: "Um setup de alta probabilidade tem múltiplos fatores alinhados no mesmo ponto: suporte forte + nível de Fibonacci + média móvel importante + padrão de vela + volume crescente. Quanto mais confluências, maior a probabilidade de sucesso.",
          },
          {
            type: "text",
            title: "A pirâmide de confirmação",
            body: "Nível 1 (base): tendência no timeframe maior alinhada. Nível 2: suporte/resistência relevante. Nível 3: indicador confirma (RSI em sobrevenda no suporte). Nível 4: padrão de vela de entrada. Cada nível adicional aumenta a probabilidade.",
          },
          {
            type: "example",
            title: "Setup completo",
            body: "ETH em tendência de alta (D1). Pullback ao suporte em $3.000. Nível de Fibonacci 61,8% no mesmo ponto. RSI em 35 (próximo de sobrevenda). Aparece Pin Bar de alta. Volume acima da média. → Setup de muito alta probabilidade.",
          },
          {
            type: "tip",
            body: "Paciência é a habilidade mais lucrativa. Espere por setups com 3+ confluências. Menos trades, mais qualidade = melhores resultados.",
          },
        ],
        questions: [
          {
            type: "multiple",
            prompt: "Qual é o benefício principal de buscar confluências antes de entrar?",
            options: [
              "Garante 100% de acerto",
              "Aumenta a probabilidade de sucesso do setup",
              "Elimina a necessidade de stop loss",
              "Reduz o spread",
            ],
            correctIndex: 1,
            explanation: "Confluências não garantem resultado, mas aumentam significativamente a probabilidade estatística de sucesso.",
          },
          {
            type: "truefalse",
            prompt: "Mais trades diários = mais lucro no longo prazo.",
            correct: false,
            explanation: "Qualidade supera quantidade. Setups de alta confluência (menos frequentes) superam overtrading no longo prazo.",
          },
        ],
      },
    ],
  },

  /* =========================================================
     NÍVEL 11 — GESTÃO DE CAPITAL AVANÇADA
  ========================================================= */
  {
    id: 11,
    title: "Gestão de Capital Avançada",
    subtitle: "Matemática e sistemas para preservar e crescer o capital",
    difficulty: "avancado",
    lessons: [
      {
        id: "11-1",
        title: "Sizing e o Critério de Kelly",
        summary: "Como calcular o tamanho ideal de cada posição matematicamente.",
        xp: 65,
        content: [
          {
            type: "text",
            title: "Por que o sizing importa",
            body: "Mesmo com uma estratégia lucrativa, arriscar demais por trade pode levar à ruína. Muito pouco capital por trade e o crescimento é lento demais. Existe um tamanho ótimo.",
          },
          {
            type: "text",
            title: "Critério de Kelly",
            body: "Fórmula: K% = W - (1-W)/R. Onde W = taxa de acerto (win rate), R = relação ganho/perda médio. Exemplo: 55% acerto, R:R 1:2. K% = 0,55 - 0,45/2 = 0,55 - 0,225 = 32,5%. Na prática, use metade do Kelly (Half Kelly = 16%) para segurança.",
          },
          {
            type: "text",
            title: "Kelly fracional",
            body: "O Kelly cheio maximiza o crescimento matematicamente, mas leva a drawdowns severos. Profissionais usam 1/4 ou 1/2 Kelly. Isso reduz o crescimento potencial mas torna a curva de patrimônio muito mais estável.",
          },
          {
            type: "tip",
            body: "Para calcular Kelly, você precisa de pelo menos 50-100 trades de dados reais. Com menos dados, use a regra dos 1-2% como padrão.",
          },
        ],
        questions: [
          {
            type: "multiple",
            prompt: "Para calcular o Critério de Kelly, você precisa de:",
            options: [
              "Apenas o saldo da conta",
              "Taxa de acerto e relação ganho/perda médio",
              "O saldo e o spread",
              "Apenas o número de trades",
            ],
            correctIndex: 1,
            explanation: "Kelly = W - (1-W)/R. Precisamos da taxa de acerto (W) e da relação média ganho/perda (R).",
          },
          {
            type: "truefalse",
            prompt: "Usar o Kelly cheio (100%) é recomendado para maximizar lucros.",
            correct: false,
            explanation: "Kelly cheio causa drawdowns severos. Profissionais usam Half Kelly (50%) ou 1/4 Kelly para estabilidade.",
          },
        ],
      },
      {
        id: "11-2",
        title: "Curva de capital e análise de desempenho",
        summary: "Métricas profissionais para avaliar sua performance real.",
        xp: 60,
        content: [
          {
            type: "text",
            title: "Curva de capital (Equity Curve)",
            body: "Gráfico que mostra a evolução do saldo ao longo do tempo. Uma curva saudável sobe de forma suave com drawdowns controlados. Curva muito volátil indica problemas de gestão de risco.",
          },
          {
            type: "text",
            title: "Fator de lucro (Profit Factor)",
            body: "Total de ganhos brutos ÷ total de perdas brutas. PF > 1,5 é aceitável. PF > 2,0 é excelente. PF < 1,0 significa conta em destruição. É uma das métricas mais importantes para avaliar uma estratégia.",
          },
          {
            type: "text",
            title: "Índice de Sharpe",
            body: "Mede retorno ajustado ao risco: retorno médio ÷ desvio padrão dos retornos. Sharpe > 1 é bom; > 2 é excelente. Dois traders com mesmo retorno total: aquele com menor volatilidade tem Sharpe maior — e é melhor.",
          },
          {
            type: "example",
            title: "Analisando dois traders",
            body: "Trader A: +50% ao ano com drawdown máximo de 40%. Trader B: +40% ao ano com drawdown máximo de 10%. Na aparência, A ganhou mais. Mas B é muito superior em termos de risco ajustado — e sustentável no longo prazo.",
          },
        ],
        questions: [
          {
            type: "multiple",
            prompt: "O Profit Factor de 2,0 significa:",
            options: [
              "Você ganhou 2 trades e perdeu 0",
              "Para cada $1 perdido, você ganhou $2",
              "Seu lucro foi de 200%",
              "Você operou o dobro do esperado",
            ],
            correctIndex: 1,
            explanation: "PF = ganhos brutos ÷ perdas brutas. PF de 2,0 = para cada $1 perdido, $2 ganhos — estratégia excelente.",
          },
          {
            type: "truefalse",
            prompt: "Um trader com retorno maior sempre tem estratégia melhor.",
            correct: false,
            explanation: "Retorno sem contexto de risco não diz nada. Um retorno menor com drawdown muito menor pode ser a estratégia superior.",
          },
        ],
      },
      {
        id: "11-3",
        title: "Escalando e gerenciando posições abertas",
        summary: "Técnicas avançadas: trailing stop, piramidagem e parciais.",
        xp: 65,
        content: [
          {
            type: "text",
            title: "Trailing Stop",
            body: "Stop dinâmico que sobe junto com o preço (em longs). Protege os lucros acumulados sem fechar a posição cedo demais. Ex: stop sempre 2% abaixo do preço atual. Se o preço sobe de $100 a $120, o stop vai de $98 a $117,60.",
          },
          {
            type: "text",
            title: "Parciais — realizando lucros",
            body: "Fechar parte da posição no primeiro alvo e manter o restante com stop no break-even. Isso garante lucro mesmo se o segundo alvo não for atingido, enquanto dá a chance de capturar movimentos maiores.",
          },
          {
            type: "text",
            title: "Piramidagem (Pyramiding)",
            body: "Adicionar posições conforme o trade vai a favor. Apenas com cada adição mais segura: stop da posição anterior já em lucro. Regra: o risco total da posição combinada nunca deve superar seu limite de risco.",
          },
          {
            type: "tip",
            body: "Parciais + trailing stop é a combinação mais profissional. Você nunca sai com zero de um trade que chegou a lucro, mas ainda captura movimentos estendidos.",
          },
        ],
        questions: [
          {
            type: "multiple",
            prompt: "O objetivo principal do trailing stop é:",
            options: [
              "Maximizar o tamanho da posição",
              "Proteger lucros acumulados enquanto deixa o trade correr",
              "Eliminar o risco inicial",
              "Aumentar o spread",
            ],
            correctIndex: 1,
            explanation: "Trailing stop sobe com o preço — protege lucros sem forçar saída antecipada em tendências fortes.",
          },
          {
            type: "truefalse",
            prompt: "Piramidagem significa dobrar a posição independentemente do risco total.",
            correct: false,
            explanation: "Piramidagem responsável sempre verifica se o risco total combinado ainda está dentro dos limites definidos.",
          },
        ],
      },
    ],
  },

  /* =========================================================
     NÍVEL 12 — TRADING ALGORÍTMICO
  ========================================================= */
  {
    id: 12,
    title: "Trading Algorítmico",
    subtitle: "Automatize e escale suas estratégias",
    difficulty: "avancado",
    lessons: [
      {
        id: "12-1",
        title: "Introdução ao trading algorítmico",
        summary: "Como robôs e algoritmos funcionam nos mercados modernos.",
        xp: 70,
        content: [
          {
            type: "text",
            title: "O que é algo trading",
            body: "Trading algorítmico (algo trading ou trading automático) é o uso de programas de computador para executar trades com base em regras pré-definidas, sem intervenção humana. Hoje representa mais de 70% do volume de mercados desenvolvidos.",
          },
          {
            type: "text",
            title: "Vantagens",
            body: "Sem emoção: o robô executa o plano mecanicamente. Velocidade: executa em milissegundos. Backtest: é possível testar em dados históricos antes de usar capital real. Escalabilidade: pode monitorar dezenas de mercados simultaneamente.",
          },
          {
            type: "text",
            title: "Tipos de estratégias algorítmicas",
            body: "Trend following: segue a tendência usando médias móveis ou breakouts. Mean reversion: aposta na volta ao valor médio quando o preço se desvia. Arbitragem: explora diferenças de preço entre exchanges. Market making: fornece liquidez lucrando no spread.",
          },
          {
            type: "tip",
            body: "Comece com estratégias simples — complexidade não é sinônimo de lucro. Um sistema com 3 regras claras supera frequentemente sistemas complexos com 20 parâmetros.",
          },
        ],
        questions: [
          {
            type: "multiple",
            prompt: "Qual é uma vantagem principal do trading algorítmico?",
            options: [
              "Garante lucros sempre",
              "Remove o componente emocional da execução",
              "É gratuito e não requer programação",
              "Prevê o futuro com precisão",
            ],
            correctIndex: 1,
            explanation: "O maior benefício é a execução mecânica sem emoções — o algoritmo segue as regras sempre, diferente dos humanos.",
          },
          {
            type: "truefalse",
            prompt: "Estratégias algorítmicas complexas sempre superam as simples.",
            correct: false,
            explanation: "Estratégias simples com edge real frequentemente superam sistemas complexos, que tendem ao overfitting.",
          },
        ],
      },
      {
        id: "12-2",
        title: "Backtesting e validação de estratégias",
        summary: "Como testar uma estratégia antes de arriscar dinheiro real.",
        xp: 65,
        content: [
          {
            type: "text",
            title: "O que é backtesting",
            body: "Backtesting é aplicar as regras de uma estratégia a dados históricos para ver como ela teria performado. É a etapa mais crítica antes de operar com capital real.",
          },
          {
            type: "text",
            title: "Overfitting — o maior perigo",
            body: "Overfitting ocorre quando você ajusta demais os parâmetros para funcionar perfeitamente nos dados históricos, mas falha no mercado real. Um sistema com 15 parâmetros ajustados em 1.000 trades provavelmente está overfitted.",
          },
          {
            type: "text",
            title: "Walk-forward testing",
            body: "Técnica robusta: divide os dados em período de treino (otimização) e período de teste (out-of-sample). A estratégia deve funcionar em ambos. Se funciona só no treino, está overfitted.",
          },
          {
            type: "text",
            title: "Métricas do backtest",
            body: "Analise: Profit Factor (> 1,5), Sharpe Ratio (> 1), máximo drawdown (< 20-30%), número mínimo de trades (> 100 para significância estatística).",
          },
        ],
        questions: [
          {
            type: "multiple",
            prompt: "Overfitting em backtesting significa:",
            options: [
              "A estratégia é muito simples",
              "A estratégia foi ajustada demais para o histórico e provavelmente vai falhar no futuro",
              "O backtest rodou rápido demais",
              "Você não tem dados suficientes",
            ],
            correctIndex: 1,
            explanation: "Overfitting = excelente no histórico, péssimo no mercado real. É o erro mais comum em desenvolvimento de sistemas.",
          },
          {
            type: "truefalse",
            prompt: "Uma estratégia com 98% de acerto no backtest garante lucros reais.",
            correct: false,
            explanation: "Alta taxa de acerto no backtest pode indicar overfitting severo. Resultados reais são sempre diferentes do histórico.",
          },
        ],
      },
      {
        id: "12-3",
        title: "Ferramentas e primeiros passos",
        summary: "Como começar a automatizar suas estratégias na prática.",
        xp: 70,
        content: [
          {
            type: "text",
            title: "Plataformas para automação",
            body: "TradingView Pine Script: linguagem simples para criar indicadores e alertas. MetaTrader 4/5 (MQL4/5): popular para Forex, linguagem própria. Python + bibliotecas: máxima flexibilidade com pandas, backtrader, CCXT (cripto). Freqtrade: framework open-source para cripto.",
          },
          {
            type: "text",
            title: "APIs de exchange",
            body: "Binance, Coinbase e a maioria das exchanges oferecem APIs REST e WebSocket. Com Python e CCXT, você conecta a múltiplas exchanges com o mesmo código e pode executar ordens automaticamente.",
          },
          {
            type: "text",
            title: "Sua primeira estratégia simples",
            body: "Comece com algo simples: cruzamento de médias móveis (compra quando MM9 cruza acima da MM21, vende quando cruza abaixo). Teste em dados históricos, depois em conta demo, e só então em capital real com valor mínimo.",
          },
          {
            type: "tip",
            body: "Nunca coloque um robô em produção sem: (1) backtest rigoroso, (2) pelo menos 1 mês em conta demo, (3) limites de perda diária implementados, (4) monitoramento regular.",
          },
        ],
        questions: [
          {
            type: "multiple",
            prompt: "Qual é a sequência correta para lançar um robô de trading?",
            options: [
              "Produção → Demo → Backtest",
              "Backtest → Demo → Produção",
              "Demo → Backtest → Produção",
              "Produção imediata para 'testar de verdade'",
            ],
            correctIndex: 1,
            explanation: "Sempre: Backtest (histórico) → Demo (tempo real sem dinheiro) → Produção (capital real). Pular etapas é receita para perdas.",
          },
          {
            type: "truefalse",
            prompt: "Um robô de trading não precisa de monitoramento após ser colocado em produção.",
            correct: false,
            explanation: "Mercados mudam, bugs aparecem, condições inesperadas surgem. Monitoramento regular é essencial.",
          },
        ],
      },
    ],
  },
];

export const TOTAL_LESSONS = LEVELS.reduce((acc, l) => acc + l.lessons.length, 0);
