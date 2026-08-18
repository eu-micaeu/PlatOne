import { useState, type JSX, type ReactNode, type SyntheticEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import GameCard from '../components/GameCard';
import { Award, Check, Eye, Gamepad2, LoaderCircle, Pin, Share2, ShieldCheck, Trophy } from 'lucide-react';

import type { AuthUser, Platinum, Stats, SteamStatus } from '../types/app';

type ProfilePageProps = {
  user: AuthUser | null;
  userInitials: string;
  steamStatus: SteamStatus;
  steamLoading: boolean;
  loadingData: boolean;
  steamError: string | null;
  stats: Stats | null;
  profilePlatinums: Platinum[];
  recentProfileGames: Platinum[];
  almostPlatinumGames: Platinum[];
  progressGames: number;
  monthlyPlatinums: number;
  onSyncSteam: () => void;
  onConnectSteam: () => void;
  onDisconnectSteam: () => void;
  onOpenGameDetails: (game: Platinum) => void;
  handleGameImageError: (event: SyntheticEvent<HTMLImageElement>) => void;
  formatDateTime: (value: string) => string;
  isReadOnly?: boolean;
  onOpenPinnedModal?: () => void;
};

export default function ProfilePage({
  user,
  userInitials,
  steamStatus,
  steamLoading,
  loadingData,
  steamError,
  stats,
  profilePlatinums,
  recentProfileGames,
  almostPlatinumGames,
  progressGames,
  monthlyPlatinums,
  onSyncSteam,
  onConnectSteam,
  onDisconnectSteam,
  onOpenGameDetails,
  handleGameImageError,
  formatDateTime,
  isReadOnly = false,
  onOpenPinnedModal,
}: ProfilePageProps) {
  const [copied, setCopied] = useState(false);

  const platinumGames = [...profilePlatinums]
    .filter((game) => game.isPlatinum)
    .sort((a, b) => getGameActivityTimestamp(b) - getGameActivityTimestamp(a));

  const handleShareProfile = async () => {
    if (typeof window === 'undefined') return;

    const profileName = user?.name ? encodeURIComponent(user.name) : '';
    const shareUrl = profileName
      ? `${window.location.origin}/profile/${profileName}`
      : window.location.href;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Falha ao copiar link do perfil:', err);
    }
  };

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="glass-panel p-4 sm:p-8"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3.5 sm:gap-4">
            <div className="h-14 w-14 sm:h-16 sm:w-16 flex-shrink-0">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="h-full w-full rounded-2xl object-cover border border-black/10 dark:border-white/20 shadow-md"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-2xl bg-[var(--ink-main)] font-display text-lg sm:text-xl text-white font-bold dark:bg-white dark:text-black shadow-md">
                  {userInitials}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-xl sm:text-3xl font-bold tracking-tight text-[var(--text-main)] truncate">{user?.name}</h1>
              <p className="truncate font-mono text-[10px] sm:text-[11px] uppercase tracking-wider text-[var(--text-soft)]">
                @{(user?.name ?? 'platone').toLowerCase().replace(/\s+/g, '.')}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-2.5 sm:justify-end">
            {isReadOnly && (
              <div className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-black/10 dark:border-white/10 px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-[var(--text-soft)]">
                <Eye size={14} />
                <span>Perfil público</span>
              </div>
            )}

            {!isReadOnly && !steamStatus.connected && (
              <button
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-black/10 dark:border-white/10 px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-[var(--text-main)] font-medium transition-all hover:bg-black/5 dark:hover:bg-white/10 active:scale-[0.98] disabled:opacity-50"
                type="button"
                onClick={onConnectSteam}
                disabled={steamLoading}
              >
                {steamLoading ? <LoaderCircle size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                <span>Conectar Steam</span>
              </button>
            )}

            <button
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--ink-main)] px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-white dark:bg-white dark:text-black font-medium transition-all hover:opacity-90 active:scale-[0.98]"
              type="button"
              onClick={handleShareProfile}
            >
              {copied ? <Check size={14} className="text-emerald-400 dark:text-emerald-600" /> : <Share2 size={14} />}
              <span>{copied ? 'Link Copiado!' : 'Compartilhar Perfil'}</span>
            </button>
          </div>
        </div>

        {!isReadOnly && steamError && (
          <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-500">{steamError}</p>
        )}

        <div className="mt-4 sm:mt-6 grid grid-cols-2 gap-3 sm:gap-4 border-t border-black/10 dark:border-white/10 pt-4 sm:pt-6 sm:grid-cols-4">
          <ProfileMetric icon={<Trophy size={14} />} label="Platinas" value={platinumGames.length} />
          <ProfileMetric icon={<Gamepad2 size={14} />} label="Biblioteca" value={stats?.totalGames ?? 0} />
        </div>
      </motion.section>

      {/* Vitrine de Orgulho / Platinas em Destaque (Pinned Showcase) */}
      {(() => {
        const pinnedIds = (user?.pinnedPlatinumIds || []).slice(0, 3);
        const pinnedGames = profilePlatinums.filter((g) => pinnedIds.includes(g.id)).slice(0, 3);

        if (isReadOnly && pinnedGames.length === 0) return null;

        return (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="glass-panel p-4 sm:p-6 border border-black/10 dark:border-white/10 relative overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-5">
              <div className="flex items-start gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--ink-main)] text-white dark:bg-white dark:text-black shrink-0 mt-0.5">
                  <Award size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-base sm:text-lg font-bold tracking-tight text-[var(--text-main)]">
                      Vitrine de Orgulho
                    </h2>
                    <span className="rounded-full border border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/5 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[var(--text-main)] font-bold">
                      Destaques 🎖️
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-soft)] mt-0.5">
                    {isReadOnly ? 'Platinas destacadas com orgulho pelo jogador.' : 'Exiba até 3 das suas platinas mais difíceis ou marcantes.'}
                  </p>
                </div>
              </div>

              {!isReadOnly && onOpenPinnedModal && (
                <button
                  type="button"
                  onClick={onOpenPinnedModal}
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl border border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/10 px-3.5 py-2 font-mono text-xs uppercase tracking-wider text-[var(--text-main)] font-bold transition-all hover:bg-black/10 dark:hover:bg-white/20 active:scale-[0.98]"
                >
                  <Pin size={13} />
                  <span>Personalizar Vitrine</span>
                </button>
              )}
            </div>

            {pinnedGames.length > 0 ? (
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-3">
                {pinnedGames.map((game, index) => (
                  <GameCard
                    key={game.id}
                    game={game}
                    viewMode="grid"
                    order={index}
                    onOpenDetails={onOpenGameDetails}
                    handleGameImageError={handleGameImageError}
                    formatDate={formatDateTime}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-black/15 dark:border-white/15 bg-black/5 dark:bg-white/5 p-6 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/10 dark:bg-white/10 text-[var(--text-main)] mb-2">
                  <Pin size={20} />
                </div>
                <p className="font-display text-sm font-bold text-[var(--text-main)]">Sua vitrine está vazia</p>
                <p className="text-xs text-[var(--text-soft)] mt-1 max-w-md">
                  Escolha até 3 das suas platinas mais desafiadoras ou marcantes para colocá-las em destaque no seu perfil público.
                </p>
                {!isReadOnly && onOpenPinnedModal && (
                  <button
                    type="button"
                    onClick={onOpenPinnedModal}
                    className="mt-3 inline-flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl bg-[var(--ink-main)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-white dark:bg-white dark:text-black font-bold transition-opacity hover:opacity-90 active:scale-[0.98]"
                  >
                    <Pin size={13} />
                    <span>Selecionar Destaques</span>
                  </button>
                )}
              </div>
            )}
          </motion.section>
        );
      })()}

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.08 }}
        className="glass-panel p-4 sm:p-6"
      >
        <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
          <div>
            <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight">Coleção de Platinas</h2>
            <p className="mt-0.5 text-xs text-[var(--text-soft)]">
              {isReadOnly
                ? 'Platinas visíveis neste perfil.'
                : 'Suas platinas exibidas publicamente.'}
            </p>
          </div>
          <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold">
            {platinumGames.length} total
          </span>
        </div>

        {platinumGames.length > 0 ? (
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {platinumGames.map((game, index) => (
                <GameCard
                  key={game.id}
                  game={game}
                  viewMode="grid"
                  order={index}
                  onOpenDetails={onOpenGameDetails}
                  handleGameImageError={handleGameImageError}
                  formatDate={formatDateTime}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <p className="rounded-xl border border-black/10 dark:border-white/10 p-4 text-sm text-[var(--text-soft)] text-center">
            {isReadOnly ? 'Este perfil ainda não possui platinas públicas.' : 'Você ainda não possui jogos platinados.'}
          </p>
        )}
      </motion.section>
    </div>
  );
}

function getGameActivityTimestamp(game: Platinum): number {
  if (!game.date) {
    return 0;
  }

  const timestamp = new Date(game.date).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function ProfileMetric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[var(--text-soft)]">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-1 font-display text-2xl font-bold tracking-tight text-[var(--text-main)]">{value}</p>
    </div>
  );
}
