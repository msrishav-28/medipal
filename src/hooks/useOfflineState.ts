import { useState, useEffect } from 'react';
import { offlineSyncService } from '@/services/offlineSyncService';

export interface UseOfflineStateReturn {
  isOnline: boolean;
  pendingActionsCount: number;
  queueAction: (type: any, payload: any) => Promise<void>;
  processPendingActions: () => Promise<void>;
}

/**
 * Hook for managing offline state and sync queue
 */
export function useOfflineState(): UseOfflineStateReturn {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingActionsCount, setPendingActionsCount] = useState(0);

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    const updatePendingCount = async () => {
      const count = await offlineSyncService.getPendingCount();
      setPendingActionsCount(count);
    };

    // Initial count
    updatePendingCount();

    // Set up event listeners
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Poll for pending count updates
    const interval = setInterval(updatePendingCount, 5000);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      clearInterval(interval);
    };
  }, []);

  const queueAction = async (type: any, payload: any) => {
    await offlineSyncService.queueAction(type, payload);
    const count = await offlineSyncService.getPendingCount();
    setPendingActionsCount(count);
  };

  const processPendingActions = async () => {
    await offlineSyncService.processPendingActions();
    const count = await offlineSyncService.getPendingCount();
    setPendingActionsCount(count);
  };

  return {
    isOnline,
    pendingActionsCount,
    queueAction,
    processPendingActions,
  };
}
