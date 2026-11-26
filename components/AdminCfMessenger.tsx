import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';

interface CfMessengerStatus {
  configured: boolean;
  canSend: boolean;
  error: string | null;
}

type TabType = 'BROADCAST' | 'COUNTDOWN' | 'UPDATE' | 'MAINTENANCE';

const AdminCfMessenger: React.FC = () => {
  const [status, setStatus] = useState<CfMessengerStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('BROADCAST');
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [sending, setSending] = useState(false);

  // Broadcast form
  const [broadcastMessage, setBroadcastMessage] = useState('');

  // Countdown form
  const [signalName, setSignalName] = useState('');
  const [secondsRemaining, setSecondsRemaining] = useState(600); // default 10 minutes

  // Update form
  const [updateTitle, setUpdateTitle] = useState('');
  const [updateDescription, setUpdateDescription] = useState('');
  const [updateUrl, setUpdateUrl] = useState('');

  // Maintenance form
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');

  const loadStatus = useCallback(async () => {
    setLoadingStatus(true);
    try {
      const res = await api.get('/api/admin/cf-messenger/status');
      setStatus(res.data);
    } catch (e: any) {
      setStatus({
        configured: false,
        canSend: false,
        error: e?.response?.data?.message || e?.message || 'Failed to load CF Messenger status.',
      });
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleSend = async (endpoint: string, payload: Record<string, any>) => {
    if (!status?.configured) {
      setFeedback({ ok: false, text: 'CF Messenger bot not configured. Set CF_MESSENGER_BOT_TOKEN and CF_MESSENGER_CHAT_ID env vars.' });
      return;
    }
    setSending(true);
    setFeedback(null);
    try {
      const res = await api.post(endpoint, payload);
      if (res.data?.success) {
        setFeedback({ ok: true, text: 'Message sent to Telegram channel successfully.' });
        // Clear form based on tab
        if (endpoint.includes('broadcast')) setBroadcastMessage('');
        if (endpoint.includes('signal-countdown')) { setSignalName(''); setSecondsRemaining(600); }
        if (endpoint.includes('update')) { setUpdateTitle(''); setUpdateDescription(''); setUpdateUrl(''); }
        if (endpoint.includes('maintenance')) { setMaintenanceMessage(''); setEstimatedDuration(''); }
      } else {
        setFeedback({ ok: false, text: res.data?.message || 'Send failed.' });
      }
    } catch (e: any) {
      const statusCode = e?.response?.status;
      const msg = e?.response?.data?.message || e?.message || 'Send failed.';
      setFeedback({ ok: false, text: statusCode ? `(${statusCode}) ${msg}` : msg });
    } finally {
      setSending(false);
    }
  };

  const handleBroadcast = () => {
    if (!broadcastMessage.trim()) {
      setFeedback({ ok: false, text: 'Enter a broadcast message.' });
      return;
    }
    handleSend('/api/admin/cf-messenger/broadcast', { message: broadcastMessage.trim() });
  };

  const handleCountdown = () => {
    if (!signalName.trim()) {
      setFeedback({ ok: false, text: 'Enter a signal name.' });
      return;
    }
    if (typeof secondsRemaining !== 'number' || secondsRemaining < 0) {
      setFeedback({ ok: false, text: 'Enter valid seconds remaining (>= 0).' });
      return;
    }
    handleSend('/api/admin/cf-messenger/signal-countdown', { signalName: signalName.trim(), secondsRemaining });
  };

  const handleUpdate = () => {
    if (!updateTitle.trim() || !updateDescription.trim()) {
      setFeedback({ ok: false, text: 'Title and description are required.' });
      return;
    }
    handleSend('/api/admin/cf-messenger/update', {
      title: updateTitle.trim(),
      description: updateDescription.trim(),
      url: updateUrl.trim() || undefined,
    });
  };

  const handleMaintenance = () => {
    if (!maintenanceMessage.trim()) {
      setFeedback({ ok: false, text: 'Enter a maintenance message.' });
      return;
    }
    handleSend('/api/admin/cf-messenger/maintenance', {
      message: maintenanceMessage.trim(),
      estimatedDuration: estimatedDuration.trim() || undefined,
    });
  };

  if (loadingStatus) {
    return (
      <div className="p-4 space-y-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bybit mx-auto"></div>
            <p className="text-gray-500 text-xs mt-2">Checking CF Messenger configuration...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!status?.configured) {
    return (
      <div className="p-4 space-y-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="text-center py-8">
            <i className="fa-solid fa-triangle-exclamation text-red-500 text-4xl mb-3"></i>
            <h3 className="text-white font-black uppercase italic tracking-wider text-lg">
              {status?.error ? 'CF Messenger Status Unavailable' : 'CF Messenger Not Configured'}
            </h3>
            <p className="text-gray-500 text-xs mt-2 max-w-md mx-auto">
              {status?.error || 'The CF Messenger bot is not configured. Please set the following environment variables on the server:'}
            </p>
            {!status?.error && (
              <div className="bg-black/40 border border-white/10 rounded-xl p-4 mt-4 text-left max-w-md mx-auto space-y-2 font-mono text-[10px]">
                <code className="text-bybit">CF_MESSENGER_BOT_TOKEN</code> - Bot token from <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-bybit underline">@BotFather</a>
                <br />
                <code className="text-bybit">CF_MESSENGER_CHAT_ID</code> - Channel/Group chat ID (e.g. <code className="text-gray-400">-1001234567890</code> or <code className="text-gray-400">@channelname</code>)
              </div>
            )}
            <button onClick={loadStatus} className="mt-4 px-4 py-2 bg-bybit text-black text-[10px] font-black uppercase rounded-xl hover:bg-white transition-all">
              Retry Check
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status?.configured && !status?.canSend) {
    return (
      <div className="p-4 space-y-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="text-center py-8">
            <i className="fa-solid fa-triangle-exclamation text-yellow-500 text-4xl mb-3"></i>
            <h3 className="text-white font-black uppercase italic tracking-wider text-lg">CF Messenger Cannot Send</h3>
            <p className="text-gray-500 text-xs mt-2 max-w-md mx-auto">
              The bot is configured but cannot send messages to the Telegram channel.{' '}
              {status.error && <span className="text-bybit font-bold">({status.error})</span>}
            </p>
            <div className="bg-black/40 border border-white/10 rounded-xl p-4 mt-4 text-left max-w-md mx-auto space-y-2 font-mono text-[10px]">
              <p className="text-xs text-white font-bold mb-1">Fix:</p>
              <code className="text-bybit block mb-2">1. Add the bot to your Telegram channel/group as an administrator</code>
              <code className="text-bybit block mb-2">2. Verify CF_MESSENGER_CHAT_ID in backend/.env is correct</code>
              <code className="text-bybit block">3. Restart the backend server</code>
            </div>
            <button onClick={loadStatus} className="mt-4 px-4 py-2 bg-bybit text-black text-[10px] font-black uppercase rounded-xl hover:bg-white transition-all">
              Retry Check
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'BROADCAST', label: 'Broadcast', icon: 'fa-solid fa-bullhorn' },
    { id: 'COUNTDOWN', label: 'Signal Countdown', icon: 'fa-solid fa-clock-rotate-left' },
    { id: 'UPDATE', label: 'New Update', icon: 'fa-solid fa-bell' },
    { id: 'MAINTENANCE', label: 'Maintenance', icon: 'fa-solid fa-tools' },
  ];

  return (
    <div className="p-4 space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-1">
        <div className="flex gap-1 overflow-x-auto no-scrollbar" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setFeedback(null); }}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-bybit text-black shadow-lg'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
              role="tab"
              aria-selected={activeTab === tab.id}
            >
              <i className={`fa-solid ${tab.icon} text-xs`}></i>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Forms */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 animate-in fade-in duration-300">
        <div>
          <h3 className="text-white font-black uppercase italic tracking-tighter text-lg">
            <i className={`fa-solid ${tabs.find(t => t.id === activeTab)?.icon} text-bybit mr-2`}></i>
            {tabs.find(t => t.id === activeTab)?.label}
          </h3>
          <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">
            {activeTab === 'BROADCAST' && 'Send a general announcement to the Telegram channel.'}
            {activeTab === 'COUNTDOWN' && 'Send a signal countdown timer (auto-updates in channel).'}
            {activeTab === 'UPDATE' && 'Announce a new feature/update with optional link.'}
            {activeTab === 'MAINTENANCE' && 'Notify users of scheduled maintenance.'}
          </p>
        </div>

        {activeTab === 'BROADCAST' && (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Broadcast Message</label>
              <textarea
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                rows={5}
                placeholder={'Enter your broadcast message here... (HTML supported: <b>, <i>, <code>, <a href="">)'}
                className="mt-1 w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-bybit/40 resize-none"
              />
              <p className="text-[9px] text-gray-600 mt-1">Supports basic HTML: bold, italic, code, links. Max ~4000 chars.</p>
            </div>
          </div>
        )}

        {activeTab === 'COUNTDOWN' && (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Signal Name</label>
              <input
                value={signalName}
                onChange={(e) => setSignalName(e.target.value)}
                placeholder="e.g. BTCUSDT LONG, ETHUSDT SHORT"
                className="mt-1 w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-bybit/40"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Seconds Remaining</label>
              <div className="flex items-center gap-3 mt-1">
                <input
                  type="number"
                  value={secondsRemaining}
                  onChange={(e) => setSecondsRemaining(Math.max(0, parseInt(e.target.value) || 0))}
                  min="0"
                  className="w-32 bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-bybit/40"
                />
                <div className="flex gap-2">
                  <button onClick={() => setSecondsRemaining(600)} className="px-3 py-2 bg-white/10 text-white rounded-xl text-[9px] font-black uppercase hover:bg-white/20">10 min</button>
                  <button onClick={() => setSecondsRemaining(300)} className="px-3 py-2 bg-white/10 text-white rounded-xl text-[9px] font-black uppercase hover:bg-white/20">5 min</button>
                  <button onClick={() => setSecondsRemaining(60)} className="px-3 py-2 bg-white/10 text-white rounded-xl text-[9px] font-black uppercase hover:bg-white/20">1 min</button>
                  <button onClick={() => setSecondsRemaining(30)} className="px-3 py-2 bg-white/10 text-white rounded-xl text-[9px] font-black uppercase hover:bg-white/20">30 sec</button>
                </div>
              </div>
              <p className="text-[9px] text-gray-600 mt-1">
                Will display as: {Math.floor(secondsRemaining / 60)}m {secondsRemaining % 60}s remaining
              </p>
            </div>
          </div>
        )}

        {activeTab === 'UPDATE' && (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Update Title</label>
              <input
                value={updateTitle}
                onChange={(e) => setUpdateTitle(e.target.value)}
                placeholder="e.g. New VIP Tier Added, Trading Fee Reduced"
                className="mt-1 w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-bybit/40"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Description</label>
              <textarea
                value={updateDescription}
                onChange={(e) => setUpdateDescription(e.target.value)}
                rows={4}
                placeholder="Describe the update... (HTML supported)"
                className="mt-1 w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-bybit/40 resize-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Link (Optional)</label>
              <input
                value={updateUrl}
                onChange={(e) => setUpdateUrl(e.target.value)}
                placeholder="https://app.clipherforge.com/updates"
                className="mt-1 w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-bybit/40"
              />
              <p className="text-[9px] text-gray-600 mt-1">Add a "View Details" button linking to this URL.</p>
            </div>
          </div>
        )}

        {activeTab === 'MAINTENANCE' && (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Maintenance Message</label>
              <textarea
                value={maintenanceMessage}
                onChange={(e) => setMaintenanceMessage(e.target.value)}
                rows={4}
                placeholder="e.g. Database migration in progress. Trading may be temporarily unavailable."
                className="mt-1 w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-bybit/40 resize-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Estimated Duration (Optional)</label>
              <input
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(e.target.value)}
                placeholder="e.g. 30 minutes, 2 hours, Tomorrow 02:00 WAT"
                className="mt-1 w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-bybit/40"
              />
            </div>
          </div>
        )}

        {feedback && (
          <div className={`text-xs font-bold px-3 py-2 rounded-lg ${feedback.ok ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
            {feedback.text}
          </div>
        )}

        <button
          onClick={
            activeTab === 'BROADCAST' ? handleBroadcast :
            activeTab === 'COUNTDOWN' ? handleCountdown :
            activeTab === 'UPDATE' ? handleUpdate :
            handleMaintenance
          }
          disabled={sending}
          className="w-full bg-bybit text-black py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-white transition-all disabled:opacity-50"
        >
          {sending ? 'Sending...' : `Send ${tabs.find(t => t.id === activeTab)?.label}`}
        </button>
      </div>

      {/* Preview / Example Messages */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <h4 className="text-white font-black uppercase text-xs tracking-widest mb-4">Message Preview Examples</h4>
        <div className="space-y-3 text-[10px] text-gray-400">
          <div className="bg-black/30 border border-white/5 rounded-xl p-3 font-mono whitespace-pre-wrap">
{`📢 <b>Admin Broadcast</b>

Your broadcast message here...`}
          </div>
          <div className="bg-black/30 border border-white/5 rounded-xl p-3 font-mono whitespace-pre-wrap">
{`⏳ <b>Signal Countdown: BTCUSDT LONG</b>

Time remaining: <b>5m 0s</b>

<i>Auto-update</i>`}
          </div>
          <div className="bg-black/30 border border-white/5 rounded-xl p-3 font-mono whitespace-pre-wrap">
{`🔔 <b>New Update: New VIP Tier Added</b>

VIP7 with 15% daily returns is now available.

<a href="https://app.clipherforge.com/vip">View Details</a>`}
          </div>
          <div className="bg-black/30 border border-white/5 rounded-xl p-3 font-mono whitespace-pre-wrap">
{`🔧 <b>Maintenance Notice</b>

Database migration in progress. Trading may be temporarily unavailable.

Estimated duration: 30 minutes`}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCfMessenger;