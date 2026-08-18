import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Award, Check, LoaderCircle, Pin, Search, Trophy, X } from 'lucide-react';
import type { AuthUser, Platinum } from '../types/app';

type PinnedPlatinumsModalProps = {
  isOpen: boolean;
  user: AuthUser | null;
  authToken: string | null;
  platinumGames: Platinum[];
  onClose: () => void;
  onUpdateUser: (updatedUser: AuthUser) => void;
};

export default function PinnedPlatinumsModal({
  isOpen,
  user,
  authToken,
  platinumGames,
  onClose,
  onUpdateUser,
}: PinnedPlatinumsModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(user?.pinnedPlatinumIds || []);
      setSearchQuery('');
      setError(null);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const filteredGames = platinumGames.filter((g) =>
    g.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSelect = (gameId: string) => {
    if (selectedIds.includes(gameId)) {
      setSelectedIds((prev) => prev.filter((id) => id !== gameId));
    } else {
      if (selectedIds.length >= 3) {
        setError('Você só pode destacar até 3 platinas.');
        setTimeout(() => setError(null), 3000);
        return;
      }
      setSelectedIds((prev) => [...prev, gameId]);
    }
  };

  const handleSave = async () => {
    if (!authToken) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/user/pinned-platinums', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pinnedIds: selectedIds }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Falha ao atualizar vitrine de platinas.');
      }

      if (data.user) {
        onUpdateUser(data.user);
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar destaques.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-2xl rounded-2xl border border-black/10 dark:border-white/10 bg-[var(--bg-main)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 p-3.5 sm:p-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-[var(--ink-main)] text-white dark:bg-white dark:text-black shrink-0">
                <Award size={18} />
              </div>
              <div className="min-w-0">
                <h2 className="font-display text-base sm:text-lg font-bold text-[var(--text-main)] truncate">
                  Vitrine de Platinas (Destaques)
                </h2>
                <p className="font-mono text-[9px] sm:text-[10px] uppercase tracking-wider text-[var(--text-soft)]">
                  Selecione até 3 platinas ({selectedIds.length}/3)
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-[var(--text-soft)] hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              title="Fechar"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
          </div>

          {/* Search bar */}
          <div className="p-3 sm:p-4 border-b border-black/10 dark:border-white/10">
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-soft)]"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar platinas na sua coleção..."
                className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 pl-9 pr-4 py-2.5 text-xs text-[var(--text-main)] outline-none focus:border-[var(--text-main)] transition-colors"
              />
            </div>

            {error && (
              <p className="mt-2 text-xs text-red-500 font-medium">{error}</p>
            )}
          </div>

          {/* Games Selection Grid */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {platinumGames.length === 0 ? (
              <div className="py-12 text-center text-xs text-[var(--text-soft)]">
                Você ainda não possui platinas em sua coleção para destacar.
              </div>
            ) : filteredGames.length === 0 ? (
              <div className="py-8 text-center text-xs text-[var(--text-soft)]">
                Nenhum jogo encontrado com este nome.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredGames.map((game) => {
                  const isSelected = selectedIds.includes(game.id);

                  return (
                    <button
                      key={game.id}
                      type="button"
                      onClick={() => toggleSelect(game.id)}
                      className={`flex items-center gap-3 rounded-xl border p-2.5 text-left transition-all relative ${
                        isSelected
                          ? 'border-[var(--text-main)] bg-black/10 dark:bg-white/10 shadow-sm'
                          : 'border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:border-black/20 dark:hover:border-white/20'
                      }`}
                    >
                      <img
                        src={game.icon}
                        alt={game.title}
                        className="h-12 w-12 rounded-lg object-cover border border-black/10 dark:border-white/15 flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1 pr-6">
                        <p className="font-bold text-xs text-[var(--text-main)] truncate">{game.title}</p>
                        <p className="font-mono text-[10px] text-[var(--text-soft)] font-semibold flex items-center gap-1 mt-0.5">
                          <Trophy size={11} />
                          <span>Platinado</span>
                        </p>
                      </div>

                      <div
                        className={`absolute right-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full border transition-all ${
                          isSelected
                            ? 'border-transparent bg-[var(--ink-main)] text-white dark:bg-white dark:text-black'
                            : 'border-black/20 dark:border-white/20 text-transparent'
                        }`}
                      >
                        <Check size={13} />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-black/10 dark:border-white/10 p-4 bg-black/5 dark:bg-white/5">
            <span className="font-mono text-xs text-[var(--text-soft)]">
              {selectedIds.length} de 3 selecionadas
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--text-soft)] hover:text-[var(--text-main)] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--ink-main)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-white dark:bg-white dark:text-black font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {saving ? <LoaderCircle size={14} className="animate-spin" /> : <Pin size={14} />}
                <span>Salvar Vitrine</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
