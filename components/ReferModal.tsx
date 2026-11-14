
import React, { useState } from 'react';

interface ReferModalProps {
  isOpen: boolean;
  onClose: () => void;
  referCode: string;
}

const ReferModal: React.FC<ReferModalProps> = ({ isOpen, onClose, referCode }) => {
  const [copied, setCopied] = useState(false);
  const websiteUrl = window.location.origin;
  const referLink = `${websiteUrl}/join?ref=${referCode}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(referLink)}&bgcolor=ffffff`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose}></div>
      
      <div className="relative bg-dark-card border border-bybit/30 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="bg-bybit h-1.5 w-full"></div>
        
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-black text-white uppercase italic flex items-center gap-2 tracking-tighter">
                <i className="fa-solid fa-share-nodes text-bybit"></i>
                Refer & Earn
              </h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Global Expansion Protocol</p>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-white"><i className="fa-solid fa-xmark text-xl"></i></button>
          </div>

          <div className="space-y-6">
            {/* Promo Section */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
              <h3 className="text-lg font-black text-white italic tracking-tighter uppercase">UP TO $20 COMMISSION</h3>
              <p className="text-[10px] text-gray-400 mt-1 font-medium">
                $15 for 16 nodes | $20 for 20+ nodes. 
                Earn yield for every new operator link.
              </p>
            </div>

            {/* QR Code Section */}
            <div className="flex flex-col items-center justify-center py-2">
              <div className="p-3 bg-white rounded-2xl shadow-[0_0_20px_rgba(247,166,0,0.2)]">
                <img 
                  src={qrCodeUrl} 
                  alt="Referral QR Code" 
                  className="w-32 h-32 md:w-40 md:h-40 object-contain"
                  onError={(e) => { (e.target as any).src = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=error' }}
                />
              </div>
              <p className="text-[9px] text-bybit font-black uppercase tracking-[0.3em] mt-4 animate-pulse">Scan to Forge Access</p>
            </div>

            {/* Steps */}
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center space-y-1">
                <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center mx-auto text-[10px] font-black text-bybit border border-white/10">1</div>
                <p className="text-[8px] text-gray-500 font-bold uppercase">Share Link</p>
              </div>
              <div className="text-center space-y-1">
                <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center mx-auto text-[10px] font-black text-bybit border border-white/10">2</div>
                <p className="text-[8px] text-gray-500 font-bold uppercase">Node Link</p>
              </div>
              <div className="text-center space-y-1">
                <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center mx-auto text-[10px] font-black text-bybit border border-white/10">3</div>
                <p className="text-[8px] text-gray-500 font-bold uppercase">Earn Yield</p>
              </div>
            </div>

            {/* Link Section */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest ml-1">Referral Link</label>
              <div className="relative">
                <input 
                  type="text" 
                  readOnly 
                  value={referLink}
                  className="w-full bg-white border border-gray-100 rounded-xl py-3 pl-4 pr-24 text-gray-800 text-[10px] font-bold focus:border-primary outline-none shadow-sm"
                />
                <button 
                  onClick={copyToClipboard}
                  className="absolute right-1.5 top-1.5 bottom-1.5 bg-primary text-white px-4 rounded-lg text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-sm"
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-dark-border">
              <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                <span>Invited Nodes: 0</span>
                <span className="text-bybit">Allowance: $0.00</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferModal;
