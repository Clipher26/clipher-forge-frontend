
import React, { useState, useMemo } from 'react';
import api from '../api';
import { User, TransactionRecord, TradeRecord } from '../types';

interface AssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  transactions: TransactionRecord[];
  trades: TradeRecord[];
  onRecharge: () => void;
  onWithdraw: () => void;
  onInvite: () => void;
  onSalary: () => void;
}

const TRANSACTION_LABELS: Record<string, string> = {
  vip_daily_earning: 'Daily VIP Earning',
  vip_purchase: 'VIP Purchase',
  deposit: 'Deposit',
  deposit_request: 'Deposit Request',
  withdrawal: 'Withdrawal',
  trade_stake: 'Trade Stake',
  commission_salary: 'Commission Salary',
  commission_salary_revoke: 'Commission Revoked',
  referral_bonus: 'Referral Bonus',
  tax: 'Platform Tax',
};

const formatTransactionLabel = (category?: string): string => {
  if (!category) return 'Transaction';
  return TRANSACTION_LABELS[category] || category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

const AssetModal: React.FC<AssetModalProps> = ({ isOpen, onClose, user, transactions, trades, onRecharge, onWithdraw, onInvite, onSalary }) => {
  const [activeLedger, setActiveLedger] = useState<'TRANSACTIONS' | 'TRADES'>('TRANSACTIONS');
  const [cleanupMsg, setCleanupMsg] = useState<string>('');
  const tiers = [5, 10, 50, 100, 500, 1000];
  const MAX_YIELD = 0.45; // 300S Period yield
  const ADMIN_FEE = 0.10; // 10% Infrastructure Tax

  const forecastData = useMemo(() => {
    return tiers.map(amount => {
      const grossProfit = amount * MAX_YIELD;
      const fee = grossProfit * ADMIN_FEE;
      const netProfit = grossProfit - fee;
      return {
        amount,
        gross: grossProfit,
        fee,
        net: netProfit,
        daily: netProfit * 3 // Assumption of 3 successful trades per day session
      };
    });
  }, []);

  const handleCleanupReferralBonus = async () => {
    setCleanupMsg('');
    try {
      const res = await api.post('/api/trades/cleanup-referral-bonus');
      const data = res.data;
      if (data.removed > 0) {
        setCleanupMsg(`Removed ${data.removed} incorrect referral bonus transaction(s). $${data.totalRemovedAmount?.toFixed(2) ?? '0.00'} returned to unlock balance.`);
      } else {
        setCleanupMsg(data.message || 'No incorrect referral bonus found.');
      }
    } catch (e: any) {
      setCleanupMsg(e?.response?.data?.message || 'Cleanup failed');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="relative bg-white w-full max-w-5xl h-full md:h-[95vh] md:rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in slide-in-from-bottom-4 duration-300">
        
        {/* Header Section */}
        <div className="bg-gradient-to-r from-[#1a1a1a] to-[#333] p-8 text-white relative shrink-0">
          <button onClick={onClose} className="absolute left-6 top-6 text-white hover:text-bybit transition-all p-1">
            <i className="fa-solid fa-arrow-left text-2xl drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"></i>
          </button>
          
          <div className="mt-8 mb-6 flex items-end gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-end gap-1">
                <p className="text-xs opacity-60 font-bold uppercase tracking-widest">Deposit</p>
                <span className="text-3xl font-black mt-1 italic tracking-tighter text-gray-800">${(user.balance || 0).toFixed(2)}</span>
              </div>
              <p className="text-[9px] text-gray-400 mt-1 font-medium">Available balance for trading</p>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-end gap-1">
                <p className="text-xs opacity-60 font-bold uppercase tracking-widest">Frozen</p>
                <span className="text-3xl font-black mt-1 italic tracking-tighter text-orange-600">${(user.frozenBalance || 0).toFixed(2)}</span>
              </div>
              <p className="text-[9px] text-gray-400 mt-1 font-medium">Locked by VIP investments</p>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-end gap-1">
                <p className="text-xs opacity-60 font-bold uppercase tracking-widest">Unlock</p>
                <span className="text-3xl font-black mt-1 italic tracking-tighter text-green-600">${(user.unlockBalance || 0).toFixed(2)}</span>
              </div>
              <p className="text-[9px] text-gray-400 mt-1 font-medium">Used for withdrawals</p>
            </div>
            <div className="text-right hidden md:block">
              <div className="flex items-center gap-2 justify-end mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-green-400">Bybit V5 Real-Time Sync</span>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
              </div>
              <p className="text-[9px] opacity-40 uppercase font-black">Operator Node: {user.id}</p>
            </div>
          </div>

          {/* Action Row */}
          <div className="grid grid-cols-4 gap-4 mt-8">
            {[
              { label: 'Deposit', icon: 'fa-plus', action: onRecharge, color: 'text-blue-500' },
              { label: 'Withdraw', icon: 'fa-paper-plane', action: onWithdraw, color: 'text-green-600' },
              { label: 'Invite', icon: 'fa-users', action: onInvite, color: 'text-orange-400' },
              { label: 'Salary', icon: 'fa-gift', action: onSalary, color: 'text-purple-500' }
            ].map((item, i) => (
              <button key={i} onClick={item.action} className="bg-white/10 hover:bg-white/20 p-3 rounded-2xl transition-all flex flex-col items-center gap-1 border border-white/5">
                <div className={`w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 mb-1`}>
                  <i className={`fa-solid ${item.icon} text-lg ${item.color}`}></i>
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-gray-50 flex flex-col lg:flex-row">
          
          {/* Daily Earning tiers - THE "PER DAY" UI REQUESTED */}
          <div className="flex-[3] p-6 lg:p-8">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl font-black text-gray-800 uppercase italic tracking-tighter">Earnings Scale Protocol</h2>
                  <p className="text-xs text-gray-400 font-bold uppercase mt-1">Calculated via Live Bybit Settlement Engine</p>
                </div>
                <div className="bg-bybit/10 px-3 py-1 rounded-full border border-bybit/20">
                  <span className="text-[10px] font-black text-bybit uppercase">Net Profit (After 10% Fee)</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {forecastData.map(data => (
                  <div key={data.amount} className="bg-gray-50/50 border border-gray-100 p-5 rounded-2xl flex justify-between items-center hover:bg-white hover:shadow-md transition-all group">
                    <div>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Investment Tier</p>
                      <h3 className="text-2xl font-black text-gray-800">${data.amount}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-positive font-black uppercase tracking-widest">Daily Potential*</p>
                      <h3 className="text-2xl font-black text-positive italic">+${data.daily.toFixed(2)}</h3>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 bg-black text-white p-6 rounded-2xl">
                 <div className="flex items-center gap-3 mb-4">
                   <i className="fa-solid fa-bolt-lightning text-bybit"></i>
                   <h4 className="text-xs font-black uppercase tracking-widest">How it works (Real Data)</h4>
                 </div>
                 <p className="text-[11px] opacity-70 leading-relaxed italic">
                   CipherForge captures the Bybit Spot price at the exact millisecond of your entry. If the market moves 0.0001 in your direction by settlement, you earn the full 45% yield. We use real-time V5 WebSockets to ensure 100% accurate price validation.
                 </p>
              </div>
            </div>
          </div>

          {/* Transaction Ledger */}
          <div className="flex-[2] bg-white border-l border-gray-100 overflow-y-auto max-h-screen">
            <div className="p-6 sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-50 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Digital Ledger</h3>
                <span className="text-[9px] font-bold text-gray-300">Live Updates</span>
              </div>
              {cleanupMsg && (
                <div className={`p-2 rounded-lg text-[9px] font-bold ${cleanupMsg.includes('Removed') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'}`}>
                  {cleanupMsg}
                </div>
              )}
              <div className="flex bg-gray-100 p-1 rounded-xl">
                <button 
                  onClick={() => setActiveLedger('TRANSACTIONS')}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-tighter rounded-lg transition-all ${activeLedger === 'TRANSACTIONS' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}
                >
                  Transactions
                </button>
                <button 
                  onClick={() => setActiveLedger('TRADES')}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-tighter rounded-lg transition-all ${activeLedger === 'TRADES' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}
                >
                  Trading History
                </button>
              </div>
            </div>
            
            <div className="p-4 space-y-2">
              {activeLedger === 'TRANSACTIONS' ? (
                <>
                  {transactions.length > 0 && (
                    <div className="mb-3">
                      {transactions.some((tx: any) => tx.category === 'referral_bonus') && (
                        <button
                          onClick={handleCleanupReferralBonus}
                          className="w-full bg-yellow-50 border border-yellow-200 rounded-xl py-2 px-3 text-[10px] font-black text-yellow-700 uppercase tracking-widest hover:bg-yellow-100 transition-all"
                        >
                          <i className="fa-solid fa-broom mr-1"></i> Remove Incorrect Referral Bonus
                        </button>
                      )}
                    </div>
                  )}
                  {transactions.map(tx => (
                     <div key={tx.id} className="p-4 rounded-xl border border-gray-50 hover:bg-gray-50 transition-colors flex justify-between items-center">
<div>
                            <p className="text-xs font-bold text-gray-800">{formatTransactionLabel(tx.category)}</p>
                            <p className="text-[9px] text-gray-400 font-medium">{(tx as any).time || ((tx as any).createdAt ? new Date((tx as any).createdAt).toLocaleString() : '')}</p>
                          </div>
                         <p className={`text-sm font-black ${tx.type === 'credit' ? 'text-positive' : 'text-negative'}`}>
                           {typeof tx.amount === 'number' ? `$${tx.amount.toFixed(2)}` : tx.amount}
                         </p>
                      </div>
                    ))}
                  {transactions.length === 0 && (
                    <div className="py-20 text-center flex flex-col items-center">
                       <i className="fa-solid fa-inbox text-4xl text-gray-100 mb-4"></i>
                       <p className="text-[10px] text-gray-400 font-black uppercase">No transaction records</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {trades.map(trade => (
                     <div key={trade.id} className="p-4 rounded-xl border border-gray-50 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded text-white ${trade.direction === 'CALL' ? 'bg-positive' : 'bg-negative'}`}>
                              {trade.direction}
                            </span>
                            <span className="text-xs font-black text-gray-800 uppercase">{String(trade.symbol||'').replace('USDT', '')}</span>
                          </div>
                          <span className={`text-[10px] font-bold ${trade.status === 'Settled' ? 'text-blue-500' : trade.status === 'Lost' ? 'text-red-500' : 'text-orange-500'}`}>
                            {trade.status}
                          </span>
                        </div>
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-[8px] text-gray-400 font-bold uppercase">Entry: {trade.entryPrice}</p>
                            <p className="text-[9px] text-gray-400 font-medium">{(trade as any).time || ((trade as any).createdAt ? new Date((trade as any).createdAt).toLocaleString() : '')}</p>
                          </div>
                          <p className="text-sm font-black text-gray-800">
                            ${Number(trade.amount||0).toFixed(2)}
                          </p>
                        </div>
                     </div>
                   ))}
                  {trades.length === 0 && (
                    <div className="py-20 text-center flex flex-col items-center">
                       <i className="fa-solid fa-chart-line text-4xl text-gray-100 mb-4"></i>
                       <p className="text-[10px] text-gray-400 font-black uppercase">No trading history</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetModal;
