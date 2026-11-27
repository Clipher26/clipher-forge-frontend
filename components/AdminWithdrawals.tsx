import React, { useEffect, useState, useCallback } from 'react';
import api from '../api';
import { User } from '../types';

interface AdminWithdrawalsProps {
  users: User[];
}

type WR = {
  id: string;
  userId: string;
  userName?: string | null;
  userEmail?: string | null;
  userPhone?: string | null;
  amount: string | number;
  address?: string;
  coin?: string;
  chain?: string;
  method?: string;
  ngnAmount?: string | number | null;
  status: string;
  txId?: string | null;
  createdAt?: string;
};

const AdminWithdrawals: React.FC<AdminWithdrawalsProps> = ({ users }) => {
  const [items, setItems] = useState<WR[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const userName = (w: WR) => w.userName || users.find((u) => u.id === w.userId)?.name || w.userId || 'Unknown user';
  const userPhone = (w: WR) => w.userPhone || (users.find((u) => u.id === w.userId) as any)?.phone || w.userId;
  const formatDate = (value?: string) => {
    if (!value) return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString();
  };

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/admin/withdrawals', { params: { _t: Date.now() } });
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load withdrawals (admin auth required).');
      if (!silent) setItems([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = window.setInterval(() => load(true), 15000);
    return () => window.clearInterval(interval);
  }, [load]);

  const act = async (id: string, status: 'Completed' | 'Rejected') => {
    let reason: string | undefined;
    let txId: string | undefined;
    if (status === 'Rejected') {
      reason = window.prompt('Rejection reason (sent to user):') || undefined;
    } else {
      txId = window.prompt('Optional TX/reference ID:') || undefined;
    }
    setBusy(id);
    try {
      await api.post(`/api/admin/withdrawals/${id}/status`, { status, reason, txId });
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Action failed.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-black uppercase italic tracking-tighter text-lg">Withdrawal Requests</h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">
              Approve or reject — users are notified automatically (rejections refund balance)
            </p>
          </div>
          <button onClick={() => load()} className="text-[10px] text-bybit font-black uppercase">Refresh</button>
        </div>
        {error && <p className="mt-3 text-xs text-red-400 font-bold">{error}</p>}
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <p className="text-gray-500 text-xs p-4">Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-gray-500 text-xs p-4">No withdrawal requests.</p>
        ) : (
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="text-[10px] text-gray-500 uppercase font-black tracking-widest border-b border-white/10">
                <th className="pb-3 pl-2">User</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Method / Destination</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Time</th>
                <th className="pb-3 text-right pr-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {items.map((w) => {
                const st = String(w.status || '').toLowerCase();
                const pending = st === 'pending';
                return (
                  <tr key={w.id} className="hover:bg-white/5">
                    <td className="py-3 pl-2">
                      <p className="text-white font-bold text-xs">{userName(w)}</p>
                      <p className="text-[8px] text-gray-500 font-mono">{userPhone(w)}</p>
                    </td>
                    <td className="py-3 text-green-500 font-mono text-xs font-bold">${Number(w.amount).toFixed(2)}</td>
                    <td className="py-3">
                      <p className="text-white text-[10px] font-bold">{w.method || w.coin || 'USDT'} {w.chain ? `· ${w.chain}` : ''}</p>
                      <div className="flex items-center gap-1">
                        <p className="text-gray-500 text-[9px] font-mono truncate max-w-[200px]">{w.address || '-'}</p>
                        {w.address && (
                          <button
                            type="button"
                            title="Copy wallet address"
                            onClick={() => { try { navigator.clipboard?.writeText(String(w.address)); } catch {} }}
                            className="text-gray-500 hover:text-primary text-[9px]"
                          >
                            <i className="fa-regular fa-copy"></i>
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                        st === 'completed' || st === 'approved' ? 'bg-green-500/10 text-green-500' :
                        st === 'rejected' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'
                      }`}>{w.status}</span>
                    </td>
                    <td className="py-3 text-[10px] text-gray-500">{formatDate(w.createdAt)}</td>
                    <td className="py-3 text-right pr-2">
                      {pending ? (
                        <div className="flex justify-end gap-2">
                          <button
                            disabled={busy === w.id}
                            onClick={() => act(w.id, 'Completed')}
                            className="px-3 py-1.5 bg-green-600/20 text-green-500 rounded text-[9px] font-black uppercase hover:bg-green-600 hover:text-white disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            disabled={busy === w.id}
                            onClick={() => act(w.id, 'Rejected')}
                            className="px-3 py-1.5 bg-red-600/20 text-red-500 rounded text-[9px] font-black uppercase hover:bg-red-600 hover:text-white disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[9px] text-gray-600 uppercase font-black">Done</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminWithdrawals;
