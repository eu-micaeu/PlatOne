import BrandLogo from './BrandLogo';

export default function AppFooter() {
  return (
    <footer className="border-t border-black/10 bg-white/30 m-30">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-4 text-[10px] uppercase tracking-[0.2em] text-black/50 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <span className="inline-flex items-center gap-2">
          <BrandLogo className="h-4 w-4 opacity-70" />
          <span>PlatOne Control Layer</span>
        </span>
      </div>
    </footer>
  );
}
