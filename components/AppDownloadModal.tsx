
import React from 'react';

interface AppDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AppDownloadModal: React.FC<AppDownloadModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose}></div>
      
      <div className="relative bg-[#f8f9fa] w-full h-full md:max-w-md md:h-auto md:max-h-[80vh] md:rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-300 flex flex-col">
        <header className="bg-primary h-12 flex items-center px-4 shrink-0 shadow-sm">
          <button onClick={onClose} className="text-white hover:opacity-80 transition-opacity">
            <i className="fa-solid fa-arrow-left text-xl"></i>
          </button>
          <h2 className="ml-4 text-white font-bold text-sm tracking-tight uppercase italic">Download Center</h2>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="p-8 space-y-8">
            <div className="text-center">
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Select Your Platform</h3>
              <p className="text-xs text-gray-500 mt-2">Get the native Clipher Forge experience</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {/* Android Section */}
              <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:border-primary transition-colors group">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500 text-2xl">
                    <i className="fa-brands fa-android"></i>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Android App</h4>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Direct APK Download</p>
                  </div>
                </div>
                <button 
                  onClick={() => window.open('/downloads/ClipherForge.apk', '_blank')}
                  className="w-full bg-green-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs active:scale-95 transition-all shadow-md shadow-green-500/20"
                >
                  Download APK
                </button>
              </div>

              {/* iOS Section */}
              <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:border-primary transition-colors group">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gray-900/5 flex items-center justify-center text-gray-900 text-2xl">
                    <i className="fa-brands fa-apple"></i>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">iOS Web App</h4>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Apple Wrapper Setup</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <p className="text-[10px] text-gray-600 font-bold leading-relaxed">
                      <i className="fa-solid fa-circle-info text-primary mr-1"></i>
                      To install on iPhone:
                    </p>
                    <ol className="text-[10px] text-gray-500 mt-2 space-y-1 ml-4 list-decimal font-medium">
                      <li>Tap the <i className="fa-solid fa-arrow-up-from-bracket"></i> Share button in Safari</li>
                      <li>Scroll down and tap <span className="text-gray-900 font-bold">"Add to Home Screen"</span></li>
                      <li>Tap <span className="text-primary font-bold">"Add"</span> in the top right corner</li>
                    </ol>
                  </div>
                  <button 
                    onClick={() => alert("Safari detected: Please use the 'Add to Home Screen' option in your browser menu to install the Clipher Forge wrapper.")}
                    className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs active:scale-95 transition-all shadow-md"
                  >
                    Install Guide
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 bg-primary/5 rounded-2xl border border-dashed border-primary/20">
              <p className="text-[9px] text-gray-600 font-bold leading-relaxed italic text-center">
                * Our Web-to-App wrapper ensures you stay connected to the real-time liquidity node without browser interruptions.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white shrink-0 border-t border-gray-50">
          <button 
            onClick={onClose}
            className="w-full bg-primary text-white py-4 rounded-xl font-black uppercase tracking-widest active:scale-95 transition-all shadow-md"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppDownloadModal;
