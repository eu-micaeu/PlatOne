import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { LoaderCircle, Trash2, X } from 'lucide-react';

type ConfirmDeleteAccountModalProps = {
  isOpen: boolean;
  isDeleting?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function ConfirmDeleteAccountModal({
  isOpen,
  isDeleting = false,
  onClose,
  onConfirm,
}: ConfirmDeleteAccountModalProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && !isDeleting) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            if (!isDeleting) onClose();
          }}
        >
          <motion.div
            className="glass-panel relative w-full max-w-md overflow-hidden p-6 sm:p-7 shadow-2xl border border-red-500/20"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2 }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-4 top-4 rounded-lg p-1.5 text-[var(--text-soft)] hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
              onClick={onClose}
              disabled={isDeleting}
              aria-label="Fechar modal"
            >
              <X size={18} />
            </button>

            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400">
                <Trash2 size={22} />
              </div>

              <div>
                <h3 className="font-display text-xl font-bold tracking-tight text-[var(--text-main)]">
                  Apagar Conta Permanentemente
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-soft)]">
                  Tem certeza de que deseja apagar sua conta? Todos os seus dados, conquistas sincronizadas e histórico serão excluídos permanentemente. Esta ação <strong className="text-red-600 dark:text-red-400">não pode ser desfeita</strong>.
                </p>
              </div>
            </div>

            <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
              <button
                type="button"
                className="inline-flex h-10 items-center justify-center rounded-lg border border-black/10 dark:border-white/10 px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--text-main)] transition-colors hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50"
                onClick={onClose}
                disabled={isDeleting}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-mono text-xs uppercase tracking-wider font-semibold text-white transition-colors hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 disabled:opacity-50"
                onClick={onConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <LoaderCircle size={14} className="animate-spin" />
                    Apagando...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    Apagar Minha Conta
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
