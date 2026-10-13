import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center space-x-2 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-2xl border border-amber-400 animate-in fade-in duration-300">
      <WifiOff className="w-4 h-4 animate-pulse text-amber-200" />
      <div>
        <p className="font-bold">Offline Mode Active</p>
        <p className="text-[10px] text-amber-100 font-normal">
          Working offline with cached school and student records.
        </p>
      </div>
    </div>
  );
};
