
import React, { useEffect, useState } from 'react';
import api from '../api';
import { Investment, TradeRecord } from '../types';

interface ContractOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  trades: TradeRecord[];
}

const formatPlanDate = (value?: string | null) => value ? new Date(value).toLocaleString() : '—';

const ContractOrderModal: React.FC<ContractOrderModalProps> = ({ isOpen, onClose, trades }) => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loadingInvestments, setLoadingInvestments] = useState(false);
  const [investmentError, setInvestmentError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setLoadingInvestments(true);
    setInvestmentError('');
    api.get('/api/vip/investments')
      .then((res) => {
        if (cancelled) return;
        const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        const now = Date.now();
        setInvestments(data.filter((inv: Investment) =>
          inv.status === 'Active' && (!inv.expiresAt || new Date(inv.expiresAt).getTime() > now),
        ));
      })
      .catch(() => {
        if (!cancelled) setInvestmentError('Unable to load the active investment plan.');
      })
      .finally(() => {
        if (!cancelled) setLoadingInvestments(false);
      });
    return () => { cancelled = true; };
  }, [isOpen]);

  if (!isOpen) return null;

  const now = Date.now();
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  const weeklyTrades = trades.filter(t => t.timestamp != null && (now - t.timestamp) < oneWeekMs);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="relative bg-white w-full h-full md:max-w-2xl md:h-auto md:max-h-[90vh] md:rounded-lg overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-300 flex flex-col">
        {/* Uniform Header */}
        <header className="bg-primary h-12 flex items-center px-4 shrink-0 shadow-sm">
          <button onClick={onClose} className="text-white hover:opacity-80 transition-opacity">
            <i className="fa-solid fa-arrow-left text-xl"></i>
          </button>
          <h2 className="ml-4 text-white font-bold text-sm tracking-tight uppercase italic">Contract Order</h2>
        </header>

        <div className="bg-[#f8f8f8] border-b border-gray-100 px-6 py-4">
          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-black uppercase tracking-widest">ACTIVE INVESTMENT PLAN</span>
        </div>

        <div className="border-b border-gray-100 bg-white">
          {loadingInvestments ? (
            <div className="px-6 py-5 text-xs text-gray-400">Loading investment plan...</div>
          ) : investmentError ? (
            <div className="px-6 py-5 text-xs text-red-500">{investmentError}</div>
          ) : investments.length === 0 ? (
            <div className="px-6 py-5 text-xs text-gray-400">No active investment plan.</div>
          ) : investments.map((investment) => (
            <div key={investment.id} className="px-6 py-5 border-b border-gray-50 last:border-0">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-black text-gray-900 uppercase">{investment.tierName}</p>
                <span className="text-[10px] bg-green-50 text-green-600 px-2 py-1 rounded font-black uppercase">Active</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Next payout date</span>
                  <span className="text-[11px] font-bold text-gray-700">{investment.nextPayoutAt ? formatPlanDate(investment.nextPayoutAt) : 'No further payouts'}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Plan expiration date</span>
                  <span className="text-[11px] font-bold text-gray-700">{investment.expiresAt ? formatPlanDate(investment.expiresAt) : 'Not set'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-[#f8f8f8] border-b border-gray-100 px-6 py-4">
          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-black uppercase tracking-widest">WEEKLY NODES</span>
        </div>

        <div className="flex-1 overflow-y-auto bg-white">
          {weeklyTrades.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <i className="fa-solid fa-chart-pie text-4xl mb-4 opacity-20"></i>
              <p className="text-sm">No contract executions detected this week.</p>
            </div>
          ) : (
            weeklyTrades.map((trade) => (
              <div key={trade.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                <div className="px-6 py-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                       <span className="text-sm font-black text-gray-900 uppercase">{trade.symbol}</span>
                       <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-tighter ${
                         trade.direction === 'CALL' ? 'bg-positive/10 text-positive' : 'bg-negative/10 text-negative'
                       }`}>
                         {trade.direction}
                       </span>
                    </div>
                    <span className="text-xs font-bold text-gray-400 font-mono">#{trade.id}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-y-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Entry Price</span>
                      <span className="text-sm font-bold text-gray-800">{trade.entryPrice}</span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Quantity</span>
                      <span className="text-sm font-bold text-gray-800">{trade.amount.toFixed(2)} USDT</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Time</span>
                      <span className="text-[11px] text-gray-500">{trade.time}</span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Status</span>
                      <span className="text-[11px] text-primary font-black uppercase tracking-widest italic">{trade.status}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="bg-white px-6 py-4 flex justify-end border-t border-gray-100">
           <p className="text-[10px] text-gray-300 uppercase font-black tracking-widest italic">Forge Protocol v1.4.2</p>
        </div>
      </div>
    </div>
  );
};

export default ContractOrderModal;
