import React, { useState, useEffect } from 'react';
import api from '../api';

interface Props { users?: any[] }

const AdminInvestments: React.FC<Props> = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/api/admin/investments');
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load investments');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const act = async (id: string, action: 'suspend'|'resume'|'freeze'|'remove') => {
    const label = action === 'remove' ? 'remove this VIP and unfreeze funds' : `${action} this VIP`;
    if (!window.confirm(`Confirm: ${label}?`)) return;
    setBusy(id + ':' + action);
    try {
      await api.patch(`/api/admin/investments/${id}`, { action });
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'Action failed');
    } finally { setBusy(null); }
  };

  const filtered = items.filter(i => {
    const q = filter.trim().toLowerCase();
    if (!q) return true;
    return [i.userName, i.userEmail, i.userPhone, i.userId, i.tierName, i.status].some(v => String(v||'').toLowerCase().includes(q));
  });

  const statusCls = (s: string) => {
    const v = String(s||'').toLowerCase();
    if (v === 'active') return 'bg-green-500/10 text-green-500';
    if (v === 'suspended') return 'bg-yellow-500/10 text-yellow-500';
    if (v === 'frozen') return 'bg-blue-500/10 text-blue-400';
    if (v === 'cancelled' || v === 'removed') return 'bg-red-500/10 text-red-500';
    return 'bg-gray-500/10 text-gray-400';
  };

  return (
    <div className="p-4 overflow-x-auto">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h3 className="text-white font-black uppercase italic tracking-tighter text-sm">VIP Investments</h3>
          <p className="text-[10px] text-gray-500">Manage user VIP tiers, suspend daily payouts, freeze or remove VIP (Supabase-backed).</p>
        </div>
        <div className="flex items-center gap-2">
          <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Search user/tier/status" className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none" />
          <button onClick={load} className="px-3 py-2 bg-white/10 text-white rounded-lg text-[10px] font-black uppercase">{loading ? 'Loading...' : 'Refresh'}</button>
        </div>
      </div>
      {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
      <table className="w-full text-left border-collapse min-w-[900px]">
        <thead>
          <tr className="text-[10px] text-gray-500 uppercase font-black tracking-widest border-b border-white/10">
            <th className="pb-3 pl-2">User</th>
            <th className="pb-3">Tier</th>
            <th className="pb-3">Frozen/Price</th>
            <th className="pb-3">Daily</th>
            <th className="pb-3">Earned</th>
            <th className="pb-3">Last Payout</th>
            <th className="pb-3">Status</th>
            <th className="pb-3 text-right pr-2">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {filtered.map(inv => {
            const st = String(inv.status||'').toLowerCase();
            const isActive = st === 'active';
            const isCancelled = st === 'cancelled' || st === 'removed';
            return (
              <tr key={inv.id} className="group hover:bg-white/5">
                <td className="py-3 pl-2">
                  <p className="text-white font-bold text-xs">{inv.userName || inv.userId}</p>
                  <p className="text-[8px] text-gray-500 font-mono">{inv.userEmail || inv.userPhone || inv.userId}</p>
                </td>
                <td className="py-3 text-white text-xs font-bold">{inv.tierName || `VIP${inv.tierLevel}`}</td>
                <td className="py-3 text-xs text-gray-300">${Number(inv.price||0).toFixed(2)}</td>
                <td className="py-3 text-xs text-green-400 font-bold">${Number(inv.dailyEarning||0).toFixed(2)}/day</td>
                <td className="py-3 text-xs text-blue-400 font-bold">${Number(inv.totalEarned||0).toFixed(2)}</td>
                <td className="py-3 text-[10px] text-gray-400">{inv.lastPayout ? new Date(inv.lastPayout).toLocaleString() : '-'}</td>
                <td className="py-3"><span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${statusCls(inv.status)}`}>{inv.status || 'Unknown'}</span></td>
                <td className="py-3 text-right pr-2">
                  <div className="flex justify-end gap-1 flex-wrap">
                    {isActive ? (
                      <button disabled={busy!=null} onClick={()=>act(inv.id,'suspend')} className="px-2 py-1 bg-yellow-600/20 text-yellow-400 rounded text-[9px] font-black uppercase hover:bg-yellow-600 hover:text-white disabled:opacity-40">Suspend Payout</button>
                    ) : !isCancelled ? (
                      <button disabled={busy!=null} onClick={()=>act(inv.id,'resume')} className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-[9px] font-black uppercase hover:bg-green-600 hover:text-white disabled:opacity-40">Resume</button>
                    ) : null}
                    {!isCancelled && st !== 'frozen' && <button disabled={busy!=null} onClick={()=>act(inv.id,'freeze')} className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-[9px] font-black uppercase hover:bg-blue-600 hover:text-white disabled:opacity-40">Freeze</button>}
                    {!isCancelled && <button disabled={busy!=null} onClick={()=>act(inv.id,'remove')} className="px-2 py-1 bg-red-600/20 text-red-400 rounded text-[9px] font-black uppercase hover:bg-red-600 hover:text-white disabled:opacity-40">Remove VIP</button>}
                  </div>
                </td>
              </tr>
            );
          })}
          {filtered.length === 0 && !loading && (
            <tr><td colSpan={8} className="py-8 text-center text-gray-500 text-xs">No VIP investments found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AdminInvestments;
