import React, { useState, useEffect, useCallback } from 'react';
import api from './api';
import { getSupabase } from './supabase';
import { TickerData, User, TransactionRecord, TradeRecord, SignalRecord } from './types';
import PrivacyPolicy from './components/PrivacyPolicy';
import RefundPolicy from './components/RefundPolicy';
import SignUpPage from './components/SignUpPage';
import RechargeModal from './components/RechargeModal';
import WithdrawalModal from './components/WithdrawalModal';
import WithdrawalMethodModal from './components/WithdrawalMethodModal';
import AssetModal from './components/AssetModal';
import ReferModal from './components/ReferModal';
import ProfileModal from './components/ProfileModal';
import TradeView from './components/TradeView';
import InvestmentView from './components/InvestmentView';
import LoginPage from './components/LoginPage';
import AdminDashboard from './components/AdminDashboard';
import ServiceModal from './components/ServiceModal';
import AboutModal from './components/AboutModal';
import ContractOrderModal from './components/ContractOrderModal';
import WithdrawRecordModal from './components/WithdrawRecordModal';
import RechargeRecordModal from './components/RechargeRecordModal';
import TeamView from './components/TeamView';
import FinancialView from './components/FinancialView';
import SalaryModal from './components/SalaryModal';
import AppDownloadModal from './components/AppDownloadModal';
import NotificationsModal from './components/NotificationsModal';
import SettingsModal from './components/SettingsModal';
import PasswordModal from './components/PasswordModal';

type AppView = 'home' | 'team' | 'financial' | 'assets' | 'mine' | 'trade' | 'admin' | 'investment' | 'login' | 'signup' | 'privacy' | 'refund';

