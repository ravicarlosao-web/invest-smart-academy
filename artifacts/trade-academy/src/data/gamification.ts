/* ══════════════════════════════════════════════
   XP RANKS
══════════════════════════════════════════════ */

export interface XpRank {
  id: string;
  label: string;
  icon: string;
  minXp: number;
  color: string;
  bgColor: string;
}

export const XP_RANKS: XpRank[] = [
  { id: "iniciante",   label: "Iniciante",   icon: "Sprout",     minXp: 0,    color: "text-muted-foreground",  bgColor: "bg-surface-2" },
  { id: "aprendiz",    label: "Aprendiz",    icon: "BookOpen",   minXp: 100,  color: "text-info",               bgColor: "bg-info/15" },
  { id: "trader",      label: "Trader",      icon: "TrendingUp", minXp: 500,  color: "text-primary",            bgColor: "bg-primary/15" },
  { id: "especialista",label: "Especialista",icon: "Target",     minXp: 1000, color: "text-warning",            bgColor: "bg-warning/15" },
  { id: "expert",      label: "Expert",      icon: "Trophy",     minXp: 2500, color: "text-bull",               bgColor: "bg-bull/15" },
];

export function getRank(xp: number): XpRank {
  let rank = XP_RANKS[0];
  for (const r of XP_RANKS) {
    if (xp >= r.minXp) rank = r;
  }
  return rank;
}

export function getNextRank(xp: number): XpRank | null {
  const idx = XP_RANKS.findIndex((r) => r.id === getRank(xp).id);
  return XP_RANKS[idx + 1] ?? null;
}

export function rankProgress(xp: number): number {
  const current = getRank(xp);
  const next = getNextRank(xp);
  if (!next) return 100;
  const range = next.minXp - current.minXp;
  const done = xp - current.minXp;
  return Math.round((done / range) * 100);
}

/* ══════════════════════════════════════════════
   ACHIEVEMENTS
══════════════════════════════════════════════ */

export interface AchievementDef {
  id: string;
  title: string;
  desc: string;
  icon: string;
  category: "aprendizado" | "trading" | "streak" | "especial";
  xpBonus: number;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // Aprendizado
  { id: "first-lesson",    title: "Primeira Aula",        icon: "BookOpenText",  desc: "Conclua sua primeira lição.",            category: "aprendizado", xpBonus: 10 },
  { id: "five-lessons",    title: "Estudante",            icon: "GraduationCap", desc: "Conclua 5 aulas.",                      category: "aprendizado", xpBonus: 20 },
  { id: "ten-lessons",     title: "Dedicado",             icon: "Dumbbell",      desc: "Conclua 10 aulas.",                     category: "aprendizado", xpBonus: 30 },
  { id: "twenty-lessons",  title: "Especialista em Formação", icon: "GraduationCap", desc: "Conclua 20 aulas.",              category: "aprendizado", xpBonus: 50 },
  { id: "all-lessons",     title: "Trilha Completa",      icon: "GraduationCap", desc: "Conclua todas as 40 aulas.",            category: "aprendizado", xpBonus: 200 },
  { id: "perfect-quiz",    title: "Quiz Perfeito",        icon: "BadgeCheck",    desc: "Acerte 100% de um quiz.",              category: "aprendizado", xpBonus: 25 },
  { id: "three-perfects",  title: "Sem Erros",            icon: "Sparkles",      desc: "Acerte 100% em 3 quizzes diferentes.", category: "aprendizado", xpBonus: 50 },
  { id: "level-1-done",    title: "Fundamentos Sólidos",  icon: "Layers",        desc: "Complete o Nível 1 inteiro.",          category: "aprendizado", xpBonus: 30 },
  // Streak
  { id: "streak-3",        title: "3 Dias Seguidos",      icon: "Flame",         desc: "Estude 3 dias consecutivos.",          category: "streak",      xpBonus: 15 },
  { id: "streak-7",        title: "Semana de Fogo",       icon: "Flame",         desc: "Estude 7 dias consecutivos.",          category: "streak",      xpBonus: 35 },
  { id: "streak-14",       title: "Quinzena Imparável",   icon: "Zap",           desc: "Estude 14 dias consecutivos.",         category: "streak",      xpBonus: 75 },
  { id: "streak-30",       title: "Mestre da Disciplina", icon: "Medal",         desc: "Estude 30 dias consecutivos.",         category: "streak",      xpBonus: 150 },
  // Trading
  { id: "first-trade",     title: "Primeiro Trade",       icon: "Rocket",        desc: "Execute seu primeiro trade no simulador.", category: "trading", xpBonus: 10 },
  { id: "first-profit",    title: "Primeiro Lucro",       icon: "DollarSign",    desc: "Feche um trade com lucro.",           category: "trading",     xpBonus: 20 },
  { id: "profit-100",      title: "Lucro de $100",        icon: "DollarSign",    desc: "Acumule $100 de P&L realizado.",      category: "trading",     xpBonus: 30 },
  { id: "profit-500",      title: "Lucro de $500",        icon: "Banknote",      desc: "Acumule $500 de P&L realizado.",      category: "trading",     xpBonus: 50 },
  { id: "trades-10",       title: "10 Trades",            icon: "BarChart2",     desc: "Execute 10 trades no simulador.",     category: "trading",     xpBonus: 20 },
  { id: "trades-50",       title: "50 Trades",            icon: "TrendingUp",    desc: "Execute 50 trades no simulador.",     category: "trading",     xpBonus: 50 },
  { id: "trades-100",      title: "Centenário",           icon: "BadgeCheck",    desc: "Execute 100 trades no simulador.",    category: "trading",     xpBonus: 100 },
  { id: "win-rate-60",     title: "Acerto Consistente",   icon: "Target",        desc: "Alcance 60%+ de taxa de acerto (mín. 10 trades).", category: "trading", xpBonus: 40 },
  { id: "challenge-done",  title: "Desafiador",           icon: "Trophy",        desc: "Conclua qualquer desafio do simulador.", category: "trading",  xpBonus: 75 },
  // Especial
  { id: "xp-100",          title: "100 XP",               icon: "Zap",           desc: "Acumule 100 pontos de experiência.",  category: "especial",    xpBonus: 0 },
  { id: "xp-500",          title: "500 XP",               icon: "Gem",           desc: "Acumule 500 pontos de experiência.",  category: "especial",    xpBonus: 0 },
  { id: "xp-1000",         title: "1000 XP",              icon: "Star",          desc: "Acumule 1000 pontos de experiência.", category: "especial",    xpBonus: 0 },
  { id: "xp-2500",         title: "Expert",               icon: "Crown",         desc: "Acumule 2500 pontos de experiência.", category: "especial",    xpBonus: 0 },
];

