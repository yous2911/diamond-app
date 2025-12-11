/**
 * Offline Indicator Component
 * Shows offline status and sync queue information
 */

import React from 'react';
import { useOfflineMode } from '../hooks/useOfflineMode';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const { isOnline, queueLength, isSyncing, sync } = useOfflineMode();

  if (isOnline && queueLength === 0) {
    return null; // Don't show anything when online and no queue
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOnline ? (
        <div className="bg-amber-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-pulse">
          <WifiOff className="w-5 h-5" />
          <div>
            <p className="font-semibold text-sm">Mode hors ligne</p>
            <p className="text-xs opacity-90">
              {queueLength > 0 
                ? `${queueLength} requête${queueLength > 1 ? 's' : ''} en attente`
                : 'Utilisation des données mises en cache'}
            </p>
          </div>
        </div>
      ) : queueLength > 0 ? (
        <div className="bg-blue-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
          <Wifi className="w-5 h-5" />
          <div className="flex-1">
            <p className="font-semibold text-sm">Synchronisation...</p>
            <p className="text-xs opacity-90">
              {queueLength} requête{queueLength > 1 ? 's' : ''} en attente
            </p>
          </div>
          <button
            onClick={sync}
            disabled={isSyncing}
            className="ml-2 p-1 hover:bg-blue-600 rounded transition-colors disabled:opacity-50"
            aria-label="Synchroniser maintenant"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default OfflineIndicator;

