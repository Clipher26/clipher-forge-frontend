
import React from 'react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose}></div>
      
      <div className="relative bg-[#f8f9fa] w-full h-full md:max-w-2xl md:h-auto md:max-h-[90vh] md:rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col">
        {/* Uniform Header */}
        <header className="bg-primary h-12 flex items-center px-4 shrink-0 shadow-sm">
          <button onClick={onClose} className="text-white hover:opacity-80 transition-opacity">
            <i className="fa-solid fa-arrow-left text-xl"></i>
          </button>
          <h2 className="ml-4 text-white font-bold text-sm tracking-tight uppercase italic">About Us</h2>
        </header>
        
        <div className="flex-1 overflow-y-auto p-8 space-y-8 text-gray-700">
          <section className="space-y-4">
            <h3 className="text-gray-900 font-black uppercase italic tracking-tighter flex items-center gap-2">
              <div className="w-1.5 h-4 bg-primary"></div>
              Clipher Forge Global Ltd
            </h3>
            <p className="text-sm leading-relaxed">
              Clipher Forge Global was registered in London, United Kingdom, in 2024. The company’s full legal name is <span className="text-gray-900 font-bold">CLIPHER FORGE GLOBAL EXCHANGE LTD</span>.
            </p>
            <p className="text-sm leading-relaxed">
              The founding team is composed of senior financial technology professionals from the UK and Singapore, with extensive experience in developing high-frequency trading platforms and risk control engines.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-gray-900 font-black uppercase italic tracking-tighter flex items-center gap-2">
              <div className="w-1.5 h-4 bg-primary"></div>
              Achievements
            </h3>
            <p className="text-sm leading-relaxed">
              With over <span className="text-gray-900 font-bold">500,000+</span> global users, Clipher Forge Global has consistently expanded its share of the global cryptocurrency investment market, creating new industry benchmarks.
            </p>
          </section>

          <section className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
            <h3 className="text-gray-900 font-black uppercase italic tracking-tighter mb-4">Our Mission</h3>
            <p className="text-sm italic text-primary font-medium mb-4">
              “Forging the digital future and unlocking new wealth opportunities”
            </p>
            <p className="text-sm leading-relaxed">
              Clipher Forge Global is dedicated to building an intelligent cryptocurrency smart-contract trading system focused on transaction efficiency, accuracy, and automation.
            </p>
          </section>

          <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-gray-900 font-black uppercase italic tracking-tighter mb-4">Company Profile</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">Company Number</p>
                <p className="text-xs text-gray-800 font-medium">16657633</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">Registration Date</p>
                <p className="text-xs text-gray-800 font-medium">September 18, 2024</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">Headquarters</p>
                <p className="text-xs text-gray-800 font-medium leading-relaxed">
                  30 Fenchurch Street, London, England, EC3M 3BD
                </p>
              </div>
            </div>
          </section>
        </div>
        
        <div className="p-4 bg-white text-center shrink-0 border-t border-gray-50">
           <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.4em]">Official Registry Protocol V4.2</p>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;
