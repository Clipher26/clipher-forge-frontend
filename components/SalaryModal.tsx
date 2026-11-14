
import React from 'react';
import { User } from '../types';

interface SalaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onClaim: () => void;
}

const SalaryModal: React.FC<SalaryModalProps> = ({ isOpen, onClose, user, onClaim }) => {
  if (!isOpen) return null;

  const tier1 = 9;
  const tier2 = 16;
  const tier3 = 20;
  
  const currentReward = user.rechargedReferrals >= tier3 ? 20.00 : (user.rechargedReferrals >= tier2 ? 15.00 : (user.rechargedReferrals >= tier1 ? 10.00 : 0));
  const nextTarget = user.rechargedReferrals < tier1 ? tier1 : (user.rechargedReferrals < tier2 ? tier2 : tier3);
  const nextReward = user.rechargedReferrals < tier1 ? 10.00 : (user.rechargedReferrals < tier2 ? 15.00 : 20.00);
  
  const progress = Math.min((user.rechargedReferrals / tier3) * 100, 100);
  const isCriteriaMet = user.rechargedReferrals >= tier1;
  const isApproved = user.salaryStatus === 'Approved';
  const isTerminated = user.salaryStatus === 'Terminated';
  const canClaim = isCriteriaMet && isApproved;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose}></div>
      
      <div className="relative bg-[#0d0e12] border border-bybit/30 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="bg-bybit h-1.5 w-full"></div>
        
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <button 
                onClick={onClose}
                className="text-white hover:text-bybit transition-all p-1"
              >
                <i className="fa-solid fa-arrow-left text-2xl drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"></i>
              </button>
              <div>
                <h2 className="text-xl font-black text-white uppercase italic flex items-center gap-2 tracking-tighter">
                  <i className="fa-solid fa-money-bill-trend-up text-bybit"></i>
                  Forge Salary Protocol
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Global Operator Allowance</p>
                  {isTerminated && <span className="text-[8px] bg-red-600 text-white px-2 py-0.5 rounded-full font-black uppercase">Terminated</span>}
                  {isApproved && <span className="text-[8px] bg-blue-500 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-widest">Active Payroll</span>}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Reward Card */}
            <div className="bg-gradient-to-br from-bybit/20 to-transparent border border-bybit/10 rounded-2xl p-6 text-center relative overflow-hidden">
               <div className="absolute top-0 right-0 p-2">
                 <i className="fa-solid fa-crown text-bybit/20 text-4xl"></i>
               </div>
               <p className="text-[10px] text-bybit font-black uppercase tracking-[0.2em] mb-2">Weekly Allowance Tiers</p>
               <div className="flex justify-center items-baseline gap-2">
                 <h3 className="text-4xl font-black text-white italic tracking-tighter">
                    ${currentReward > 0 ? currentReward.toFixed(2) : nextReward.toFixed(2)}
                 </h3>
                 <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">
                    {isApproved ? 'Approved' : (isTerminated ? 'Blocked' : 'Pending')}
                 </span>
               </div>
               <p className="text-xs text-gray-400 mt-2 font-medium">Automatic injection every 7 days</p>
            </div>

            {/* Condition Tracking */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-[10px] text-gray-400 font-black uppercase">Referral Progress</span>
                <span className="text-xs text-white font-bold">{user.rechargedReferrals} Nodes Active</span>
              </div>
              
              <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 p-[2px]">
                <div 
                  className="h-full bg-bybit rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(247,166,0,0.5)]" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mt-2">
                 <div className={`p-2 rounded-xl border text-center transition-colors ${user.rechargedReferrals >= tier1 ? 'bg-bybit/10 border-bybit/30' : 'bg-white/5 border-white/5'}`}>
                    <p className="text-[8px] text-gray-500 uppercase font-black tracking-widest">Tier 1 (9)</p>
                    <p className="text-xs text-bybit font-black">$10.00</p>
                 </div>
                 <div className={`p-2 rounded-xl border text-center transition-colors ${user.rechargedReferrals >= tier2 ? 'bg-bybit/10 border-bybit/30' : 'bg-white/5 border-white/5'}`}>
                    <p className="text-[8px] text-gray-500 uppercase font-black tracking-widest">Tier 2 (16)</p>
                    <p className="text-xs text-bybit font-black">$15.00</p>
                 </div>
                 <div className={`p-2 rounded-xl border text-center transition-colors ${user.rechargedReferrals >= tier3 ? 'bg-bybit/10 border-bybit/30' : 'bg-white/5 border-white/5'}`}>
                    <p className="text-[8px] text-gray-500 uppercase font-black tracking-widest">Tier 3 (20+)</p>
                    <p className="text-xs text-bybit font-black">$20.00</p>
                 </div>
              </div>
              
              <p className="text-[10px] text-gray-500 font-bold leading-relaxed text-center italic mt-4">
                Condition: Refer nodes that complete a successful Forge Recharge. Rewards scale with active network size.
              </p>
            </div>

            {canClaim ? (
              <button 
                onClick={onClaim}
                className="w-full bg-bybit text-black py-4 rounded-xl font-black uppercase tracking-widest hover:bg-white transition-all shadow-lg shadow-bybit/20 animate-bounce"
              >
                Claim Tier Reward
              </button>
            ) : (
              <div className="space-y-2">
                <button 
                  disabled
                  className="w-full bg-white/5 border border-white/10 text-gray-600 py-4 rounded-xl font-black uppercase tracking-widest cursor-not-allowed"
                >
                  {isTerminated ? 'SALARY TERMINATED' : (isApproved ? 'INJECTION PENDING' : 'APPROVAL PENDING')}
                </button>
                {!isApproved && !isTerminated && isCriteriaMet && (
                  <p className="text-[8px] text-yellow-500 font-black uppercase text-center tracking-widest animate-pulse">
                    Criteria Met. Awaiting System Approval.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalaryModal;
