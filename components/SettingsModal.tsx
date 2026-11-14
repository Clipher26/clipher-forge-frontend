import React, { useEffect, useState } from 'react';
import api from '../api';
import { getSupabase } from '../supabase';
import { User } from '../types';
import MFAModal from './MFAModal';
import PasswordModal from './PasswordModal';
import AccountDeletionModal from './AccountDeletionModal';
import WithdrawalMethodModal from './WithdrawalMethodModal';
import WithdrawalPinModal from './WithdrawalPinModal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onNavigatePolicy: (view: 'privacy' | 'refund') => void;
  onUpdateUser: (userId: string, updates: Partial<User>) => void;
  onRefreshUser?: () => Promise<void> | void;
  onDeleted: () => void;
}

const SUPPORT_BOT = 'https://t.me/ClipherForgeExchangeUpload_bot';

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, user, onNavigatePolicy, onUpdateUser, onRefreshUser, onDeleted }) => {
  const [mfaEnabled, setMfaEnabled] = useState<boolean | null>(null);
  const [mfaPending, setMfaPending] = useState(false);
  const [showMfa, setShowMfa] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showWithdrawPin, setShowWithdrawPin] = useState(false);
  const [msg, setMsg] = useState('');

  const loadMfa = async () => {
    try {
      const supabase = getSupabase();
      const { data } = await supabase.auth.mfa.listFactors();
      // listFactors().totp only contains *verified* factors; .all also exposes a half-finished
      // enrollment, which is why the row used to read "Disabled" even though a factor existed.
      setMfaEnabled(!!(data?.totp && data.totp.length > 0));
      setMfaPending(!!(data?.all || []).some((f: any) => f.factor_type === 'totp' && f.status !== 'verified'));
    } catch { setMfaEnabled(false); setMfaPending(false); }
  };

  const handlePinSet = async () => {
    // Re-fetch the profile so "Withdrawal PIN: Set/Not set" reflects the DB immediately
    // (the local user object only changes after /api/auth/me returns the new hash).
    setMsg('Withdrawal PIN updated successfully');
    try { await onRefreshUser?.(); } catch {}
  };

  useEffect(() => { if (isOpen) { loadMfa(); setMsg(''); } }, [isOpen, showMfa]);

  if (!isOpen) return null;

  const forgotPassword = async () => {
    const email = String(user?.email || '').trim().toLowerCase();
    if (!email) { setMsg('No email on account. Contact support.'); return; }
    try {
      await api.post('/api/auth/forgot-password', { email });
      setMsg('Reset email sent. Check your inbox/spam.');
    } catch (e: any) {
      try { const { error } = await getSupabase().auth.resetPasswordForEmail(email, { redirectTo: window.location.origin }); if (error) throw error; setMsg('Reset email sent. Check your inbox/spam.'); }
      catch (e2: any) { setMsg(e2?.message || 'Failed to send reset email'); }
    }
  };

  const Row = ({ icon, label, value, onClick, danger }: any) => (
    <button onClick={onClick} className={`w-full flex items-center px-5 py-4 border-b border-gray-50 active:bg-gray-50 text-left ${danger ? 'text-red-600' : ''}`}>
      <div className={`w-8 flex justify-center ${danger ? 'text-red-400' : 'text-gray-400'}`}><i className={`${icon} text-base`}></i></div>
      <span className={`flex-1 text-sm font-medium ml-3 ${danger ? 'text-red-600' : 'text-gray-700'}`}>{label}</span>
      {value && <span className="text-[10px] font-bold text-gray-400 mr-2 uppercase">{value}</span>}
      <i className="fa-solid fa-chevron-right text-gray-200 text-[10px]"></i>
    </button>
  );

  return (
    <>
      <div className="fixed inset-0 z-[90] flex flex-col bg-[#f8f9fa] animate-in fade-in duration-300 overflow-y-auto pb-12">
        <header className="bg-primary h-14 flex items-center px-4 sticky top-0 z-10">
          <button onClick={onClose} className="text-white p-1"><i className="fa-solid fa-arrow-left text-2xl"></i></button>
          <h1 className="ml-4 text-white font-bold text-sm tracking-tight uppercase italic">Settings</h1>
        </header>

        <div className="p-4 space-y-4">
<div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-50"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Security</p></div>
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-800">Password</p>
                <p className="text-[10px] text-gray-400">Current: <span className="font-mono">••••••••••</span> (hidden)</p>
              </div>
              <button onClick={() => setShowPassword(true)} className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center" title="Reset/Change password"><i className="fa-solid fa-rotate-right"></i></button>
            </div>
            <Row icon="fa-solid fa-shield-halved" label="MFA (Multi-Factor Authentication)" value={mfaEnabled == null ? '...' : (mfaEnabled ? 'Enabled' : (mfaPending ? 'Pending' : 'Disabled'))} onClick={() => setShowMfa(true)} />
            <Row icon="fa-solid fa-lock" label="Withdrawal PIN" value={(user as any)?.withdrawalPin ? 'Set' : 'Not set'} onClick={() => setShowWithdrawPin(true)} />
            <Row icon="fa-solid fa-envelope-circle-check" label="Forgot password (send reset email)" onClick={forgotPassword} />
          </div>

          {msg && <p className="text-xs font-bold text-primary bg-white border border-gray-100 rounded-xl p-3">{msg}</p>}

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-50"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Account</p></div>
            <Row icon="fa-solid fa-wallet" label="Reset / manage withdrawal method" onClick={() => setShowWithdraw(true)} />
            <Row icon="fa-brands fa-telegram" label="Complaints & support" value="Telegram" onClick={() => window.open(SUPPORT_BOT, '_blank', 'noopener,noreferrer')} />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-50"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Legal & Policies</p></div>
            <Row icon="fa-solid fa-user-shield" label="Privacy policy" onClick={() => onNavigatePolicy('privacy')} />
            <Row icon="fa-solid fa-file-invoice-dollar" label="Refund policy" onClick={() => onNavigatePolicy('refund')} />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-50"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Danger Zone</p></div>
            <Row icon="fa-solid fa-user-xmark" label="Account deletion" danger onClick={() => setShowDelete(true)} />
          </div>

          <p className="text-[10px] text-gray-400 text-center px-4">Security settings use Supabase authentication. Passwords are never shown. Complaints/support: {SUPPORT_BOT}</p>
        </div>
      </div>

      <MFAModal isOpen={showMfa} onClose={() => { setShowMfa(false); loadMfa(); }} onChanged={loadMfa} />
      <PasswordModal isOpen={showPassword} onClose={() => setShowPassword(false)} user={user} />
      <AccountDeletionModal isOpen={showDelete} onClose={() => setShowDelete(false)} user={user} onDeleted={onDeleted} />
      <WithdrawalMethodModal isOpen={showWithdraw} onClose={() => setShowWithdraw(false)} currentAddress={user.withdrawalMethod} onSave={async (addr) => { await onUpdateUser(user.id, { withdrawalMethod: addr } as any); }} />
      <WithdrawalPinModal isOpen={showWithdrawPin} onClose={() => setShowWithdrawPin(false)} user={user} onPinSet={handlePinSet} />
    </>
  );
};

export default SettingsModal;
