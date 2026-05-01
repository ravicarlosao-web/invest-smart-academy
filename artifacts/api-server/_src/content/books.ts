// @ts-nocheck
/**
 * Catálogo de livros da Biblioteca.
 * Cada livro tem `order` que define a sequência de desbloqueio.
 * Livros com `docxFile` são carregados via mammoth a partir de /books/<file>.
 * Livros com `content` têm HTML incorporado (demo/amostra).
 */

export interface BookMeta {
  id:          string;
  order:       number;
  title:       string;
  author:      string;
  cover:       string;      // lucide icon name
  category:    string;
  description: string;
  pages:       number;      // estimativa para exibição
  docxFile?:   string;      // nome do ficheiro em public/books/
  content?:    string;      // HTML incorporado (fallback quando não há docx)
}

export const BOOKS_CATALOG: BookMeta[] = [
  {
    id:       "fundamentos-mercado",
    order:    1,
    title:    "Fundamentos do Mercado Financeiro",
    author:   "TradeAcademy",
    cover:    "TrendingUp",
    category: "Iniciante",
    description:
      "Do zero ao básico: entenda como os mercados funcionam, quais são os principais activos e como começar a operar com segurança.",
    pages: 48,
    content: `
<h1>Fundamentos do Mercado Financeiro</h1>
<p class="book-lead">Este livro é o ponto de partida para qualquer pessoa que queira entender o mundo do trading e dos investimentos. Aqui você vai aprender como os mercados financeiros funcionam, quais são os principais tipos de activos e como começar a operar com responsabilidade.</p>

<h2>Capítulo 1 — O que são os Mercados Financeiros?</h2>
<p>Os mercados financeiros são ambientes — físicos ou digitais — onde compradores e vendedores trocam activos financeiros como acções, moedas, títulos e commodities. Eles existem para facilitar a alocação eficiente de capital na economia.</p>
<p>Existem três funções principais dos mercados financeiros:</p>
<ul>
  <li><strong>Liquidez:</strong> permitem que os participantes comprem e vendam activos rapidamente.</li>
  <li><strong>Formação de preços:</strong> o preço de um activo é determinado pela oferta e pela procura em tempo real.</li>
  <li><strong>Transferência de risco:</strong> permitem que investidores transfiram risco para quem está disposto a assumi-lo.</li>
</ul>
<p>Os mercados modernos operam quase 24 horas por dia (especialmente Forex e cripto), com trilhões de dólares negociados diariamente.</p>

<h2>Capítulo 2 — Tipos de Mercados</h2>
<h3>2.1 Mercado de Acções (Bolsa de Valores)</h3>
<p>O mercado de acções permite comprar e vender fracções de empresas. Quando você compra uma acção, torna-se sócio da empresa e pode lucrar de duas formas: com a valorização do papel e com os dividendos pagos.</p>
<p>Exemplos de bolsas: NYSE, NASDAQ (EUA), B3 (Brasil), LSE (Reino Unido).</p>

<h3>2.2 Mercado Forex (Câmbio)</h3>
<p>O mercado de câmbio (Forex – Foreign Exchange) é o maior mercado financeiro do mundo, com um volume diário superior a 6 trilhões de dólares. Aqui, as moedas são negociadas em pares: EUR/USD, GBP/JPY, USD/BRL, etc.</p>
<p>O Forex funciona 24 horas por dia, 5 dias por semana, e é dominado por bancos, fundos de investimento e traders individuais.</p>

<h3>2.3 Mercado de Criptomoedas</h3>
<p>As criptomoedas são activos digitais descentralizados baseados em tecnologia blockchain. O Bitcoin (BTC) foi a primeira criptomoeda, criada em 2009. Hoje existem mais de 20.000 criptomoedas, sendo as mais relevantes BTC, ETH, BNB e SOL.</p>
<p>O mercado cripto opera 24/7 e é caracterizado pela alta volatilidade — o que representa tanto oportunidade quanto risco elevado.</p>

<h3>2.4 Commodities</h3>
<p>Commodities são matérias-primas como ouro, petróleo, milho e café. São negociadas em mercados futuros e influenciam directamente a economia global. Trader de ouro (XAU/USD) é um dos mais populares entre os trader de Forex.</p>

<h2>Capítulo 3 — Como Funcionam as Ordens</h2>
<p>Para operar em qualquer mercado, é necessário enviar <strong>ordens</strong> à corretora. Existem vários tipos:</p>

<h3>3.1 Ordem a Mercado (Market Order)</h3>
<p>Executa imediatamente ao preço disponível no momento. É a forma mais simples de entrar ou sair de uma posição, mas pode sofrer <em>slippage</em> (diferença entre o preço esperado e o executado) em mercados com pouca liquidez.</p>

<h3>3.2 Ordem Limite (Limit Order)</h3>
<p>Define um preço máximo (compra) ou mínimo (venda). A ordem só será executada se o preço chegar ao nível definido. Útil para entrar em posições em pontos estratégicos sem precisar monitorar o mercado constantemente.</p>

<h3>3.3 Ordem Stop</h3>
<p>Activa uma ordem de compra ou venda quando o preço atinge um nível específico. Muito usado para <strong>stop-loss</strong> (limite de perda) e <strong>break-even</strong> (mover o stop para o ponto de entrada após lucro inicial).</p>

<h3>3.4 OCO (One Cancels Other)</h3>
<p>Combina duas ordens: quando uma é executada, a outra é automaticamente cancelada. Ideal para definir take-profit e stop-loss simultaneamente.</p>

<h2>Capítulo 4 — Conceitos Fundamentais de Preço</h2>
<h3>4.1 Bid e Ask (Compra e Venda)</h3>
<p>O <strong>Bid</strong> é o preço pelo qual o mercado compra o activo de você (você vende). O <strong>Ask</strong> é o preço pelo qual o mercado vende para você (você compra). A diferença entre eles chama-se <strong>spread</strong> e é a principal forma de remuneração das corretoras em Forex.</p>

<h3>4.2 Pip e Ponto</h3>
<p>No Forex, o <strong>pip</strong> (percentage in point) é a menor variação de preço significativa. Para a maioria dos pares com 4 casas decimais, 1 pip = 0,0001. Para USD/JPY, 1 pip = 0,01.</p>
<p>No mercado de acções e cripto, costuma-se falar em <strong>pontos</strong> ou <strong>ticks</strong>.</p>

<h3>4.3 Lote e Tamanho de Posição</h3>
<p>No Forex, as operações são medidas em <strong>lotes</strong>:</p>
<ul>
  <li>Lote padrão = 100.000 unidades da moeda base</li>
  <li>Mini lote = 10.000 unidades</li>
  <li>Micro lote = 1.000 unidades</li>
</ul>
<p>O tamanho correcto do lote é fundamental para a gestão de risco — nunca arrisque mais do que você pode perder.</p>

<h2>Capítulo 5 — Gestão de Risco: O Pilar do Trading</h2>
<p>A gestão de risco é, sem dúvida, o aspecto mais importante do trading. Traders profissionais não são lucrativos porque acertam sempre — são lucrativos porque perdem pouco quando erram e ganham mais quando acertam.</p>

<h3>5.1 A Regra do 1-2%</h3>
<p>Nunca arrisque mais de <strong>1% a 2% do seu capital total</strong> em uma única operação. Se você tem $10.000, o risco máximo por trade deve ser de $100 a $200. Isso garante que mesmo uma série de 10 perdas consecutivas não destrua sua conta.</p>

<h3>5.2 Relação Risco/Retorno (R:R)</h3>
<p>Antes de entrar em qualquer trade, calcule a relação entre o risco potencial e o retorno esperado. Uma R:R de 1:2 significa que para cada $1 arriscado, você espera ganhar $2. Com uma taxa de acerto de apenas 40%, uma estratégia com R:R de 1:2 ainda é lucrativa.</p>

<h3>5.3 Stop-Loss Obrigatório</h3>
<p>O stop-loss é a ordem que fecha automaticamente uma posição quando o mercado vai contra você até um determinado ponto. <strong>Jamais opere sem stop-loss.</strong> Ele é o seu sistema de segurança — sem ele, uma única operação pode eliminar meses de ganhos.</p>

<h3>5.4 Drawdown</h3>
<p>O drawdown mede a queda máxima do seu capital desde o pico mais alto até o ponto mais baixo. Um drawdown de 20% exige um ganho de 25% para recuperar o nível anterior. Um drawdown de 50% exige 100% de retorno para recuperar. Controle o drawdown com disciplina.</p>

<h2>Capítulo 6 — A Psicologia do Trader</h2>
<p>Os mercados financeiros são uma das poucas arenas onde a sua maior inimiga é você mesmo. As emoções — medo, ganância, euforia e desespero — sabotam mesmo as melhores estratégias.</p>

<h3>6.1 As Armadilhas Emocionais</h3>
<ul>
  <li><strong>FOMO (Fear of Missing Out):</strong> entrar em trades por medo de "perder o movimento", sem análise.</li>
  <li><strong>Revenge Trading:</strong> operar de forma irracional após uma perda para "recuperar" rapidamente.</li>
  <li><strong>Overconfidence:</strong> excesso de confiança após uma sequência de ganhos, levando a riscos excessivos.</li>
  <li><strong>Paralisia:</strong> incapacidade de executar trades por medo de perder, mesmo com sinal claro.</li>
</ul>

<h3>6.2 Como Desenvolver Disciplina</h3>
<p>A disciplina no trading se constrói com <strong>plano de trading</strong>, <strong>diário de operações</strong> e <strong>regras claras</strong>. Anote cada trade: por que entrou, por que saiu, o que aprendeu. Com o tempo, padrões surgirão e você poderá melhorar sua estratégia com dados reais.</p>

<h2>Conclusão</h2>
<p>Os fundamentos do mercado financeiro são a base que sustenta qualquer estratégia de trading bem-sucedida. Antes de operar com dinheiro real, domine estes conceitos, pratique no simulador e desenvolva disciplina emocional.</p>
<p><strong>Lembre-se:</strong> trading não é um esquema para enriquecer rapidamente. É uma habilidade que se desenvolve com estudo, prática e paciência. Os melhores traders do mundo passaram anos aprendendo antes de serem consistentemente lucrativos.</p>
<p>No próximo livro, mergulharemos na Análise Técnica — a arte de ler gráficos e identificar oportunidades de alta probabilidade.</p>
`,
  },

  {
    id:       "analise-tecnica",
    order:    2,
    title:    "Análise Técnica: O Guia Completo",
    author:   "TradeAcademy",
    cover:    "BarChart2",
    category: "Intermediário",
    description:
      "Aprenda a ler gráficos como um profissional: suporte e resistência, candlesticks, médias móveis, RSI, MACD e os padrões gráficos mais lucrativos.",
    pages:    72,
    content: `
<h1>Análise Técnica: O Guia Completo</h1>
<p class="book-lead">A análise técnica é o estudo dos movimentos de preço através de gráficos e indicadores. Ao contrário da análise fundamentalista (que estuda dados económicos das empresas), a análise técnica parte do princípio de que <em>tudo está reflectido no preço</em> e que padrões históricos tendem a se repetir.</p>

<h2>Capítulo 1 — Princípios da Análise Técnica</h2>
<p>A análise técnica repousa sobre três premissas fundamentais, estabelecidas por Charles Dow no final do século XIX:</p>
<ol>
  <li><strong>O preço desconta tudo:</strong> toda informação disponível — económica, política, psicológica — já está reflectida no preço actual.</li>
  <li><strong>Os preços movem-se em tendências:</strong> uma vez estabelecida, uma tendência tem maior probabilidade de continuar do que de reverter.</li>
  <li><strong>A história se repete:</strong> os padrões gráficos funcionam porque reflectem a psicologia humana, que não muda.</li>
</ol>

<h2>Capítulo 2 — Lendo Gráficos de Candlestick</h2>
<p>O gráfico de candlestick (velas japonesas) é o formato mais usado no trading moderno. Cada vela representa um período de tempo e contém quatro informações:</p>
<ul>
  <li><strong>Abertura (Open):</strong> preço no início do período.</li>
  <li><strong>Fechamento (Close):</strong> preço no fim do período.</li>
  <li><strong>Máxima (High):</strong> preço mais alto atingido.</li>
  <li><strong>Mínima (Low):</strong> preço mais baixo atingido.</li>
</ul>
<p>Uma vela verde (ou branca) indica que o fechamento foi acima da abertura — período de alta. Uma vela vermelha (ou preta) indica queda.</p>

<h3>2.1 Padrões de Reversão de Alta</h3>
<p><strong>Martelo (Hammer):</strong> vela com corpo pequeno no topo e sombra inferior longa (pelo menos 2x o corpo). Aparece no fundo de uma queda e sinaliza possível reversão para cima. Quanto mais longa a sombra inferior, mais forte o sinal.</p>
<p><strong>Engolfo de Alta (Bullish Engulfing):</strong> uma vela vermelha seguida de uma vela verde maior que "engole" completamente a vela anterior. Um dos padrões de reversão mais confiáveis, especialmente em suportes importantes.</p>
<p><strong>Morning Star (Estrela da Manhã):</strong> sequência de três velas: uma longa vermelha, uma vela de indecisão (doji ou pequena) e uma longa verde. Sinal forte de reversão após tendência de baixa.</p>

<h3>2.2 Padrões de Reversão de Baixa</h3>
<p><strong>Estrela Cadente (Shooting Star):</strong> vela com corpo pequeno na base e sombra superior longa. Aparece no topo de uma alta e sinaliza possível reversão para baixo.</p>
<p><strong>Engolfo de Baixa (Bearish Engulfing):</strong> vela verde seguida de vela vermelha maior. Indica que os vendedores tomaram o controle após período de alta.</p>
<p><strong>Evening Star (Estrela da Tarde):</strong> oposto do Morning Star — sinal de reversão no topo de uma tendência de alta.</p>

<h3>2.3 Doji — O Sinal de Indecisão</h3>
<p>O doji é uma vela cujo preço de abertura e fechamento são (quase) iguais, resultando em corpo muito pequeno ou inexistente. Representa um equilíbrio perfeito entre compradores e vendedores. Num contexto de tendência, o doji sinaliza possível pausa ou reversão.</p>

<h2>Capítulo 3 — Suporte e Resistência</h2>
<p>Suporte e resistência são os conceitos mais fundamentais da análise técnica. São níveis de preço onde o mercado tende a parar, reverter ou consolidar.</p>

<h3>3.1 O que é Suporte</h3>
<p>O <strong>suporte</strong> é um nível de preço onde a procura é forte o suficiente para impedir que o preço caia mais. É o "chão" do mercado — quando o preço toca este nível, os compradores entram em massa e o preço sobe.</p>

<h3>3.2 O que é Resistência</h3>
<p>A <strong>resistência</strong> é o oposto — um nível onde a oferta supera a procura, impedindo que o preço suba mais. É o "tecto" do mercado.</p>

<h3>3.3 Troca de Polaridade</h3>
<p>Um dos conceitos mais poderosos da análise técnica: quando um nível de suporte é rompido, ele torna-se resistência. E vice-versa. Este fenómeno chama-se <strong>troca de polaridade</strong> e é extremamente útil para identificar pontos de entrada e saída.</p>

<h3>3.4 Zonas vs. Níveis Precisos</h3>
<p>Na prática, suporte e resistência funcionam melhor como <strong>zonas</strong> do que como linhas exactas. O mercado raramente respeita um número preciso — mas respeita uma região de preço. Trabalhe com zonas de 10-30 pips de largura no Forex.</p>

<h2>Capítulo 4 — Tendências e Estrutura de Mercado</h2>
<h3>4.1 Identificando a Tendência</h3>
<p>Uma <strong>tendência de alta</strong> é caracterizada por topos e fundos cada vez mais altos (Higher Highs e Higher Lows). Uma <strong>tendência de baixa</strong> tem topos e fundos cada vez mais baixos (Lower Highs e Lower Lows).</p>
<p>Quando o mercado não apresenta uma direcção clara — oscilando lateralmente — está em <strong>consolidação</strong> (range). Em range, a estratégia é comprar no suporte e vender na resistência.</p>

<h3>4.2 Linhas de Tendência</h3>
<p>Uma linha de tendência de alta é desenhada ligando dois ou mais fundos ascendentes. Quanto mais vezes o preço tocar a linha sem romper, mais válida ela é. O rompimento de uma linha de tendência é um sinal de possível mudança de direcção.</p>

<h3>4.3 Canais de Preço</h3>
<p>Um canal é formado por duas linhas paralelas que contêm o movimento do preço. Em canais de alta, compras próximas à linha inferior e saídas próximas à linha superior. Em canais de baixa, a estratégia oposta.</p>

<h2>Capítulo 5 — Médias Móveis</h2>
<p>As médias móveis são um dos indicadores mais utilizados no mundo. Elas suavizam os dados de preço para identificar a tendência de forma mais clara.</p>

<h3>5.1 Média Móvel Simples (SMA)</h3>
<p>A SMA calcula a média aritmética dos preços de fechamento em N períodos. A SMA de 200 períodos é considerada a "linha da morte/vida" — preço acima da SMA200 indica tendência de alta de longo prazo; abaixo, tendência de baixa.</p>

<h3>5.2 Média Móvel Exponencial (EMA)</h3>
<p>A EMA dá mais peso aos preços recentes, tornando-a mais reactiva do que a SMA. As EMAs de 9, 21 e 50 períodos são amplamente usadas para identificar tendências de curto e médio prazo.</p>

<h3>5.3 Golden Cross e Death Cross</h3>
<p>O <strong>Golden Cross</strong> ocorre quando a EMA rápida (ex: 50) cruza acima da EMA lenta (ex: 200) — sinal de alta de longo prazo. O <strong>Death Cross</strong> é o oposto — sinal de baixa. Estes cruzamentos são sinais de entrada populares, mas lentos — combine com outros indicadores para confirmar.</p>

<h2>Capítulo 6 — Indicadores de Momentum</h2>
<h3>6.1 RSI (Relative Strength Index)</h3>
<p>O RSI mede a velocidade e magnitude das variações de preço numa escala de 0 a 100. Valores acima de 70 indicam <strong>sobrecompra</strong> (possível reversão de baixa); valores abaixo de 30 indicam <strong>sobrevenda</strong> (possível reversão de alta).</p>
<p>Porém, use o RSI com cuidado em tendências fortes — em tendências de alta, o RSI pode permanecer em sobrecompra por longos períodos. A <strong>divergência</strong> do RSI (preço faz novos máximos mas RSI não) é um dos sinais mais poderosos da análise técnica.</p>

<h3>6.2 MACD (Moving Average Convergence Divergence)</h3>
<p>O MACD é composto por três elementos:</p>
<ul>
  <li><strong>Linha MACD:</strong> diferença entre EMA de 12 e EMA de 26 períodos.</li>
  <li><strong>Linha de Sinal:</strong> EMA de 9 períodos da linha MACD.</li>
  <li><strong>Histograma:</strong> diferença entre a linha MACD e a linha de sinal.</li>
</ul>
<p>O cruzamento da linha MACD acima da linha de sinal é um sinal de compra; abaixo é sinal de venda. Assim como o RSI, a divergência do MACD com o preço é um sinal de reversão de alta confiabilidade.</p>

<h2>Capítulo 7 — Padrões Gráficos</h2>
<h3>7.1 Padrões de Continuação</h3>
<p><strong>Triângulo Ascendente:</strong> resistência horizontal com fundos ascendentes. Indica acumulação de compradores. O rompimento da resistência é tipicamente forte e direcional.</p>
<p><strong>Bandeira (Flag):</strong> breve consolidação em canal levemente contrário à tendência principal, após um movimento forte. É um padrão de continuação muito confiável.</p>
<p><strong>Cunha (Wedge):</strong> canal convergente. Cunha de alta em tendência de alta é sinal de continuação; cunha de alta em tendência de baixa pode ser sinal de reversão.</p>

<h3>7.2 Padrões de Reversão</h3>
<p><strong>Cabeça e Ombros:</strong> um dos padrões mais famosos. Três topos: ombro esquerdo, cabeça (mais alto), ombro direito. O rompimento da "linha do pescoço" (neckline) confirma a reversão de alta para baixa. O alvo é medido pela altura da cabeça acima da neckline.</p>
<p><strong>Duplo Topo / Duplo Fundo:</strong> o preço testa o mesmo nível duas vezes e falha em romper. Padrão "M" (duplo topo) indica reversão de baixa; padrão "W" (duplo fundo) indica reversão de alta.</p>

<h2>Capítulo 8 — Bollinger Bands</h2>
<p>As Bandas de Bollinger consistem em uma SMA central e duas bandas que representam 2 desvios padrão acima e abaixo. Quando o preço toca a banda superior, pode estar sobrecomprado; quando toca a inferior, pode estar sobrevendido.</p>
<p>O <strong>Bollinger Squeeze</strong> (quando as bandas ficam muito próximas) indica compressão de volatilidade — geralmente seguida de um movimento forte. É uma das configurações mais poderosas para antecipar grandes movimentos.</p>

<h2>Capítulo 9 — Volume</h2>
<p>O volume confirma os movimentos de preço. Um rompimento com alto volume é mais confiável do que um rompimento com baixo volume. Tendências de alta saudáveis têm volume crescente nas altas e decrescente nas correcções.</p>
<p>O <strong>OBV (On-Balance Volume)</strong> acumula o volume dos dias de alta e subtrai o dos dias de baixa — divergências entre OBV e preço são sinais importantes de fraqueza ou força oculta.</p>

<h2>Capítulo 10 — Montando uma Estratégia Completa</h2>
<p>Uma estratégia de trading eficaz combina múltiplos elementos:</p>
<ol>
  <li><strong>Identificar o contexto:</strong> qual é a tendência no timeframe superior? (Ex: H4 ou Diário)</li>
  <li><strong>Encontrar a zona:</strong> identificar suporte/resistência relevante no timeframe de análise.</li>
  <li><strong>Aguardar o sinal:</strong> padrão de candlestick ou confluência de indicadores na zona.</li>
  <li><strong>Definir a entrada:</strong> ordem a mercado ou limite na zona de interesse.</li>
  <li><strong>Definir o stop:</strong> abaixo do suporte (compra) ou acima da resistência (venda).</li>
  <li><strong>Definir o alvo:</strong> próxima zona de suporte/resistência significativa, com R:R mínimo de 1:2.</li>
</ol>

<h2>Conclusão</h2>
<p>A análise técnica é uma ferramenta poderosa — mas não infalível. Nenhum indicador ou padrão funciona 100% do tempo. O objetivo não é ter razão sempre, mas ter uma <strong>edge estatística</strong>: quando funcionar, ganhar mais do que perder quando falhar.</p>
<p>Combine a análise técnica com uma gestão de risco rigorosa, um plano de trading claro e disciplina emocional. Com isso, você terá todos os elementos para operar de forma profissional.</p>
<p>Nas próximas obras da nossa biblioteca, exploraremos estratégias avançadas, gestão de portfólio e a psicologia do trader de alta performance.</p>
`,
  },

  {
    id:       "gestao-portfolio",
    order:    3,
    title:    "Gestão de Portfólio e Capital",
    author:   "TradeAcademy",
    cover:    "Briefcase",
    category: "Avançado",
    description:
      "Em breve — este livro será adicionado à biblioteca. Complete os livros anteriores para desbloqueá-lo.",
    pages:    60,
    docxFile: "gestao-portfolio.docx",
    content: `
<h1>Gestão de Portfólio e Capital</h1>
<p class="book-lead">Este livro explora técnicas avançadas de alocação de capital, diversificação, correlação entre activos e métricas de performance usadas por gestores profissionais.</p>
<p><em>Conteúdo completo disponível em breve. Adicione o ficheiro <code>gestao-portfolio.docx</code> à pasta <code>public/books/</code> para activar a leitura completa.</em></p>
`,
  },
];

export function isBookUnlocked(bookId: string, completedBookIds: string[]): boolean {
  const book = BOOKS_CATALOG.find((b: any) => b.id === bookId);
  if (!book) return false;
  if (book.order === 1) return true;
  const prev = BOOKS_CATALOG.find((b: any) => b.order === book.order - 1);
  if (!prev) return true;
  return completedBookIds.includes(prev.id);
}
