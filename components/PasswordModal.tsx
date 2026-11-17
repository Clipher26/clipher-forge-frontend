import React, { useState } from 'react';
import api from '../api';
import { getSupabase } from '../supabase';
import { User } from '../types';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

const PasswordModal: React.FC<PasswordModalProps> = ({ isOpen, onClose, user }) => {
  const [mode, setMode] = useState<'menu' | 'reset-email' | 'change'>('menu');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [recoveryLink, setRecoveryLink] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetFields = () => { setNewPassword(''); setConfirm(''); setMsg(''); setError(''); setRecoveryLink(null); };

  const sendResetEmail = async () => {
    const email = String(user?.email || '').trim().toLowerCase();
    if (!email) { setError('No email on this account. Contact support.'); return; }
    setLoading(true); setError(''); setMsg(''); setRecoveryLink(null);
    try {
      const res = await api.post('/api/auth/forgot-password', { email, redirectTo: window.location.origin });
      if (res.data?.recoveryLink) {
        setRecoveryLink(res.data.recoveryLink);
        setMsg('Recovery link generated. Open the link below to reset your password.');
      } else {
        setMsg(res.data?.message || 'Password reset email sent. Check your inbox/spam.');
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to send reset email');
    } finally { setLoading(false); }
  };

  const changePassword = async () => {
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (newPassword !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true); setError(''); setMsg('');
    try {
      const { error: err } = await getSupabase().auth.updateUser({ password: newPassword });
      if (err) throw err;
      setMsg('Password updated successfully.');
      setNewPassword(''); setConfirm('');
    } catch (e: any) {
      setError(e?.message || 'Failed to update password. You may need to sign in again or use reset email.');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => { resetFields(); setMode('menu'); onClose(); }}></div>
      <div className="relative bg-[#f8f9fa] w-full h-full md:max-w-md md:h-auto md:max-h-[85vh] md:rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        <header className="bg-primary h-14 flex items-center px-4 shrink-0">
          <button onClick={() => { if (mode !== 'menu') { setMode('menu'); resetFields(); } else { resetFields(); onClose(); } }} className="text-white p-1"><i className="fa-solid fa-arrow-left text-2xl"></i></button>
          <h2 className="ml-4 text-white font-bold text-sm tracking-tight uppercase italic">Password & Security</h2>
        </header>
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Current Password</p>
            <div className="flex items-center justify-between">
              <span className="text-lg font-mono text-gray-700 tracking-widest">••••••••••</span>
              <span className="text-[10px] text-gray-400 font-bold uppercase"><i className="fa-solid fa-lock mr-1"></i>Protected</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-2 italic">For security, your current password is never displayed.</p>
          </div>

          {msg && <p className="text-xs text-green-700 font-bold bg-green-50 p-3 rounded-xl">{msg}</p>}
          {error && <p className="text-xs text-red-600 font-bold bg-red-50 p-3 rounded-xl">{error}</p>}
          {recoveryLink && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
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

          {mode === 'menu' && (
            <div className="space-y-3">
              <button onClick={sendResetEmail} disabled={loading} className="w-full bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between shadow-sm active:bg-gray-50">
                <div className="text-left">
                  <p className="text-sm font-bold text-gray-800">Reset password via email</p>
                  <p className="text-[10px] text-gray-500">Send Supabase reset link to {user?.email || 'your email'}</p>
                </div>
                <i className={`fa-solid ${loading ? 'fa-spinner animate-spin' : 'fa-envelope'} text-primary`}></i>
              </button>
              <button onClick={() => { setMode('change'); resetFields(); }} className="w-full bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between shadow-sm active:bg-gray-50">
                <div className="text-left">
                  <p className="text-sm font-bold text-gray-800">Set a new password</p>
                  <p className="text-[10px] text-gray-500">Update password for this signed-in session</p>
                </div>
                <i className="fa-solid fa-key text-primary"></i>
              </button>
            </div>
          )}

          {mode === 'reset-email' && (
            <div className="space-y-3 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <p className="text-sm font-bold text-gray-800">Reset link will be sent to</p>
              <p className="text-xs text-gray-600 font-mono">{user?.email || '(no email)'}</p>
              <button onClick={sendResetEmail} disabled={loading} className="w-full bg-primary text-white py-3 rounded-xl font-black uppercase text-xs disabled:opacity-50">{loading ? 'Sending...' : 'Send reset email'}</button>
            </div>
          )}

          {mode === 'change' && (
            <div className="space-y-3 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <p className="text-sm font-bold text-gray-800">Set new password</p>
              <input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="New password (min 6)" className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-sm outline-none" />
              <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Confirm new password" className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-sm outline-none" />
              <button onClick={changePassword} disabled={loading} className="w-full bg-primary text-white py-3 rounded-xl font-black uppercase text-xs disabled:opacity-50">{loading ? 'Updating...' : 'Update password'}</button>
            </div>
          )}
        </div>
        <div className="p-6 bg-white shrink-0 border-t border-gray-50">
          <button onClick={() => { resetFields(); setMode('menu'); onClose(); }} className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-black uppercase text-xs">Close</button>
        </div>
      </div>
    </div>
  );
};

export default PasswordModal;
