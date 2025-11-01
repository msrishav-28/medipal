import { db } from './database';
import type { IntakeRecord, Medication } from '@/types';

interface PendingAction {
  id: string;
  type: 'intake-create' | 'intake-update' | 'medication-create' | 'medication-update' | 'medication-delete';
  payload: any;
  timestamp: Date;
  retryCount: number;
}

class OfflineSyncService {
  private syncInProgress = false;
  private maxRetries = 3;

  /**
   * Queue an action for later sync when offline
   */
  async queueAction(
    type: PendingAction['type'],
    payload: any
  ): Promise<void> {
    const action: Omit<PendingAction, 'id'> = {
      type,
      payload,
      timestamp: new Date(),
      retryCount: 0,
    };

    // Store in IndexedDB for persistence
    await db.table('pendingActions').add(action);
    console.log('Action queued for sync:', type, payload);
  }

  /**
   * Process all pending actions when back online
   */
  async processPendingActions(): Promise<void> {
    if (this.syncInProgress) {
      console.log('Sync already in progress, skipping...');
      return;
    }

    if (!navigator.onLine) {
      console.log('Still offline, cannot sync');
      return;
    }

    this.syncInProgress = true;

    try {
      const pendingActions = await db.table('pendingActions').toArray();

      console.log(`Processing ${pendingActions.length} pending actions`);

      for (const action of pendingActions) {
        try {
          await this.processAction(action);
          // Remove from queue after successful processing
          await db.table('pendingActions').delete(action.id);
        } catch (error) {
          console.error('Failed to process action:', action, error);
          
          // Increment retry count
          action.retryCount++;
          
          if (action.retryCount >= this.maxRetries) {
            console.error('Max retries exceeded, removing action:', action);
            await db.table('pendingActions').delete(action.id);
          } else {
            // Update retry count in DB
            await db.table('pendingActions').update(action.id, {
              retryCount: action.retryCount,
            });
          }
        }
      }

      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Process a single pending action
   */
  private async processAction(action: PendingAction): Promise<void> {
    switch (action.type) {
      case 'intake-create':
        await this.syncIntakeRecord(action.payload);
        break;
      case 'intake-update':
        await this.syncIntakeUpdate(action.payload);
        break;
      case 'medication-create':
        await this.syncMedicationCreate(action.payload);
        break;
      case 'medication-update':
        await this.syncMedicationUpdate(action.payload);
        break;
      case 'medication-delete':
        await this.syncMedicationDelete(action.payload);
        break;
      default:
        console.warn('Unknown action type:', action.type);
    }
  }

  /**
   * Sync intake record creation
   */
  private async syncIntakeRecord(record: IntakeRecord): Promise<void> {
    // In a real app, this would send to backend API
    // For now, just ensure it's in local DB
    console.log('Syncing intake record:', record);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 100));
    
    // Update local record to mark as synced
    if (record.id) {
      await db.table('intakeRecords').update(record.id, {
        ...record,
        synced: true,
      });
    }
  }

  /**
   * Sync intake record update
   */
  private async syncIntakeUpdate(data: { id: string; updates: Partial<IntakeRecord> }): Promise<void> {
    console.log('Syncing intake update:', data);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 100));
    
    // Update local record
    await db.table('intakeRecords').update(data.id, {
      ...data.updates,
      synced: true,
    });
  }

  /**
   * Sync medication creation
   */
  private async syncMedicationCreate(medication: Medication): Promise<void> {
    console.log('Syncing medication create:', medication);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 100));
    
    // Update local record to mark as synced
    if (medication.id) {
      await db.table('medications').update(medication.id, {
        ...medication,
        synced: true,
      });
    }
  }

  /**
   * Sync medication update
   */
  private async syncMedicationUpdate(data: { id: string; updates: Partial<Medication> }): Promise<void> {
    console.log('Syncing medication update:', data);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 100));
    
    // Update local record
    await db.table('medications').update(data.id, {
      ...data.updates,
      synced: true,
    });
  }

  /**
   * Sync medication deletion
   */
  private async syncMedicationDelete(id: string): Promise<void> {
    console.log('Syncing medication delete:', id);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 100));
    
    // Delete from local DB
    await db.table('medications').delete(id);
  }

  /**
   * Get count of pending actions
   */
  async getPendingCount(): Promise<number> {
    const count = await db.table('pendingActions').count();
    return count;
  }

  /**
   * Clear all pending actions (use with caution)
   */
  async clearAllPending(): Promise<void> {
    await db.table('pendingActions').clear();
    console.log('All pending actions cleared');
  }

  /**
   * Register background sync
   */
  async registerBackgroundSync(): Promise<void> {
    if ('serviceWorker' in navigator && 'sync' in (ServiceWorkerRegistration.prototype as any)) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await (registration as any).sync.register('medication-sync');
        console.log('Background sync registered');
      } catch (error) {
        console.error('Failed to register background sync:', error);
      }
    } else {
      console.log('Background sync not supported');
    }
  }
}

export const offlineSyncService = new OfflineSyncService();

// Listen for online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Back online, processing pending actions...');
    offlineSyncService.processPendingActions();
  });

  window.addEventListener('offline', () => {
    console.log('Gone offline, queueing actions...');
  });
}
