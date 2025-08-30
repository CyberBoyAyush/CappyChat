/**
 * Appwrite Configuration
 *
 * Centralized configuration for Appwrite client and services.
 * Handles initialization of client, account, and database services.
 */

import { Client, Account, ID } from 'appwrite';
import { getCachedAccount, invalidateAccountCache } from './accountCache';

// Validate required environment variables
if (!process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT) {
  throw new Error('NEXT_PUBLIC_APPWRITE_ENDPOINT is required');
}

if (!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
  throw new Error('NEXT_PUBLIC_APPWRITE_PROJECT_ID is required');
}

// Initialize Appwrite client
export const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

// Initialize Appwrite services
export const account = new Account(client);

// OAuth provider configuration
export const OAuthProviders = {
  Google: 'google', // Using string literal 'google' instead of OAuthProvider.Google to ensure correct casing
  GitHub: 'github', // Using string literal 'github' for GitHub OAuth
} as const;

// Helper for generating unique IDs
export { ID };

// User Preferences Management
export interface UserTierPreferences {
  tier: 'free' | 'premium' | 'admin';
  freeCredits: number;
  premiumCredits: number;
  superPremiumCredits: number;
  lastResetDate?: string;
  tier_cache?: string;
}

// Custom Profile Interface
export interface UserCustomProfile {
  customName?: string;
  aboutUser?: string;
}

// Subscription Interface
export interface UserSubscription {
  tier: 'FREE' | 'PREMIUM';
  status: 'active' | 'cancelled' | 'expired' | 'on_hold' | 'failed';
  customerId?: string;
  subscriptionId?: string;
  currentPeriodEnd?: string; // ISO8601 timestamp
  cancelAtPeriodEnd?: boolean;
  finalDate?: string; // ISO8601 timestamp - next billing date or cancellation date
  currency?: 'INR' | 'USD';
  amount?: number;
  adminOverride?: boolean;
  lastPaymentId?: string;
  retryCount?: number;
  createdAt?: string; // ISO8601 timestamp
  updatedAt?: string; // ISO8601 timestamp
}

// Combined User Preferences Interface
export interface UserPreferences extends UserTierPreferences {
  customProfile?: UserCustomProfile;
  subscription?: UserSubscription;
}

// Default tier limits
export const TIER_LIMITS = {
  free: {
    freeCredits: 80,
    premiumCredits: 10,
    superPremiumCredits: 2,
  },
  premium: {
    freeCredits: 1200,
    premiumCredits: 600,
    superPremiumCredits: 50,
  },
  admin: {
    freeCredits: -1, // Unlimited
    premiumCredits: -1, // Unlimited
    superPremiumCredits: -1, // Unlimited
  },
} as const;

// User preferences helper functions
export const getUserPreferences = async (): Promise<UserTierPreferences | null> => {
  try {
    const user = await getCachedAccount();
    if (!user) return null;

    const prefs = user.prefs as Record<string, unknown>;

    console.log('Raw user preferences:', prefs);

    if (prefs && typeof prefs.tier === 'string') {
      const tierPrefs = {
        tier: prefs.tier as 'free' | 'premium' | 'admin',
        freeCredits: (prefs.freeCredits as number) || 0,
        premiumCredits: (prefs.premiumCredits as number) || 0,
        superPremiumCredits: (prefs.superPremiumCredits as number) || 0,
        lastResetDate: prefs.lastResetDate as string | undefined,
      };

      console.log('Parsed tier preferences:', tierPrefs);
      return tierPrefs;
    }

    console.log('No tier found in preferences, returning null');
    return null;
  } catch (error) {
    console.error('Failed to get user preferences:', error);
    return null;
  }
};

export const updateUserPreferences = async (preferences: Partial<UserTierPreferences>): Promise<void> => {
  try {
    const currentUser = await getCachedAccount();
    if (!currentUser) throw new Error('User not found');

    const currentPrefs = currentUser.prefs as Record<string, unknown>;

    const updatedPrefs = {
      ...currentPrefs,
      ...preferences,
    };

    await account.updatePrefs(updatedPrefs);

    // Invalidate cache after update to ensure fresh data on next fetch
    invalidateAccountCache();
  } catch (error) {
    console.error('Failed to update user preferences:', error);
    throw error;
  }
};

// Custom Profile Management Functions
export const getUserCustomProfile = async (): Promise<UserCustomProfile | null> => {
  try {
    const user = await getCachedAccount();
    if (!user) return null;

    const prefs = user.prefs as Record<string, unknown>;

    if (prefs && prefs.customProfile) {
      return prefs.customProfile as UserCustomProfile;
    }

    return null;
  } catch (error) {
    console.error('Failed to get user custom profile:', error);
    return null;
  }
};

export const updateUserCustomProfile = async (customProfile: UserCustomProfile): Promise<void> => {
  try {
    const currentUser = await getCachedAccount();
    if (!currentUser) throw new Error('User not found');

    const currentPrefs = currentUser.prefs as Record<string, unknown>;

    const updatedPrefs = {
      ...currentPrefs,
      customProfile,
    };

    await account.updatePrefs(updatedPrefs);

    // Invalidate cache after update
    invalidateAccountCache();
  } catch (error) {
    console.error('Failed to update user custom profile:', error);
    throw error;
  }
};

