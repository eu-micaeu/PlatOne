import { type SyntheticEvent } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Clock3, ExternalLink, Trophy } from 'lucide-react';

import type { Platinum, ViewMode } from '../types/app';

type GameCardProps = {
  key?: string;
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
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ delay: order * 0.02, duration: 0.2 }}
        className="glass-panel flex cursor-pointer items-center gap-4 p-3.5 hover:border-[var(--text-main)] transition-colors"
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
        <div className="h-12 w-20 flex-shrink-0 overflow-hidden rounded-md bg-neutral-200 dark:bg-neutral-800">
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
          <div className="flex items-center gap-2">
            <span className="rounded border border-black/10 dark:border-white/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[var(--text-soft)]">
              {game.platform}
            </span>
            <h3 className="truncate text-sm font-semibold tracking-tight">{game.title}</h3>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-[var(--text-soft)]">
            <span>{game.unlocked}/{game.total} conquistas</span>
            <span>{completion}%</span>
            {game.date && <span>Concluido: {formatDate(game.date)}</span>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {game.isPlatinum ? (
            <div className="inline-flex items-center gap-1.5 rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={12} />
              <span>Platinado</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 rounded border border-black/10 dark:border-white/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[var(--text-soft)]">
              <Clock3 size={12} />
              <span>Em Andamento</span>
            </div>
          )}

          <button
            type="button"
            className="rounded p-1.5 text-[var(--text-soft)] hover:text-[var(--text-main)] transition-colors"
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ delay: order * 0.03, duration: 0.2 }}
      className="glass-panel group flex w-full max-w-full cursor-pointer flex-col overflow-hidden hover:border-[var(--text-main)] transition-colors"
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
      <div className="relative aspect-video overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        <img
          src={game.icon}
          alt={game.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-102"
          data-backup-src={game.backupIcon ?? ''}
          data-fallback-src={game.fallbackIcon}
          onError={handleGameImageError}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
        />

        <div className="absolute left-2.5 top-2.5">
          <span className="rounded bg-black/75 dark:bg-white/90 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-white dark:text-black font-medium">
            {game.platform}
          </span>
        </div>

        {game.isPlatinum && (
          <div className="absolute right-2.5 top-2.5">
            <div className="rounded bg-emerald-500 p-1 text-white shadow-sm">
              <Trophy size={13} />
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-base font-semibold tracking-tight text-[var(--text-main)] truncate">{game.title}</h3>

        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-[var(--text-soft)]">
            <span>{game.unlocked} / {game.total} Conquistas</span>
            <span className="font-semibold text-[var(--text-main)]">{completion}%</span>
          </div>

          <div className="h-1 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completion}%` }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className={`h-full ${
                game.isPlatinum ? 'bg-emerald-500' : 'bg-[var(--text-main)]'
              }`}
            />
          </div>

          <div className="flex items-center justify-between pt-1 font-mono text-[10px] uppercase tracking-wider text-[var(--text-soft)]">
            <span>{game.isPlatinum ? 'Platinado' : 'Em progresso'}</span>
            <span>{game.date ? formatDate(game.date) : 'Ativo'}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
