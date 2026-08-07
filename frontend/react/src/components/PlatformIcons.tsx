type IconProps = {
  className?: string;
  alt?: string;
  variant?: 'auto' | 'black' | 'white' | 'inverse';
};

export function SteamIcon({ className = 'h-4 w-4', alt = 'Steam', variant = 'auto' }: IconProps) {
  if (variant === 'black') {
    return (
      <img
        src="/Steam Icon - Black - zonalogo.com.svg"
        alt={alt}
        className={`${className} object-contain`}
        decoding="async"
        draggable={false}
      />
    );
  }
  if (variant === 'white') {
    return (
      <img
        src="/Steam Icon - White - zonalogo.com.svg"
        alt={alt}
        className={`${className} object-contain`}
        decoding="async"
        draggable={false}
      />
    );
  }
  if (variant === 'inverse') {
    return (
      <span className="inline-flex items-center justify-center">
        <img
          src="/Steam Icon - White - zonalogo.com.svg"
          alt={alt}
          className={`${className} show-in-light object-contain`}
          decoding="async"
          draggable={false}
        />
        <img
          src="/Steam Icon - Black - zonalogo.com.svg"
          alt={alt}
          className={`${className} show-in-dark object-contain`}
          decoding="async"
          draggable={false}
        />
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center">
      <img
        src="/Steam Icon - Black - zonalogo.com.svg"
        alt={alt}
        className={`${className} show-in-light object-contain`}
        decoding="async"
        draggable={false}
      />
      <img
        src="/Steam Icon - White - zonalogo.com.svg"
        alt={alt}
        className={`${className} show-in-dark object-contain`}
        decoding="async"
        draggable={false}
      />
    </span>
  );
}

export function XboxIcon({ className = 'h-4 w-4', alt = 'Xbox', variant = 'auto' }: IconProps) {
  if (variant === 'black') {
    return (
      <img
        src="/Xbox Icon - Black - zonalogo.com.png"
        alt={alt}
        className={`${className} object-contain`}
        decoding="async"
        draggable={false}
      />
    );
  }
  if (variant === 'white') {
    return (
      <img
        src="/Xbox Icon - White - zonalogo.com.png"
        alt={alt}
        className={`${className} object-contain`}
        decoding="async"
        draggable={false}
      />
    );
  }
  if (variant === 'inverse') {
    return (
      <span className="inline-flex items-center justify-center">
        <img
          src="/Xbox Icon - White - zonalogo.com.png"
          alt={alt}
          className={`${className} show-in-light object-contain`}
          decoding="async"
          draggable={false}
        />
        <img
          src="/Xbox Icon - Black - zonalogo.com.png"
          alt={alt}
          className={`${className} show-in-dark object-contain`}
          decoding="async"
          draggable={false}
        />
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center">
      <img
        src="/Xbox Icon - Black - zonalogo.com.png"
        alt={alt}
        className={`${className} show-in-light object-contain`}
        decoding="async"
        draggable={false}
      />
      <img
        src="/Xbox Icon - White - zonalogo.com.png"
        alt={alt}
        className={`${className} show-in-dark object-contain`}
        decoding="async"
        draggable={false}
      />
    </span>
  );
}

export function PlayStationIcon({ className = 'h-4 w-4', alt = 'PlayStation', variant = 'auto' }: IconProps) {
  if (variant === 'black') {
    return (
      <img
        src="/PlayStation Logo - Black - zonalogo.com.svg"
        alt={alt}
        className={`${className} object-contain`}
        decoding="async"
        draggable={false}
      />
    );
  }
  if (variant === 'white') {
    return (
      <img
        src="/PlayStation Logo - White - zonalogo.com.svg"
        alt={alt}
        className={`${className} object-contain`}
        decoding="async"
        draggable={false}
      />
    );
  }
  if (variant === 'inverse') {
    return (
      <span className="inline-flex items-center justify-center">
        <img
          src="/PlayStation Logo - White - zonalogo.com.svg"
          alt={alt}
          className={`${className} show-in-light object-contain`}
          decoding="async"
          draggable={false}
        />
        <img
          src="/PlayStation Logo - Black - zonalogo.com.svg"
          alt={alt}
          className={`${className} show-in-dark object-contain`}
          decoding="async"
          draggable={false}
        />
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center">
      <img
        src="/PlayStation Logo - Black - zonalogo.com.svg"
        alt={alt}
        className={`${className} show-in-light object-contain`}
        decoding="async"
        draggable={false}
      />
      <img
        src="/PlayStation Logo - White - zonalogo.com.svg"
        alt={alt}
        className={`${className} show-in-dark object-contain`}
        decoding="async"
        draggable={false}
      />
    </span>
  );
}

export function NintendoIcon({ className = 'h-4 w-4', alt = 'Nintendo', variant = 'auto' }: IconProps) {
  if (variant === 'black') {
    return (
      <img
        src="/Nintendo Logo - Black - zonalogo.com.svg"
        alt={alt}
        className={`${className} object-contain`}
        decoding="async"
        draggable={false}
      />
    );
  }
  if (variant === 'white') {
    return (
      <img
        src="/Nintendo Logo - White - zonalogo.com.svg"
        alt={alt}
        className={`${className} object-contain`}
        decoding="async"
        draggable={false}
      />
    );
  }
  if (variant === 'inverse') {
    return (
      <span className="inline-flex items-center justify-center">
        <img
          src="/Nintendo Logo - White - zonalogo.com.svg"
          alt={alt}
          className={`${className} show-in-light object-contain`}
          decoding="async"
          draggable={false}
        />
        <img
          src="/Nintendo Logo - Black - zonalogo.com.svg"
          alt={alt}
          className={`${className} show-in-dark object-contain`}
          decoding="async"
          draggable={false}
        />
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center">
      <img
        src="/Nintendo Logo - Black - zonalogo.com.svg"
        alt={alt}
        className={`${className} show-in-light object-contain`}
        decoding="async"
        draggable={false}
      />
      <img
        src="/Nintendo Logo - White - zonalogo.com.svg"
        alt={alt}
        className={`${className} show-in-dark object-contain`}
        decoding="async"
        draggable={false}
      />
    </span>
  );
}

export function PlatformStatusCards() {
  return (
    <div className="space-y-2">
      {/* Steam - Active */}
      <div className="flex items-center justify-between rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-2.5 transition-all hover:border-emerald-500/40">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-black/10 dark:bg-white/10 p-1.5">
            <SteamIcon className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-[var(--text-main)]">Steam</p>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-1.5 py-0.2 font-mono text-[9px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Conexão Pronta
              </span>
            </div>
            <p className="text-[10px] text-[var(--text-soft)]">Já é possível conectar e sincronizar conquistas</p>
          </div>
        </div>
      </div>

      {/* Xbox - Active */}
      <div className="flex items-center justify-between rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-2.5 transition-all hover:border-emerald-500/40">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-black/10 dark:bg-white/10 p-1.5">
            <XboxIcon className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-[var(--text-main)]">Xbox Network</p>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-1.5 py-0.2 font-mono text-[9px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Conexão Pronta
              </span>
            </div>
            <p className="text-[10px] text-[var(--text-soft)]">Sincronização de Gamerscore e conquistas</p>
          </div>
        </div>
      </div>

      {/* PlayStation - Future */}
      <div className="flex items-center justify-between rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-2.5 opacity-80">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-black/10 dark:bg-white/10 p-1.5">
            <PlayStationIcon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--text-main)]">PlayStation Network</p>
            <p className="text-[10px] text-[var(--text-soft)]">Futura sincronização de troféus</p>
          </div>
        </div>
        <span className="inline-flex items-center rounded-md border border-black/10 dark:border-white/10 px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-wider text-[var(--text-soft)]">
          Em Breve
        </span>
      </div>
    </div>
  );
}

export function PlatformMobileChips() {
  return (
    <div className="mb-4 lg:hidden rounded-lg border border-black/10 dark:border-white/10 p-2.5 bg-black/5 dark:bg-white/5">
      <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--text-soft)] mb-2">
        Plataformas
      </p>
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
        <div className="flex shrink-0 items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-[var(--text-main)]">
          <SteamIcon className="h-3.5 w-3.5" />
          <span>Steam</span>
          <span className="text-[9px] font-mono uppercase bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-semibold">Conectável</span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-[var(--text-main)]">
          <XboxIcon className="h-3.5 w-3.5" />
          <span>Xbox</span>
          <span className="text-[9px] font-mono uppercase bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-semibold">Conectável</span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 rounded-md border border-black/10 dark:border-white/10 px-2.5 py-1 text-xs text-[var(--text-soft)] opacity-85">
          <PlayStationIcon className="h-3.5 w-3.5" />
          <span>PlayStation</span>
          <span className="text-[9px] font-mono uppercase bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded">Em breve</span>
        </div>
      </div>
    </div>
  );
}
