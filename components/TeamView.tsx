
import React, { useEffect, useState } from 'react';
import api from '../api';

interface TeamMember {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  joinedDate?: string;
  rechargedReferrals?: number;
}

interface TeamViewProps {
  onBack: () => void;
}

const TeamView: React.FC<TeamViewProps> = ({ onBack }) => {
  const [activeTier, setActiveTier] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ totalTeamSize: 0, totalCommission: 0, tier1Count: 0, tier2Count: 0, tier3Count: 0 });
  const [tiers, setTiers] = useState<{1:TeamMember[];2:TeamMember[];3:TeamMember[]}>({1:[],2:[],3:[]});

  const load = async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/api/team');
      const d = res.data || {};
      setStats({ totalTeamSize: Number(d.totalTeamSize||0), totalCommission: Number(d.totalCommission||0), tier1Count: Number(d.tier1Count||0), tier2Count: Number(d.tier2Count||0), tier3Count: Number(d.tier3Count||0) });
      setTiers({ 1: Array.isArray(d.tiers?.[1])?d.tiers[1]:[], 2: Array.isArray(d.tiers?.[2])?d.tiers[2]:[], 3: Array.isArray(d.tiers?.[3])?d.tiers[3]:[] });
    } catch (e:any) { setError(e?.response?.data?.message || 'Failed to load team data'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const renderTierCard = (tier: 1 | 2 | 3, count: number, label: string, desc: string, rate: string) => (
    <button 
      onClick={() => setActiveTier(tier)}
      className={`relative w-full p-5 rounded-2xl border transition-all text-left ${
        activeTier === tier 
          ? 'bg-white border-primary shadow-md ring-1 ring-primary/20' 
          : 'bg-white border-gray-100 hover:border-gray-200 shadow-sm'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
          activeTier === tier ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'
        }`}>
          T{tier}
        </div>
        <span className="text-[10px] font-black text-primary uppercase tracking-widest">{rate} YIELD</span>
      </div>
      <h3 className="text-sm font-black text-gray-900 uppercase italic tracking-tighter">{label}</h3>
      <p className="text-[10px] text-gray-400 mt-1 leading-tight">{desc}</p>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-xl font-black text-gray-800">{count}</span>
        <span className="text-[9px] text-gray-400 font-bold uppercase">Active Nodes</span>
      </div>
      {activeTier === tier && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full"></div>
      )}
    </button>
  );

  return (
    <div className="flex-1 bg-[#f8f9fa] animate-in fade-in duration-300 overflow-y-auto pb-24">
      {/* Header */}
      <header className="bg-primary h-12 flex items-center px-4 shrink-0 shadow-sm sticky top-0 z-20">
        <button onClick={onBack} className="text-white hover:opacity-80 transition-opacity">
          <i className="fa-solid fa-arrow-left text-xl"></i>
        </button>
        <h2 className="ml-4 text-white font-bold text-sm tracking-tight uppercase italic">Team Protocol</h2>
      </header>

      {/* Hero Stats */}
      <div className="bg-primary px-6 pb-12 pt-4 flex justify-between items-end">
        <div>
          <p className="text-[10px] text-white/70 font-black uppercase tracking-widest">Total Network Size</p>
          <h1 className="text-4xl font-black text-white italic tracking-tighter mt-1">{stats.totalTeamSize}</h1>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-white/70 font-black uppercase tracking-widest">Accumulated Rewards</p>
          <h1 className="text-2xl font-black text-white italic mt-1">${stats.totalCommission.toFixed(2)}</h1>
        </div>
      </div>

      {/* Tier Selection */}
      <div className="px-4 -mt-6 space-y-4">
        <div className="grid grid-cols-1 gap-3">
          {renderTierCard(1, stats.tier1Count, "Tier 1: Direct Nodes", "Nodes you personally invited using your referral link.", "15%")}
          {renderTierCard(2, stats.tier2Count, "Tier 2: Sub-Nodes", "Nodes invited by your Tier 1 members.", "10%")}
          {renderTierCard(3, stats.tier3Count, "Tier 3: Extended Nodes", "Nodes invited by your Tier 2 members.", "5%")}
        </div>
      </div>

      {/* Info Panel */}
      <div className="px-4 mt-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-primary"></div>
              <h3 className="text-sm font-black text-gray-900 uppercase italic tracking-tighter">Tier {activeTier} Details</h3>
            </div>
            <button onClick={load} className="text-[10px] text-primary font-black uppercase">{loading ? 'Loading...' : 'Refresh'}</button>
          </div>
          {error && <p className="text-xs text-red-600 font-bold mb-3">{error}</p>}

          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
               <span className="text-xs text-gray-500">Commission Rate</span>
               <span className="text-xs font-black text-primary">{activeTier === 1 ? '15%' : activeTier === 2 ? '10%' : '5%'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
               <span className="text-xs text-gray-500">Active Nodes</span>
               <span className="text-xs font-black text-gray-800">{tiers[activeTier].length}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
               <span className="text-xs text-gray-500">Data Source</span>
               <span className="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded font-black uppercase tracking-tighter">Supabase</span>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            {loading ? <p className="text-xs text-gray-400">Loading team...</p> : tiers[activeTier].length === 0 ? (
              <p className="text-xs text-gray-400 italic">No Tier {activeTier} referrals yet.</p>
            ) : tiers[activeTier].slice(0,50).map(m => (
              <div key={m.id} className="flex items-center justify-between py-2 border-b border-gray-50">
                <div>
                  <p className="text-xs font-bold text-gray-800">{m.name || m.id}</p>
                  <p className="text-[10px] text-gray-400">{m.email || m.phone || m.id}</p>
                </div>
                <span className="text-[10px] font-black text-primary uppercase">T{activeTier}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p className="text-[10px] text-gray-400 font-medium italic leading-relaxed">
              * Team tiers are fetched from backend referral data stored in Supabase. Commission totals come from recorded referral transactions.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-12 text-center pb-8 opacity-20">
         <p className="text-[9px] text-gray-900 font-black uppercase tracking-[0.4em]">Clipher Forge Network Engine</p>
      </div>
    </div>
  );
};

export default TeamView;
