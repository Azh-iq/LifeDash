// LifeDash Service Worker for Offline Functionality and Performance
const CACHE_NAME = 'lifedash-v1'
const STATIC_CACHE = 'lifedash-static-v1'
const DYNAMIC_CACHE = 'lifedash-dynamic-v1'
const API_CACHE = 'lifedash-api-v1'

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/investments',
  '/economy',
  '/hobby',
  '/tools',
  '/manifest.json',
  '/_next/static/css/app/globals.css',
  // Add other critical static assets
]

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/portfolio',
  '/api/stocks',
  '/api/prices',
  '/api/user',
]

// Network-first strategies for these paths
const NETWORK_FIRST_PATHS = ['/api/prices', '/api/realtime']

// Cache-first strategies for these paths
const CACHE_FIRST_PATHS = [
  '/_next/static/',
  '/images/',
  '/icons/',
  '.woff2',
  '.woff',
  '.ttf',
]

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('Service Worker installing...')

  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then(cache => {
        return cache.addAll(STATIC_ASSETS)
      }),
      // Skip waiting to activate immediately
      self.skipWaiting(),
    ])
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...')

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (
              cacheName !== STATIC_CACHE &&
              cacheName !== DYNAMIC_CACHE &&
              cacheName !== API_CACHE
            ) {
              console.log('Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      }),
      // Take control of all pages
      self.clients.claim(),
    ])
  )
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip requests to external domains (except APIs)
  if (url.origin !== self.location.origin && !isApiRequest(request)) {
    return
  }

  // Handle different types of requests
  if (isApiRequest(request)) {
    event.respondWith(handleApiRequest(request))
  } else if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request))
  } else if (isPageRequest(request)) {
    event.respondWith(handlePageRequest(request))
  } else {
    event.respondWith(handleGenericRequest(request))
  }
})

// API request handler
async function handleApiRequest(request) {
  const url = new URL(request.url)
  const isNetworkFirst = NETWORK_FIRST_PATHS.some(path =>
    url.pathname.includes(path)
  )

  if (isNetworkFirst) {
    return networkFirstStrategy(request, API_CACHE)
  } else {
    return cacheFirstStrategy(request, API_CACHE)
  }
}

// Static asset handler
async function handleStaticAsset(request) {
  return cacheFirstStrategy(request, STATIC_CACHE)
}

// Page request handler
async function handlePageRequest(request) {
  return networkFirstStrategy(request, DYNAMIC_CACHE)
}

// Generic request handler
async function handleGenericRequest(request) {
  return networkFirstStrategy(request, DYNAMIC_CACHE)
}

// Network-first strategy
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request)

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request)

    if (cachedResponse) {
      return cachedResponse
    }

    // If it's a page request and no cache, return offline page
    if (isPageRequest(request)) {
      return getOfflinePage()
    }

    throw error
  }
}

// Cache-first strategy
async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request)

  if (cachedResponse) {
    // Update cache in background
    updateCacheInBackground(request, cacheName)
    return cachedResponse
  }

  // Not in cache, fetch from network
  try {
    const networkResponse = await fetch(request)

    if (networkResponse.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    // Network failed and not in cache
    throw error
  }
}

// Update cache in background
async function updateCacheInBackground(request, cacheName) {
  try {
    const networkResponse = await fetch(request)

    if (networkResponse.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse)
    }
  } catch (error) {
    // Silently fail background updates
    console.log('Background cache update failed:', error)
  }
}

// Helper functions
function isApiRequest(request) {
  const url = new URL(request.url)
  return (
    url.pathname.startsWith('/api/') ||
    API_ENDPOINTS.some(endpoint => url.pathname.startsWith(endpoint))
  )
}

function isStaticAsset(request) {
  const url = new URL(request.url)
  return (
    CACHE_FIRST_PATHS.some(path => url.pathname.includes(path)) ||
    request.destination === 'image' ||
    request.destination === 'font' ||
    request.destination === 'style' ||
    request.destination === 'script'
  )
}

function isPageRequest(request) {
  return (
    request.mode === 'navigate' ||
    request.destination === 'document' ||
    request.headers.get('accept').includes('text/html')
  )
}

// Get offline page
async function getOfflinePage() {
  try {
    return (
      (await caches.match('/offline.html')) ||
      (await caches.match('/')) ||
      new Response('You are offline', {
        headers: { 'Content-Type': 'text/plain' },
      })
    )
  } catch (error) {
    return new Response('You are offline', {
      headers: { 'Content-Type': 'text/plain' },
    })
  }
}

// Background sync for failed requests
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  // Retry failed API requests
  try {
    const failedRequests = await getFailedRequests()

    for (const request of failedRequests) {
      try {
        await fetch(request)
        // Remove from failed requests
        await removeFailedRequest(request)
      } catch (error) {
        console.log('Background sync failed for:', request.url)
      }
    }
  } catch (error) {
    console.log('Background sync error:', error)
  }
}

// Store failed requests for retry
async function storeFailedRequest(request) {
  try {
    const db = await openDB()
    const tx = db.transaction(['failedRequests'], 'readwrite')
    const store = tx.objectStore('failedRequests')

    await store.add({
      url: request.url,
      method: request.method,
      headers: [...request.headers.entries()],
      body: await request.text(),
      timestamp: Date.now(),
    })
  } catch (error) {
    console.log('Failed to store failed request:', error)
  }
}

// Push notification handler
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Portfolio update available',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'portfolio-update',
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'View Portfolio',
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
      },
    ],
  }

  event.waitUntil(self.registration.showNotification('LifeDash', options))
})

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close()

  if (event.action === 'view') {
    event.waitUntil(clients.openWindow('/dashboard'))
  }
})

// Message handler for cache management
self.addEventListener('message', event => {
  if (event.data.type === 'CACHE_UPDATE') {
    event.waitUntil(updateCaches())
  } else if (event.data.type === 'CACHE_CLEAR') {
    event.waitUntil(clearCaches())
  } else if (event.data.type === 'PRELOAD_ROUTES') {
    event.waitUntil(preloadRoutes(event.data.routes))
  }
})

// Update caches
async function updateCaches() {
  try {
    const cache = await caches.open(STATIC_CACHE)
    await cache.addAll(STATIC_ASSETS)
    console.log('Cache updated successfully')
  } catch (error) {
    console.log('Cache update failed:', error)
  }
}

// Clear caches
async function clearCaches() {
  try {
    const cacheNames = await caches.keys()
    await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)))
    console.log('All caches cleared')
  } catch (error) {
    console.log('Cache clearing failed:', error)
  }
}

// Preload routes
async function preloadRoutes(routes) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE)
    const requests = routes.map(route => new Request(route))

    await Promise.all(
      requests.map(async request => {
        try {
          const response = await fetch(request)
          if (response.ok) {
            await cache.put(request, response)
          }
        } catch (error) {
          console.log('Failed to preload route:', request.url)
        }
      })
    )
  } catch (error) {
    console.log('Route preloading failed:', error)
  }
}

// IndexedDB helpers for offline data
async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('LifeDashOffline', 1)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = event => {
      const db = event.target.result

      if (!db.objectStoreNames.contains('failedRequests')) {
        db.createObjectStore('failedRequests', {
          keyPath: 'id',
          autoIncrement: true,
        })
      }

      if (!db.objectStoreNames.contains('portfolioData')) {
        db.createObjectStore('portfolioData', { keyPath: 'id' })
      }

      if (!db.objectStoreNames.contains('priceData')) {
        db.createObjectStore('priceData', { keyPath: 'symbol' })
      }
    }
  })
}

async function getFailedRequests() {
  try {
    const db = await openDB()
    const tx = db.transaction(['failedRequests'], 'readonly')
    const store = tx.objectStore('failedRequests')
    return await store.getAll()
  } catch (error) {
    return []
  }
}

async function removeFailedRequest(request) {
  try {
    const db = await openDB()
    const tx = db.transaction(['failedRequests'], 'readwrite')
    const store = tx.objectStore('failedRequests')

    const allRequests = await store.getAll()
    const toRemove = allRequests.find(req => req.url === request.url)

    if (toRemove) {
      await store.delete(toRemove.id)
    }
  } catch (error) {
    console.log('Failed to remove failed request:', error)
  }
}

// Performance monitoring
self.addEventListener('fetch', event => {
  // Track cache hit/miss ratios
  const startTime = performance.now()

  event.respondWith(
    (async () => {
      const response = await handleRequest(event.request)
      const endTime = performance.now()
      const duration = endTime - startTime

      // Log performance metrics
      if (duration > 1000) {
        console.log(`Slow request: ${event.request.url} took ${duration}ms`)
      }

      return response
    })()
  )
})

// Handle request wrapper
async function handleRequest(request) {
  // This would be called by the main fetch handler
  // Implementation depends on the specific caching strategy
  return fetch(request)
}

console.log('LifeDash Service Worker loaded')
