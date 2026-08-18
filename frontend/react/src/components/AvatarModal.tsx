import { useState, useRef, type ChangeEvent, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Link as LinkIcon, Sparkles, Trash2, LoaderCircle, Check, Camera } from 'lucide-react';

type AvatarModalProps = {
  isOpen: boolean;
  currentAvatarUrl?: string | null;
  userInitials: string;
  onClose: () => void;
  onSaveAvatar: (avatarUrl: string) => Promise<void>;
};

// Preset high quality gamer avatar URLs (clean SVG data URIs)
const PRESET_AVATARS = [
  {
    id: 'trophy',
    name: 'Troféu Platina',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2338bdf8"/><stop offset="100%" stop-color="%23818cf8"/></linearGradient></defs><rect width="100" height="100" rx="20" fill="%230f172a"/><circle cx="50" cy="50" r="38" fill="url(%23g)" opacity="0.2"/><path d="M35 25h30v15c0 8.3-6.7 15-15 15s-15-6.7-15-15V25zm-5 5H20c0 8 5 12 10 13v-13zm40 0v13c5-1 10-5 10-13H70zm-20 25v12m-12 0h24" stroke="%2338bdf8" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>',
  },
  {
    id: 'gamepad',
    name: 'Pro Controller',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23a855f7"/><stop offset="100%" stop-color="%23ec4899"/></linearGradient></defs><rect width="100" height="100" rx="20" fill="%230f172a"/><circle cx="50" cy="50" r="38" fill="url(%23g2)" opacity="0.2"/><path d="M30 40h40a12 12 0 0 1 12 12v12a8 8 0 0 1-13.5 5.8L62 63H38l-6.5 6.8A8 8 0 0 1 18 64V52a12 12 0 0 1 12-12z" stroke="%23c084fc" stroke-width="4" fill="none"/><path d="M32 52h8m-4-4v8m32-4h.01m4 4h.01" stroke="%23f472b6" stroke-width="4" stroke-linecap="round"/></svg>',
  },
  {
    id: 'cyber',
    name: 'Cyber Neon',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2310b981"/><stop offset="100%" stop-color="%2306b6d4"/></linearGradient></defs><rect width="100" height="100" rx="20" fill="%23090d16"/><polygon points="50,18 80,35 80,65 50,82 20,65 20,35" stroke="url(%23g3)" stroke-width="4" fill="none"/><circle cx="50" cy="50" r="14" fill="%2334d399" opacity="0.8"/><circle cx="50" cy="50" r="6" fill="%23ffffff"/></svg>',
  },
  {
    id: 'crown',
    name: 'Lenda Platina',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g4" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23f59e0b"/><stop offset="100%" stop-color="%23ef4444"/></linearGradient></defs><rect width="100" height="100" rx="20" fill="%2318181b"/><path d="M22 68l6-36 18 18 8-22 8 22 18-18 6 36H22z" fill="url(%23g4)" stroke="%23fbbf24" stroke-width="3" stroke-linejoin="round"/><circle cx="28" cy="32" r="3" fill="%23fef08a"/><circle cx="50" cy="28" r="3" fill="%23fef08a"/><circle cx="72" cy="32" r="3" fill="%23fef08a"/></svg>',
  },
  {
    id: 'star',
    name: 'Estrela Guia',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g5" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%236366f1"/><stop offset="100%" stop-color="%23a855f7"/></linearGradient></defs><rect width="100" height="100" rx="20" fill="%230f172a"/><polygon points="50,18 61,39 84,42 67,58 72,81 50,69 28,81 33,58 16,42 39,39" fill="url(%23g5)" stroke="%23c084fc" stroke-width="2.5"/></svg>',
  },
  {
    id: 'fire',
    name: 'Em Chamas',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g6" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23f97316"/><stop offset="100%" stop-color="%23e11d48"/></linearGradient></defs><rect width="100" height="100" rx="20" fill="%231c1917"/><path d="M50 18c0 0-16 16-16 32 0 12 10 22 22 22s22-10 22-22c0-10-8-18-12-22 0 6-4 10-8 10 0-6-8-20-8-20z" fill="url(%23g6)" stroke="%23fdba74" stroke-width="2"/></svg>',
  },
];

