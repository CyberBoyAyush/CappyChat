/**
 * Account Cache Utility
 * 
 * Provides lightweight caching for account.get() calls to reduce repeated API requests
 * while maintaining real-time functionality. Uses a 30-second TTL to balance performance
 * and data freshness.
 */

import { account } from './appwrite';
import { Models } from 'appwrite';

interface CacheEntry {
  data: Models.User<Models.Preferences>;
  timestamp: number;
}

class AccountCache {
  private cache: CacheEntry | null = null;
  private readonly TTL = 30 * 1000; // 30 seconds

  /**
   * Get cached account data or fetch fresh data if cache is expired/empty
   */
  async getCachedAccount(forceRefresh: boolean = false): Promise<Models.User<Models.Preferences> | null> {
    try {
      // Check if we should use cached data
      if (!forceRefresh && this.cache && this.isCacheValid()) {
        console.log('[AccountCache] Using cached account data');
        return this.cache.data;
      }

      // Fetch fresh data with timeout to prevent hanging
      console.log('[AccountCache] Fetching fresh account data');
      const userData = await Promise.race([
        account.get(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Account fetch timeout')), 10000) // 10 second timeout
        )
      ]);

      // Update cache
      this.cache = {
        data: userData,
        timestamp: Date.now()
      };

      return userData;
    } catch (error) {
      console.error('[AccountCache] Error fetching account data:', error);
      // Clear cache on error
      this.cache = null;
      return null;
    }
  }

  /**
   * Check if cached data is still valid
   */
  private isCacheValid(): boolean {
    if (!this.cache) return false;
    return (Date.now() - this.cache.timestamp) < this.TTL;
  }

  /**
   * Manually invalidate the cache (useful after updates)
   */
  invalidateCache(): void {
    console.log('[AccountCache] Cache invalidated');
    this.cache = null;
  }

  /**
   * Get cached data without making API call (returns null if no valid cache)
   */
  getCachedDataOnly(): Models.User<Models.Preferences> | null {
    if (this.cache && this.isCacheValid()) {
      return this.cache.data;
    }
    return null;
  }

  /**
   * Check if cache exists and is valid
   */
  hasCachedData(): boolean {
    return this.cache !== null && this.isCacheValid();
  }
}

// Export singleton instance
export const accountCache = new AccountCache();

// Export convenience functions
export const getCachedAccount = (forceRefresh?: boolean) => 
  accountCache.getCachedAccount(forceRefresh);

export const invalidateAccountCache = () => 
  accountCache.invalidateCache();

export const getCachedAccountDataOnly = () => 
  accountCache.getCachedDataOnly();
