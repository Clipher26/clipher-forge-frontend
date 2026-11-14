import React from 'react';
import api from '../api';
import { User } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
  onSignOut: () => void;
  onNavigate: (view: string) => void;
  referCode?: string;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, user, onSignOut, onNavigate, referCode = '' }) => {
  const [copied, setCopied] = React.useState(false);
  const [unread, setUnread] = React.useState(0);
  const isAuthenticated = !!user;

  React.useEffect(() => {
    if (!isOpen || !isAuthenticated) return;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await api.get('/api/notifications/unread-count');
        if (!cancelled) setUnread(Number(res.data?.count || 0));
      } catch {
        if (!cancelled) setUnread(0);
      }
    };
    load();
    const t = setInterval(load, 15000);
    return () => { cancelled = true; clearInterval(t); };
  }, [isOpen, isAuthenticated]);

  if (!isOpen) return null;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const menuItems = [
    { id: 'admin', label: 'Project Management', icon: 'fa-solid fa-gauge-high', isAdminOnly: true },
    { id: 'notifications', label: 'Notifications', icon: 'fa-regular fa-bell', badge: unread },
    { id: 'auth', label: 'Authentication', icon: 'fa-regular fa-id-card' },
    { id: 'orders', label: 'Contract order', icon: 'fa-regular fa-file-lines' },
    { id: 'recharge_rec', label: 'Recharge record', icon: 'fa-regular fa-list-alt' },
    { id: 'withdraw_rec', label: 'Withdraw record', icon: 'fa-regular fa-file-alt' },
    { id: 'withdraw_method', label: 'Withdrawal method', icon: 'fa-regular fa-credit-card' },
    { id: 'withdraw_pin', label: 'Withdrawal PIN', icon: 'fa-solid fa-lock' },
    { id: 'password', label: 'Password', icon: 'fa-solid fa-shield-halved' },
    { id: 'settings', label: 'Settings', icon: 'fa-solid fa-gear' },
    { id: 'about', label: 'About Us', icon: 'fa-solid fa-circle-exclamation' },
    { id: 'signout', label: 'Sign out', icon: 'fa-solid fa-right-from-bracket', isSignOut: true },
  ];

  const handleSignOut = () => {
    onSignOut();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-[#f8f9fa] animate-in fade-in duration-300 overflow-y-auto pb-24">
        {/* Header Section */}
        <div className="bg-[#fcc514] pt-4 pb-10 flex flex-col items-center relative">
          <button 
            onClick={onClose}
            className="absolute left-4 top-4 text-white hover:opacity-80 transition-all p-1"
          >
            <i className="fa-solid fa-arrow-left text-2xl drop-shadow-[0_0_8px_rgba(0,0,0,0.2)]"></i>
          </button>
          <button
            onClick={() => onNavigate('notifications')}
            className="absolute right-4 top-4 text-white hover:opacity-80 transition-all p-1"
            aria-label="Notifications"
          >
            <i className="fa-regular fa-bell text-2xl drop-shadow-[0_0_8px_rgba(0,0,0,0.2)]"></i>
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </button>
          
          <div className="relative mb-3 mt-8">
            <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-sm overflow-hidden">
               <i className="fa-solid fa-user text-gray-200 text-5xl"></i>
            </div>
          </div>
          <h2 className="text-xl font-bold text-white mb-1">{isAuthenticated ? user?.name : 'Guest'}</h2>
          
          <p className="text-white/90 text-sm font-medium mb-3">
            {isAuthenticated ? (
              (user as any).adminRole === 'SUPER_ADMIN' ? 'Super Admin' :
              (user as any).adminRole === 'ADMIN' ? 'Admin' :
              (user as any).adminRole === 'MODERATOR' ? 'Moderator' :
              (user as any).adminRole === 'SUPPORT' ? 'Support' :
              user.role === 'Senior Officer' ? 'Senior Operator' :
              'Member'
            ) : 'Please sign in to view your profile'}
          </p>
          
          {!isAuthenticated && (
            <div className="mt-4 flex flex-col items-center gap-2">
              <button
                onClick={() => { onClose(); window.location.href = '/'; }}
                className="w-32 bg-white text-[#1a1a1a] py-2 px-4 rounded-md font-bold text-sm hover:bg-gray-100 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => { onClose(); }}
                className="w-32 bg-white/20 border border-white/30 text-white py-2 px-4 rounded-md font-bold text-sm hover:bg-white/30 transition-colors"
              >
                Browse
              </button>
            </div>
          )}
          
          {isAuthenticated && (
            <div className="flex items-center gap-1 bg-black/10 px-4 py-1.5 rounded-full border border-white/10">
              <span className="text-[11px] text-white font-medium">Invitation code: {referCode}</span>
              <button onClick={copyToClipboard} className="text-white ml-1">
                <i className={`fa-regular ${copied ? 'fa-check-circle' : 'fa-copy'} text-[10px]`}></i>
              </button>
            </div>
          )}
        </div>

        {/* Assets Summary Card */}
        <div className="mx-4 -mt-8 bg-white rounded-xl py-6 px-4 shadow-[0_4px_20px_rgba(0,0,0,0.05)] flex justify-between items-center border border-gray-100 z-10">
            {isAuthenticated ? (
            <>
                <div className="text-center flex-1">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">BALANCE</p>
                    <p className="text-lg font-black text-gray-800">${(user.balance || 0).toFixed(2)}</p>
                </div>
                <div className="w-[1px] h-10 bg-gray-100"></div>
                <div className="text-center flex-1">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">TOTAL WITHDRAWAL</p>
                    <p className="text-lg font-black text-gray-800">${(user.totalWithdraw || 0).toFixed(2)}</p>
                </div>
            </>
            ) : (
            <>
                <div className="text-center flex-1">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">BALANCE</p>
                    <p className="text-lg font-black text-gray-800">--</p>
                </div>
                <div className="w-[1px] h-10 bg-gray-100"></div>
                <div className="text-center flex-1">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">TOTAL WITHDRAWAL</p>
                    <p className="text-lg font-black text-gray-800">--</p>
                </div>
            </>
            )}
        </div>

        {/* Menu Items */}
        <div className="mt-8 bg-white">
          {menuItems.filter(item => {
            if (item.isAdminOnly) return isAuthenticated && (user.isAdmin || user.role === 'Senior Officer');
            if (item.id === 'signout') return isAuthenticated;
            return true;
          }).map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (!isAuthenticated && item.id !== 'auth') {
                  return;
                }
                item.isSignOut ? handleSignOut() : onNavigate(item.id)
              }}
              className="w-full flex items-center px-6 py-5 border-b border-gray-50 active:bg-gray-50 transition-colors group"
            >
              <div className="w-8 flex justify-center text-gray-400">
                <i className={`${item.icon} text-lg`}></i>
              </div>
              <span className="flex-1 text-left text-sm font-medium ml-4 text-gray-600">{item.label}</span>
              {item.id === 'notifications' && (item.badge || 0) > 0 && (
                <span className="mr-2 min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center">
                  {(item.badge || 0) > 99 ? '99+' : item.badge}
                </span>
              )}
              <i className="fa-solid fa-chevron-right text-gray-200 text-[10px]"></i>
            </button>
          ))}
        </div>

        <div className="mt-12 text-center pb-8">
           <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest italic">CLIPHER FORGE GLOBAL V2.5.0 SAFE TERMINAL</p>
        </div>
    </div>
  );
};

export default ProfileModal;
