import React, { useEffect, useState } from 'react';

interface WithdrawalMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAddress?: string;
  onSave: (address: string) => void;
}

type Chain = 'TRC20' | 'BEP20';

const parseAddresses = (raw?: string): { TRC20: string; BEP20: string } => {
  if (!raw) return { TRC20: '', BEP20: '' };
  if (raw.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(raw);
      return { TRC20: parsed.TRC20 || '', BEP20: parsed.BEP20 || '' };
    } catch {
      return { TRC20: raw, BEP20: '' };
    }
  }
  return { TRC20: raw, BEP20: '' };
};

const WithdrawalMethodModal: React.FC<WithdrawalMethodModalProps> = ({ isOpen, onClose, currentAddress, onSave }) => {
  const [chain, setChain] = useState<Chain>('TRC20');
  const [addresses, setAddresses] = useState<{ TRC20: string; BEP20: string }>(parseAddresses(currentAddress));
  const [isSaving, setIsSaving] = useState(false);

  // Keep internal state in sync with the latest bound address (e.g. after a refresh)
  useEffect(() => {
    setAddresses(parseAddresses(currentAddress));
  }, [currentAddress]);

  if (!isOpen) return null;

  const currentAddr = addresses[chain];
  const isValid = currentAddr.length >= 20;

  const handleSave = async () => {
    if (!isValid) {
      alert(chain === 'TRC20' ? 'Invalid TRC-20 address format.' : 'Invalid BEP-20 address format.');
      return;
    }
    setIsSaving(true);
    try {
      const payload = JSON.stringify(addresses);
      await onSave(payload);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddressChange = (val: string) => {
    setAddresses(prev => ({ ...prev, [chain]: val }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={onClose}></div>

      <div className="relative bg-white w-full h-full md:max-w-md md:h-auto md:rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-300 flex flex-col">
        <header className="bg-primary h-12 flex items-center px-4 shrink-0 shadow-sm">
          <button onClick={onClose} className="text-white hover:opacity-80 transition-opacity">
            <i className="fa-solid fa-arrow-left text-xl"></i>
          </button>
          <h2 className="ml-4 text-white font-bold text-sm tracking-tight uppercase italic">Withdrawal Method</h2>
        </header>

        <div className="p-8 flex-1 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
              <i className="fa-solid fa-link text-2xl"></i>
            </div>
            <h3 className="text-lg font-black text-gray-800 uppercase italic tracking-tighter">Bind Wallet</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">USDT · TRC20 or BEP20</p>
          </div>

          {/* Network selector */}
          <div className="grid grid-cols-2 gap-3">
            {(['TRC20', 'BEP20'] as Chain[]).map((c) => (
              <button
                key={c}
                onClick={() => setChain(c)}
                className={`rounded-xl border-2 p-3 text-center transition-all ${chain === c ? 'border-primary bg-primary/5' : 'border-gray-100 bg-gray-50'}`}
              >
                <p className={`text-[10px] font-black uppercase ${chain === c ? 'text-primary' : 'text-gray-500'}`}>
                  {c === 'TRC20' ? 'TRC20 · Tron' : 'BEP20 · BSC'}
                </p>
                <p className="text-[9px] text-gray-400 mt-0.5">
                  {addresses[c] ? 'Bound' : 'Not set'}
                </p>
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div className="bg-orange-500/5 border border-orange-500/10 p-4 rounded-xl">
              <p className="text-[10px] text-orange-500 font-black uppercase leading-tight">
                <i className="fa-solid fa-triangle-exclamation mr-1"></i>
                Protocol Security Notice
              </p>
              <p className="text-[10px] text-gray-500 mt-1 italic">
                Once an address is bound, withdrawals are only permitted to this destination. Contact support to unbind.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest ml-1">
                USDT ({chain === 'TRC20' ? 'TRC-20' : 'BEP-20'}) Address
              </label>
              <input
                type="text"
                value={currentAddr}
                onChange={(e) => handleAddressChange(e.target.value)}
                placeholder={chain === 'TRC20' ? 'T...' : '0x...'}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-4 text-xs font-mono text-gray-800 focus:border-primary outline-none transition-all"
              />
            </div>

            {/* Show both bound addresses summary */}
            <div className="bg-gray-50 rounded-xl p-3 space-y-1">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Bound Addresses</p>
              <p className="text-[9px] text-gray-600 font-mono truncate">
                TRC20: {addresses.TRC20 || 'Not set'}
              </p>
              <p className="text-[9px] text-gray-600 font-mono truncate">
                BEP20: {addresses.BEP20 || 'Not set'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white shrink-0 border-t border-gray-50">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-primary text-white py-4 rounded-xl font-black uppercase tracking-widest active:scale-95 transition-all shadow-md disabled:opacity-50"
          >
            {isSaving ? <i className="fa-solid fa-spinner animate-spin"></i> : 'Confirm Wallet Bind'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WithdrawalMethodModal;
