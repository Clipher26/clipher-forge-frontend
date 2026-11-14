import React, { useState } from 'react';
import api from '../api';
import { getSupabase } from '../supabase';
import { User } from '../types';

interface AccountDeletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onDeleted: () => void;
}

const AccountDeletionModal: React.FC<AccountDeletionModalProps> = ({ isOpen, onClose, user, onDeleted }) => {
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const doDelete = async () => {
    if (confirmText.trim().toUpperCase() !== 'DELETE') { setError('Type DELETE to confirm.'); return; }
    setLoading(true); setError('');
    try {
      await api.delete('/api/account');
      try { await getSupabase().auth.signOut(); } catch {}
      onDeleted();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to delete account');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose}></div>
      <div className="relative bg-[#f8f9fa] w-full h-full md:max-w-md md:h-auto md:rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        <header className="bg-red-600 h-14 flex items-center px-4 shrink-0">
          <button onClick={onClose} className="text-white p-1"><i className="fa-solid fa-arrow-left text-2xl"></i></button>
          <h2 className="ml-4 text-white font-bold text-sm tracking-tight uppercase italic">Account Deletion</h2>
        </header>
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
            <p className="text-sm font-black text-red-700 uppercase mb-2">Permanent action</p>
            <p className="text-xs text-red-700 leading-relaxed">Deleting your account will remove your profile and data stored in Supabase/app records where applicable and sign you out. This cannot be undone. Active balances/withdrawals should be settled before deletion.</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3">
            <p className="text-xs text-gray-600">Account: <span className="font-bold">{user?.email || user?.name || user?.id}</span></p>
            <p className="text-[10px] text-gray-500 uppercase font-black">Type DELETE to confirm</p>
            <input value={confirmText} onChange={e=>setConfirmText(e.target.value)} placeholder="DELETE" className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-sm outline-none font-mono" />
            {error && <p className="text-xs text-red-600 font-bold">{error}</p>}
            <button onClick={doDelete} disabled={loading || confirmText.trim().toUpperCase()!=='DELETE'} className="w-full bg-red-600 text-white py-3 rounded-xl font-black uppercase text-xs disabled:opacity-40">{loading ? 'Deleting...' : 'Delete my account'}</button>
          </div>
        </div>
        <div className="p-6 bg-white shrink-0 border-t border-gray-50">
          <button onClick={onClose} className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-black uppercase text-xs">Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default AccountDeletionModal;
