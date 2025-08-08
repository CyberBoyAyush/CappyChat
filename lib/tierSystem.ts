/**
 * Tier System Management
 * 
 * Handles user tier validation, credit tracking, and model access control.
 * Integrates with Appwrite user preferences for persistent storage.
 */

import { AIModel, getModelConfig } from './models';
import { getUserPreferences, updateUserPreferences, initializeUserTier, TIER_LIMITS, UserTierPreferences, UserCustomProfile } from './appwrite';
import { Client, Users, Query, Databases } from 'node-appwrite';

export type TierType = 'free' | 'premium' | 'admin';
export type ModelType = 'free' | 'premium' | 'superPremium';

// Initialize server-side Appwrite client for API routes
const getServerClient = () => {
  if (typeof window !== 'undefined') {
    throw new Error('Server client should not be used on client side');
  }

  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!);

  return new Users(client);
};

/**
 * Get user preferences using server-side API (for API routes)
 */
export const getUserPreferencesServer = async (userId: string): Promise<UserTierPreferences | null> => {
  try {
    const users = getServerClient();
    const user = await users.get(userId);
    const prefs = user.prefs as Record<string, unknown>;

    console.log('[Server] Raw user preferences:', prefs);

    if (prefs && typeof prefs.tier === 'string') {
      const tierPrefs = {
        tier: prefs.tier as 'free' | 'premium' | 'admin',
        freeCredits: (prefs.freeCredits as number) || 0,
        premiumCredits: (prefs.premiumCredits as number) || 0,
        superPremiumCredits: (prefs.superPremiumCredits as number) || 0,
        lastResetDate: prefs.lastResetDate as string | undefined,
      };

      console.log('[Server] Parsed tier preferences:', tierPrefs);
      return tierPrefs;
    }

    console.log('[Server] No tier found in preferences, returning null');
    return null;
  } catch (error) {
    console.error('[Server] Failed to get user preferences:', error);
    return null;
  }
};

/**
 * Update user preferences using server-side API (for API routes)
 */
export const updateUserPreferencesServer = async (userId: string, preferences: Partial<UserTierPreferences>): Promise<void> => {
  try {
    const users = getServerClient();
    const user = await users.get(userId);
    const currentPrefs = user.prefs as Record<string, unknown>;

    const updatedPrefs = {
      ...currentPrefs,
      ...preferences,
    };

    await users.updatePrefs(userId, updatedPrefs);
    console.log('[Server] Updated user preferences:', updatedPrefs);
  } catch (error) {
    console.error('[Server] Failed to update user preferences:', error);
    throw error;
  }
};

/**
 * Get user custom profile using server-side API (for API routes)
 */
export const getUserCustomProfileServer = async (userId: string): Promise<UserCustomProfile | null> => {
  try {
    const users = getServerClient();
    const user = await users.get(userId);
    const prefs = user.prefs as Record<string, unknown>;

    if (prefs && prefs.customProfile) {
      return prefs.customProfile as UserCustomProfile;
    }

    return null;
  } catch (error) {
    console.error('[Server] Failed to get user custom profile:', error);
    return null;
  }
};

/**
 * Get project prompt for a thread using server-side API (for API routes)
 */
export const getProjectPromptServer = async (userId: string, threadId: string): Promise<string | null> => {
  try {
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.APPWRITE_API_KEY!);

    const databases = new Databases(client);

    // First get the thread to find its project ID
    const threadsResponse = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_THREADS_COLLECTION_ID!,
      [
        Query.equal('threadId', threadId),
        Query.equal('userId', userId)
      ]
    );

    if (threadsResponse.documents.length === 0) {
      return null;
    }

    const thread = threadsResponse.documents[0] as any;
    const projectId = thread.projectId;

    if (!projectId) {
      return null;
    }

    // Get the project to find its prompt
    const projectsResponse = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_PROJECTS_COLLECTION_ID!,
      [
        Query.equal('projectId', projectId),
        Query.equal('userId', userId)
      ]
    );

    if (projectsResponse.documents.length === 0) {
      return null;
    }

    const project = projectsResponse.documents[0] as any;
    return project.prompt || null;
  } catch (error) {
    console.error('[Server] Failed to get project prompt:', error);
    return null;
  }
};

export interface CreditUsage {
  modelType: ModelType;
  creditsUsed: number;
}

export interface TierValidationResult {
  canUseModel: boolean;
  remainingCredits: number;
  message?: string;
}

/**
 * Get model type based on model configuration
 */
export const getModelType = (model: AIModel): ModelType => {
  const config = getModelConfig(model);
  
  if (config.isSuperPremium) {
    return 'superPremium';
  } else if (config.isPremium) {
    return 'premium';
  } else {
    return 'free';
  }
};

/**
 * Check if user can use a specific model
 */
