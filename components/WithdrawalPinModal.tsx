import React, { useState } from 'react';
import api from '../api';

type PinStep = 'CHECK' | 'SET' | 'VERIFY' | 'RESET_OTP' | 'RESET_SET';

interface WithdrawalPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onPinSet: () => void;
}

const WithdrawalPinModal: React.FC<WithdrawalPinModalProps> = ({
  isOpen,
  onClose,
  user,
  onPinSet,
}) => {
  const [step, setStep] = useState<PinStep>('CHECK');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [newConfirmPin, setNewConfirmPin] = useState('');

  const hasPin = !!(user as any)?.withdrawalPin;

  React.useEffect(() => {
    if (isOpen) {
      setStep(hasPin ? 'VERIFY' : 'SET');
      setPin('');
      setConfirmPin('');
      setOtpCode('');
      setOtpSent(false);
      setError('');
      setNewPin('');
      setNewConfirmPin('');
    }
  }, [isOpen, hasPin]);

  const handleSendOtp = async () => {
    setOtpSending(true);
    setError('');
    try {
      await api.post('/api/withdrawals/pin/request-otp');
      setOtpSent(true);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to send verification code');
    } finally {
      setOtpSending(false);
    }
  };

  const handleSetPin = async () => {
    if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      setError('PIN must be 6 digits');
      return;
    }
    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/api/withdrawals/pin/set', { pin, confirmPin });
      onPinSet();
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to set PIN');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPin = async () => {
    if (!pin || pin.length !== 6) {
      setError('Enter your 6-digit PIN');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/api/withdrawals/pin/verify', { pin });
      setStep('RESET_OTP');
      setPin('');
      await handleSendOtp();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Invalid PIN');
    } finally {
      setLoading(false);
    }
  };

  const handleResetWithOtp = async () => {
    if (!otpCode || otpCode.length < 4) {
      setError('Enter the verification code sent to your email');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/api/withdrawals/pin/reset', { otpCode: otpCode.trim() });
      setStep('RESET_SET');
      setOtpCode('');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to reset PIN');
    } finally {
      setLoading(false);
    }
  };

  const handleSetNewPin = async () => {
    if (!newPin || newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
      setError('PIN must be 6 digits');
      return;
    }
    if (newPin !== newConfirmPin) {
      setError('PINs do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/api/withdrawals/pin/set', { pin: newPin, confirmPin: newConfirmPin });
      onPinSet();
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to set PIN');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose}></div>
      <div className="relative bg-white w-full h-full md:max-w-md md:h-auto md:rounded-3xl overflow-hidden shadow-2xl animate-in fade-in duration-300 flex flex-col">
        <header className="bg-primary h-14 flex items-center px-4 shrink-0 shadow-sm">
          <button
            onClick={() => {
              if (step === 'VERIFY' || step === 'RESET_OTP' || step === 'RESET_SET') {
                setStep(hasPin ? 'VERIFY' : 'SET');
              } else {
                onClose();
              }
            }}
            className="text-white p-1"
          >
            <i className="fa-solid fa-arrow-left text-2xl"></i>
          </button>
          <h2 className="ml-4 text-white font-black text-sm tracking-tight uppercase italic">
            {step === 'SET' || step === 'RESET_SET' ? 'Set Withdrawal PIN' : step === 'VERIFY' ? 'Verify PIN' : 'Reset PIN'}
          </h2>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-[10px] text-red-500 font-bold text-center">{error}</p>
            </div>
          )}

          {step === 'SET' && (
            <div className="space-y-5">
              <div className="text-center space-y-2 mb-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                  <i className="fa-solid fa-lock text-2xl"></i>
                </div>
                <h3 className="text-lg font-black text-gray-800 uppercase">Set Withdrawal PIN</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Create a 6-digit PIN for withdrawals</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">New PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  placeholder="6 digits"
                  maxLength={6}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-4 text-gray-800 font-bold tracking-widest text-center text-xl focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Confirm PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  value={confirmPin}
                  onChange={e => setConfirmPin(e.target.value)}
                  placeholder="6 digits"
                  maxLength={6}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-4 text-gray-800 font-bold tracking-widest text-center text-xl focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3">
                <p className="text-[10px] text-yellow-700 font-bold text-center uppercase leading-relaxed">
                  <i className="fa-solid fa-triangle-exclamation mr-1"></i>
                  This PIN is required for all withdrawals. Keep it secure and do not share it.
                </p>
              </div>
            </div>
          )}

          {step === 'VERIFY' && (
            <div className="space-y-5">
              <div className="text-center space-y-2 mb-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                  <i className="fa-solid fa-key text-2xl"></i>
                </div>
                <h3 className="text-lg font-black text-gray-800 uppercase">Verify Withdrawal PIN</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Enter your 6-digit PIN to manage settings</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Current PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  placeholder="6 digits"
                  maxLength={6}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-4 text-gray-800 font-bold tracking-widest text-center text-xl focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3">
                <p className="text-[10px] text-yellow-700 font-bold text-center uppercase leading-relaxed">
                  Forgot PIN? Use the reset option below.
                </p>
              </div>
            </div>
          )}

          {step === 'RESET_OTP' && (
            <div className="space-y-5">
              <div className="text-center space-y-2 mb-4">
                <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto text-orange-500">
                  <i className="fa-solid fa-rotate-left text-2xl"></i>
                </div>
                <h3 className="text-lg font-black text-gray-800 uppercase">Reset Withdrawal PIN</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Enter the code sent to your email</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Verification Code</p>
                  <button onClick={handleSendOtp} disabled={otpSending} className="text-[10px] font-black text-primary uppercase disabled:opacity-50">
                    {otpSending ? 'Sending...' : otpSent ? 'Resend' : 'Send Code'}
                  </button>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-4 text-gray-800 font-bold tracking-widest focus:ring-1 focus:ring-primary outline-none"
                />
                {otpSent && <p className="text-[10px] text-green-600 font-bold text-center">Code sent to your email. Expires in 10 minutes.</p>}
              </div>
            </div>
          )}

          {step === 'RESET_SET' && (
            <div className="space-y-5">
              <div className="text-center space-y-2 mb-4">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto text-green-500">
                  <i className="fa-solid fa-lock text-2xl"></i>
                </div>
                <h3 className="text-lg font-black text-gray-800 uppercase">Set New Withdrawal PIN</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Create a new 6-digit PIN</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">New PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  value={newPin}
                  onChange={e => setNewPin(e.target.value)}
                  placeholder="6 digits"
                  maxLength={6}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-4 text-gray-800 font-bold tracking-widest text-center text-xl focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Confirm PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  value={newConfirmPin}
                  onChange={e => setNewConfirmPin(e.target.value)}
                  placeholder="6 digits"
                  maxLength={6}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-4 text-gray-800 font-bold tracking-widest text-center text-xl focus:ring-1 focus:ring-primary outline-none"
                />
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-white border-t border-gray-50 shrink-0 space-y-3">
          {step === 'SET' && (
            <>
              <button
                onClick={handleSetPin}
                disabled={loading}
                className="w-full bg-primary text-white py-4 rounded-xl font-black uppercase tracking-widest active:scale-95 transition-all shadow-md disabled:opacity-40"
              >
                {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : 'Set PIN'}
              </button>
              <button onClick={onClose} className="w-full text-gray-400 text-xs font-bold uppercase">Cancel</button>
            </>
          )}

          {step === 'VERIFY' && (
            <>
              <button
                onClick={handleVerifyPin}
                disabled={loading}
                className="w-full bg-primary text-white py-4 rounded-xl font-black uppercase tracking-widest active:scale-95 transition-all shadow-md disabled:opacity-40"
              >
                {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : 'Verify'}
              </button>
              <button
                onClick={() => { setStep('RESET_OTP'); handleSendOtp(); }}
                className="w-full bg-orange-500 text-white py-4 rounded-xl font-black uppercase tracking-widest active:scale-95 transition-all"
              >
                Forgot PIN? Reset
              </button>
              <button onClick={onClose} className="w-full text-gray-400 text-xs font-bold uppercase">Cancel</button>
            </>
          )}

          {step === 'RESET_OTP' && (
            <>
              <button
                onClick={handleResetWithOtp}
                disabled={loading}
                className="w-full bg-primary text-white py-4 rounded-xl font-black uppercase tracking-widest active:scale-95 transition-all shadow-md disabled:opacity-40"
              >
                {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : 'Verify & Reset'}
              </button>
              <button onClick={() => setStep('VERIFY')} className="w-full text-gray-400 text-xs font-bold uppercase">Back</button>
            </>
          )}

          {step === 'RESET_SET' && (
            <>
              <button
                onClick={handleSetNewPin}
                disabled={loading}
                className="w-full bg-primary text-white py-4 rounded-xl font-black uppercase tracking-widest active:scale-95 transition-all shadow-md disabled:opacity-40"
              >
                {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : 'Set New PIN'}
              </button>
              <button onClick={onClose} className="w-full text-gray-400 text-xs font-bold uppercase">Cancel</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default WithdrawalPinModal;