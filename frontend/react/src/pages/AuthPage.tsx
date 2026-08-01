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
    <main className="relative mx-auto flex w-full max-w-7xl flex-1 min-h-[100dvh] items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="relative z-10 grid w-full flex-1 gap-6 lg:grid-cols-2 lg:items-center max-w-5xl">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="auth-hero-panel hidden h-full flex-col justify-between p-8 lg:flex"
        >
          <div>
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--ink-main)] text-white">
                <BrandLogo variant="inverse" className="h-6 w-6" />
              </div>
              <div>
                <p className="font-display text-xl font-bold tracking-tight">PlatOne</p>
                <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-soft)]">
                  Trophy Command Deck
                </p>
              </div>
            </div>

            <div className="max-w-md">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-soft)]">Gaming Identity</span>
              <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-[var(--text-main)]">
                Seu acervo e conquistas em um só lugar.
              </h1>
              <p className="mt-3 text-sm text-[var(--text-soft)] leading-relaxed">
                Acompanhe o progresso de platinas, sincronize com a Steam e compartilhe seu perfil público de forma direta e minimalista.
              </p>
            </div>
          </div>

          <div className="border-t border-black/10 dark:border-white/10 pt-6">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-soft)]">Status do Sistema</p>
            <p className="mt-1 font-mono text-xs text-[var(--text-main)]">Sincronização Steam Ativa • PlatOne v2.0</p>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="glass-panel mx-auto flex h-full w-full max-w-md flex-col p-6 sm:p-8"
        >
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2 lg:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-[var(--ink-main)] text-white">
                <BrandLogo variant="inverse" className="h-4 w-4" />
              </div>
              <span className="font-display text-lg font-bold">PlatOne</span>
            </div>

            <button
              type="button"
              onClick={onToggleTheme}
              className="inline-flex items-center gap-1.5 rounded-md border border-black/10 dark:border-white/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-[var(--text-soft)] hover:text-[var(--text-main)] transition-colors ml-auto"
              aria-label={themeMode === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
            >
              {themeMode === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
              <span>{themeMode === 'dark' ? 'Claro' : 'Escuro'}</span>
            </button>
          </div>

          <div className="mb-6 flex rounded-lg border border-black/10 dark:border-white/10 p-1">
            <button
              type="button"
              onClick={() => onModeChange('login')}
              className={`flex-1 rounded py-1.5 text-center font-mono text-xs uppercase tracking-wider transition-colors ${
                isLogin
                  ? 'bg-[var(--ink-main)] text-white dark:bg-white dark:text-black font-semibold'
                  : 'text-[var(--text-soft)] hover:text-[var(--text-main)]'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => onModeChange('register')}
              className={`flex-1 rounded py-1.5 text-center font-mono text-xs uppercase tracking-wider transition-colors ${
                !isLogin
                  ? 'bg-[var(--ink-main)] text-white dark:bg-white dark:text-black font-semibold'
                  : 'text-[var(--text-soft)] hover:text-[var(--text-main)]'
              }`}
            >
              Registro
            </button>
          </div>

          <div className="mb-6">
            <h2 className="font-display text-2xl font-bold tracking-tight text-[var(--text-main)]">
              {isLogin ? 'Entrar na Plataforma' : 'Criar Conta'}
            </h2>
            <p className="mt-1 text-xs text-[var(--text-soft)]">
              {isLogin
                ? 'Insira suas credenciais para acessar o painel.'
                : 'Preencha os dados abaixo para iniciar.'}
            </p>
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            {!isLogin && (
              <div>
                <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-[var(--text-soft)]">
                  Nickname
                </label>
                <div className="relative">
                  <User
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-soft)]"
                    size={15}
                  />
                  <input
                    type="text"
                    value={nicknameInput}
                    onChange={(event) => onNicknameChange(event.target.value)}
                    className="w-full rounded-md border border-black/10 dark:border-white/10 bg-transparent py-2.5 pl-9 pr-3 text-sm text-[var(--text-main)] outline-none transition-colors placeholder:text-[var(--text-soft)] focus:border-[var(--text-main)]"
                    placeholder="Seu nickname"
                    required
                    autoComplete="nickname"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-[var(--text-soft)]">
                Email
              </label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-soft)]"
                  size={15}
                />
                <input
                  type="email"
                  value={emailInput}
                  onChange={(event) => onEmailChange(event.target.value)}
                  className="w-full rounded-md border border-black/10 dark:border-white/10 bg-transparent py-2.5 pl-9 pr-3 text-sm text-[var(--text-main)] outline-none transition-colors placeholder:text-[var(--text-soft)] focus:border-[var(--text-main)]"
                  placeholder="seu@email.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-[var(--text-soft)]">
                Senha
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-soft)]"
                  size={15}
                />
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(event) => onPasswordChange(event.target.value)}
                  className="w-full rounded-md border border-black/10 dark:border-white/10 bg-transparent py-2.5 pl-9 pr-3 text-sm text-[var(--text-main)] outline-none transition-colors placeholder:text-[var(--text-soft)] focus:border-[var(--text-main)]"
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                />
              </div>
            </div>

            {authError && (
              <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-500">
                {authError}
              </p>
            )}

            <button
              type="submit"
              disabled={authSubmitting}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--ink-main)] px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-white dark:bg-white dark:text-black font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {authSubmitting ? (
                <>
                  <LoaderCircle size={15} className="animate-spin" />
                  Processando...
                </>
              ) : isLogin ? (
                <>
                  <ShieldCheck size={15} />
                  Entrar
                </>
              ) : (
                <>
                  <UserPlus size={15} />
                  Criar Conta
                </>
              )}
            </button>
          </form>
        </motion.section>
      </div>
    </main>
  );
}

