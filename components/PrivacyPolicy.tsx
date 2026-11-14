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

const PrivacyPolicy: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <PolicyShell title="Privacy Policy" onBack={onBack}>
    <p>ClipherForge Exchange ("we", "us") respects your privacy. This policy describes how we collect, use, and protect your information.</p>
    <h2 className="font-bold">Information collected</h2>
    <p>Email address, account credentials, transaction history, device and usage data necessary to operate the exchange.</p>
    <h2 className="font-bold">Use of information</h2>
    <p>To provide trading, wallet, and account services; to prevent fraud and abuse; to comply with legal obligations.</p>
    <h2 className="font-bold">Data security</h2>
    <p>We use industry-standard security including Supabase authentication and encrypted transport. You are responsible for keeping credentials safe.</p>
    <h2 className="font-bold">Third parties</h2>
    <p>Authentication is provided by Supabase. We do not sell personal data.</p>
    <h2 className="font-bold">Contact</h2>
    <p>For privacy questions contact support@clipherforge.example.</p>
  </PolicyShell>
);

export default PrivacyPolicy;