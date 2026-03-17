import { type ReactNode, type SyntheticEvent } from 'react';
import { motion } from 'motion/react';
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
  completionRate: number;
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
  completionRate,
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
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="overflow-hidden rounded-[30px] border border-black/10 bg-gradient-to-br from-white/85 to-white/60 shadow-2xl shadow-black/10 ring-1 ring-white/45"
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
            <ProfileMetric icon={<Trophy size={14} />} label="Platinas" value={stats?.totalPlatinums ?? 0} />
            <ProfileMetric icon={<Gamepad2 size={14} />} label="Jogos" value={stats?.totalGames ?? 0} />
            <ProfileMetric icon={<TrendingUp size={14} />} label="Conclusao" value={`${completionRate}%`} />
          </div>
        </div>
      </motion.section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.04 }}
          className="glass-panel p-5 sm:p-6"
        >
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="font-display text-3xl leading-tight">Feed de progresso</p>
              <p className="text-sm text-black/65">Estilo timeline: seus jogos mais recentes e o quanto falta para o 100%.</p>
            </div>
            <span className="rounded-full bg-black/7 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-black/60">
              {recentProfileGames.length} atualizacoes
            </span>
          </div>

          <div className="space-y-3">
            {recentProfileGames.length > 0 ? (
              recentProfileGames.map((game) => {
                const completion = game.total > 0 ? Math.round((game.unlocked / game.total) * 100) : 0;

                return (
                  <button
                    key={`profile-feed-${game.id}`}
                    type="button"
                    onClick={() => onOpenGameDetails(game)}
                    className="w-full rounded-2xl border border-black/10 bg-white/70 p-3 text-left transition-all hover:-translate-y-0.5 hover:bg-white"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-16 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-zinc-200">
                        <img
                          src={game.icon}
                          alt={game.title}
                          className="h-full w-full object-cover"
                          data-backup-src={game.backupIcon ?? ''}
                          data-fallback-src={game.fallbackIcon}
                          onError={handleGameImageError}
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="truncate text-sm font-semibold text-black/85">{game.title}</p>
                            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.13em] text-black/50">
                              {game.platform} | {game.unlocked}/{game.total} conquistas
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-2 py-1 font-mono text-[9px] uppercase tracking-[0.13em] ${
                              game.isPlatinum ? 'bg-emerald-500/12 text-emerald-700' : 'bg-amber-500/12 text-amber-700'
                            }`}
                          >
                            {game.isPlatinum ? 'Platinado' : `${completion}%`}
                          </span>
                        </div>

                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/10">
                          <div
                            className={`h-full ${
                              game.isPlatinum
                                ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                                : 'bg-gradient-to-r from-[var(--ink-main)] to-black/65'
                            }`}
                            style={{ width: `${completion}%` }}
                          />
                        </div>

                        <p className="mt-2 text-xs text-black/60">
                          {game.date
                            ? `Atualizado em ${formatDateTime(game.date)}`
                            : `Em progresso: faltam ${Math.max(game.total - game.unlocked, 0)} conquistas`}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <p className="rounded-xl border border-black/10 bg-white/55 px-3 py-3 text-sm text-black/65">
                {isReadOnly
                  ? 'Sem atividades publicas para este perfil no momento.'
                  : 'Sem atividades ainda. Conecte a Steam e rode uma sincronizacao para preencher sua timeline.'}
              </p>
            )}
          </div>
        </motion.section>

        <div className="space-y-6">

          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.12 }}
            className="glass-panel p-5"
          >
            <p className="font-display text-2xl leading-tight">Quase lá</p>
            <p className="mt-2 text-sm text-black/65">Jogos em progresso que estao mais perto da platina.</p>

            <div className="mt-4 space-y-2">
              {almostPlatinumGames.length > 0 ? (
                almostPlatinumGames.map((game) => {
                  const completion = game.total > 0 ? Math.round((game.unlocked / game.total) * 100) : 0;
                  return (
                    <button
                      key={`almost-${game.id}`}
                      type="button"
                      onClick={() => onOpenGameDetails(game)}
                      className="w-full rounded-xl border border-black/10 bg-white/65 px-3 py-2 text-left transition-all hover:bg-white"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-black/85">{game.title}</p>
                        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-black/55">{completion}%</span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/10">
                        <div className="h-full bg-gradient-to-r from-[var(--brand-gold)] to-[var(--ink-main)]" style={{ width: `${completion}%` }} />
                      </div>
                    </button>
                  );
                })
              ) : (
                <p className="rounded-xl border border-black/10 bg-white/55 px-3 py-2 text-sm text-black/60">
                  Ainda sem jogos em progresso suficientes para ranking.
                </p>
              )}
            </div>

            <div className="mt-4 rounded-xl border border-black/10 bg-white/60 p-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-black/55">Resumo rapido</p>
              <p className="mt-1 text-sm text-black/70">
                {stats?.totalPlatinums ?? 0} jogos platinados, {progressGames} em andamento e {monthlyPlatinums} finalizados neste mes.
              </p>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
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
