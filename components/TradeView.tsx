
import React, { useEffect, useMemo, useState } from 'react';
import { TickerData, User } from '../types';
import api from '../api';

interface TradeViewProps {
  symbol: string;
  ticker: TickerData | null;
  onBack: () => void;
  user?: User | null;
  onPlaceTrade?: (symbol: string, direction: 'CALL' | 'PUT', amount: number, price: string, yieldRate: number, period: string, signalId?: string) => Promise<void>;
  activeSignal?: any;
}

const TradeView: React.FC<TradeViewProps> = ({ symbol, ticker, onBack, user, onPlaceTrade, activeSignal }) => {
  const [tradeAmount, setTradeAmount] = useState('');
  const [tradeDirection, setTradeDirection] = useState<'CALL' | 'PUT'>('CALL');
  const [selectedPeriod, setSelectedPeriod] = useState<{ label: string; yield: number }>({ label: '60 S', yield: 0.30 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resettling, setResettling] = useState(false);

  const handleResettle = async () => {
    setResettling(true);
    try {
      const res = await api.post('/api/trades/resettle');
      if (res.data.success) {
        alert(`Trade resettle complete: ${res.data.settled} trades settled.`);
      }
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Resettle failed');
    } finally {
      setResettling(false);
    }
  };

  const periods = [
    { label: '60 S', yield: 0.30 },
    { label: '120 S', yield: 0.35 },
    { label: '300 S', yield: 0.45 }
  ];

  const sigActive = !!(activeSignal?.id && activeSignal?.expiresAt && new Date(activeSignal.expiresAt).getTime() > Date.now() && activeSignal?.isActive !== false);
  useEffect(() => {
    if (!sigActive || !activeSignal) return;
    if (activeSignal.direction === 'CALL' || activeSignal.direction === 'PUT') setTradeDirection(activeSignal.direction);
    const p = String(activeSignal.period || '').toLowerCase();
    const found = periods.find(x => x.label.replace(/\s+/g,'').toLowerCase() === p || x.label.toLowerCase().startsWith(p));
    if (found) setSelectedPeriod(found);
  }, [sigActive, activeSignal?.id]);

  const currentPrice = ticker?.lastPrice || '0.00';
  
  const moneyValue = parseFloat(tradeAmount) || 0;

  const expectedPayout = useMemo(() => {
    if (!moneyValue) return 0;
    const grossProfit = moneyValue * selectedPeriod.yield;
    // We deduct the 10% tax from the PROFIT portion only
    const tax = grossProfit * 0.10;
    return moneyValue + (grossProfit - tax);
  }, [moneyValue, selectedPeriod]);

  const handleConfirmOrder = async () => {
    if (!moneyValue || moneyValue <= 0) {
      alert("Please enter a valid amount.");
      return;
    }
    if (user && user.balance < moneyValue) {
      alert("Insufficient balance.");
      return;
    }

    if (user && moneyValue > user.balance * 0.1) {
      alert("Risk Control: You can only trade up to 10% of your available balance.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (onPlaceTrade) {
        await onPlaceTrade(symbol, tradeDirection, moneyValue, currentPrice, selectedPeriod.yield, selectedPeriod.label, sigActive ? activeSignal?.id : undefined);
      }
      setTradeAmount('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-white flex flex-col animate-in slide-in-from-right duration-300">
      {/* Top Header */}
      <header className="h-14 flex items-center px-4 justify-between shrink-0">
        <h2 className="text-gray-800 font-bold text-sm">{symbol.replace('USDT', '')}/USDT</h2>
        <div className="flex items-center gap-2">
          <button onClick={handleResettle} disabled={resettling} className="text-[10px] font-black text-primary uppercase disabled:opacity-50 active:scale-95 transition-all px-2 py-1 rounded bg-primary/10">
            {resettling ? 'Resettling...' : 'Resettle'}
          </button>
          <button onClick={onBack} className="text-gray-400 hover:text-gray-600">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {sigActive && (
          <div className="bg-bybit/10 border border-bybit/30 rounded-xl p-3 text-[11px]">
            <p className="font-black text-bybit uppercase">Active Admin Signal (applies to any crypto)</p>
            <p className="text-gray-700 font-bold mt-1">{activeSignal.symbol} • {activeSignal.direction} • {String(activeSignal.period||'').toUpperCase()} • {activeSignal.yield} • expires {new Date(activeSignal.expiresAt).toLocaleTimeString()}</p>
            <p className="text-gray-500 mt-1">Trades after expiry may result in loss.</p>
          </div>
        )}
        {/* Direction Selection */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-gray-700">Direction</p>
          <div className="flex gap-2">
            <button 
              onClick={() => setTradeDirection('CALL')}
              className={`flex-1 py-3 rounded-md font-bold text-sm transition-all ${
                tradeDirection === 'CALL' ? 'bg-positive text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              CALL
            </button>
            <button 
              onClick={() => setTradeDirection('PUT')}
              className={`flex-1 py-3 rounded-md font-bold text-sm transition-all ${
                tradeDirection === 'PUT' ? 'bg-negative text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              PUT
            </button>
          </div>
        </div>

        {/* Selection period */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-gray-700">Selection period</p>
          <div className="flex gap-2">
            {periods.map(p => (
              <button 
                key={p.label}
                onClick={() => setSelectedPeriod(p)}
                className={`flex-1 py-3 rounded-md flex flex-col items-center justify-center transition-all ${
                  selectedPeriod.label === p.label 
                  ? 'bg-primary text-white scale-105' 
                  : 'bg-gray-100 text-gray-500'
                }`}
              >
                <span className="text-sm font-bold">{p.label}</span>
                <span className="text-[10px] font-medium">{(p.yield * 100).toFixed(0)}%</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom amount */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-700">Custom amount</p>
          <div className="bg-[#e9e9e9] rounded-md overflow-hidden">
            <input 
              type="number"
              value={tradeAmount}
              onChange={(e) => setTradeAmount(e.target.value)}
              placeholder="Please enter amount"
              className="w-full bg-transparent py-4 px-4 text-sm text-gray-800 placeholder:text-gray-400 outline-none"
            />
          </div>
          <p className="text-xs font-medium text-gray-700">
            Available : <span className="text-gray-800">{user?.balance.toFixed(2) || '0.00'}</span>
          </p>
        </div>

        {/* Stats Row - Matches Screenshot */}
        <div className="flex justify-between items-start text-center border-t border-gray-50 pt-6">
          <div className="flex-1">
            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Direction</p>
            <p className="text-xs font-bold text-positive">{tradeDirection}</p>
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Price</p>
            <p className="text-xs font-bold text-negative">{parseFloat(currentPrice).toFixed(2)}</p>
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Money</p>
            <p className="text-xs font-bold text-gray-800">{moneyValue}</p>
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Expected</p>
            <p className="text-xs font-bold text-primary">{expectedPayout.toFixed(0)}</p>
          </div>
        </div>
      </div>

      {/* Confirm Order Button - Matches Screenshot */}
      <div className="p-4 bg-white shrink-0">
        <button 
          onClick={handleConfirmOrder}
          disabled={isSubmitting}
          className="w-full bg-primary text-white py-4 rounded-md font-bold text-sm shadow-md active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {isSubmitting ? <i className="fa-solid fa-spinner animate-spin"></i> : 'Confirm order'}
        </button>
      </div>

      {/* Side Arrow Indicator like in image */}
      <div className="fixed right-0 top-1/2 -translate-y-1/2">
        <div className="bg-[#0b0c2e] w-6 h-10 rounded-l-full flex items-center justify-center">
            <i className="fa-solid fa-chevron-left text-white text-[10px]"></i>
        </div>
      </div>
    </div>
  );
};

export default React.memo(TradeView);
