export interface Platinum {
  id: string;
  title: string;
  platform: string;
  externalId: string | null;
  unlocked: number;
  total: number;
  isPlatinum: boolean;
  date: string | null;
  icon: string;
  backupIcon: string | null;
  fallbackIcon: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string | null;
  iconGray: string | null;
  hidden: boolean;
  achieved: boolean;
  unlockTime: string | null;
}

export interface Stats {
  totalPlatinums: number;
  totalGames: number;
  lastSync: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface SteamStatus {
  connected: boolean;
  steamId: string | null;
  linkedAt: string | null;
}

export type StatusFilter = 'all' | 'platinum' | 'progress';

export type ViewMode = 'grid' | 'list';

export type AuthMode = 'login' | 'register';
