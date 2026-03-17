import { useState, useEffect } from 'react';
import { Friend, FriendRequest, User } from '../types/friends';
import '../styles/FriendsPage.css';

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

interface FriendsPageProps {
  onSendMessage?: (friendId: string, friendName: string) => void;
  currentUserId?: string;
}

export default function FriendsPage({ onSendMessage }: FriendsPageProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'add'>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load friends and friend requests
  useEffect(() => {
    loadFriends();
    loadFriendRequests();
  }, []);

  useEffect(() => {
    if (activeTab !== 'add') {
      return;
    }

    const query = searchQuery.trim();
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    const timeout = setTimeout(() => {
      void searchUsers(query);
    }, 350);

    return () => clearTimeout(timeout);
  }, [activeTab, searchQuery]);

  const loadFriends = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/friends', {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setFriends(data || []);
      } else {
        const message = await response.text();
        setError(message || 'Erro ao carregar amigos');
      }
    } catch (err) {
      setError('Erro ao carregar amigos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadFriendRequests = async () => {
    try {
      const response = await fetch('/api/friends/requests', {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setFriendRequests(data || []);
      } else {
        const message = await response.text();
        setError(message || 'Erro ao carregar pedidos de amizade');
      }
    } catch (err) {
      console.error('Erro ao carregar pedidos de amizade:', err);
    }
  };

  const searchUsers = async (query: string) => {
    try {
      setSearchingUsers(true);
      const response = await fetch(`/api/users/search?query=${encodeURIComponent(query)}`, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(Array.isArray(data) ? data : []);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
      setSearchResults([]);
    } finally {
      setSearchingUsers(false);
    }
  };

  const handleSendFriendRequest = async (targetUserId: string) => {
    try {
      setError('');
      const response = await fetch('/api/friends/request', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to_id: targetUserId,
        }),
      });

      if (response.ok) {
        setSuccess('Pedido de amizade enviado!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.text();
        setError(errorData || 'Erro ao enviar pedido de amizade');
      }
    } catch (err) {
      setError('Erro ao enviar pedido de amizade');
      console.error(err);
    }
  };

  const handleAcceptFriendRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/friends/request/${requestId}/accept`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        setSuccess('Pedido aceito!');
        loadFriendRequests();
        loadFriends();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Erro ao aceitar pedido de amizade');
      }
    } catch (err) {
      setError('Erro ao aceitar pedido de amizade');
      console.error(err);
    }
  };

  const handleRejectFriendRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/friends/request/${requestId}/reject`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        setSuccess('Pedido rejeitado');
        loadFriendRequests();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Erro ao rejeitar pedido de amizade');
      }
    } catch (err) {
      setError('Erro ao rejeitar pedido de amizade');
      console.error(err);
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!confirm('Tem certeza que deseja remover este amigo?')) return;

    try {
      const response = await fetch(`/api/friends/${friendId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        setSuccess('Amigo removido');
        loadFriends();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Erro ao remover amigo');
      }
    } catch (err) {
      setError('Erro ao remover amigo');
      console.error(err);
    }
  };

  return (
    <div className="friends-page">
      <div className="friends-header">
        <h1>Amigos</h1>
        <div className="friend-stats">
          <div className="stat">
            <span className="stat-number">{friends.length}</span>
            <span className="stat-label">Amigos</span>
          </div>
          <div className="stat">
            <span className="stat-number">{friendRequests.length}</span>
            <span className="stat-label">Pedidos</span>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="friends-tabs">
        <button
          className={`tab-button ${activeTab === 'friends' ? 'active' : ''}`}
          onClick={() => setActiveTab('friends')}
        >
          Meus Amigos ({friends.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          Pedidos de Amizade ({friendRequests.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => setActiveTab('add')}
        >
          Adicionar Amigos
        </button>
      </div>

      <div className="friends-content">
        {activeTab === 'friends' && (
          <div className="friends-list-container">
            {loading ? (
              <p className="loading">Carregando amigos...</p>
            ) : friends.length === 0 ? (
              <p className="empty-state">
                Você ainda não tem amigos. Comece adicionando outros jogadores!
              </p>
            ) : (
              <div className="friends-grid">
                {friends.map((friend) => (
                  <div key={friend.id} className="friend-card">
                    <div className="friend-avatar">
                      <div className="avatar-placeholder">
                        {friend.username.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="friend-info">
                      <h3 className="friend-name">{friend.username}</h3>
                      <p className="friend-email">{friend.email}</p>
                    </div>
                    <div className="friend-actions">
                      <button
                        className="btn btn-primary btn-small"
                        onClick={() => onSendMessage?.(friend.id, friend.username)}
                      >
                        Enviar Mensagem
                      </button>
                      <button
                        className="btn btn-danger btn-small"
                        onClick={() => handleRemoveFriend(friend.id)}
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="friend-requests-container">
            {friendRequests.length === 0 ? (
              <p className="empty-state">Você não tem pedidos de amizade pendentes</p>
            ) : (
              <div className="requests-list">
                {friendRequests.map((request) => (
                  <div key={request.id} className="request-item">
                    <div className="request-avatar">
                      <div className="avatar-placeholder">
                        {request.from_user?.username.charAt(0).toUpperCase() || '?'}
                      </div>
                    </div>
                    <div className="request-info">
                      <h4>{request.from_user?.username || `Usuário ${request.from_id.slice(-6)}`}</h4>
                      <p>{request.from_user?.email || ''}</p>
                      <span className="request-date">
                        {new Date(request.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="request-actions">
                      <button
                        className="btn btn-success"
                        onClick={() => handleAcceptFriendRequest(request.id)}
                      >
                        Aceitar
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleRejectFriendRequest(request.id)}
                      >
                        Rejeitar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'add' && (
          <div className="add-friends-container">
            <h2>Procurar Amigos</h2>
            <div className="search-box">
              <input
                type="text"
                placeholder="Procure por nome de usuário ou email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
            <p className="info-text">Digite pelo menos 2 caracteres para buscar usuários.</p>

            {searchingUsers && <p className="loading">Buscando usuários...</p>}

            {!searchingUsers && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
              <p className="empty-state">Nenhum usuário encontrado com esse termo.</p>
            )}

            {!searchingUsers && searchResults.length > 0 && (
              <div className="requests-list">
                {searchResults.map((result) => {
                  const isAlreadyFriend = friends.some((friend) => friend.id === result.id);

                  return (
                    <div key={result.id} className="request-item">
                      <div className="request-avatar">
                        <div className="avatar-placeholder">{result.username.charAt(0).toUpperCase()}</div>
                      </div>
                      <div className="request-info">
                        <h4>{result.username}</h4>
                        <p>{result.email}</p>
                      </div>
                      <div className="request-actions">
                        <button
                          className="btn btn-primary"
                          disabled={isAlreadyFriend}
                          onClick={() => handleSendFriendRequest(result.id)}
                        >
                          {isAlreadyFriend ? 'Já é amigo' : 'Enviar Pedido'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
