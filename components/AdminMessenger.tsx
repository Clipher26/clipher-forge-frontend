import React, { useEffect, useState, useCallback } from 'react';
import api from '../api';
import { User } from '../types';

interface AdminMessengerProps {
  users?: User[];
  onClose?: () => void;
}

type SentItem = {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  createdAt?: string;
  isRead?: boolean;
};

const AdminMessenger: React.FC<AdminMessengerProps> = ({ users: usersProp }) => {
  const [users, setUsers] = useState<User[]>(Array.isArray(usersProp) ? usersProp : []);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [targetId, setTargetId] = useState('');
  const [targetQuery, setTargetQuery] = useState('');
  const [title, setTitle] = useState('Message from Admin');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'message' | 'system'>('message');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [sent, setSent] = useState<SentItem[]>([]);
  const [loadingSent, setLoadingSent] = useState(false);

  const loadUsers = useCallback(async (search?: string) => {
    setLoadingUsers(true);
    setUsersError('');
    try {
      const q = (typeof search === 'string' ? search : targetQuery).trim();
      const res = await api.get('/api/admin/users', { params: q ? { q } : {} });
      const list = Array.isArray(res.data) ? res.data : [];
      setUsers(list as any);
      setTargetId(prev => (prev && !list.some((u:any)=>u.id===prev) ? '' : prev));
      if (!q && list.length === 0) setUsersError('No users returned from Supabase. Check database records or connection.');
    } catch (e: any) {
      setUsersError(e?.response?.data?.message || e?.message || 'Failed to load users from backend/Supabase');
      setUsers([]);
    } finally { setLoadingUsers(false); }
  }, [targetQuery]);

  useEffect(() => { loadUsers(''); }, []);

  const filteredUsers = users.filter((u) => {
    return true; // list all users from Supabase (including admins)
  });

  // debounce backend search as admin types
  useEffect(() => {
    const q = targetQuery.trim();
    const t = setTimeout(() => { loadUsers(q); }, 350);
    return () => clearTimeout(t);
  }, [targetQuery]);

  const loadSent = useCallback(async () => {
    setLoadingSent(true);
    try {
      const res = await api.get('/api/admin/messages');
      setSent(Array.isArray(res.data) ? res.data : []);
    } catch {
      setSent([]);
    } finally {
      setLoadingSent(false);
    }
  }, []);

  useEffect(() => {
    loadSent();
  }, [loadSent]);

  const handleSend = async () => {
    if (!targetId || !message.trim()) {
      setFeedback({ ok: false, text: 'Select a user and enter a message.' });
      return;
    }
    setSending(true);
    setFeedback(null);
    try {
      const res = await api.post('/api/admin/messages/send', {
        userId: targetId,
        title: title.trim() || 'Message from Admin',
        message: message.trim(),
        type,
      });
      if (res.data?.success) {
        setFeedback({ ok: true, text: 'Message delivered to user notifications.' });
        setMessage('');
        loadSent();
      } else {
        setFeedback({ ok: false, text: res.data?.message || 'Send failed.' });
      }
    } catch (e: any) {
      setFeedback({ ok: false, text: e?.response?.data?.message || 'Send failed.' });
    } finally {
      setSending(false);
    }
  };

  const userName = (id: string) => users.find((u) => u.id === id)?.name || id;

  return (
    <div className="p-4 space-y-6">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
        <div>
          <h3 className="text-white font-black uppercase italic tracking-tighter text-lg">Admin Messenger</h3>
          <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">
            Send push notifications to a user by User ID (rejections, deposit confirmations, custom messages)
          </p>
        </div>

        <div className="grid gap-3">
                    <div>
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Search users (from Supabase)</label>
            <div className="flex gap-2 mt-1">
              <input
                value={targetQuery}
                onChange={(e) => setTargetQuery(e.target.value)}
                placeholder="Search by name, phone, email, or user ID"
                className="flex-1 bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-bybit/40"
              />
              <button onClick={() => loadUsers(targetQuery)} className="px-4 bg-white/10 text-white rounded-xl text-[10px] font-black uppercase">Search</button>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <button onClick={() => { setTargetQuery(''); loadUsers(''); }} className="text-[10px] text-bybit font-black uppercase">{loadingUsers ? 'Loading...' : 'Load all users'}</button>
              <span className="text-[10px] text-gray-500">{filteredUsers.length} user(s) found</span>
            </div>
            {usersError && <p className="text-[10px] text-red-400 mt-1">{usersError}</p>}
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Target User ID (results)</label>
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="mt-1 w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-bybit/40"
            >
              <option value="">{loadingUsers ? 'Loading users...' : (filteredUsers.length ? 'Select a user from search results...' : 'No users found — try another search')}</option>
              {filteredUsers.slice(0, 300).map((u) => (
                <option key={u.id} value={u.id}>
                  {(u as any).name || 'User'}{(u as any).isAdmin ? ' [Admin]' : ''} — {(u as any).email || (u as any).phone || 'no contact'} — {u.id}
                </option>
              ))}
            </select>
            {targetId && <p className="mt-1 text-[10px] text-gray-500 font-mono break-all">Selected User ID: {targetId}</p>}
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-bybit/40"
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="e.g. Your withdrawal was rejected due to insufficient balance. Please try again."
              className="mt-1 w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-bybit/40 resize-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="mt-1 w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-bybit/40"
            >
              <option value="message">Message</option>
              <option value="system">System</option>
            </select>
          </div>
        </div>

        {feedback && (
          <div className={`text-xs font-bold px-3 py-2 rounded-lg ${feedback.ok ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
            {feedback.text}
          </div>
        )}

        <button
          onClick={handleSend}
          disabled={sending}
          className="w-full bg-bybit text-black py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-white transition-all disabled:opacity-50"
        >
          {sending ? 'Sending...' : 'Send Notification'}
        </button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-white font-black uppercase text-xs tracking-widest">Recent Notifications (Audit)</h4>
          <button onClick={loadSent} className="text-[10px] text-bybit font-black uppercase">Refresh</button>
        </div>
        {loadingSent ? (
          <p className="text-gray-500 text-xs">Loading...</p>
        ) : sent.length === 0 ? (
          <p className="text-gray-500 text-xs">No notifications sent yet.</p>
        ) : (
          <div className="space-y-2 max-h-[320px] overflow-y-auto">
            {sent.slice(0, 50).map((n) => (
              <div key={n.id} className="bg-black/30 border border-white/5 rounded-xl p-3">
                <div className="flex justify-between gap-2">
                  <p className="text-white text-xs font-bold truncate">{n.title}</p>
                  <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${n.isRead ? 'bg-white/5 text-gray-500' : 'bg-bybit/20 text-bybit'}`}>
                    {n.isRead ? 'Read' : 'Unread'}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1 line-clamp-2">{n.message}</p>
                <p className="text-[9px] text-gray-600 mt-1">To: {userName(n.userId)} · {n.type}{n.createdAt ? ` · ${new Date(n.createdAt).toLocaleString()}` : ''}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMessenger;
