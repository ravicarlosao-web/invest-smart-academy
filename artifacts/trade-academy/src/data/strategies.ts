export type RiskLevel = "Baixo" | "Médio" | "Alto";

export interface Strategy {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
  timeframes: string[];
  markets: string[];
  riskLevel: RiskLevel;
  winRate: string;
  riskReward: string;
  difficulty: "Iniciante" | "Intermediário" | "Avançado";
  description: string;
  howItWorks: string;
  setup: string[];
  entrySignals: string[];
  exitSignals: string[];
  riskManagement: string[];
  pros: string[];
  cons: string[];
  example: string;
  tags: string[];
}

export const STRATEGIES: Strategy[] = [
  {
    id: "trend-following",
    name: "Seguimento de Tendência",
    subtitle: "Negocie a favor da direcção dominante do mercado",
    icon: "TrendingUp",
    timeframes: ["1H", "4H", "1D"],
    markets: ["Forex", "Cripto", "Ações", "Índices"],
    riskLevel: "Médio",
    winRate: "35–45%",
    riskReward: "1:3",
    difficulty: "Iniciante",
    description:
      "Uma das estratégias mais testadas no mundo do trading. A ideia é simples: o mercado tende a continuar na mesma direcção. Em vez de tentar prever topos e fundos, o trader entra quando a tendência está confirmada e acompanha o movimento até sinais de reversão.",
    howItWorks:
      "Usa médias móveis para identificar a direcção geral do mercado. A MA20 representa o curto prazo e a MA50 o médio prazo. Quando a MA20 cruza acima da MA50 (Golden Cross), o mercado está em alta — procura-se entradas longas. Quando cruza abaixo (Death Cross), o mercado está em baixa — procura-se entradas curtas. O MACD é usado como confirmação adicional.",
    setup: [
      "Adiciona a MA20 (EMA ou SMA) ao gráfico",
      "Adiciona a MA50 ao gráfico",
      "Adiciona o indicador MACD com configuração padrão (12, 26, 9)",
      "Prefere gráficos de 1H, 4H ou diário para reduzir ruído",
    ],
    entrySignals: [
      "MA20 cruza acima da MA50 (entrada longa) ou abaixo (entrada curta)",
      "MACD acima da linha zero para compras, abaixo para vendas",
      "O preço está acima das duas médias (longa) ou abaixo (curta)",
      "Vela de confirmação fecha na direcção da tendência",
    ],
    exitSignals: [
      "MA20 cruza de volta a MA50 em sentido contrário",
      "MACD diverge do preço (preço faz nova máxima mas MACD não)",
      "O preço fecha claramente do lado oposto das médias",
      "Atingiste o teu take profit (mínimo 3x o stop loss)",
    ],
    riskManagement: [
      "Stop loss abaixo da MA50 (compras) ou acima (vendas) — geralmente 1–1,5%",
      "Nunca arrisques mais de 1–2% do capital por operação",
      "Usa trailing stop para proteger lucros em tendências fortes",
      "Evita entrar perto de zonas de resistência/suporte forte",
    ],
    pros: [
      "Muito testada e com décadas de dados históricos",
      "Fácil de aprender e implementar",
      "Funciona em qualquer mercado com tendência definida",
      "Excelente relação risco-recompensa quando a tendência sustenta",
    ],
    cons: [
      "Gera perdas em mercados laterais (chop)",
      "Os sinais chegam tarde — parte do movimento já aconteceu",
      "Pode ter longos períodos de drawdown",
      "Requer paciência para deixar as operações correr",
    ],
    example:
      "EUR/USD no gráfico de 4H. A MA20 cruza acima da MA50 em 1.0800. O MACD está positivo. Entras comprado a 1.0810, stop loss em 1.0760 (abaixo da MA50), take profit em 1.0960 (3x o risco). O par sobe durante 3 dias até 1.0970. Lucro de 160 pips com risco de 50 pips — R:R de 3,2.",
    tags: ["Tendência", "Médias Móveis", "MACD", "Multiativo"],
  },

  {
    id: "mean-reversion",
    name: "Reversão à Média",
    subtitle: "Compra quando está barato demais, vende quando está caro demais",
    icon: "Shuffle",
    timeframes: ["15M", "1H", "4H"],
    markets: ["Forex", "Ações", "Commodities"],
    riskLevel: "Médio",
    winRate: "55–65%",
    riskReward: "1:1.5",
    difficulty: "Intermediário",
    description:
      "Os preços raramente se afastam muito da sua média histórica por muito tempo. Quando o mercado se estende demasiado numa direcção — por pânico ou euforia — tende a corrigir de volta. Esta estratégia explora exactamente esse fenómeno, entrando nas extremidades e saindo perto da média.",
    howItWorks:
      "As Bandas de Bollinger definem o intervalo 'normal' de preço (2 desvios padrão). Quando o preço toca a banda inferior, está estatisticamente barato. O RSI abaixo de 30 confirma a sobrevenda. Entra-se comprado, com alvo na média (linha central das Bollinger). Para vendas, o processo é inverso: preço toca banda superior + RSI acima de 70.",
    setup: [
      "Adiciona Bandas de Bollinger (período 20, 2 desvios padrão)",
      "Adiciona RSI com período 14",
      "Identifica mercados laterais ou com tendência fraca — aqui é onde esta estratégia brilha",
      "Prefere gráficos de 15M a 4H",
    ],
    entrySignals: [
      "Preço fecha abaixo da banda inferior de Bollinger (compra) ou acima da superior (venda)",
      "RSI abaixo de 30 para compras, acima de 70 para vendas",
      "Vela de reversão visível: martelo, doji, ou engolfo",
      "Sem notícias fundamentais fortes que justifiquem o movimento",
    ],
    exitSignals: [
      "Preço atinge a linha central das Bollinger (média de 20 períodos)",
      "Preço atinge a banda oposta (para trades com mais convicção)",
      "RSI volta à zona neutra (40–60)",
      "Stop loss atingido (abaixo da mínima da vela de entrada)",
    ],
    riskManagement: [
      "Stop loss abaixo da mínima da vela de sinal (compras) ou acima da máxima (vendas)",
      "Risco máximo 1% por operação",
      "Não entres contra uma tendência muito forte — espera lateralização",
      "Evita na véspera de dados económicos importantes (NFP, IPC, etc.)",
    ],
    pros: [
      "Taxa de acerto elevada (55–65%) comparado com outras estratégias",
      "Entradas bem definidas e fáceis de identificar",
      "Funciona muito bem em pares forex com baixa volatilidade",
      "Targets claros na média das Bollinger",
    ],
    cons: [
      "Perigo de segurar contra tendências fortes (breakout das bandas)",
      "Exige mercados laterais — perde eficácia em tendências nítidas",
      "R:R mais baixo (1:1.5) — cada perda custa mais do que cada ganho rende",
      "Pode exigir vários tentativas antes de acertar (custo de entrar cedo)",
    ],
    example:
      "GBP/USD 1H. Após dados negativos do Reino Unido, o par colapsa até 1.2500 tocando a banda inferior de Bollinger. RSI marca 25 (sobrevenda). Entras comprado a 1.2510, stop em 1.2480, alvo na média (1.2560). Em 8 horas o preço recupera para 1.2565. Resultado: +55 pips com risco de 30 pips.",
    tags: ["Reversão", "Bollinger", "RSI", "Sobre-Extensão"],
  },

  {
    id: "breakout",
    name: "Breakout de Consolidação",
    subtitle: "Captura explosões de volatilidade após períodos de compressão",
    icon: "Zap",
    timeframes: ["1H", "4H", "1D"],
    markets: ["Cripto", "Ações", "Forex", "Commodities"],
    riskLevel: "Alto",
    winRate: "40–50%",
    riskReward: "1:2.5",
    difficulty: "Intermediário",
    description:
      "O mercado alterna entre períodos de acumulação (lateralização) e expansão (movimento direcional). Quando o preço fica preso numa range por tempo suficiente, a pressão acumula-se até um dos lados ceder. Esta estratégia entra exactamente no momento do breakout, capitalizando o movimento explosivo que se segue.",
    howItWorks:
      "Identifica-se uma zona de consolidação clara: máximas e mínimas quase horizontais durante pelo menos 10–15 velas. Quando o preço fecha decisivamente fora deste intervalo, com volume acima da média, entra-se na direcção do breakout. O alvo é o tamanho da range projectado a partir do ponto de rompimento.",
    setup: [
      "Identifica uma zona de consolidação (range) clara no gráfico",
      "Marca a resistência (máxima da range) e o suporte (mínima da range)",
      "Adiciona indicador de volume para confirmar o breakout",
      "Mede a altura da range (usarás este valor para o alvo)",
    ],
    entrySignals: [
      "Preço fecha acima da resistência (breakout de alta) ou abaixo do suporte (breakout de baixa)",
      "Volume significativamente acima da média nos últimos 20 períodos",
      "Vela de breakout sólida, sem sombras longas na direcção contrária",
      "Re-teste do nível rompido como confirmação (entrada mais segura, mas opcional)",
    ],
    exitSignals: [
      "Alvo 1: projecção da altura da range a partir do ponto de rompimento",
      "Alvo 2: próxima zona de suporte/resistência maior",
      "Fecha a operação se o preço reentrar dentro da range (falso breakout confirmado)",
      "Trailing stop após 1x o risco em lucro",
    ],
    riskManagement: [
      "Stop loss dentro da range, abaixo da última mínima (breakout de alta) ou acima da última máxima (breakout de baixa)",
      "Aceita que 50-60% dos breakouts são falsos — o dimensionamento correcto é essencial",
      "Nunca arrisques mais de 1% por operação dado o risco elevado de falsos breakouts",
      "Usa alertas de preço para não perderes o breakout em tempo real",
    ],
    pros: [
      "Pode gerar movimentos muito grandes com risco controlado",
      "Sinais claros e objectivos — range bem definida",
      "Funciona especialmente bem em cripto onde a volatilidade é alta",
      "Facilmente identificável em qualquer timeframe",
    ],
    cons: [
      "Alta incidência de falsos breakouts, especialmente em forex",
      "Pode perder o movimento se entrar no re-teste (que nem sempre acontece)",
      "Exige presença no mercado ou alertas configurados",
      "O timing de saída é difícil — operações podem inverter rapidamente",
    ],
    example:
      "BTC/USD consolidou entre $64.000 e $67.000 durante 5 dias. Volume sobe 3x acima da média. O preço fecha uma vela de 4H a $67.500. Entras a $67.600, stop em $65.000 (dentro da range), alvo em $70.000 (projecção da range de $3.000). BTC atinge $70.200 em 2 dias. Resultado: +$2.600 de ganho com risco de $2.600 — R:R de 1:1 aqui, mas com alvo 2 em $72.000 o R:R sobe para 1:2.5.",
    tags: ["Breakout", "Volume", "Volatilidade", "Consolidação"],
  },

  {
    id: "support-resistance",
    name: "Suporte e Resistência",
    subtitle: "A estratégia mais clássica e mais universalmente eficaz",
    icon: "Layers",
    timeframes: ["1H", "4H", "1D"],
    markets: ["Todos"],
    riskLevel: "Baixo",
    winRate: "45–55%",
    riskReward: "1:2",
    difficulty: "Iniciante",
    description:
      "Zonas onde o mercado historicamente parou, inverteu ou consolidou têm memória. O preço tende a reagir de novo nessas mesmas áreas porque representam zonas onde compradores e vendedores chegaram a acordo anteriormente. Dominar a identificação de S/R é a base de praticamente toda a análise técnica.",
    howItWorks:
      "Identifica zonas onde o preço tocou múltiplas vezes sem conseguir passar (resistência) ou onde caiu e rebateu (suporte). Quanto mais toques tiver uma zona, mais forte é. Quando o preço se aproxima dessas zonas, procura-se um sinal de reversão (vela de reversão, RSI extremo) para entrar na direcção oposta. Quando uma zona é quebrada, inverte o papel — resistência vira suporte e vice-versa.",
    setup: [
      "Analisa o gráfico de cima para baixo: começa no diário, depois 4H, depois 1H",
      "Marca zonas onde o preço reagiu pelo menos 2–3 vezes (maior preferência para zonas com mais toques)",
      "Distingue zonas de preço (faixas de 10–20 pips) de linhas exactas",
      "Opcional: adiciona RSI para confirmar sobrecompra/sobrevenda na zona",
    ],
    entrySignals: [
      "Preço atinge uma zona de suporte ou resistência bem definida",
      "Vela de reversão na zona: martelo, doji, engolfo ou pin bar",
      "RSI em extremos (30 no suporte, 70 na resistência) confirma o sinal",
      "A zona foi testada pelo menos 2 vezes no passado recente",
    ],
    exitSignals: [
      "Alvo na próxima zona de S/R oposta (ex: do suporte para a resistência seguinte)",
      "Fecha 50% na primeira zona de S/R intermediária",
      "Stop loss atingido se o preço fechar claramente do outro lado da zona",
      "Sinal de reversão na direcção contrária após lucro",
    ],
    riskManagement: [
      "Stop loss sempre além da zona (não dentro dela) — deixa espaço para wicks",
      "Quanto mais forte a zona (mais toques), menor o stop necessário",
      "Risco de 0.5–1% por operação",
      "Ajusta o stop para break-even quando o preço avança 50% do caminho ao target",
    ],
    pros: [
      "Funciona em todos os mercados e todos os timeframes",
      "Não precisa de indicadores — análise pura de preço",
      "Zonas S/R visíveis e intuitivas para qualquer trader",
      "Risco bem definido e limitado",
    ],
    cons: [
      "Subjectividade na identificação das zonas",
      "Zonas podem ser violadas sem aviso em mercados com forte impulso",
      "Exige paciência para esperar que o preço chegue à zona",
      "Requer análise multi-timeframe para resultados consistentes",
    ],
    example:
      "XAU/USD (Ouro) mostra resistência forte em $2.350 com 4 toques em 3 meses. O preço sobe até $2.348. RSI marca 68. Aparece uma vela de engolfo de baixa. Vende a $2.345, stop em $2.362 (+17 pips de risco), alvo em $2.310 (suporte abaixo). O ouro recua até $2.308 em 48 horas. Resultado: +37 pips de ganho para 17 de risco — R:R de 2.2.",
    tags: ["Suporte", "Resistência", "Price Action", "Clássico"],
  },

  {
    id: "swing-trading",
    name: "Swing Trading com Price Action",
    subtitle: "Captura oscilações de vários dias sem precisar de indicadores",
    icon: "Waves",
    timeframes: ["4H", "1D"],
    markets: ["Ações", "Forex", "Cripto", "Índices"],
    riskLevel: "Médio",
    winRate: "40–50%",
    riskReward: "1:3",
    difficulty: "Intermediário",
    description:
      "O swing trading captura movimentos de 2 a 10 dias, aproveitando as oscilações naturais dentro de uma tendência maior. Não requer monitorização constante — analisas o gráfico 1–2 vezes por dia. O price action puro (sem indicadores) filtra os sinais mais fortes: pin bars e padrões de engolfo em zonas chave.",
    howItWorks:
      "Identifica a tendência principal no gráfico diário. Depois no gráfico de 4H, espera uma retracção contra a tendência principal (pullback). Quando o preço retrai para uma zona de suporte/resistência chave e forma um padrão de reversão forte (pin bar ou engolfo), entra-se a favor da tendência principal. O objectivo é capturar a próxima perna na direcção da tendência.",
    setup: [
      "Analisa a tendência no gráfico diário (máximas e mínimas em sequência ascendente = alta)",
      "Muda para 4H para encontrar zonas de suporte dentro da tendência de alta",
      "Aguarda retracção para a zona e aparecimento de padrão de reversão",
      "Define entrada, stop e target antes de colocar a ordem",
    ],
    entrySignals: [
      "Pin bar (rabo longo de um lado, corpo pequeno) numa zona de suporte/resistência chave",
      "Padrão de engolfo (a segunda vela engole completamente a primeira) na direcção da tendência",
      "Inside bar após compressão — sinal de indecisão antes de movimento",
      "Pullback retesta zona anterior que foi suporte/resistência",
    ],
    exitSignals: [
      "Alvo na próxima zona de resistência/suporte significativa",
      "Sinal de reversão no timeframe de 4H contra a posição",
      "O preço penetra a mínima anterior de swing (quebra estrutura de mercado)",
      "Trailing stop: move o stop para cada nova mínima de swing (compras)",
    ],
    riskManagement: [
      "Stop loss abaixo da mínima da vela de sinal + pequena margem (10–15 pips extra no forex)",
      "Risco de 1% por operação — as operações duram vários dias",
      "Não moves o stop contra ti mesmo mesmo que o trade 'pareça errado'",
      "Aceita que vais ter sequências de perdas — o R:R de 1:3 compensa",
    ],
    pros: [
      "Não requer acompanhamento constante — ideal para quem tem emprego",
      "Excelente R:R (1:3) permite ser lucrativo com apenas 35% de acerto",
      "Menor stress que scalping — decisões mais calmas",
      "Custos de transacção baixos — poucas operações por semana",
    ],
    cons: [
      "Overnight gaps podem invalidar o stop loss",
      "Requer disciplina para não interferir nas operações abertas",
      "Menos operações por semana — pode parecer 'lento'",
      "A paciência para esperar o setup certo é difícil de manter",
    ],
    example:
      "AAPL está em tendência de alta no diário. Recua de $220 para $205 (zona de suporte anterior). No gráfico 4H aparece um pin bar com rabo longo para baixo em $204. Entras a $206, stop em $201 ($5 de risco). Alvo em $221 ($15 de potencial — R:R 1:3). Em 6 dias a Apple retoma a alta e atinge $222. Resultado: +$16 de ganho com $5 de risco.",
    tags: ["Swing", "Price Action", "Pin Bar", "Multi-dia"],
  },

  {
    id: "scalping",
    name: "Scalping de Curto Prazo",
    subtitle: "Muitas operações pequenas e rápidas ao longo do dia",
    icon: "Zap",
    timeframes: ["1M", "5M"],
    markets: ["Forex", "Índices"],
    riskLevel: "Alto",
    winRate: "50–60%",
    riskReward: "1:1.2",
    difficulty: "Avançado",
    description:
      "O scalper efectua dezenas de operações por dia, cada uma com duração de segundos a minutos. Cada operação captura movimentos mínimos, mas a consistência de muitas operações pequenas pode gerar resultados sólidos. Exige velocidade de execução, spreads baixos e disciplina de ferro. Não é para todos — é uma das estratégias mais exigentes mentalmente.",
    howItWorks:
      "Trabalha nas horas de maior liquidez (abertura de Londres e Nova Iorque). Usa o gráfico de 5M para contexto e 1M para entrada. Identifica a direcção do mercado com a EMA9 e EMA21. Entra nas pequeníssimas retracções contra a tendência de muito curto prazo, com alvos de 5–10 pips e stops de 4–8 pips. O volume de operações compensa o R:R baixo.",
    setup: [
      "Usa uma plataforma com execução rápida e spreads muito baixos (máximo 1 pip em EUR/USD)",
      "Adiciona EMA9 e EMA21 no gráfico de 5M",
      "Trabalha apenas em EUR/USD, GBP/USD ou índices principais",
      "Opera apenas nas primeiras 2 horas após abertura de Londres (8h–10h GMT) ou Nova Iorque (14h–16h GMT)",
    ],
    entrySignals: [
      "EMA9 acima da EMA21 (tendência de alta de curto prazo) — procura compras",
      "Preço recua brevemente para a EMA9 e rejeita",
      "Vela de 1M fecha acima da EMA9 após o recuo",
      "Nenhuma notícia importante prevista nos próximos 15 minutos",
    ],
    exitSignals: [
      "Alvo fixo de 5–10 pips ou 1.2x o risco",
      "Fecha imediatamente se o preço fechar abaixo da EMA21 (1M)",
      "Fecha no final da janela de 2 horas se a operação ainda estiver aberta",
      "Nunca segures um trade de scalping durante a noite",
    ],
    riskManagement: [
      "Stop loss de 4–8 pips (forex) — rígido e sem excepções",
      "Máximo de 3 perdas consecutivas → para de operar no dia",
      "Nunca arrisques mais de 0.5% por operação",
      "O spread é uma parte significativa do lucro — confirma que é competitivo",
    ],
    pros: [
      "Resultados rápidos — sabes se o dia foi bom em poucas horas",
      "Sem risco overnight",
      "Pode ser muito lucrativo com consistência e volume",
      "Altamente disciplinante — força regras rígidas",
    ],
    cons: [
      "Muito exigente mentalmente — burnout é comum",
      "Custos de transacção elevados devido ao volume de operações",
      "Requer presença constante no ecrã",
      "Qualquer distracção pode resultar em perda",
    ],
    example:
      "EUR/USD. 9h15 GMT. EMA9 acima da EMA21 no 5M. No 1M, o preço recua de 1.0840 para 1.0832 (EMA9) e rejeita com uma vela de alta. Entras a 1.0833, stop em 1.0827 (6 pips de risco), alvo em 1.0840 (7 pips). O par sobe até 1.0842 em 4 minutos. Resultado: +9 pips. Feito 8 trades similares no dia: 5 ganhas (+45 pips), 3 perdidas (-18 pips) = +27 pips líquidos.",
    tags: ["Scalping", "Curto Prazo", "EMA", "Alta Frequência"],
  },

  {
    id: "momentum",
    name: "Momentum (RSI + MACD)",
    subtitle: "Segue a força do mercado quando tudo alinha na mesma direcção",
    icon: "Rocket",
    timeframes: ["15M", "1H", "4H"],
    markets: ["Cripto", "Ações", "Forex"],
    riskLevel: "Médio",
    winRate: "40–45%",
    riskReward: "1:2",
    difficulty: "Intermediário",
    description:
      "O momentum mede a velocidade e força de um movimento de preço. Quando vários indicadores de momentum alinham na mesma direcção, é sinal de que o movimento tem mais probabilidade de continuar do que de inverter. Esta estratégia combina RSI e MACD para encontrar os momentos de maior força direcional.",
    howItWorks:
      "O RSI mede a velocidade das subidas vs. descidas. O MACD mede a diferença entre duas EMAs e o seu histograma mostra se o momentum está a acelerar ou a abrandar. Quando o RSI está entre 50–70 (e não sobrecomprado) e o histograma do MACD está crescendo, o momentum de alta é forte. Entra-se comprado e segura-se enquanto o momentum mantém.",
    setup: [
      "Adiciona RSI com período 14",
      "Adiciona MACD com configuração padrão (12, 26, 9)",
      "Procura setups onde RSI está entre 50 e 65 (zona de momentum, não sobrecompra)",
      "Confirma no gráfico superior (ex: se operas em 1H, confirma a direcção no 4H)",
    ],
    entrySignals: [
      "RSI cruzou a linha de 50 de baixo para cima (momentum de alta iniciado)",
      "Histograma MACD está positivo e a crescer (aceleração)",
      "MACD line cruzou a signal line de baixo para cima",
      "O preço está acima da EMA20 no mesmo timeframe",
    ],
    exitSignals: [
      "RSI cai abaixo de 50 (perda de momentum)",
      "Histograma MACD começa a diminuir (desaceleração do momentum)",
      "Divergência: preço faz nova máxima mas RSI/MACD não confirmam",
      "Alvo de 2x o risco atingido",
    ],
    riskManagement: [
      "Stop loss abaixo da última mínima de swing ou abaixo da EMA20",
      "Risco de 1% por operação",
      "Move o stop para break-even quando o lucro atingir 1x o risco",
      "Nunca entres em momentum após RSI acima de 70 — é tarde",
    ],
    pros: [
      "Alinha-te com movimentos fortes que podem durar muito",
      "Sinais claros e quantificáveis com RSI e MACD",
      "Funciona muito bem em mercados de cripto durante bull runs",
      "A divergência é um sinal de saída excelente para proteger lucros",
    ],
    cons: [
      "Os indicadores atrasam o preço — entra depois do início do movimento",
      "Em mercados laterais gera muitos falsos sinais",
      "Pode ser difícil distinguir momentum real de spike temporário",
      "Exige paciência para esperar o alinhamento de todos os sinais",
    ],
    example:
      "SOL/USD, gráfico de 1H. SOL consolida e depois o RSI cruza 50 enquanto o histograma MACD vira positivo. Preço está em $180. Entras a $181, stop em $174 ($7 de risco), alvo em $195 ($14 de potencial — R:R 1:2). Ao longo de 2 dias o momentum sustenta e SOL atinge $196. Resultado: +$15 para $7 de risco.",
    tags: ["Momentum", "RSI", "MACD", "Divergência"],
  },

  {
    id: "channel-trading",
    name: "Trading em Canal de Preço",
    subtitle: "Lucra nas oscilações dentro de um canal bem definido",
    icon: "Shuffle",
    timeframes: ["1H", "4H"],
    markets: ["Forex", "Commodities", "Índices"],
    riskLevel: "Baixo",
    winRate: "55–65%",
    riskReward: "1:1.5",
    difficulty: "Iniciante",
    description:
      "Muitos activos movem-se em canais de preço bem definidos durante semanas ou meses — especialmente em forex. Um canal de alta tem mínimas e máximas crescentes em paralelo. Um canal lateral é uma range bem definida. Esta estratégia compra na linha inferior do canal e vende na superior, capitalizando as oscilações previsíveis.",
    howItWorks:
      "Desenha duas linhas paralelas que conectam os topos e os fundos de um activo. O preço vai oscilar entre estas linhas com bastante previsibilidade enquanto o canal se mantiver. Compra-se próximo da linha inferior (suporte do canal) e vende-se próximo da linha superior (resistência do canal). Se o preço quebrar o canal, fecha-se a posição.",
    setup: [
      "Identifica pelo menos 2 topos e 2 fundos para desenhar o canal",
      "As linhas devem ser paralelas — usa uma ferramenta de canal no teu gráfico",
      "O canal deve ter pelo menos 3–4 semanas de história",
      "Opcional: adiciona RSI para confirmar sobre-extensão nas bordas do canal",
    ],
    entrySignals: [
      "Preço toca ou aproxima-se (dentro de 0.3%) da linha de suporte do canal (compra)",
      "Preço toca ou aproxima-se da linha de resistência do canal (venda)",
      "Vela de reversão na borda do canal",
      "RSI em extremos na borda: abaixo de 35 no suporte, acima de 65 na resistência",
    ],
    exitSignals: [
      "Alvo na borda oposta do canal",
      "Fecha metade na linha central do canal como take profit parcial",
      "Stop loss atingido: fecha se o preço fechar claramente fora do canal",
      "Quebra do canal — o padrão terminou, sai e reavalia",
    ],
    riskManagement: [
      "Stop loss fora do canal (10–20 pips além da borda)",
      "Risco de 0.5–1% por operação",
      "Se o preço fechar fora do canal em 2 velas consecutivas, fecha a posição",
      "Não operes em canais demasiado estreitos — o spread pode comer o lucro",
    ],
    pros: [
      "Sinais muito claros e visuais — qualquer pessoa consegue ver o canal",
      "Taxa de acerto alta (55–65%) quando o canal está bem definido",
      "Funciona especialmente bem em forex e ouro",
      "Pode gerar rendimento consistente em mercados sem grande tendência",
    ],
    cons: [
      "O canal pode quebrar a qualquer momento sem aviso",
      "Requer reconfiguração frequente à medida que o canal evolui",
      "R:R mais baixo — as perdas de breakout podem ser maiores que os ganhos normais",
      "Difícil em activos com volatilidade muito alta (ex: cripto)",
    ],
    example:
      "EUR/USD em canal de alta no gráfico 4H. A linha de suporte está em 1.0780, a resistência em 1.0870. O preço recua até 1.0785. RSI em 38. Entras comprado a 1.0788, stop em 1.0765, alvo em 1.0865. Em 3 dias o par sobe até 1.0872. Resultado: +77 pips de ganho para 23 de risco — R:R de 3.3 (excedeu o esperado).",
    tags: ["Canal", "Lateralização", "Oscilação", "Baixo Risco"],
  },

  {
    id: "opening-range-breakout",
    name: "Breakout da Abertura (ORB)",
    subtitle: "Explora a volatilidade da primeira meia hora de mercado",
    icon: "Bell",
    timeframes: ["5M", "15M"],
    markets: ["Ações", "Índices"],
    riskLevel: "Médio",
    winRate: "40–50%",
    riskReward: "1:2",
    difficulty: "Intermediário",
    description:
      "Nos primeiros 15–30 minutos após a abertura do mercado de acções, o volume e a volatilidade são máximos. O preço forma uma range de abertura. Quando esta range é rompida com força, o movimento tende a continuar durante as primeiras horas da sessão. Esta estratégia é popular entre day traders de acções e índices americanos.",
    howItWorks:
      "Identifica a máxima e a mínima dos primeiros 15 ou 30 minutos após a abertura (9h30 EST para mercados americanos). Aguarda o preço fechar fora desta range com volume elevado. Entra na direcção do breakout e mantém a posição até o alvo ou até ao final da manhã (ao meio-dia EST, a liquidez diminui).",
    setup: [
      "Configura o teu gráfico para o mercado americano (abertura às 14h30 Portugal/15h30 no Verão)",
      "Marca a máxima e mínima das primeiras 3 velas de 5M (15 min) ou 2 velas de 15M",
      "Adiciona indicador de volume",
      "Prepara ordens stop de compra acima da máxima e stop de venda abaixo da mínima",
    ],
    entrySignals: [
      "Vela de 5M fecha acima da máxima da range com volume superior ao da abertura",
      "Segunda vela confirma — não fecha de volta dentro da range",
      "O mercado de futuros apontava na mesma direcção antes da abertura",
      "Nenhum dado económico importante previsto nas próximas horas",
    ],
    exitSignals: [
      "Alvo igual a 1–2x o tamanho da range de abertura",
      "Fecha ao meio-dia EST se a operação ainda estiver aberta",
      "Stop loss atingido: mínima da range (breakout de alta) ou máxima (breakout de baixa)",
      "Fecha se o volume começar a cair significativamente",
    ],
    riskManagement: [
      "Stop loss dentro da range de abertura",
      "Risco de 1% por operação",
      "Não entres mais de 30 minutos após a abertura (a estratégia perde eficácia)",
      "Evita o ORB em dias de earnings (resultados) da empresa — volatilidade imprevisível",
    ],
    pros: [
      "Momento do dia com maior liquidez e movimento direcional",
      "Setup simples e repetível todos os dias",
      "Funciona muito bem em SPX500 e NAS100",
      "Posições curtas — raramente tens de segurar mais de 3 horas",
    ],
    cons: [
      "Específico para certos horários (podes ter de acordar cedo)",
      "Não funciona em todos os dias — dias sem volume não dão breakout",
      "A range pode ser muito pequena (risco vs. comissões desfavorável)",
      "Requer presença activa durante o horário de operação",
    ],
    example:
      "SPX500, 14h30 Portugal. Nos primeiros 15 min forma-se uma range entre 5.270 e 5.285 (15 pontos). Volume alto. Às 14h45, uma vela de 5M fecha a 5.290 com volume 2x acima da média. Entras a 5.291, stop em 5.278, alvo em 5.313 (projecção de 2x a range = 30 pontos). O índice sobe até 5.318 ao meio-dia. Resultado: +27 pontos de ganho para 13 de risco.",
    tags: ["Day Trading", "Abertura", "Volume", "Acções"],
  },

  {
    id: "divergence-trading",
    name: "Trading de Divergência",
    subtitle: "Antecipa reversões quando o preço e os indicadores divergem",
    icon: "Telescope",
    timeframes: ["1H", "4H", "1D"],
    markets: ["Todos"],
    riskLevel: "Médio",
    winRate: "45–55%",
    riskReward: "1:2.5",
    difficulty: "Avançado",
    description:
      "A divergência ocorre quando o preço faz uma nova máxima mas o indicador faz uma máxima mais baixa (divergência de baixa) — ou o inverso. É um dos sinais mais poderosos de que o momentum por trás do movimento está a enfraquecer. Os traders experientes usam a divergência para antecipar reversões antes que elas aconteçam no preço.",
    howItWorks:
      "Compara os movimentos do preço com os do RSI ou MACD. Na divergência de baixa: o preço faz uma máxima mais alta mas o RSI faz uma máxima mais baixa — sinal de fraqueza escondida. Na divergência de alta: o preço faz uma mínima mais baixa mas o RSI faz uma mínima mais alta — sinal de força escondida. Confirma com um padrão de vela de reversão para entrar.",
    setup: [
      "Adiciona RSI com período 14 (ou MACD)",
      "Activa a função de desenho do gráfico para traçar linhas de tendência no RSI",
      "Procura divergências depois de movimentos extensos (pelo menos 5–7 velas de impulso)",
      "Prefere timeframes de 1H e superiores para maior fiabilidade",
    ],
    entrySignals: [
      "Divergência de baixa: preço máxima mais alta + RSI máxima mais baixa → vende",
      "Divergência de alta: preço mínima mais baixa + RSI mínima mais alta → compra",
      "Vela de reversão na zona de divergência (pin bar, doji ou engolfo)",
      "A divergência ocorre numa zona de S/R chave (aumenta a probabilidade)",
    ],
    exitSignals: [
      "Alvo na próxima zona de S/R significativa (mínimo 2.5x o risco)",
      "RSI cruza a linha de 50 na direcção da operação (momentum confirmado)",
      "Stop loss atingido se a divergência for invalidada (novo extremo do preço)",
      "Divergência oposta na direcção do trade (possível dupla divergência)",
    ],
    riskManagement: [
      "Stop loss além do último extremo de preço que formou a divergência",
      "Risco de 1% por operação",
      "Divergências em timeframes maiores são mais fiáveis (4H > 1H > 15M)",
      "Não entres apenas pela divergência — espera sempre a confirmação de preço",
    ],
    pros: [
      "Um dos sinais mais poderosos da análise técnica",
      "Antecipa reversões antes que sejam óbvias para todos",
      "Funciona em todos os mercados e timeframes",
      "Excelente como filtro adicional para outras estratégias",
    ],
    cons: [
      "A divergência pode durar mais tempo que o esperado (mercado continua o movimento)",
      "Mais difícil de identificar correctamente — requer treino",
      "Não funciona em tendências muito fortes (podem existir divergências falsas)",
      "Requer paciência para esperar a confirmação de reversão",
    ],
    example:
      "BTC/USD no gráfico de 4H. BTC sobe de $65.000 para $67.500 (nova máxima). No RSI, a primeira máxima marcou 72, a nova máxima marca apenas 65 — divergência de baixa. Aparece um engolfo de baixa em $67.400. Vendes a $67.300, stop em $68.000 ($700 de risco), alvo em $65.000 ($2.300 de potencial — R:R 1:3.3). BTC cai até $64.800 em 3 dias. Resultado: +$2.500 de ganho.",
    tags: ["Divergência", "RSI", "Reversão", "Avançado"],
  },
];

export function getStrategyById(id: string): Strategy | undefined {
  return STRATEGIES.find((s) => s.id === id);
}