export const ACHIEVEMENT_MAP = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));

/* ══════════════════════════════════════════════
   DAILY MISSIONS
══════════════════════════════════════════════ */

export type MissionType = "lessons" | "trades" | "perfect_quiz" | "profitable_trades";

export interface MissionDef {
  id: string;
  label: string;
  target: number;
  type: MissionType;
  xpReward: number;
  icon: string;
}

export const MISSION_POOL: MissionDef[] = [
  { id: "complete-1-lesson",  label: "Conclua 1 aula hoje",         target: 1, type: "lessons",           xpReward: 15, icon: "BookOpenText" },
  { id: "complete-2-lessons", label: "Conclua 2 aulas hoje",        target: 2, type: "lessons",           xpReward: 25, icon: "BookOpen" },
  { id: "make-3-trades",      label: "Faça 3 trades no simulador",  target: 3, type: "trades",            xpReward: 20, icon: "BarChart2" },
  { id: "make-5-trades",      label: "Faça 5 trades no simulador",  target: 5, type: "trades",            xpReward: 30, icon: "TrendingUp" },
  { id: "perfect-quiz-1",     label: "Acerte 100% em 1 quiz",       target: 1, type: "perfect_quiz",      xpReward: 30, icon: "BadgeCheck" },
  { id: "profitable-trade-1", label: "Feche 1 trade com lucro",     target: 1, type: "profitable_trades", xpReward: 20, icon: "DollarSign" },
  { id: "profitable-trade-3", label: "Feche 3 trades com lucro",    target: 3, type: "profitable_trades", xpReward: 35, icon: "Banknote" },
  { id: "make-10-trades",     label: "Faça 10 trades no simulador", target: 10, type: "trades",           xpReward: 50, icon: "Rocket" },
];

/** Selects 3 missions for a given date string (YYYY-MM-DD) using a seeded shuffle */
export function getDailyMissions(dateStr: string): MissionDef[] {
  // simple deterministic seed from date characters
  let seed = dateStr.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const shuffle = (arr: MissionDef[]) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      const j = seed % (i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  return shuffle(MISSION_POOL).slice(0, 3);
}

/* ══════════════════════════════════════════════
   LEADERBOARD (static fake data)
══════════════════════════════════════════════ */

export interface LeaderboardEntry {
  id: string;
  name: string;
  xp: number;
  rankId: string;
  isCurrentUser?: boolean;
}

export const FAKE_LEADERS: Omit<LeaderboardEntry, "isCurrentUser">[] = [
  { id: "1",  name: "Rafael M.",    xp: 4820, rankId: "especialista" },
  { id: "2",  name: "Ana Carolina", xp: 3950, rankId: "especialista" },
  { id: "3",  name: "Bruno T.",     xp: 3410, rankId: "especialista" },
  { id: "4",  name: "Fernanda L.",  xp: 2980, rankId: "especialista" },
  { id: "5",  name: "Gustavo R.",   xp: 2650, rankId: "trader" },
  { id: "6",  name: "Mariana S.",   xp: 2310, rankId: "trader" },
  { id: "7",  name: "Lucas P.",     xp: 1890, rankId: "trader" },
  { id: "8",  name: "Camila A.",    xp: 1540, rankId: "trader" },
  { id: "9",  name: "Pedro H.",     xp: 1220, rankId: "trader" },
  { id: "10", name: "Sofia B.",     xp: 980,  rankId: "aprendiz" },
  { id: "11", name: "Diego F.",     xp: 740,  rankId: "aprendiz" },
  { id: "12", name: "Laís N.",      xp: 530,  rankId: "aprendiz" },
  { id: "13", name: "Caio M.",      xp: 310,  rankId: "aprendiz" },
  { id: "14", name: "Júlia R.",     xp: 190,  rankId: "aprendiz" },
  { id: "15", name: "Thiago C.",    xp: 85,   rankId: "iniciante" },
];

export function buildLeaderboard(userXp: number): (LeaderboardEntry & { rank: number })[] {
  const entries: LeaderboardEntry[] = [
    ...FAKE_LEADERS,
    { id: "me", name: "Você", xp: userXp, rankId: getRank(userXp).id, isCurrentUser: true },
  ].sort((a, b) => b.xp - a.xp);

  return entries.map((e, i) => ({ ...e, rank: i + 1 }));
}