export const canUserUseModel = async (model: AIModel, usingBYOK: boolean = false, userId?: string, isGuest: boolean = false): Promise<TierValidationResult> => {
  console.log(`[TierSystem] Checking model access for: ${model}, BYOK: ${usingBYOK}, Guest: ${isGuest}`);

  // Guest users can only use OpenAI 5 Mini
  if (isGuest) {
    console.log('[TierSystem] Guest user detected');
    if (model === 'OpenAI 5 Mini') {
      return {
        canUseModel: true,
        remainingCredits: -1, // Unlimited for guest users (no tracking)
      };
    } else {
      return {
        canUseModel: false,
        remainingCredits: 0,
        message: 'Guest users can only use OpenAI 5 Mini. Please sign up for access to other models.',
      };
    }
  }

  // BYOK users bypass tier restrictions
  if (usingBYOK) {
    console.log('[TierSystem] BYOK user, bypassing restrictions');
    return {
      canUseModel: true,
      remainingCredits: -1, // Unlimited
    };
  }

  try {
    // Use server-side client if userId is provided (for API routes)
    const preferences = userId
      ? await getUserPreferencesServer(userId)
      : await getUserPreferences();
    console.log('[TierSystem] Retrieved preferences:', preferences);

    if (!preferences) {
      console.log('[TierSystem] No preferences found');
      return {
        canUseModel: false,
        remainingCredits: 0,
        message: 'User preferences not found. Please refresh the page.',
      };
    }

    const modelType = getModelType(model);
    let remainingCredits = 0;
    let canUse = false;

    switch (modelType) {
      case 'free':
        remainingCredits = preferences.freeCredits;
        canUse = preferences.tier === 'admin' || remainingCredits > 0;
        break;
      case 'premium':
        remainingCredits = preferences.premiumCredits;
        canUse = preferences.tier === 'admin' || remainingCredits > 0;
        break;
      case 'superPremium':
        remainingCredits = preferences.superPremiumCredits;
        canUse = preferences.tier === 'admin' || remainingCredits > 0;
        break;
    }

    // Admin users have unlimited access
    if (preferences.tier === 'admin') {
      remainingCredits = -1;
    }

    return {
      canUseModel: canUse,
      remainingCredits,
      message: canUse ? undefined : 'Monthly credits exhausted. Update your current plan.',
    };
  } catch (error) {
    console.error('Error checking model access:', error);
    return {
      canUseModel: false,
      remainingCredits: 0,
      message: 'Error checking model access. Please try again.',
    };
  }
};

/**
 * Consume credits for a model usage
 */
export const consumeCredits = async (model: AIModel, usingBYOK: boolean = false, userId?: string, isGuest: boolean = false): Promise<boolean> => {
  // Guest users don't consume credits (no tracking)
  if (isGuest) {
    console.log('[TierSystem] Guest user, skipping credit consumption');
    return true;
  }

  // BYOK users don't consume credits
  if (usingBYOK) {
    return true;
  }

  try {
    // Use server-side client if userId is provided (for API routes)
    const preferences = userId
      ? await getUserPreferencesServer(userId)
      : await getUserPreferences();

    if (!preferences) {
      throw new Error('User preferences not found');
    }

    // Admin users have unlimited credits
    if (preferences.tier === 'admin') {
      return true;
    }

    const modelType = getModelType(model);
    const updates: Partial<UserTierPreferences> = {};

    switch (modelType) {
      case 'free':
        if (preferences.freeCredits <= 0) {
          return false;
        }
        updates.freeCredits = preferences.freeCredits - 1;
        break;
      case 'premium':
        if (preferences.premiumCredits <= 0) {
          return false;
        }
        updates.premiumCredits = preferences.premiumCredits - 1;
        break;
      case 'superPremium':
        if (preferences.superPremiumCredits <= 0) {
          return false;
        }
        updates.superPremiumCredits = preferences.superPremiumCredits - 1;
        break;
    }

    // Use server-side client if userId is provided (for API routes)
    if (userId) {
      await updateUserPreferencesServer(userId, updates);
    } else {
      await updateUserPreferences(updates);
    }
    return true;
  } catch (error) {
    console.error('Error consuming credits:', error);
    return false;
  }
};

/**
 * Get user's current tier information
 */
export const getUserTierInfo = async (): Promise<UserTierPreferences | null> => {
  return await getUserPreferences();
};

/**
 * Get current tier information - NO AUTOMATIC UPDATES
 * Just returns the current state without any modifications
 */
export const refreshTierInfo = async (): Promise<UserTierPreferences | null> => {
  try {
    console.log('[TierSystem] Getting current tier info (no updates)...');

    // Just get and return current preferences - NO MODIFICATIONS
    const preferences = await getUserPreferences();

    if (preferences) {
      console.log(`[TierSystem] Current tier: ${preferences.tier}`, {
        freeCredits: preferences.freeCredits,
        premiumCredits: preferences.premiumCredits,
        superPremiumCredits: preferences.superPremiumCredits
      });
    }

    return preferences;
  } catch (error) {
    console.error('[TierSystem] Error getting tier info:', error);
    return null;
  }
};

