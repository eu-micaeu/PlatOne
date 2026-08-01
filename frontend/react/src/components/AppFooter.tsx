import BrandLogo from './BrandLogo';

export default function AppFooter() {
  return (
    <footer className="border-t border-black/10 dark:border-white/10 bg-[var(--bg-main)]">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 text-[10px] font-mono uppercase tracking-widest text-[var(--text-soft)] sm:px-6 lg:px-8">
        <span className="inline-flex items-center gap-2">
          <BrandLogo className="h-4 w-4 opacity-70" />
          <span>PlatOne • Trophy Deck</span>
        </span>
      </div>
    </footer>
  );
}
