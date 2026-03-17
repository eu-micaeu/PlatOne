import { type FormEvent, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { Gamepad2, LoaderCircle, Lock, Mail, RefreshCw, ShieldCheck, User, UserPlus } from 'lucide-react';

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
};

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
}: AuthPageProps) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid w-full gap-6 lg:grid-cols-2">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="glass-panel p-8"
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--ink-main)] shadow-lg shadow-black/20">
              <BrandLogo variant="light" className="h-8 w-8" />
            </div>
            <div>
              <p className="font-display text-3xl leading-none">PlatOne</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-black/55">
                Secure Access Layer
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm text-black/70 sm:text-base">
            Crie sua conta para acessar o dashboard de conquistas, manter sessao ativa e sincronizar o progresso
            em um fluxo seguro.
          </p>

          <div className="mt-8 rounded-2xl border border-black/10 bg-white/60 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[var(--bg-main)] p-2">
                <BrandLogo className="h-6 w-6" />
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-black/55">Identidade PlatOne</p>
                <p className="mt-1 text-sm text-black/70">A mesma marca acompanha o login, o painel e a exibicao publica do perfil.</p>
              </div>
            </div>
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
              onClick={() => onModeChange('login')}
              className={`rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors ${
                authMode === 'login' ? 'bg-[var(--ink-main)] text-white' : 'text-black/60 hover:bg-black/6'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => onModeChange('register')}
              className={`rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors ${
                authMode === 'register' ? 'bg-[var(--ink-main)] text-white' : 'text-black/60 hover:bg-black/6'
              }`}
            >
              Register
            </button>
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            {authMode === 'register' && (
              <label className="block">
                <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.16em] text-black/55">
                  Nickname
                </span>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/35" size={15} />
                  <input
                    type="text"
                    value={nicknameInput}
                    onChange={(event) => onNicknameChange(event.target.value)}
                    className="w-full rounded-xl border border-black/10 bg-white/70 py-2.5 pl-10 pr-3 text-sm text-black/80 outline-none transition-all placeholder:text-black/35 focus:border-black/25 focus:bg-white"
                    placeholder="Seu nickname"
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
                  onChange={(event) => onEmailChange(event.target.value)}
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
                  onChange={(event) => onPasswordChange(event.target.value)}
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

        </motion.section>
      </div>
    </main>
  );
}

