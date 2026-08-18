import { motion } from 'motion/react';
import { Camera, LoaderCircle, LogOut, RefreshCw, ShieldCheck, Trash2, UserCheck } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import type { AuthUser, SteamStatus, XboxStatus } from '../types/app';
import { PlayStationIcon, SteamIcon, XboxIcon } from '../components/PlatformIcons';

type SettingsPageProps = {
  user: AuthUser | null;
  steamStatus: SteamStatus;
  steamLoading: boolean;
  xboxStatus: XboxStatus;
  xboxLoading: boolean;
  xboxError: string | null;
  loadingData: boolean;
  steamError: string | null;
  profileError: string | null;
  deleteSubmitting: boolean;
  onSyncSteam: () => void;
  onConnectSteam: () => void;
  onDisconnectSteam: () => void;
  onConnectXbox: (gamertag: string) => void;
  onDisconnectXbox: () => void;
  onSyncXbox: () => void;
  onDeleteAccount: () => void;
  onUpdateSteamAPIKey: (apiKey: string) => Promise<void>;
  formatDateTime: (value: string) => string;
  onOpenAvatarModal?: () => void;
};

export default function SettingsPage({
  user,
  steamStatus,
  steamLoading,
  xboxStatus,
  xboxLoading,
  xboxError,
  loadingData,
  steamError,
  profileError,
  deleteSubmitting,
  onSyncSteam,
  onConnectSteam,
  onDisconnectSteam,
  onConnectXbox,
  onDisconnectXbox,
  onSyncXbox,
  onDeleteAccount,
  onUpdateSteamAPIKey,
  formatDateTime,
  onOpenAvatarModal,
}: SettingsPageProps) {
  const [steamAPIKey, setSteamAPIKey] = useState('');
  const [steamAPIKeyLoading, setSteamAPIKeyLoading] = useState(false);
  const [steamAPIKeyError, setSteamAPIKeyError] = useState<string | null>(null);
  const [steamAPIKeySuccess, setSteamAPIKeySuccess] = useState(false);

  const [gamertagInput, setGamertagInput] = useState('');

  const handleUpdateSteamAPIKey = async (e: FormEvent<HTMLFormElement>) => {
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

  const handleConnectXboxSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!gamertagInput.trim()) return;
    onConnectXbox(gamertagInput.trim());
    setGamertagInput('');
  };

  const userInitials = user?.name ? user.name.slice(0, 2).toUpperCase() : 'PO';

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="glass-panel p-4 sm:p-8"
      >
        <div className="mb-1 sm:mb-2 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-[var(--text-soft)]">
          <ShieldCheck size={13} />
          <span>Configurações</span>
        </div>

        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">Conta e Segurança</h1>
        <p className="mt-1 text-xs sm:text-sm text-[var(--text-soft)]">
          Gerencie seus dados de conta, foto de perfil, conexões e opções de privacidade.
        </p>

        {/* Profile Picture Section */}
        <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-black/10 dark:border-white/10 pt-5 sm:pt-6">
          <div className="flex items-center gap-3.5 sm:gap-4">
            <div className="relative h-14 w-14 flex-shrink-0">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="h-14 w-14 rounded-2xl object-cover border border-black/10 dark:border-white/20 shadow-sm"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--ink-main)] font-display text-lg font-bold text-white dark:bg-white dark:text-black shadow-sm">
                  {userInitials}
                </div>
              )}
            </div>
            <div>
              <p className="font-display text-base font-bold text-[var(--text-main)]">Foto de Perfil</p>
              <p className="text-xs text-[var(--text-soft)]">
                Exibida no seu perfil público e na barra superior.
              </p>
            </div>
          </div>

          {onOpenAvatarModal && (
            <button
              type="button"
              onClick={onOpenAvatarModal}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-black/10 dark:border-white/10 px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-[var(--text-main)] font-medium transition-all hover:bg-black/5 dark:hover:bg-white/10 active:scale-[0.98]"
            >
              <Camera size={14} />
              <span>{user?.avatarUrl ? 'Alterar Foto' : 'Adicionar Foto'}</span>
            </button>
          )}
        </div>

        <div className="mt-5 sm:mt-6 grid gap-3 sm:gap-4 border-t border-black/10 dark:border-white/10 pt-5 sm:pt-6 sm:grid-cols-2">
          <div className="rounded-xl border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 p-3">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-soft)]">Nome</p>
            <p className="mt-1 font-semibold text-sm sm:text-base text-[var(--text-main)]">{user?.name}</p>
          </div>
          <div className="rounded-xl border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 p-3">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-soft)]">Email</p>
            <p className="mt-1 font-semibold text-sm sm:text-base text-[var(--text-main)] truncate">{user?.email}</p>
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="glass-panel p-4 sm:p-6 border-sky-500/30"
      >
        <div className="flex items-start gap-3">
          <div className="rounded-xl p-2 bg-sky-500/10 text-sky-600 dark:text-sky-400 shrink-0">
            <ShieldCheck size={18} />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-base sm:text-lg font-bold tracking-tight text-[var(--text-main)]">Perfil Público na Steam e Xbox</h2>
            <p className="mt-1 text-xs sm:text-sm text-[var(--text-soft)] leading-relaxed">
              Certifique-se de que os detalhes do seu perfil e conquistas nas plataformas estejam visíveis publicamente para permitir a sincronização no PlatOne.
            </p>
          </div>
        </div>
      </motion.section>

      {/* Steam Connection */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.08 }}
        className="glass-panel p-4 sm:p-8 space-y-6"
      >
        <div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/10 dark:bg-white/10 p-1.5 shrink-0">
                <SteamIcon className="h-4.5 w-4.5" />
              </div>
              <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight">Conexão Steam</h2>
            </div>
            <span
              className={`rounded-lg border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                steamStatus.connected
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold'
              }`}
            >
              {steamStatus.connected ? 'Conectada' : 'Desconectada'}
            </span>
          </div>

          <div className="mt-4 rounded-xl border border-black/10 dark:border-white/10 p-3.5 sm:p-4 bg-black/5 dark:bg-white/5">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-soft)]">SteamID</p>
            <p className="mt-1 font-mono text-xs sm:text-sm text-[var(--text-main)] truncate">
              {steamStatus.steamId ? steamStatus.steamId : 'Nenhuma conta Steam conectada.'}
            </p>
            <p className="mt-1 text-[11px] text-[var(--text-soft)]">
              {steamStatus.linkedAt ? `Conectada em ${formatDateTime(steamStatus.linkedAt)}` : 'Sem vinculação ativa'}
            </p>
          </div>

          {steamError && (
            <p className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
              {steamError}
            </p>
          )}

          <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-2">
            {steamStatus.connected ? (
              <>
                <button
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-black/10 dark:border-white/10 px-4 py-2.5 font-mono text-xs uppercase tracking-wider font-medium text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors active:scale-[0.98] disabled:opacity-50"
                  type="button"
                  onClick={onSyncSteam}
                  disabled={steamLoading || loadingData}
                >
                  <RefreshCw size={14} className={steamLoading ? 'animate-spin' : ''} />
                  <span>Sync Steam</span>
                </button>
                <button
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-black/10 dark:border-white/10 px-4 py-2.5 font-mono text-xs uppercase tracking-wider font-medium text-[var(--text-soft)] hover:text-red-500 hover:bg-black/5 dark:hover:bg-white/10 transition-colors active:scale-[0.98] disabled:opacity-50"
                  type="button"
                  onClick={onDisconnectSteam}
                  disabled={steamLoading}
                >
                  <LogOut size={14} />
                  <span>Desconectar</span>
                </button>
              </>
            ) : (
              <button
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[var(--ink-main)] px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-white dark:bg-white dark:text-black font-medium transition-opacity hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                type="button"
                onClick={onConnectSteam}
                disabled={steamLoading}
              >
                {steamLoading ? <LoaderCircle size={14} className="animate-spin" /> : <SteamIcon className="h-4 w-4" variant="inverse" />}
                <span>Conectar Steam</span>
              </button>
            )}
          </div>
        </div>

        {/* Xbox Network Connection */}
        <div className="border-t border-black/10 dark:border-white/10 pt-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white p-1.5 shrink-0">
                <XboxIcon className="h-4.5 w-4.5 text-white" variant="white" />
              </div>
              <div>
                <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight">Xbox Network</h2>
                <p className="text-xs text-[var(--text-soft)]">Sincronização de Gamerscore e conquistas Xbox</p>
              </div>
            </div>
            <span
              className={`rounded-lg border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                xboxStatus.connected
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold'
              }`}
            >
              {xboxStatus.connected ? 'Conectada' : 'Desconectada'}
            </span>
          </div>

          <div className="mt-4 rounded-xl border border-black/10 dark:border-white/10 p-3.5 sm:p-4 bg-black/5 dark:bg-white/5">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-soft)]">Gamertag</p>
            <p className="mt-1 font-mono text-xs sm:text-sm font-semibold text-[var(--text-main)] truncate">
              {xboxStatus.gamertag ? xboxStatus.gamertag : 'Nenhum Gamertag conectado.'}
            </p>
            <p className="mt-1 text-[11px] text-[var(--text-soft)]">
              {xboxStatus.linkedAt ? `Conectada em ${formatDateTime(xboxStatus.linkedAt)}` : 'Insira seu Gamertag para sincronizar'}
            </p>
          </div>

          {xboxError && (
            <p className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
              {xboxError}
            </p>
          )}

          <div className="mt-4">
            {xboxStatus.connected ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <button
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-black/10 dark:border-white/10 px-4 py-2.5 font-mono text-xs uppercase tracking-wider font-medium text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors active:scale-[0.98] disabled:opacity-50"
                  type="button"
                  onClick={onSyncXbox}
                  disabled={xboxLoading || loadingData}
                >
                  <RefreshCw size={14} className={xboxLoading ? 'animate-spin' : ''} />
                  <span>Sync Xbox</span>
                </button>
                <button
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-black/10 dark:border-white/10 px-4 py-2.5 font-mono text-xs uppercase tracking-wider font-medium text-[var(--text-soft)] hover:text-red-500 hover:bg-black/5 dark:hover:bg-white/10 transition-colors active:scale-[0.98] disabled:opacity-50"
                  type="button"
                  onClick={onDisconnectXbox}
                  disabled={xboxLoading}
                >
                  <LogOut size={14} />
                  <span>Desconectar</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleConnectXboxSubmit} className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                <input
                  type="text"
                  value={gamertagInput}
                  onChange={(e) => setGamertagInput(e.target.value)}
                  placeholder="Seu Gamertag (ex: Chief117)"
                  className="w-full sm:max-w-xs rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-3.5 py-2.5 text-sm text-[var(--text-main)] outline-none focus:border-[var(--text-main)] transition-colors"
                  required
                />
                <button
                  type="submit"
                  disabled={xboxLoading || !gamertagInput.trim()}
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-white font-medium transition-opacity hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                >
                  {xboxLoading ? (
                    <>
                      <LoaderCircle size={14} className="animate-spin" />
                      <span>Conectando...</span>
                    </>
                  ) : (
                    <>
                      <UserCheck size={14} />
                      <span>Conectar Xbox</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Future Integrations */}
        <div className="border-t border-black/10 dark:border-white/10 pt-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-soft)] mb-3">
            Próximas Integrações
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-3 opacity-80">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/10 dark:bg-white/10 text-[var(--text-main)] p-1.5 shrink-0">
                  <PlayStationIcon className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[var(--text-main)]">PlayStation Network</p>
                  <p className="text-[10px] text-[var(--text-soft)]">Futura sincronização de troféus</p>
                </div>
              </div>
              <span className="rounded-lg border border-black/10 dark:border-white/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[var(--text-soft)]">
                Em breve
              </span>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="glass-panel p-4 sm:p-6 border-red-500/30"
      >
        <h2 className="font-display text-base sm:text-lg font-bold tracking-tight text-red-600 dark:text-red-400">Zona de Perigo</h2>
        <p className="mt-1 text-xs sm:text-sm text-[var(--text-soft)]">
          Você pode apagar sua conta permanentemente por aqui. Esta ação não pode ser desfeita.
        </p>
        {profileError && (
          <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400">
            {profileError}
          </p>
        )}
        <button
          type="button"
          onClick={onDeleteAccount}
          disabled={deleteSubmitting}
          className="mt-4 inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 font-mono text-xs uppercase tracking-wider font-medium text-white transition-opacity hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
        >
          {deleteSubmitting ? (
            <>
              <LoaderCircle size={14} className="animate-spin" />
              <span>Apagando conta...</span>
            </>
          ) : (
            <>
              <Trash2 size={14} />
              <span>Apagar minha conta</span>
            </>
          )}
        </button>
      </motion.section>
    </div>
  );
}
