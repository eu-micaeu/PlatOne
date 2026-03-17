import { useState, useEffect, useRef, type FormEvent } from 'react';
import { Message, User, Conversation } from '../types/friends';
import '../styles/MessagesPage.css';

const MESSAGE_FRIEND_ID_STORAGE_KEY = 'platone.messages.friendId';
const MESSAGE_FRIEND_NAME_STORAGE_KEY = 'platone.messages.friendName';

function getAuthHeaders(): HeadersInit {
  if (typeof window === 'undefined') {
    return {};
  }

  const token = localStorage.getItem('platone.auth.token');
  if (!token) {
    return {};
  }

  return { Authorization: `Bearer ${token}` };
}

interface MessagesPageProps {
  currentUserId?: string;
}

export default function MessagesPage({ currentUserId = '' }: MessagesPageProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageContent, setMessageContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState('');
  const [friendsById, setFriendsById] = useState<Record<string, User>>({});
  const [selectedFriend, setSelectedFriend] = useState<User | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const consumePendingFriendSelection = () => {
    if (typeof window === 'undefined') {
      return { id: '', name: '' };
    }

    const friendId = sessionStorage.getItem(MESSAGE_FRIEND_ID_STORAGE_KEY)?.trim() ?? '';
    const friendName = sessionStorage.getItem(MESSAGE_FRIEND_NAME_STORAGE_KEY)?.trim() ?? '';

    if (friendId) {
      sessionStorage.removeItem(MESSAGE_FRIEND_ID_STORAGE_KEY);
      sessionStorage.removeItem(MESSAGE_FRIEND_NAME_STORAGE_KEY);
    }

    return { id: friendId, name: friendName };
  };

  // Load conversations
  useEffect(() => {
    if (!currentUserId) {
      return;
    }

    loadFriendsDirectory();
    loadConversations();
    loadUnreadCount();
    const interval = setInterval(() => {
      loadConversations();
      loadUnreadCount();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [currentUserId]);

  // Load messages for selected conversation
  useEffect(() => {
    if (selectedConversation && currentUserId) {
      loadMessages(selectedConversation);
      markAsRead(selectedConversation);
      const interval = setInterval(() => {
        loadMessages(selectedConversation);
      }, 2000); // Refresh every 2 seconds
      return () => clearInterval(interval);
    }
  }, [selectedConversation, currentUserId]);

  useEffect(() => {
    if (!selectedConversation) {
      setSelectedFriend(null);
      return;
    }

    const knownFriend = friendsById[selectedConversation];
    if (knownFriend) {
      setSelectedFriend(knownFriend);
      return;
    }

    setSelectedFriend({
      id: selectedConversation,
      username: `Usuário ${selectedConversation.slice(-6)}`,
      email: '',
      created_at: new Date().toISOString(),
    });
  }, [friendsById, selectedConversation]);

  useEffect(() => {
    if (!currentUserId) {
      return;
    }

    const pendingSelection = consumePendingFriendSelection();
    if (!pendingSelection.id) {
      return;
    }

    setSelectedConversation(pendingSelection.id);

    const knownFriend = friendsById[pendingSelection.id];
    if (knownFriend) {
      setSelectedFriend(knownFriend);
      return;
    }

    setSelectedFriend({
      id: pendingSelection.id,
      username: pendingSelection.name || `Usuário ${pendingSelection.id.slice(-6)}`,
      email: '',
      created_at: new Date().toISOString(),
    });
  }, [currentUserId, friendsById]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/messages/conversations', {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setConversations(data || []);
      }
    } catch (err) {
      console.error('Erro ao carregar conversas:', err);
    }
  };

  const loadMessages = async (friendId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/messages/${friendId}`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data || []);
      }
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await fetch('/api/messages/unread', {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unread_count || 0);
      }
    } catch (err) {
      console.error('Erro ao carregar contagem de não lidas:', err);
    }
  };

  const markAsRead = async (friendId: string) => {
    try {
      await fetch(`/api/messages/${friendId}/read`, {
        method: 'PUT',
        headers: getAuthHeaders(),
      });
      loadUnreadCount();
    } catch (err) {
      console.error('Erro ao marcar como lido:', err);
    }
  };

  const loadFriendsDirectory = async () => {
    try {
      const response = await fetch('/api/friends', {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        return;
      }

      const data = await response.json();
      const friendMap: Record<string, User> = {};

      if (Array.isArray(data)) {
        data.forEach((friend) => {
          if (friend?.id) {
            friendMap[friend.id] = friend;
          }
        });
      }

      setFriendsById(friendMap);
    } catch (err) {
      console.error('Erro ao carregar amigos para as conversas:', err);
    }
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();

    if (!messageContent.trim() || !selectedConversation) {
      return;
    }

    try {
      setError('');
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to_id: selectedConversation,
          content: messageContent,
        }),
      });

      if (response.ok) {
        setMessageContent('');
        loadMessages(selectedConversation);
        loadConversations();
      } else {
        setError('Erro ao enviar mensagem');
      }
    } catch (err) {
      setError('Erro ao enviar mensagem');
      console.error(err);
    }
  };

  const selectConversation = (conversation: Conversation) => {
    const friendId = String(conversation._id);
    setSelectedConversation(friendId);
    const knownFriend = friendsById[friendId];
    if (knownFriend) {
      setSelectedFriend(knownFriend);
      return;
    }

    setSelectedFriend({
      id: friendId,
      username: `Usuário ${friendId.slice(-6)}`,
      email: '',
      created_at: new Date().toISOString(),
    });
  };

  const getConversationDisplayName = (conversation: Conversation) => {
    const friendId = String(conversation._id);
    return friendsById[friendId]?.username || `Usuário ${friendId.slice(-6)}`;
  };

  const getConversationInitial = (conversation: Conversation) => {
    const displayName = getConversationDisplayName(conversation);
    return displayName.charAt(0).toUpperCase();
  };

  const friendsWithoutConversation = Object.values(friendsById).filter((friend) => {
    return !conversations.some((conversation) => String(conversation._id) === friend.id);
  });

  if (!currentUserId) {
    return (
      <div className="messages-page">
        <div className="no-conversation">
          <p>Faça login novamente para acessar suas mensagens.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="messages-page">
      <div className="messages-container">
        <div className="conversations-panel">
          <div className="conversations-header">
            <h2>Mensagens</h2>
            {unreadCount > 0 && (
              <span className="unread-badge">{unreadCount}</span>
            )}
          </div>

          <div className="conversations-list">
            {conversations.length === 0 ? (
              <div>
                <p className="empty-conversations">Você não tem conversas ainda</p>
                {friendsWithoutConversation.length > 0 && (
                  <div>
                    {friendsWithoutConversation.map((friend) => (
                      <div
                        key={friend.id}
                        className={`conversation-item ${selectedConversation === friend.id ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedConversation(friend.id);
                          setSelectedFriend(friend);
                        }}
                      >
                        <div className="conversation-avatar">
                          <div className="avatar-placeholder">{friend.username.charAt(0).toUpperCase()}</div>
                        </div>
                        <div className="conversation-info">
                          <h4>{friend.username}</h4>
                          <p className="last-message">Iniciar conversa</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation._id}
                  className={`conversation-item ${
                    selectedConversation === conversation._id ? 'active' : ''
                  }`}
                  onClick={() => selectConversation(conversation)}
                >
                  <div className="conversation-avatar">
                    <div className="avatar-placeholder">
                      {getConversationInitial(conversation)}
                    </div>
                  </div>
                  <div className="conversation-info">
                    <h4>{getConversationDisplayName(conversation)}</h4>
                    <p className="last-message">
                      {conversation.last_message.content.length > 40
                        ? conversation.last_message.content.substring(0, 40) + '...'
                        : conversation.last_message.content}
                    </p>
                  </div>
                  {conversation.unread_count > 0 && (
                    <span className="unread-indicator">
                      {conversation.unread_count}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="chat-panel">
          {selectedConversation ? (
            <>
              <div className="chat-header">
                <h3>{selectedFriend?.username || selectedConversation}</h3>
              </div>

              {error && <div className="alert alert-error">{error}</div>}

              <div className="messages-list">
                {loading ? (
                  <p className="loading">Carregando mensagens...</p>
                ) : messages.length === 0 ? (
                  <p className="empty-messages">
                    Nenhuma mensagem ainda. Comece a conversa!
                  </p>
                ) : (
                  <>
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`message-item ${
                          message.from_id === currentUserId ? 'sent' : 'received'
                        }`}
                      >
                        <div className="message-bubble">
                          <p className="message-content">{message.content}</p>
                          <span className="message-time">
                            {new Date(message.created_at).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              <form className="message-input-form" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="message-input"
                />
                <button type="submit" className="send-button">
                  Enviar
                </button>
              </form>
            </>
          ) : (
            <div className="no-conversation">
              <p>Selecione uma conversa para começar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
