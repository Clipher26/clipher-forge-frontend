import React, { useEffect, useRef, useState } from 'react';
import { User } from '../types';
import { getSupabase } from '../supabase';
import api from '../api';
import { fetchConfig, getConfig } from '../config';

interface LoginPageProps {
  onBack: () => void;
  onLoginSuccess: (user: User) => void;
  onSignUpClick: () => void;
  onForgetPassword: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onBack, onLoginSuccess, onSignUpClick, onForgetPassword }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // MFA (TOTP) challenge state: set after a password sign-in when a verified factor exists.
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaChallengeId, setMfaChallengeId] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [pendingSession, setPendingSession] = useState<any>(null);
  const [captchaToken, setCaptchaToken] = useState('');
  const captchaRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<any>(null);
  const [hcaptchaSiteKey, setHcaptchaSiteKey] = useState(getConfig().hcaptchaSiteKey || '');
  const [showForgot, setShowForgot] = useState(false);
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotRecoveryLink, setForgotRecoveryLink] = useState<string | null>(null);

  useEffect(() => {
    fetchConfig().then((c) => {
      if (c?.hcaptchaSiteKey) setHcaptchaSiteKey(c.hcaptchaSiteKey);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!hcaptchaSiteKey || !captchaRef.current) return;
    widgetIdRef.current = null;
    if (captchaRef.current) captchaRef.current.innerHTML = '';
    const render = () => {
      const h = (window as any).hcaptcha;
      if (!h || !captchaRef.current || widgetIdRef.current != null) return;
      try {
        widgetIdRef.current = h.render(captchaRef.current, {
          sitekey: hcaptchaSiteKey,
          callback: (t: string) => setCaptchaToken(t),
          'expired-callback': () => setCaptchaToken(''),
          'error-callback': () => setCaptchaToken(''),
        });
      } catch {}
    };
    render();
    const t = setInterval(render, 300);
    return () => clearInterval(t);
  }, [hcaptchaSiteKey]);

   const handleSignIn = async () => {
    const em = email.trim().toLowerCase();
    if (!em || !em.includes('@')) { setError('Please enter a valid email address'); return; }
    if (!password) { setError('Please enter your password'); return; }
    if (hcaptchaSiteKey && !captchaToken) { setError('Please complete the captcha'); return; }
    setIsLoading(true);
    setError('');
    try {
      const { data, error: aerr } = await getSupabase().auth.signInWithPassword({ email: em, password, options: { captchaToken } as any });
      if (aerr) throw aerr;
      // MFA enforcement: if a verified TOTP factor exists, Supabase returns an AAL1 session and we
      // must challenge + verify before completing sign-in. (listFactors() only returns verified factors.)
      const { data: factors } = await getSupabase().auth.mfa.listFactors();
      const factorId = factors?.totp?.[0]?.id;
      if (factorId) {
        const { data: challenge, error: ce } = await getSupabase().auth.mfa.challenge({ factorId });
        if (ce) throw ce;
        setMfaFactorId(factorId);
        setMfaChallengeId(challenge.id);
        setMfaCode('');
        setPendingSession(data?.session ?? null);
        return;
      }
      await completeLogin(data?.session ?? null);
    } catch (e: any) {
      const status = e?.response?.status;
      const msg = e?.response?.data?.message || e?.message || '';
      if (status === 429) setError(msg || 'Too many login attempts. Please wait and try again.');
      else if (/email not confirmed/i.test(msg)) setError('Email not confirmed. Please check your inbox for the confirmation link from Supabase.');
      else if (/captcha/i.test(msg)) { setError('Captcha failed or expired. Please complete it again.'); try { (window as any).hcaptcha?.reset(widgetIdRef.current); } catch {} setCaptchaToken(''); }
      else setError(msg || 'Sign in failed. Please check your email and password.');
    } finally {
      setIsLoading(false);
    }
  };

  // Shared tail of sign-in: persist the Supabase session in the browser client, then load the profile.
  const completeLogin = async (session: any) => {
    if (session?.access_token && session?.refresh_token) {
      try { await getSupabase().auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token }); } catch {}
    }
    const me = await api.get('/api/auth/me');
    onLoginSuccess({ ...me.data, balance: Number(me.data?.balance) || 0 } as User);
  };

  // MFA step: verify the authenticator code, then finish sign-in.
  const handleMfaVerify = async () => {
    if (!mfaFactorId || !mfaChallengeId) return;
    if (mfaCode.trim().length !== 6) { setError('Enter the 6-digit code from your authenticator app'); return; }
    setIsLoading(true);
    setError('');
    try {
      const { error: ve } = await getSupabase().auth.mfa.verify({ factorId: mfaFactorId, challengeId: mfaChallengeId, code: mfaCode.trim() });
      if (ve) {
        setError(/invalid|expired|token/i.test(ve.message) ? 'Invalid or expired code. Check your authenticator app and try again.' : ve.message);
        // The challenge is single-use; start a fresh one for the retry.
        const { data: ch, error: ce } = await getSupabase().auth.mfa.challenge({ factorId: mfaFactorId });
        if (!ce && ch?.id) setMfaChallengeId(ch.id);
        return;
      }
      await completeLogin(pendingSession);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'MFA verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const em = email.trim().toLowerCase();
    if (!em || !em.includes('@')) { setForgotError('Enter your email address above first'); return; }
    setForgotLoading(true); setForgotError(''); setForgotMsg(''); setForgotRecoveryLink(null);
    try {
      const res = await api.post('/api/auth/forgot-password', { email: em, redirectTo: window.location.origin });
      if (res.data?.recoveryLink) {
        setForgotRecoveryLink(res.data.recoveryLink);
        setForgotMsg('Recovery link generated. Copy it below to reset your password.');
      } else {
        setForgotMsg(res.data?.message || 'Password reset email sent. Check your inbox/spam.');
      }
    } catch (e: any) {
      setForgotError(e?.response?.data?.message || e?.message || 'Failed to send reset email');
    } finally { setForgotLoading(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSignIn(); };

  return (
    <div className="flex flex-col min-h-screen bg-white animate-in fade-in duration-500 max-w-md mx-auto">
      <header className="bg-primary h-12 flex items-center px-4 justify-between sticky top-0 z-50">
        <button onClick={onBack} className="text-white text-xl p-2 hover:opacity-80 transition-opacity">
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <h1 className="text-white font-bold text-sm tracking-tight uppercase italic">Sign in</h1>
        <div className="w-6"></div>
      </header>

      <div className="flex-1 flex flex-col items-center px-8 pt-12">
        <div className="mb-10">
          <div className="relative w-32 h-32">
            <div className="absolute inset-0 rounded-full border-[3px] border-primary-dark opacity-40"></div>
            <div className="absolute inset-1.5 rounded-full border-[3px] border-primary shadow-[0_0_15px_rgba(212,175,55,0.4)]"></div>
            <div className="absolute inset-3 rounded-full bg-gold-gradient shadow-inner flex items-center justify-center border border-white/20">
              <span className="text-6xl font-black text-[#5c4014] tracking-tighter drop-shadow-md select-none">CF</span>
            </div>
          </div>
        </div>

        <div className="w-full space-y-4">
          {mfaFactorId ? (
            <>
              <div className="bg-primary/5 border border-primary/15 rounded-md p-4 text-center">
                <i className="fa-solid fa-shield-halved text-primary text-xl mb-1"></i>
                <p className="text-sm font-black text-gray-800 uppercase">Two-factor authentication</p>
                <p className="text-[11px] text-gray-500 mt-1">Enter the 6-digit code from your authenticator app.</p>
              </div>
              <input
                type="text"
                inputMode="numeric"
                placeholder="6-digit code"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={(e) => { if (e.key === 'Enter') handleMfaVerify(); }}
                autoFocus
                className="w-full bg-[#f8f9fa] border-none rounded-md py-4 px-6 text-center text-2xl font-black tracking-[0.4em] text-gray-800 placeholder:text-base placeholder:font-medium placeholder:tracking-normal placeholder:text-gray-400 focus:ring-1 focus:ring-primary outline-none transition-all"
              />
              {error && <p className="text-[11px] text-red-600 text-center font-bold">{error}</p>}
              <div className="pt-2 space-y-3">
                <button
                  onClick={handleMfaVerify}
                  disabled={isLoading || mfaCode.length !== 6}
                  className="w-full bg-secondary text-white py-4 rounded-md font-bold text-lg active:scale-[0.98] transition-all shadow-sm disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {isLoading ? <><i className="fa-solid fa-spinner animate-spin"></i> Verifying...</> : 'Verify code'}
                </button>
                <button
                  onClick={() => { setMfaFactorId(null); setMfaChallengeId(null); setMfaCode(''); setError(''); }}
                  className="w-full text-gray-500 font-bold text-sm uppercase py-2"
                >
                  Use a different account
                </button>
              </div>
            </>
          ) : (
            <>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="email"
            className="w-full bg-[#f8f9fa] border-none rounded-md py-4 px-6 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-1 focus:ring-primary outline-none transition-all"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="current-password"
            className="w-full bg-[#f8f9fa] border-none rounded-md py-4 px-6 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-1 focus:ring-primary outline-none transition-all"
          />

          {hcaptchaSiteKey && <div ref={captchaRef} className="flex justify-center py-1" />}
          {error && <p className="text-[11px] text-red-600 text-center font-bold">{error}</p>}

          <div className="pt-2 space-y-3">
            <button
              onClick={handleSignIn}
              disabled={isLoading}
              className="w-full bg-secondary text-white py-4 rounded-md font-bold text-lg active:scale-[0.98] transition-all shadow-sm disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isLoading ? <><i className="fa-solid fa-spinner animate-spin"></i> Signing in...</> : 'Sign in with email'}
            </button>
            <button
              onClick={onSignUpClick}
              className="w-full bg-primary text-white py-4 rounded-md font-bold text-lg active:scale-[0.98] transition-all shadow-sm"
            >
              Sign up
            </button>
          </div>

          <div className="text-center pt-4 space-y-2">
            <button onClick={() => { setShowForgot(v => !v); setForgotMsg(''); setForgotError(''); }} className="text-gray-900 font-medium text-base hover:text-primary transition-colors">
              Forgot password?
            </button>
            {showForgot && (
              <div className="mt-2 bg-gray-50 border border-gray-100 rounded-xl p-3 space-y-2 text-left">
                <p className="text-[11px] text-gray-600">We’ll send a password reset link to <span className="font-bold">{email.trim() || 'your email'}</span>.</p>
                {forgotMsg && <p className="text-[11px] text-green-700 font-bold">{forgotMsg}</p>}
                {forgotError && <p className="text-[11px] text-red-600 font-bold">{forgotError}</p>}
                {forgotRecoveryLink && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-[10px] text-yellow-800 font-bold uppercase mb-1">Recovery Link</p>
                    <input
                      type="text"
                      value={forgotRecoveryLink}
                      readOnly
                      className="w-full bg-white border border-yellow-300 rounded py-1 px-2 text-[10px] font-mono text-yellow-900 outline-none select-all"
                    />
                    <button
                      onClick={() => navigator.clipboard.writeText(forgotRecoveryLink).then(() => setForgotMsg('Link copied to clipboard.'))}
                      className="w-full mt-1 bg-yellow-600 text-white py-1 rounded font-black uppercase text-[10px] hover:bg-yellow-700 transition-colors"
                    >
                      Copy Link
                    </button>
                  </div>
                )}
                <button onClick={handleForgotPassword} disabled={forgotLoading} className="w-full bg-primary text-white py-2 rounded-lg text-xs font-black uppercase disabled:opacity-60">
                  {forgotLoading ? 'Sending...' : 'Send reset email'}
                </button>
              </div>
            )}
          </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
