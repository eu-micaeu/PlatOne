import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  CheckCircle2,
  Clock3,
  ExternalLink,
  Filter,
  Gamepad2,
  LayoutGrid,
  List as ListIcon,
  LoaderCircle,
  Lock,
  LogOut,
  Mail,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Trophy,
  User,
  UserPlus,
} from 'lucide-react';

interface Platinum {
  id: string;
  title: string;
  platform: string;
  unlocked: number;
  total: number;
  isPlatinum: boolean;
  date: string | null;
  icon: string;
}

interface Stats {
  totalPlatinums: number;
  totalGames: number;
  lastSync: string;
}

interface AuthUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface AuthResponse {
  token: string;
  user: AuthUser;
}

type StatusFilter = 'all' | 'platinum' | 'progress';

type ViewMode = 'grid' | 'list';

type AuthMode = 'login' | 'register';

const TOKEN_STORAGE_KEY = 'platone.auth.token';

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'Tudo' },
  { value: 'platinum', label: 'Platinado' },
  { value: 'progress', label: 'Progresso' },
];

export default function App() {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [authToken, setAuthToken] = useState<string | null>(() => getStoredToken());
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  const [platinums, setPlatinums] = useState<Platinum[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [query, setQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const authHeaders = useMemo(
    () => (authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    [authToken]
  );

  const isAuthenticated = Boolean(authToken && user);

  const setSessionToken = useCallback((token: string | null) => {
    setAuthToken(token);
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
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
    if (!isAuthenticated) {
      setPlatinums([]);
      setStats(null);
      setDataError(null);
      setLoadingData(false);
      return;
    }

    fetchDashboardData();
  }, [fetchDashboardData, isAuthenticated]);

  const totalAchievements = useMemo(
    () => platinums.reduce((acc, game) => acc + game.total, 0),
    [platinums]
  );

  const unlockedAchievements = useMemo(
    () => platinums.reduce((acc, game) => acc + game.unlocked, 0),
    [platinums]
  );

  const completionRate =
    totalAchievements > 0 ? Math.round((unlockedAchievements / totalAchievements) * 100) : 0;

  const monthlyPlatinums = useMemo(() => {
    const now = new Date();
    return platinums.filter((game) => {
      if (!game.isPlatinum || !game.date) {
        return false;
      }
      const gameDate = new Date(game.date);
      return gameDate.getMonth() === now.getMonth() && gameDate.getFullYear() === now.getFullYear();
    }).length;
  }, [platinums]);

  const platforms = useMemo(
    () => ['all', ...new Set(platinums.map((game) => game.platform))],
    [platinums]
  );

  const filteredPlatinums = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();

    return platinums
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
  }, [platinums, platformFilter, query, statusFilter]);

  const progressGames = Math.max(platinums.length - (stats?.totalPlatinums ?? 0), 0);

  const resetAuthForm = () => {
    setNameInput('');
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
        : { name: nameInput.trim(), email: emailInput.trim(), password: passwordInput };

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
    } catch (submitError) {
      console.error('Auth request failed:', submitError);
      setAuthError(submitError instanceof Error ? submitError.message : 'Erro ao autenticar.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleModeChange = (mode: AuthMode) => {
    setAuthMode(mode);
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
      setQuery('');
      setPlatformFilter('all');
      setStatusFilter('all');
      setViewMode('grid');
    }
  };

  if (authChecking) {
    return (
      <BackgroundLayout>
        <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-4">
          <div className="glass-panel flex items-center gap-3 px-6 py-4">
            <LoaderCircle className="animate-spin text-black/45" size={18} />
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-black/60">
              Validando sessao...
            </span>
          </div>
        </div>
      </BackgroundLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <BackgroundLayout>
        <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid w-full gap-6 lg:grid-cols-2">
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="glass-panel p-8"
            >
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--ink-main)] text-[var(--bg-main)]">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <p className="font-display text-3xl leading-none">PlatOne</p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-black/55">
                    Secure Access Layer
                  </p>
                </div>
              </div>

              <h1 className="font-display text-4xl leading-tight sm:text-5xl">
                Login e registro
                <span className="text-[var(--brand-gold)]"> prontos para uso</span>
              </h1>

              <p className="mt-4 text-sm text-black/70 sm:text-base">
                Crie sua conta para acessar o dashboard de conquistas, manter sessao ativa e sincronizar o progresso
                em um fluxo seguro.
              </p>

              <div className="mt-8 grid grid-cols-2 gap-3">
                <FeaturePill icon={<UserPlus size={14} />} text="Registro rapido" />
                <FeaturePill icon={<Lock size={14} />} text="Sessao por token" />
                <FeaturePill icon={<RefreshCw size={14} />} text="Login persistente" />
                <FeaturePill icon={<Gamepad2 size={14} />} text="Dashboard protegido" />
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.06 }}
              className="glass-panel p-6 sm:p-8"
            >
              <div className="mb-6 inline-flex rounded-full border border-black/10 bg-white/65 p-1">
                <button
                  type="button"
                  onClick={() => handleModeChange('login')}
                  className={`rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors ${
                    authMode === 'login' ? 'bg-[var(--ink-main)] text-white' : 'text-black/60 hover:bg-black/6'
                  }`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('register')}
                  className={`rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors ${
                    authMode === 'register' ? 'bg-[var(--ink-main)] text-white' : 'text-black/60 hover:bg-black/6'
                  }`}
                >
                  Register
                </button>
              </div>

              <form className="space-y-4" onSubmit={handleAuthSubmit}>
                {authMode === 'register' && (
                  <label className="block">
                    <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.16em] text-black/55">
                      Nome
                    </span>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/35" size={15} />
                      <input
                        type="text"
                        value={nameInput}
                        onChange={(event) => setNameInput(event.target.value)}
                        className="w-full rounded-xl border border-black/10 bg-white/70 py-2.5 pl-10 pr-3 text-sm text-black/80 outline-none transition-all placeholder:text-black/35 focus:border-black/25 focus:bg-white"
                        placeholder="Seu nome"
                        required
                      />
                    </div>
                  </label>
                )}

                <label className="block">
                  <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.16em] text-black/55">
                    Email
                  </span>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/35" size={15} />
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(event) => setEmailInput(event.target.value)}
                      className="w-full rounded-xl border border-black/10 bg-white/70 py-2.5 pl-10 pr-3 text-sm text-black/80 outline-none transition-all placeholder:text-black/35 focus:border-black/25 focus:bg-white"
                      placeholder="voce@platone.dev"
                      required
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.16em] text-black/55">
                    Senha
                  </span>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/35" size={15} />
                    <input
                      type="password"
                      value={passwordInput}
                      onChange={(event) => setPasswordInput(event.target.value)}
                      className="w-full rounded-xl border border-black/10 bg-white/70 py-2.5 pl-10 pr-3 text-sm text-black/80 outline-none transition-all placeholder:text-black/35 focus:border-black/25 focus:bg-white"
                      placeholder="Minimo 6 caracteres"
                      required
                      minLength={6}
                    />
                  </div>
                </label>

                {authError && (
                  <p className="rounded-xl border border-red-300/55 bg-red-100/55 px-3 py-2 text-sm text-red-700">
                    {authError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={authSubmitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--ink-main)] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {authSubmitting ? (
                    <>
                      <LoaderCircle size={16} className="animate-spin" />
                      Processando...
                    </>
                  ) : authMode === 'login' ? (
                    <>
                      <ShieldCheck size={16} />
                      Entrar
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} />
                      Criar conta
                    </>
                  )}
                </button>
              </form>

              <p className="mt-5 rounded-xl border border-black/10 bg-black/[0.03] p-3 font-mono text-[11px] leading-relaxed text-black/60">
                Contas criadas aqui liberam acesso ao dashboard e consulta no backend conectado ao MongoDB.
              </p>
            </motion.section>
          </div>
        </main>
      </BackgroundLayout>
    );
  }

  return (
    <BackgroundLayout>
      <header className="sticky top-0 z-40 border-b border-black/10 bg-[var(--bg-main)]/75 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--ink-main)] text-[var(--bg-main)] shadow-lg shadow-black/20">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="font-display text-xl leading-none tracking-tight">PlatOne</p>
              <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-black/55">
                Trophy Command Deck
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden rounded-full bg-black/6 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-black/65 sm:inline-flex">
              {user?.name}
            </span>
            <button
              className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white/65 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-black/75 transition-all hover:-translate-y-0.5 hover:bg-white"
              type="button"
              onClick={fetchDashboardData}
            >
              <RefreshCw size={14} />
              Sync Feed
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white/65 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-black/75 transition-all hover:-translate-y-0.5 hover:bg-white"
              type="button"
              onClick={handleLogout}
            >
              <LogOut size={14} />
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 pb-10 pt-8 sm:px-6 lg:px-8 lg:pt-10">
        <motion.section
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="mb-8 grid gap-5 lg:grid-cols-3"
        >
          <div className="glass-panel p-6 sm:p-8 lg:col-span-2">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-black/5 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.24em] text-black/60">
              <Sparkles size={12} />
              Performance Snapshot
            </div>

            <h1 className="font-display text-4xl leading-[0.95] tracking-tight sm:text-5xl lg:text-6xl">
              Seu painel de
              <span className="text-[var(--brand-gold)]"> conquista total</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm text-black/70 sm:text-base">
              Veja progresso, platinas concluidas e pontos de atencao em um dashboard criado para leitura rapida,
              comparacao entre plataformas e foco no proximo 100%.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <StatTile label="Platinas" value={stats?.totalPlatinums ?? 0} helper="Titulos finalizados" />
              <StatTile label="Jogos" value={stats?.totalGames ?? 0} helper="Biblioteca sincronizada" />
              <StatTile label="No mes" value={monthlyPlatinums} helper="Platinas recentes" />
            </div>
          </div>

          <div className="glass-panel flex flex-col justify-between p-6 sm:p-7">
            <div>
              <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-black/50">
                <TrendingUp size={14} />
                Completion Rate
              </div>
              <p className="font-display text-5xl leading-none">{completionRate}%</p>
              <p className="mt-2 text-sm text-black/60">
                {unlockedAchievements} de {totalAchievements} conquistas liberadas
              </p>
            </div>

            <div className="mt-6 space-y-3">
              <div className="h-2 overflow-hidden rounded-full bg-black/10">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--brand-cyan)] via-[var(--brand-gold)] to-[var(--brand-rose)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${completionRate}%` }}
                  transition={{ duration: 1.1, ease: 'easeOut', delay: 0.2 }}
                />
              </div>
              <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.15em] text-black/50">
                <span>Em progresso: {progressGames}</span>
                <span>Status: online</span>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
          className="glass-panel mb-6 p-4 sm:p-5"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/35"
                size={16}
              />
              <input
                type="text"
                placeholder="Buscar jogo ou plataforma..."
                className="w-full rounded-xl border border-black/10 bg-white/70 py-2.5 pl-10 pr-3 text-sm text-black/80 outline-none transition-all placeholder:text-black/35 focus:border-black/25 focus:bg-white"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Filter size={15} className="text-black/45" />
              {STATUS_OPTIONS.map((status) => (
                <button
                  key={status.value}
                  type="button"
                  onClick={() => setStatusFilter(status.value)}
                  className={`rounded-full px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] transition-all ${
                    statusFilter === status.value
                      ? 'bg-[var(--ink-main)] text-[var(--bg-main)]'
                      : 'bg-black/5 text-black/60 hover:bg-black/10'
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>

            <div className="inline-flex items-center gap-1 rounded-xl border border-black/10 bg-white/65 p-1">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`rounded-lg p-2 transition-colors ${
                  viewMode === 'grid' ? 'bg-[var(--ink-main)] text-white' : 'text-black/55 hover:bg-black/5'
                }`}
                aria-label="Alternar para grade"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`rounded-lg p-2 transition-colors ${
                  viewMode === 'list' ? 'bg-[var(--ink-main)] text-white' : 'text-black/55 hover:bg-black/5'
                }`}
                aria-label="Alternar para lista"
              >
                <ListIcon size={16} />
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {platforms.map((platform) => (
              <button
                key={platform}
                type="button"
                onClick={() => setPlatformFilter(platform)}
                className={`rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] transition-all ${
                  platformFilter === platform
                    ? 'border-transparent bg-gradient-to-r from-[var(--brand-cyan)] via-[var(--brand-gold)] to-[var(--brand-rose)] text-[var(--ink-main)]'
                    : 'border-black/10 bg-white/55 text-black/60 hover:bg-white/80'
                }`}
              >
                {platform === 'all' ? 'Todas plataformas' : platform}
              </button>
            ))}
          </div>
        </motion.section>

        {loadingData && (
          <div className="glass-panel flex h-64 items-center justify-center p-6">
            <RefreshCw className="animate-spin text-black/25" size={40} />
          </div>
        )}

        {!loadingData && dataError && (
          <div className="glass-panel p-6">
            <p className="font-display text-2xl">Erro de sincronizacao</p>
            <p className="mt-2 text-sm text-black/70">{dataError}</p>
          </div>
        )}

        {!loadingData && !dataError && filteredPlatinums.length === 0 && (
          <div className="glass-panel p-8 text-center">
            <Gamepad2 className="mx-auto mb-4 text-black/35" size={38} />
            <p className="font-display text-3xl">Nenhum jogo encontrado</p>
            <p className="mt-2 text-sm text-black/65">Ajuste filtros ou termo de busca para encontrar resultados.</p>
          </div>
        )}

        {!loadingData && !dataError && filteredPlatinums.length > 0 && (
          <div
            className={
              viewMode === 'grid' ? 'grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3' : 'space-y-3'
            }
          >
            <AnimatePresence mode="popLayout">
              {filteredPlatinums.map((game, index) => (
                <GameCard key={game.id} game={game} viewMode={viewMode} order={index} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      <footer className="border-t border-black/10 bg-white/30">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-4 text-[10px] uppercase tracking-[0.2em] text-black/50 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>PlatOne Control Layer | React + Go</span>
          <span>Ultimo sync: {stats?.lastSync ? formatDateTime(stats.lastSync) : 'nunca'}</span>
        </div>
      </footer>
    </BackgroundLayout>
  );
}

function BackgroundLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--bg-main)] text-[var(--ink-main)] selection:bg-[var(--ink-main)] selection:text-[var(--bg-main)]">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[-15%] top-[-8%] h-[420px] w-[420px] rounded-full bg-[var(--brand-cyan)]/20 blur-3xl" />
        <div className="absolute right-[-12%] top-[12%] h-[340px] w-[340px] rounded-full bg-[var(--brand-gold)]/20 blur-3xl" />
        <div className="absolute bottom-[-20%] left-[30%] h-[420px] w-[420px] rounded-full bg-[var(--brand-rose)]/20 blur-3xl" />
        <div className="atmosphere-grid h-full w-full" />
      </div>
      {children}
    </div>
  );
}

