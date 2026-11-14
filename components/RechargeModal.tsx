
import React, { useState } from 'react';
import api from '../api';

const API_URL = '';
const TRON_USDT_ADDRESSES = ['TMcfaQSL8AjEDoyCG9kSDvgNpQo1ku4DBX','TKyS24mVA5cGrHgA2CsWufT3hY36yJLsrW','TXN8dgdLYFUDK6L6LRhbPkozJTarZCsJDZ'];
const BSC_USDT_ADDRESSES = ['0x97C0e0ABA1c4EcCea5400d0864A33fAD1c69Cf23','0x08f424021e950134726e3b3ee628325fdbc4183b','0x037B6DcC7FaF9e4762e917521473f77829bA3cdB'];
const getRandomAddress = (list: string[]) => list[Math.floor(Math.random()*list.length)];
const NGN_RECHARGE_RATE = 1500; // ₦1,500 per $1 USDT
const TELEGRAM_RECEIPT_BOT = 'https://t.me/ClipherForgeExchangeReceipt_bot';

const COMPANY_BANKS = [
  { bankName: 'PalmPay', accountNumber: '7079646853', accountName: 'Olusiku Oluwabukola' },
  { bankName: 'PALMPAY', accountNumber: '8991574608', accountName: 'OLUWABUKOLA OLUSIKU' },
  { bankName: 'WEMA BANK', accountNumber: '0452453876', accountName: 'Oluwabukola Olusiku' },
  { bankName: 'PALMPAY', accountNumber: '8160856808', accountName: 'FATIU BELLO' },
  { bankName: 'Moniepoint MFB', accountNumber: '6692031257', accountName: 'Oluwabukola Olusiku' },
];

const getRandomBank = () => COMPANY_BANKS[Math.floor(Math.random() * COMPANY_BANKS.length)];

interface RechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (amount: number) => void;
}

type Method = 'USDT' | 'NGN';
type RechargeStep = 'METHOD' | 'USDT_ADDRESS' | 'NGN_ADDRESS' | 'SENT' | 'SUCCESS';

