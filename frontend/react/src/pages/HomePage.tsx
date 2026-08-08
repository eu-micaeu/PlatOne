import { type SyntheticEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Gamepad2,
  LayoutGrid,
  List as ListIcon,
  RefreshCw,
  Search,
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
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="glass-panel mb-6 p-6 sm:p-8"
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-[var(--text-soft)]">
              <span>Overview</span>
            </div>

            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Painel de Conquistas
            </h1>
            <p className="mt-1 text-sm text-[var(--text-soft)]">
              Acompanhe seu progresso e títulos platinados sincronizados.
            </p>
          </div>

          <button
            type="button"
            onClick={onRefreshAchievements}
            disabled={syncingAchievements}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--ink-main)] px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-white dark:bg-white dark:text-black font-medium transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Atualizar conquistas"
          >
            <RefreshCw className={syncingAchievements ? 'animate-spin' : ''} size={14} />
            {syncingAchievements ? 'Atualizando...' : 'Atualizar Conquistas'}
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-black/10 dark:border-white/10 pt-6 sm:grid-cols-4">
          <StatTile label="Platinas" value={stats?.totalPlatinums ?? 0} helper="Jogos 100% concluídos" />
          <StatTile label="Biblioteca" value={stats?.totalGames ?? 0} helper="Jogos sincronizados" />
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="glass-panel mb-6 p-4"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-soft)]"
              size={15}
            />
            <input
              type="text"
              placeholder="Buscar jogo..."
              className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-transparent py-2 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-[var(--text-soft)] focus:border-[var(--text-main)]"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {STATUS_OPTIONS.map((status) => (
              <button
                key={status.value}
                type="button"
                onClick={() => onStatusFilterChange(status.value)}
                className={`rounded-md px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors ${
                  statusFilter === status.value
                    ? 'bg-[var(--ink-main)] text-white dark:bg-white dark:text-black font-semibold'
                    : 'border border-black/10 dark:border-white/10 text-[var(--text-soft)] hover:bg-black/5 dark:hover:bg-white/10'
                }`}
              >
                {status.label}
              </button>
            ))}

            <div className="ml-auto inline-flex items-center gap-1 border-l border-black/10 dark:border-white/10 pl-3">
              <button
                type="button"
                onClick={() => onViewModeChange('grid')}
                className={`rounded-md p-1.5 transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-[var(--ink-main)] text-white dark:bg-white dark:text-black'
                    : 'text-[var(--text-soft)] hover:bg-black/5 dark:hover:bg-white/10'
                }`}
                aria-label="Alternar para grade"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange('list')}
                className={`rounded-md p-1.5 transition-colors ${
                  viewMode === 'list'
                    ? 'bg-[var(--ink-main)] text-white dark:bg-white dark:text-black'
                    : 'text-[var(--text-soft)] hover:bg-black/5 dark:hover:bg-white/10'
                }`}
                aria-label="Alternar para lista"
              >
                <ListIcon size={15} />
              </button>
            </div>
          </div>
        </div>

        {platforms.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-black/10 dark:border-white/10 pt-3">
            {platforms.map((platform) => (
              <button
                key={platform}
                type="button"
                onClick={() => onPlatformFilterChange(platform)}
                className={`rounded-md px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                  platformFilter === platform
                    ? 'bg-[var(--ink-main)] text-white dark:bg-white dark:text-black font-semibold'
                    : 'border border-black/10 dark:border-white/10 text-[var(--text-soft)] hover:bg-black/5 dark:hover:bg-white/10'
                }`}
              >
                {platform === 'all' ? 'Todas plataformas' : platform}
              </button>
            ))}
          </div>
        )}
      </motion.section>

      {loadingData && (
        <div className="glass-panel flex h-48 items-center justify-center p-6">
          <RefreshCw className="animate-spin text-[var(--text-soft)]" size={32} />
        </div>
      )}

      {!loadingData && dataError && (
        <div className="glass-panel p-6 border-red-500/30">
          <p className="font-display text-lg font-semibold text-red-500">Erro de sincronização</p>
          <p className="mt-1 text-sm text-[var(--text-soft)]">{dataError}</p>
        </div>
      )}

      {!loadingData && !dataError && filteredPlatinums.length === 0 && (
        <div className="glass-panel p-12 text-center">
          <Gamepad2 className="mx-auto mb-3 text-[var(--text-soft)]" size={32} />
          <p className="font-display text-xl font-semibold">Nenhum jogo encontrado</p>
          <p className="mt-1 text-sm text-[var(--text-soft)]">Ajuste os filtros ou o termo de busca.</p>
        </div>
      )}

      {!loadingData && !dataError && filteredPlatinums.length > 0 && (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              : 'space-y-2.5'
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
    <div>
      <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-soft)]">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold tracking-tight text-[var(--text-main)]">{value}</p>
      <p className="mt-0.5 text-xs text-[var(--text-soft)]">{helper}</p>
    </div>
  );
}