function FeaturePill({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/60 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-black/65">
      {icon}
      <span>{text}</span>
    </div>
  );
}

function StatTile({
  label,
  value,
  helper,
}: {
  label: string;
  value: number | string;
  helper: string;
}) {
  return (
    <div className="rounded-xl border border-black/10 bg-white/55 p-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-black/55">{label}</p>
      <p className="mt-1 font-display text-3xl leading-none">{value}</p>
      <p className="mt-1 text-xs text-black/55">{helper}</p>
    </div>
  );
}

function GameCard({
  game,
  viewMode,
  order,
}: {
  game: Platinum;
  viewMode: ViewMode;
  order: number;
}) {
  const completion = game.total > 0 ? Math.round((game.unlocked / game.total) * 100) : 0;

  if (viewMode === 'list') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ delay: order * 0.03, duration: 0.28 }}
        className="glass-panel flex items-center gap-4 p-4 sm:gap-6"
      >
        <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-200">
          <img
            src={game.icon}
            alt={game.title}
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span
              className={`rounded-full px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] ${
                game.platform === 'Steam'
                  ? 'bg-blue-500/10 text-blue-600'
                  : game.platform === 'Xbox'
                    ? 'bg-green-500/10 text-green-600'
                    : 'bg-indigo-500/10 text-indigo-600'
              }`}
            >
              {game.platform}
            </span>
            <h3 className="truncate text-sm font-semibold sm:text-base">{game.title}</h3>
          </div>

          <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-[0.13em] text-black/45">
            <span>Conquistas: {game.unlocked}/{game.total}</span>
            <span>Progresso: {completion}%</span>
            {game.date && <span>Finalizado: {formatDate(game.date)}</span>}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {game.isPlatinum ? (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-emerald-700">
              <CheckCircle2 size={14} />
              <span>Platinado</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-black/8 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-black/55">
              <Clock3 size={14} />
              <span>Progresso</span>
            </div>
          )}

          <button
            type="button"
            className="rounded-lg p-2 text-black/45 transition-colors hover:bg-black/5 hover:text-black/80"
            aria-label={`Abrir detalhes de ${game.title}`}
          >
            <ExternalLink size={14} />
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: order * 0.04, duration: 0.32 }}
      whileHover={{ y: -5, rotate: -0.1 }}
      className="glass-panel group flex cursor-pointer flex-col overflow-hidden"
    >
      <div className="relative aspect-video overflow-hidden bg-zinc-100">
        <img
          src={game.icon}
          alt={game.title}
          className="h-full w-full object-cover saturate-75 transition-all duration-500 group-hover:scale-105 group-hover:saturate-100"
          referrerPolicy="no-referrer"
        />

        <div className="absolute left-3 top-3">
          <span
            className={`rounded-full px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] backdrop-blur-md ${
              game.platform === 'Steam'
                ? 'bg-blue-500/80 text-white'
                : game.platform === 'Xbox'
                  ? 'bg-green-500/80 text-white'
                  : 'bg-indigo-500/80 text-white'
            }`}
          >
            {game.platform}
          </span>
        </div>

        {game.isPlatinum && (
          <div className="absolute right-3 top-3">
            <div className="rounded-full bg-emerald-400 p-1.5 text-black shadow-lg shadow-emerald-500/25">
              <Trophy size={14} />
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-2xl leading-tight">{game.title}</h3>

        <div className="mt-5 space-y-3">
          <div className="flex items-end justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-black/55">
            <span>Progresso</span>
            <span className="font-semibold text-black/80">{completion}%</span>
          </div>

          <div className="h-1.5 overflow-hidden rounded-full bg-black/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completion}%` }}
              transition={{ duration: 0.9, delay: 0.15 }}
              className={`h-full ${
                game.isPlatinum
                  ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                  : 'bg-gradient-to-r from-[var(--ink-main)] to-black/65'
              }`}
            />
          </div>

          <div className="flex items-center justify-between border-t border-black/10 pt-2 font-mono text-[10px] uppercase tracking-[0.13em] text-black/50">
            <span>
              {game.unlocked} / {game.total}
            </span>
            <span>{game.date ? formatDate(game.date) : 'Pendente'}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function getStoredToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: string };
    if (payload?.error) {
      return payload.error;
    }
  } catch (parseError) {
    console.error('Error parsing API error payload:', parseError);
  }

  return 'Ocorreu um erro na autenticacao.';
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

  const platform =
    readString(record, 'platform') ?? readString(metadata, 'platform') ?? 'Unknown';

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

  const icon =
    readString(record, 'icon', 'image') ??
    readString(metadata, 'icon', 'image') ??
    createFallbackIcon(title);

  return {
    id,
    title,
    platform,
    unlocked,
    total: total > 0 ? total : unlocked,
    isPlatinum,
    date,
    icon,
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

function createFallbackIcon(title: string): string {
  const initials = title
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'PL';

  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='#3fa9c9'/><stop offset='100%' stop-color='#d6806a'/></linearGradient></defs><rect width='160' height='160' fill='url(#g)'/><text x='80' y='92' text-anchor='middle' font-family='Arial, sans-serif' font-size='48' font-weight='700' fill='white'>${initials}</text></svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
