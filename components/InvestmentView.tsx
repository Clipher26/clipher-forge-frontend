import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { User, VipTier, Investment } from '../types';

interface InvestmentViewProps {
  user: User | null;
  onBack: () => void;
}

const VIP_COLORS: Record<string, string> = {
  VIP1: 'text-blue-500 border-blue-100 bg-blue-50',
  VIP2: 'text-green-500 border-green-100 bg-green-50',
  VIP3: 'text-yellow-500 border-yellow-100 bg-yellow-50',
  VIP4: 'text-orange-500 border-orange-100 bg-orange-50',
  VIP5: 'text-red-500 border-red-100 bg-red-50',
  VIP6: 'text-primary border-primary/20 bg-primary/5',
};

/** Format remaining time until the next payout as HH:MM:SS */
function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const InvestmentView: React.FC<InvestmentViewProps> = ({ user, onBack }) => {
  const [tiers, setTiers] = useState<VipTier[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);
  const [nextPayoutAt, setNextPayoutAt] = useState<number | null>(null);

  const loadData = useCallback(async (): Promise<void> => {
    try {
      const [tRes, iRes] = await Promise.all([
        api.get('/api/vip/tiers'),
        api.get('/api/vip/investments'),
      ]);
      const tiersData = Array.isArray(tRes.data) ? tRes.data : (tRes.data?.data || []);
      const invData = Array.isArray(iRes.data) ? iRes.data : (iRes.data?.data || []);
      setTiers(tiersData as VipTier[]);
      setInvestments(invData as Investment[]);
    } catch (e) {
      console.error('Failed to load investment data', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Compute the earliest next payout across all active investments and
  // tick the countdown every second so the UI reflects the 24h cycle live.
  useEffect(() => {
    const computeNextPayout = (): number | null => {
      const now = Date.now();
      let earliest: number | null = null;
      for (const inv of investments) {
        if (inv.status !== 'Active') continue;
        const last = inv.lastPayout ? new Date(inv.lastPayout).getTime() : now;
        const next = last + 24 * 60 * 60 * 1000;
        if (earliest === null || next < earliest) earliest = next;
      }
      return earliest;
    };

    setNextPayoutAt(computeNextPayout());

    const interval = setInterval(() => {
      setNextPayoutAt(computeNextPayout());
    }, 1000);
    return () => clearInterval(interval);
  }, [investments]);

  const handleBuy = async (tier: VipTier): Promise<void> => {
    if (!user) return;
    const price = Number(tier.price);
    if ((user.balance || 0) < price) {
      alert('Insufficient balance to purchase this VIP tier.');
      return;
    }
    if (
      !window.confirm(
        `Purchase ${tier.name} for $${price.toFixed(2)}?\n\nThe purchase amount will be frozen in your wallet and cannot be used for trading or withdrawal. Daily earnings of $${Number(tier.dailyEarning).toFixed(2)} will be credited to your unlock (withdrawable) balance.`,
      )
    ) {
      return;
    }

    setBuying(tier.id);
    try {
      const res = await api.post('/api/vip/buy', { tierId: tier.id });
      if (res.data.success) {
        const updated = { ...user, balance: res.data.balance, frozenBalance: res.data.frozenBalance };
        window.dispatchEvent(new CustomEvent('cf:user-updated', { detail: updated }));
        alert(
          `${tier.name} purchased successfully. $${price.toFixed(2)} is now frozen. Daily earnings will be credited to your unlock balance.`,
        );
        loadData();
      } else {
        alert(res.data.message || 'Purchase failed.');
      }
    } catch (e: any) {
      alert(e.response?.data?.message || 'Purchase failed. Please try again.');
    } finally {
      setBuying(null);
    }
  };

  const totalFrozen = investments.reduce((sum: number, inv: Investment) => sum + Number(inv.price || 0), 0);
  const dailyEarningTotal = investments
    .filter((inv: Investment) => inv.status === 'Active')
    .reduce((sum: number, inv: Investment) => sum + Number(inv.dailyEarning || 0), 0);
  const totalEarned = investments.reduce((sum: number, inv: Investment) => sum + Number(inv.totalEarned || 0), 0);

  const activeInvestment = investments.find((inv: Investment) => inv.status === 'Active');

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-white max-w-md mx-auto pb-20">
        <header className="bg-primary h-12 flex items-center px-4 justify-between sticky top-0 z-50 shadow-sm">
          <button onClick={onBack} className="text-white text-xl p-1">
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <h1 className="text-white font-black uppercase italic tracking-tight text-sm">Investment</h1>
          <div className="w-8"></div>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-[10px] text-gray-400 font-black uppercase">Loading VIP tiers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white max-w-md mx-auto pb-20">
      <header className="bg-primary h-12 flex items-center px-4 justify-between sticky top-0 z-50 shadow-sm">
        <button onClick={onBack} className="text-white text-xl p-1">
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <h1 className="text-white font-black uppercase italic tracking-tight text-sm">Investment</h1>
        <div className="w-8"></div>
      </header>

      <div className="px-4 pt-4 pb-3">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <p className="text-[9px] text-gray-400 font-black uppercase tracking-wider mb-1">Available Balance</p>
            <p className="text-lg font-black text-gray-800">${(user?.balance || 0).toFixed(2)}</p>
            <p className="text-[9px] text-gray-400 mt-1">Usable for trade</p>
          </div>
          <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100">
            <p className="text-[9px] text-orange-600 font-black uppercase tracking-wider mb-1">Frozen (Locked)</p>
            <p className="text-lg font-black text-orange-700">${(user?.frozenBalance || 0).toFixed(2)}</p>
            <p className="text-[9px] text-gray-400 mt-1">Locked by VIP purchases</p>
          </div>
          <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
            <p className="text-[9px] text-green-600 font-black uppercase tracking-wider mb-1">Unlock Balance</p>
            <p className="text-lg font-black text-green-700">${(user?.unlockBalance || 0).toFixed(2)}</p>
            <p className="text-[9px] text-gray-400 mt-1">Used for withdrawals</p>
          </div>
        </div>
      </div>

      <div className="px-4 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">VIP Investment Tiers</h2>
          <p className="text-[10px] text-primary font-bold">Buy now &bull; Earn daily</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {tiers.map((tier: VipTier) => {
            const price = Number(tier.price);
            const daily = Number(tier.dailyEarning);
            const owned = investments.some(
              (inv: Investment) => inv.tierLevel === tier.level && inv.status === 'Active',
            );
            const color = VIP_COLORS[tier.name] || 'text-gray-500';
            const roi = ((daily * 30) / price * 100).toFixed(0);
            return (
              <button
                key={tier.id}
                disabled={owned || buying === tier.id || (user?.balance || 0) < price}
                onClick={() => handleBuy(tier)}
                className={`relative group bg-white border rounded-2xl p-4 flex flex-col transition-all ${color} hover:shadow-md ${owned ? 'bg-gray-50 opacity-80' : ''}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-black ${color}`}>{tier.name}</span>
                    {owned && (
                      <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                        Active
                      </span>
                    )}
                  </div>
                </div>
                <div className="mb-2 flex justify-center">
                  <img
                    src={tier.image || `/vip/vip${tier.level}.png`}
                    alt={tier.name}
                    className="w-full h-24 object-contain rounded-xl bg-gray-50 border border-gray-100"
                  />
                </div>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-2xl font-black text-gray-800">${price.toFixed(2)}</span>
                  <span className="text-[10px] font-black text-gray-400 ml-1">price</span>
                </div>
                <div className="flex justify-between items-baseline mb-3">
                  <span className="text-xl font-black text-positive">+${daily.toFixed(2)} / day</span>
                  <span className="text-[9px] font-bold text-green-600">~{roi}% / 30 days</span>
                </div>
                <div className="bg-gray-50/50 rounded-lg p-2 mb-3">
                  <p className="text-[9px] text-gray-400 font-bold text-center uppercase">
                    Frozen until earnings unlock
                  </p>
                </div>
                <div className="mt-auto">
                  {buying === tier.id ? (
                    <div className="w-full py-2 bg-gray-100 rounded-xl flex items-center justify-center gap-2">
                      <div className="w-3 h-3 border-2 border-gray-300 border-t-primary rounded-full animate-spin"></div>
                      <span className="text-[9px] text-gray-500 font-bold uppercase">Processing</span>
                    </div>
                  ) : owned ? (
                    <div className="w-full py-2 bg-gray-100 text-gray-400 rounded-xl text-[10px] font-bold uppercase">
                      Active
                    </div>
                  ) : (user?.balance || 0) < price ? (
                    <div className="w-full py-2 bg-gray-100 text-gray-400 rounded-xl text-[10px] font-bold uppercase">
                      Insufficient balance
                    </div>
                  ) : (
                    <div className="w-full py-2 border border-dashed border-gray-200 rounded-xl text-[10px] font-black uppercase text-center">
                      Buy {tier.name}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-[9px] text-gray-400 italic text-center">
          Purchased amount is frozen and cannot be used for trading or withdrawal. Daily earnings are credited to your
          unlock balance, which is used for withdrawals.
        </p>
      </div>

      <div className="px-4 pb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">My Investments</h2>
          <div className="flex items-center gap-2">
            <p className="text-[10px] text-primary font-bold">{activeInvestment ? 'Active' : 'None'}</p>
            {nextPayoutAt && nextPayoutAt > Date.now() && (
              <span className="text-[9px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                Next payout in {formatCountdown(nextPayoutAt - Date.now())}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
            <p className="text-[9px] text-gray-400 font-black uppercase mb-1">Total Invested</p>
            <p className="text-sm font-black text-gray-800">${totalFrozen.toFixed(2)}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-3 border border-green-100">
            <p className="text-[9px] text-green-600 font-black uppercase mb-1">Daily Earnings</p>
            <p className="text-sm font-black text-green-700">+${dailyEarningTotal.toFixed(2)} / day</p>
          </div>
        </div>

        {investments.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center">
            <i className="fa-solid fa-coins text-4xl text-gray-100 mb-4"></i>
            <p className="text-[10px] text-gray-400 font-bold uppercase">No active investments</p>
            <p className="text-[9px] text-gray-300 mt-1">Purchase a VIP tier to start earning daily.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {investments.map((inv: Investment) => {
              const lastMs = inv.lastPayout ? new Date(inv.lastPayout).getTime() : Date.now();
              const nextMs = lastMs + 24 * 60 * 60 * 1000;
              const remaining = nextMs - Date.now();
              return (
                <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-50 bg-white">
                  <div className="flex-1">
                    <p className="text-xs font-black text-gray-800 uppercase">{inv.tierName}</p>
                    <p className="text-[9px] text-gray-400 mt-0.5">
                      Invested: ${Number(inv.price || 0).toFixed(2)} &bull; Daily: +${Number(inv.dailyEarning || 0).toFixed(2)}
                    </p>
                    <p className="text-[9px] mt-0.5">
                      <span className={`font-bold ${inv.status === 'Active' ? 'text-green-600' : 'text-gray-400'}`}>
                        {inv.status}
                      </span>{inv.lastPayout ? ` &bull; Last payout: ${new Date(inv.lastPayout).toLocaleDateString()}` : ''}
                    </p>
                    <p className="text-[9px] text-gray-400">Total earned: ${Number(inv.totalEarned || 0).toFixed(2)}</p>
                    {inv.status === 'Active' && remaining > 0 && (
                      <p className="text-[9px] font-bold text-primary mt-0.5">
                        Next payout in {formatCountdown(remaining)}
                      </p>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded text-[9px] font-bold ${inv.status === 'Active' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                    {inv.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default InvestmentView;
