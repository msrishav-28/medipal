import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi, CloudOff, AlertCircle } from 'lucide-react';
import { offlineSyncService } from '@/services/offlineSyncService';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      updatePendingCount();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const updatePendingCount = async () => {
      const count = await offlineSyncService.getPendingCount();
      setPendingCount(count);
    };

    // Initial count
    updatePendingCount();

    // Set up listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Poll for pending count updates
    const interval = setInterval(updatePendingCount, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  // Don't show if online and no pending actions
  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`fixed top-16 right-4 z-40 px-3 py-2 rounded-lg shadow-md transition-all ${
          isOnline
            ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}
        aria-label={isOnline ? 'Syncing pending actions' : 'Offline mode'}
      >
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="w-4 h-4" />
          ) : (
            <WifiOff className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">
            {isOnline
              ? pendingCount > 0
                ? `Syncing ${pendingCount}`
                : 'Online'
              : 'Offline'}
          </span>
        </div>
      </button>

      {showDetails && (
        <div className="fixed top-28 right-4 z-40 w-72 bg-white rounded-lg shadow-xl border border-gray-200 p-4">
          <div className="flex items-start gap-3 mb-4">
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                isOnline ? 'bg-yellow-100' : 'bg-red-100'
              }`}
            >
              {isOnline ? (
                <CloudOff className={`w-5 h-5 ${isOnline ? 'text-yellow-600' : 'text-red-600'}`} />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
            </div>
            
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                {isOnline ? 'Sync Status' : 'Offline Mode'}
              </h3>
              <p className="text-xs text-gray-600">
                {isOnline
                  ? pendingCount > 0
                    ? `You have ${pendingCount} action${pendingCount !== 1 ? 's' : ''} waiting to sync.`
                    : 'All data is synced.'
                  : 'You are currently offline. Changes will sync when you reconnect.'}
              </p>
            </div>
          </div>

          {!isOnline && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-blue-800">
                  <p className="font-medium mb-1">What you can do offline:</p>
                  <ul className="list-disc list-inside space-y-0.5 ml-1">
                    <li>View your medications</li>
                    <li>Log medication intakes</li>
                    <li>Set reminders</li>
                    <li>View history and analytics</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {pendingCount > 0 && (
            <div className="bg-gray-50 rounded-md p-3">
              <p className="text-xs text-gray-700">
                <span className="font-medium">Pending Actions:</span> {pendingCount}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {isOnline
                  ? 'These will sync automatically.'
                  : 'These will sync when you reconnect.'}
              </p>
            </div>
          )}

          <button
            onClick={() => setShowDetails(false)}
            className="mt-3 w-full px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      )}
    </>
  );
};
