import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Bell, X, Trophy, Zap, TrendingUp, Info, CheckCircle2, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAppStore } from "@/store/useAppStore";
import { ACHIEVEMENT_MAP } from "@/data/gamification";
import { randomMarketAlert } from "@/data/notifications";

const TYPE_ICON: Record<string, React.ReactNode> = {
  achievement: <Trophy className="h-4 w-4 text-warning" />,
  mission:     <CheckCircle2 className="h-4 w-4 text-primary" />,
  market:      <TrendingUp className="h-4 w-4 text-bull" />,
  system:      <Info className="h-4 w-4 text-muted-foreground" />,
  duelo:       <Swords className="h-4 w-4 text-purple-400" />,
};

function fmtTime(ts: number) {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "agora";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
  return `${Math.floor(diff / 86_400_000)}d`;
}

export function NotificationCenter() {
  const notifications   = useAppStore((s) => s.notifications);
  const achievements    = useAppStore((s) => s.progress.achievements);
  const seenAchievements = useAppStore((s) => s.seenAchievements);
  const addNotification = useAppStore((s) => s.addNotification);
  const markAllRead     = useAppStore((s) => s.markAllRead);
  const dismiss         = useAppStore((s) => s.dismissNotification);
  const markSeen        = useAppStore((s) => s.markAchievementsSeen);

  const unread = notifications.filter((n) => !n.read).length;

  // -- Detect newly unlocked achievements and push notifications --
  const prevSeen = useRef<Set<string>>(new Set(seenAchievements));
  useEffect(() => {
    const newlyUnlocked = achievements.filter((id) => !prevSeen.current.has(id));
    if (newlyUnlocked.length === 0) return;
    for (const id of newlyUnlocked) {
      const ach = ACHIEVEMENT_MAP[id];
      if (!ach) continue;
      addNotification({
        type: "achievement",
        title: `🏆 Conquista desbloqueada!`,
        message: `${ach.emoji} ${ach.title} — +${ach.xpBonus} XP`,
        link: "/perfil",
      });
    }
    prevSeen.current = new Set([...prevSeen.current, ...newlyUnlocked]);
    markSeen(newlyUnlocked);
  }, [achievements, addNotification, markSeen]);

  // -- Simulated market alerts every 3-5 minutes --
  const alertTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    function scheduleNext() {
      const delay = 180_000 + Math.random() * 120_000; // 3-5 min
      alertTimer.current = setTimeout(() => {
        addNotification(randomMarketAlert());
        scheduleNext();
      }, delay);
    }
    scheduleNext();
    return () => { if (alertTimer.current) clearTimeout(alertTimer.current); };
  }, [addNotification]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8"
          aria-label="Notificações"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Notificações</span>
            {unread > 0 && (
              <span className="rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-bold text-destructive-foreground">
                {unread}
              </span>
            )}
          </div>
          {unread > 0 && (
            <button
              onClick={markAllRead}
              className="text-[11px] font-medium text-primary hover:underline"
            >
              Marcar todas como lidas
            </button>
          )}
        </div>

        {/* List */}
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <Zap className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Sem notificações de momento.</p>
              <p className="text-xs text-muted-foreground/60">
                Conclui aulas e trades para receber alertas!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`group flex gap-3 px-4 py-3 transition-colors hover:bg-surface-1 ${
                    !n.read ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {TYPE_ICON[n.type] ?? <Info className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    {n.link ? (
                      <Link to={n.link} className="block">
                        <p className={`text-xs font-semibold ${!n.read ? "text-foreground" : "text-muted-foreground"}`}>
                          {n.title}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{n.message}</p>
                      </Link>
                    ) : (
                      <>
                        <p className={`text-xs font-semibold ${!n.read ? "text-foreground" : "text-muted-foreground"}`}>
                          {n.title}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{n.message}</p>
                      </>
                    )}
                    <p className="mt-1 text-[10px] text-muted-foreground/50">{fmtTime(n.createdAt)}</p>
                  </div>
                  <button
                    onClick={() => dismiss(n.id)}
                    className="mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Dispensar"
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
