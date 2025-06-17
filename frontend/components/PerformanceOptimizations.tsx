/**
 * Service Worker Registration and Performance Optimizations
 * 
 * Registers service worker for caching and adds performance monitoring
 */

'use client';

import { useEffect } from 'react';

export function PerformanceOptimizations() {
  useEffect(() => {
    // Register service worker for caching
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);

          // Listen for service worker updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New service worker is available, clear caches and reload
                  console.log('New service worker available, clearing caches...');
                  caches.keys().then((cacheNames) => {
                    return Promise.all(
                      cacheNames.map((cacheName) => {
                        if (cacheName.startsWith('atchat-v')) {
                          return caches.delete(cacheName);
                        }
                      })
                    );
                  }).then(() => {
                    // Optionally show a notification to user about update
                    console.log('Caches cleared, new version available');
                    // You can add a toast notification here if desired
                  });
                }
              });
            }
          });
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    }

    // Preload critical resources
    const preloadLink = document.createElement('link');
    preloadLink.rel = 'preload';
    preloadLink.href = '/logo.png';
    preloadLink.as = 'image';
    document.head.appendChild(preloadLink);

    // Monitor performance
    if ('performance' in window) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          console.log('Page Load Performance:', {
            domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
            loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
            totalTime: perfData.loadEventEnd - perfData.fetchStart
          });
        }, 0);
      });
    }

    // Monitor memory usage (if available)
    if ('memory' in performance) {
      const memoryInfo = (performance as any).memory;
      console.log('Memory Usage:', {
        used: (memoryInfo.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
        total: (memoryInfo.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
        limit: (memoryInfo.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB'
      });
    }
  }, []);

  return null;
}

export default PerformanceOptimizations;