export const clearUserCustomProfile = async (): Promise<void> => {
  try {
    const currentUser = await getCachedAccount();
    if (!currentUser) throw new Error('User not found');

    const currentPrefs = currentUser.prefs as Record<string, unknown>;

    const updatedPrefs = {
      ...currentPrefs,
      customProfile: undefined,
    };

    await account.updatePrefs(updatedPrefs);

    // Invalidate cache after update
    invalidateAccountCache();
  } catch (error) {
    console.error('Failed to clear user custom profile:', error);
    throw error;
  }
};

export const initializeUserTier = async (tier: 'free' | 'premium' | 'admin' = 'free'): Promise<void> => {
  try {
    const limits = TIER_LIMITS[tier];
    const now = new Date().toISOString();

    await updateUserPreferences({
      tier,
      freeCredits: limits.freeCredits,
      premiumCredits: limits.premiumCredits,
      superPremiumCredits: limits.superPremiumCredits,
      lastResetDate: now,
    });
  } catch (error) {
    console.error('Failed to initialize user tier:', error);
    throw error;
  }
};

// Subscription Management Functions
export const getUserSubscription = async (): Promise<UserSubscription | null> => {
  try {
    const user = await getCachedAccount();
    if (!user) return null;

    const prefs = user.prefs as Record<string, unknown>;

    // Check if user has subscription data in flattened fields
    if (prefs && (prefs.subscriptionTier || prefs.tier === 'premium')) {
      return {
        tier: (prefs.subscriptionTier as 'FREE' | 'PREMIUM') || (prefs.tier === 'premium' ? 'PREMIUM' : 'FREE'),
        status: (prefs.subscriptionStatus as any) || (prefs.tier === 'premium' ? 'active' : 'expired'),
        customerId: prefs.subscriptionCustomerId as string,
        subscriptionId: prefs.subscriptionId as string,
        currentPeriodEnd: prefs.subscriptionPeriodEnd as string,
        cancelAtPeriodEnd: prefs.subscriptionCancelAtEnd as boolean,
        finalDate: prefs.subscriptionFinalDate as string,
        currency: prefs.subscriptionCurrency as 'INR' | 'USD',
        amount: prefs.subscriptionAmount as number,
        lastPaymentId: prefs.subscriptionLastPayment as string,
        retryCount: (prefs.subscriptionRetryCount as number) || 0,
        createdAt: user.$createdAt,
        updatedAt: prefs.subscriptionUpdatedAt as string,
      };
    }

    return null;
  } catch (error) {
    console.error('Failed to get user subscription:', error);
    return null;
  }
};

export const updateUserSubscription = async (subscription: Partial<UserSubscription>): Promise<void> => {
  try {
    const currentUser = await getCachedAccount();
    if (!currentUser) throw new Error('User not found');

    const currentPrefs = currentUser.prefs as Record<string, unknown>;

    // Update flattened subscription fields
    const updatedPrefs = {
      ...currentPrefs,
      subscriptionTier: subscription.tier || currentPrefs.subscriptionTier,
      subscriptionStatus: subscription.status || currentPrefs.subscriptionStatus,
      subscriptionCustomerId: subscription.customerId || currentPrefs.subscriptionCustomerId,
      subscriptionId: subscription.subscriptionId || currentPrefs.subscriptionId,
      subscriptionPeriodEnd: subscription.currentPeriodEnd || currentPrefs.subscriptionPeriodEnd,
      subscriptionCancelAtEnd: subscription.cancelAtPeriodEnd || currentPrefs.subscriptionCancelAtEnd,
      subscriptionCurrency: subscription.currency || currentPrefs.subscriptionCurrency,
      subscriptionAmount: subscription.amount || currentPrefs.subscriptionAmount,
      subscriptionLastPayment: subscription.lastPaymentId || currentPrefs.subscriptionLastPayment,
      subscriptionRetryCount: subscription.retryCount !== undefined ? subscription.retryCount : currentPrefs.subscriptionRetryCount,
      subscriptionUpdatedAt: new Date().toISOString(),
    };

    await account.updatePrefs(updatedPrefs);

    // Invalidate cache after update
    invalidateAccountCache();
  } catch (error) {
    console.error('Failed to update user subscription:', error);
    throw error;
  }
};

export const initializeUserSubscription = async (): Promise<void> => {
  try {
    const now = new Date().toISOString();

    await updateUserSubscription({
      tier: 'FREE',
      status: 'expired',
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    console.error('Failed to initialize user subscription:', error);
    throw error;
  }
};

// Configuration constants
export const APPWRITE_CONFIG = {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
  successUrl: process.env.NEXT_PUBLIC_AUTH_SUCCESS_URL ||
    (typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : ''),
  failureUrl: process.env.NEXT_PUBLIC_AUTH_FAILURE_URL ||
    (typeof window !== 'undefined' ? `${window.location.origin}/auth/error` : ''),
  verificationUrl: process.env.NEXT_PUBLIC_VERIFICATION_URL ||
    (typeof window !== 'undefined' ? `${window.location.origin}/auth/verify` : ''),
  passwordResetUrl: process.env.NEXT_PUBLIC_PASSWORD_RESET_URL ||
    (typeof window !== 'undefined' ? `${window.location.origin}/auth/reset-password` : ''),
} as const;

export default client;
