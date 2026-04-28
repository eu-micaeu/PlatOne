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
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="glass-panel overflow-hidden rounded-[30px]"
      >

        <div className="px-6 pb-6 pt-5 sm:px-10 sm:pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-3xl border-4 border-white bg-[var(--ink-main)] font-display text-2xl text-white shadow-lg shadow-black/25 sm:h-24 sm:w-24 sm:text-3xl">
                {userInitials}
              </div>
              <div className="min-w-0">
                <p className="font-display text-3xl leading-tight text-black/90 sm:text-4xl">{user?.name}</p>
                <p className="truncate font-mono text-[11px] uppercase tracking-[0.2em] text-black/55">@{(user?.name ?? 'platone').toLowerCase().replace(/\s+/g, '.')}</p>
                <p className="mt-2 inline-flex rounded-full bg-black/7 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-black/65">
                  {platinumGames.length} platinas registradas
                </p>
              </div>
            </div>

            {isReadOnly ? (
              <div className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-black/10 bg-white/70 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-black/70 sm:w-auto">
                <Eye size={14} />
                Perfil publico
              </div>
            ) : steamStatus.connected ? (
              <button
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--ink-main)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition-all hover:-translate-y-0.5 hover:bg-black disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                type="button"
                onClick={onSyncSteam}
                disabled={steamLoading || loadingData}
              >
                <RefreshCw size={14} className={steamLoading ? 'animate-spin' : ''} />
                Atualizar feed
              </button>
            ) : (
              <button
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--ink-main)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition-all hover:-translate-y-0.5 hover:bg-black disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
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
            <p className="mt-3 rounded-xl border border-red-300/55 bg-red-100/55 px-3 py-2 text-sm text-red-700">{steamError}</p>
          )}

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ProfileMetric icon={<Trophy size={14} />} label="Platinas" value={platinumGames.length} />
            <ProfileMetric icon={<Gamepad2 size={14} />} label="Jogos" value={stats?.totalGames ?? 0} />
          </div>
        </div>
      </motion.section>


      <div className="space-y-6">

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.16 }}
          className="glass-panel p-5"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-display text-2xl leading-tight">Coleção de platinas</p>
              <p className="mt-2 text-sm text-black/65">
                {isReadOnly
                  ? 'Estas são as platinas visíveis deste perfil.'
                  : 'Estas são suas platinas exibidas publicamente.'}
              </p>
            </div>
            <span className="rounded-full bg-emerald-500/12 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-emerald-700">
              {platinumGames.length} total
            </span>
          </div>

          <div className="mt-4">
            {platinumGames.length > 0 ? (
              <div className="grid grid-cols-1 justify-items-center gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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
              <p className="rounded-xl border border-black/10 bg-white/55 px-3 py-2 text-sm text-black/60">
                {isReadOnly ? 'Este perfil ainda nao possui platinas publicas.' : 'Voce ainda nao possui jogos platinados.'}
              </p>
            )}
          </div>
        </motion.section>

        {/* Seção removida */}

      </div>


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
    <div className="rounded-xl border border-black/10 bg-white/60 px-3 py-2.5">
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-black/55">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-1 font-display text-3xl leading-none text-black/90">{value}</p>
    </div>
  );
}
