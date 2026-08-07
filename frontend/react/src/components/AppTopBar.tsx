import { House, LogOut, Moon, Settings2, Sun, type LucideIcon, UserRound } from 'lucide-react';

import BrandLogo from './BrandLogo';

export type AppTopBarPath = '/home' | '/profile' | '/settings';

type AppTopBarProps = {
  userName?: string;
  userAvatarUrl?: string | null;
  activePath: AppTopBarPath | null;
  onNavigate: (path: AppTopBarPath) => void;
  onLogout: () => void;
  themeMode: 'light' | 'dark';
  onToggleTheme: () => void;
};

type NavItem = {
  path: AppTopBarPath;
  label: string;
  icon: LucideIcon;
};

const NAV_ITEMS: NavItem[] = [
  { path: '/home', label: 'Home', icon: House },
  { path: '/profile', label: 'Perfil', icon: UserRound },
  { path: '/settings', label: 'Configuracoes', icon: Settings2 },
];

export default function AppTopBar({
  userName,
  userAvatarUrl,
  activePath,
  onNavigate,
  onLogout,
  themeMode,
  onToggleTheme,
}: AppTopBarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-black/10 dark:border-white/10 bg-[var(--bg-main)]">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => onNavigate('/home')}
          className="flex items-center gap-3 text-left transition-opacity hover:opacity-80"
          aria-label="Ir para a home"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--ink-main)] text-white">
            <BrandLogo variant="inverse" className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-lg font-bold leading-none tracking-tight">PlatOne</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-soft)]">Command Deck</p>
          </div>
        </button>

        <div className="flex items-center gap-2 sm:gap-2.5">
          {userName && (
            <button
              type="button"
              onClick={() => onNavigate('/profile')}
              className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-1 pr-3 transition-colors hover:bg-black/10 dark:hover:bg-white/10"
              title="Ver seu Perfil"
            >
              {userAvatarUrl ? (
                <img
                  src={userAvatarUrl}
                  alt={userName}
                  className="h-6 w-6 rounded-md object-cover border border-black/10 dark:border-white/15"
                />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--ink-main)] font-display text-[10px] font-bold text-white dark:bg-white dark:text-black">
                  {userName.slice(0, 2).toUpperCase()}
                </div>
              )}
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-main)] font-medium">
                {userName}
              </span>
            </button>
          )}

          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-[var(--text-main)] transition-colors hover:bg-black/5 dark:hover:bg-white/10"
            type="button"
            onClick={onToggleTheme}
            aria-label={themeMode === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
            title={themeMode === 'dark' ? 'Tema claro' : 'Tema escuro'}
          >
            {themeMode === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            <span className="sr-only">Alternar tema</span>
          </button>

          <nav className="flex items-center gap-1.5" aria-label="Navegacao principal">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = item.path === activePath;

              return (
                <button
                  key={item.path}
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors disabled:cursor-default ${
                    isActive
                      ? 'bg-[var(--ink-main)] text-white dark:bg-white dark:text-black font-semibold'
                      : 'border border-black/10 dark:border-white/10 text-[var(--text-soft)] hover:bg-black/5 dark:hover:bg-white/10 hover:text-[var(--text-main)]'
                  }`}
                  type="button"
                  onClick={() => onNavigate(item.path)}
                  disabled={isActive}
                  aria-label={item.label}
                  title={item.label}
                >
                  <Icon size={15} />
                  <span className="sr-only">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 dark:border-white/10 text-[var(--text-soft)] transition-colors hover:bg-black/5 dark:hover:bg-white/10 hover:text-red-500"
            type="button"
            onClick={onLogout}
            aria-label="Sair"
            title="Sair"
          >
            <LogOut size={15} />
            <span className="sr-only">Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
}