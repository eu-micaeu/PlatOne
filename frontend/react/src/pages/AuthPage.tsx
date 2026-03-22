import { type FormEvent } from 'react';
import { motion } from 'motion/react';
import { type LucideIcon, ArrowUpRight, Gamepad2, LoaderCircle, Lock, Mail, Moon, ShieldCheck, Sun, User, UserPlus } from 'lucide-react';

import BrandLogo from '../components/BrandLogo';
import type { AuthMode } from '../types/app';

type AuthPageProps = {
  authMode: AuthMode;
  authSubmitting: boolean;
  authError: string | null;
  nicknameInput: string;
  emailInput: string;
  passwordInput: string;
  onNicknameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onModeChange: (mode: AuthMode) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  themeMode: 'light' | 'dark';
  onToggleTheme: () => void;
};

type AuthFeature = {
  icon: LucideIcon;
  label: string;
  description: string;
};

const AUTH_FEATURES: AuthFeature[] = [
  {
    icon: Gamepad2,
    label: 'Foco em progresso',
    description: 'Conquistas, feed e ranking no mesmo painel.',
  },
  {
    icon: UserPlus,
    label: 'Cadastro rapido',
    description: 'Crie conta e começe a organizar platinas em segundos.',
  },
];

export default function AuthPage({
  authMode,
  authSubmitting,
  authError,
  nicknameInput,
  emailInput,
  passwordInput,
  onNicknameChange,
  onEmailChange,
  onPasswordChange,
  onModeChange,
  onSubmit,
  themeMode,
  onToggleTheme,
}: AuthPageProps) {
  const isLogin = authMode === 'login';

  return (
    <main className=" relative mx-auto flex w-full max-w-7xl flex-1 min-h-[100dvh] items-stretch sm:px-5 sm:py-5 lg:px-8 lg:py-8">
      <div className="relative z-10 grid w-full flex-1 gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-stretch lg:gap-6">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="auth-hero-panel hidden h-full flex-col overflow-hidden p-8 sm:p-10 lg:flex"
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--ink-main)] shadow-lg shadow-black/20">
              <BrandLogo variant="light" className="h-8 w-8" />
            </div>
            <div>
              <p className="font-display text-3xl leading-none">PlatOne</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-black/55">
                Trophy Command Access
              </p>
            </div>
          </div>

          <div className="mt-6 max-w-xl">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-black/55">Control center</p>
            <h1 className="mt-2 font-display text-4xl leading-tight text-black/90 sm:text-5xl">
              Organize seu legado de conquistas.
            </h1>
            <p className="mt-4 text-sm text-black/70 sm:text-base">
              Entre para visualizar feed de progresso, ranking de jogos e sincronizacao com Steam em um fluxo seguro.
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {AUTH_FEATURES.map((feature, index) => {
              const Icon = feature.icon;

              return (
                <motion.article
                  key={feature.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 + index * 0.06, duration: 0.35 }}
                  className="rounded-2xl border border-white/55 bg-white/62 p-3 shadow-[0_10px_22px_rgba(31,34,38,0.09)]"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-[var(--bg-main)] p-2">
                      <Icon className="text-black/70" size={15} />
                    </div>
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-black/55">{feature.label}</p>
                      <p className="mt-1 text-sm text-black/70">{feature.description}</p>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>

        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.04 }}
          className="auth-mobile-hero lg:hidden"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--ink-main)] shadow-lg shadow-black/20">
              <BrandLogo variant="light" className="h-6 w-6" />
            </div>
            <div>
              <p className="font-display text-2xl leading-none">PlatOne</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-black/55">Mobile Access</p>
            </div>
          </div>

          <h1 className="mt-4 font-display text-3xl leading-tight text-black/90">Entre e continue sua jornada.</h1>
          <p className="mt-2 text-sm text-black/70">
            Painel de conquistas, feed e sincronizacao Steam pronto para caber bem em qualquer tela.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <span className="auth-mobile-chip">Token seguro</span>
            <span className="auth-mobile-chip">Sync Steam</span>
            <span className="auth-mobile-chip">Feed em tempo real</span>
            <span className="auth-mobile-chip">Cadastro rapido</span>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.06 }}
          className="auth-form-panel glass-panel mx-auto flex h-full w-full max-w-lg flex-col p-5 sm:p-7 lg:max-w-none lg:p-8"
        >
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              onClick={onToggleTheme}
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-black/65 transition-all hover:-translate-y-0.5 hover:bg-white"
              aria-label={themeMode === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
              title={themeMode === 'dark' ? 'Tema claro' : 'Tema escuro'}
            >
              {themeMode === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
              <span>{themeMode === 'dark' ? 'Claro' : 'Escuro'}</span>
            </button>
          </div>

          <div className="mb-5 inline-flex w-full rounded-full border border-black/10 bg-white/65 p-1">
            <button
              type="button"
              onClick={() => onModeChange('login')}
              className={`flex-1 rounded-full px-4 py-2 text-center font-mono text-[11px] uppercase tracking-[0.16em] transition-colors ${
                isLogin ? 'bg-[var(--ink-main)] text-white' : 'text-black/60 hover:bg-black/6'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => onModeChange('register')}
              className={`flex-1 rounded-full px-4 py-2 text-center font-mono text-[11px] uppercase tracking-[0.16em] transition-colors ${
                !isLogin ? 'bg-[var(--ink-main)] text-white' : 'text-black/60 hover:bg-black/6'
              }`}
            >
              Register
            </button>
          </div>

          <div className="mb-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-black/55">
              {isLogin ? 'Bem-vindo de volta' : 'Novo operador'}
            </p>
            <h2 className="mt-2 font-display text-3xl leading-tight text-black/90">
              {isLogin ? 'Entrar na plataforma' : 'Criar conta no PlatOne'}
            </h2>
            <p className="mt-2 text-sm text-black/70">
              {isLogin
                ? 'Use seu email e senha para continuar de onde parou.'
                : 'Complete os campos e prepare seu painel para registrar novas platinas.'}
            </p>
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            {!isLogin && (
              <label className="block">
                <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.16em] text-black/55">
                  Nickname
                </span>
                <div className="group relative">
                  <User
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/35 transition-colors group-focus-within:text-black/65"
                    size={15}
                  />
                  <input
                    type="text"
                    value={nicknameInput}
                    onChange={(event) => onNicknameChange(event.target.value)}
                    className="w-full rounded-2xl border border-black/10 bg-white/75 py-3 pl-10 pr-3 text-sm text-black/80 outline-none transition-all placeholder:text-black/35 focus:border-black/35 focus:bg-white focus:shadow-[0_0_0_3px_rgba(63,169,201,0.2)]"
                    placeholder="Seu nickname"
                    required
                    autoComplete="nickname"
                  />
                </div>
              </label>
            )}

            <label className="block">
              <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.16em] text-black/55">
                Email
              </span>
              <div className="group relative">
                <Mail
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/35 transition-colors group-focus-within:text-black/65"
                  size={15}
                />
                <input
                  type="email"
                  value={emailInput}
                  onChange={(event) => onEmailChange(event.target.value)}
                  className="w-full rounded-2xl border border-black/10 bg-white/75 py-3 pl-10 pr-3 text-sm text-black/80 outline-none transition-all placeholder:text-black/35 focus:border-black/35 focus:bg-white focus:shadow-[0_0_0_3px_rgba(63,169,201,0.2)]"
                  placeholder="voce@platone.dev"
                  required
                  autoComplete="email"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.16em] text-black/55">
                Senha
              </span>
              <div className="group relative">
                <Lock
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/35 transition-colors group-focus-within:text-black/65"
                  size={15}
                />
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(event) => onPasswordChange(event.target.value)}
                  className="w-full rounded-2xl border border-black/10 bg-white/75 py-3 pl-10 pr-3 text-sm text-black/80 outline-none transition-all placeholder:text-black/35 focus:border-black/35 focus:bg-white focus:shadow-[0_0_0_3px_rgba(63,169,201,0.2)]"
                  placeholder="Minimo 6 caracteres"
                  required
                  minLength={6}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                />
              </div>
            </label>

            {authError && (
              <p className="rounded-2xl border border-red-300/55 bg-red-100/55 px-3 py-2 text-sm text-red-700">
                {authError}
              </p>
            )}

            <button
              type="submit"
              disabled={authSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(120deg,var(--ink-main),#0f151a)] px-4 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(31,34,38,0.28)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {authSubmitting ? (
                <>
                  <LoaderCircle size={16} className="animate-spin" />
                  Processando...
                </>
              ) : isLogin ? (
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

            <p className="text-center font-mono text-[10px] uppercase tracking-[0.14em] text-black/45">
              {isLogin ? 'Acesso seguro com sessao validada' : 'Conta criada com autenticacao imediata'}
            </p>
          </form>
        </motion.section>
      </div>
    </main>
  );
}

