
import React, { useState, useEffect } from 'react';
import api from '../api';
import { User, SignalRecord } from '../types';
import AdminMessenger from './AdminMessenger';
import AdminWithdrawals from './AdminWithdrawals';
import AdminSignalPanel from './AdminSignalPanel';
import AdminInvestments from './AdminInvestments';
import AdminCfMessenger from './AdminCfMessenger';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  onUpdateUser: (userId: string, updates: Partial<User>) => void;
  signals: SignalRecord[];
  totalTaxEarned: number;
  onWithdrawTax: () => void;
  adminWalletAddress: string;
  onUpdateAdminWallet: (address: string) => void;
}

type WithdrawalRow = {
  id: string;
  userId: string;
  amount: string | number;
  address?: string;
  coin?: string;
  chain?: string;
  method?: string;
  ngnAmount?: string | number | null;
  status: string;
  code?: string | null;
  txId?: string | null;
  createdAt?: string;
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  users,
  onUpdateUser,
  signals,
  totalTaxEarned,
  onWithdrawTax,
  adminWalletAddress,
  onUpdateAdminWallet
}) => {
  const [salaryUsers, setSalaryUsers] = useState<any[]>([]);
  const [salaryClaims, setSalaryClaims] = useState<any[]>([]);
  const [salaryForm, setSalaryForm] = useState<Record<string, { amount: string; frequency: string; proofNote: string }>>({});
  const [salaryBusy, setSalaryBusy] = useState<string | null>(null);
  const [salaryMsg, setSalaryMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'USERS' | 'SALARY' | 'INVESTMENT' | 'SIGNALS' | 'WD_AUTH' | 'TREASURY' | 'SESSIONS' | 'MESSAGES' | 'WITHDRAWALS'>('USERS');
  const [isEditingWallet, setIsEditingWallet] = useState(false);
  const [tempWallet, setTempWallet] = useState(adminWalletAddress);
  const [sessions, setSessions] = useState<any[]>([]);
  const [withdrawalAuths, setWithdrawalAuths] = useState<WithdrawalRow[]>([]);
  const [creditUserId, setCreditUserId] = useState('');
  const [creditAmount, setCreditAmount] = useState('');
  const [creditLoading, setCreditLoading] = useState(false);
  const [creditMsg, setCreditMsg] = useState('');
  const [userDetail, setUserDetail] = useState<any | null>(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [createUserLoading, setCreateUserLoading] = useState(false);
  const [newUserData, setNewUserData] = useState({ name: '', email: '', phone: '', role: 'Member' });

  const loadSalary = async () => {
    try {
      const [u, c] = await Promise.all([api.get('/api/admin/users').catch(()=>({data:[]})), api.get('/api/admin/salary/claims').catch(()=>({data:[]}))]);
      setSalaryUsers(Array.isArray(u.data)?u.data.filter((x:any)=>!x.isAdmin):[]);
      setSalaryClaims(Array.isArray(c.data)?c.data:[]);
    } catch {}
  };

  const loadWithdrawalAuths = async () => {
    try {
      const res = await api.get('/api/admin/withdrawals');
      setWithdrawalAuths(Array.isArray(res.data) ? res.data : []);
    } catch {}
  };

  useEffect(() => {
    if (activeTab === 'WD_AUTH' || activeTab === 'WITHDRAWALS') loadWithdrawalAuths();
    if (activeTab === 'SALARY') loadSalary();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'SESSIONS') {
      const fetchSessions = async () => {
        try {
          const res = await fetch('/api/admin/sessions');
          const data = await res.json();
          setSessions(Array.isArray(data) ? data : []);
        } catch (e) {}
      };
      fetchSessions();
    }
  }, [activeTab]);

  if (!isOpen) return null;

  const handleSaveWallet = () => {
    onUpdateAdminWallet(tempWallet);
    setIsEditingWallet(false);
  };

  const [usersList, setUsersList] = useState<any[]>(Array.isArray(users) ? users : []);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const loadAdminUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await api.get('/api/admin/users');
      if (Array.isArray(res.data)) setUsersList(res.data as any);
    } catch {
      setUsersList(Array.isArray(users) ? users : []);
    } finally { setLoadingUsers(false); }
  };
  useEffect(() => { if (activeTab === 'USERS') loadAdminUsers(); }, [activeTab]);
  const handleUserUpdate = async (userId: string, updates: any) => {
    try {
      await api.patch(`/api/users/${userId}`, updates);
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'Failed to update user');
    }
    await loadAdminUsers();
  };
  const handleClearRecharge = async (userId: string) => {
    if (!window.confirm('Clear all recharge history and reset balance?')) return;
    try {
      await api.post(`/api/admin/users/${userId}/clear-recharge`);
      await loadAdminUsers();
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'Failed to clear recharge');
    }
  };

  const handleVipApproval = async (userId: string, approved: boolean) => {
    if (!window.confirm(approved ? 'Approve VIP2-VIP6 access for this user?' : 'Revoke VIP2-VIP6 access for this user?')) return;
    try {
      await api.patch(`/api/admin/users/${userId}/vip-approval`, { approved });
      await loadAdminUsers();
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'Failed to update VIP approval');
    }
  };

  const loadUserDetail = async (userId: string) => {
    try {
      const res = await api.get(`/api/users/${userId}`);
      setUserDetail(res.data);
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to load user detail');
    }
  };

  const handleCreateUser = async () => {
    setCreateUserLoading(true);
    try {
      await api.post('/api/users', newUserData);
      setNewUserData({ name: '', email: '', phone: '', role: 'Member' });
      await loadAdminUsers();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to create user');
    } finally {
      setCreateUserLoading(false);
    }
  };
  const safeUsers = Array.isArray(usersList) && usersList.length ? usersList : (Array.isArray(users) ? users : []);
  const validatedCount = safeUsers.filter(u => u.isValidated).length;

  return (
    <div className="fixed inset-0 z-[120] bg-[#06070a] flex flex-col animate-in slide-in-from-bottom-8 duration-500 overflow-hidden">
      {/* Header */}
      <header className="bg-red-600 h-14 flex items-center px-6 justify-between shrink-0">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Clipher Forge Exchange" className="w-8 h-8 object-contain" />
          <i className="fa-solid fa-terminal text-white text-lg"></i>
          <h1 className="text-white font-black uppercase italic tracking-tighter text-sm">System Admin Control</h1>
        </div>
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar max-w-full">
          <div className="flex bg-black/20 rounded-lg p-1">
            {['USERS', 'SALARY', 'INVESTMENT', 'WITHDRAWALS', 'MESSAGES', 'SIGNALS', 'WD_AUTH', 'TREASURY', 'SESSIONS', 'CF_MESSENGER'].map((tab: any) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white text-red-600' : 'text-white/60'}`}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white shrink-0"><i className="fa-solid fa-power-off text-xl"></i></button>
        </div>
      </header>

      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 p-4 gap-3 bg-white/5 border-b border-white/5 shrink-0 overflow-y-auto max-h-[25vh]">
        {[
          { label: 'Total Nodes', val: safeUsers.length, col: 'text-white' },
          { label: 'Verified ID', val: validatedCount, col: 'text-blue-400' },
          { label: 'Network Extraction', val: `$${safeUsers.reduce((acc, u) => acc + Number(u.balance || 0), 0).toFixed(0)}`, col: 'text-green-500' },
          { label: 'AI Intelligence', val: (signals || []).length, col: 'text-bybit' },
          { label: 'Treasury', val: `$${(totalTaxEarned || 0).toFixed(2)}`, col: 'text-red-500' }
        ].map(s => (
          <div key={s.label} className="bg-black/40 p-3 rounded-xl border border-white/5">
            <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">{s.label}</p>
            <p className={`text-xl font-black italic ${s.col}`}>{s.val}</p>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto bg-[#0a0a0c]">
        {activeTab === 'USERS' && (
          <div className="p-4 overflow-x-auto">
            <div className="flex justify-between items-center mb-4">
              <div>
                <button
                  onClick={() => { setIsCreatingUser(!isCreatingUser); setUserDetail(null); }}
                  className="text-[10px] text-bybit font-black uppercase flex items-center gap-1"
                >
                  <i className="fa-solid fa-plus"></i> Create User
                </button>
              </div>
              {userDetail && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setUserDetail(null)}
                    className="text-[10px] text-gray-400 font-black uppercase"
                  >
                    Close Detail
                  </button>
                </div>
              )}
            </div>
            {userDetail && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
                <h3 className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">User Detail</h3>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div><span className="text-gray-500">Name</span><p className="text-white font-bold">{userDetail.name}</p></div>
                  <div><span className="text-gray-500">Email</span><p className="text-white font-mono">{userDetail.email}</p></div>
                  <div><span className="text-gray-500">Phone</span><p className="text-white font-mono">{userDetail.phone || 'N/A'}</p></div>
                  <div><span className="text-gray-500">Balance</span><p className="text-green-500 font-mono">${Number(userDetail.balance || 0).toFixed(2)}</p></div>
                  <div><span className="text-gray-500">Unlock</span><p className="text-yellow-500 font-mono">${Number(userDetail.unlockBalance || 0).toFixed(2)}</p></div>
                  <div><span className="text-gray-500">Role</span><p className="text-bybit font-bold">{userDetail.role}</p></div>
                </div>
              </div>
            )}
            {isCreatingUser && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
                <h3 className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Create New User</h3>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={newUserData.name}
                    onChange={e => setNewUserData({...newUserData, name: e.target.value})}
                    placeholder="Full Name"
                    className="bg-black border border-white/10 rounded-xl py-3 px-4 text-white outline-none"
                  />
                  <input
                    value={newUserData.email}
                    onChange={e => setNewUserData({...newUserData, email: e.target.value})}
                    placeholder="Email"
                    className="bg-black border border-white/10 rounded-xl py-3 px-4 text-white outline-none"
                  />
                  <input
                    value={newUserData.phone}
                    onChange={e => setNewUserData({...newUserData, phone: e.target.value})}
                    placeholder="Phone"
                    className="bg-black border border-white/10 rounded-xl py-3 px-4 text-white outline-none"
                  />
                  <select
                    value={newUserData.role}
                    onChange={e => setNewUserData({...newUserData, role: e.target.value})}
                    className="bg-black border border-white/10 rounded-xl py-3 px-4 text-white outline-none"
                  >
                    <option value="Member">Member</option>
                    <option value="Admin">Admin</option>
                    <option value="Senior Officer">Senior Officer</option>
                  </select>
                  <button
                    onClick={handleCreateUser}
                    disabled={createUserLoading}
                    className="col-span-2 bg-bybit text-white py-3 rounded-xl font-black uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50"
                  >
                    {createUserLoading ? 'Creating...' : 'Create User'}
                  </button>
                </div>
              </div>
            )}
            {!userDetail && !isCreatingUser && (
              <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="text-[10px] text-gray-500 uppercase font-black tracking-widest border-b border-white/10">
                  <th className="pb-4 pl-2">Operator Node</th>
                  <th className="pb-4">Phone / Device</th>
                  <th className="pb-4">Total Amount</th>
                  <th className="pb-4 text-center">Blocks</th>
                  <th className="pb-4 text-right pr-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {safeUsers.map(user => (
                  <tr key={user.id} className="group hover:bg-white/5">
                    <td className="py-4 pl-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 font-mono text-xs">{user.name.charAt(0)}</div>
                          <div>
                            <p className="text-white font-bold text-xs cursor-pointer hover:underline" onClick={() => loadUserDetail(user.id)}>
                              {user.name}
                            </p>
                          </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <p className="text-[8px] text-gray-500 font-mono">{user.id}</p>
                              <span className={`text-[7px] font-black uppercase px-1 rounded-sm ${user.role === 'Senior Officer' || user.name === 'Akinro John' ? 'bg-gold-gradient text-[#5c4014]' : (user.role === 'Admin' ? 'bg-red-500 text-white' : 'bg-white/10 text-gray-400')}`}>
                                {user.role === 'Senior Officer' || user.name === 'Akinro John' ? 'Senior Operator' : (user.role === 'Admin' ? 'Project Manager' : user.role)}
                              </span>
                              {user.vipApproved ? (
                                <span className="text-[7px] font-black uppercase px-1 rounded-sm bg-green-500/20 text-green-400">VIP Open</span>
                              ) : (
                                <span className="text-[7px] font-black uppercase px-1 rounded-sm bg-gray-500/20 text-gray-500">VIP Locked</span>
                              )}
                            </div>
                        </div>
                      </td>
                    <td className="py-4">
                      <p className="text-white font-mono text-[10px]">{user.phone || 'N/A'}</p>
                      <p className="text-gray-500 text-[8px] uppercase font-bold tracking-tight truncate max-w-[120px]">{user.deviceInfo || 'Unknown Device'}</p>
                    </td>
                    <td className="py-4 font-mono text-xs text-green-500 font-bold">${Number(user.balance || 0).toFixed(2)}</td>
                    <td className="py-4 text-center">
                      <div className="flex gap-1 justify-center">
                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${user.isWithdrawalBlocked ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>WD</span>
                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${user.isTradingBlocked ? 'bg-orange-500/20 text-orange-500' : 'bg-green-500/20 text-green-500'}`}>TR</span>
                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${user.isRechargeBlocked ? 'bg-purple-500/20 text-purple-400' : 'bg-green-500/20 text-green-500'}`}>RC</span>
                        {user.salaryStatus === 'Approved' && <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-500">PAY</span>}
                      </div>
                    </td>
                    <td className="py-4 text-right pr-2">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => handleUserUpdate(user.id, { isWithdrawalBlocked: !user.isWithdrawalBlocked })} className="w-7 h-7 bg-white/5 rounded flex items-center justify-center text-gray-400 hover:text-white" title="Block Withdrawal"><i className="fa-solid fa-money-bill-transfer text-xs"></i></button>
                        <button onClick={() => handleUserUpdate(user.id, { isTradingBlocked: !user.isTradingBlocked })} className="w-7 h-7 bg-white/5 rounded flex items-center justify-center text-gray-400 hover:text-white" title="Block Trading"><i className="fa-solid fa-chart-line text-xs"></i></button>
                        <button onClick={() => handleUserUpdate(user.id, { isRechargeBlocked: !user.isRechargeBlocked })} className="w-7 h-7 bg-white/5 rounded flex items-center justify-center text-gray-400 hover:text-white" title="Block Recharge"><i className="fa-solid fa-indian-rupee-sign text-xs"></i></button>
                        <button onClick={() => { const b = prompt('Set balance:'); if(b) handleUserUpdate(user.id, { balance: parseFloat(b) }) }} className="w-7 h-7 bg-white/5 rounded flex items-center justify-center text-gray-400 hover:text-white" title="Edit Balance"><i className="fa-solid fa-plus text-xs"></i></button>
                        <button onClick={() => handleClearRecharge(user.id)} className="w-7 h-7 bg-white/5 rounded flex items-center justify-center text-red-500/50 hover:text-red-500" title="Clear Recharge"><i className="fa-solid fa-eraser text-xs"></i></button>
                        <button onClick={() => handleVipApproval(user.id, !user.vipApproved)} className="w-7 h-7 bg-white/5 rounded flex items-center justify-center text-gray-400 hover:text-white" title={user.vipApproved ? 'Revoke VIP access' : 'Approve VIP access'}><i className={user.vipApproved ? 'fa-solid fa-lock text-xs' : 'fa-solid fa-lock-open text-xs'}></i></button>
                      </div>
                    </td>
                  </tr>
                ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'SALARY' && (
          <div className="p-4 overflow-x-auto">
            <div className="bg-gradient-to-r from-bybit/20 to-transparent border border-bybit/30 p-6 rounded-2xl mb-6">
               <div className="flex justify-between items-start gap-4">
                 <div>
                   <h3 className="text-white font-black italic text-xl uppercase tracking-tighter mb-2">Commission / Salary Control</h3>
                   <p className="text-xs text-gray-400 font-bold leading-relaxed">Set amount + frequency (daily/weekly/monthly), approve to credit user and store transaction in Supabase. Revoke if proof of work is insufficient (deducts + records + notifies).</p>
                 </div>
                 <button onClick={loadSalary} className="text-[10px] text-bybit font-black uppercase">Refresh</button>
               </div>
               {salaryMsg && <p className="mt-3 text-xs font-bold text-bybit">{salaryMsg}</p>}
            </div>
            <table className="w-full text-left border-collapse min-w-[980px]">
              <thead>
                <tr className="text-[10px] text-gray-500 uppercase font-black tracking-widest border-b border-white/10">
                  <th className="pb-4 pl-2">User</th>
                  <th className="pb-4">Nodes</th>
                  <th className="pb-4">Last Claim</th>
                  <th className="pb-4">Amount (USD)</th>
                  <th className="pb-4">Frequency</th>
                  <th className="pb-4">Proof / Notes</th>
                  <th className="pb-4 pr-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(salaryUsers.length ? salaryUsers : safeUsers.filter((u:any)=>!u.isAdmin)).map((u:any) => {
                  const last = salaryClaims.find(c => c.userId === u.id);
                  const f = salaryForm[u.id] || { amount: '', frequency: 'weekly', proofNote: '' };
                  return (
                    <tr key={u.id} className="hover:bg-white/5 transition-colors align-top">
                      <td className="py-4 pl-2">
                        <p className="text-white font-bold text-xs">{u.name || u.id}</p>
                        <p className="text-[9px] text-gray-500 font-mono break-all">{u.email || u.phone || u.id}</p>
                      </td>
                      <td className="py-4"><span className="text-xs font-black text-bybit italic">{u.rechargedReferrals || 0}</span></td>
                      <td className="py-4">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${last?.status==='Approved'?'bg-green-500/20 text-green-400':last?.status==='Revoked'?'bg-red-500/20 text-red-400':'bg-white/5 text-gray-400'}`}>
                          {last?.status || u.salaryStatus || 'Pending'}{last?.frequency ? ` • ${last.frequency}` : ''}{last?.amount ? ` • $${Number(last.amount).toFixed(2)}` : ''}
                        </span>
                        {last?.revokeReason && <p className="text-[9px] text-red-400 mt-1 max-w-[220px]">Reason: {last.revokeReason}</p>}
                      </td>
                      <td className="py-4"><input value={f.amount} onChange={e=>setSalaryForm(p=>({...p,[u.id]:{...f,amount:e.target.value}}))} placeholder="0.00" className="w-24 bg-black/40 border border-white/10 rounded px-2 py-2 text-xs text-white" /></td>
                      <td className="py-4"><select value={f.frequency} onChange={e=>setSalaryForm(p=>({...p,[u.id]:{...f,frequency:e.target.value}}))} className="bg-black/40 border border-white/10 rounded px-2 py-2 text-xs text-white"><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></td>
                      <td className="py-4"><input value={f.proofNote} onChange={e=>setSalaryForm(p=>({...p,[u.id]:{...f,proofNote:e.target.value}}))} placeholder="Proof of work / notes" className="w-56 bg-black/40 border border-white/10 rounded px-2 py-2 text-xs text-white" /></td>
                      <td className="py-4 pr-2 text-right space-x-2 whitespace-nowrap">
                        <button disabled={salaryBusy===u.id} onClick={async()=>{ const amt=Number(f.amount); if(!amt||amt<=0){setSalaryMsg('Enter a valid commission amount');return;} setSalaryBusy(u.id); setSalaryMsg(''); try{ await api.post('/api/admin/salary/approve',{userId:u.id,amount:amt,frequency:f.frequency,proofNote:f.proofNote}); setSalaryMsg(`Approved $${amt.toFixed(2)} ${f.frequency} for ${u.name||u.id}. Credited + transaction recorded.`); await loadSalary(); }catch(e:any){ setSalaryMsg(e?.response?.data?.message||'Approve failed'); } finally{ setSalaryBusy(null);} }} className="px-3 py-1.5 bg-blue-600 text-white rounded text-[9px] font-black uppercase hover:bg-blue-500 disabled:opacity-50">Approve</button>
                        <button disabled={salaryBusy===u.id} onClick={async()=>{ const reason=window.prompt('Reason for revoking (proof of work issue)?')||'Proof of work issues'; const amt=Number(f.amount || last?.amount || 0); setSalaryBusy(u.id); setSalaryMsg(''); try{ await api.post('/api/admin/salary/revoke',{userId:u.id,claimId:last?.id,amount:amt||undefined,reason}); setSalaryMsg(`Revoked commission for ${u.name||u.id}. Deducted + recorded.`); await loadSalary(); }catch(e:any){ setSalaryMsg(e?.response?.data?.message||'Revoke failed'); } finally{ setSalaryBusy(null);} }} className="px-3 py-1.5 bg-red-600/20 text-red-400 rounded text-[9px] font-black uppercase hover:bg-red-600 hover:text-white disabled:opacity-50">Revoke</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {(salaryUsers.length===0 && safeUsers.filter((u:any)=>!u.isAdmin).length===0) && <p className="text-xs text-gray-500 mt-4">No users loaded.</p>}
          </div>
        )}

        {activeTab === 'INVESTMENT' && (
          <AdminInvestments />
        )}

        {activeTab === 'SIGNALS' && (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="p-6 border-b border-white/5 bg-white/5">
              <h2 className="text-white font-black uppercase italic tracking-tighter">Admin Daily Signal</h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Bybit symbols • 6:00–7:00 PM WAT only • one signal/day • expires in 10 minutes</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <AdminSignalPanel onCreated={() => {}} />
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <p className="text-[10px] text-gray-400 font-black uppercase mb-3">Recent Active Signals</p>
                {(!signals || signals.length === 0) ? (
                  <p className="text-xs text-gray-500">No active signals.</p>
                ) : signals.map(signal => (
                  <div key={signal.id} className="py-3 border-b border-white/5 last:border-0 flex items-center justify-between text-xs">
                    <div className="text-white font-bold">{signal.symbol} <span className={signal.direction==='CALL'?'text-positive':'text-negative'}>{signal.direction}</span> • {String(signal.period||'').toUpperCase()} • {signal.yield}</div>
                    <div className="text-gray-500">{signal.expiresAt ? `Expires ${new Date(signal.expiresAt).toLocaleTimeString()}` : signal.time}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'TREASURY' && (
          <div className="p-6 max-w-2xl mx-auto space-y-6">
            <div className="bg-gradient-to-br from-red-600/20 to-black border border-red-500/30 rounded-3xl p-8 text-center relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10"><i className="fa-solid fa-vault text-6xl text-white"></i></div>
               <p className="text-[10px] text-red-500 font-black uppercase tracking-[0.3em] mb-4">Accumulated Tax Revenue</p>
               <h3 className="text-6xl font-black text-white italic tracking-tighter mb-2">${(totalTaxEarned || 0).toFixed(2)}</h3>
               <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">USDT (TRC-20)</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center"><p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Global Admin Withdrawal Wallet</p>{!isEditingWallet ? <button onClick={() => { setTempWallet(adminWalletAddress); setIsEditingWallet(true); }} className="text-[10px] text-bybit font-black uppercase tracking-widest">Edit</button> : <button onClick={handleSaveWallet} className="text-[10px] text-green-500 font-black uppercase tracking-widest">Save</button>}</div>
              {isEditingWallet ? <input type="text" value={tempWallet} onChange={(e) => setTempWallet(e.target.value)} className="w-full bg-black border border-bybit/30 rounded-xl py-4 px-6 text-white font-mono text-xs outline-none" placeholder="T..." /> : <div className="bg-black/50 border border-white/5 rounded-xl py-4 px-6 flex items-center justify-between"><code className="text-white font-mono text-xs">{adminWalletAddress || 'UNSET'}</code><i className="fa-solid fa-lock text-gray-700"></i></div>}
            </div>
            <button onClick={onWithdrawTax} className="w-full bg-red-600 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg hover:bg-white hover:text-red-600 transition-all active:scale-95">Liquify All Revenue</button>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 mt-6">
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Manual Deposit Credit (Admin)</p>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  value={creditUserId}
                  onChange={e => setCreditUserId(e.target.value)}
                  placeholder="User ID"
                  className="col-span-2 bg-black border border-white/10 rounded-xl py-4 px-6 text-white outline-none"
                />
                <input
                  type="number"
                  value={creditAmount}
                  onChange={e => setCreditAmount(e.target.value)}
                  placeholder="Amount (USDT)"
                  className="bg-black border border-white/10 rounded-xl py-4 px-6 text-white outline-none"
                />
                <button
                  onClick={async () => {
                    if (!creditUserId || !creditAmount || Number(creditAmount) <= 0) { setCreditMsg('Enter valid user ID and amount'); return; }
                    setCreditLoading(true);
                    setCreditMsg('');
                    try {
                      await api.post('/api/recharge/credit', { userId: creditUserId, amount: Number(creditAmount) });
                      setCreditMsg(`Credited $${Number(creditAmount).toFixed(2)} to user ${creditUserId}`);
                      setCreditUserId(''); setCreditAmount('');
                    } catch (e: any) {
                      setCreditMsg(e?.response?.data?.message || 'Credit failed');
                    } finally {
                      setCreditLoading(false);
                    }
                  }}
                  disabled={creditLoading}
                  className="col-span-2 bg-bybit text-white py-4 rounded-xl font-black uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50"
                >
                  {creditLoading ? 'Crediting...' : 'Credit Deposit'}
                </button>
                {creditMsg && <p className={`col-span-2 text-[10px] font-bold text-center ${creditMsg.startsWith('Credited') ? 'text-bybit' : 'text-red-400'}`}>{creditMsg}</p>}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'WITHDRAWALS' && (
          <AdminWithdrawals users={safeUsers} />
        )}

        {activeTab === 'MESSAGES' && (
          <AdminMessenger />
        )}

        {activeTab === 'CF_MESSENGER' && (
          <AdminCfMessenger />
        )}

        {activeTab === 'WD_AUTH' && (
          <div className="p-4 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="text-[10px] text-gray-500 uppercase font-black tracking-widest border-b border-white/10">
                  <th className="pb-4 pl-2">Operator Node</th>
                  <th className="pb-4">Withdraw Amount</th>
                  <th className="pb-4">Auth Code</th>
                  <th className="pb-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {withdrawalAuths.map((w) => {
                  const st = String(w.status || '').toLowerCase();
                  const u = safeUsers.find(x => x.id === w.userId);
                  return (
                    <tr key={w.id} className="group hover:bg-white/5">
                      <td className="py-4 pl-2">
                        <p className="text-white font-bold text-xs">{u?.name || w.userId}</p>
                        <p className="text-[8px] text-gray-500 font-mono">{w.userId}</p>
                      </td>
                      <td className="py-4 font-mono text-xs text-green-500 font-bold">${Number(w.amount).toFixed(2)}</td>
                      <td className="py-4">
                        <code className="text-[10px] font-mono text-bybit">{w.code || '-'}</code>
                      </td>
                      <td className="py-4">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                          st === 'completed' || st === 'approved' ? 'bg-green-500/10 text-green-500' :
                          st === 'rejected' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'
                        }`}>{w.status}</span>
                      </td>
                    </tr>
                  );
                })}
                {withdrawalAuths.length === 0 && (
                  <tr><td colSpan={4} className="py-6 text-center text-gray-500 text-xs">No withdrawal auth requests.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {activeTab === 'SESSIONS' && (
          <div className="p-4 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="text-[10px] text-gray-500 uppercase font-black tracking-widest border-b border-white/10">
                  <th className="pb-4 pl-2">User ID</th>
                  <th className="pb-4">IP Address</th>
                  <th className="pb-4">Device</th>
                  <th className="pb-4">Last Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sessions.map(s => (
                  <tr key={s.id} className="group hover:bg-white/5">
                    <td className="py-4 pl-2 text-white text-xs">{s.userId}</td>
                    <td className="py-4 text-white text-xs font-mono">{s.ipAddress}</td>
                    <td className="py-4 text-white text-xs">{s.deviceType}</td>
                    <td className="py-4 text-white text-xs">{new Date(s.lastActive).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <footer className="p-4 bg-black border-t border-white/5 text-center shrink-0">
        <p className="text-[8px] text-gray-600 font-black uppercase tracking-[0.5em]">Forge Global Management System v1.1.0</p>
      </footer>
    </div>
  );
};

export default AdminDashboard;
