import BrandLogo from './BrandLogo';

export default function AppFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-black/10 dark:border-white/10 bg-[var(--bg-main)] py-6 transition-colors">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-3 px-4 sm:flex-row sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--ink-main)] text-white">
            <BrandLogo variant="inverse" className="h-4 w-4" />
          </div>
          <span className="font-display text-sm font-semibold tracking-tight text-[var(--text-main)]">PlatOne</span>
          <span className="text-[var(--text-soft)]/40">•</span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-soft)]">Trophy Deck</span>
        </div>

        <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-soft)]">
          © {currentYear} PlatOne. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
