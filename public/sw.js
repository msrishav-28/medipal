// Service Worker for MediCare System
// Handles background notifications and offline functionality

const CACHE_NAME = 'medicare-v1';
const NOTIFICATION_CACHE = 'medicare-notifications-v1';

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.json',
        '/icons/pill-icon.png',
        '/icons/badge-icon.png',
        '/icons/check-icon.png',
        '/icons/snooze-icon.png',
        '/icons/skip-icon.png'
      ]);
    })
  );
  
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== NOTIFICATION_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Claim all clients immediately
  self.clients.claim();
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      return response || fetch(event.request);
    })
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  const notification = event.notification;
  const action = event.action;
  const data = notification.data;
  
  notification.close();
  
  // Handle different notification actions
  if (action === 'taken') {
    handleMedicationTaken(data);
  } else if (action === 'snooze') {
    handleMedicationSnooze(data);
  } else if (action === 'skip') {
    handleMedicationSkip(data);
  } else {
    // Default click - open the app
    openApp(data);
  }
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Push message received:', event);
  
  if (!event.data) {
    return;
  }
  
  const payload = event.data.json();
  
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon || '/icons/pill-icon.png',
      badge: payload.badge || '/icons/badge-icon.png',
      image: payload.image,
      data: payload.data,
      actions: payload.actions,
      requireInteraction: true,
      vibrate: [200, 100, 200]
    })
  );
});

// Background sync event
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'medication-sync') {
    event.waitUntil(syncMedicationData());
  }
});

// Helper functions
async function handleMedicationTaken(data) {
  console.log('Medication taken:', data);
  
  // Send message to client
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'MEDICATION_TAKEN',
      data: data
    });
  });
  
  // Store action for sync when online
  await storeOfflineAction('taken', data);
}

async function handleMedicationSnooze(data) {
  console.log('Medication snoozed:', data);
  
  // Send message to client
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'MEDICATION_SNOOZED',
      data: data
    });
  });
  
  // Store action for sync when online
  await storeOfflineAction('snoozed', data);
}

async function handleMedicationSkip(data) {
  console.log('Medication skipped:', data);
  
  // Send message to client
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'MEDICATION_SKIPPED',
      data: data
    });
  });
  
  // Store action for sync when online
  await storeOfflineAction('skipped', data);
}

async function openApp(data) {
  console.log('Opening app:', data);
  
  const clients = await self.clients.matchAll();
  
  if (clients.length > 0) {
    // Focus existing window
    clients[0].focus();
    clients[0].postMessage({
      type: 'NOTIFICATION_CLICKED',
      data: data
    });
  } else {
    // Open new window
    self.clients.openWindow('/');
  }
}

async function storeOfflineAction(action, data) {
  try {
    const cache = await caches.open(NOTIFICATION_CACHE);
    const actionData = {
      action,
      data,
      timestamp: new Date().toISOString()
    };
    
    const response = new Response(JSON.stringify(actionData));
    await cache.put(`/offline-action-${Date.now()}`, response);
  } catch (error) {
    console.error('Failed to store offline action:', error);
  }
}

async function syncMedicationData() {
  try {
    console.log('Syncing medication data...');
    
    const cache = await caches.open(NOTIFICATION_CACHE);
    const keys = await cache.keys();
    
    // Process offline actions
    for (const request of keys) {
      if (request.url.includes('/offline-action-')) {
        const response = await cache.match(request);
        const actionData = await response.json();
        
        // Send to server (in a real app)
        console.log('Syncing offline action:', actionData);
        
        // Remove from cache after successful sync
        await cache.delete(request);
      }
    }
  } catch (error) {
    console.error('Failed to sync medication data:', error);
  }
}