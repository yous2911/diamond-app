/**
 * useOfflineMode Hook
 * React hook for managing offline mode state and functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { networkDetector } from '../services/offline/networkDetector';
import { offlineApiWrapper } from '../services/offline/offlineApiWrapper';

export const useOfflineMode = () => {
  const [isOnline, setIsOnline] = useState(networkDetector.getOnlineStatus());
  const [queueLength, setQueueLength] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const unsubscribe = networkDetector.subscribe((online) => {
      setIsOnline(online);
      
      // Auto-sync when coming back online
      if (online) {
        handleSync();
      }
    });

    // Update queue length periodically
    const interval = setInterval(() => {
      setQueueLength(offlineApiWrapper.getQueueLength());
    }, 2000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const handleSync = useCallback(async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    try {
      const results = await offlineApiWrapper.syncQueue();
      setQueueLength(offlineApiWrapper.getQueueLength());
      return results;
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  return {
    isOnline,
    isOffline: !isOnline,
    queueLength,
    isSyncing,
    sync: handleSync,
  };
};

export default useOfflineMode;

