// Friend types
export interface FriendRequest {
  id: string;
  from_id: string;
  to_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
  from_user?: User;
}

export interface Friendship {
  id: string;
  user_id_1: string;
  user_id_2: string;
  created_at: string;
}

export interface Friend extends User {
  friendship_id?: string;
}

// Message types
export interface Message {
  id: string;
  from_id: string;
  to_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  from_user?: User;
  to_user?: User;
}

export interface Conversation {
  _id: string;
  last_message: Message;
  unread_count: number;
  friend?: User;
}

// User type (from main types)
export interface User {
  id: string;
  username: string;
  email: string;
  created_at: string;
  platforms?: {
    steam?: {
      steam_id: string;
      profile_url: string;
      last_sync: string;
    };
    xbox?: {
      xuid: string;
      gamertag: string;
      last_sync: string;
    };
    psn?: {
      account_id: string;
      online_id: string;
      last_sync: string;
    };
  };
}

// API Request/Response types
export interface SendFriendRequestPayload {
  from_id: string;
  to_id: string;
}

export interface SendMessagePayload {
  from_id: string;
  to_id: string;
  content: string;
}
