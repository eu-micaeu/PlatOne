import { useState, useEffect, useRef, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  MessageSquare,
  X,
  Search,
  UserPlus,
  Send,
  ArrowLeft,
  LoaderCircle,
  UserMinus,
  ExternalLink,
  Sparkles,
  ChevronRight,
  Circle,
} from 'lucide-react';
import type { AuthUser, Friend, ChatMessage } from '../types/app';

type FriendsChatSidebarProps = {
  isOpen: boolean;
  user: AuthUser | null;
  authToken: string | null;
  onClose: () => void;
  onNavigateToProfile: (username: string) => void;
};

export default function FriendsChatSidebar({
  isOpen,
  user,
  authToken,
  onClose,
  onNavigateToProfile,
}: FriendsChatSidebarProps) {
  const [activeTab, setActiveTab] = useState<'friends' | 'chat'>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [friendsError, setFriendsError] = useState<string | null>(null);

  const [filterMode, setFilterMode] = useState<'all' | 'online'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Add friend state
  const [showAddForm, setShowAddForm] = useState(false);
  const [addInput, setAddInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [addMessage, setAddMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Active chat state
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch friends list when sidebar is open
  useEffect(() => {
    if (!isOpen || !authToken) return;

    const fetchFriends = async () => {
      setLoadingFriends(true);
      setFriendsError(null);
      try {
        const res = await fetch('/api/friends', {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (!res.ok) throw new Error('Falha ao carregar lista de amigos.');
        const data = (await res.json()) as { friends: Friend[] };
        setFriends(data.friends || []);
      } catch (err) {
        setFriendsError(err instanceof Error ? err.message : 'Erro ao carregar amigos.');
      } finally {
        setLoadingFriends(false);
      }
    };

    fetchFriends();
  }, [isOpen, authToken]);

  // Fetch chat history when selectedFriend changes
  useEffect(() => {
    if (!selectedFriend || !authToken) return;

    let intervalId: NodeJS.Timeout;

    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/chat/${selectedFriend.id}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (!res.ok) return;
        const data = (await res.json()) as { messages: ChatMessage[] };
        setMessages(data.messages || []);
      } catch (err) {
        console.error('Chat fetch error:', err);
      }
    };

    setLoadingChat(true);
    fetchMessages().finally(() => setLoadingChat(false));

    // Poll for new messages every 3 seconds while chat is active
    intervalId = setInterval(fetchMessages, 3000);

    return () => clearInterval(intervalId);
  }, [selectedFriend, authToken]);

  // Auto scroll chat to bottom
  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  const handleAddFriendSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!addInput.trim() || !authToken) return;

    setAdding(true);
    setAddMessage(null);

    try {
      const res = await fetch('/api/friends/add', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: addInput.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao adicionar amigo.');
      }

      setAddMessage({ text: 'Amigo adicionado com sucesso!', isError: false });
      if (data.friend) {
        setFriends((prev) => [data.friend, ...prev.filter((f) => f.id !== data.friend.id)]);
      }
      setAddInput('');
      setTimeout(() => setAddMessage(null), 3000);
    } catch (err) {
      setAddMessage({
        text: err instanceof Error ? err.message : 'Falha ao adicionar amigo.',
        isError: true,
      });
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!authToken) return;
    try {
      await fetch(`/api/friends/${friendId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setFriends((prev) => prev.filter((f) => f.id !== friendId));
      if (selectedFriend?.id === friendId) {
        setSelectedFriend(null);
        setActiveTab('friends');
      }
    } catch (err) {
      console.error('Remove friend error:', err);
    }
  };

  const handleSendMessage = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!messageInput.trim() || !selectedFriend || !authToken || sending) return;

    const textToSend = messageInput.trim();
    setMessageInput('');
    setSending(true);

    const tempMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      senderId: user?.id || 'me',
      receiverId: selectedFriend.id,
      content: textToSend,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const res = await fetch(`/api/chat/${selectedFriend.id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: textToSend }),
      });

      if (!res.ok) throw new Error('Erro ao enviar mensagem.');
      const data = (await res.json()) as { message: ChatMessage };

      setMessages((prev) => prev.map((m) => (m.id === tempMsg.id ? data.message : m)));
    } catch (err) {
      console.error('Send message error:', err);
    } finally {
      setSending(false);
    }
  };

  const handleStartChat = (friend: Friend) => {
    setSelectedFriend(friend);
    setActiveTab('chat');
  };

  const filteredFriends = friends.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterMode === 'online') {
      return matchesSearch && (f.status === 'online' || f.status === 'ingame');
    }
    return matchesSearch;
  });

  const onlineCount = friends.filter((f) => f.status === 'online' || f.status === 'ingame').length;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop for mobile */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs md:hidden"
          onClick={onClose}
        />

        {/* Sidebar Container */}
        <motion.aside
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="fixed right-0 top-0 bottom-0 z-50 flex w-full max-w-sm flex-col border-l border-black/10 dark:border-white/10 bg-[var(--bg-main)] shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--ink-main)] text-white dark:bg-white dark:text-black">
                <Users size={16} />
              </div>
              <div>
                <h2 className="font-display text-base font-bold tracking-tight text-[var(--text-main)]">
                  Amigos & Chat
                </h2>
                <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-soft)]">
                  {onlineCount} amigos online
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-[var(--text-soft)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              title="Fechar sidebar"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setActiveTab('friends')}
              className={`flex-1 flex items-center justify-center gap-2 rounded-md py-1.5 font-mono text-xs uppercase tracking-wider transition-colors ${
                activeTab === 'friends'
                  ? 'bg-[var(--bg-main)] font-bold text-[var(--text-main)] shadow-xs'
                  : 'text-[var(--text-soft)] hover:text-[var(--text-main)]'
              }`}
            >
              <Users size={13} />
              <span>Amigos ({friends.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className={`flex-1 flex items-center justify-center gap-2 rounded-md py-1.5 font-mono text-xs uppercase tracking-wider transition-colors ${
                activeTab === 'chat'
                  ? 'bg-[var(--bg-main)] font-bold text-[var(--text-main)] shadow-xs'
                  : 'text-[var(--text-soft)] hover:text-[var(--text-main)]'
              }`}
            >
              <MessageSquare size={13} />
              <span>Chat {selectedFriend ? `(${selectedFriend.name})` : ''}</span>
            </button>
          </div>

          {/* TAB 1: FRIENDS LIST */}
          {activeTab === 'friends' && (
            <div className="flex flex-1 flex-col overflow-hidden">
              {/* Search & Actions Bar */}
              <div className="p-3 space-y-2 border-b border-black/10 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search
                      size={14}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-soft)]"
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar amigos..."
                      className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-transparent pl-8 pr-3 py-1.5 text-xs text-[var(--text-main)] outline-none focus:border-[var(--text-main)]"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="inline-flex h-8 items-center justify-center gap-1 rounded-lg bg-[var(--ink-main)] px-2.5 font-mono text-[10px] uppercase tracking-wider text-white dark:bg-white dark:text-black font-medium transition-opacity hover:opacity-90"
                    title="Adicionar Amigo"
                  >
                    <UserPlus size={13} />
                    <span className="hidden sm:inline">Add</span>
                  </button>
                </div>

                {/* Add Friend Form Expandable */}
                <AnimatePresence>
                  {showAddForm && (
                    <motion.form
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      onSubmit={handleAddFriendSubmit}
                      className="space-y-2 overflow-hidden pt-1"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={addInput}
                          onChange={(e) => setAddInput(e.target.value)}
                          placeholder="Nickname ou email do jogador"
                          className="flex-1 rounded-lg border border-black/10 dark:border-white/10 bg-transparent px-3 py-1.5 text-xs text-[var(--text-main)] outline-none focus:border-[var(--text-main)]"
                          required
                        />
                        <button
                          type="submit"
                          disabled={adding || !addInput.trim()}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-white font-medium hover:opacity-90 disabled:opacity-50"
                        >
                          {adding ? <LoaderCircle size={13} className="animate-spin" /> : 'Adicionar'}
                        </button>
                      </div>
                      {addMessage && (
                        <p
                          className={`text-[11px] px-1 ${
                            addMessage.isError ? 'text-red-500' : 'text-emerald-500'
                          }`}
                        >
                          {addMessage.text}
                        </p>
                      )}
                    </motion.form>
                  )}
                </AnimatePresence>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setFilterMode('all')}
                    className={`rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                      filterMode === 'all'
                        ? 'bg-black/10 dark:bg-white/15 font-bold text-[var(--text-main)]'
                        : 'text-[var(--text-soft)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    Todos ({friends.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterMode('online')}
                    className={`rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                      filterMode === 'online'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                        : 'text-[var(--text-soft)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    Online ({onlineCount})
                  </button>
                </div>
              </div>

              {/* Friends List Container */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {loadingFriends ? (
                  <div className="flex min-h-[120px] items-center justify-center">
                    <LoaderCircle size={20} className="animate-spin text-[var(--text-soft)]" />
                  </div>
                ) : friendsError ? (
                  <p className="p-3 text-xs text-red-500 text-center">{friendsError}</p>
                ) : filteredFriends.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[var(--text-soft)]">
                    Nenhum amigo encontrado.
                  </div>
                ) : (
                  filteredFriends.map((friend) => (
                    <div
                      key={friend.id}
                      className="group flex items-center justify-between rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-2.5 transition-all hover:bg-black/10 dark:hover:bg-white/10"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar with Status Indicator */}
                        <div className="relative h-10 w-10 flex-shrink-0">
                          {friend.avatarUrl ? (
                            <img
                              src={friend.avatarUrl}
                              alt={friend.name}
                              className="h-10 w-10 rounded-lg object-cover border border-black/10 dark:border-white/15"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--ink-main)] font-display text-sm font-bold text-white dark:bg-white dark:text-black">
                              {friend.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[var(--bg-main)] ${
                              friend.status === 'online'
                                ? 'bg-emerald-500'
                                : friend.status === 'ingame'
                                ? 'bg-purple-500'
                                : 'bg-neutral-400'
                            }`}
                          />
                        </div>

                        {/* Friend Info */}
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-xs text-[var(--text-main)] truncate">
                            {friend.name}
                          </p>
                          <p className="text-[10px] text-[var(--text-soft)] truncate">
                            {friend.status === 'ingame'
                              ? `🎮 ${friend.currentGame || 'Em Jogo'}`
                              : friend.status === 'online'
                              ? '🟢 Online'
                              : `⚪ ${friend.lastSeen || 'Offline'}`}
                          </p>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartChat(friend)}
                          className="rounded-lg p-1.5 text-[var(--text-soft)] hover:bg-black/10 dark:hover:bg-white/15 hover:text-[var(--text-main)] transition-colors"
                          title="Abrir Chat"
                        >
                          <MessageSquare size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onNavigateToProfile(friend.name);
                            onClose();
                          }}
                          className="rounded-lg p-1.5 text-[var(--text-soft)] hover:bg-black/10 dark:hover:bg-white/15 hover:text-[var(--text-main)] transition-colors"
                          title="Ver Perfil"
                        >
                          <ExternalLink size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveFriend(friend.id)}
                          className="rounded-lg p-1.5 text-[var(--text-soft)] hover:bg-red-500/10 hover:text-red-500 transition-colors"
                          title="Remover Amigo"
                        >
                          <UserMinus size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CHAT MESSAGES */}
          {activeTab === 'chat' && (
            <div className="flex flex-1 flex-col overflow-hidden">
              {!selectedFriend ? (
                <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/5 dark:bg-white/5 text-[var(--text-soft)] mb-3">
                    <MessageSquare size={24} />
                  </div>
                  <p className="font-display text-sm font-bold text-[var(--text-main)]">
                    Nenhuma conversa selecionada
                  </p>
                  <p className="text-xs text-[var(--text-soft)] mt-1 max-w-[200px]">
                    Selecione um amigo na aba &quot;Amigos&quot; para iniciar um bate-papo.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('friends')}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[var(--ink-main)] px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-white dark:bg-white dark:text-black font-medium"
                  >
                    <span>Ver Lista de Amigos</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              ) : (
                <>
                  {/* Selected Friend Top Header */}
                  <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 p-3 bg-black/5 dark:bg-white/5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => setActiveTab('friends')}
                        className="rounded-lg p-1 text-[var(--text-soft)] hover:bg-black/10 dark:hover:bg-white/10"
                        title="Voltar para amigos"
                      >
                        <ArrowLeft size={16} />
                      </button>

                      <div className="relative h-8 w-8 flex-shrink-0">
                        {selectedFriend.avatarUrl ? (
                          <img
                            src={selectedFriend.avatarUrl}
                            alt={selectedFriend.name}
                            className="h-8 w-8 rounded-lg object-cover border border-black/10 dark:border-white/15"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--ink-main)] font-display text-xs font-bold text-white dark:bg-white dark:text-black">
                            {selectedFriend.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--bg-main)] ${
                            selectedFriend.status === 'online'
                              ? 'bg-emerald-500'
                              : selectedFriend.status === 'ingame'
                              ? 'bg-purple-500'
                              : 'bg-neutral-400'
                          }`}
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="font-bold text-xs text-[var(--text-main)] truncate">
                          {selectedFriend.name}
                        </p>
                        <p className="text-[9px] font-mono text-[var(--text-soft)] uppercase tracking-wider">
                          {selectedFriend.status === 'ingame'
                            ? `Jogando ${selectedFriend.currentGame || ''}`
                            : selectedFriend.status === 'online'
                            ? 'Online'
                            : 'Offline'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onNavigateToProfile(selectedFriend.name);
                        onClose();
                      }}
                      className="rounded-lg p-1.5 font-mono text-[10px] text-[var(--text-soft)] hover:bg-black/10 dark:hover:bg-white/10 uppercase tracking-wider flex items-center gap-1"
                    >
                      <span>Perfil</span>
                      <ExternalLink size={12} />
                    </button>
                  </div>

                  {/* Messages History Container */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loadingChat ? (
                      <div className="flex min-h-[120px] items-center justify-center">
                        <LoaderCircle size={20} className="animate-spin text-[var(--text-soft)]" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="p-4 text-center text-xs text-[var(--text-soft)]">
                        Nenhuma mensagem ainda. Envie a primeira mensagem!
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isMe = msg.senderId === user?.id || msg.senderId !== selectedFriend.id;
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                          >
                            <div
                              className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs shadow-xs ${
                                isMe
                                  ? 'bg-[var(--ink-main)] text-white dark:bg-white dark:text-black rounded-tr-xs'
                                  : 'border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/10 text-[var(--text-main)] rounded-tl-xs'
                              }`}
                            >
                              <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                            </div>
                            <span className="mt-1 font-mono text-[9px] text-[var(--text-soft)] px-1">
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Quick Suggestions */}
                  <div className="flex items-center gap-1.5 overflow-x-auto px-3 py-1.5 border-t border-black/10 dark:border-white/10 scrollbar-none">
                    <button
                      type="button"
                      onClick={() => setMessageInput('Bora jogar junto hoje? 🎮')}
                      className="whitespace-nowrap rounded-full border border-black/10 dark:border-white/10 px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider text-[var(--text-soft)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    >
                      Bora jogar? 🎮
                    </button>
                    <button
                      type="button"
                      onClick={() => setMessageInput('Platinei mais um jogo! 🏆')}
                      className="whitespace-nowrap rounded-full border border-black/10 dark:border-white/10 px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider text-[var(--text-soft)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    >
                      Platinei mais um! 🏆
                    </button>
                  </div>

                  {/* Input Bar */}
                  <form onSubmit={handleSendMessage} className="p-3 border-t border-black/10 dark:border-white/10">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder={`Mensagem para ${selectedFriend.name}...`}
                        className="flex-1 rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3.5 py-2 text-xs text-[var(--text-main)] outline-none focus:border-[var(--text-main)]"
                      />
                      <button
                        type="submit"
                        disabled={!messageInput.trim() || sending}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--ink-main)] text-white dark:bg-white dark:text-black font-medium transition-opacity hover:opacity-90 disabled:opacity-40"
                      >
                        <Send size={15} />
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          )}
        </motion.aside>
      </div>
    </AnimatePresence>
  );
}