export default function AvatarModal({
  isOpen,
  currentAvatarUrl,
  userInitials,
  onClose,
  onSaveAvatar,
}: AvatarModalProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'presets'>('upload');
  const [previewUrl, setPreviewUrl] = useState<string>(currentAvatarUrl || '');
  const [customUrlInput, setCustomUrlInput] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione um arquivo de imagem válido.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('A imagem deve ser menor que 10MB.');
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const resizedDataUrl = canvas.toDataURL('image/webp', 0.85);
          setPreviewUrl(resizedDataUrl);
        } else {
          setPreviewUrl(event.target?.result as string);
        }
      };
      img.onerror = () => {
        setError('Não foi possível processar a imagem.');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = (e: FormEvent) => {
    e.preventDefault();
    if (!customUrlInput.trim()) {
      setError('Informe a URL da imagem.');
      return;
    }
    setError(null);
    setPreviewUrl(customUrlInput.trim());
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      await onSaveAvatar(previewUrl);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar foto de perfil.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setPreviewUrl('');
    setLoading(true);
    setError(null);
    try {
      await onSaveAvatar('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover foto de perfil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-2xl border border-black/10 dark:border-white/10 bg-[var(--bg-main)] p-4 sm:p-6 shadow-2xl z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-3 sm:pb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--ink-main)] text-white dark:bg-white dark:text-black">
                <Camera size={16} />
              </div>
              <h2 className="font-display text-lg font-bold tracking-tight text-[var(--text-main)]">
                Foto de Perfil
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-[var(--text-soft)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Current / Preview Avatar display */}
          <div className="my-6 flex flex-col items-center justify-center gap-3">
            <div className="relative group flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-2 border-black/10 dark:border-white/20 bg-black/5 dark:bg-white/5 shadow-md">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Pré-visualização do Avatar"
                  className="h-full w-full object-cover"
                  onError={() => setError('Não foi possível carregar a imagem da URL informada.')}
                />
              ) : (
                <span className="font-display text-2xl font-bold text-[var(--text-main)]">
                  {userInitials}
                </span>
              )}
            </div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-soft)]">
              {previewUrl ? 'Pré-visualização' : 'Sem foto personalizada'}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-black/10 dark:border-white/10 mb-4">
            <button
              type="button"
              onClick={() => { setActiveTab('upload'); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 font-mono text-xs uppercase tracking-wider transition-colors border-b-2 ${
                activeTab === 'upload'
                  ? 'border-[var(--text-main)] font-bold text-[var(--text-main)]'
                  : 'border-transparent text-[var(--text-soft)] hover:text-[var(--text-main)]'
              }`}
            >
              <Upload size={13} />
              <span>Enviar</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('presets'); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 font-mono text-xs uppercase tracking-wider transition-colors border-b-2 ${
                activeTab === 'presets'
                  ? 'border-[var(--text-main)] font-bold text-[var(--text-main)]'
                  : 'border-transparent text-[var(--text-soft)] hover:text-[var(--text-main)]'
              }`}
            >
              <Sparkles size={13} />
              <span>Avatares</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('url'); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 font-mono text-xs uppercase tracking-wider transition-colors border-b-2 ${
                activeTab === 'url'
                  ? 'border-[var(--text-main)] font-bold text-[var(--text-main)]'
                  : 'border-transparent text-[var(--text-soft)] hover:text-[var(--text-main)]'
              }`}
            >
              <LinkIcon size={13} />
              <span>Link URL</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="min-h-[140px] space-y-3">
            {activeTab === 'upload' && (
              <div className="space-y-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png, image/jpeg, image/webp, image/gif"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-black/15 dark:border-white/15 p-6 hover:border-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/5 transition-all text-center"
                >
                  <Upload size={24} className="text-[var(--text-soft)]" />
                  <div>
                    <p className="text-xs font-semibold text-[var(--text-main)]">
                      Clique para escolher uma imagem do seu computador
                    </p>
                    <p className="text-[10px] text-[var(--text-soft)] mt-0.5">
                      PNG, JPG ou WEBP (Max 10MB)
                    </p>
                  </div>
                </button>
              </div>
            )}

            {activeTab === 'presets' && (
              <div className="grid grid-cols-3 gap-3">
                {PRESET_AVATARS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setPreviewUrl(preset.url);
                      setError(null);
                    }}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border p-2.5 transition-all ${
                      previewUrl === preset.url
                        ? 'border-sky-500 bg-sky-500/10 ring-2 ring-sky-500/30'
                        : 'border-black/10 dark:border-white/10 hover:border-black/30 dark:hover:border-white/30'
                    }`}
                  >
                    <img src={preset.url} alt={preset.name} className="h-12 w-12 rounded-lg object-cover" />
                    <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--text-soft)] truncate max-w-full">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'url' && (
              <form onSubmit={handleApplyUrl} className="space-y-3">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-[var(--text-soft)] mb-1">
                    URL da Imagem
                  </label>
                  <input
                    type="url"
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    placeholder="https://exemplo.com/minha-imagem.png"
                    className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-xs text-[var(--text-main)] outline-none focus:border-[var(--text-main)]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-black/10 dark:border-white/10 px-3 py-2 font-mono text-xs uppercase tracking-wider font-medium hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                  <Check size={14} />
                  <span>Aplicar URL</span>
                </button>
              </form>
            )}
          </div>

          {error && (
            <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-500">
              {error}
            </p>
          )}

          {/* Footer Actions */}
          <div className="mt-6 flex items-center justify-between border-t border-black/10 dark:border-white/10 pt-4 gap-2">
            {currentAvatarUrl ? (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 font-mono text-xs uppercase tracking-wider text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
              >
                <Trash2 size={14} />
                <span className="hidden sm:inline">Remover</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-lg border border-black/10 dark:border-white/10 px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--text-soft)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={loading || previewUrl === currentAvatarUrl}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--ink-main)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-white dark:bg-white dark:text-black font-medium transition-all hover:opacity-90 disabled:opacity-50"
              >
                {loading ? <LoaderCircle size={14} className="animate-spin" /> : <Check size={14} />}
                <span>Salvar</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