const RechargeModal: React.FC<RechargeModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState<RechargeStep>('METHOD');
  const [method, setMethod] = useState<Method>('USDT');
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [amount, setAmount] = useState('');
  const [ngnAmount, setNgnAmount] = useState('');
  const [chain, setChain] = useState('TRC20');
  const [assignedAddress, setAssignedAddress] = useState(getRandomAddress(TRON_USDT_ADDRESSES));
  const [assignedBank, setAssignedBank] = useState(getRandomBank());
  const [receiptName, setReceiptName] = useState('');
  const [receiptBase64, setReceiptBase64] = useState('');
  const [receiptType, setReceiptType] = useState('');

  const resetAndClose = () => {
    setStep('METHOD');
    setAmount('');
    setNgnAmount('');
    setCopied(null);
    setError('');
    setReceiptName(''); setReceiptBase64(''); setReceiptType('');
    onClose();
  };

  React.useEffect(() => {
    if (isOpen) {
      setStep('METHOD');
      setAmount('');
      setNgnAmount('');
      setCopied(null);
      setError('');
      setReceiptName(''); setReceiptBase64(''); setReceiptType('');
      setAssignedBank(getRandomBank());
      setChain('TRC20');
      setAssignedAddress(getRandomAddress(TRON_USDT_ADDRESSES));
    }
  }, [isOpen]);

  const onReceiptFile = (file?: File | null) => {
    if (!file) return;
    setReceiptName(file.name); setReceiptType(file.type || 'application/octet-stream');
    const reader = new FileReader();
    reader.onload = () => setReceiptBase64(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const usdtEquivalent = ngnAmount ? (parseFloat(ngnAmount) / NGN_RECHARGE_RATE).toFixed(2) : '0.00';
  const depositAmount = method === 'USDT' ? (parseFloat(amount) || 0) : (parseFloat(usdtEquivalent) || 0);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${assignedAddress}`;

  const handleProceed = () => {
    if (method === 'USDT') setStep('USDT_ADDRESS');
    else setStep('NGN_ADDRESS');
  };

  const handleSent = async () => {
    setError('');
    const amt = method === 'USDT' ? parseFloat(amount || '0') : parseFloat(usdtEquivalent || '0');
    if (!amt || amt <= 0) { setError('Enter amount'); return; }
    if (!receiptBase64) { setError('Please upload your payment receipt and send it to the Telegram receipt bot for approval.'); return; }
    try {
      await api.post('/api/recharge/submit', { amount: amt, method, chain: method === 'USDT' ? chain : undefined, address: method === 'USDT' ? assignedAddress : undefined, bank: method === 'NGN' ? assignedBank : undefined, ngnAmount: method === 'NGN' ? parseFloat(ngnAmount||'0') : undefined, receiptBase64, receiptName, receiptType });
      setStep('SENT');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to submit deposit. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={resetAndClose}></div>
      <div className="relative bg-white w-full h-full md:max-w-md md:h-auto md:rounded-3xl overflow-hidden shadow-2xl animate-in fade-in duration-300 flex flex-col">

        {/* Header */}
        <header className="bg-primary h-14 flex items-center px-4 shrink-0 shadow-sm">
          <button
            onClick={() => {
              if (step === 'USDT_ADDRESS' || step === 'NGN_ADDRESS') setStep('METHOD');
              else resetAndClose();
            }}
            className="text-white p-1"
          >
            <i className="fa-solid fa-arrow-left text-2xl"></i>
          </button>
          <h2 className="ml-4 text-white font-black text-sm tracking-tight uppercase italic">Recharge</h2>
        </header>

        <div className="flex-1 overflow-y-auto">

          {/* Step: METHOD SELECTION */}
          {step === 'METHOD' && (
            <div className="p-6 space-y-5">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Choose Payment Method</p>

              {/* USDT Option */}
              <button
                onClick={() => { setMethod('USDT'); }}
                className={`w-full rounded-2xl border-2 p-5 text-left transition-all ${method === 'USDT' ? 'border-primary bg-primary/5' : 'border-gray-100 bg-gray-50'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${method === 'USDT' ? 'bg-primary' : 'bg-gray-200'}`}>
                    <i className={`fa-brands fa-bitcoin text-xl ${method === 'USDT' ? 'text-white' : 'text-gray-500'}`}></i>
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-gray-900 text-sm">USDT · TRC20</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Bybit P2P · Tron Network</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${method === 'USDT' ? 'border-primary bg-primary' : 'border-gray-300'}`}>
                    {method === 'USDT' && <i className="fa-solid fa-check text-white text-[9px]"></i>}
                  </div>
                </div>
              </button>

              {/* Naira Option */}
              <button
                onClick={() => { setMethod('NGN'); }}
                className={`w-full rounded-2xl border-2 p-5 text-left transition-all ${method === 'NGN' ? 'border-primary bg-primary/5' : 'border-gray-100 bg-gray-50'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${method === 'NGN' ? 'bg-primary' : 'bg-gray-200'}`}>
                    <span className={`font-black text-lg ${method === 'NGN' ? 'text-white' : 'text-gray-500'}`}>₦</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-gray-900 text-sm">Naira · Bank Transfer</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Rate: ₦1,500 = $1 USDT</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${method === 'NGN' ? 'border-primary bg-primary' : 'border-gray-300'}`}>
                    {method === 'NGN' && <i className="fa-solid fa-check text-white text-[9px]"></i>}
                  </div>
                </div>
              </button>

              <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3">
                <p className="text-[10px] text-yellow-700 font-bold text-center uppercase">
                  Deposits are verified manually within 5–30 minutes
                </p>
              </div>
            </div>
          )}

          {/* Step: USDT ADDRESS */}
          {step === 'USDT_ADDRESS' && (
            <div className="p-6 space-y-5">
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 text-center">
                <i className="fa-brands fa-bitcoin text-primary text-2xl mb-2"></i>
                <p className="text-xs font-black text-gray-800 uppercase tracking-wide">USDT · TRC20 Deposit</p>
                <p className="text-[10px] text-gray-500 mt-1">Send USDT via TRC20 network only. Other networks will result in loss of funds.</p>
              </div>

              {/* Chain selector */}
              <div className="flex gap-2">
                {['TRC20','BEP20'].map((c) => (
                  <button key={c} onClick={() => { setChain(c); setAssignedAddress(getRandomAddress(c==='TRC20'?TRON_USDT_ADDRESSES:BSC_USDT_ADDRESSES)); }} className={`flex-1 py-2 rounded-xl text-xs font-black uppercase ${chain===c?'bg-primary text-white':'bg-gray-100 text-gray-500'}`}>{c}</button>
                ))}
              </div>

              {/* QR Code */}
              <div className="flex justify-center">
                <div className="bg-white border border-gray-100 rounded-2xl p-3 shadow-md">
                  <img src={qrUrl} alt="Deposit QR" className="w-44 h-44" />
                </div>
              </div>

              {/* Network info */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Network</span>
                  <span className="text-xs font-black text-green-600 bg-green-50 px-3 py-1 rounded-full">TRC20 · TRON</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Coin</span>
                  <span className="text-xs font-black text-gray-800">USDT</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Min. Deposit</span>
                  <span className="text-xs font-black text-gray-800">1 USDT</span>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Deposit Address</p>
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex items-center gap-3">
                  <code className="flex-1 text-[11px] text-primary font-mono break-all leading-relaxed">{assignedAddress}</code>
                  <button
                    onClick={() => copyText(assignedAddress, 'address')}
                    className="shrink-0 w-9 h-9 bg-primary rounded-lg flex items-center justify-center active:scale-95 transition-all"
                  >
                    <i className={`fa-solid ${copied === 'address' ? 'fa-check' : 'fa-copy'} text-white text-sm`}></i>
                  </button>
                </div>
                {copied === 'address' && <p className="text-[10px] text-green-500 font-black text-center uppercase">Address copied!</p>}
              </div>

              {parseFloat(amount)>0 && (
                <div className="bg-gray-50 rounded-xl p-3 space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-gray-400 font-bold uppercase">Amount</span><span>${parseFloat(amount).toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400 font-bold uppercase">Gas Fee (10%)</span><span>${(parseFloat(amount)*0.1).toFixed(2)}</span></div>
                  <div className="flex justify-between font-black border-t pt-1"><span>Total to Send</span><span className="text-primary">${(parseFloat(amount)*1.1).toFixed(2)} USDT</span></div>
                </div>
              )}
              {error && <p className="text-xs text-red-600 text-center font-bold">{error}</p>}

              {/* Amount input */}
              <div className="space-y-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Amount Sent (USDT)</p>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-black">$</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 pl-8 pr-4 text-gray-800 text-lg font-bold focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                <p className="text-[10px] text-red-500 font-black text-center uppercase leading-relaxed">
                  ⚠ Only send USDT via TRC20. Other networks = permanent loss.
                </p>
              </div>

              {/* Receipt upload */}
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Upload Payment Receipt</p>
                <p className="text-[10px] text-gray-500 leading-relaxed">
                  Take a screenshot of your transaction and upload it here. The receipt will be forwarded to the Telegram receipt bot for approval (5–30 min).
                </p>
                <label className={`block border-2 border-dashed rounded-xl py-6 text-center cursor-pointer transition-all ${receiptBase64 ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary'}`}>
                  <input type="file" accept="image/*,application/pdf" className="hidden" onChange={e => onReceiptFile(e.target.files?.[0] || null)} />
                  {receiptBase64 ? (
                    <><i className="fa-solid fa-check-circle text-primary text-2xl mb-1 block"></i><span className="text-[10px] font-black text-primary uppercase">{receiptName || 'Receipt attached'}</span></>
                  ) : (
                    <><i className="fa-solid fa-image text-gray-300 text-2xl mb-1 block"></i><span className="text-[10px] font-black text-gray-400 uppercase">Tap to upload receipt</span></>
                  )}
                </label>
                {receiptBase64 && (
                  <button onClick={() => { setReceiptBase64(''); setReceiptName(''); setReceiptType(''); }} className="text-[10px] font-black text-red-500 uppercase text-center block mx-auto">Remove</button>
                )}
                <a href={TELEGRAM_RECEIPT_BOT} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-primary text-center block hover:underline">
                  Send receipt via Telegram receipt bot: {TELEGRAM_RECEIPT_BOT}
                </a>
              </div>
            </div>
          )}

          {/* Step: NGN ADDRESS */}
          {step === 'NGN_ADDRESS' && (
            <div className="p-6 space-y-5">
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 text-center">
                <span className="text-primary font-black text-2xl">₦</span>
                <p className="text-xs font-black text-gray-800 uppercase tracking-wide mt-1">Naira Bank Transfer</p>
                <p className="text-[10px] text-gray-500 mt-1">Transfer Naira to the account below. Rate: ₦1,500 = $1 USDT</p>
              </div>

              {/* Bank Details */}
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Company Bank Account</p>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase">Bank</span>
                    <span className="text-xs font-black text-gray-800">{assignedBank.bankName}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-gray-400 uppercase">Account No.</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-primary tracking-widest">{assignedBank.accountNumber}</span>
                      <button
                        onClick={() => copyText(assignedBank.accountNumber, 'acc')}
                        className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center active:scale-95"
                      >
                        <i className={`fa-solid ${copied === 'acc' ? 'fa-check' : 'fa-copy'} text-white text-[10px]`}></i>
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase">Account Name</span>
                    <span className="text-xs font-black text-gray-800">{assignedBank.accountName}</span>
                  </div>
                </div>
              </div>

              {/* Naira amount + conversion */}
              <div className="space-y-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Amount to Transfer (₦)</p>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-black text-lg">₦</span>
                  <input
                    type="number"
                    value={ngnAmount}
                    onChange={e => setNgnAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 pl-10 pr-4 text-gray-800 text-lg font-bold focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              {parseFloat(ngnAmount) > 0 && (
                <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3 shadow-sm">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Conversion Summary</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">You Transfer</span>
                    <span className="font-bold text-gray-800">₦{parseFloat(ngnAmount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Rate</span>
                    <span className="font-bold text-gray-600">₦1,500 = $1</span>
                  </div>
                  <div className="border-t border-gray-100 pt-3 flex justify-between">
                    <span className="font-black text-gray-800 text-sm uppercase">You Receive</span>
                    <span className="font-black text-primary text-sm">${usdtEquivalent} USDT</span>
                  </div>
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3">
                <p className="text-[10px] text-yellow-700 font-bold text-center uppercase leading-relaxed">
                  Use your username as transfer narration/reference
                </p>
              </div>

              {/* Receipt upload */}
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Upload Payment Receipt</p>
                <p className="text-[10px] text-gray-500 leading-relaxed">
                  Upload a screenshot of your bank transfer. The receipt is forwarded to the Telegram receipt bot for approval (5–30 min).
                </p>
                <label className={`block border-2 border-dashed rounded-xl py-6 text-center cursor-pointer transition-all ${receiptBase64 ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary'}`}>
                  <input type="file" accept="image/*,application/pdf" className="hidden" onChange={e => onReceiptFile(e.target.files?.[0] || null)} />
                  {receiptBase64 ? (
                    <><i className="fa-solid fa-check-circle text-primary text-2xl mb-1 block"></i><span className="text-[10px] font-black text-primary uppercase">{receiptName || 'Receipt attached'}</span></>
                  ) : (
                    <><i className="fa-solid fa-image text-gray-300 text-2xl mb-1 block"></i><span className="text-[10px] font-black text-gray-400 uppercase">Tap to upload receipt</span></>
                  )}
                </label>
                {receiptBase64 && (
                  <button onClick={() => { setReceiptBase64(''); setReceiptName(''); setReceiptType(''); }} className="text-[10px] font-black text-red-500 uppercase text-center block mx-auto">Remove</button>
                )}
                <a href={TELEGRAM_RECEIPT_BOT} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-primary text-center block hover:underline">
                  Send receipt via Telegram receipt bot: {TELEGRAM_RECEIPT_BOT}
                </a>
              </div>
            </div>
          )}

          {/* Step: SENT */}
          {step === 'SENT' && (
            <div className="p-6 py-12 flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center">
                <i className="fa-solid fa-clock-rotate-left text-3xl text-primary animate-pulse"></i>
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 uppercase italic">Payment Submitted</h3>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  {method === 'USDT'
                    ? <>Your deposit of <span className="text-primary font-black">${amount} USDT</span> has been submitted.</>
                    : <>Your transfer of <span className="text-primary font-black">₦{parseFloat(ngnAmount || '0').toLocaleString()}</span> has been submitted.</>
                  }
                  <br />Our team will verify and credit your account within <strong>5–30 minutes</strong>.
                </p>
              </div>
              <div className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-[10px] text-gray-400 font-black uppercase">Method</span>
                  <span className="text-[10px] font-black text-gray-700">{method === 'USDT' ? 'USDT · TRC20' : 'Naira · Bank Transfer'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] text-gray-400 font-black uppercase">Amount</span>
                  <span className="text-[10px] font-black text-primary">
                    {method === 'USDT' ? `$${amount} USDT` : `₦${parseFloat(ngnAmount || '0').toLocaleString()} → $${usdtEquivalent} USDT`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] text-gray-400 font-black uppercase">Receipt</span>
                  <span className="text-[10px] font-black text-green-600 truncate max-w-[140px]">{receiptName || 'Uploaded'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] text-gray-400 font-black uppercase">Status</span>
                  <span className="text-[10px] font-black text-yellow-600">Reviewing Payment</span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                <p className="text-[10px] text-blue-700 font-bold text-center uppercase leading-relaxed">
                  Your receipt was sent to the admin Telegram bot. Please wait <strong>5–30 minutes</strong> for approval — you will receive a confirmation notification once credited.
                </p>
              </div>
              <a
                href={TELEGRAM_RECEIPT_BOT}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-black text-primary uppercase text-center block hover:underline"
              >
                Open receipt bot: {TELEGRAM_RECEIPT_BOT}
              </a>
              <button
                onClick={() => { onSuccess(depositAmount); resetAndClose(); }}
                className="w-full bg-primary text-white py-4 rounded-xl font-black uppercase tracking-widest active:scale-95 transition-all"
              >
                Done
              </button>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        {step === 'METHOD' && (
          <div className="p-6 bg-white border-t border-gray-50 shrink-0">
            <button
              onClick={handleProceed}
              className="w-full bg-primary text-white py-4 rounded-xl font-black uppercase tracking-widest active:scale-95 transition-all shadow-md"
            >
              Continue with {method === 'USDT' ? 'USDT · TRC20' : 'Naira Transfer'}
            </button>
          </div>
        )}

        {step === 'USDT_ADDRESS' && (
          <div className="p-6 bg-white border-t border-gray-50 shrink-0">
            <button
              onClick={handleSent}
              disabled={!amount || parseFloat(amount) <= 0}
              className="w-full bg-primary text-white py-4 rounded-xl font-black uppercase tracking-widest active:scale-95 transition-all disabled:opacity-40 shadow-md"
            >
              I Have Sent Payment
            </button>
          </div>
        )}

        {step === 'NGN_ADDRESS' && (
          <div className="p-6 bg-white border-t border-gray-50 shrink-0">
            <button
              onClick={handleSent}
              disabled={!ngnAmount || parseFloat(ngnAmount) <= 0}
              className="w-full bg-primary text-white py-4 rounded-xl font-black uppercase tracking-widest active:scale-95 transition-all disabled:opacity-40 shadow-md"
            >
              I Have Made the Transfer
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RechargeModal;
