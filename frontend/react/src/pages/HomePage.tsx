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

type HomePageProps = {
  stats: Stats | null;
  monthlyPlatinums: number;
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
            <StatTile label="No mes" value={monthlyPlatinums} helper="Platinas recentes" />
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

function GameCard({
  game,
  viewMode,
  order,
  onOpenDetails,
  handleGameImageError,
  formatDate,
}: GameCardProps) {
  const completion = game.total > 0 ? Math.round((game.unlocked / game.total) * 100) : 0;

  if (viewMode === 'list') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ delay: order * 0.03, duration: 0.28 }}
        className="glass-panel flex cursor-pointer items-center gap-3 p-3.5 sm:gap-5 sm:p-4"
        onClick={() => onOpenDetails(game)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onOpenDetails(game);
          }
        }}
        role="button"
        tabIndex={0}
      >
        <div className="h-14 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-zinc-200 sm:h-16 sm:w-28">
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
          <div className="mb-1 flex items-center gap-2">
            <span
              className={`rounded-full px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] ${
                game.platform === 'Steam'
                  ? 'bg-blue-500/10 text-blue-600'
                  : game.platform === 'Xbox'
                    ? 'bg-green-500/10 text-green-600'
                    : 'bg-indigo-500/10 text-indigo-600'
              }`}
            >
              {game.platform}
            </span>
            <h3 className="truncate text-sm font-semibold sm:text-base">{game.title}</h3>
          </div>

          <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-[0.13em] text-black/45">
            <span>Conquistas: {game.unlocked}/{game.total}</span>
            <span>Progresso: {completion}%</span>
            {game.date && <span>Finalizado: {formatDate(game.date)}</span>}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {game.isPlatinum ? (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-emerald-700">
              <CheckCircle2 size={14} />
              <span>Platinado</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-black/8 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-black/55">
              <Clock3 size={14} />
              <span>Progresso</span>
            </div>
          )}

          <button
            type="button"
            className="rounded-lg p-2 text-black/45 transition-colors hover:bg-black/5 hover:text-black/80"
            aria-label={`Abrir detalhes de ${game.title}`}
            onClick={(event) => {
              event.stopPropagation();
              onOpenDetails(game);
            }}
          >
            <ExternalLink size={14} />
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: order * 0.04, duration: 0.32 }}
      whileHover={{ y: -5, rotate: -0.1 }}
      className="glass-panel group flex w-full max-w-[21.5rem] cursor-pointer flex-col overflow-hidden"
      onClick={() => onOpenDetails(game)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpenDetails(game);
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="relative aspect-video overflow-hidden bg-zinc-100">
        <img
          src={game.icon}
          alt={game.title}
          className="h-full w-full object-cover saturate-75 transition-all duration-500 group-hover:scale-105 group-hover:saturate-100"
          data-backup-src={game.backupIcon ?? ''}
          data-fallback-src={game.fallbackIcon}
          onError={handleGameImageError}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
        />

        <div className="absolute left-3 top-3">
          <span
            className={`rounded-full px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] backdrop-blur-md ${
              game.platform === 'Steam'
                ? 'bg-blue-500/80 text-white'
                : game.platform === 'Xbox'
                  ? 'bg-green-500/80 text-white'
                  : 'bg-indigo-500/80 text-white'
            }`}
          >
            {game.platform}
          </span>
        </div>

        {game.isPlatinum && (
          <div className="absolute right-3 top-3">
            <div className="rounded-full bg-emerald-400 p-1.5 text-black shadow-lg shadow-emerald-500/25">
              <Trophy size={14} />
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-[1.4rem] leading-tight">{game.title}</h3>

        <div className="mt-4 space-y-3">
          <div className="flex items-end justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-black/55">
            <span>Progresso</span>
            <span className="font-semibold text-black/80">{completion}%</span>
          </div>

          <div className="h-1.5 overflow-hidden rounded-full bg-black/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completion}%` }}
              transition={{ duration: 0.9, delay: 0.15 }}
              className={`h-full ${
                game.isPlatinum
                  ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                  : 'bg-gradient-to-r from-[var(--ink-main)] to-black/65'
              }`}
            />
          </div>

          <div className="flex items-center justify-between border-t border-black/10 pt-2 font-mono text-[10px] uppercase tracking-[0.13em] text-black/50">
            <span>
              {game.unlocked} / {game.total}
            </span>
            <span>{game.date ? formatDate(game.date) : 'Pendente'}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