const getInitialView = (): AppView => {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get('ref');
  if (ref) {
    sessionStorage.setItem('referralCode', ref);
    window.history.replaceState({}, '', '/');
    return 'signup';
  }
  if (window.location.pathname === '/join') {
    window.history.replaceState({}, '', '/');
    const savedRef = sessionStorage.getItem('referralCode');
    if (savedRef) return 'signup';
  }
  return 'home';
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(getInitialView);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTCUSDT');
  const [tickers, setTickers] = useState<TickerData[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [isWithdrawalMethodModalOpen, setIsWithdrawalMethodModalOpen] = useState(false);
  const [isReferModalOpen, setIsReferModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isContractOrderModalOpen, setIsContractOrderModalOpen] = useState(false);
  const [isWithdrawRecordModalOpen, setIsWithdrawRecordModalOpen] = useState(false);
  const [isRechargeRecordModalOpen, setIsRechargeRecordModalOpen] = useState(false);
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [isAppDownloadModalOpen, setIsAppDownloadModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [policyView, setPolicyView] = useState<'none' | 'privacy' | 'refund'>('none');

  const [activeSignal, setActiveSignal] = useState<any>(null);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [tradeRecords, setTradeRecords] = useState<TradeRecord[]>([]);
  const [totalTaxEarned, setTotalTaxEarned] = useState<number>(0);
  const [adminWalletAddress, setAdminWalletAddress] = useState<string>('');
  const [signals, setSignals] = useState<SignalRecord[]>([]);

  const applyUser = useCallback((u: any | null) => {
    if (!u) { setUser(null); return; }
    setUser({ ...u, balance: Number(u.balance) || 0 } as User);
  }, []);

  const refreshMe = useCallback(async () => {
    try {
      const res = await api.get('/api/auth/me');
      if (res.data) applyUser(res.data);
    } catch {
      applyUser(null);
    }
  }, [applyUser]);

  useEffect(() => {
    if (user) { refreshUser(); loadTradesAndTransactions(); }
  }, [user?.id]);

  useEffect(() => {
    // Bootstrap session via Supabase (persisted) -> backend profile
    (async () => {
      try {
        const { data } = await getSupabase().auth.getSession();
        if (data.session) await refreshMe();
      } catch {}
    })();
    const { data: sub } = getSupabase().auth.onAuthStateChange((_evt, session) => {
      if (session) refreshMe();
      else applyUser(null);
    });

    const fetchUsers = async () => {
      try {
        const res = await api.get('/api/users');
        const users = Array.isArray(res.data) ? res.data : [];
        setAllUsers(users);
        localStorage.setItem('cf_all_users', JSON.stringify(users));
      } catch {
        const saved = localStorage.getItem('cf_all_users');
        if (saved) setAllUsers(JSON.parse(saved));
      }
    };
    fetchUsers();
    loadTradesAndTransactions();
    const interval = setInterval(() => {
      fetchUsers();
      loadTradesAndTransactions();
    }, 15000);
    return () => { clearInterval(interval); sub.subscription.unsubscribe(); };
  }, [applyUser, refreshMe]);

  useEffect(() => {
    const onUserUpdated = (ev: CustomEvent) => {
      const updated = ev.detail as any;
      if (!updated || !updated.id) return;
      applyUser(updated);
      setAllUsers(prev => (Array.isArray(prev) ? prev : []).map(u => u.id === updated.id ? updated : u));
    };
    window.addEventListener('cf:user-updated', onUserUpdated as EventListener);
    return () => window.removeEventListener('cf:user-updated', onUserUpdated as EventListener);
  }, [applyUser]);

  // Load live Bybit market data for home/financial/trade views instead of mock data.
  useEffect(() => {
    let mounted = true;
    const loadTickers = async () => {
      try {
        const res = await api.get('/api/tickers');
        const list: any = res.data?.data || [];
        if (mounted) {
          setTickers(list.map((t: any) => ({
            symbol: t.symbol,
            lastPrice: String(t.lastPrice || '0'),
            prevPrice24h: String(t.prevPrice24h || '0'),
            turnover24h: String(t.turnover24h || '0'),
            volume24h: String(t.volume24h || '0'),
            highPrice24h: String(t.highPrice24h || '0'),
            lowPrice24h: String(t.lowPrice24h || '0'),
          })));
        }
      } catch {
        // Silently fall back to empty; UI shows empty state until data loads.
      }
    };
    loadTickers();
    const interval = setInterval(loadTickers, 30000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  const handleUpdateUserList = async (userId: string, updates: Partial<User>) => {
    try {
      const res = await api.patch(`/api/users/${userId}`, updates);
      const updatedUser = res.data;
      setAllUsers(prev => (Array.isArray(prev) ? prev : []).map(u => u.id === userId ? updatedUser : u));
      if (user?.id === userId) applyUser(updatedUser);
    } catch (e) {
      console.error("Failed to update user", e);
      setAllUsers(prev => (Array.isArray(prev) ? prev : []).map(u => u.id === userId ? { ...u, ...updates } : u));
      if (user?.id === userId) setUser(prev => prev ? { ...prev, ...updates } as User : null);
    }
  };

  const refreshUser = async () => {
    if (!user?.id) return;
    try {
      const me = await api.get('/api/auth/me');
      applyUser({ ...me.data, balance: Number(me.data?.balance) || 0 } as User);
    } catch {}
  };

  const loadTradesAndTransactions = async () => {
    try {
      const [tr, tx, sg] = await Promise.all([
        api.get('/api/trades').catch(()=>({data:[]})),
        api.get('/api/transactions').catch(()=>({data:[]})),
        api.get('/api/signals').catch(()=>({data:[]})),
      ]);
      setTradeRecords(Array.isArray(tr.data) ? tr.data : []);
      setTransactions(Array.isArray(tx.data) ? tx.data : []);
      setActiveSignal(Array.isArray(sg.data) && sg.data[0] ? sg.data[0] : null);
    } catch {}
  };

  const handlePlaceTrade = async (symbol: string, direction: 'CALL' | 'PUT', amount: number, _entryPriceStr: string, yieldRate: number, periodLabel: string, signalId?: string) => {
    if (!user) { setCurrentView('login'); return; }
    try {
      const response = await api.post('/api/order', { symbol, direction, amount, period: periodLabel, signalId });
      if (response.data.success) {
        try { const me = await api.get('/api/auth/me'); applyUser({ ...me.data, balance: Number(me.data?.balance) || 0 } as User); } catch {}
        await loadTradesAndTransactions();
        const delayMs = parseInt(periodLabel.split(' ')[0]) * 1000;
        setTimeout(async () => {
          try { const me = await api.get('/api/auth/me'); applyUser({ ...me.data, balance: Number(me.data?.balance) || 0 } as User); } catch {}
          await loadTradesAndTransactions();
        }, delayMs + 1500);
      }
    } catch (error: any) { alert(error?.response?.data?.message || 'Trade failed'); }
  };

  const handleWithdrawTax = async () => {
    if (totalTaxEarned <= 0) return;
    try {
      const res = await api.post('/api/admin/tax/withdraw', {
        amount: totalTaxEarned,
        walletAddress: adminWalletAddress || undefined,
      });
      if (res.data.success) {
        alert(`Tax revenue of $${totalTaxEarned.toFixed(2)} has been successfully withdrawn to your admin wallet.`);
        setTotalTaxEarned(0);
      } else {
        alert(res.data.message || 'Tax withdrawal failed.');
      }
    } catch (e: any) {
      alert(e.response?.data?.message || 'Tax withdrawal failed. Please try again.');
    }
  };

  const handleProfileNavigation = (viewId: string) => {
    switch (viewId) {
      case 'orders': setIsContractOrderModalOpen(true); break;
      case 'recharge_rec': setIsRechargeRecordModalOpen(true); break;
      case 'withdraw_rec': setIsWithdrawRecordModalOpen(true); break;
      case 'withdraw_method': setIsWithdrawalMethodModalOpen(true); break;
      case 'about': setIsAboutModalOpen(true); break;
      case 'password': setIsPasswordModalOpen(true); break;
      case 'settings': setIsSettingsModalOpen(true); break;
      case 'admin': setCurrentView('admin'); break;
      case 'investment': setCurrentView('investment'); break;
      case 'notifications': setIsNotificationsModalOpen(true); break;
      default: break;
    }
  };

  const handleAuthenticatedView = (view: AppView) => {
    if (!user) { setCurrentView('login'); return; }
    setCurrentView(view);
  };

  const handleLogout = async () => {
    try { await getSupabase().auth.signOut(); } catch {}
    try { await api.post('/api/auth/logout', {}); } catch {}
    setUser(null);
    setCurrentView('home');
  };

  const handleSignUpSuccess = (u: User) => {
    applyUser(u);
    setCurrentView('home');
  };

  const handleLoginSuccess = (u: User) => {
    applyUser(u);
    setCurrentView((u as any).isAdmin ? 'admin' : 'home');
  };

  if (currentView === 'signup') return <SignUpPage onBack={() => setCurrentView('login')} onSuccess={handleSignUpSuccess} onViewPrivacy={() => setCurrentView('privacy')} onViewRefund={() => setCurrentView('refund')} />;
  if (currentView === 'privacy') return <PrivacyPolicy onBack={() => setCurrentView('signup')} />;
  if (currentView === 'refund') return <RefundPolicy onBack={() => setCurrentView('signup')} />;
  if (currentView === 'login') return <LoginPage onBack={() => setCurrentView('home')} onLoginSuccess={handleLoginSuccess} onSignUpClick={() => setCurrentView('signup')} onForgetPassword={() => setIsServiceModalOpen(true)} />;

  return (
    <div className="flex flex-col min-h-screen bg-white max-w-md mx-auto relative shadow-xl">
      {user?.isAdmin && currentView === 'admin' && (
        <AdminDashboard
          isOpen={true}
          onClose={() => setCurrentView('home')}
          users={allUsers}
          onUpdateUser={handleUpdateUserList}
          signals={signals}
          totalTaxEarned={totalTaxEarned}
          onWithdrawTax={handleWithdrawTax}
          adminWalletAddress={adminWalletAddress}
          onUpdateAdminWallet={setAdminWalletAddress}
        />
      )}

      {currentView === 'home' && (
        <header className="bg-primary h-12 flex items-center px-4 justify-between sticky top-0 z-50 shadow-sm">
          <button onClick={() => { if (!user) setCurrentView('login'); else setCurrentView('mine'); }} className="flex items-center gap-2">
            {!user ? <span className="text-white text-xs font-bold uppercase">Sign in / Sign up</span> : <span className="text-white text-xs font-bold uppercase">Profile</span>}
          </button>
          <div className="flex items-center gap-2"><i className="fa-solid fa-globe text-white text-lg"></i></div>
        </header>
      )}

      {currentView === 'home' && (
        <div className="flex-1 animate-in fade-in duration-300">
          <div className="bg-white px-4 py-8 border-b border-gray-100 flex items-center justify-center gap-5">
            <div className="relative w-16 h-16 shrink-0"><img src="/logo.png" alt="Clipher Forge Exchange" className="w-16 h-16 object-contain" /></div>
            <div className="flex flex-col">
              <h1 className="text-3xl font-black text-gray-900 tracking-tighter italic leading-none">CLIPHER FORGE</h1>
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.5em] mt-1.5 opacity-90">GLOBAL EXCHANGE</p>
            </div>
          </div>
          <div className="ticker-scroll flex items-center px-4 border-b border-gray-50 bg-[#fffbeb]">
            <i className="fa-solid fa-bullhorn text-primary mr-2 text-xs"></i>
            <p>Welcome to Clipher Forge Global. Clipher Forge Global was registered in London, UK in 2024. The company full name is: CLIPHER FORGE GLOBAL EXCHANGE LTD.</p>
          </div>
          <section className="grid grid-cols-5 py-6 px-2 bg-white border-b border-gray-50">
            {[
              { icon: 'fa-indian-rupee-sign', label: 'Recharge', action: () => handleAuthenticatedView('assets'), color: 'text-orange-500' },
              { icon: 'fa-money-bills', label: 'Withdraw', action: () => handleAuthenticatedView('assets'), color: 'text-purple-600' },
              { icon: 'fa-cube', label: 'APP', action: () => setIsAppDownloadModalOpen(true), color: 'text-purple-400' },
              { icon: 'fa-share-nodes', label: 'Share', action: () => setCurrentView('mine'), color: 'text-orange-300' },
              { icon: 'fa-headset', label: 'Service', action: () => setIsServiceModalOpen(true), color: 'text-orange-400' },
            ].map((item, idx) => (
              <button key={idx} onClick={item.action} className="flex flex-col items-center gap-1.5">
                <div className={`w-10 h-10 flex items-center justify-center text-xl ${item.color}`}><i className={`fa-solid ${item.icon}`}></i></div>
                <span className="text-[11px] font-medium text-gray-700">{item.label}</span>
              </button>
            ))}
          </section>
          <section className="grid grid-cols-3 px-4 py-4 gap-4 bg-white">
            {tickers.slice(0,3).map(t => {
              const change = ((parseFloat(t.lastPrice) - parseFloat(t.prevPrice24h)) / parseFloat(t.prevPrice24h) * 100);
              return (
                <div key={t.symbol} className="text-center">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">{t.symbol.replace('USDT', '')}/USDT</p>
                  <p className="text-sm font-black my-0.5 text-gray-800">{parseFloat(t.lastPrice).toFixed(2)}</p>
                  <p className={`text-[11px] font-black ${change >= 0 ? 'text-positive' : 'text-negative'}`}>{change.toFixed(2)}%</p>
                </div>
              );
            })}
          </section>
          <div className="flex px-4 py-3 bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
            <div className="w-1/2">Crypto</div><div className="w-1/4 text-center">Price</div><div className="w-1/4 text-right">Change</div>
          </div>
          <main className="flex-1 pb-24 bg-white overflow-y-auto">
            {tickers.map((t) => {
              const change = ((parseFloat(t.lastPrice) - parseFloat(t.prevPrice24h))/parseFloat(t.prevPrice24h)) * 100;
              return (
                <div key={t.symbol} onClick={() => { setSelectedSymbol(t.symbol); handleAuthenticatedView('trade'); }} className="flex items-center px-4 py-4 border-b border-gray-50 active:bg-gray-50">
                  <div className="w-1/2 flex items-center gap-3">
                    <img src={`https://assets.coincap.io/assets/icons/${t.symbol.replace('USDT', '').toLowerCase()}@2x.png`} className="w-7 h-7" onError={(e) => (e.target as any).src = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><circle cx=%2250%22 cy=%2250%22 r=%2245%22 fill=%22%23d4af37%22/><text x=%2250%22 y=%2265%22 font-family=%22Arial%22 font-size=%2245%22 font-weight=%22900%22 fill=%22white%22 text-anchor=%22middle%22>CF</text></svg>'} />
                    <span className="text-xs font-black text-gray-800 uppercase">{t.symbol.replace('USDT', '')}/USDT</span>
                  </div>
                  <div className="w-1/4 text-center text-xs font-bold text-gray-700">{parseFloat(t.lastPrice).toFixed(2)}</div>
                  <div className="w-1/4 flex justify-end">
                    <div className={`px-2 py-1.5 rounded text-[11px] font-black text-white min-w-[70px] text-center ${change >= 0 ? 'bg-positive' : 'bg-negative'}`}>{change.toFixed(2)}%</div>
                  </div>
                </div>
              );
            })}
          </main>
        </div>
      )}

      {currentView === 'financial' && <FinancialView onSelectCoin={(s) => { setSelectedSymbol(s); handleAuthenticatedView('trade'); }} tickers={tickers} onBack={() => setCurrentView('home')} />}
      {currentView === 'team' && <TeamView onBack={() => setCurrentView('home')} />}
      {currentView === 'mine' && <ProfileModal isOpen={true} onClose={() => setCurrentView('home')} user={user} onSignOut={handleLogout} onNavigate={handleProfileNavigation} referCode={user?.invitationCode || ''} />}
      {currentView === 'assets' && user && <AssetModal isOpen={true} onClose={() => setCurrentView('home')} user={user} transactions={transactions} trades={tradeRecords} onRecharge={() => setIsRechargeModalOpen(true)} onWithdraw={() => setIsWithdrawalModalOpen(true)} onInvite={() => setIsReferModalOpen(true)} onSalary={() => setIsSalaryModalOpen(true)} />}
      {currentView === 'trade' && <TradeView symbol={selectedSymbol} ticker={tickers.find(t => t.symbol === selectedSymbol) || null} user={user} onBack={() => setCurrentView('home')} onPlaceTrade={handlePlaceTrade} activeSignal={activeSignal} />}
      {currentView === 'investment' && <InvestmentView user={user} onBack={() => setCurrentView('home')} />}

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 h-16 grid grid-cols-6 z-50">
        {[
          { icon: 'fa-house-chimney', label: 'Home', action: () => setCurrentView('home'), active: currentView === 'home' },
          { icon: 'fa-users-viewfinder', label: 'Team', action: () => handleAuthenticatedView('team'), active: currentView === 'team' },
          { icon: 'fa-chart-pie', label: 'Financial', action: () => handleAuthenticatedView('financial'), active: currentView === 'financial' },
          { icon: 'fa-wallet', label: 'Assets', action: () => handleAuthenticatedView('assets'), active: currentView === 'assets' },
          { icon: 'fa-coins', label: 'Investment', action: () => handleAuthenticatedView('investment'), active: currentView === 'investment' },
          { icon: 'fa-user-astronaut', label: 'Mine', action: () => { if (!user) setCurrentView('login'); else setCurrentView('mine'); }, active: currentView === 'mine' },
        ].map((btn, idx) => (
          <button key={idx} onClick={btn.action} className={`flex flex-col items-center justify-center gap-1 ${btn.active ? 'text-primary' : 'text-gray-400'}`}>
            <i className={`fa-solid ${btn.icon} text-lg`}></i>
            <span className="text-[10px] font-bold">{btn.label}</span>
          </button>
        ))}
      </nav>

{isRechargeModalOpen && <RechargeModal isOpen={isRechargeModalOpen} onClose={() => setIsRechargeModalOpen(false)} onSuccess={async () => { try { const me = await api.get('/api/auth/me'); applyUser({ ...me.data, balance: Number(me.data?.balance) || 0 } as User); } catch {} try { const [tr, tx] = await Promise.all([api.get('/api/trades').catch(()=>({data:[]})), api.get('/api/transactions').catch(()=>({data:[]}))]); setTradeRecords(Array.isArray(tr.data)?tr.data:[]); setTransactions(Array.isArray(tx.data)?tx.data:[]);} catch {} }} />}
{isWithdrawalModalOpen && <WithdrawalModal isOpen={isWithdrawalModalOpen} onClose={() => setIsWithdrawalModalOpen(false)} onOpenSettings={() => { setIsWithdrawalModalOpen(false); setCurrentView('mine'); setIsSettingsModalOpen(true); }} onSuccess={async () => { try { const me = await api.get('/api/auth/me'); applyUser({ ...me.data, balance: Number(me.data?.balance) || 0 } as User); } catch {} try { const [tr, tx] = await Promise.all([api.get('/api/trades').catch(()=>({data:[]})), api.get('/api/transactions').catch(()=>({data:[]}))]); setTradeRecords(Array.isArray(tr.data)?tr.data:[]); setTransactions(Array.isArray(tx.data)?tx.data:[]);} catch {} }} user={user} />}
      {isServiceModalOpen && <ServiceModal isOpen={isServiceModalOpen} onClose={() => setIsServiceModalOpen(false)} email="customersupport@clipherforgeexchange.com" />}
      {isRechargeRecordModalOpen && <RechargeRecordModal isOpen={isRechargeRecordModalOpen} onClose={() => setIsRechargeRecordModalOpen(false)} />}
      <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />
      {isWithdrawalMethodModalOpen && <WithdrawalMethodModal isOpen={isWithdrawalMethodModalOpen} onClose={() => setIsWithdrawalMethodModalOpen(false)} currentAddress={user?.withdrawalMethod} onSave={(addr) => { if (user) handleUpdateUserList(user.id, { withdrawalMethod: addr } as any); }} />}
      {isContractOrderModalOpen && <ContractOrderModal isOpen={isContractOrderModalOpen} onClose={() => setIsContractOrderModalOpen(false)} trades={tradeRecords} />}
      {isWithdrawRecordModalOpen && <WithdrawRecordModal isOpen={isWithdrawRecordModalOpen} onClose={() => setIsWithdrawRecordModalOpen(false)} />}
      {isReferModalOpen && user && <ReferModal isOpen={isReferModalOpen} onClose={() => setIsReferModalOpen(false)} referCode={user.invitationCode} />}
      {isSalaryModalOpen && user && <SalaryModal isOpen={isSalaryModalOpen} onClose={() => setIsSalaryModalOpen(false)} user={user} onClaim={() => { const updated = {...user, balance: (user.balance||0) + 10, salaryClaimed: true}; setUser(updated); handleUpdateUserList(user.id, { balance: updated.balance, salaryClaimed: true } as any); setIsSalaryModalOpen(false); alert('Tier reward successfully injected.'); }} />}
      {isAppDownloadModalOpen && <AppDownloadModal isOpen={isAppDownloadModalOpen} onClose={() => setIsAppDownloadModalOpen(false)} />}
      {isNotificationsModalOpen && <NotificationsModal isOpen={isNotificationsModalOpen} onClose={() => setIsNotificationsModalOpen(false)} />}
      {user && <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} user={user} onNavigatePolicy={(v) => { setIsSettingsModalOpen(false); setPolicyView(v); }} onUpdateUser={handleUpdateUserList} onRefreshUser={refreshMe} onDeleted={handleLogout} />}
      {user && <PasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} user={user} />}
      {policyView === 'privacy' && <div className="fixed inset-0 z-[120] bg-white overflow-y-auto"><PrivacyPolicy onBack={() => setPolicyView('none')} /></div>}
      {policyView === 'refund' && <div className="fixed inset-0 z-[120] bg-white overflow-y-auto"><RefundPolicy onBack={() => setPolicyView('none')} /></div>}
    </div>
  );
};

export default App;
