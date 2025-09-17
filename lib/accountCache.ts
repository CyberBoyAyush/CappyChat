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
  private inflight: Promise<Models.User<Models.Preferences> | null> | null = null;

  /**
   * Get cached account data or fetch fresh data if cache is expired/empty
   */
  async getCachedAccount(forceRefresh: boolean = false): Promise<Models.User<Models.Preferences> | null> {
    try {
      // Fast path: if no Appwrite session cookie, skip network
      if (this.isLikelyLoggedOut()) {
        // Clear any stale cache/inflight when logged out
        this.cache = null;
        this.inflight = null;
        return null;
      }

      // Check if we should use cached data
      if (!forceRefresh && this.cache && this.isCacheValid()) {
        console.log('[AccountCache] Using cached account data');
        return this.cache.data;
      }

      // Deduplicate concurrent fetches
      if (this.inflight) {
        console.log('[AccountCache] Awaiting in-flight account fetch');
        return await this.inflight;
      }

      // Start fresh fetch with timeout to prevent hanging
      console.log('[AccountCache] Fetching fresh account data');
      this.inflight = Promise.race([
        account.get(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Account fetch timeout')), 10000) // 10 second timeout
        )
      ])
        .then((userData) => {
          // Update cache on success
          this.cache = {
            data: userData,
            timestamp: Date.now()
          };
          return userData;
        })
        .catch((error) => {
          console.error('[AccountCache] Error during account fetch:', error);
          this.cache = null;
          return null;
        })
        .finally(() => {
          this.inflight = null;
        });

      return await this.inflight;
    } catch (error) {
      console.error('[AccountCache] Error fetching account data:', error);
      // Clear cache on error
      this.cache = null;
      this.inflight = null;
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

  /**
   * Detect if user is likely logged out via storage heuristics (zero network).
   * Conservative: only returns true for brand-new visitors with no prior app state.
   */
  private isLikelyLoggedOut(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const ss = window.sessionStorage;
      const ls = window.localStorage;

      // If we have recent session info or pending auth, assume not logged out
      if (ss.getItem('cappychat_auth_session')) return false;
      if (ss.getItem('cappychat_auth_pending')) return false;

      // If we have any persisted user-linked data, assume not logged out
      if (ls.getItem('atchat_user_id')) return false;
      if (ls.getItem('atchat_threads') || ls.getItem('atchat_projects')) return false;

      // Otherwise, treat as a new visitor (likely logged out)
      return true;
    } catch {
      return false;
    }
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
