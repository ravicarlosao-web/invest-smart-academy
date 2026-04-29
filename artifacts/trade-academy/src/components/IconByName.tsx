import type { LucideProps } from "lucide-react";
import {
  Activity, AlertTriangle, ArrowLeftRight, BadgeCheck, Banknote, BarChart2,
  Bell, Bitcoin, BookOpen, BookOpenText, Bot, Brain, Briefcase, CheckCircle2,
  Crown, DollarSign, Dumbbell, FileText, Flame, Gem, GraduationCap,
  Layers, Lock, Medal, Moon, PartyPopper, Rocket, Shield, Shuffle,
  Sparkles, Sprout, Star, Sun, Target, Telescope, TrendingDown, TrendingUp,
  Trophy, Waves, XCircle, Zap,
} from "lucide-react";

const ICONS: Record<string, React.ComponentType<LucideProps>> = {
  Activity, AlertTriangle, ArrowLeftRight, BadgeCheck, Banknote, BarChart2,
  Bell, Bitcoin, BookOpen, BookOpenText, Bot, Brain, Briefcase, CheckCircle2,
  Crown, DollarSign, Dumbbell, FileText, Flame, Gem, GraduationCap,
  Layers, Lock, Medal, Moon, PartyPopper, Rocket, Shield, Shuffle,
  Sparkles, Sprout, Star, Sun, Target, Telescope, TrendingDown, TrendingUp,
  Trophy, Waves, XCircle, Zap,
};

interface Props extends LucideProps {
  name: string;
}

export function IconByName({ name, ...props }: Props) {
  const Icon = ICONS[name];
  if (!Icon) return null;
  return <Icon {...props} />;
}
