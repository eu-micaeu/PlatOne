import { House, Settings2, Sparkles, UserRound, Users, type LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import type { AppTopBarPath } from './AppTopBar';

type AppBottomBarProps = {
  activePath: AppTopBarPath | null;
  onNavigate: (path: AppTopBarPath) => void;
  onToggleFriendsSidebar: () => void;
  isFriendsSidebarOpen?: boolean;
  incomingRequestsCount?: number;
  unreadMessagesCount?: number;
  userAvatarUrl?: string | null;
  userName?: string;
};

type BottomNavItem = {
  id: 'home' | 'feed' | 'friends' | 'profile' | 'settings';
  label: string;
  path?: AppTopBarPath;
  icon: LucideIcon;
  isAction?: boolean;
};

const BOTTOM_ITEMS: BottomNavItem[] = [
  { id: 'home', label: 'Início', path: '/home', icon: House },
  { id: 'feed', label: 'Feed', path: '/feed', icon: Sparkles },
  { id: 'friends', label: 'Amigos', icon: Users, isAction: true },
  { id: 'profile', label: 'Perfil', path: '/profile', icon: UserRound },
  { id: 'settings', label: 'Ajustes', path: '/settings', icon: Settings2 },
];

export default function AppBottomBar({
  activePath,
  onNavigate,
  onToggleFriendsSidebar,
  isFriendsSidebarOpen = false,
  incomingRequestsCount = 0,
  unreadMessagesCount = 0,
  userAvatarUrl,
  userName,
}: AppBottomBarProps) {
  const totalSocialNotifications = incomingRequestsCount + unreadMessagesCount;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-black/10 dark:border-white/10 bg-[var(--bg-main)]/92 backdrop-blur-lg pb-[env(safe-area-inset-bottom)] md:hidden transition-colors shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
      aria-label="Navegação móvel principal"
    >
      <div className="mx-auto flex h-16 w-full max-w-lg items-center justify-around px-2">
        {BOTTOM_ITEMS.map((item) => {
          const Icon = item.icon;
          const isSelected = item.isAction
            ? isFriendsSidebarOpen
            : activePath === item.path;

          const isFriendsTab = item.id === 'friends';
          const isProfileTab = item.id === 'profile';

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.isAction) {
                  onToggleFriendsSidebar();
                } else if (item.path) {
                  onNavigate(item.path);
                }
              }}
              className={`group relative flex flex-1 flex-col items-center justify-center py-1 transition-all active:scale-95 touch-manipulation focus:outline-none ${
                isSelected
                  ? 'text-[var(--text-main)] font-semibold'
                  : 'text-[var(--text-soft)] hover:text-[var(--text-main)]'
              }`}
              aria-label={item.label}
              aria-current={isSelected ? 'page' : undefined}
            >
              {/* Active Top Line Indicator */}
              {isSelected && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute inset-x-2 -top-1 h-0.5 rounded-full bg-[var(--ink-main)] dark:bg-white"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}

              <div className="relative flex h-7 w-7 items-center justify-center">
                {isProfileTab && userAvatarUrl ? (
                  <img
                    src={userAvatarUrl}
                    alt={userName || 'Perfil'}
                    className={`h-6 w-6 rounded-full object-cover transition-transform ${
                      isSelected
                        ? 'ring-2 ring-[var(--ink-main)] dark:ring-white scale-110'
                        : 'border border-black/15 dark:border-white/20'
                    }`}
                  />
                ) : (
                  <Icon
                    size={20}
                    className={`transition-transform duration-150 ${
                      isSelected ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'
                    }`}
                  />
                )}

                {/* Social Badges (Requests + Unread Messages) */}
                {isFriendsTab && totalSocialNotifications > 0 && (
                  <span className="absolute -top-1 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 font-mono text-[9px] font-bold text-white shadow-xs animate-pulse">
                    {totalSocialNotifications > 9 ? '9+' : totalSocialNotifications}
                  </span>
                )}
              </div>

              <span
                className={`mt-0.5 font-mono text-[10px] tracking-tight uppercase transition-colors ${
                  isSelected
                    ? 'font-bold text-[var(--text-main)]'
                    : 'text-[var(--text-soft)]'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
