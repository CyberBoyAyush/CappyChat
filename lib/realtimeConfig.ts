/**
 * Real-time Sync Configuration
 * 
 * Centralized configuration for real-time synchronization across the application.
 * Optimized for instant local-like performance with real-time cloud sync.
 */

export const REALTIME_CONFIG = {
  // Authentication Settings
  auth: {
    // Session duration - 24 hours for fewer login interruptions
    sessionRefreshInterval: 24 * 60 * 60 * 1000, // 24 hours
    
    // Session cache duration - 30 seconds for real-time auth state
    sessionCacheTimeout: 30 * 1000, // 30 seconds
    
    // Single session enforcement
    enforceSingleSession: true,
    
    // No long-term auth caching for real-time sync
    disableLongTermCache: true
  },

  // Data Synchronization Settings
  sync: {
    // Zero delays for instant sync
    debounceDelays: {
      messages: 0,      // Instant message updates
      threads: 0,       // Instant thread updates
      projects: 0,      // Instant project updates
      summaries: 0      // Instant summary updates
    },
    
    // Immediate sync strategy
    immediateSync: true,
    
    // No background delays
    backgroundSyncDelay: 0,
    
    // Fast retry on failure
    retryDelay: 1000, // 1 second
    
    // Batch processing for performance
    batchSize: 3,
    
    // No artificial delays between batches
    batchDelay: 0
  },

  // Streaming Settings
  streaming: {
    // Zero throttle for instant streaming
    throttle: 0,
    
    // Immediate streaming notifications
    notificationDelay: 0,
    
    // Real-time streaming sync
    streamingSyncDelay: 0
  },

  // Local Storage Settings
  localStorage: {
    // No caching TTL for real-time sync
    cacheTTL: 0,
    
    // Always fetch fresh data
    alwaysFresh: true,
    
    // Immediate local updates
    immediateUpdates: true
  },

  // Performance Optimization
  performance: {
    // Parallel sync for better performance
    parallelSync: true,
    
    // Immediate UI updates
    immediateUIUpdates: true,
    
    // Smart data fetching
    smartFetching: true,
    
    // Optimized event emission
    optimizedEvents: true
  },

  // Error Handling
  errorHandling: {
    // Fast recovery from errors
    fastRecovery: true,
    
    // Automatic retry on auth errors
    autoRetryOnAuthError: true,
    
    // Graceful degradation
    gracefulDegradation: true
  }
} as const;

/**
 * Get debounce delay for a specific event type
 */
export function getDebounceDelay(eventType: string): number {
  return REALTIME_CONFIG.sync.debounceDelays[eventType as keyof typeof REALTIME_CONFIG.sync.debounceDelays] ?? 0;
}

/**
 * Check if immediate sync is enabled
 */
export function isImmediateSyncEnabled(): boolean {
  return REALTIME_CONFIG.sync.immediateSync;
}

/**
 * Get session refresh interval
 */
export function getSessionRefreshInterval(): number {
  return REALTIME_CONFIG.auth.sessionRefreshInterval;
}

/**
 * Check if single session enforcement is enabled
 */
export function isSingleSessionEnforced(): boolean {
  return REALTIME_CONFIG.auth.enforceSingleSession;
}

/**
 * Get streaming throttle value
 */
export function getStreamingThrottle(): number {
  return REALTIME_CONFIG.streaming.throttle;
}

/**
 * Check if parallel sync is enabled
 */
export function isParallelSyncEnabled(): boolean {
  return REALTIME_CONFIG.performance.parallelSync;
}

/**
 * Real-time sync status
 */
export interface RealtimeSyncStatus {
  authCacheDisabled: boolean;
  localStorageCacheDisabled: boolean;
  immediateSync: boolean;
  zeroDelays: boolean;
  singleSession: boolean;
  parallelSync: boolean;
}

/**
 * Get current real-time sync status
 */
export function getRealtimeSyncStatus(): RealtimeSyncStatus {
  return {
    authCacheDisabled: REALTIME_CONFIG.auth.disableLongTermCache,
    localStorageCacheDisabled: REALTIME_CONFIG.localStorage.alwaysFresh,
    immediateSync: REALTIME_CONFIG.sync.immediateSync,
    zeroDelays: Object.values(REALTIME_CONFIG.sync.debounceDelays).every(delay => delay === 0),
    singleSession: REALTIME_CONFIG.auth.enforceSingleSession,
    parallelSync: REALTIME_CONFIG.performance.parallelSync
  };
}

/**
 * Log real-time sync configuration
 */
export function logRealtimeConfig(): void {
  const status = getRealtimeSyncStatus();
  console.log('[RealtimeConfig] Current configuration:', {
    ...status,
    sessionRefreshInterval: `${REALTIME_CONFIG.auth.sessionRefreshInterval / (60 * 60 * 1000)} hours`,
    streamingThrottle: `${REALTIME_CONFIG.streaming.throttle}ms`,
    retryDelay: `${REALTIME_CONFIG.sync.retryDelay}ms`
  });
}
