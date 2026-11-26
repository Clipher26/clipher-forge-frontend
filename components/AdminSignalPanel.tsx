import React, { useEffect, useState } from 'react';
import api from '../api';
import { SignalRecord } from '../types';

const PERIODS = [
  { label: '60 S', period: '60s', yield: '30%' },
  { label: '120 S', period: '120s', yield: '35%' },
  { label: '300 S', period: '300s', yield: '45%' },
];

interface Props { onCreated?: () => void; }

const AdminSignalPanel: React.FC<Props> = ({ onCreated }) => {
  const [cryptos, setCryptos] = useState<{ symbol: string; lastPrice: string }[]>([]);
  const [symbol, setSymbol] = useState('');
  const [direction, setDirection] = useState<'CALL' | 'PUT'>('CALL');
  const [period, setPeriod] = useState(PERIODS[0]);
  const [canSet, setCanSet] = useState(true);
  const [todaySet, setTodaySet] = useState(false);
  const [watDate, setWatDate] = useState('');
  const [resetAt, setResetAt] = useState<string>('');
  const [cycleSignal, setCycleSignal] = useState<SignalRecord | null>(null);
  const [active, setActive] = useState<SignalRecord | null>(null);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [nowTick, setNowTick] = useState(Date.now());

  useEffect(() => { const t = setInterval(()=>setNowTick(Date.now()), 1000); return ()=>clearInterval(t); }, []);

  const load = async () => {
    try {
      const [opt, sig] = await Promise.all([
        api.get('/api/admin/signal/options').catch((e: any) => ({ data: {}, error: e })),
        api.get('/api/signals').catch(() => ({ data: [] })),
      ]);
      const d: any = opt.data || {};
      const list = Array.isArray(d.cryptos) ? d.cryptos : [];
      setCryptos(list);
      if (!symbol && list[0]?.symbol) setSymbol(list[0].symbol);
      setCanSet(d.canSet !== undefined ? !!d.canSet : !d.todaySet);
      setTodaySet(!!d.todaySet);
      setWatDate(d.watDate || '');
      setResetAt(d.resetAt || '');
      setCycleSignal(d.cycleSignal || null);
      if ((opt as any).error) setMsg((opt as any).error?.response?.data?.message || 'Failed to load signal options');
      setActive(Array.isArray(sig.data) && sig.data[0] ? sig.data[0] : (d.activeSignal || null));
    } catch (e: any) {
      setMsg(e?.response?.data?.message || e?.message || 'Failed to load signal options');
    }
  };

  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, []);

  const submit = async () => {
    setLoading(true); setMsg('');
    try {
      const res = await api.post('/api/admin/signals', { symbol, direction, period: period.period });
      const exp = res.data?.expiresAt || res.data?.signal?.expiresAt;
      setMsg(`Signal submitted and saved. Valid 10 minutes from now${exp ? ` (expires ${new Date(exp).toLocaleTimeString()})` : ''}.`);
      setActive(res.data?.signal || null);
      setCycleSignal(res.data?.signal || null);
      setTodaySet(true);
      setCanSet(false);
      if (res.data?.resetAt) setResetAt(res.data.resetAt);

      // Also send signal countdown to CF Messenger (Telegram channel)
      try {
        const signalName = `${symbol} ${direction === 'CALL' ? 'LONG' : 'SHORT'}`;
        await api.post('/api/admin/cf-messenger/signal-countdown', {
          signalName,
          secondsRemaining: 600, // 10 minutes = 600 seconds
        });
        setMsg((prev: string) => prev + ' Countdown sent to Telegram channel.');
      } catch (cfErr: any) {
        console.warn('CF Messenger countdown failed:', cfErr?.response?.data?.message || cfErr?.message);
        setMsg((prev: string) => prev + ' (Countdown to channel failed)');
      }

      onCreated?.();
      await load();
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'Failed to submit signal');
      if (e?.response?.data?.resetAt) setResetAt(e.response.data.resetAt);
    } finally { setLoading(false); }
  };

  const locked = !canSet || todaySet;
  const fmtCountdown = (iso?: string | null) => {
    if (!iso) return '';
    const ms = new Date(iso).getTime() - nowTick;
    if (ms <= 0) return '00:00';
    const s = Math.floor(ms/1000); const m = Math.floor(s/60); const sec = s%60;
    if (m >= 60) { const h = Math.floor(m/60); const mm = m%60; return `${String(h).padStart(2,'0')}:${String(mm).padStart(2,'0')}:${String(sec).padStart(2,'0')}`; }
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };
  const expiresIn = (active?.expiresAt || cycleSignal?.expiresAt) ? fmtCountdown(String(active?.expiresAt || cycleSignal?.expiresAt)) : '';
  const resetIn = resetAt ? fmtCountdown(resetAt) : '';
  const isExpired = (active?.expiresAt || cycleSignal?.expiresAt) ? (new Date(String(active?.expiresAt || cycleSignal?.expiresAt)).getTime() <= nowTick) : false;

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-white font-black uppercase italic">Set Daily Admin Signal</h3>
          <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Bybit crypto • One signal per daily cycle • Valid 10 minutes from submit • Resets daily at 18:00 WAT</p>
        </div>
        <div className="text-right text-[10px] font-black uppercase">
          <p className={canSet ? 'text-positive' : 'text-yellow-500'}>{canSet ? 'Ready to set new signal' : 'Locked until daily reset'}</p>
          <p className="text-gray-400">WAT date: {watDate || '—'}</p>
          {resetAt && <p className="text-bybit">Reset: {new Date(resetAt).toLocaleString()} {resetIn ? `(in ${resetIn})` : ''}</p>}
        </div>
      </div>

      {(active || cycleSignal) && (
        <div className="bg-black/40 border border-bybit/20 rounded-xl p-4 text-xs space-y-1">
          <p className="text-bybit font-black uppercase mb-1">{(active && !isExpired) ? 'Active Signal (10 min from submit)' : 'Cycle Signal'}</p>
          <p className="text-white font-bold">{(active || cycleSignal)?.symbol} • {(active || cycleSignal)?.direction === 'CALL' ? 'LONG' : 'SHORT'} • {String((active || cycleSignal)?.period || '').toUpperCase()} • {(active || cycleSignal)?.yield}</p>
          {(active || cycleSignal)?.createdAt && <p className="text-gray-400">Submitted: {new Date(String((active || cycleSignal)?.createdAt)).toLocaleString()}</p>}
          {(active || cycleSignal)?.expiresAt && <p className={isExpired ? 'text-red-400 font-bold' : 'text-positive font-bold'}>Valid 10 min: {isExpired ? 'Expired' : `Expires in ${expiresIn}`} (at {new Date(String((active || cycleSignal)?.expiresAt)).toLocaleString()})</p>}
          {locked && resetAt && <p className="text-yellow-500">New signal allowed after reset: {new Date(resetAt).toLocaleString()} {resetIn ? `(in ${resetIn})` : ''}</p>}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] text-gray-400 font-black uppercase">Crypto (Bybit)</label>
          <select value={symbol} onChange={e=>setSymbol(e.target.value)} disabled={locked} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white text-sm">
            {cryptos.length === 0 && <option value="">Loading Bybit symbols...</option>}
            {cryptos.map(c => <option key={c.symbol} value={c.symbol}>{c.symbol.replace('USDT','')}/USDT (${Number(c.lastPrice||0).toLocaleString()})</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] text-gray-400 font-black uppercase">Direction</label>
          <div className="flex gap-2">
            <button onClick={()=>setDirection('CALL')} disabled={locked} className={`flex-1 py-3 rounded-xl font-black ${direction==='CALL'?'bg-positive text-white':'bg-white/5 text-gray-400'}`}>LONG</button>
            <button onClick={()=>setDirection('PUT')} disabled={locked} className={`flex-1 py-3 rounded-xl font-black ${direction==='PUT'?'bg-negative text-white':'bg-white/5 text-gray-400'}`}>SHORT</button>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] text-gray-400 font-black uppercase">Selection Period</label>
          <div className="space-y-2">
            {PERIODS.map(p => (
              <button key={p.period} onClick={()=>setPeriod(p)} disabled={locked} className={`w-full flex justify-between px-3 py-2 rounded-xl text-xs font-black ${period.period===p.period?'bg-bybit text-black':'bg-white/5 text-gray-300'}`}>
                <span>{p.label} {period.period===p.period?'(Selected)':''}</span><span>{p.yield}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {msg && <p className={`text-xs font-bold ${msg.toLowerCase().includes('fail')||msg.toLowerCase().includes('cannot')||msg.toLowerCase().includes('only')||msg.toLowerCase().includes('error')||msg.toLowerCase().includes('wait')?'text-red-400':'text-positive'}`}>{msg}</p>}
      <button onClick={submit} disabled={loading || locked || !symbol} className="w-full bg-bybit text-black py-3 rounded-xl font-black uppercase disabled:opacity-40">
        {loading ? 'Submitting...' : locked ? `Locked until reset${resetIn ? ` (${resetIn})` : ''}` : 'Submit Signal'}
      </button>
      <p className="text-[10px] text-gray-400 font-bold uppercase">Signal validity: 10 minutes from submit time. Daily reset: 18:00 WAT{resetAt ? ` (${new Date(resetAt).toLocaleString()})` : ''}. One signal per cycle.</p>
      <div className="flex justify-end"><button onClick={load} className="text-[10px] text-gray-400 font-black uppercase">Refresh options</button></div>
    </div>
  );
};

export default AdminSignalPanel;
