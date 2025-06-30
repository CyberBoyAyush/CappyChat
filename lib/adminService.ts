/**
 * Admin Service
 * 
 * Centralized service for all admin API operations.
 * Handles both bulk operations and single-user operations.
 */

export interface AdminUser {
  $id: string;
  email: string;
  name?: string;
  emailVerification?: boolean;
  status?: boolean;
  registration?: string;
  preferences?: any;
}

export interface AdminStats {
  users: {
    total: number;
    recentlyRegistered: number;
    registeredToday: number;
    verified: number;
    unverified: number;
  };
  database: {
    threads: number;
    messages: number;
    projects: number;
  };
  tiers: {
    distribution: {
      free: number;
      premium: number;
      admin: number;
      uninitialized: number;
    };
    credits: {
      totalFreeCredits: number;
      totalPremiumCredits: number;
      totalSuperPremiumCredits: number;
      usedFreeCredits: number;
      usedPremiumCredits: number;
      usedSuperPremiumCredits: number;
    };
    totalUsers: number;
  };
  lastUpdated: string;
}

export interface BulkOperationResult {
  success: boolean;
  message?: string;
  details?: any;
  resetCount?: number;
  users?: AdminUser[];
  totalUsers?: number;
}

export interface DeleteDataResult {
  success: boolean;
  message?: string;
  details?: {
    threads: number;
    messages: number;
    summaries: number;
    projects: number;
    errors: string[];
  };
}

class AdminService {
  private async makeRequest(endpoint: string, data: any): Promise<any> {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Request failed');
    }

    return result;
  }

  // ===== BULK OPERATIONS =====

  /**
   * Get all users in the system with their preferences
   */
  async getAllUsers(adminKey: string): Promise<AdminUser[]> {
    const result = await this.makeRequest('/api/admin/bulk-operations', {
      adminKey,
      action: 'getAllUsers',
    });
    return result.users;
  }

  /**
   * Logout all users from all devices (chunked processing)
   */
  async logoutAllUsers(adminKey: string, batchSize = 25, maxTime = 25000): Promise<BulkOperationResult> {
    return await this.makeRequest('/api/admin/bulk-operations', {
      adminKey,
      action: 'logoutAllUsersChunked',
      batchSize,
      maxTime,
    });
  }

  /**
   * Reset monthly limits for all users
   */
  async resetAllUserLimits(adminKey: string): Promise<BulkOperationResult> {
    return await this.makeRequest('/api/admin/bulk-operations', {
      adminKey,
      action: 'resetAllUserLimits',
    });
  }

  /**
   * Get total user count
   */
  async getUserCount(adminKey: string): Promise<number> {
    const result = await this.makeRequest('/api/admin/bulk-operations', {
      adminKey,
      action: 'getUserCount',
    });
    return result.totalUsers;
  }

  // ===== STATISTICS =====

  /**
   * Get comprehensive platform statistics
   */
  async getStats(adminKey: string): Promise<AdminStats> {
    const result = await this.makeRequest('/api/admin/stats', {
      adminKey,
    });
    return result.stats;
  }

  // ===== SINGLE USER OPERATIONS =====

  /**
   * Search for a user by email
   */
  async getUserByEmail(adminKey: string, email: string): Promise<AdminUser> {
    const result = await this.makeRequest('/api/admin/manage-user', {
      adminKey,
      action: 'getUserByEmail',
      email,
    });
    return result.user;
  }

  /**
   * Update user tier
   */
  async updateUserTier(adminKey: string, userId: string, tier: 'free' | 'premium' | 'admin'): Promise<void> {
    await this.makeRequest('/api/admin/manage-user', {
      adminKey,
      action: 'updateTier',
      userId,
      tier,
    });
  }

  /**
   * Reset credits for a specific user
   */
  async resetUserCredits(adminKey: string, userId: string): Promise<void> {
    await this.makeRequest('/api/admin/manage-user', {
      adminKey,
      action: 'resetUserCredits',
      userId,
    });
  }

  /**
   * Clear all sessions for a specific user
   */
  async clearUserSession(adminKey: string, userId: string): Promise<void> {
    await this.makeRequest('/api/admin/manage-user', {
      adminKey,
      action: 'clearUserSession',
      userId,
    });
  }

  // ===== DELETE OPERATIONS =====

  /**
   * Delete all data for a specific user
   */
  async deleteUserData(adminKey: string, userId: string, email?: string): Promise<DeleteDataResult> {
    return await this.makeRequest('/api/admin/delete-data', {
      adminKey,
      action: 'deleteUserData',
      userId,
      email,
    });
  }

  /**
   * Delete all database data (except user accounts)
   */
  async deleteAllData(adminKey: string): Promise<DeleteDataResult> {
    return await this.makeRequest('/api/admin/delete-data', {
      adminKey,
      action: 'deleteAllData',
    });
  }
}

// Export singleton instance
export const adminService = new AdminService();
