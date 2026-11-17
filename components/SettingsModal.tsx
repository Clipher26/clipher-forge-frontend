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
  const [recoveryLink, setRecoveryLink] = useState<string | null>(null);

  const loadMfa = async () => {
    try {
      const supabase = getSupabase();
      const { data } = await supabase.auth.mfa.listFactors();
      setMfaEnabled(!!(data?.totp && data.totp.length > 0));
      setMfaPending(!!(data?.all || []).some((f: any) => f.factor_type === 'totp' && f.status !== 'verified'));
    } catch { setMfaEnabled(false); setMfaPending(false); }
  };

  const handleMfaToggle = async (enable: boolean) => {
    if (enable === null || enable === undefined) return;
    if (!enable) {
      // Disable MFA directly via Supabase
      try {
        const supabase = getSupabase();
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const verified = (factors?.totp || []).find((f: any) => f.status === 'verified');
        if (verified) {
          await supabase.auth.mfa.unenroll({ factorId: verified.id });
        }
        setMfaEnabled(false);
        setMsg('MFA disabled');
      } catch (e: any) {
        setMfaEnabled(true); // revert toggle
        setMsg(e?.message || 'Failed to disable MFA');
      }
      return;
    }
    // Enable → open enrollment modal (QR scan required)
    setShowMfa(true);
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
      const res = await api.post('/api/auth/forgot-password', { email, redirectTo: window.location.origin });
      if (res.data?.recoveryLink) {
        setRecoveryLink(res.data.recoveryLink);
        setMsg('Recovery link generated. Copy it below to reset your password.');
      } else {
        setMsg(res.data?.message || 'Reset email sent. Check your inbox/spam.');
      }
    } catch (e: any) {
      setMsg(e?.response?.data?.message || e?.message || 'Failed to send reset email');
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
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-bold text-gray-800">MFA (Two-Factor Authentication)</p>
                <p className="text-[10px] text-gray-400">Require authenticator code on sign in</p>
              </div>
              <button
                onClick={() => { if (mfaEnabled) handleMfaToggle(false); else setShowMfa(true); }}
                className={`relative w-12 h-7 rounded-full ${mfaEnabled ? 'bg-primary' : 'bg-gray-200'} transition-colors`}
              >
                <span className={`absolute top-1 ${mfaEnabled ? 'right-2' : 'left-2'} w-5 h-5 rounded-full bg-white transition-transform transform ${mfaEnabled ? 'translate-x-4' : 'translate-x-0'}`}></span>
              </button>
            </div>
            <Row icon="fa-solid fa-lock" label="Withdrawal PIN" value={(user as any)?.withdrawalPin ? 'Set' : 'Not set'} onClick={() => setShowWithdrawPin(true)} />
            <Row icon="fa-solid fa-envelope-circle-check" label="Forgot password (send reset email)" onClick={forgotPassword} />
          </div>

          {msg && <p className="text-xs font-bold text-primary bg-white border border-gray-100 rounded-xl p-3">{msg}</p>}
          {recoveryLink && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-4">
              <p className="text-xs text-yellow-800 font-bold uppercase mb-2">Recovery Link</p>
              <input
                type="text"
                value={recoveryLink}
                readOnly
                className="w-full bg-white border border-yellow-300 rounded-lg py-2 px-3 text-xs font-mono text-yellow-900 outline-none select-all"
              />
              <button
                onClick={() => navigator.clipboard.writeText(recoveryLink).then(() => setMsg('Link copied to clipboard.'))}
                className="w-full mt-2 bg-yellow-600 text-white py-2 rounded-lg font-black uppercase text-xs hover:bg-yellow-700 transition-colors"
              >
                Copy Link
              </button>
            </div>
          )}

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
