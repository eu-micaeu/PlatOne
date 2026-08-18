import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Heart, LoaderCircle, RefreshCw, Sparkles, Trophy, User } from 'lucide-react';
import type { FriendActivityItem } from '../types/app';

type FriendsActivityFeedProps = {
  authToken: string | null;
  onNavigateToProfile: (username: string) => void;
};

export default function FriendsActivityFeed({
  authToken,
  onNavigateToProfile,
}: FriendsActivityFeedProps) {
  const [feedItems, setFeedItems] = useState<FriendActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reactions, setReactions] = useState<Record<string, { count: number; userLiked: boolean }>>({});

  const fetchFeed = async () => {
    if (!authToken) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/friends/activity-feed', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (!res.ok) {
        throw new Error('Falha ao carregar feed dos amigos.');
      }

      const data = (await res.json()) as { feed: FriendActivityItem[] };
      const items = data.feed || [];
      setFeedItems(items);

      const initialReactions: Record<string, { count: number; userLiked: boolean }> = {};
      items.forEach((item) => {
        initialReactions[item.id] = {
          count: item.likesCount || 0,
          userLiked: Boolean(item.userLiked),
        };
      });
      setReactions(initialReactions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar feed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [authToken]);

  const toggleLike = (itemId: string) => {
    setReactions((prev) => {
      const current = prev[itemId] || { count: 0, userLiked: false };
      return {
        ...prev,
        [itemId]: {
          count: current.userLiked ? Math.max(0, current.count - 1) : current.count + 1,
          userLiked: !current.userLiked,
        },
      };
    });
  };

  const formatTimeAgo = (isoDate: string) => {
    try {
      const date = new Date(isoDate);
      const diffMs = Date.now() - date.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMinutes < 5) return 'Agora mesmo';
      if (diffMinutes < 60) return `há ${diffMinutes} min`;
      if (diffHours < 24) return `há ${diffHours}h`;
      if (diffDays === 1) return 'Ontem';
      return `há ${diffDays} dias`;
    } catch {
      return 'Recente';
    }
  };

  if (loading) {
    return (
      <div className="glass-panel flex h-48 flex-col items-center justify-center gap-2 p-6">
        <LoaderCircle className="animate-spin text-[var(--text-soft)]" size={28} />
        <span className="font-mono text-xs uppercase text-[var(--text-soft)]">Carregando conquistas dos amigos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel p-6 border-red-500/30">
        <p className="font-display text-base font-semibold text-red-500">Erro ao carregar feed</p>
        <p className="mt-1 text-xs text-[var(--text-soft)]">{error}</p>
        <button
          type="button"
          onClick={fetchFeed}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-black/10 dark:border-white/10 px-3 py-1.5 font-mono text-xs text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/10"
        >
          <RefreshCw size={12} />
          Tentar novamente
        </button>
      </div>
    );
  }

  if (feedItems.length === 0) {
    return (
      <div className="glass-panel flex flex-col items-center justify-center p-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/5 dark:bg-white/5 text-[var(--text-soft)] mb-3">
          <Sparkles size={24} />
        </div>
        <h3 className="font-display text-lg font-bold text-[var(--text-main)]">Nenhuma atividade recente</h3>
        <p className="mt-1 text-xs text-[var(--text-soft)] max-w-sm">
          Adicione amigos no PlatOne para acompanhar em tempo real as novas conquistas e platinas da sua rede!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--ink-main)] text-white dark:bg-white dark:text-black">
            <Sparkles size={14} />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold tracking-tight text-[var(--text-main)]">
              Feed de Conquistas dos Amigos
            </h2>
            <p className="text-xs text-[var(--text-soft)]">
              Últimas atualizações e platinas conquistadas pela sua rede
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchFeed}
          className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-[var(--text-soft)] hover:text-[var(--text-main)] transition-colors"
          title="Atualizar Feed"
        >
          <RefreshCw size={12} />
          <span>Atualizar</span>
        </button>
      </div>

      <div className="space-y-3">
        {feedItems.map((item, index) => {
          const reaction = reactions[item.id] || { count: 0, userLiked: false };

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: index * 0.04 }}
              className="glass-panel p-3.5 sm:p-4 border border-black/10 dark:border-white/10 hover:border-[var(--text-main)] transition-all"
            >
              {/* Header: Friend info */}
              <div className="flex items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={() => onNavigateToProfile(item.friendName)}
                  className="flex items-center gap-2.5 text-left group min-w-0"
                >
                  <div className="h-8 w-8 sm:h-9 sm:w-9 overflow-hidden rounded-full border border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/5 flex-shrink-0">
                    {item.friendAvatarUrl ? (
                      <img src={item.friendAvatarUrl} alt={item.friendName} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[var(--text-soft)]">
                        <User size={16} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="font-display text-xs sm:text-sm font-bold text-[var(--text-main)] group-hover:underline truncate block">
                      {item.friendName}
                    </span>
                    <span className="font-mono text-[9px] sm:text-[10px] text-[var(--text-soft)]">
                      {formatTimeAgo(item.timestamp)}
                    </span>
                  </div>
                </button>

                <span className="shrink-0 rounded-md border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[var(--text-soft)] font-bold">
                  {item.platform}
                </span>
              </div>

              {/* Body: Game & Achievement highlight */}
              <div className="mt-3 flex items-center gap-3 rounded-xl border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 p-2.5 sm:p-3">
                <img
                  src={item.gameIcon}
                  alt={item.gameTitle}
                  className="h-12 w-12 sm:h-14 sm:w-14 rounded-lg object-cover border border-black/10 dark:border-white/15 flex-shrink-0 shadow-xs"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="font-display text-xs sm:text-sm font-bold text-[var(--text-main)] truncate">
                    {item.gameTitle}
                  </h4>

                  {item.isPlatinum ? (
                    <div className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 font-mono text-[9px] sm:text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">
                      <Trophy size={11} />
                      <span>Platinou! 100% 🏆</span>
                    </div>
                  ) : (
                    <div className="mt-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <div className="h-1.5 w-full sm:max-w-[120px] overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                        <div
                          className="h-full bg-[var(--text-main)]"
                          style={{
                            width: `${Math.round((item.unlockedCount / item.totalAchievements) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="font-mono text-[9px] sm:text-[10px] text-[var(--text-soft)] font-medium">
                        {item.unlockedCount}/{item.totalAchievements} ({Math.round((item.unlockedCount / item.totalAchievements) * 100)}%)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer: Reactions */}
              <div className="mt-2.5 flex items-center justify-between border-t border-black/5 dark:border-white/5 pt-2 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleLike(item.id)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-mono text-xs transition-all active:scale-95 ${
                      reaction.userLiked
                        ? 'bg-red-500/10 text-red-500 font-bold border border-red-500/20'
                        : 'text-[var(--text-soft)] hover:text-red-500 hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <Heart size={14} className={reaction.userLiked ? 'fill-red-500' : ''} />
                    <span>{reaction.count}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleLike(item.id)}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-mono text-xs text-[var(--text-soft)] hover:text-amber-500 hover:bg-black/5 dark:hover:bg-white/5 transition-colors active:scale-95"
                  >
                    <Trophy size={13} />
                    <span>Parabéns</span>
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
