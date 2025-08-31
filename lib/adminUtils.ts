/**
 * Admin Utilities
 * 
 * Helper functions for admin operations and user verification.
 */

import { Client, Users } from 'node-appwrite';

// Initialize Appwrite client for server-side operations
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);

const users = new Users(client);

/**
 * Check if a user is an admin
 */
export const isUserAdmin = async (userId: string): Promise<boolean> => {
  try {
    const user = await users.get(userId);
    const prefs = user.prefs as Record<string, unknown>;
    
    // Check if user has admin tier
    return prefs?.tier === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

/**
 * Get user preferences server-side
 */
export const getUserPreferencesServer = async (userId: string): Promise<any> => {
  try {
    const user = await users.get(userId);
    return user.prefs || {};
  } catch (error) {
    console.error('Error getting user preferences:', error);
    return {};
  }
};

/**
 * Update user preferences server-side
 */
export const updateUserPreferencesServer = async (
  userId: string, 
  preferences: Record<string, any>
): Promise<void> => {
  try {
    const user = await users.get(userId);
    const currentPrefs = (user.prefs as Record<string, unknown>) || {};
    
    // Merge with existing preferences
    const updatedPrefs = {
      ...currentPrefs,
      ...preferences
    };
    
    await users.updatePrefs(userId, updatedPrefs);
  } catch (error) {
    console.error('Error updating user preferences:', error);
    throw error;
  }
};

/**
 * Get all users (admin only)
 */
export const getAllUsers = async (adminUserId: string, limit: number = 100) => {
  // Verify admin access
  const isAdmin = await isUserAdmin(adminUserId);
  if (!isAdmin) {
    throw new Error('Unauthorized - Admin access required');
  }

  try {
    const result = await users.list();
    return result;
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
};

/**
 * Delete user (admin only)
 */
export const deleteUser = async (adminUserId: string, targetUserId: string): Promise<void> => {
  // Verify admin access
  const isAdmin = await isUserAdmin(adminUserId);
  if (!isAdmin) {
    throw new Error('Unauthorized - Admin access required');
  }

  try {
    await users.delete(targetUserId);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

/**
 * Update user status (admin only)
 */
export const updateUserStatus = async (
  adminUserId: string, 
  targetUserId: string, 
  status: boolean
): Promise<void> => {
  // Verify admin access
  const isAdmin = await isUserAdmin(adminUserId);
  if (!isAdmin) {
    throw new Error('Unauthorized - Admin access required');
  }

  try {
    await users.updateStatus(targetUserId, status);
  } catch (error) {
    console.error('Error updating user status:', error);
    throw error;
  }
};

/**
 * Get admin statistics
 */
export const getAdminStats = async (adminUserId: string) => {
  // Verify admin access
  const isAdmin = await isUserAdmin(adminUserId);
  if (!isAdmin) {
    throw new Error('Unauthorized - Admin access required');
  }

  try {
    const allUsers = await users.list();
    
    const stats = {
      totalUsers: allUsers.total,
      activeUsers: allUsers.users.filter(user => user.status).length,
      premiumUsers: allUsers.users.filter(user => {
        const prefs = user.prefs as Record<string, unknown>;
        return prefs?.tier === 'premium';
      }).length,
      adminUsers: allUsers.users.filter(user => {
        const prefs = user.prefs as Record<string, unknown>;
        return prefs?.tier === 'admin';
      }).length,
    };

    return stats;
  } catch (error) {
    console.error('Error getting admin stats:', error);
    throw error;
  }
};
