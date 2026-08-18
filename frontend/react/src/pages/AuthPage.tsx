import { type FormEvent, useState } from 'react';
import { motion } from 'motion/react';
import { AlertCircle, Eye, EyeOff, LoaderCircle, Lock, Mail, Moon, ShieldCheck, Sun, User, UserPlus } from 'lucide-react';

import BrandLogo from '../components/BrandLogo';
import { PlatformMobileChips, PlatformStatusCards } from '../components/PlatformIcons';
import type { AuthMode } from '../types/app';

type AuthPageProps = {
  authMode: AuthMode;
  authSubmitting: boolean;
  authError: string | null;
  nicknameInput: string;
  emailInput: string;
  passwordInput: string;
  confirmPasswordInput: string;
  rememberMe: boolean;
  onNicknameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onRememberMeChange: (value: boolean) => void;
  onModeChange: (mode: AuthMode) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  themeMode: 'light' | 'dark';
  onToggleTheme: () => void;
};

export default function AuthPage({
  authMode,
  authSubmitting,
  authError,
  nicknameInput,
  emailInput,
  passwordInput,
  confirmPasswordInput,
  rememberMe,
  onNicknameChange,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onRememberMeChange,
  onModeChange,
  onSubmit,
  themeMode,
  onToggleTheme,
}: AuthPageProps) {
  const isLogin = authMode === 'login';
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <main className="relative min-h-[100dvh] w-full flex flex-col justify-start sm:justify-center items-center py-6 px-3.5 sm:px-6 lg:px-8 overflow-y-auto">
      <div className="relative z-10 my-auto w-full max-w-md lg:max-w-5xl">
        <div className="grid w-full gap-6 lg:grid-cols-2 lg:items-center">
          {/* Desktop Hero Panel */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="auth-hero-panel hidden h-full min-h-[540px] w-full flex-col justify-between p-8 lg:flex"
          >
            <div>
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--ink-main)] text-white shadow-md">
                  <BrandLogo variant="inverse" className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-xl font-bold tracking-tight">PlatOne</p>
                  <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--text-soft)]">Platinum Tracker</p>
                </div>
              </div>

              <div className="max-w-md mb-6">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-soft)]">// Gaming Identity</span>
                <h1 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-[var(--text-main)] leading-tight">
                  Seu acervo e conquistas em um só lugar.
                </h1>
                <p className="mt-2 text-xs text-[var(--text-soft)] leading-relaxed">
                  Acompanhe o progresso de platinas, sincronize com a Steam e Xbox, e compartilhe seu perfil público de forma direta e moderna.
                </p>
              </div>

              <div className="border-t border-black/10 dark:border-white/10 pt-5">
                <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-soft)] mb-2.5">
                  Plataformas Suportadas
                </p>
                <PlatformStatusCards />
              </div>
            </div>
          </motion.section>

          {/* Auth Form Card */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="glass-panel w-full flex flex-col p-4.5 sm:p-8 rounded-2xl sm:rounded-3xl border border-black/10 dark:border-white/10 shadow-2xl backdrop-blur-xl"
          >
            <div>
            {/* Mobile Header */}
            <div className="mb-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5 lg:hidden">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--ink-main)] text-white shadow-sm">
                  <BrandLogo variant="inverse" className="h-5 w-5" />
                </div>
                <div>
                  <span className="font-display text-lg font-bold tracking-tight block leading-tight">PlatOne</span>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--text-soft)] block">Tracker de Platinas</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onToggleTheme}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-black/10 dark:border-white/10 text-[var(--text-soft)] hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/10 active:scale-90 transition-all ml-auto"
                aria-label={themeMode === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
                title={themeMode === 'dark' ? 'Tema claro' : 'Tema escuro'}
              >
                {themeMode === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              </button>
            </div>

            {/* Mobile Platform Chips */}
            <PlatformMobileChips />

            {/* Segmented Mode Switcher */}
            <div className="mb-4 sm:mb-5 flex rounded-xl border border-black/10 dark:border-white/10 p-1 bg-black/5 dark:bg-white/5">
              <button
                type="button"
                onClick={() => onModeChange('login')}
                className={`flex-1 rounded-lg py-2 text-center font-mono text-xs uppercase tracking-wider font-bold transition-all active:scale-[0.98] ${
                  isLogin
                    ? 'bg-[var(--ink-main)] text-white dark:bg-white dark:text-black shadow-xs'
                    : 'text-[var(--text-soft)] hover:text-[var(--text-main)]'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => onModeChange('register')}
                className={`flex-1 rounded-lg py-2 text-center font-mono text-xs uppercase tracking-wider font-bold transition-all active:scale-[0.98] ${
                  !isLogin
                    ? 'bg-[var(--ink-main)] text-white dark:bg-white dark:text-black shadow-xs'
                    : 'text-[var(--text-soft)] hover:text-[var(--text-main)]'
                }`}
              >
                Cadastro
              </button>
            </div>

            {/* Heading */}
            <div className="mb-4">
              <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-main)]">
                {isLogin ? 'Entrar na Plataforma' : 'Criar Conta'}
              </h2>
              <p className="mt-0.5 text-xs text-[var(--text-soft)]">
                {isLogin
                  ? 'Insira suas credenciais para acessar seu painel.'
                  : 'Preencha os dados abaixo para iniciar sua jornada.'}
              </p>
            </div>

            {/* Form Fields */}
            <form onSubmit={onSubmit} className="space-y-3 sm:space-y-3.5">
              {!isLogin && (
                <div>
                  <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-[var(--text-soft)] font-semibold">
                    Nickname
                  </label>
                  <div className="relative">
                    <User
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-soft)]"
                      size={16}
                    />
                    <input
                      type="text"
                      value={nicknameInput}
                      onChange={(event) => onNicknameChange(event.target.value)}
                      className="w-full rounded-xl border border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/5 py-2.5 pl-10 pr-3 text-base sm:text-sm text-[var(--text-main)] outline-none transition-colors placeholder:text-[var(--text-soft)] focus:border-[var(--text-main)] focus:bg-transparent focus:ring-1 focus:ring-[var(--text-main)]"
                      placeholder="Seu nickname"
                      required
                      autoComplete="username"
                      autoCapitalize="none"
                      spellCheck={false}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-[var(--text-soft)] font-semibold">
                  Email
                </label>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-soft)]"
                    size={16}
                  />
                  <input
                    type="email"
                    inputMode="email"
                    value={emailInput}
                    onChange={(event) => onEmailChange(event.target.value)}
                    className="w-full rounded-xl border border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/5 py-2.5 pl-10 pr-3 text-base sm:text-sm text-[var(--text-main)] outline-none transition-colors placeholder:text-[var(--text-soft)] focus:border-[var(--text-main)] focus:bg-transparent focus:ring-1 focus:ring-[var(--text-main)]"
                    placeholder="seu@email.com"
                    required
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-[var(--text-soft)] font-semibold">
                  Senha
                </label>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-soft)]"
                    size={16}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(event) => onPasswordChange(event.target.value)}
                    className="w-full rounded-xl border border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/5 py-2.5 pl-10 pr-11 text-base sm:text-sm text-[var(--text-main)] outline-none transition-colors placeholder:text-[var(--text-soft)] focus:border-[var(--text-main)] focus:bg-transparent focus:ring-1 focus:ring-[var(--text-main)]"
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-soft)] hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/10 active:scale-90 transition-all focus:outline-none"
                    aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                    title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div>
                  <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-[var(--text-soft)] font-semibold">
                    Confirmar Senha
                  </label>
                  <div className="relative">
                    <Lock
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-soft)]"
                      size={16}
                    />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPasswordInput}
                      onChange={(event) => onConfirmPasswordChange(event.target.value)}
                      className="w-full rounded-xl border border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/5 py-2.5 pl-10 pr-11 text-base sm:text-sm text-[var(--text-main)] outline-none transition-colors placeholder:text-[var(--text-soft)] focus:border-[var(--text-main)] focus:bg-transparent focus:ring-1 focus:ring-[var(--text-main)]"
                      placeholder="Repita sua senha"
                      required
                      minLength={6}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-soft)] hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/10 active:scale-90 transition-all focus:outline-none"
                      aria-label={showConfirmPassword ? 'Ocultar confirmação de senha' : 'Exibir confirmação de senha'}
                      title={showConfirmPassword ? 'Ocultar confirmação de senha' : 'Exibir confirmação de senha'}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              {isLogin && (
                <div className="flex items-center justify-between pt-0.5">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none py-1">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(event) => onRememberMeChange(event.target.checked)}
                      className="h-4 w-4 rounded border-black/20 dark:border-white/20 bg-transparent text-[var(--ink-main)] accent-[var(--ink-main)] cursor-pointer"
                    />
                    <span className="text-xs text-[var(--text-soft)] hover:text-[var(--text-main)] transition-colors font-medium">
                      Lembrar de mim
                    </span>
                  </label>
                </div>
              )}

              {authError && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/25 p-3 text-xs text-red-600 dark:text-red-400"
                >
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{authError}</span>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={authSubmitting}
                className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--ink-main)] font-mono text-xs uppercase font-bold tracking-wider text-white dark:bg-white dark:text-black shadow-md transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {authSubmitting ? (
                  <>
                    <LoaderCircle size={16} className="animate-spin" />
                    <span>Processando...</span>
                  </>
                ) : isLogin ? (
                  <>
                    <ShieldCheck size={16} />
                    <span>Entrar</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={16} />
                    <span>Criar Conta</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Bottom Switcher link */}
          <div className="mt-4 pt-3.5 border-t border-black/10 dark:border-white/10 text-center">
            <p className="text-xs text-[var(--text-soft)]">
              {isLogin ? 'Novo por aqui?' : 'Já possui uma conta?'}{' '}
              <button
                type="button"
                onClick={() => onModeChange(isLogin ? 'register' : 'login')}
                className="font-semibold text-[var(--text-main)] underline underline-offset-2 hover:opacity-80 transition-opacity"
              >
                {isLogin ? 'Cadastre-se gratuitamente' : 'Faça login'}
              </button>
            </p>
          </div>
        </motion.section>
      </div>
    </div>
  </main>
);
}

