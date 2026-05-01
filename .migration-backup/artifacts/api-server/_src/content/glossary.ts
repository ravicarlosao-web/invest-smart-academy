// @ts-nocheck
export interface GlossaryTerm {
  term: string;
  definition: string;
  category: GlossaryCategory;
}

export type GlossaryCategory =
  | "Análise Técnica"
  | "Gestão de Risco"
  | "Tipos de Ordem"
  | "Mercados"
  | "Indicadores"
  | "Psicologia"
  | "Derivativos"
  | "Geral";

export const CATEGORY_COLORS: Record<GlossaryCategory, string> = {
  "Análise Técnica": "bg-primary/15 text-primary",
  "Gestão de Risco": "bg-bear/15 text-bear",
  "Tipos de Ordem": "bg-bull/15 text-bull",
  "Mercados": "bg-info/15 text-info",
  "Indicadores": "bg-warning/15 text-warning",
  "Psicologia": "bg-purple-500/15 text-purple-400",
  "Derivativos": "bg-orange-500/15 text-orange-400",
  "Geral": "bg-surface-3 text-muted-foreground",
};

export const GLOSSARY: GlossaryTerm[] = [
  // ── Geral ──
  { term: "Ativo", definition: "Qualquer instrumento financeiro que pode ser comprado ou vendido: ações, moedas, criptomoedas, commodities, índices.", category: "Geral" },
  { term: "Bear Market", definition: "Mercado em tendência de baixa prolongada, geralmente com queda superior a 20% a partir de um topo recente.", category: "Geral" },
  { term: "Bull Market", definition: "Mercado em tendência de alta prolongada, geralmente com alta superior a 20% a partir de uma mínima recente.", category: "Geral" },
  { term: "Bid", definition: "O preço mais alto que um comprador está disposto a pagar por um ativo no momento.", category: "Geral" },
  { term: "Ask", definition: "O preço mais baixo que um vendedor aceita receber por um ativo no momento.", category: "Geral" },
  { term: "Spread", definition: "A diferença entre o preço de compra (ask) e o preço de venda (bid). É o custo implícito de operação.", category: "Geral" },
  { term: "Liquidez", definition: "Facilidade de comprar ou vender um ativo sem causar grande impacto no preço. Ativos líquidos têm spreads menores.", category: "Geral" },
  { term: "Volume", definition: "Quantidade total de contratos ou unidades negociadas em um período. Alto volume valida movimentos de preço.", category: "Geral" },
  { term: "Lote", definition: "Unidade padrão de negociação. No Forex, 1 lote padrão = 100.000 unidades da moeda base.", category: "Geral" },
  { term: "Mini-lote", definition: "1/10 de um lote padrão. No Forex = 10.000 unidades. Permite operar com capital menor.", category: "Geral" },
  { term: "Micro-lote", definition: "1/100 de um lote padrão. No Forex = 1.000 unidades. Ideal para iniciantes.", category: "Geral" },
  { term: "Pip", definition: "Menor variação de preço em Forex. Para EUR/USD, 1 pip = 0,0001. Usado para medir ganhos e perdas.", category: "Geral" },
  { term: "Swap", definition: "Taxa cobrada (ou paga) para manter uma posição alavancada aberta durante a noite (overnight).", category: "Geral" },
  { term: "Corretora", definition: "Intermediária entre o trader e o mercado. Executa ordens, oferece plataforma e cobra spreads/comissões.", category: "Geral" },
  { term: "Alavancagem", definition: "Amplificador de posição que permite controlar um valor maior com menos capital. 10× = $1.000 controla $10.000.", category: "Geral" },
  { term: "Margem", definition: "Capital necessário para abrir uma posição alavancada. É uma garantia, não um custo.", category: "Geral" },
  { term: "Margem livre", definition: "Capital disponível na conta para abrir novas posições após descontar a margem usada.", category: "Geral" },
  { term: "Chamada de margem", definition: "Alerta da corretora quando o saldo cai abaixo do mínimo exigido. Pode forçar o fechamento de posições.", category: "Geral" },
  { term: "Slippage", definition: "Diferença entre o preço esperado e o preço real de execução de uma ordem, comum em ativos pouco líquidos.", category: "Geral" },
  { term: "Patrimônio (Equity)", definition: "Saldo total da conta incluindo lucros/perdas não realizados das posições abertas.", category: "Geral" },

  // ── Mercados ──
  { term: "Forex", definition: "Foreign Exchange Market. Maior mercado do mundo com volume diário de +$7 trilhões. Negocia pares de moedas.", category: "Mercados" },
  { term: "B3", definition: "Bolsa de valores brasileira. Negocia ações, futuros, opções e outros derivativos nacionais.", category: "Mercados" },
  { term: "NYSE", definition: "New York Stock Exchange. Maior bolsa de valores do mundo por capitalização de mercado.", category: "Mercados" },
  { term: "Nasdaq", definition: "Segunda maior bolsa americana, focada em empresas de tecnologia como Apple, Google e Tesla.", category: "Mercados" },
  { term: "Par de moedas", definition: "Cotação de uma moeda em relação a outra. EUR/USD: 1 euro vale X dólares.", category: "Mercados" },
  { term: "Par maior", definition: "Pares de moedas mais negociados: EUR/USD, GBP/USD, USD/JPY, USD/CHF. Têm os menores spreads.", category: "Mercados" },
  { term: "Par exótico", definition: "Par de moedas que envolve uma moeda emergente (ex: USD/BRL). Menor liquidez, spreads maiores.", category: "Mercados" },
  { term: "Índice", definition: "Cesta de ações que representa um mercado. Ex: Ibovespa (Brasil), S&P 500 (EUA), Dow Jones.", category: "Mercados" },
  { term: "Commodity", definition: "Matéria-prima negociada nos mercados: petróleo, ouro, prata, soja, café, trigo.", category: "Mercados" },
  { term: "Criptomoeda", definition: "Ativo digital descentralizado baseado em blockchain. Bitcoin (BTC) é o maior por capitalização.", category: "Mercados" },
  { term: "Sesssão de mercado", definition: "Período em que um mercado específico está aberto. Forex tem sessões de Tóquio, Londres, Nova York e Sydney.", category: "Mercados" },
  { term: "Mercado OTC", definition: "Over-the-Counter. Transações realizadas diretamente entre as partes, sem passar por uma bolsa centralizada.", category: "Mercados" },

  // ── Análise Técnica ──
  { term: "Candlestick", definition: "Representação gráfica do preço de um ativo mostrando abertura, fechamento, máxima e mínima de um período.", category: "Análise Técnica" },
  { term: "Suporte", definition: "Nível de preço onde a demanda historicamente aparece e impede quedas maiores. Funciona como um piso.", category: "Análise Técnica" },
  { term: "Resistência", definition: "Nível de preço onde a oferta historicamente aparece e impede altas maiores. Funciona como um teto.", category: "Análise Técnica" },
  { term: "Tendência", definition: "Direção dominante do movimento de preço. Pode ser de alta (topos e fundos ascendentes), baixa ou lateral.", category: "Análise Técnica" },
  { term: "Trendline", definition: "Linha reta que conecta topos (tendência de baixa) ou fundos (tendência de alta) consecutivos no gráfico.", category: "Análise Técnica" },
  { term: "Canal", definition: "Duas linhas paralelas que contêm o movimento do preço — uma de suporte e outra de resistência.", category: "Análise Técnica" },
  { term: "Pullback", definition: "Correção temporária contra a tendência principal antes de continuar na direção dominante.", category: "Análise Técnica" },
  { term: "Rompimento (Breakout)", definition: "Quando o preço cruza um nível de suporte/resistência com volume, sinalizando potencial novo movimento.", category: "Análise Técnica" },
  { term: "Falso rompimento (Fake-out)", definition: "O preço cruza um nível mas reverte rapidamente. Armadilha para quem entrou no rompimento.", category: "Análise Técnica" },
  { term: "Consolidação", definition: "Período de baixa volatilidade onde o preço oscila numa faixa estreita, acumulando energia para o próximo movimento.", category: "Análise Técnica" },
  { term: "Pin Bar", definition: "Vela com sombra longa e corpo pequeno, indicando forte rejeição de preço. Sinal de possível reversão.", category: "Análise Técnica" },
  { term: "Engolfo", definition: "Padrão de duas velas onde a segunda envolve completamente o corpo da primeira. Sinal de reversão.", category: "Análise Técnica" },
  { term: "Doji", definition: "Vela onde abertura e fechamento são quase idênticos, indicando indecisão entre compradores e vendedores.", category: "Análise Técnica" },
  { term: "Marubozu", definition: "Vela sem sombras (ou quase), indicando força direcional total. Verde = compradores dominaram todo o período.", category: "Análise Técnica" },
  { term: "Cabeça e ombros", definition: "Padrão de reversão com três topos: ombro esquerdo, cabeça (maior) e ombro direito. Sinal de fim de alta.", category: "Análise Técnica" },
  { term: "Duplo topo", definition: "Padrão bearish: preço testa resistência duas vezes sem superar. Sinal de possível reversão de baixa.", category: "Análise Técnica" },
  { term: "Duplo fundo", definition: "Padrão bullish: preço testa suporte duas vezes sem romper. Sinal de possível reversão de alta.", category: "Análise Técnica" },
  { term: "Triângulo", definition: "Padrão de consolidação formado por linhas de tendência convergentes. Pode ser simétrico, ascendente ou descendente.", category: "Análise Técnica" },
  { term: "Cunha", definition: "Padrão de consolidação com duas linhas que convergem na mesma direção. Bullish (cunha descendente) ou bearish (cunha ascendente).", category: "Análise Técnica" },
  { term: "Bandeira", definition: "Consolidação breve após movimento forte, em forma de paralelogramo. Geralmente resulta em continuação da tendência.", category: "Análise Técnica" },
  { term: "Fibonacci", definition: "Sequência matemática cujos níveis (23,6%, 38,2%, 61,8%) são usados como zonas de suporte/resistência dinâmico.", category: "Análise Técnica" },
  { term: "Razão áurea", definition: "O nível 61,8% de Fibonacci, derivado da proporção φ ≈ 1,618. É o nível de retração mais respeitado.", category: "Análise Técnica" },
  { term: "Price Action", definition: "Análise do mercado apenas pelo movimento de preço, sem indicadores. Foca em padrões de velas e zonas-chave.", category: "Análise Técnica" },
  { term: "Timeframe", definition: "Período representado por cada vela no gráfico. M1 (1 min), H1 (1 hora), D1 (1 dia), W1 (1 semana).", category: "Análise Técnica" },
  { term: "Análise top-down", definition: "Técnica de analisar do timeframe maior para o menor. Identifica tendência no diário, entra no H1 ou M15.", category: "Análise Técnica" },
  { term: "Confluência", definition: "Quando múltiplos fatores técnicos apontam para o mesmo ponto de preço, aumentando a probabilidade do setup.", category: "Análise Técnica" },
  { term: "Reteste", definition: "Quando o preço retorna ao nível que acabou de romper para testá-lo do outro lado antes de continuar.", category: "Análise Técnica" },
  { term: "Order Flow", definition: "Análise do fluxo de ordens de compra e venda que movem o mercado. Identifica onde está a liquidez.", category: "Análise Técnica" },
  { term: "Stop Hunt", definition: "Movimento que perfura zonas de liquidez para acionar stops de outros traders antes de reverter.", category: "Análise Técnica" },
  { term: "Smart Money", definition: "Capital de bancos, fundos e instituições que movem grandes volumes e frequentemente direcionam o mercado.", category: "Análise Técnica" },

  // ── Indicadores ──
  { term: "Média móvel simples (SMA)", definition: "Média aritmética dos últimos N fechamentos. Ex: SMA20 = soma dos últimos 20 fechamentos ÷ 20.", category: "Indicadores" },
  { term: "Média móvel exponencial (EMA)", definition: "Média com maior peso nos preços mais recentes. Mais rápida que a SMA para capturar mudanças de tendência.", category: "Indicadores" },
  { term: "RSI", definition: "Relative Strength Index. Oscilador 0–100. >70 = sobrecompra, <30 = sobrevenda. Mede força relativa.", category: "Indicadores" },
  { term: "MACD", definition: "Moving Average Convergence/Divergence. Diferença entre EMA12 e EMA26. Sinaliza momentum e reversões.", category: "Indicadores" },
  { term: "Linha de sinal", definition: "EMA9 do MACD. O cruzamento do MACD com sua linha de sinal gera sinais de compra/venda.", category: "Indicadores" },
  { term: "Histograma MACD", definition: "Barras que mostram a diferença entre o MACD e sua linha de sinal. Mede força do momentum.", category: "Indicadores" },
  { term: "Bandas de Bollinger", definition: "MM20 com 2 desvios padrão acima e abaixo. Mede volatilidade e identifica condições extremas de preço.", category: "Indicadores" },
  { term: "Squeeze (Bollinger)", definition: "Quando as bandas se estreitam drasticamente — baixa volatilidade que geralmente precede movimento explosivo.", category: "Indicadores" },
  { term: "Estocástico", definition: "Oscilador que compara o preço de fechamento com o range de preços num período. >80 = sobrecompra, <20 = sobrevenda.", category: "Indicadores" },
  { term: "OBV", definition: "On Balance Volume. Indicador cumulativo que soma/subtrai volume com base na direção do dia. Confirma tendências.", category: "Indicadores" },
  { term: "ATR", definition: "Average True Range. Mede a volatilidade média do mercado em N períodos. Útil para definir stops.", category: "Indicadores" },
  { term: "Divergência", definition: "Quando o preço e um indicador (RSI, MACD) se movem em direções opostas — sinal de possível reversão.", category: "Indicadores" },
  { term: "Indicador lagging", definition: "Indicador baseado em preços passados (ex: médias móveis). Confirma tendências mas é lento para reversões.", category: "Indicadores" },
  { term: "Indicador leading", definition: "Indicador que antecipa movimentos futuros (ex: RSI, Estocástico). Mais rápido mas mais falsos sinais.", category: "Indicadores" },
  { term: "Pivot Point", definition: "Nível calculado com base em máxima, mínima e fechamento do dia anterior. Serve como suporte/resistência.", category: "Indicadores" },

  // ── Gestão de Risco ──
  { term: "Stop Loss", definition: "Ordem que fecha uma posição automaticamente ao atingir um nível de perda pré-definido. Obrigatório em todo trade.", category: "Gestão de Risco" },
  { term: "Take Profit", definition: "Ordem que fecha uma posição automaticamente ao atingir o alvo de lucro definido.", category: "Gestão de Risco" },
  { term: "Risco-retorno (R:R)", definition: "Relação entre o risco (distância ao stop) e o retorno esperado (distância ao alvo). Mínimo recomendado: 1:1,5.", category: "Gestão de Risco" },
  { term: "Drawdown", definition: "Queda percentual do pico máximo do saldo até o vale mais baixo antes de atingir nova máxima.", category: "Gestão de Risco" },
  { term: "Drawdown máximo", definition: "Maior queda histórica do saldo em relação ao pico. Métrica crítica para avaliar risco de uma estratégia.", category: "Gestão de Risco" },
  { term: "Regra dos 1-2%", definition: "Princípio de arrriscar no máximo 1-2% do capital total por operação para sobreviver a sequências negativas.", category: "Gestão de Risco" },
  { term: "Profit Factor", definition: "Ganhos brutos ÷ perdas brutas. PF > 1,5 é aceitável; > 2,0 é excelente; < 1,0 = estratégia perdedora.", category: "Gestão de Risco" },
  { term: "Sharpe Ratio", definition: "Retorno ajustado ao risco: retorno médio ÷ desvio padrão. >1 = bom; >2 = excelente.", category: "Gestão de Risco" },
  { term: "Critério de Kelly", definition: "Fórmula matemática para calcular o tamanho ótimo da posição baseada na taxa de acerto e R:R.", category: "Gestão de Risco" },
  { term: "Trailing Stop", definition: "Stop dinâmico que acompanha o preço na direção favorável, protegendo lucros acumulados.", category: "Gestão de Risco" },
  { term: "Breakeven", definition: "Mover o stop loss para o ponto de entrada após o trade entrar em lucro — elimina risco de perda.", category: "Gestão de Risco" },
  { term: "Sizing de posição", definition: "Cálculo do tamanho ideal da posição com base no capital, stop e percentual de risco aceito.", category: "Gestão de Risco" },
  { term: "Piramidagem", definition: "Adicionar posições a um trade vencedor, sempre com o risco total controlado.", category: "Gestão de Risco" },
  { term: "Hedging", definition: "Estratégia de proteção que abre posição contrária para reduzir o risco de outra posição aberta.", category: "Gestão de Risco" },

  // ── Tipos de Ordem ──
  { term: "Ordem a mercado", definition: "Executada imediatamente ao melhor preço disponível. Garantia de execução, sem garantia de preço exato.", category: "Tipos de Ordem" },
  { term: "Ordem limitada (Limit)", definition: "Executada apenas ao preço especificado ou melhor. Compra limit abaixo do mercado; Venda limit acima.", category: "Tipos de Ordem" },
  { term: "Ordem stop", definition: "Ativa quando o preço atinge um nível gatilho. Stop de compra acima do mercado (breakout); stop de venda abaixo.", category: "Tipos de Ordem" },
  { term: "Stop-limit", definition: "Combina stop e limit: quando o stop é atingido, coloca uma ordem limitada ao preço definido.", category: "Tipos de Ordem" },
  { term: "OCO (One Cancels Other)", definition: "Par de ordens onde o preenchimento de uma cancela automaticamente a outra. Útil para definir SL e TP juntos.", category: "Tipos de Ordem" },
  { term: "Ordem GTC", definition: "Good Till Cancelled. Ordem que permanece ativa até ser executada ou cancelada manualmente.", category: "Tipos de Ordem" },
  { term: "Ordem IOC", definition: "Immediate or Cancel. Executa o máximo possível imediatamente e cancela o restante.", category: "Tipos de Ordem" },
  { term: "Preenchimento parcial", definition: "Quando uma ordem é executada em partes, ao longo de vários preços disponíveis no mercado.", category: "Tipos de Ordem" },

  // ── Psicologia ──
  { term: "FOMO", definition: "Fear of Missing Out. Medo de perder um movimento leva o trader a entrar tarde, com risco elevado.", category: "Psicologia" },
  { term: "Revenge trading", definition: "Operar de forma impulsiva após uma perda na tentativa de recuperar rapidamente. Altamente destrutivo.", category: "Psicologia" },
  { term: "Overtrading", definition: "Operar em excesso, além do plano. Geralmente causado por tédio, ganância ou ansiedade de recuperar perdas.", category: "Psicologia" },
  { term: "Viés de confirmação", definition: "Tendência de buscar apenas informações que confirmam a crença pré-existente, ignorando evidências contrárias.", category: "Psicologia" },
  { term: "Aversão à perda", definition: "A dor de uma perda de $X é psicologicamente 2x maior que o prazer de um ganho de $X.", category: "Psicologia" },
  { term: "Efeito de recência", definition: "Dar peso excessivo a eventos recentes. Após ganhos, sente-se invencível. Após perdas, sente-se amaldiçoado.", category: "Psicologia" },
  { term: "Overconfidence", definition: "Excesso de confiança após uma série de ganhos, levando a riscos maiores e abandono das regras.", category: "Psicologia" },
  { term: "Diário de trading", definition: "Registro de todas as operações com raciocínio, emoções e resultado. Ferramenta essencial de melhoria contínua.", category: "Psicologia" },
  { term: "Drawdown psicológico", definition: "Impacto emocional de uma sequência de perdas, independente do valor monetário.", category: "Psicologia" },
  { term: "Disciplina", definition: "Capacidade de seguir o plano de trading de forma consistente, independente das emoções do momento.", category: "Psicologia" },
  { term: "Plano de trading", definition: "Documento com regras de entrada, saída, gestão e objetivos. Define quando e como operar antes de abrir qualquer trade.", category: "Psicologia" },

  // ── Derivativos ──
  { term: "Contrato futuro", definition: "Acordo padronizado para comprar/vender um ativo a preço fixo em data futura. Negociados em bolsas organizadas.", category: "Derivativos" },
  { term: "CFD", definition: "Contract for Difference. Contrato que troca a diferença de preço entre entrada e saída sem possuir o ativo.", category: "Derivativos" },
  { term: "Opção de compra (Call)", definition: "Direito (não obrigação) de comprar um ativo a um preço específico (strike) até uma data de vencimento.", category: "Derivativos" },
  { term: "Opção de venda (Put)", definition: "Direito (não obrigação) de vender um ativo a um preço específico (strike) até uma data de vencimento.", category: "Derivativos" },
  { term: "Strike", definition: "Preço de exercício de uma opção. O nível ao qual o detentor pode comprar (call) ou vender (put) o ativo.", category: "Derivativos" },
  { term: "Prêmio", definition: "Valor pago pelo comprador de uma opção ao vendedor. É o custo máximo do comprador de opção.", category: "Derivativos" },
  { term: "Vencimento", definition: "Data em que um contrato (futuro ou opção) expira e precisa ser liquidado ou renovado.", category: "Derivativos" },
  { term: "Mini-índice (WIN)", definition: "Contrato futuro de índice Ibovespa negociado na B3, com valor menor que o contrato cheio (IND).", category: "Derivativos" },
  { term: "Mini-dólar (WDO)", definition: "Contrato futuro de dólar americano negociado na B3, em lotes menores que o contrato padrão.", category: "Derivativos" },
  { term: "Greeks", definition: "Métricas de sensibilidade das opções: Delta (sensibilidade ao preço), Theta (decaimento temporal), Vega (volatilidade).", category: "Derivativos" },
  { term: "Liquidação financeira", definition: "Quando uma posição é encerrada pela corretora por falta de margem, com perda limitada ao capital depositado.", category: "Derivativos" },
];

export const CATEGORIES = Array.from(new Set(GLOSSARY.map((t: any) => t.category))).sort() as GlossaryCategory[];

export function getTermsByLetter(letter: string): GlossaryTerm[] {
  return GLOSSARY.filter((t: any) => t.term.toUpperCase().startsWith(letter.toUpperCase())).sort((a: any, b: any) =>
    a.term.localeCompare(b.term, "pt")
  );
}

export const ALPHABET = Array.from(
  new Set(GLOSSARY.map((t: any) => t.term[0].toUpperCase()))
).sort();
