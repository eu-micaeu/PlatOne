import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Cookie, X } from 'lucide-react';

const COOKIE_CONSENT_KEY = 'platone.cookie.consent';

type CookieModalProps = {
  hasBottomNav?: boolean;
};

export default function CookieModal({ hasBottomNav = false }: CookieModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'all');
    setIsVisible(false);
  };

  const handleAcceptEssential = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'essential');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`fixed z-50 border-t border-black/10 dark:border-white/10 bg-[var(--bg-main)]/95 backdrop-blur-md px-4 py-2.5 shadow-2xl sm:px-6 lg:px-8 ${
            hasBottomNav
              ? 'bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:bottom-0 left-2 right-2 md:left-0 md:right-0 rounded-2xl md:rounded-none'
              : 'bottom-0 left-0 right-0 w-full pb-[max(0.75rem,env(safe-area-inset-bottom))]'
          }`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <div className="mx-auto flex w-full max-w-5xl flex-col items-start justify-between gap-2.5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2.5 text-xs text-[var(--text-soft)]">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-[var(--ink-main)] text-white dark:bg-white dark:text-black">
                <Cookie size={14} />
              </div>
              <p className="leading-tight">
                Utilizamos cookies e armazenamento local para manter sua sessão ativa e garantir sua segurança.
              </p>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
              <button
                type="button"
                onClick={handleAcceptAll}
                className="rounded-md bg-[var(--ink-main)] px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider font-semibold text-white dark:bg-white dark:text-black transition-opacity hover:opacity-90"
              >
                Aceitar Todos
              </button>

              <button
                type="button"
                onClick={handleAcceptEssential}
                className="rounded-md border border-black/10 dark:border-white/10 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-[var(--text-main)] transition-colors hover:bg-black/5 dark:hover:bg-white/10"
              >
                Apenas Necessários
              </button>

              <button
                type="button"
                onClick={handleAcceptEssential}
                className="rounded-md p-1.5 text-[var(--text-soft)] transition-colors hover:bg-black/5 dark:hover:bg-white/10 hover:text-[var(--text-main)] ml-1"
                aria-label="Fechar aviso de cookies"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