/**
 * Initialize tier for new users only - NO automatic updates for existing users
 */
export const ensureUserTierInitialized = async (): Promise<void> => {
  try {
    const preferences = await getUserPreferences();

    if (!preferences) {
      // New user - initialize with free tier
      console.log('[TierSystem] New user detected, initializing with free tier');
      await initializeUserTier('free');
    } else {
      // Existing user - just log their current status, NO MODIFICATIONS
      console.log(`[TierSystem] Existing user with ${preferences.tier} tier - no changes made`);
    }
  } catch (error) {
    console.error('Error ensuring user tier initialized:', error);
    throw error;
  }
};

/**
 * Reset user limits based on their current tier
 * This function should ONLY be called by admin APIs or monthly reset processes
 */
export const resetUserLimits = async (userId?: string): Promise<void> => {
  try {
    console.log('[TierSystem] Admin reset requested for user:', userId || 'current user');

    const preferences = userId
      ? await getUserPreferencesServer(userId)
      : await getUserPreferences();

    if (!preferences) {
      throw new Error('User preferences not found');
    }

    const limits = TIER_LIMITS[preferences.tier];
    const now = new Date().toISOString();

    const updates = {
      freeCredits: limits.freeCredits,
      premiumCredits: limits.premiumCredits,
      superPremiumCredits: limits.superPremiumCredits,
      lastResetDate: now,
    };

    console.log(`[TierSystem] Resetting ${preferences.tier} user limits to:`, updates);

    if (userId) {
      await updateUserPreferencesServer(userId, updates);
    } else {
      await updateUserPreferences(updates);
    }
  } catch (error) {
    console.error('Error resetting user limits:', error);
    throw error;
  }
};

/**
 * Admin-only function to reset a user's credits to their tier limits
 */
export const adminResetUserCredits = async (userId: string): Promise<void> => {
  try {
    console.log('[TierSystem] Admin reset for user:', userId);

    const preferences = await getUserPreferencesServer(userId);

    if (!preferences) {
      throw new Error('User preferences not found');
    }

    const limits = TIER_LIMITS[preferences.tier];
    const now = new Date().toISOString();

    const updates = {
      freeCredits: limits.freeCredits,
      premiumCredits: limits.premiumCredits,
      superPremiumCredits: limits.superPremiumCredits,
      lastResetDate: now,
    };

    console.log(`[TierSystem] Admin resetting ${preferences.tier} user credits to:`, updates);
    await updateUserPreferencesServer(userId, updates);
  } catch (error) {
    console.error('Error in admin reset:', error);
    throw error;
  }
};

/**
 * Admin-only function to update a user's tier
 */
export const adminUpdateUserTier = async (userId: string, newTier: 'free' | 'premium' | 'admin'): Promise<void> => {
  try {
    console.log(`[TierSystem] Admin updating user ${userId} tier to:`, newTier);

    const preferences = await getUserPreferencesServer(userId);

    if (!preferences) {
      throw new Error('User preferences not found');
    }

    const limits = TIER_LIMITS[newTier];
    const now = new Date().toISOString();

    const updates = {
      tier: newTier,
      freeCredits: limits.freeCredits,
      premiumCredits: limits.premiumCredits,
      superPremiumCredits: limits.superPremiumCredits,
      lastResetDate: now,
    };

    console.log(`[TierSystem] Admin updating user to ${newTier} tier with limits:`, updates);
    await updateUserPreferencesServer(userId, updates);
  } catch (error) {
    console.error('Error in admin tier update:', error);
    throw error;
  }
};

/**
 * Admin-only function to get user by email
 */
export const adminGetUserByEmail = async (email: string): Promise<{ $id: string; email: string; name?: string } | null> => {
  try {
    const users = getServerClient();
    const usersList = await users.list([Query.equal('email', email)]);

    if (usersList.users.length === 0) {
      return null;
    }

    const user = usersList.users[0];
    return {
      $id: user.$id,
      email: user.email,
      name: user.name,
    };
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  }
};

/**
 * Check if it's time for monthly reset
 */
export const shouldResetMonthly = (lastResetDate?: string): boolean => {
  if (!lastResetDate) return true;
  
  const lastReset = new Date(lastResetDate);
  const now = new Date();
  
  // Check if we're in a new month
  return (
    now.getFullYear() > lastReset.getFullYear() ||
    (now.getFullYear() === lastReset.getFullYear() && now.getMonth() > lastReset.getMonth())
  );
};

/**
 * Get tier display information
 */
export const getTierDisplayInfo = (tier: TierType) => {
  const limits = TIER_LIMITS[tier];
  
  return {
    name: tier.charAt(0).toUpperCase() + tier.slice(1),
    limits,
    isUnlimited: tier === 'admin',
  };
};
