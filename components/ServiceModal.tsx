
import React from 'react';

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
}

const ServiceModal: React.FC<ServiceModalProps> = ({ isOpen, onClose, email }) => {
  if (!isOpen) return null;

  const contactNumber = '2349023574740';
  const displayMobile = '+234 902 357 4740';
  const telegramHandle = '@Younglegend40';
  const telegramLink = 'https://t.me/Younglegend40';

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-white" onClick={onClose}></div>
      
      <div className="relative w-full h-full bg-[#f8f9fa] flex flex-col animate-in fade-in duration-300">
        <div className="bg-primary h-12 flex items-center px-4 shrink-0 shadow-sm">
          <button onClick={onClose} className="text-white hover:opacity-80 transition-opacity">
            <i className="fa-solid fa-arrow-left text-xl"></i>
          </button>
        </div>

        <div className="p-4 space-y-4">
          <h2 className="text-gray-800 text-lg font-medium px-2">Service Center</h2>

          {/* Email Support */}
          <a 
            href={`mailto:${email}`}
            className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm active:bg-gray-50 transition-colors border border-gray-100"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <i className="fa-solid fa-envelope text-primary text-lg"></i>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-700 font-bold text-sm">Email Support</span>
                <span className="text-[10px] text-gray-400 font-medium">{email}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-gray-400">
              <span className="text-[10px] uppercase font-black tracking-widest">Consult</span>
              <i className="fa-solid fa-chevron-right text-[10px]"></i>
            </div>
          </a>

          {/* WhatsApp Support */}
          <a 
            href={`https://wa.me/${contactNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm active:bg-gray-50 transition-colors border border-gray-100"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#25D366]/10 flex items-center justify-center">
                <i className="fa-brands fa-whatsapp text-[#25D366] text-xl"></i>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-700 font-bold text-sm">WhatsApp Support</span>
                <span className="text-[10px] text-gray-400 font-medium">{displayMobile}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-gray-400">
              <span className="text-[10px] uppercase font-black tracking-widest">Connect</span>
              <i className="fa-solid fa-chevron-right text-[10px]"></i>
            </div>
          </a>

          {/* Telegram Support */}
          <a 
            href={telegramLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm active:bg-gray-50 transition-colors border border-gray-100"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#0088cc]/10 flex items-center justify-center">
                <i className="fa-brands fa-telegram text-[#0088cc] text-xl"></i>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-700 font-bold text-sm">Telegram Support</span>
                <span className="text-[10px] text-gray-400 font-medium">{telegramHandle}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-gray-400">
              <span className="text-[10px] uppercase font-black tracking-widest">Join</span>
              <i className="fa-solid fa-chevron-right text-[10px]"></i>
            </div>
          </a>

          <div className="px-4 py-4 bg-white/50 rounded-xl border border-dashed border-gray-200">
            <h3 className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2">Notice to Operators</h3>
            <p className="text-[11px] text-gray-400 font-medium leading-relaxed italic">
              Our technical department is available to assist with protocol synchronization, asset extraction issues, or node authentication failures. Contact support via WhatsApp or Telegram for immediate assistance.
            </p>
          </div>
        </div>

        <div className="mt-auto p-12 flex flex-col items-center opacity-10 grayscale">
          <div className="relative w-16 h-16 mb-2">
            <div className="absolute inset-0 rounded-full border-2 border-primary opacity-30"></div>
            <div className="absolute inset-2 rounded-full bg-gold-gradient flex items-center justify-center border border-white/20">
              <span className="text-[#5c4014] font-black text-xl tracking-tighter">CF</span>
            </div>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em]">Clipher Forge Terminal</p>
        </div>
      </div>
    </div>
  );
};

export default ServiceModal;
