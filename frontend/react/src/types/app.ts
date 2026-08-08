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
  avatarUrl?: string | null;
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

export interface XboxStatus {
  connected: boolean;
  gamertag: string | null;
  linkedAt: string | null;
}

export type StatusFilter = 'all' | 'platinum' | 'progress';

export type ViewMode = 'grid' | 'list';

export type AuthMode = 'login' | 'register';

export interface Friend {
  id: string;
  name: string;
  avatarUrl?: string | null;
  status: 'online' | 'ingame' | 'offline';
  currentGame?: string | null;
  lastSeen?: string;
  unreadCount?: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
}

export interface FriendRequest {
  id: string;
  user: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
  createdAt: string;
}

export interface UnreadMessageNotification {
  friendId: string;
  friendName: string;
  friendAvatarUrl?: string | null;
  lastMessage: string;
  unreadCount: number;
  createdAt: string;
}


