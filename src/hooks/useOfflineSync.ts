import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface OfflineAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'user' | 'medication' | 'intakeRecord';
  data: any;
  timestamp: number;
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingActions, setPendingActions] = useState<OfflineAction[]>([]);
  
  // Use queryClient only if available (for testing compatibility)
  let queryClient;
  try {
    queryClient = useQueryClient();
  } catch {
    // QueryClient not available (e.g., in tests without provider)
    queryClient = null;
  }

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load pending actions from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('offline-actions');
    if (stored) {
      try {
        const actions = JSON.parse(stored);
        setPendingActions(actions);
      } catch (error) {
        console.error('Failed to parse offline actions:', error);
        localStorage.removeItem('offline-actions');
      }
    }
  }, []);

  // Save pending actions to localStorage whenever they change
  useEffect(() => {
    if (pendingActions.length > 0) {
      localStorage.setItem('offline-actions', JSON.stringify(pendingActions));
    } else {
      localStorage.removeItem('offline-actions');
    }
  }, [pendingActions]);

  // Sync pending actions when coming back online
  useEffect(() => {
    if (isOnline && pendingActions.length > 0) {
      syncPendingActions();
    }
  }, [isOnline, pendingActions.length]);

  const addOfflineAction = (action: Omit<OfflineAction, 'id' | 'timestamp'>) => {
    const newAction: OfflineAction = {
      ...action,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };

    setPendingActions(prev => [...prev, newAction]);
  };

  const syncPendingActions = async () => {
    if (!isOnline || pendingActions.length === 0) return;

    const actionsToSync = [...pendingActions];
    
    for (const action of actionsToSync) {
      try {
        await executeAction(action);
        
        // Remove successful action from pending list
        setPendingActions(prev => prev.filter(a => a.id !== action.id));
      } catch (error) {
        console.error('Failed to sync action:', action, error);
        // Keep the action in pending list for retry
      }
    }

    // Invalidate all queries to refresh data after sync
    if (queryClient) {
      queryClient.invalidateQueries();
    }
  };

  const executeAction = async (action: OfflineAction) => {
    // This would typically make API calls to sync with server
    // For now, we'll just log the action since we're using local storage
    console.log('Syncing offline action:', action);
    
    // In a real implementation, you would:
    // 1. Make API calls based on action.type and action.entity
    // 2. Handle conflicts if server data has changed
    // 3. Update local cache with server response
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100));
  };

  const clearPendingActions = () => {
    setPendingActions([]);
    localStorage.removeItem('offline-actions');
  };

  const retryFailedActions = () => {
    if (isOnline) {
      syncPendingActions();
    }
  };

  return {
    isOnline,
    pendingActions,
    hasPendingActions: pendingActions.length > 0,
    addOfflineAction,
    syncPendingActions,
    clearPendingActions,
    retryFailedActions,
  };
}