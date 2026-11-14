import React, { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '../supabase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onChanged?: () => void;
}

type Mode = 'loading' | 'enroll' | 'enabled' | 'error';

// TOTP enrollment/verification via Supabase Auth (auth.mfa.*).
// Notes:
//  - Supabase keeps unverified factors around, and listFactors() only returns *verified* ones.
//    A half-finished enrollment therefore makes the UI look "Disabled" while silently blocking a
//    clean re-enroll, so we delete dangling unverified factors before creating a new one.
//  - Verification requires the challenge to be created AFTER the enrollment (same factor id).
const MFAModal: React.FC<Props> = ({ isOpen, onClose, onChanged }) => {
  const [mode, setMode] = useState<Mode>('loading');
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qr, setQr] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const reset = () => {
    setMode('loading');
    setFactorId(null);
    setQr('');
    setSecret('');
    setCode('');
    setError('');
    setLoading(false);
    setCopied(false);
  };

  const bootstrap = useCallback(async () => {
    reset();
    try {
      const supabase = getSupabase();
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setMode('error');
        setError('You must be signed in to manage MFA. Please sign in again.');
        return;
      }

      // 1) Clear dangling unverified TOTP factors so enrollment can start clean.
      const { data: factors, error: lerr } = await supabase.auth.mfa.listFactors();
      if (lerr) {
        setMode('error');
        setError(lerr.message);
        return;
      }
      const dangling = (factors?.all || []).filter((f: any) => f.factor_type === 'totp' && f.status !== 'verified');
      for (const f of dangling) {
        await supabase.auth.mfa.unenroll({ factorId: (f as any).id });
      }

      // 2) Already protected → show enabled state with a disable option.
      if ((factors?.totp || []).length > 0) {
        setMode('enabled');
        setFactorId((factors!.totp[0] as any).id);
        return;
      }

      // 3) Start a fresh enrollment.
      const { data, error: e } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Clipher Forge' });
      if (e) {
        setMode('error');
        setError(e.message);
        return;
      }
      setFactorId(data.id);
      setQr(data.totp?.qr_code || '');
      setSecret(data.totp?.secret || '');
      setMode('enroll');
    } catch (e: any) {
      setMode('error');
      setError(e?.message || 'MFA setup failed. Please try again.');
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    bootstrap();
  }, [isOpen, bootstrap]);

  const verify = async () => {
    if (!factorId || code.trim().length < 6) return;
    setLoading(true);
    setError('');
    try {
      const supabase = getSupabase();
      // A challenge is single-use and short-lived; create it at verify time.
      const { data: challenge, error: ce } = await supabase.auth.mfa.challenge({ factorId });
      if (ce) {
        setError(ce.message);
        setLoading(false);
        return;
      }
      const { error: ve } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code: code.trim() });
      if (ve) {
        setError(/invalid|expired|token/i.test(ve.message)
          ? 'That code is invalid or expired. Check your authenticator app and try again.'
          : ve.message);
        setLoading(false);
        return;
      }
      setMode('enabled');
      setCode('');
      onChanged?.();
    } catch (e: any) {
      setError(e?.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const disable = async () => {
    if (!factorId) return;
    if (!window.confirm('Disable two-factor authentication for this account?')) return;
    setLoading(true);
    setError('');
    try {
      const supabase = getSupabase();
      const { error: ue } = await supabase.auth.mfa.unenroll({ factorId });
      if (ue) {
        setError(ue.message);
        setLoading(false);
        return;
      }
      onChanged?.();
      await bootstrap();
    } catch (e: any) {
      setError(e?.message || 'Could not disable MFA.');
      setLoading(false);
    }
  };

  const copySecret = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard blocked */ }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-black uppercase italic tracking-tight text-gray-900">Multi-Factor Authentication</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><i className="fa-solid fa-xmark text-lg"></i></button>
        </div>

        {mode === 'loading' && (
          <div className="flex flex-col items-center py-8 gap-3 text-gray-500">
            <i className="fa-solid fa-spinner animate-spin text-xl text-primary"></i>
            <p className="text-xs font-medium">Preparing MFA…</p>
          </div>
        )}

        {mode === 'error' && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">{error}</div>
            <button onClick={bootstrap} className="w-full bg-primary text-white py-3 rounded-xl font-bold text-xs uppercase">Try again</button>
          </div>
        )}

        {mode === 'enabled' && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <i className="fa-solid fa-shield-halved text-2xl text-green-600 mb-2"></i>
              <p className="text-sm font-bold text-green-700">Two-factor authentication is enabled</p>
              <p className="text-[11px] text-green-600 mt-1">You&apos;ll be asked for a 6-digit code each time you sign in.</p>
            </div>
            <button onClick={disable} disabled={loading} className="w-full border border-red-200 text-red-600 py-3 rounded-xl font-bold text-xs uppercase disabled:opacity-50">
              {loading ? 'Working…' : 'Disable MFA'}
            </button>
          </div>
        )}

        {mode === 'enroll' && (
          <div className="space-y-4">
            <p className="text-xs text-gray-600">
              Scan this QR code with Google Authenticator, Authy, or any TOTP app.
            </p>
            {qr && <img src={qr} alt="MFA QR code" className="mx-auto w-40 h-40 border border-gray-100 rounded-xl bg-white" />}
            {secret && (
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Can&apos;t scan? Enter this key manually</p>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-[11px] font-mono break-all text-gray-700">{secret}</code>
                  <button onClick={copySecret} className="text-[10px] font-black text-primary uppercase shrink-0">{copied ? 'Copied' : 'Copy'}</button>
                </div>
              </div>
            )}
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              placeholder="Enter 6-digit code"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center text-lg font-bold tracking-widest focus:ring-1 focus:ring-primary outline-none"
            />
            {error && <p className="text-xs text-red-600 font-bold text-center">{error}</p>}
            <div className="flex gap-2">
              <button onClick={verify} disabled={loading || code.length < 6} className="flex-1 bg-primary text-white py-3 rounded-xl font-bold text-xs uppercase disabled:opacity-50">
                {loading ? 'Verifying…' : 'Verify & enable'}
              </button>
              <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl font-bold text-xs uppercase">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MFAModal;