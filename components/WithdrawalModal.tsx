import React, { useState, useMemo, useEffect } from 'react';
import api from '../api';
import { User } from '../types';

// Tiered withdrawal fee, matching the backend /api/withdrawals enforcement.
// < $10 = 15% · $10–$20 = 19% · > $20 = 25%
function withdrawalFeeRate(amount: number): number {
  if (amount < 10) return 0.15;
  if (amount <= 20) return 0.19;
  return 0.25;
}

const MIN_WITHDRAWAL = 6;

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (amount: number) => void;
  onOpenSettings?: () => void;
  user?: User | null;
}

type WithdrawalChain = 'TRC20' | 'BEP20';
type WithdrawalStep = 'AMOUNT' | 'CONFIRM' | 'OTP_VERIFY' | 'PIN' | 'PROCESSING' | 'SUCCESS' | 'BLOCKED' | 'NO_ADDRESS' | 'NO_PIN';

const WithdrawalModal: React.FC<WithdrawalModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onOpenSettings,
  user,
}) => {
  const [step, setStep] = useState<WithdrawalStep>('AMOUNT');
  const [chain, setChain] = useState<WithdrawalChain>('TRC20');
  const [amount, setAmount] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [withdrawalCode, setWithdrawalCode] = useState<string | null>(null);

  const hasPin = !!(user as any)?.withdrawalPin;

  // Parse withdrawal addresses from user.withdrawalMethod (JSON string or legacy single address)
  const walletAddresses = useMemo(() => {
    const raw = (user as any)?.withdrawalMethod;
    if (!raw) return { TRC20: '', BEP20: '' };
    if (typeof raw === 'string') {
      if (raw.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(raw);
          return { TRC20: parsed.TRC20 || '', BEP20: parsed.BEP20 || '' };
        } catch {
          return { TRC20: raw, BEP20: '' };
        }
      }
      // Legacy: single address string assumed TRC20
      return { TRC20: raw, BEP20: '' };
    }
    return { TRC20: '', BEP20: '' };
  }, [user]);

  const address = walletAddresses[chain] || '';

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setOtpCode('');
      setPin('');
      setError('');
      setChain('TRC20');
      setWithdrawalCode(null);
      if (user?.isWithdrawalBlocked) {
        setStep('BLOCKED');
      } else if (!walletAddresses.TRC20 && !walletAddresses.BEP20) {
        setStep('NO_ADDRESS');
      } else if (!hasPin) {
        setStep('NO_PIN');
      } else {
        setStep('AMOUNT');
      }
    }
  }, [user, isOpen, walletAddresses, hasPin]);

  const unlockBal = Number((user as any)?.unlockBalance || 0);
  const parsedAmount = parseFloat(amount) || 0;
  const feeRate = withdrawalFeeRate(parsedAmount);
  const feeAmount = parsedAmount * feeRate;
  const netArrivalUSDT = parsedAmount - feeAmount;

  // Explicit reason why "Continue" cannot proceed (previously only a tiny error line after a click,
  // which made the button look broken when the amount exceeded the unlock balance).
  const blockReason = !address || address.length < 20
    ? `No ${chain} wallet address is bound. Bind one in Settings → Withdrawal method.`
    : parsedAmount <= 0
      ? ''
      : parsedAmount < MIN_WITHDRAWAL
        ? `Minimum withdrawal is $${MIN_WITHDRAWAL.toFixed(2)}.`
        : parsedAmount > unlockBal
          ? `Amount exceeds your withdrawable unlock balance of $${unlockBal.toFixed(2)}.`
          : '';

  const handleRequestWithdrawal = () => {
    if (!parsedAmount || parsedAmount < MIN_WITHDRAWAL) {
      setError(`Minimum withdrawal is $${MIN_WITHDRAWAL.toFixed(2)}`);
      return;
    }
    if (parsedAmount > unlockBal) {
      setError(`Amount exceeds available unlock balance: $${unlockBal.toFixed(2)}`);
      return;
    }
    if (!address || address.length < 20) {
      setError(`No ${chain} wallet address found. Please bind one in your profile.`);
      return;
    }
    setError('');
    setOtpCode('');
    setOtpSent(false);
    setStep('CONFIRM');
  };

  const handleConfirm = () => {
    if (!otpCode || otpCode.trim().length !== 6) { setError('Enter the 6-digit code from the Telegram bot'); return; }
    setError('');
    setStep('OTP_VERIFY');
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.trim().length !== 6) { setError('Enter the 6-digit code from the Telegram bot'); return; }
    setOtpVerifying(true);
    setError('');
    try {
      await api.post('/api/withdrawals/otp/verify', { code: otpCode.trim() });
      setStep('PIN');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Invalid or expired code. Please get a new one from the Telegram bot.');
      setStep('CONFIRM');
    } finally {
      setOtpVerifying(false);
    }
  };

  const handlePinConfirm = async () => {
    if (!pin || pin.length !== 6) { setError('Enter your 6-digit withdrawal PIN'); return; }
    setIsProcessing(true);
    setStep('PROCESSING');
    setError('');
    try {
      const res = await api.post('/api/withdrawals', {
        amount: parsedAmount,
        address,
        coin: 'USDT',
        chain,
        method: 'USDT',
        otpCode: otpCode.trim(),
        pin: pin.trim(),
      });

      if (res.data.success) {
        onSuccess(parsedAmount);
        setWithdrawalCode(res.data.code || null);
        setStep('SUCCESS');
      } else {
        setError(res.data.message || 'Withdrawal failed. Please try again.');
        setStep('AMOUNT');
      }
    } catch (e: any) {
      setError(e.response?.data?.message || 'Network error. Please try again.');
      setStep('AMOUNT');
    } finally {
      setIsProcessing(false);
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
              if (step === 'CONFIRM') setStep('AMOUNT');
              else onClose();
            }}
            className="text-white p-1"
          >
            <i className="fa-solid fa-arrow-left text-2xl"></i>
          </button>
          <h2 className="ml-4 text-white font-black text-sm tracking-tight uppercase italic">Withdraw</h2>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {step === 'BLOCKED' && (
            <div className="py-12 flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center">
                <i className="fa-solid fa-ban text-3xl text-red-500"></i>
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 uppercase">Withdrawals Frozen</h3>
                <p className="text-xs text-gray-500 mt-2">Contact support for assistance.</p>
              </div>
              <button onClick={onClose} className="w-full bg-primary text-white py-4 rounded-xl font-black uppercase">
                Close
              </button>
            </div>
          )}

          {step === 'NO_ADDRESS' && (
            <div className="py-12 flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center">
                <i className="fa-solid fa-wallet text-3xl text-orange-500"></i>
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 uppercase">No Wallet Bound</h3>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  Please bind a USDT wallet address (TRC20 or BEP20) in your profile before withdrawing.
                </p>
              </div>
              <button onClick={() => (onOpenSettings ? onOpenSettings() : onClose())} className="w-full bg-primary text-white py-4 rounded-xl font-black uppercase">
                Bind Wallet Address
              </button>
            </div>
          )}

          {step === 'NO_PIN' && (
            <div className="py-12 flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center">
                <i className="fa-solid fa-lock text-3xl text-orange-500"></i>
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 uppercase">Withdrawal PIN Required</h3>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  You must set a 6-digit withdrawal PIN in Settings before you can withdraw.
                </p>
              </div>
              <button onClick={() => (onOpenSettings ? onOpenSettings() : onClose())} className="w-full bg-primary text-white py-4 rounded-xl font-black uppercase">
                Set Withdrawal PIN
              </button>
            </div>
          )}

          {step === 'AMOUNT' && (
            <div className="space-y-5">
              <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Available Unlock Balance</p>
                <p className="text-2xl font-black text-gray-900">${unlockBal.toFixed(2)} <span className="text-sm font-bold text-gray-400">USDT</span></p>
                <p className="text-[9px] text-gray-400 mt-1 font-medium">Withdrawable unlock assets only</p>
              </div>

              {/* Network selection */}
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Network</p>
                <div className="grid grid-cols-2 gap-3">
                  {(['TRC20', 'BEP20'] as WithdrawalChain[]).map((c) => {
                    const hasAddr = (walletAddresses[c] || '').length >= 20;
                    return (
                      <button
                        key={c}
                        onClick={() => hasAddr && setChain(c)}
                        disabled={!hasAddr}
                        className={`rounded-xl border-2 p-3 text-center transition-all ${chain === c ? 'border-primary bg-primary/5' : 'border-gray-100 bg-gray-50'} ${!hasAddr ? 'opacity-40 cursor-not-allowed' : ''}`}
                      >
                        <i className={`fa-brands fa-${c === 'TRC20' ? 'ethereum' : 'bnb'} text-lg mb-1 block ${chain === c ? 'text-primary' : 'text-gray-400'}`}></i>
                        <p className={`text-[10px] font-black uppercase ${chain === c ? 'text-primary' : 'text-gray-500'}`}>
                          {c === 'TRC20' ? 'TRC20 · Tron' : 'BEP20 · BSC'}
                        </p>
                        <p className="text-[9px] text-gray-400 mt-0.5">
                          {hasAddr ? 'Available' : 'Not bound'}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {address && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-gray-400 font-black uppercase">Network</span>
                    <span className="text-[10px] font-black text-green-600">USDT · {chain}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-gray-400 font-black uppercase">Wallet</span>
                    <code className="text-[10px] font-mono text-gray-600 max-w-[180px] truncate">
                      {address}
                    </code>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Withdrawal Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-black text-lg">$</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 pl-10 pr-4 text-gray-800 text-xl font-bold focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
                {error && <p className="text-[10px] text-red-500 font-bold uppercase text-center">{error}</p>}
              </div>

              {parsedAmount > 0 && (
                <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3 shadow-sm">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Transaction Breakdown</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Withdrawal Amount</span>
                    <span className="font-bold text-gray-800">${parsedAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-1">
                      <i className="fa-solid fa-receipt text-xs text-red-400"></i>
                      Withdrawal Fee ({(feeRate * 100).toFixed(0)}%)
                    </span>
                    <span className="font-bold text-red-500">-${feeAmount.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-100 pt-3 flex justify-between">
                    <span className="font-black text-gray-800 text-sm uppercase">Net Arrival</span>
                    <span className="font-black text-primary text-sm">
                      ${netArrivalUSDT.toFixed(2)} USDT
                    </span>
                  </div>
                </div>
              )}

              <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                <p className="text-[10px] text-red-500 font-black text-center uppercase leading-relaxed">
                  ⚠ Sending USDT to an invalid wallet address results in permanent loss of funds. Double-check the address and network before confirming.
                </p>
              </div>
            </div>
          )}

          {step === 'CONFIRM' && (
            <div className="space-y-5">
              <div className="bg-primary/5 border border-primary/15 rounded-2xl p-5 text-center">
                <p className="text-[10px] text-primary font-black uppercase tracking-widest mb-2">Confirm Withdrawal</p>
                <p className="text-3xl font-black text-gray-900">${netArrivalUSDT.toFixed(2)}</p>
                <p className="text-xs text-gray-400 mt-1">After {(feeRate * 100).toFixed(0)}% withdrawal fee</p>
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3 shadow-sm">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Amount Requested</span>
                  <span className="font-bold text-gray-800">${parsedAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Withdrawal Fee ({(feeRate * 100).toFixed(0)}%)</span>
                  <span className="font-bold text-red-500">-${feeAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Net Arrival</span>
                  <span className="font-bold text-primary">${netArrivalUSDT.toFixed(2)} USDT</span>
                </div>
                <div className="border-t border-gray-50 pt-3 flex justify-between text-xs">
                  <span className="text-gray-500">Method</span>
                  <span className="font-bold text-gray-600">USDT · {chain}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Destination</span>
                  <code className="font-mono text-gray-600 text-[10px] max-w-[160px] truncate">{address}</code>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Get Verification Code</p>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-3">
                  <p className="text-[11px] text-gray-700 text-center leading-relaxed">
                    We no longer send codes via email. Please get your 6-digit withdrawal code from our Telegram bot:
                  </p>
                  <a
                    href="https://t.me/CF_withdrawVerify_bot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-black uppercase text-sm hover:bg-blue-700 transition-all"
                  >
                    <i className="fa-brands fa-telegram text-lg"></i>
                    Open CF Withdrawal Verification Bot
                  </a>
                  <p className="text-[9px] text-gray-500 text-center">
                    Message the bot with your email/username to receive your withdrawal code.
                  </p>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value)}
                  placeholder="Enter 6-digit code from Telegram bot"
                  maxLength={6}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-4 text-gray-800 font-bold tracking-widest text-center text-xl focus:ring-1 focus:ring-primary outline-none"
                />
                {error && <p className="text-[10px] text-red-500 font-bold uppercase text-center">{error}</p>}
              </div>
              <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3">
                <p className="text-[10px] text-yellow-700 font-bold text-center uppercase">
                  Withdrawals are processed within 24 hours
                </p>
              </div>
            </div>
          )}

          {step === 'OTP_VERIFY' && (
            <div className="space-y-5">
              <div className="bg-primary/5 border border-primary/15 rounded-2xl p-5 text-center">
                <i className="fa-solid fa-shield-halved text-primary text-2xl mb-2"></i>
                <p className="text-[10px] text-primary font-black uppercase tracking-widest mb-2">Verify Code</p>
                <p className="text-xs text-gray-400 mt-1">Enter the 6-digit code from the Telegram bot.</p>
              </div>
              <div className="space-y-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-4 text-gray-800 font-bold tracking-widest text-center text-xl focus:ring-1 focus:ring-primary outline-none"
                />
                {error && <p className="text-[10px] text-red-500 font-bold uppercase text-center">{error}</p>}
              </div>
              <div className="pt-2 space-y-3">
                <button
                  onClick={handleVerifyOtp}
                  disabled={otpVerifying || otpCode.trim().length !== 6}
                  className="w-full bg-primary text-white py-4 rounded-md font-bold text-lg active:scale-[0.98] transition-all shadow-sm disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {otpVerifying ? <><i className="fa-solid fa-spinner animate-spin"></i> Verifying...</> : 'Verify Code'}
                </button>
                <button
                  onClick={() => { setStep('CONFIRM'); setOtpCode(''); }}
                  className="w-full text-gray-400 text-xs font-bold uppercase py-2"
                >
                  Go Back
                </button>
              </div>
            </div>
          )}

          {step === 'PIN' && (
            <div className="space-y-5">
              <div className="bg-primary/5 border border-primary/15 rounded-2xl p-5 text-center">
                <p className="text-[10px] text-primary font-black uppercase tracking-widest mb-2">Withdrawal PIN</p>
                <p className="text-3xl font-black text-gray-900">${netArrivalUSDT.toFixed(2)}</p>
                <p className="text-xs text-gray-400 mt-1">After {(feeRate * 100).toFixed(0)}% withdrawal fee</p>
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3 shadow-sm">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Amount Requested</span>
                  <span className="font-bold text-gray-800">${parsedAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Withdrawal Fee ({(feeRate * 100).toFixed(0)}%)</span>
                  <span className="font-bold text-red-500">-${feeAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Net Arrival</span>
                  <span className="font-bold text-primary">${netArrivalUSDT.toFixed(2)} USDT</span>
                </div>
                <div className="border-t border-gray-50 pt-3 flex justify-between text-xs">
                  <span className="text-gray-500">Method</span>
                  <span className="font-bold text-gray-600">USDT · {chain}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Destination</span>
                  <code className="font-mono text-gray-600 text-[10px] max-w-[160px] truncate">{address}</code>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Withdrawal PIN (6 digits)</label>
                <input
                  type="password"
                  inputMode="numeric"
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  placeholder="Enter 6-digit PIN"
                  maxLength={6}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-4 text-gray-800 font-bold tracking-widest text-center text-xl focus:ring-1 focus:ring-primary outline-none"
                />
                {error && <p className="text-[10px] text-red-500 font-bold uppercase text-center">{error}</p>}
              </div>
              <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3">
                <p className="text-[10px] text-yellow-700 font-bold text-center uppercase">
                  Withdrawals are processed within 24 hours
                </p>
              </div>
            </div>
          )}

          {step === 'PROCESSING' && (
            <div className="py-16 flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <div>
                <h3 className="text-lg font-black text-gray-900 uppercase">Processing</h3>
                <p className="text-xs text-gray-500 mt-2">Submitting your withdrawal request...</p>
              </div>
            </div>
          )}

          {step === 'SUCCESS' && (
            <div className="py-12 flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 bg-green-50 border border-green-100 rounded-full flex items-center justify-center">
                <i className="fa-solid fa-paper-plane text-3xl text-green-500"></i>
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 uppercase">Withdrawal Submitted</h3>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  <span className="text-primary font-black">${netArrivalUSDT.toFixed(2)} USDT</span> will arrive at your wallet within 24 hours.
                </p>
              </div>
              <div className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-[10px] text-gray-400 uppercase font-black">Net Amount</span>
                  <span className="text-[10px] font-black text-primary">${netArrivalUSDT.toFixed(2)} USDT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] text-gray-400 uppercase font-black">Withdrawal Fee ({(feeRate * 100).toFixed(0)}%)</span>
                  <span className="text-[10px] font-black text-red-500">-${feeAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] text-gray-400 uppercase font-black">Method</span>
                  <span className="text-[10px] font-black text-green-600">USDT · {chain}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] text-gray-400 uppercase font-black">Status</span>
                  <span className="text-[10px] font-black text-yellow-600">Processing</span>
                </div>
                {withdrawalCode && (
                  <div className="flex justify-between">
                    <span className="text-[10px] text-gray-400 uppercase font-black">Auth Code</span>
                    <code className="text-[10px] font-black text-primary tracking-widest">{withdrawalCode}</code>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase text-center">
                Share this auth code with admin to approve your withdrawal.
              </p>
              <button onClick={onClose} className="w-full bg-primary text-white py-4 rounded-xl font-black uppercase active:scale-95 transition-all">
                Done
              </button>
            </div>
          )}
        </div>

        {step === 'AMOUNT' && (
          <div className="p-6 bg-white border-t border-gray-50 shrink-0 space-y-3">
            {blockReason && (
              <p className="text-[11px] text-red-600 font-bold text-center leading-relaxed">{blockReason}</p>
            )}
            <button
              onClick={handleRequestWithdrawal}
              disabled={!parsedAmount || parsedAmount < MIN_WITHDRAWAL}
              className="w-full bg-primary text-white py-4 rounded-xl font-black uppercase tracking-widest active:scale-95 transition-all disabled:opacity-40 shadow-md"
            >
              Continue
            </button>
          </div>
        )}

{step === 'CONFIRM' && (
            <div className="p-6 bg-white border-t border-gray-50 shrink-0 space-y-3">
              <button
                onClick={handleConfirm}
                disabled={isProcessing}
                className="w-full bg-primary text-white py-4 rounded-xl font-black uppercase tracking-widest active:scale-95 transition-all shadow-md"
              >
                Confirm Withdrawal
              </button>
              <button
                onClick={() => setStep('AMOUNT')}
                className="w-full text-gray-400 text-xs font-bold uppercase"
              >
                Go Back
              </button>
            </div>
          )}

          {step === 'PIN' && (
            <div className="p-6 bg-white border-t border-gray-50 shrink-0 space-y-3">
              <button
                onClick={handlePinConfirm}
                disabled={isProcessing}
                className="w-full bg-primary text-white py-4 rounded-xl font-black uppercase tracking-widest active:scale-95 transition-all shadow-md"
              >
                {isProcessing ? <i className="fa-solid fa-spinner animate-spin"></i> : 'Confirm Withdrawal'}
              </button>
              <button
                onClick={() => { setStep('CONFIRM'); setPin(''); }}
                className="w-full text-gray-400 text-xs font-bold uppercase"
              >
                Go Back
              </button>
            </div>
          )}
      </div>
    </div>
  );
};

export default WithdrawalModal;
