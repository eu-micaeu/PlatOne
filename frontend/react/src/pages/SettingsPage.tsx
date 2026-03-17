import { motion } from 'motion/react';
import { LoaderCircle, LogOut, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react';

import type { AuthUser, SteamStatus } from '../types/app';

type SettingsPageProps = {
  user: AuthUser | null;
  steamStatus: SteamStatus;
  steamLoading: boolean;
  loadingData: boolean;
  steamError: string | null;
  profileError: string | null;
  deleteSubmitting: boolean;
  onSyncSteam: () => void;
  onConnectSteam: () => void;
  onDisconnectSteam: () => void;
  onDeleteAccount: () => void;
  formatDateTime: (value: string) => string;
};

export default function SettingsPage({
  user,
  steamStatus,
  steamLoading,
  loadingData,
  steamError,
  profileError,
  deleteSubmitting,
  onSyncSteam,
  onConnectSteam,
  onDisconnectSteam,
  onDeleteAccount,
  formatDateTime,
}: SettingsPageProps) {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="glass-panel p-6 sm:p-8"
      >
        <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-black/5 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.24em] text-black/60">
          <ShieldCheck size={13} />
          Configuracoes
        </div>

        <h1 className="font-display text-4xl leading-tight sm:text-5xl">Conta e seguranca</h1>
        <p className="mt-3 text-sm text-black/70 sm:text-base">
          Gerencie seus dados de conta, conexoes e opcoes de privacidade.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-black/10 bg-white/55 p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-black/55">Nome</p>
            <p className="mt-1 text-base font-semibold text-black/85">{user?.name}</p>
          </div>
          <div className="rounded-xl border border-black/10 bg-white/55 p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-black/55">Email</p>
            <p className="mt-1 text-base font-semibold text-black/85">{user?.email}</p>
          </div>
          <div className="rounded-xl border border-black/10 bg-white/55 p-4 sm:col-span-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-black/55">Conta criada em</p>
            <p className="mt-1 text-base font-semibold text-black/85">
              {user?.createdAt ? formatDateTime(user.createdAt) : 'Nao informado'}
            </p>
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="glass-panel p-6 sm:p-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-display text-3xl leading-tight">Conexao Steam</p>
          <span
            className={`rounded-full px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.15em] ${
              steamStatus.connected ? 'bg-emerald-500/12 text-emerald-700' : 'bg-amber-500/12 text-amber-700'
            }`}
          >
            {steamStatus.connected ? 'Conectada' : 'Desconectada'}
          </span>
        </div>

        <div className="mt-4 rounded-xl border border-black/10 bg-white/70 p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-black/55">SteamID</p>
          <p className="mt-1 text-sm text-black/75">
            {steamStatus.steamId ? steamStatus.steamId : 'Nenhuma conta Steam conectada.'}
          </p>
          <p className="mt-1 text-xs text-black/55">
            {steamStatus.linkedAt ? `Conectada em ${formatDateTime(steamStatus.linkedAt)}` : 'Sem vinculacao ativa'}
          </p>
        </div>

        {steamError && (
          <p className="mt-3 rounded-lg border border-amber-300/70 bg-amber-100/70 px-3 py-2 text-sm text-amber-800">
            {steamError}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {steamStatus.connected ? (
            <>
              <button
                className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white/70 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-black/75 transition-all hover:-translate-y-0.5 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                onClick={onSyncSteam}
                disabled={steamLoading || loadingData}
              >
                <RefreshCw size={14} className={steamLoading ? 'animate-spin' : ''} />
                Sync Steam
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white/70 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-black/75 transition-all hover:-translate-y-0.5 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                onClick={onDisconnectSteam}
                disabled={steamLoading}
              >
                <LogOut size={14} />
                Desconectar
              </button>
            </>
          ) : (
            <button
              className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white/70 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-black/75 transition-all hover:-translate-y-0.5 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              onClick={onConnectSteam}
              disabled={steamLoading}
            >
              {steamLoading ? <LoaderCircle size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
              Conectar Steam
            </button>
          )}
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="rounded-2xl border border-red-300/50 bg-red-100/45 p-4 sm:p-5"
      >
        <p className="font-display text-2xl leading-tight text-red-700">Zona de perigo</p>
        <p className="mt-2 text-sm text-red-700/90">
          Voce pode deletar sua conta por aqui. Esta acao remove acesso e dados de autenticacao de forma permanente.
        </p>
        {profileError && (
          <p className="mt-3 rounded-lg border border-red-300/70 bg-white/70 px-3 py-2 text-sm text-red-700">
            {profileError}
          </p>
        )}
        <button
          type="button"
          onClick={onDeleteAccount}
          disabled={deleteSubmitting}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {deleteSubmitting ? (
            <>
              <LoaderCircle size={16} className="animate-spin" />
              Apagando conta...
            </>
          ) : (
            <>
              <Trash2 size={16} />
              Apagar minha conta
            </>
          )}
        </button>
      </motion.section>
    </div>
  );
}
