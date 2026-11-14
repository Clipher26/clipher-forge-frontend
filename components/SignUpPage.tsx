import React, { useEffect, useRef, useState } from 'react';
import { User } from '../types';
import api from '../api';
import { getSupabase } from '../supabase';
import { fetchConfig, getConfig } from '../config';

interface SignUpPageProps {
  onBack: () => void;
  onSuccess: (user: User) => void;
  onViewPrivacy: () => void;
  onViewRefund: () => void;
}

const SignUpPage: React.FC<SignUpPageProps> = ({ onBack, onSuccess, onViewPrivacy, onViewRefund }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [invCode, setInvCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const captchaRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<any>(null);
  const [hcaptchaSiteKey, setHcaptchaSiteKey] = useState(getConfig().hcaptchaSiteKey || '');

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

   const handleSignUp = async () => {
    const em = email.trim().toLowerCase();
    if (!em || !em.includes('@')) { setError('Please enter a valid email address'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (!agreed) { setError('You must agree to the policies'); return; }
    if (hcaptchaSiteKey && !captchaToken) { setError('Please complete the captcha'); return; }

    setError('');
    setLoading(true);
    try {
      const { data, error: aerr } = await getSupabase().auth.signUp({
        email: em,
        password,
        options: { data: { invitationCode: invCode || undefined }, captchaToken, emailRedirectTo: window.location.origin } as any,
      });
      if (aerr) throw aerr;
      const session = data?.session;
      if (session?.access_token && session?.refresh_token) {
        try { await getSupabase().auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token }); } catch {}
        const me = await api.get('/api/auth/me');
        onSuccess({ ...me.data, balance: Number(me.data?.balance) || 0 } as User);
        return;
      }
      // Email confirmation required by Supabase settings
      try {
        await api.post('/api/auth/resend-confirmation', { email: em });
      } catch {}
      setError('Account created. Please check your email and confirm your account, then sign in.');
    } catch (e: any) {
      const msg = e?.message || 'Registration failed';
      setError(msg.toLowerCase().includes('captcha') ? 'Captcha failed. Please complete it again and retry.' : msg);
      try { (window as any).hcaptcha?.reset(widgetIdRef.current); } catch {}
      setCaptchaToken('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white animate-in fade-in duration-500">
      <header className="bg-gold-metallic h-12 flex items-center px-4 justify-between sticky top-0 z-50 shadow-sm">
        <button onClick={onBack} className="text-white text-xl">
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <h1 className="text-white font-bold text-sm tracking-tight uppercase italic">Sign up</h1>
        <div className="w-6"></div>
      </header>

      <div className="flex-1 flex flex-col items-center px-8 pt-12 overflow-y-auto pb-12">
        <div className="mb-10">
          <div className="relative w-32 h-32">
            <div className="absolute inset-0 rounded-full border-[3px] border-gold-dark opacity-40"></div>
            <div className="absolute inset-1.5 rounded-full border-[3px] border-gold shadow-[0_0_15px_rgba(212,175,55,0.4)]"></div>
            <div className="absolute inset-3 rounded-full bg-gold-gradient shadow-inner flex items-center justify-center border border-white/20">
              <span className="text-6xl font-black text-[#5c4014] tracking-tighter drop-shadow-md select-none">CF</span>
            </div>
          </div>
        </div>

        <div className="w-full space-y-4 max-w-sm">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="w-full bg-[#f8f9fa] border-none rounded-md py-4 px-6 text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-gold outline-none transition-all"
          />
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            className="w-full bg-[#f8f9fa] border-none rounded-md py-4 px-6 text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-gold outline-none transition-all"
          />
          <input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            className="w-full bg-[#f8f9fa] border-none rounded-md py-4 px-6 text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-gold outline-none transition-all"
          />
          <input
            type="text"
            placeholder="Invitation code (optional)"
            value={invCode}
            onChange={(e) => setInvCode(e.target.value)}
            className="w-full bg-[#f8f9fa] border-none rounded-md py-4 px-6 text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-gold outline-none transition-all"
          />

          {hcaptchaSiteKey && <div ref={captchaRef} className="flex justify-center py-1" />}
          {error && <p className="text-xs text-red-600 text-center font-bold mt-2">{error}</p>}

          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            <span>I agree to the</span>
            <button type="button" onClick={onViewPrivacy} className="text-primary font-bold hover:underline">
              Privacy Policy
            </button>
            <span>and</span>
            <button type="button" onClick={onViewRefund} className="text-primary font-bold hover:underline">
              Refund Policy
            </button>
          </label>

          <div className="pt-4 space-y-3">
            <button
              onClick={handleSignUp}
              disabled={loading || !agreed}
              className="w-full bg-gold-metallic text-white py-3.5 rounded-md font-bold text-lg active:scale-[0.98] transition-all shadow-md disabled:opacity-70"
            >
              {loading ? 'Creating account...' : 'Sign up with email'}
            </button>
            <button
              onClick={onBack}
              className="w-full bg-gold text-white py-3.5 rounded-md font-bold text-lg active:scale-[0.98] transition-all shadow-md"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
