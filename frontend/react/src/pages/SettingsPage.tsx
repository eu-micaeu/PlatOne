import { motion } from 'motion/react';
import { LoaderCircle, LogOut, RefreshCw, ShieldCheck, Trash2, Key } from 'lucide-react';
import { useState } from 'react';

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
  onUpdateSteamAPIKey: (apiKey: string) => Promise<void>;
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
  onUpdateSteamAPIKey,
  formatDateTime,
}: SettingsPageProps) {
  const [steamAPIKey, setSteamAPIKey] = useState('');
  const [steamAPIKeyLoading, setSteamAPIKeyLoading] = useState(false);
  const [steamAPIKeyError, setSteamAPIKeyError] = useState<string | null>(null);
  const [steamAPIKeySuccess, setSteamAPIKeySuccess] = useState(false);

  const handleUpdateSteamAPIKey = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!steamAPIKey.trim()) {
      setSteamAPIKeyError('Chave de API não pode estar vazia');
      return;
    }

    setSteamAPIKeyLoading(true);
    setSteamAPIKeyError(null);
    setSteamAPIKeySuccess(false);

    try {
      await onUpdateSteamAPIKey(steamAPIKey);
      setSteamAPIKeySuccess(true);
      setSteamAPIKey('');
      setTimeout(() => setSteamAPIKeySuccess(false), 3000);
    } catch (error) {
      setSteamAPIKeyError(error instanceof Error ? error.message : 'Erro ao atualizar chave de API');
    } finally {
      setSteamAPIKeyLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="glass-panel p-6 sm:p-8"
      >
        <div className="mb-2 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-[var(--text-soft)]">
          <ShieldCheck size={13} />
          <span>Configurações</span>
        </div>

        <h1 className="font-display text-3xl font-bold tracking-tight">Conta e Segurança</h1>
        <p className="mt-1 text-sm text-[var(--text-soft)]">
          Gerencie seus dados de conta, conexões e opções de privacidade.
        </p>

        <div className="mt-6 grid gap-4 border-t border-black/10 dark:border-white/10 pt-6 sm:grid-cols-2">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-soft)]">Nome</p>
            <p className="mt-1 font-semibold text-[var(--text-main)]">{user?.name}</p>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-soft)]">Email</p>
            <p className="mt-1 font-semibold text-[var(--text-main)]">{user?.email}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-soft)]">Conta criada em</p>
            <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
              {user?.createdAt ? formatDateTime(user.createdAt) : 'Não informado'}
            </p>
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="glass-panel p-6 border-sky-500/30"
      >
        <div className="flex items-start gap-3">
          <div className="rounded p-2 bg-sky-500/10 text-sky-600 dark:text-sky-400">
            <ShieldCheck size={18} />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-lg font-bold tracking-tight text-[var(--text-main)]">Perfil Público na Steam</h2>
            <p className="mt-1 text-sm text-[var(--text-soft)]">
              Acesse sua conta Steam, vá para <span className="font-mono font-medium">Perfil</span> → <span className="font-mono font-medium">Editar Perfil</span> e altere a visibilidade dos detalhes dos jogos para <span className="font-semibold text-[var(--text-main)]">PÚBLICO</span> para permitir a sincronização.
            </p>
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.08 }}
        className="glass-panel p-6 sm:p-8"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-xl font-bold tracking-tight">Conexão Steam</h2>
          <span
            className={`rounded border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
              steamStatus.connected
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
            }`}
          >
            {steamStatus.connected ? 'Conectada' : 'Desconectada'}
          </span>
        </div>

        <div className="mt-4 rounded-lg border border-black/10 dark:border-white/10 p-4">
          <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-soft)]">SteamID</p>
          <p className="mt-1 font-mono text-sm text-[var(--text-main)]">
            {steamStatus.steamId ? steamStatus.steamId : 'Nenhuma conta Steam conectada.'}
          </p>
          <p className="mt-1 text-xs text-[var(--text-soft)]">
            {steamStatus.linkedAt ? `Conectada em ${formatDateTime(steamStatus.linkedAt)}` : 'Sem vinculação ativa'}
          </p>
        </div>

        {steamError && (
          <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
            {steamError}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {steamStatus.connected ? (
            <>
              <button
                className="inline-flex items-center gap-2 rounded-lg border border-black/10 dark:border-white/10 px-3.5 py-2 font-mono text-xs uppercase tracking-wider font-medium text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
                type="button"
                onClick={onSyncSteam}
                disabled={steamLoading || loadingData}
              >
                <RefreshCw size={14} className={steamLoading ? 'animate-spin' : ''} />
                Sync Steam
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-lg border border-black/10 dark:border-white/10 px-3.5 py-2 font-mono text-xs uppercase tracking-wider font-medium text-[var(--text-soft)] hover:text-red-500 hover:bg-black/5 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
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
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--ink-main)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-white dark:bg-white dark:text-black font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
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
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="glass-panel p-6 border-red-500/30"
      >
        <h2 className="font-display text-lg font-bold tracking-tight text-red-600 dark:text-red-400">Zona de Perigo</h2>
        <p className="mt-1 text-sm text-[var(--text-soft)]">
          Você pode apagar sua conta permanentemente por aqui. Esta ação não pode ser desfeita.
        </p>
        {profileError && (
          <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400">
            {profileError}
          </p>
        )}
        <button
          type="button"
          onClick={onDeleteAccount}
          disabled={deleteSubmitting}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-mono text-xs uppercase tracking-wider font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {deleteSubmitting ? (
            <>
              <LoaderCircle size={14} className="animate-spin" />
              Apagando conta...
            </>
          ) : (
            <>
              <Trash2 size={14} />
              Apagar minha conta
            </>
          )}
        </button>
      </motion.section>
    </div>
  );
}
