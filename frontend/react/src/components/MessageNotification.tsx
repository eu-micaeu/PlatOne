import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import '../styles/MessageNotification.css';

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

interface MessageNotificationProps {
  currentUserId?: string;
}

export default function MessageNotification({ currentUserId = '' }: MessageNotificationProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!currentUserId) {
      setUnreadCount(0);
      return;
    }

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

    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 5000);
    return () => clearInterval(interval);
  }, [currentUserId]);

  if (unreadCount === 0) {
    return null;
  }

  return (
    <div className="message-notification">
      <Bell size={14} className="notification-icon" aria-hidden="true" />
      <span className="notification-badge">{unreadCount}</span>
      <span className="notification-text">
        {unreadCount === 1 ? 'Mensagem' : 'Mensagens'} nao lida
        {unreadCount > 1 ? 's' : ''}
      </span>
    </div>
  );
}
