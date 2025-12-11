/**
 * useOfflinePreload Hook
 * Automatically preloads exercises based on SuperMemo schedule when online
 */

import { useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { networkDetector } from '../services/offline/networkDetector';
import { offlineApiWrapper } from '../services/offline/offlineApiWrapper';

export const useOfflinePreload = () => {
  const { student, isAuthenticated } = useAuth();

  const preload = useCallback(async () => {
    if (!isAuthenticated || !student?.id) return;
    if (!networkDetector.getOnlineStatus()) return; // Only preload when online

    try {
      await offlineApiWrapper.preloadExercisesForOffline(student.id);
    } catch (error) {
      console.error('Failed to preload exercises:', error);
    }
  }, [student?.id, isAuthenticated]);

  // Preload when student logs in and goes online
  useEffect(() => {
    if (!isAuthenticated || !student?.id) return;

    // Preload immediately if online
    if (networkDetector.getOnlineStatus()) {
      preload();
    }

    // Also preload when connection is restored
    const unsubscribe = networkDetector.subscribe((isOnline) => {
      if (isOnline && isAuthenticated && student?.id) {
        preload();
      }
    });

    return unsubscribe;
  }, [preload, isAuthenticated, student?.id]);

  // Preload periodically (every 30 minutes) when online
  useEffect(() => {
    if (!isAuthenticated || !student?.id) return;

    const interval = setInterval(() => {
      if (networkDetector.getOnlineStatus()) {
        preload();
      }
    }, 30 * 60 * 1000); // 30 minutes

    return () => clearInterval(interval);
  }, [preload, isAuthenticated, student?.id]);

  return { preload };
};

export default useOfflinePreload;

