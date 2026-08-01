import { type JSX, type ReactNode, type SyntheticEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import GameCard from '../components/GameCard';
import { Eye, Gamepad2, LoaderCircle, RefreshCw, ShieldCheck, Sparkles, TrendingUp, Trophy } from 'lucide-react';

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
}: ProfilePageProps) {
  const platinumGames = [...profilePlatinums]
    .filter((game) => game.isPlatinum)
    .sort((a, b) => getGameActivityTimestamp(b) - getGameActivityTimestamp(a));

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="glass-panel p-6 sm:p-8"
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--ink-main)] font-display text-xl text-white font-bold dark:bg-white dark:text-black">
              {userInitials}
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--text-main)] sm:text-3xl">{user?.name}</h1>
              <p className="truncate font-mono text-[11px] uppercase tracking-wider text-[var(--text-soft)]">
                @{(user?.name ?? 'platone').toLowerCase().replace(/\s+/g, '.')}
              </p>
              <div className="mt-1.5 inline-flex rounded border border-black/10 dark:border-white/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[var(--text-soft)]">
                {platinumGames.length} platinas
              </div>
            </div>
          </div>

          {isReadOnly ? (
            <div className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-black/10 dark:border-white/10 px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-[var(--text-soft)]">
              <Eye size={14} />
              Perfil público
            </div>
          ) : steamStatus.connected ? (
            <button
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--ink-main)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-white dark:bg-white dark:text-black font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
              type="button"
              onClick={onSyncSteam}
              disabled={steamLoading || loadingData}
            >
              <RefreshCw size={14} className={steamLoading ? 'animate-spin' : ''} />
              Atualizar Feed
            </button>
          ) : (
            <button
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--ink-main)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-white dark:bg-white dark:text-black font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
              type="button"
              onClick={onConnectSteam}
              disabled={steamLoading}
            >
              {steamLoading ? <LoaderCircle size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
              Conectar Steam
            </button>
          )}
        </div>

        {!isReadOnly && steamError && (
          <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-500">{steamError}</p>
        )}

        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-black/10 dark:border-white/10 pt-6 sm:grid-cols-4">
          <ProfileMetric icon={<Trophy size={14} />} label="Platinas" value={platinumGames.length} />
          <ProfileMetric icon={<Gamepad2 size={14} />} label="Biblioteca" value={stats?.totalGames ?? 0} />
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.08 }}
        className="glass-panel p-6"
      >
        <div className="flex items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight">Coleção de Platinas</h2>
            <p className="mt-0.5 text-xs text-[var(--text-soft)]">
              {isReadOnly
                ? 'Platinas visíveis neste perfil.'
                : 'Suas platinas exibidas publicamente.'}
            </p>
          </div>
          <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            {platinumGames.length} total
          </span>
        </div>

        {platinumGames.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
          <p className="rounded-lg border border-black/10 dark:border-white/10 p-4 text-sm text-[var(--text-soft)] text-center">
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
