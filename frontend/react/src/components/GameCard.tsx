import { type SyntheticEvent } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Clock3, ExternalLink, Trophy } from 'lucide-react';

import type { Platinum, ViewMode } from '../types/app';

type GameCardProps = {
  game: Platinum;
  viewMode: ViewMode;
  order: number;
  onOpenDetails: (game: Platinum) => void;
  handleGameImageError: (event: SyntheticEvent<HTMLImageElement>) => void;
  formatDate: (value: string) => string;
};

export default function GameCard({
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
