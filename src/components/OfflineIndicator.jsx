import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { isOnline, onNetworkChange } from '../utils/offline';

/**
 * Offline Indicator Banner
 * Shows a persistent banner when the device is offline.
 * Notifies user that submissions will be queued for later sync.
 */
const OfflineIndicator = () => {
  const [online, setOnline] = useState(isOnline());
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const cleanup = onNetworkChange((status) => {
      setOnline(status);
      if (status) {
        setShowReconnected(true);
        setTimeout(() => setShowReconnected(false), 3000);
      }
    });
    return cleanup;
  }, []);

  if (online && !showReconnected) return null;

  return (
    <div
      className={`
        fixed top-0 left-0 right-0 z-[60] text-center py-2 px-4
        transition-all duration-300 text-kiosk-sm font-semibold
        ${online
          ? 'bg-green-500 text-white'
          : 'bg-red-600 text-white'}
      `}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-center justify-center gap-2">
        {online ? (
          <>
            <Wifi className="w-5 h-5" />
            <span>Back online! Syncing pending submissions...</span>
          </>
        ) : (
          <>
            <WifiOff className="w-5 h-5" />
            <span>You are offline. Submissions will be saved and synced when connection is restored.</span>
          </>
        )}
      </div>
    </div>
  );
};

export default OfflineIndicator;
