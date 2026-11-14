import React, { useEffect, useState } from 'react';
import api from '../api';

interface RechargeRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type RechargeRow = {
  id: string;
  userId: string;
  amount: string | number;
  coin?: string;
  chain?: string;
  status: string;
  txId?: string | null;
  createdAt?: string;
};

const RechargeRecordModal: React.FC<RechargeRecordModalProps> = ({ isOpen, onClose }) => {
  const [records, setRecords] = useState<RechargeRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/recharge/records');
      setRecords(Array.isArray(res.data) ? res.data : []);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) load();
  }, [isOpen]);

  if (!isOpen) return null;

  const statusClass = (s: string) => {
    const st = String(s || '').toLowerCase();
    if (st === 'completed' || st === 'approved') return 'text-green-500';
    if (st === 'rejected') return 'text-red-500';
    return 'text-primary';
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={onClose}></div>

      <div className="relative bg-white w-full h-full md:max-w-2xl md:h-auto md:max-h-[90vh] md:rounded-lg overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-300 flex flex-col">
        <header className="bg-primary h-12 flex items-center px-4 shrink-0 shadow-sm">
          <button onClick={onClose} className="text-white hover:opacity-80 transition-opacity">
            <i className="fa-solid fa-arrow-right text-xl"></i>
          </button>
          <h2 className="ml-4 text-white font-bold text-sm tracking-tight uppercase italic">Recharge Record</h2>
        </header>

        <div className="flex-1 overflow-y-auto bg-white">
          {loading ? (
            <div className="p-12 text-center text-gray-400">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-sm">Loading recharge records...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <i className="fa-solid fa-folder-open text-4xl mb-4 opacity-20"></i>
              <p className="text-sm">No recharge records detected.</p>
            </div>
          ) : (
            records.map((record) => (
              <div key={record.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                <div className="px-6 py-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-800">Status</span>
                    <span className={`text-sm font-medium ${statusClass(record.status)}`}>
                      {record.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400 font-normal">Amount</span>
                    <span className="text-xs text-gray-400 font-normal">Time</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-800 font-medium">${Number(record.amount).toFixed(2)} {record.coin || 'USDT'}</span>
                    <span className="text-sm text-gray-800 font-medium">
                      {record.createdAt ? new Date(record.createdAt).toLocaleString() : '-'}
                    </span>
                  </div>
                  {record.chain && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400 font-normal">Network</span>
                      <span className="text-xs text-gray-500 font-medium">{record.chain}</span>
                    </div>
                  )}
                  {record.txId && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400 font-normal">TX ID</span>
                      <code className="text-xs text-gray-500 font-mono truncate max-w-[180px]">{record.txId}</code>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="bg-white px-6 py-4 flex justify-end border-t border-gray-100">
           <p className="text-[10px] text-gray-300 uppercase font-black tracking-widest italic">Clipher Forge System</p>
        </div>
      </div>
    </div>
  );
};

export default RechargeRecordModal;
