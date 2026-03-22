import { House, LogOut, MessageSquare, Moon, Settings2, Sun, type LucideIcon, UserRound, Users } from 'lucide-react';

import BrandLogo from './BrandLogo';
import MessageNotification from './MessageNotification';

export type AppTopBarPath = '/home' | '/profile' | '/friends' | '/messages' | '/settings';

type AppTopBarProps = {
  userName?: string;
  currentUserId?: string;
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
  { path: '/friends', label: 'Amigos', icon: Users },
  { path: '/messages', label: 'Mensagens', icon: MessageSquare },
  { path: '/settings', label: 'Configuracoes', icon: Settings2 },
];

export default function AppTopBar({
  userName,
  currentUserId,
  activePath,
  onNavigate,
  onLogout,
  themeMode,
  onToggleTheme,
}: AppTopBarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-[var(--bg-main)]/75 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => onNavigate('/home')}
          className="flex items-center gap-3 rounded-2xl text-left transition-transform hover:-translate-y-0.5"
          aria-label="Ir para a home"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--ink-main)] shadow-lg shadow-black/20">
            <BrandLogo variant="light" className="h-6 w-6" />
          </div>
          <div>
            <p className="font-display text-xl leading-none tracking-tight">PlatOne</p>
            <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-black/55">Trophy Command Deck</p>
          </div>
        </button>

        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden rounded-full bg-black/6 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-black/65 sm:inline-flex">
            {userName}
          </span>

          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-white/65 text-black/75 transition-all hover:-translate-y-0.5 hover:bg-white"
            type="button"
            onClick={onToggleTheme}
            aria-label={themeMode === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
            title={themeMode === 'dark' ? 'Tema claro' : 'Tema escuro'}
          >
            {themeMode === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            <span className="sr-only">Alternar tema</span>
          </button>

          <MessageNotification currentUserId={currentUserId} />

          <nav className="flex items-center gap-2" aria-label="Navegacao principal">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = item.path === activePath;

              return (
                <button
                  key={item.path}
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 ${
                    isActive
                      ? 'border-transparent bg-[var(--ink-main)] text-white'
                      : 'border-black/10 bg-white/65 text-black/75 hover:bg-white'
                  }`}
                  type="button"
                  onClick={() => onNavigate(item.path)}
                  disabled={isActive}
                  aria-label={item.label}
                  title={item.label}
                >
                  <Icon size={16} />
                  <span className="sr-only">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-white/65 text-black/75 transition-all hover:-translate-y-0.5 hover:bg-white"
            type="button"
            onClick={onLogout}
            aria-label="Sair"
            title="Sair"
          >
            <LogOut size={16} />
            <span className="sr-only">Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
}