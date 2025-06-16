/**
 * Appwrite Configuration
 *
 * Centralized configuration for Appwrite client and services.
 * Handles initialization of client, account, and database services.
 */

import { Client, Account, ID } from 'appwrite';

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

// Combined User Preferences Interface
export interface UserPreferences extends UserTierPreferences {
  customProfile?: UserCustomProfile;
}

// Default tier limits
export const TIER_LIMITS = {
  free: {
    freeCredits: 200,
    premiumCredits: 20,
    superPremiumCredits: 2,
  },
  premium: {
    freeCredits: 1500,
    premiumCredits: 600,
    superPremiumCredits: 30,
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
    const user = await account.get();
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
    const currentUser = await account.get();
    const currentPrefs = currentUser.prefs as Record<string, unknown>;

    const updatedPrefs = {
      ...currentPrefs,
      ...preferences,
    };

    await account.updatePrefs(updatedPrefs);
  } catch (error) {
    console.error('Failed to update user preferences:', error);
    throw error;
  }
};

// Custom Profile Management Functions
export const getUserCustomProfile = async (): Promise<UserCustomProfile | null> => {
  try {
    const user = await account.get();
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
    const currentUser = await account.get();
    const currentPrefs = currentUser.prefs as Record<string, unknown>;

    const updatedPrefs = {
      ...currentPrefs,
      customProfile,
    };

    await account.updatePrefs(updatedPrefs);
  } catch (error) {
    console.error('Failed to update user custom profile:', error);
    throw error;
  }
};

export const clearUserCustomProfile = async (): Promise<void> => {
  try {
    const currentUser = await account.get();
    const currentPrefs = currentUser.prefs as Record<string, unknown>;

    const updatedPrefs = {
      ...currentPrefs,
      customProfile: undefined,
    };

    await account.updatePrefs(updatedPrefs);
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
} as const;

export default client;
