
import React, { useState } from 'react';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AdminAuthModal: React.FC<AdminAuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [adminName, setAdminName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    // Authorized Administrative Credentials
    const authorizedAdmins = [
      { name: 'Akinro John', pass: 'AkinroJohn2008' },
      { name: 'Bello Oladimeji', pass: 'BelloOladimeji2026' },
      { name: 'Olusiku Oluwabukola', pass: 'OlusikuOluwabukola2026' }
    ];

    const isAdminValid = authorizedAdmins.some(
      admin => admin.name === adminName && admin.pass === password
    );

    if (isAdminValid) {
      onSuccess();
    } else {
      setError('AUTHENTICATION FAILED: INVALID OPERATOR CREDENTIALS');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative bg-[#0a0a0c] border-2 border-red-500/30 w-full max-sm rounded-2xl p-8 shadow-[0_0_50px_rgba(239,68,68,0.2)] animate-in zoom-in-95">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <i className="fa-solid fa-user-shield text-3xl text-red-500"></i>
          </div>
          <h2 className="text-xl font-black text-white italic tracking-tighter uppercase">Admin Command Center</h2>
          <p className="text-[10px] text-red-500/70 font-bold uppercase tracking-[0.3em] mt-1">Authorized Access Only</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest ml-1">Admin Name</label>
            <div className="relative">
              <i className="fa-solid fa-user absolute left-4 top-1/2 -translate-y-1/2 text-red-500/50 text-xs"></i>
              <input 
                type="text" 
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="Full Name"
                className="w-full bg-black border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white font-mono text-sm focus:border-red-500 outline-none transition-all"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest ml-1">Secure Password</label>
            <div className="relative">
              <i className="fa-solid fa-key absolute left-4 top-1/2 -translate-y-1/2 text-red-500/50 text-xs"></i>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-black border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white font-mono text-sm focus:border-red-500 outline-none transition-all"
              />
            </div>
          </div>
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-2 rounded animate-shake">
              <p className="text-[9px] text-red-500 font-bold uppercase text-center italic leading-tight">{error}</p>
            </div>
          )}
          
          <button 
            onClick={handleLogin}
            className="w-full bg-red-600 text-white py-4 rounded-lg font-black uppercase tracking-widest hover:bg-red-500 active:scale-95 transition-all mt-4 shadow-lg shadow-red-600/20"
          >
            Initiate Override
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-[8px] text-gray-600 font-black uppercase tracking-widest">Global Administrative Protocol v2.1</p>
        </div>
      </div>
    </div>
  );
};

export default AdminAuthModal;
