import { type SyntheticEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  CheckCircle2,
  Clock3,
  ExternalLink,
  Filter,
  Gamepad2,
  LayoutGrid,
  List as ListIcon,
  RefreshCw,
  Search,
  Sparkles,
  Trophy,
} from 'lucide-react';

import type { Platinum, Stats, StatusFilter, ViewMode } from '../types/app';
import GameCard from '../components/GameCard';

type HomePageProps = {
  stats: Stats | null;
  monthlyPlatinums: number;
  syncingAchievements: boolean;
  onRefreshAchievements: () => void;
  query: string;
  onQueryChange: (value: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (value: StatusFilter) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  platforms: string[];
  platformFilter: string;
  onPlatformFilterChange: (value: string) => void;
  loadingData: boolean;
  dataError: string | null;
  filteredPlatinums: Platinum[];
  onOpenGameDetails: (game: Platinum) => void;
  handleGameImageError: (event: SyntheticEvent<HTMLImageElement>) => void;
  formatDate: (value: string) => string;
};

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'Tudo' },
  { value: 'platinum', label: 'Platinado' },
  { value: 'progress', label: 'Progresso' },
];

export default function HomePage({
  stats,
  monthlyPlatinums,
  syncingAchievements,
  onRefreshAchievements,
  query,
  onQueryChange,
  statusFilter,
  onStatusFilterChange,
  viewMode,
  onViewModeChange,
  platforms,
  platformFilter,
  onPlatformFilterChange,
  loadingData,
  dataError,
  filteredPlatinums,
  onOpenGameDetails,
  handleGameImageError,
  formatDate,
}: HomePageProps) {
  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 26 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        className="mb-8 grid gap-5 lg:grid-cols-3"
      >
        <div className="glass-panel w-full p-6 sm:p-8 lg:col-span-3">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-black/5 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.24em] text-black/60">
            <Sparkles size={12} />
            Performance Snapshot
          </div>

          <h1 className="font-display text-4xl leading-[0.95] tracking-tight sm:text-5xl lg:text-6xl">
            Seu painel de
            <span className="text-[var(--brand-gold)]"> conquista total</span>
          </h1>
          <p className="mt-4 max-w-4xl text-sm text-black/70 sm:text-base">
            Veja progresso e platinas concluidas!
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <StatTile label="Platinas" value={stats?.totalPlatinums ?? 0} helper="Titulos finalizados" />
            <StatTile label="Jogos" value={stats?.totalGames ?? 0} helper="Biblioteca sincronizada" />
          </div>

          <div className="mt-5">
            <button
              type="button"
              onClick={onRefreshAchievements}
              disabled={syncingAchievements}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--ink-main)] px-4 py-2.5 font-mono text-xs uppercase tracking-[0.16em] text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-55"
              aria-label="Atualizar conquistas"
            >
              <RefreshCw className={syncingAchievements ? 'animate-spin' : ''} size={14} />
              {syncingAchievements ? 'Atualizando...' : 'Atualizar conquistas'}
            </button>
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.08 }}
        className="glass-panel mb-6 p-4 sm:p-5"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/35"
              size={16}
            />
            <input
              type="text"
              placeholder="Buscar jogo ou plataforma..."
              className="w-full rounded-xl border border-black/10 bg-white/70 py-2.5 pl-10 pr-3 text-sm text-black/80 outline-none transition-all placeholder:text-black/35 focus:border-black/25 focus:bg-white"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Filter size={15} className="text-black/45" />
            {STATUS_OPTIONS.map((status) => (
              <button
                key={status.value}
                type="button"
                onClick={() => onStatusFilterChange(status.value)}
                className={`rounded-full px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] transition-all ${
                  statusFilter === status.value
                    ? 'bg-[var(--ink-main)] text-[var(--bg-main)]'
                    : 'bg-black/5 text-black/60 hover:bg-black/10'
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>

          <div className="inline-flex items-center gap-1 rounded-xl border border-black/10 bg-white/65 p-1">
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              className={`rounded-lg p-2 transition-colors ${
                viewMode === 'grid' ? 'bg-[var(--ink-main)] text-white' : 'text-black/55 hover:bg-black/5'
              }`}
              aria-label="Alternar para grade"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('list')}
              className={`rounded-lg p-2 transition-colors ${
                viewMode === 'list' ? 'bg-[var(--ink-main)] text-white' : 'text-black/55 hover:bg-black/5'
              }`}
              aria-label="Alternar para lista"
            >
              <ListIcon size={16} />
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {platforms.map((platform) => (
            <button
              key={platform}
              type="button"
              onClick={() => onPlatformFilterChange(platform)}
              className={`rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] transition-all ${
                platformFilter === platform
                  ? 'border-transparent bg-gradient-to-r from-[var(--brand-cyan)] via-[var(--brand-gold)] to-[var(--brand-rose)] text-[var(--ink-main)]'
                  : 'border-black/10 bg-white/55 text-black/60 hover:bg-white/80'
              }`}
            >
              {platform === 'all' ? 'Todas plataformas' : platform}
            </button>
          ))}
        </div>
      </motion.section>

      {loadingData && (
        <div className="glass-panel flex h-64 items-center justify-center p-6">
          <RefreshCw className="animate-spin text-black/25" size={40} />
        </div>
      )}

      {!loadingData && dataError && (
        <div className="glass-panel p-6">
          <p className="font-display text-2xl">Erro de sincronizacao</p>
          <p className="mt-2 text-sm text-black/70">{dataError}</p>
        </div>
      )}

      {!loadingData && !dataError && filteredPlatinums.length === 0 && (
        <div className="glass-panel p-8 text-center">
          <Gamepad2 className="mx-auto mb-4 text-black/35" size={38} />
          <p className="font-display text-3xl">Nenhum jogo encontrado</p>
          <p className="mt-2 text-sm text-black/65">Ajuste filtros ou termo de busca para encontrar resultados.</p>
        </div>
      )}

      {!loadingData && !dataError && filteredPlatinums.length > 0 && (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 justify-items-center gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'
              : 'space-y-3'
          }
        >
          <AnimatePresence mode="popLayout">
            {filteredPlatinums.map((game, index) => (
              <GameCard
                key={game.id}
                game={game}
                viewMode={viewMode}
                order={index}
                onOpenDetails={onOpenGameDetails}
                handleGameImageError={handleGameImageError}
                formatDate={formatDate}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </>
  );
}

function StatTile({
  label,
  value,
  helper,
}: {
  label: string;
  value: number | string;
  helper: string;
}) {
  return (
    <div className="rounded-xl border border-black/10 bg-white/55 p-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-black/55">{label}</p>
      <p className="mt-1 font-display text-3xl leading-none">{value}</p>
      <p className="mt-1 text-xs text-black/55">{helper}</p>
    </div>
  );
}

type GameCardProps = {
  key?: string;
  game: Platinum;
  viewMode: ViewMode;
  order: number;
  onOpenDetails: (game: Platinum) => void;
  handleGameImageError: (event: SyntheticEvent<HTMLImageElement>) => void;
  formatDate: (value: string) => string;
};


