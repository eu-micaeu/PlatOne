import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Check, X, Sparkles, MessageSquare } from 'lucide-react';
import type { FriendRequest, UnreadMessageNotification } from '../types/app';

type HeaderNotificationsDropdownProps = {
  authToken: string | null;
  incomingRequestsCount: number;
  unreadMessagesCount: number;
  onRefreshRequests?: () => void;
  onOpenChatWithFriend?: (friendId: string, friendName: string, avatarUrl?: string | null) => void;
};

export default function HeaderNotificationsDropdown({
  authToken,
  incomingRequestsCount,
  unreadMessagesCount,
  onRefreshRequests,
  onOpenChatWithFriend,
}: HeaderNotificationsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [unreadMessages, setUnreadMessages] = useState<UnreadMessageNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const totalNotifications = incomingRequestsCount + unreadMessagesCount;

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Fetch pending requests & unread messages when dropdown is opened
  useEffect(() => {
    if (!isOpen || !authToken) return;

    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/friends', {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (res.ok) {
          const data = (await res.json()) as {
            incomingRequests?: FriendRequest[];
            unreadMessages?: UnreadMessageNotification[];
          };
          setRequests(data.incomingRequests || []);
          setUnreadMessages(data.unreadMessages || []);
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [isOpen, authToken]);

  const handleAccept = async (requestId: string) => {
    if (!authToken) return;
    try {
      const res = await fetch(`/api/friends/requests/${requestId}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        setRequests((prev) => prev.filter((r) => r.id !== requestId));
        onRefreshRequests?.();
      }
    } catch (err) {
      console.error('Error accepting request from dropdown:', err);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!authToken) return;
    try {
      const res = await fetch(`/api/friends/requests/${requestId}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        setRequests((prev) => prev.filter((r) => r.id !== requestId));
        onRefreshRequests?.();
      }
    } catch (err) {
      console.error('Error rejecting request from dropdown:', err);
    }
  };

  const handleOpenChat = (item: UnreadMessageNotification) => {
    setIsOpen(false);
    onOpenChatWithFriend?.(item.friendId, item.friendName, item.friendAvatarUrl);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 dark:border-white/10 transition-colors ${
          isOpen
            ? 'bg-black/10 dark:bg-white/15 text-[var(--text-main)]'
            : 'bg-transparent text-[var(--text-soft)] hover:bg-black/5 dark:hover:bg-white/10 hover:text-[var(--text-main)]'
        }`}
        title="Notificações"
        aria-label="Notificações"
      >
        <Bell size={15} />
        {totalNotifications > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 font-mono text-[9px] font-bold text-white shadow-xs animate-pulse">
            {totalNotifications > 9 ? '9+' : totalNotifications}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 z-50 w-80 rounded-xl border border-black/10 dark:border-white/10 bg-[var(--bg-main)] shadow-xl p-3"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-2.5 mb-2.5">
              <div className="flex items-center gap-2">
                <Bell size={14} className="text-[var(--text-main)]" />
                <h3 className="font-display text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">
                  Notificações
                </h3>
              </div>
              {totalNotifications > 0 && (
                <span className="rounded-full bg-red-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-red-500">
                  {totalNotifications} nova(s)
                </span>
              )}
            </div>

            {/* Content List */}
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {loading ? (
                <p className="p-4 text-center text-xs text-[var(--text-soft)]">Carregando notificações...</p>
              ) : requests.length > 0 || unreadMessages.length > 0 ? (
                <>
                  {/* Friend Requests Section */}
                  {requests.length > 0 && (
                    <div className="space-y-2">
                      <p className="font-mono text-[9px] uppercase tracking-wider text-[var(--text-soft)] font-bold px-1">
                        Convites de Amizade ({requests.length})
                      </p>
                      {requests.map((req) => (
                        <div
                          key={req.id}
                          className="flex items-center justify-between rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-2 transition-colors hover:bg-black/10 dark:hover:bg-white/10"
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            {req.user.avatarUrl ? (
                              <img
                                src={req.user.avatarUrl}
                                alt={req.user.name}
                                className="h-7 w-7 rounded-md object-cover border border-black/10 dark:border-white/15 flex-shrink-0"
                              />
                            ) : (
                              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-[var(--ink-main)] font-display text-[10px] font-bold text-white dark:bg-white dark:text-black">
                                {req.user.name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-semibold text-xs text-[var(--text-main)] truncate">{req.user.name}</p>
                              <p className="text-[9px] text-[var(--text-soft)] truncate">Te enviou um convite</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => handleAccept(req.id)}
                              className="flex h-6 w-6 items-center justify-center rounded bg-emerald-600 text-white hover:opacity-90 transition-opacity"
                              title="Aceitar convite"
                            >
                              <Check size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReject(req.id)}
                              className="flex h-6 w-6 items-center justify-center rounded bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                              title="Recusar convite"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Unread Chat Messages Section */}
                  {unreadMessages.length > 0 && (
                    <div className="space-y-2">
                      <p className="font-mono text-[9px] uppercase tracking-wider text-[var(--text-soft)] font-bold px-1">
                        Novas Mensagens ({unreadMessages.length})
                      </p>
                      {unreadMessages.map((item) => (
                        <div
                          key={item.friendId}
                          className="flex items-center justify-between rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-2 transition-colors hover:bg-black/10 dark:hover:bg-white/10"
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <div className="relative flex-shrink-0">
                              {item.friendAvatarUrl ? (
                                <img
                                  src={item.friendAvatarUrl}
                                  alt={item.friendName}
                                  className="h-7 w-7 rounded-md object-cover border border-black/10 dark:border-white/15"
                                />
                              ) : (
                                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--ink-main)] font-display text-[10px] font-bold text-white dark:bg-white dark:text-black">
                                  {item.friendName.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 font-mono text-[8px] font-bold text-white">
                                {item.unreadCount}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-xs text-[var(--text-main)] truncate">{item.friendName}</p>
                              <p className="text-[10px] text-[var(--text-soft)] truncate font-mono">
                                &quot;{item.lastMessage}&quot;
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleOpenChat(item)}
                            className="inline-flex h-6 items-center gap-1 rounded bg-[var(--ink-main)] px-2 font-mono text-[9px] uppercase tracking-wider text-white dark:bg-white dark:text-black font-medium hover:opacity-90 transition-opacity flex-shrink-0"
                            title="Responder no Chat"
                          >
                            <MessageSquare size={11} />
                            <span>Responder</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center text-xs text-[var(--text-soft)] space-y-1.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5 dark:bg-white/5 text-[var(--text-soft)]">
                    <Sparkles size={16} />
                  </div>
                  <p className="font-medium text-[var(--text-main)]">Nenhuma nova notificação</p>
                  <p className="text-[10px]">Você está em dia com todas as mensagens e convites!</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
