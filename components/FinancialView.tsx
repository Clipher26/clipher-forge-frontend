
import React, { useState } from 'react';
import { TickerData } from '../types';

interface FinancialViewProps {
  tickers: TickerData[];
  onSelectCoin: (symbol: string) => void;
  onBack: () => void;
}

type FinancialTab = 'contracts' | 'usdc' | 'unified' | 'spot';

const FinancialView: React.FC<FinancialViewProps> = ({ tickers, onSelectCoin, onBack }) => {
  const [activeTab, setActiveTab] = useState<FinancialTab>('contracts');

  const tabs: { id: FinancialTab; label: string; sublabel: string; icon: string; color: string }[] = [
    { id: 'contracts', label: 'Contracts', sublabel: 'Orders & Positions', icon: 'fa-file-contract', color: 'text-blue-500' },
    { id: 'usdc', label: 'USDC Contracts', sublabel: 'Trade', icon: 'fa-coins', color: 'text-green-500' },
    { id: 'unified', label: 'Unified Trading', sublabel: 'Trade', icon: 'fa-layer-group', color: 'text-purple-500' },
    { id: 'spot', label: 'SPOT', sublabel: 'Trade', icon: 'fa-bolt', color: 'text-primary' },
  ];

  const contractPairs = tickers.filter(t => ['BTCUSDT','ETHUSDT','BNBUSDT','SOLUSDT','DOGEUSDT','ADAUSDT'].includes(t.symbol));
  const usdcPairs = tickers.filter(t => ['BTCUSDT','ETHUSDT','LTCUSDT','DOTUSDT'].includes(t.symbol));
  const unifiedPairs = tickers;
  const spotPairs = tickers.filter(t => ['BTCUSDT','ETHUSDT','BNBUSDT','TRXUSDT','LTCUSDT','EOSUSDT'].includes(t.symbol));

  const getPairs = () => {
    switch (activeTab) {
      case 'contracts': return contractPairs;
      case 'usdc': return usdcPairs;
      case 'unified': return unifiedPairs;
      case 'spot': return spotPairs;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white max-w-md mx-auto pb-20">
      {/* Header */}
      <header className="bg-primary h-12 flex items-center px-4 justify-between sticky top-0 z-50 shadow-sm">
        <button onClick={onBack} className="text-white text-xl p-1">
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <h1 className="text-white font-black uppercase italic tracking-tight text-sm">Financial</h1>
        <div className="w-8"></div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-100 px-4 pt-4 pb-0 sticky top-12 z-40 shadow-sm">
        <div className="grid grid-cols-4 gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center py-3 px-1 rounded-t-lg border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              <i className={`fa-solid ${tab.icon} text-base mb-1 ${activeTab === tab.id ? 'text-primary' : tab.color}`}></i>
              <span className="text-[9px] font-black uppercase leading-tight text-center">{tab.label}</span>
              <span className="text-[8px] text-gray-400 font-medium leading-tight">{tab.sublabel}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1">
        {/* Contracts - Orders & Positions */}
        {activeTab === 'contracts' && (
          <div>
            <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-file-contract text-blue-500"></i>
                <div>
                  <p className="text-xs font-black text-blue-700 uppercase tracking-wide">Contracts Â· Orders & Positions</p>
                  <p className="text-[10px] text-blue-500">Manage your open orders and active positions</p>
                </div>
              </div>
            </div>
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
              <div className="grid grid-cols-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <span>Pair</span>
                <span className="text-center">Price</span>
                <span className="text-center">Change</span>
                <span className="text-right">Action</span>
              </div>
            </div>
            {contractPairs.map(t => {
              const change = ((parseFloat(t.lastPrice) - parseFloat(t.prevPrice24h)) / parseFloat(t.prevPrice24h)) * 100;
              return (
                <div key={t.symbol} className="flex items-center px-4 py-3.5 border-b border-gray-50 hover:bg-gray-50 active:bg-gray-100">
                  <div className="flex-1 flex items-center gap-2">
                    <img src={`https://assets.coincap.io/assets/icons/${t.symbol.replace('USDT','').toLowerCase()}@2x.png`} className="w-7 h-7 rounded-full" onError={(e) => (e.target as any).src = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><circle cx=%2250%22 cy=%2250%22 r=%2245%22 fill=%22%23d4af37%22/><text x=%2250%22 y=%2265%22 font-family=%22Arial%22 font-size=%2245%22 font-weight=%22900%22 fill=%22white%22 text-anchor=%22middle%22>CF</text></svg>'} />
                    <div>
                      <p className="text-xs font-black text-gray-800">{t.symbol.replace('USDT','')}/<span className="text-gray-400">USDT</span></p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase">Perpetual</p>
                    </div>
                  </div>
                  <div className="text-center w-20">
                    <p className="text-xs font-bold text-gray-800">{parseFloat(t.lastPrice).toFixed(2)}</p>
                  </div>
                  <div className="text-center w-16">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded ${change >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>{change.toFixed(2)}%</span>
                  </div>
                  <div className="text-right w-14">
                    <button onClick={() => onSelectCoin(t.symbol)} className="bg-primary text-white text-[9px] font-black px-2.5 py-1.5 rounded-lg uppercase">Trade</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* USDC Contracts */}
        {activeTab === 'usdc' && (
          <div>
            <div className="px-4 py-3 bg-green-50 border-b border-green-100">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-coins text-green-500"></i>
                <div>
                  <p className="text-xs font-black text-green-700 uppercase tracking-wide">USDC Contracts Â· Trade</p>
                  <p className="text-[10px] text-green-600">Trade perpetual contracts settled in USDC</p>
                </div>
              </div>
            </div>
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
              <div className="grid grid-cols-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <span>Pair</span>
                <span className="text-center">Price</span>
                <span className="text-center">Change</span>
                <span className="text-right">Action</span>
              </div>
            </div>
            {usdcPairs.map(t => {
              const change = ((parseFloat(t.lastPrice) - parseFloat(t.prevPrice24h)) / parseFloat(t.prevPrice24h)) * 100;
              return (
                <div key={t.symbol} className="flex items-center px-4 py-3.5 border-b border-gray-50 hover:bg-gray-50 active:bg-gray-100">
                  <div className="flex-1 flex items-center gap-2">
                    <img src={`https://assets.coincap.io/assets/icons/${t.symbol.replace('USDT','').toLowerCase()}@2x.png`} className="w-7 h-7 rounded-full" onError={(e) => (e.target as any).src = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><circle cx=%2250%22 cy=%2250%22 r=%2245%22 fill=%22%23d4af37%22/><text x=%2250%22 y=%2265%22 font-family=%22Arial%22 font-size=%2245%22 font-weight=%22900%22 fill=%22white%22 text-anchor=%22middle%22>CF</text></svg>'} />
                    <div>
                      <p className="text-xs font-black text-gray-800">{t.symbol.replace('USDT','')}/<span className="text-green-500">USDC</span></p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase">USDC-M</p>
                    </div>
                  </div>
                  <div className="text-center w-20">
                    <p className="text-xs font-bold text-gray-800">{parseFloat(t.lastPrice).toFixed(2)}</p>
                  </div>
                  <div className="text-center w-16">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded ${change >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>{change.toFixed(2)}%</span>
                  </div>
                  <div className="text-right w-14">
                    <button onClick={() => onSelectCoin(t.symbol)} className="bg-green-500 text-white text-[9px] font-black px-2.5 py-1.5 rounded-lg uppercase">Trade</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Unified Trading */}
        {activeTab === 'unified' && (
          <div>
            <div className="px-4 py-3 bg-purple-50 border-b border-purple-100">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-layer-group text-purple-500"></i>
                <div>
                  <p className="text-xs font-black text-purple-700 uppercase tracking-wide">Unified Trading Â· Trade</p>
                  <p className="text-[10px] text-purple-600">Unified margin account across all asset classes</p>
                </div>
              </div>
            </div>
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
              <div className="grid grid-cols-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <span>Pair</span>
                <span className="text-center">Price</span>
                <span className="text-center">Change</span>
                <span className="text-right">Action</span>
              </div>
            </div>
            {unifiedPairs.slice(0, 12).map(t => {
              const change = ((parseFloat(t.lastPrice) - parseFloat(t.prevPrice24h)) / parseFloat(t.prevPrice24h)) * 100;
              return (
                <div key={t.symbol} className="flex items-center px-4 py-3.5 border-b border-gray-50 hover:bg-gray-50 active:bg-gray-100">
                  <div className="flex-1 flex items-center gap-2">
                    <img src={`https://assets.coincap.io/assets/icons/${t.symbol.replace('USDT','').toLowerCase()}@2x.png`} className="w-7 h-7 rounded-full" onError={(e) => (e.target as any).src = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><circle cx=%2250%22 cy=%2250%22 r=%2245%22 fill=%22%23d4af37%22/><text x=%2250%22 y=%2265%22 font-family=%22Arial%22 font-size=%2245%22 font-weight=%22900%22 fill=%22white%22 text-anchor=%22middle%22>CF</text></svg>'} />
                    <div>
                      <p className="text-xs font-black text-gray-800">{t.symbol.replace('USDT','')}/<span className="text-gray-400">USDT</span></p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase">Unified</p>
                    </div>
                  </div>
                  <div className="text-center w-20">
                    <p className="text-xs font-bold text-gray-800">{parseFloat(t.lastPrice).toFixed(2)}</p>
                  </div>
                  <div className="text-center w-16">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded ${change >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>{change.toFixed(2)}%</span>
                  </div>
                  <div className="text-right w-14">
                    <button onClick={() => onSelectCoin(t.symbol)} className="bg-purple-500 text-white text-[9px] font-black px-2.5 py-1.5 rounded-lg uppercase">Trade</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* SPOT */}
        {activeTab === 'spot' && (
          <div>
            <div className="px-4 py-3 bg-yellow-50 border-b border-yellow-100">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-bolt text-primary"></i>
                <div>
                  <p className="text-xs font-black text-yellow-700 uppercase tracking-wide">SPOT Â· Trade</p>
                  <p className="text-[10px] text-yellow-600">Buy and sell crypto at current market prices</p>
                </div>
              </div>
            </div>
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
              <div className="grid grid-cols-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <span>Pair</span>
                <span className="text-center">Price</span>
                <span className="text-center">Change</span>
                <span className="text-right">Action</span>
              </div>
            </div>
            {spotPairs.map(t => {
              const change = ((parseFloat(t.lastPrice) - parseFloat(t.prevPrice24h)) / parseFloat(t.prevPrice24h)) * 100;
              return (
                <div key={t.symbol} className="flex items-center px-4 py-3.5 border-b border-gray-50 hover:bg-gray-50 active:bg-gray-100">
                  <div className="flex-1 flex items-center gap-2">
                    <img src={`https://assets.coincap.io/assets/icons/${t.symbol.replace('USDT','').toLowerCase()}@2x.png`} className="w-7 h-7 rounded-full" onError={(e) => (e.target as any).src = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><circle cx=%2250%22 cy=%2250%22 r=%2245%22 fill=%22%23d4af37%22/><text x=%2250%22 y=%2265%22 font-family=%22Arial%22 font-size=%2245%22 font-weight=%22900%22 fill=%22white%22 text-anchor=%22middle%22>CF</text></svg>'} />
                    <div>
                      <p className="text-xs font-black text-gray-800">{t.symbol.replace('USDT','')}/<span className="text-gray-400">USDT</span></p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase">Spot</p>
                    </div>
                  </div>
                  <div className="text-center w-20">
                    <p className="text-xs font-bold text-gray-800">{parseFloat(t.lastPrice).toFixed(2)}</p>
                  </div>
                  <div className="text-center w-16">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded ${change >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>{change.toFixed(2)}%</span>
                  </div>
                  <div className="text-right w-14">
                    <button onClick={() => onSelectCoin(t.symbol)} className="bg-primary text-white text-[9px] font-black px-2.5 py-1.5 rounded-lg uppercase">Buy</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialView;

