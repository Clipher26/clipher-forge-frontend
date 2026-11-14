import React, { useEffect, useState, useCallback } from 'react';
import api from '../api';
import { NotificationRecord } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const typeMeta: Record<string, { icon: string; color: string; bg: string }> = {
  message: { icon: 'fa-envelope', color: 'text-blue-600', bg: 'bg-blue-50' },
  withdrawal_rejected: { icon: 'fa-circle-xmark', color: 'text-red-600', bg: 'bg-red-50' },
  withdrawal_success: { icon: 'fa-circle-check', color: 'text-green-600', bg: 'bg-green-50' },
  deposit_success: { icon: 'fa-circle-dollar-to-slot', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  system: { icon: 'fa-bell', color: 'text-amber-600', bg: 'bg-amber-50' },
};

const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose }) => {
  const [items, setItems] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/notifications');
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) load();
  }, [isOpen, load]);

  const markAllRead = async () => {
    try {
      await api.post('/api/notifications/read-all', {});
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {}
  };

  const markOneRead = async (id: string) => {
    try {
      await api.post(`/api/notifications/${id}/read`, {});
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch {}
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-[#f8f9fa] animate-in fade-in duration-200">
      <header className="bg-primary h-14 flex items-center px-4 justify-between shrink-0 shadow-sm">
        <div className="flex items-center">
          <button onClick={onClose} className="text-white p-1">
            <i className="fa-solid fa-arrow-left text-2xl"></i>
          </button>
          <h2 className="ml-4 text-white font-black text-sm tracking-tight uppercase italic">Notifications</h2>
        </div>
        <button
          onClick={markAllRead}
          className="text-white/90 text-[10px] font-black uppercase tracking-wider"
        >
          Mark all read
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-xs font-bold uppercase">Loading...</div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center">
            <i className="fa-regular fa-bell-slash text-4xl text-gray-200 mb-3"></i>
            <p className="text-gray-400 text-xs font-bold uppercase">No notifications yet</p>
          </div>
        ) : (
          items.map((n) => {
            const meta = typeMeta[n.type] || typeMeta.message;
            const ts = n.createdAt ? new Date(n.createdAt).toLocaleString() : '';
            return (
              <button
                key={n.id}
                onClick={() => !n.isRead && markOneRead(n.id)}
                className={`w-full text-left bg-white rounded-2xl p-4 shadow-sm border transition-all ${
                  n.isRead ? 'border-gray-100 opacity-80' : 'border-primary/20 ring-1 ring-primary/10'
                }`}
              >
                <div className="flex gap-3">
                  <div className={`w-10 h-10 rounded-xl ${meta.bg} flex items-center justify-center shrink-0`}>
                    <i className={`fa-solid ${meta.icon} ${meta.color}`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-black ${n.isRead ? 'text-gray-700' : 'text-gray-900'}`}>{n.title}</p>
                      {!n.isRead && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5"></span>}
                    </div>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed whitespace-pre-wrap break-words">{n.message}</p>
                    {ts && <p className="text-[10px] text-gray-400 mt-2 font-medium">{ts}</p>}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default NotificationsModal;
