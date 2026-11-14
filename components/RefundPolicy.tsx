import React from 'react';

interface PolicyViewProps {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
}

const PolicyShell: React.FC<PolicyViewProps> = ({ title, onBack, children }) => (
  <div className="flex flex-col min-h-screen bg-white max-w-md mx-auto">
    <header className="bg-primary h-12 flex items-center px-4 justify-between sticky top-0 z-50">
      <button onClick={onBack} className="text-white text-xl p-2 hover:opacity-80 transition-opacity">
        <i className="fa-solid fa-arrow-left"></i>
      </button>
      <h1 className="text-white font-bold text-sm uppercase italic">{title}</h1>
      <div className="w-6"></div>
    </header>
    <div className="flex-1 px-6 py-6 overflow-y-auto text-sm text-gray-700 space-y-4">
      {children}
    </div>
  </div>
);

const RefundPolicy: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <PolicyShell title="Refund Policy" onBack={onBack}>
    <p>ClipherForge Exchange does not offer refunds on deposits under normal circumstances.</p>
    <p>Exceptions: deposits made through illegal measures will be refunded to the corresponding source accounts; or where a user has placed insurance covering the loss, the insured amount may be refunded per the insurance terms.</p>
    <p>All refund requests are reviewed case by case. Contact support for assistance.</p>
  </PolicyShell>
);

export default RefundPolicy;