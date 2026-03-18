import { useCallback, useEffect, useMemo, useState, type FormEvent, type SyntheticEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, Clock3, LoaderCircle, Trophy, X } from 'lucide-react';

import BrandLogo from './components/BrandLogo';
import AppFooter from './components/AppFooter';
import AppTopBar from './components/AppTopBar';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import FriendsPage from './pages/FriendsPage';
import MessagesPage from './pages/MessagesPage';
import type {
  Achievement,
  AuthMode,
  AuthResponse,
  AuthUser,
  Platinum,
  Stats,
  StatusFilter,
  SteamStatus,
  ViewMode,
} from './types/app';

const TOKEN_STORAGE_KEY = 'platone.auth.token';
const MESSAGE_FRIEND_ID_STORAGE_KEY = 'platone.messages.friendId';
const MESSAGE_FRIEND_NAME_STORAGE_KEY = 'platone.messages.friendName';

const DEFAULT_STEAM_STATUS: SteamStatus = {
  connected: false,
  steamId: null,
  linkedAt: null,
};

type AppRoute = '/home' | '/login' | '/register' | '/profile' | '/settings' | '/friends' | '/messages' | `/profile/${string}`;

export default function App() {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [routePath, setRoutePath] = useState<AppRoute>(() => getNormalizedPath());
  const [authToken, setAuthToken] = useState<string | null>(() => getStoredToken());
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [nicknameInput, setNicknameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  const [platinums, setPlatinums] = useState<Platinum[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [steamStatus, setSteamStatus] = useState<SteamStatus>(DEFAULT_STEAM_STATUS);
  const [steamLoading, setSteamLoading] = useState(false);
  const [steamError, setSteamError] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const [publicProfileUser, setPublicProfileUser] = useState<AuthUser | null>(null);
  const [publicPlatinums, setPublicPlatinums] = useState<Platinum[]>([]);
  const [publicStats, setPublicStats] = useState<Stats | null>(null);
  const [publicSteamStatus, setPublicSteamStatus] = useState<SteamStatus>(DEFAULT_STEAM_STATUS);
  const [publicProfileLoading, setPublicProfileLoading] = useState(false);
  const [publicProfileError, setPublicProfileError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [query, setQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const [selectedGame, setSelectedGame] = useState<Platinum | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [achievementsLoading, setAchievementsLoading] = useState(false);
  const [achievementsError, setAchievementsError] = useState<string | null>(null);

  const authHeaders = useMemo(
    () => (authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    [authToken]
  );

  const isAuthenticated = Boolean(authToken && user);
  const publicProfileName = getPublicProfileName(routePath);
  const isPublicProfileRoute = Boolean(publicProfileName);
  const isHomeRoute = routePath === '/home';
  const isOwnProfileRoute = routePath === '/profile';
  const isProfileRoute = isOwnProfileRoute || isPublicProfileRoute;
  const isSettingsRoute = routePath === '/settings';
  const isFriendsRoute = routePath === '/friends';
  const isMessagesRoute = routePath === '/messages';
  const isLoginRoute = routePath === '/login';
  const isRegisterRoute = routePath === '/register';
  const isPublicRoute = isLoginRoute || isRegisterRoute || isPublicProfileRoute;

  const profileUser = isPublicProfileRoute ? publicProfileUser : user;
  const profileStats = isPublicProfileRoute ? publicStats : stats;
  const profilePlatinums = isPublicProfileRoute ? publicPlatinums : platinums;
  const profileSteamStatus = isPublicProfileRoute ? publicSteamStatus : steamStatus;
  const profileSteamLoading = isPublicProfileRoute ? false : steamLoading;
  const profileLoadingData = isPublicProfileRoute ? publicProfileLoading : loadingData;
  const profileSteamError = isPublicProfileRoute ? publicProfileError : steamError;

  const navigateTo = useCallback((path: string, replace = false) => {
    if (typeof window === 'undefined') {
      return;
    }

    const targetPath = normalizePath(path);
    const currentPath = normalizePath(window.location.pathname);
    if (targetPath === currentPath) {
      setRoutePath(targetPath);
      return;
    }

    if (replace) {
      window.history.replaceState({}, document.title, targetPath);
    } else {
      window.history.pushState({}, document.title, targetPath);
    }

    setRoutePath(targetPath);
  }, []);

  const setSessionToken = useCallback((token: string | null) => {
    setAuthToken(token);
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }, []);

  const closeAchievementsModal = useCallback(() => {
    setSelectedGame(null);
    setAchievements([]);
    setAchievementsError(null);
    setAchievementsLoading(false);
  }, []);

  const fetchDashboardData = useCallback(async () => {
    if (!authToken) {
      return;
    }

    setLoadingData(true);
    setDataError(null);

    try {
      const [platRes, statsRes] = await Promise.all([
        fetch('/api/platinums', { headers: authHeaders }),
        fetch('/api/stats', { headers: authHeaders }),
      ]);

      if (!platRes.ok || !statsRes.ok) {
        throw new Error('Falha ao carregar os dados do dashboard.');
      }

      const [platData, statsData] = await Promise.all([platRes.json(), statsRes.json()]);
      const normalizedPlatinums = normalizePlatinums(platData);
      setPlatinums(normalizedPlatinums);
      setStats(normalizeStats(statsData, normalizedPlatinums.length));
    } catch (fetchError) {
      console.error('Error fetching dashboard data:', fetchError);
      setDataError('Nao foi possivel sincronizar os dados agora.');
    } finally {
      setLoadingData(false);
    }
  }, [authHeaders, authToken]);

  const fetchSteamStatus = useCallback(async () => {
    if (!authToken) {
      setSteamStatus(DEFAULT_STEAM_STATUS);
      return;
    }

    try {
      const response = await fetch('/api/steam/status', { headers: authHeaders });
      if (!response.ok) {
        throw new Error('Falha ao consultar status da Steam.');
      }

      const payload = (await response.json()) as Partial<SteamStatus>;
      setSteamStatus(normalizeSteamStatus(payload));
    } catch (error) {
      console.error('Error fetching Steam status:', error);
      setSteamStatus(DEFAULT_STEAM_STATUS);
    }
  }, [authHeaders, authToken]);

  const fetchPublicProfileData = useCallback(async (profileName: string) => {
    const normalizedName = profileName.trim();
    if (!normalizedName) {
      setPublicProfileUser(null);
      setPublicPlatinums([]);
      setPublicStats(null);
      setPublicSteamStatus(DEFAULT_STEAM_STATUS);
      setPublicProfileError('Perfil invalido.');
      setPublicProfileLoading(false);
      return;
    }

    setPublicProfileLoading(true);
    setPublicProfileError(null);

    try {
      const response = await fetch(`/api/public/profile/${encodeURIComponent(normalizedName)}`);
      if (!response.ok) {
        const message = await readErrorMessage(response, 'Nao foi possivel carregar este perfil agora.');
        throw new Error(message);
      }

      const payload = (await response.json()) as {
        profile?: unknown;
        steamStatus?: unknown;
        stats?: unknown;
        platinums?: unknown;
      };

      const normalizedPlatinums = normalizePlatinums(payload.platinums);

      setPublicProfileUser(normalizePublicUser(payload.profile, normalizedName));
      setPublicSteamStatus(normalizeSteamStatus(payload.steamStatus));
      setPublicPlatinums(normalizedPlatinums);
      setPublicStats(normalizeStats(payload.stats, normalizedPlatinums.length));
    } catch (error) {
      console.error('Public profile fetch failed:', error);
      setPublicProfileUser(null);
      setPublicPlatinums([]);
      setPublicStats(null);
      setPublicSteamStatus(DEFAULT_STEAM_STATUS);
      setPublicProfileError(error instanceof Error ? error.message : 'Nao foi possivel carregar este perfil agora.');
    } finally {
      setPublicProfileLoading(false);
    }
  }, []);

  const handleSyncSteam = useCallback(async () => {
    if (!authToken || steamLoading) {
      return;
    }

    setSteamLoading(true);
    setSteamError(null);

    try {
      const response = await fetch('/api/sync/me', {
        method: 'POST',
        headers: authHeaders,
      });

      if (!response.ok) {
        const message = await readErrorMessage(response, 'Nao foi possivel sincronizar com a Steam.');
        throw new Error(message);
      }

      for (let i = 0; i <= 5; i++) {
        if (i > 0) await new Promise<void>((resolve) => setTimeout(resolve, 4000));
        await fetchDashboardData();
      }
    } catch (error) {
      console.error('Steam sync failed:', error);
      setSteamError(error instanceof Error ? error.message : 'Falha ao sincronizar a Steam.');
    } finally {
      setSteamLoading(false);
    }
  }, [authHeaders, authToken, fetchDashboardData, steamLoading]);

  const handleOpenGameDetails = useCallback(
    async (game: Platinum) => {
      setSelectedGame(game);
      setAchievements([]);
      setAchievementsError(null);

      if (game.platform.toLowerCase() !== 'steam') {
        setAchievementsError('Detalhes de conquistas disponiveis apenas para jogos da Steam no momento.');
        return;
      }

      if (!game.externalId) {
        setAchievementsError('Nao foi possivel identificar o jogo para buscar as conquistas.');
        return;
      }

      setAchievementsLoading(true);

      try {
        const endpoint =
          isPublicProfileRoute && publicProfileName
            ? `/api/public/profile/${encodeURIComponent(publicProfileName)}/games/${encodeURIComponent(game.externalId)}/achievements`
            : `/api/games/${encodeURIComponent(game.externalId)}/achievements`;

        const requestOptions: RequestInit = {
          method: 'GET',
        };

        if (!isPublicProfileRoute) {
          requestOptions.headers = authHeaders;
        }

        const response = await fetch(endpoint, requestOptions);

        if (!response.ok) {
          const message = await readErrorMessage(response, 'Nao foi possivel carregar as conquistas do jogo.');
          throw new Error(message);
        }

        const payload = (await response.json()) as unknown;
        setAchievements(normalizeAchievements(payload));
      } catch (error) {
        console.error('Failed to load game achievements:', error);
        setAchievementsError(error instanceof Error ? error.message : 'Falha ao carregar conquistas do jogo.');
      } finally {
        setAchievementsLoading(false);
      }
    },
    [authHeaders, isPublicProfileRoute, publicProfileName]
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handlePopState = () => {
      setRoutePath(getNormalizedPath());
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (!isLoginRoute && !isRegisterRoute) {
      return;
    }

    setAuthMode(isRegisterRoute ? 'register' : 'login');
    setAuthError(null);
  }, [isLoginRoute, isRegisterRoute]);

  useEffect(() => {
    const checkSession = async () => {
      if (!authToken) {
        setUser(null);
        setAuthChecking(false);
        return;
      }

      setAuthChecking(true);

      try {
        const response = await fetch('/api/auth/me', { headers: authHeaders });
        if (!response.ok) {
          throw new Error('Sessao invalida');
        }

        const payload = (await response.json()) as { user: AuthUser };
        setUser(payload.user);
      } catch (sessionError) {
        console.error('Session check failed:', sessionError);
        setUser(null);
        setSessionToken(null);
      } finally {
        setAuthChecking(false);
      }
    };

    checkSession();
  }, [authHeaders, authToken, setSessionToken]);

  useEffect(() => {
    if (authChecking) {
      return;
    }

    if (isAuthenticated) {
      if (isLoginRoute || isRegisterRoute) {
        navigateTo('/home', true);
      }
      return;
    }

    if (!isPublicRoute) {
      navigateTo('/login', true);
    }
  }, [authChecking, isAuthenticated, isLoginRoute, isPublicRoute, isRegisterRoute, navigateTo]);

  useEffect(() => {
    if (!isAuthenticated) {
      setPlatinums([]);
      setStats(null);
      setDataError(null);
      setLoadingData(false);
      setSteamStatus(DEFAULT_STEAM_STATUS);
      setSteamLoading(false);
      setSteamError(null);
      return;
    }

    fetchDashboardData();
    fetchSteamStatus();
  }, [fetchDashboardData, fetchSteamStatus, isAuthenticated]);

  useEffect(() => {
    if (!isPublicProfileRoute || !publicProfileName) {
      setPublicProfileUser(null);
      setPublicPlatinums([]);
      setPublicStats(null);
      setPublicSteamStatus(DEFAULT_STEAM_STATUS);
      setPublicProfileError(null);
      setPublicProfileLoading(false);
      return;
    }

    fetchPublicProfileData(publicProfileName);
  }, [fetchPublicProfileData, isPublicProfileRoute, publicProfileName]);

  useEffect(() => {
    if (!isAuthenticated || typeof window === 'undefined') {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const steamResult = params.get('steam');
    if (!steamResult) {
      return;
    }

    if (steamResult === 'connected') {
      setSteamError(null);
      fetchSteamStatus();
      handleSyncSteam();
    } else {
      setSteamError('Nao foi possivel conectar sua conta Steam. Tente novamente.');
    }

    params.delete('steam');
    const query = params.toString();
    const updatedURL = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState({}, document.title, updatedURL);
  }, [fetchSteamStatus, handleSyncSteam, isAuthenticated]);

  useEffect(() => {
    if (!selectedGame) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeAchievementsModal();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [closeAchievementsModal, selectedGame]);

  const totalAchievements = useMemo(
    () => profilePlatinums.reduce((acc, game) => acc + game.total, 0),
    [profilePlatinums]
  );

  const unlockedAchievements = useMemo(
    () => profilePlatinums.reduce((acc, game) => acc + game.unlocked, 0),
    [profilePlatinums]
  );

  const monthlyPlatinums = useMemo(() => {
    const now = new Date();
    return profilePlatinums.filter((game) => {
      if (!game.isPlatinum || !game.date) {
        return false;
      }
      const gameDate = new Date(game.date);
      return gameDate.getMonth() === now.getMonth() && gameDate.getFullYear() === now.getFullYear();
    }).length;
  }, [profilePlatinums]);

  const platforms = useMemo(
    () => ['all', ...new Set(profilePlatinums.map((game) => game.platform))],
    [profilePlatinums]
  );

  const filteredPlatinums = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();

    return profilePlatinums
      .filter((game) => {
        const matchesQuery =
          normalizedQuery.length === 0 ||
          game.title.toLowerCase().includes(normalizedQuery) ||
          game.platform.toLowerCase().includes(normalizedQuery);

        const matchesPlatform = platformFilter === 'all' || game.platform === platformFilter;

        const matchesStatus =
          statusFilter === 'all' ||
          (statusFilter === 'platinum' && game.isPlatinum) ||
          (statusFilter === 'progress' && !game.isPlatinum);

        return matchesQuery && matchesPlatform && matchesStatus;
      })
      .sort((a, b) => {
        const progressA = a.total > 0 ? a.unlocked / a.total : 0;
        const progressB = b.total > 0 ? b.unlocked / b.total : 0;

        if (a.isPlatinum !== b.isPlatinum) {
          return Number(b.isPlatinum) - Number(a.isPlatinum);
        }

        return progressB - progressA;
      });
  }, [platformFilter, profilePlatinums, query, statusFilter]);

  const progressGames = Math.max(profilePlatinums.length - (profileStats?.totalPlatinums ?? 0), 0);

  const achievedAchievements = useMemo(
    () => achievements.filter((achievement) => achievement.achieved),
    [achievements]
  );

  const missingAchievements = useMemo(
    () => achievements.filter((achievement) => !achievement.achieved),
    [achievements]
  );

  const userInitials = useMemo(() => {
    const fullName = profileUser?.name?.trim() ?? '';
    if (!fullName) {
      return 'PL';
    }

    const parts = fullName.split(' ').filter(Boolean).slice(0, 2);
    const initials = parts.map((part) => part[0]?.toUpperCase() ?? '').join('');
    return initials || 'PL';
  }, [profileUser?.name]);

  const recentProfileGames = useMemo(() => {
    return [...profilePlatinums]
      .sort((a, b) => {
        const dateA = getGameActivityTimestamp(a);
        const dateB = getGameActivityTimestamp(b);
        if (dateA !== dateB) {
          return dateB - dateA;
        }

        const progressA = a.total > 0 ? a.unlocked / a.total : 0;
        const progressB = b.total > 0 ? b.unlocked / b.total : 0;
        return progressB - progressA;
      })
      .slice(0, 6);
  }, [profilePlatinums]);

  const almostPlatinumGames = useMemo(() => {
    return [...profilePlatinums]
      .filter((game) => !game.isPlatinum && game.total > 0)
      .sort((a, b) => {
        const progressA = a.unlocked / a.total;
        const progressB = b.unlocked / b.total;
        return progressB - progressA;
      })
      .slice(0, 4);
  }, [profilePlatinums]);

  const resetAuthForm = () => {
    setNicknameInput('');
    setEmailInput('');
    setPasswordInput('');
  };

  const handleAuthSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthSubmitting(true);
    setAuthError(null);

    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';

    const payload =
      authMode === 'login'
        ? { email: emailInput.trim(), password: passwordInput }
        : { nickname: nicknameInput.trim(), email: emailInput.trim(), password: passwordInput };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const message = await readErrorMessage(response);
        throw new Error(message);
      }

      const result = (await response.json()) as AuthResponse;
      setSessionToken(result.token);
      setUser(result.user);
      resetAuthForm();
      setAuthError(null);
      navigateTo('/home', true);
    } catch (submitError) {
      console.error('Auth request failed:', submitError);
      setAuthError(submitError instanceof Error ? submitError.message : 'Erro ao autenticar.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleModeChange = (mode: AuthMode) => {
    navigateTo(mode === 'register' ? '/register' : '/login');
    setAuthError(null);
    resetAuthForm();
  };

  const handleLogout = async () => {
    try {
      if (authToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: authHeaders,
        });
      }
    } catch (logoutError) {
      console.error('Logout failed:', logoutError);
    } finally {
      setSessionToken(null);
      setUser(null);
      setProfileError(null);
      setQuery('');
      setPlatformFilter('all');
      setStatusFilter('all');
      setViewMode('grid');
      navigateTo('/login', true);
    }
  };

  const handleDeleteAccount = async () => {
    if (!authToken || deleteSubmitting) {
      return;
    }

    if (!window.confirm('Tem certeza que deseja apagar sua conta? Esta acao nao pode ser desfeita.')) {
      return;
    }

    setDeleteSubmitting(true);
    setProfileError(null);

    try {
      const response = await fetch('/api/auth/account', {
        method: 'DELETE',
        headers: authHeaders,
      });

      if (!response.ok) {
        const message = await readErrorMessage(response, 'Nao foi possivel apagar sua conta agora.');
        throw new Error(message);
      }

      setSessionToken(null);
      setUser(null);
      setQuery('');
      setPlatformFilter('all');
      setStatusFilter('all');
      setViewMode('grid');
      navigateTo('/login', true);
    } catch (error) {
      console.error('Account deletion failed:', error);
      setProfileError(error instanceof Error ? error.message : 'Falha ao apagar a conta.');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const handleConnectSteam = async () => {
    if (!authToken) {
      return;
    }

    setSteamLoading(true);
    setSteamError(null);

    try {
      const response = await fetch('/api/steam/connect', {
        method: 'POST',
        headers: authHeaders,
      });

      if (!response.ok) {
        const message = await readErrorMessage(response, 'Nao foi possivel iniciar conexao com a Steam.');
        throw new Error(message);
      }

      const payload = (await response.json()) as { url?: string };
      if (!payload.url) {
        throw new Error('Resposta invalida da conexao Steam.');
      }

      window.location.assign(payload.url);
    } catch (error) {
      console.error('Steam connect failed:', error);
      setSteamError(error instanceof Error ? error.message : 'Falha ao conectar com a Steam.');
      setSteamLoading(false);
    }
  };

  const handleDisconnectSteam = async () => {
    if (!authToken) {
      return;
    }

    setSteamLoading(true);
    setSteamError(null);

    try {
      const response = await fetch('/api/steam/disconnect', {
        method: 'POST',
        headers: authHeaders,
      });

      if (!response.ok) {
        const message = await readErrorMessage(response, 'Nao foi possivel desconectar a Steam.');
        throw new Error(message);
      }

      setSteamStatus(DEFAULT_STEAM_STATUS);
      await fetchDashboardData();
    } catch (error) {
      console.error('Steam disconnect failed:', error);
      setSteamError(error instanceof Error ? error.message : 'Falha ao desconectar da Steam.');
    } finally {
      setSteamLoading(false);
    }
  };

  const handleUpdateSteamAPIKey = async (apiKey: string) => {
    if (!authToken || !user) {
      throw new Error('Usuario nao autenticado');
    }

    const response = await fetch(`/api/users/${user.id}/steam-api-key`, {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ steam_api_key: apiKey }),
    });

    if (!response.ok) {
      const message = await readErrorMessage(response, 'Nao foi possivel atualizar a chave de API.');
      throw new Error(message);
    }
  };

  const activeTopBarPath = isHomeRoute
    ? '/home'
    : isOwnProfileRoute
      ? '/profile'
      : isFriendsRoute
        ? '/friends'
        : isMessagesRoute
          ? '/messages'
          : isSettingsRoute
            ? '/settings'
            : null;

  if (authChecking) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-1 items-center justify-center px-4">
        <div className="glass-panel flex items-center gap-3 px-6 py-4">
          <LoaderCircle className="animate-spin text-black/45" size={18} />
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-black/60">
            Validando sessao...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !isPublicProfileRoute) {
    return (
      <AuthPage
        authMode={authMode}
        authSubmitting={authSubmitting}
        authError={authError}
        nicknameInput={nicknameInput}
        emailInput={emailInput}
        passwordInput={passwordInput}
        onNicknameChange={setNicknameInput}
        onEmailChange={setEmailInput}
        onPasswordChange={setPasswordInput}
        onModeChange={handleModeChange}
        onSubmit={handleAuthSubmit}
      />
    );
  }

  if (!isAuthenticated && isPublicProfileRoute) {
    return (
      <>
        <header className="sticky top-0 z-40 border-b border-black/10 bg-[var(--bg-main)]/75 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-black/10 bg-white/70 p-2 shadow-sm shadow-black/5">
                <BrandLogo className="h-8 w-8" />
              </div>
              <div>
                <p className="font-display text-xl leading-none tracking-tight">PlatOne</p>
                <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-black/55">Perfil publico</p>
              </div>
            </div>
            <button
              className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white/65 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-black/75 transition-all hover:-translate-y-0.5 hover:bg-white"
              type="button"
              onClick={() => navigateTo('/login')}
            >
              Entrar
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-6 pt-8 sm:px-6 lg:px-8 lg:pt-8">
          {publicProfileLoading ? (
            <div className="mx-auto flex w-full max-w-4xl flex-1 items-center justify-center px-4 py-10">
              <div className="glass-panel flex items-center gap-3 px-6 py-4">
                <LoaderCircle className="animate-spin text-black/45" size={18} />
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-black/60">
                  Carregando perfil...
                </span>
              </div>
            </div>
          ) : publicProfileError ? (
            <div className="mx-auto w-full max-w-3xl rounded-2xl border border-red-300/55 bg-red-100/55 px-4 py-3 text-sm text-red-700">
              {publicProfileError}
            </div>
          ) : (
            <ProfilePage
              user={profileUser}
              userInitials={userInitials}
              steamStatus={profileSteamStatus}
              steamLoading={false}
              loadingData={profileLoadingData}
              steamError={profileSteamError}
              stats={profileStats}
              profilePlatinums={profilePlatinums}
              recentProfileGames={recentProfileGames}
              almostPlatinumGames={almostPlatinumGames}
              progressGames={progressGames}
              monthlyPlatinums={monthlyPlatinums}
              onSyncSteam={() => undefined}
              onConnectSteam={() => undefined}
              onDisconnectSteam={() => undefined}
              onOpenGameDetails={handleOpenGameDetails}
              handleGameImageError={handleGameImageError}
              formatDateTime={formatDateTime}
              isReadOnly
            />
          )}
        </main>

        <AppFooter />

        <AnimatePresence>
          {selectedGame && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-8 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeAchievementsModal}
            >
              <motion.section
                className="glass-panel w-full max-w-4xl overflow-hidden"
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="border-b border-black/10 px-5 py-4 sm:px-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-black/55">Detalhes do jogo</p>
                      <h2 className="mt-1 font-display text-3xl leading-tight">{selectedGame.title}</h2>
                      <p className="mt-2 text-sm text-black/65">
                        {selectedGame.unlocked}/{selectedGame.total} conquistas no total
                      </p>
                    </div>

                    <button
                      type="button"
                      className="rounded-lg p-2 text-black/50 transition-colors hover:bg-black/5 hover:text-black/80"
                      onClick={closeAchievementsModal}
                      aria-label="Fechar detalhes"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                <div className="max-h-[70vh] overflow-y-auto px-5 py-4 sm:px-6">
                  {achievementsLoading ? (
                    <div className="flex min-h-52 items-center justify-center">
                      <LoaderCircle className="animate-spin text-black/35" size={28} />
                    </div>
                  ) : achievementsError ? (
                    <p className="rounded-xl border border-red-300/55 bg-red-100/55 px-3 py-2 text-sm text-red-700">
                      {achievementsError}
                    </p>
                  ) : (
                    <div className="space-y-6">
                      <div>
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-500/12 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-emerald-700">
                          <CheckCircle2 size={13} />
                          Conquistadas ({achievedAchievements.length})
                        </div>
                        <div className="space-y-2">
                          {achievedAchievements.length > 0 ? (
                            achievedAchievements.map((achievement) => (
                              <AchievementRow key={achievement.id} achievement={achievement} />
                            ))
                          ) : (
                            <p className="text-sm text-black/60">Nenhuma conquista obtida ainda.</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-500/12 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-amber-700">
                          <Clock3 size={13} />
                          Faltando ({missingAchievements.length})
                        </div>
                        <div className="space-y-2">
                          {missingAchievements.length > 0 ? (
                            missingAchievements.map((achievement) => (
                              <AchievementRow key={achievement.id} achievement={achievement} />
                            ))
                          ) : (
                            <p className="text-sm text-black/60">Voce ja desbloqueou todas as conquistas deste jogo.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.section>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <>
      <AppTopBar
        userName={user?.name}
        currentUserId={user?.id}
        activePath={activeTopBarPath}
        onNavigate={(path) => navigateTo(path)}
        onLogout={handleLogout}
      />

      <main
        className={`mx-auto w-full max-w-7xl flex-1 px-4 pt-8 sm:px-6 lg:px-8 ${
          isProfileRoute || isSettingsRoute || isFriendsRoute || isMessagesRoute ? 'pb-2 lg:pt-8' : 'pb-10 lg:pt-10'
        }`}
      >
        {isSettingsRoute ? (
          <SettingsPage
            user={user}
            steamStatus={steamStatus}
            steamLoading={steamLoading}
            loadingData={loadingData}
            steamError={steamError}
            profileError={profileError}
            deleteSubmitting={deleteSubmitting}
            onSyncSteam={handleSyncSteam}
            onConnectSteam={handleConnectSteam}
            onDisconnectSteam={handleDisconnectSteam}
            onDeleteAccount={handleDeleteAccount}
            onUpdateSteamAPIKey={handleUpdateSteamAPIKey}
            formatDateTime={formatDateTime}
          />
        ) : isFriendsRoute ? (
          <FriendsPage
            currentUserId={user?.id}
            onSendMessage={(friendId, friendName) => {
              if (typeof window !== 'undefined') {
                sessionStorage.setItem(MESSAGE_FRIEND_ID_STORAGE_KEY, friendId);
                sessionStorage.setItem(MESSAGE_FRIEND_NAME_STORAGE_KEY, friendName);
              }
              navigateTo('/messages');
            }}
          />
        ) : isMessagesRoute ? (
          <MessagesPage currentUserId={user?.id} />
        ) : isProfileRoute ? (
          <ProfilePage
            user={profileUser}
            userInitials={userInitials}
            steamStatus={profileSteamStatus}
            steamLoading={profileSteamLoading}
            loadingData={profileLoadingData}
            steamError={profileSteamError}
            stats={profileStats}
            profilePlatinums={profilePlatinums}
            recentProfileGames={recentProfileGames}
            almostPlatinumGames={almostPlatinumGames}
            progressGames={progressGames}
            monthlyPlatinums={monthlyPlatinums}
            onSyncSteam={handleSyncSteam}
            onConnectSteam={handleConnectSteam}
            onDisconnectSteam={handleDisconnectSteam}
            onOpenGameDetails={handleOpenGameDetails}
            handleGameImageError={handleGameImageError}
            formatDateTime={formatDateTime}
            isReadOnly={isPublicProfileRoute}
          />
        ) : (
          <HomePage
            stats={stats}
            monthlyPlatinums={monthlyPlatinums}
            query={query}
            onQueryChange={setQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            platforms={platforms}
            platformFilter={platformFilter}
            onPlatformFilterChange={setPlatformFilter}
            loadingData={loadingData}
            dataError={dataError}
            filteredPlatinums={filteredPlatinums}
            onOpenGameDetails={handleOpenGameDetails}
            handleGameImageError={handleGameImageError}
            formatDate={formatDate}
          />
        )}
      </main>

      <AppFooter />

      <AnimatePresence>
        {selectedGame && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-8 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeAchievementsModal}
          >
            <motion.section
              className="glass-panel w-full max-w-4xl overflow-hidden"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="border-b border-black/10 px-5 py-4 sm:px-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-black/55">Detalhes do jogo</p>
                    <h2 className="mt-1 font-display text-3xl leading-tight">{selectedGame.title}</h2>
                    <p className="mt-2 text-sm text-black/65">
                      {selectedGame.unlocked}/{selectedGame.total} conquistas no total
                    </p>
                  </div>

                  <button
                    type="button"
                    className="rounded-lg p-2 text-black/50 transition-colors hover:bg-black/5 hover:text-black/80"
                    onClick={closeAchievementsModal}
                    aria-label="Fechar detalhes"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="max-h-[70vh] overflow-y-auto px-5 py-4 sm:px-6">
                {achievementsLoading ? (
                  <div className="flex min-h-52 items-center justify-center">
                    <LoaderCircle className="animate-spin text-black/35" size={28} />
                  </div>
                ) : achievementsError ? (
                  <p className="rounded-xl border border-red-300/55 bg-red-100/55 px-3 py-2 text-sm text-red-700">
                    {achievementsError}
                  </p>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-500/12 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-emerald-700">
                        <CheckCircle2 size={13} />
                        Conquistadas ({achievedAchievements.length})
                      </div>
                      <div className="space-y-2">
                        {achievedAchievements.length > 0 ? (
                          achievedAchievements.map((achievement) => (
                            <AchievementRow key={achievement.id} achievement={achievement} />
                          ))
                        ) : (
                          <p className="text-sm text-black/60">Nenhuma conquista obtida ainda.</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-500/12 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-amber-700">
                        <Clock3 size={13} />
                        Faltando ({missingAchievements.length})
                      </div>
                      <div className="space-y-2">
                        {missingAchievements.length > 0 ? (
                          missingAchievements.map((achievement) => (
                            <AchievementRow key={achievement.id} achievement={achievement} />
                          ))
                        ) : (
                          <p className="text-sm text-black/60">Voce ja desbloqueou todas as conquistas deste jogo.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function AchievementRow({ achievement }: { key?: string; achievement: Achievement }) {
  const iconSource = achievement.achieved ? achievement.icon : achievement.iconGray ?? achievement.icon;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-black/10 bg-white/60 p-3">
      <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-black/5">
        {iconSource ? (
          <img
            src={iconSource}
            alt={achievement.name}
            className={`h-full w-full object-cover ${achievement.achieved ? '' : 'grayscale'}`}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-black/35">
            <Trophy size={14} />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-black/85">{achievement.name}</p>
          {achievement.hidden && (
            <span className="rounded-full bg-black/8 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-black/55">
              Oculta
            </span>
          )}
        </div>
        {achievement.description && <p className="mt-1 text-xs text-black/65">{achievement.description}</p>}
        {achievement.achieved && achievement.unlockTime && (
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-emerald-700">
            Desbloqueada em {formatDateTime(achievement.unlockTime)}
          </p>
        )}
      </div>
    </div>
  );
}

function handleGameImageError(event: SyntheticEvent<HTMLImageElement>) {
  const image = event.currentTarget;
  const currentSrc = image.getAttribute('src') ?? '';
  const backupSrc = image.dataset.backupSrc?.trim() ?? '';
  const fallbackSrc = image.dataset.fallbackSrc?.trim() ?? '';

  if (backupSrc && backupSrc !== currentSrc) {
    image.setAttribute('src', backupSrc);
    image.dataset.backupSrc = '';
    return;
  }

  if (fallbackSrc && fallbackSrc !== currentSrc) {
    image.setAttribute('src', fallbackSrc);
    image.dataset.fallbackSrc = '';
    return;
  }

  image.onerror = null;
}

function normalizePath(pathname: string): AppRoute {
  if (pathname === '/login') {
    return '/login';
  }

  if (pathname === '/register') {
    return '/register';
  }

  if (pathname === '/profile') {
    return '/profile';
  }

  if (pathname.startsWith('/profile/')) {
    const rawSegment = pathname.slice('/profile/'.length).split('/')[0]?.trim() ?? '';
    if (rawSegment) {
      return `/profile/${rawSegment}`;
    }
  }

  if (pathname === '/settings') {
    return '/settings';
  }

  if (pathname === '/friends') {
    return '/friends';
  }

  if (pathname === '/messages') {
    return '/messages';
  }

  return '/home';
}

function getNormalizedPath(): AppRoute {
  if (typeof window === 'undefined') {
    return '/home';
  }

  return normalizePath(window.location.pathname);
}

function getPublicProfileName(routePath: AppRoute): string | null {
  if (!routePath.startsWith('/profile/')) {
    return null;
  }

  const rawName = routePath.slice('/profile/'.length).trim();
  if (!rawName) {
    return null;
  }

  try {
    return decodeURIComponent(rawName);
  } catch {
    return rawName;
  }
}

function getStoredToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

async function readErrorMessage(
  response: Response,
  fallback = 'Ocorreu um erro na autenticacao.'
): Promise<string> {
  let bodyText = '';

  try {
    bodyText = await response.text();
  } catch (readError) {
    console.error('Error reading API error payload:', readError);
    return fallback;
  }

  const trimmedBody = bodyText.trim();
  if (!trimmedBody) {
    return fallback;
  }

  const contentType = (response.headers.get('content-type') ?? '').toLowerCase();
  const looksLikeJson = contentType.includes('application/json') || trimmedBody.startsWith('{');

  if (looksLikeJson) {
    try {
      const payload = JSON.parse(trimmedBody) as { error?: string };
      if (typeof payload?.error === 'string' && payload.error.trim().length > 0) {
        return payload.error;
      }
    } catch {
      // Ignore parsing failure and fallback to plain text below.
    }
  }

  if (trimmedBody.startsWith('<')) {
    return fallback;
  }

  return trimmedBody;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  return value as UnknownRecord;
}

function readString(record: UnknownRecord | null, ...keys: string[]): string | undefined {
  if (!record) {
    return undefined;
  }

  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }

  return undefined;
}

function readNumber(record: UnknownRecord | null, ...keys: string[]): number | undefined {
  if (!record) {
    return undefined;
  }

  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim().length > 0) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return undefined;
}

function readBoolean(record: UnknownRecord | null, ...keys: string[]): boolean | undefined {
  if (!record) {
    return undefined;
  }

  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      if (value.toLowerCase() === 'true') {
        return true;
      }
      if (value.toLowerCase() === 'false') {
        return false;
      }
    }
  }

  return undefined;
}

function normalizePlatinums(payload: unknown): Platinum[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.map((entry, index) => normalizePlatinum(entry, index));
}

function normalizePlatinum(entry: unknown, index: number): Platinum {
  const record = asRecord(entry);
  const metadata = asRecord(record?.metadata);
  const objectId = asRecord(record?.id);

  const id = readString(record, 'id') ?? readString(objectId, '$oid') ?? `game-${index + 1}`;
  const title =
    readString(record, 'title', 'game_title', 'gameTitle') ??
    readString(metadata, 'title', 'name') ??
    `Jogo ${index + 1}`;

  const platform = readString(record, 'platform') ?? readString(metadata, 'platform') ?? 'Unknown';

  const unlocked =
    readNumber(record, 'unlocked', 'unlocked_count') ??
    readNumber(metadata, 'unlocked', 'unlocked_count') ??
    0;

  const total =
    readNumber(record, 'total', 'total_achievements') ??
    readNumber(metadata, 'total', 'total_achievements') ??
    unlocked;

  const isPlatinum =
    readBoolean(record, 'isPlatinum', 'is_platinum') ??
    readBoolean(metadata, 'isPlatinum', 'is_platinum') ??
    (total > 0 && unlocked >= total);

  const date =
    readString(record, 'date', 'validation_date') ??
    readString(metadata, 'date', 'validation_date') ??
    null;

  const storedIcon = readString(record, 'icon', 'image') ?? readString(metadata, 'icon', 'image');
  const storedBackupIcon =
    readString(record, 'icon_fallback', 'thumbnail') ??
    readString(metadata, 'icon_fallback', 'thumbnail');

  const rawExternalId =
    readString(record, 'external_id') ??
    readString(metadata, 'external_id') ??
    readString(record, 'game_id', 'gameId') ??
    readString(metadata, 'game_id');

  const externalId = normalizeGameExternalId(platform, rawExternalId, storedIcon, storedBackupIcon);

  const fallbackIcon = createFallbackIcon(title);
  const icon =
    resolvePreferredGameArtwork(platform, externalId, storedIcon ?? storedBackupIcon) ??
    storedIcon ??
    storedBackupIcon ??
    fallbackIcon;
  const backupIcon = pickBackupGameArtwork(icon, storedBackupIcon ?? storedIcon, fallbackIcon);

  return {
    id,
    title,
    platform,
    externalId: externalId ?? null,
    unlocked,
    total: total > 0 ? total : unlocked,
    isPlatinum,
    date,
    icon,
    backupIcon,
    fallbackIcon,
  };
}

function normalizeGameExternalId(
  platform: string,
  externalId: string | undefined,
  primaryImage: string | undefined,
  backupImage: string | undefined
): string | undefined {
  const normalized = externalId?.trim();

  if (platform.toLowerCase() !== 'steam') {
    return normalized;
  }

  if (normalized && /^\d+$/.test(normalized)) {
    return normalized;
  }

  return extractSteamAppIDFromImage(primaryImage) ?? extractSteamAppIDFromImage(backupImage);
}

function extractSteamAppIDFromImage(image: string | undefined): string | undefined {
  if (!image) {
    return undefined;
  }

  const match = image.match(/\/apps\/(\d+)\//i);
  return match?.[1];
}

function normalizeAchievements(payload: unknown): Achievement[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .map((entry, index) => normalizeAchievement(entry, index))
    .filter((achievement): achievement is Achievement => achievement !== null);
}

function normalizeAchievement(entry: unknown, index: number): Achievement | null {
  const record = asRecord(entry);
  const id = readString(record, 'id', 'apiName', 'apiname');
  if (!id) {
    return null;
  }

  return {
    id,
    name: readString(record, 'name', 'displayName') ?? `Conquista ${index + 1}`,
    description: readString(record, 'description') ?? '',
    icon: readString(record, 'icon') ?? null,
    iconGray: readString(record, 'iconGray', 'icon_gray', 'icongray') ?? null,
    hidden: readBoolean(record, 'hidden') ?? false,
    achieved: readBoolean(record, 'achieved') ?? false,
    unlockTime: readString(record, 'unlockTime', 'unlock_time') ?? null,
  };
}

function normalizeStats(payload: unknown, fallbackTotalGames: number): Stats {
  const record = asRecord(payload);

  return {
    totalPlatinums: readNumber(record, 'totalPlatinums', 'total_platinums') ?? 0,
    totalGames: readNumber(record, 'totalGames', 'total_games') ?? fallbackTotalGames,
    lastSync: readString(record, 'lastSync', 'last_sync') ?? new Date().toISOString(),
  };
}

function normalizeSteamStatus(payload: unknown): SteamStatus {
  const record = asRecord(payload);
  const connected = Boolean(readBoolean(record, 'connected'));

  return {
    connected,
    steamId: connected ? readString(record, 'steamId', 'steam_id') ?? null : null,
    linkedAt: connected ? readString(record, 'linkedAt', 'linked_at') ?? null : null,
  };
}

function normalizePublicUser(payload: unknown, fallbackName: string): AuthUser {
  const record = asRecord(payload);
  const name = readString(record, 'name') ?? fallbackName;

  return {
    id: readString(record, 'id') ?? `public-${name.toLowerCase().replace(/\s+/g, '-')}`,
    name,
    email: readString(record, 'email') ?? '',
    createdAt: readString(record, 'createdAt', 'created_at') ?? new Date().toISOString(),
  };
}

function resolvePreferredGameArtwork(
  platform: string,
  externalId: string | undefined,
  image: string | undefined
): string | undefined {
  if (platform.toLowerCase() !== 'steam') {
    return image;
  }

  return createSteamCapsuleArtwork(externalId) ?? upgradeSteamCommunityIcon(image) ?? image;
}

function pickBackupGameArtwork(
  primaryImage: string,
  backupCandidate: string | undefined,
  fallbackIcon: string
): string | null {
  if (backupCandidate && backupCandidate !== primaryImage) {
    return backupCandidate;
  }

  return fallbackIcon !== primaryImage ? fallbackIcon : null;
}

function createSteamCapsuleArtwork(appId: string | undefined): string | null {
  const normalizedAppId = appId?.trim() ?? '';
  if (!/^\d+$/.test(normalizedAppId)) {
    return null;
  }

  return `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${normalizedAppId}/capsule_616x353.jpg`;
}

function upgradeSteamCommunityIcon(image: string | undefined): string | undefined {
  if (!image) {
    return undefined;
  }

  const match = image.match(/\/apps\/(\d+)\/[^/]+\.jpg(?:\?.*)?$/i);
  if (!match) {
    return image;
  }

  return createSteamCapsuleArtwork(match[1]) ?? image;
}

function createFallbackIcon(title: string): string {
  const initials =
    title
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'PL';

  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='#3fa9c9'/><stop offset='100%' stop-color='#d6806a'/></linearGradient></defs><rect width='160' height='160' fill='url(#g)'/><text x='80' y='92' text-anchor='middle' font-family='Arial, sans-serif' font-size='48' font-weight='700' fill='white'>${initials}</text></svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function getGameActivityTimestamp(game: Platinum): number {
  if (game.date) {
    const parsedDate = Date.parse(game.date);
    if (Number.isFinite(parsedDate)) {
      return parsedDate;
    }
  }

  const completion = game.total > 0 ? game.unlocked / game.total : 0;
  return Math.round(completion * 1_000_000);
}
