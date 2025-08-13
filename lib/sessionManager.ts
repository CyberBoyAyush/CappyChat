/**
 * Enhanced Session Management Service
 * 
 * Provides comprehensive session management functionality including:
 * - Session limit enforcement (3 sessions max)
 * - Detailed session information retrieval
 * - Individual session termination
 * - Oldest-session-first deletion logic
 * - Integration with Appwrite Account API
 */

import { account } from './appwrite';
import { AppwriteException } from 'appwrite';
import { devLog, devWarn, devInfo, devError, prodError } from './logger';

// Session management configuration
export const SESSION_CONFIG = {
  maxSessions: 3,
  sessionRefreshInterval: 6 * 60 * 60 * 1000, // 6 hours
} as const;

// Enhanced session interface with detailed information
export interface DetailedSession {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  userId: string;
  expire: string;
  provider: string;
  providerUid: string;
  ip: string;
  osCode: string;
  osName: string;
  osVersion: string;
  clientType: string;
  clientCode: string;
  clientName: string;
  clientVersion: string;
  clientEngine: string;
  clientEngineVersion: string;
  deviceName: string;
  deviceBrand: string;
  deviceModel: string;
  countryCode: string;
  countryName: string;
  current: boolean;
  factors: string[];
  secret: string;
  mfaUpdatedAt: string;
}

export interface SessionListResponse {
  total: number;
  sessions: DetailedSession[];
}

export interface SessionInfo {
  hasSession: boolean;
  sessionCount: number;
  sessions: DetailedSession[];
  currentSession: DetailedSession | null;
}

/**
 * Enhanced Session Management Class
 */
export class SessionManager {
  /**
   * Get detailed information about all active sessions
   */
  static async getDetailedSessionInfo(): Promise<SessionInfo> {
    try {
      const response: SessionListResponse = await account.listSessions();
      const sessions = response.sessions || [];
      const currentSession = sessions.find(session => session.current) || null;

      return {
        hasSession: sessions.length > 0,
        sessionCount: sessions.length,
        sessions,
        currentSession
      };
    } catch (error) {
      devError('Failed to get session info:', error);
      throw new Error('Unable to retrieve session information');
    }
  }

  /**
   * Enforce session limit by deleting oldest sessions BEFORE creating new session
   * This prevents temporarily exceeding the session limit
   */
  static async enforceSessionLimit(): Promise<void> {
    try {
      const sessionInfo = await this.getDetailedSessionInfo();

      // If we're at or above the limit, we need to make room for the new session
      // We delete one extra session to make room for the incoming session
      if (sessionInfo.sessionCount >= SESSION_CONFIG.maxSessions) {
        // Sort sessions by creation date (oldest first)
        const sortedSessions = sessionInfo.sessions
          .filter(session => !session.current) // Never delete current session
          .sort((a, b) => new Date(a.$createdAt).getTime() - new Date(b.$createdAt).getTime());

        // Calculate how many sessions to delete to make room for new session
        const sessionsToDelete = sessionInfo.sessionCount - SESSION_CONFIG.maxSessions + 1;
        const sessionsToRemove = sortedSessions.slice(0, sessionsToDelete);

        // Delete oldest sessions with small delay between deletions
        for (const session of sessionsToRemove) {
          try {
            await account.deleteSession(session.$id);
            // Small delay to ensure deletion propagates
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (error) {
            devWarn(`Failed to delete session ${session.$id}:`, error);
            // Continue with other sessions even if one fails
          }
        }

        // Wait a bit more for all deletions to propagate
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    } catch (error) {
      devError('Failed to enforce session limit:', error);
      throw new Error('Unable to enforce session limit');
    }
  }

  /**
   * Enforce session limit AFTER login (cleanup any excess sessions)
   * This is a backup cleanup in case the pre-login enforcement missed anything
   */
  static async cleanupExcessSessions(): Promise<void> {
    try {
      const sessionInfo = await this.getDetailedSessionInfo();

      if (sessionInfo.sessionCount <= SESSION_CONFIG.maxSessions) {
        return; // Within limit, no action needed
      }

      // Sort sessions by creation date (oldest first)
      const sortedSessions = sessionInfo.sessions
        .filter(session => !session.current) // Never delete current session
        .sort((a, b) => new Date(a.$createdAt).getTime() - new Date(b.$createdAt).getTime());

      // Calculate how many sessions to delete
      const sessionsToDelete = sessionInfo.sessionCount - SESSION_CONFIG.maxSessions;
      const sessionsToRemove = sortedSessions.slice(0, sessionsToDelete);

      // Delete oldest sessions
      for (const session of sessionsToRemove) {
        try {
          await account.deleteSession(session.$id);
        } catch (error) {
          devWarn(`Failed to cleanup session ${session.$id}:`, error);
          // Continue with other sessions even if one fails
        }
      }
    } catch (error) {
      devError('Failed to cleanup excess sessions:', error);
      // Don't throw error for cleanup failures
    }
  }

  /**
   * Delete a specific session by ID
   */
  static async deleteSession(sessionId: string): Promise<void> {
    try {
      if (sessionId === 'current') {
        throw new Error('Cannot delete current session using this method');
      }

      await account.deleteSession(sessionId);
    } catch (error) {
      devError(`Failed to delete session ${sessionId}:`, error);
      if (error instanceof AppwriteException) {
        if (error.code === 404) {
          throw new Error('Session not found or already expired');
        } else if (error.code === 401) {
          throw new Error('Unauthorized to delete this session');
        }
      }
      throw new Error('Failed to delete session');
    }
  }

  /**
   * Delete all sessions except the current one
   */
  static async deleteAllOtherSessions(): Promise<void> {
    try {
      const sessionInfo = await this.getDetailedSessionInfo();
      const otherSessions = sessionInfo.sessions.filter(session => !session.current);

      for (const session of otherSessions) {
        try {
          await this.deleteSession(session.$id);
        } catch (error) {
          devWarn(`Failed to delete session ${session.$id}:`, error);
          // Continue with other sessions
        }
      }
    } catch (error) {
      devError('Failed to delete other sessions:', error);
      throw new Error('Unable to delete other sessions');
    }
  }

  /**
   * Delete all sessions (complete logout)
   */
  static async deleteAllSessions(): Promise<void> {
    try {
      await account.deleteSessions();
    } catch (error) {
      devError('Failed to delete all sessions:', error);
      throw new Error('Failed to logout from all devices');
    }
  }

  /**
   * Get human-readable device information
   */
  static getDeviceInfo(session: DetailedSession): string {
    const parts = [];
    
    if (session.deviceName && session.deviceName !== 'unknown') {
      parts.push(session.deviceName);
    }
    
    if (session.osName && session.osName !== 'unknown') {
      parts.push(session.osName);
    }
    
    if (session.clientName && session.clientName !== 'unknown') {
      parts.push(session.clientName);
    }

    return parts.length > 0 ? parts.join(' • ') : 'Unknown Device';
  }

  /**
   * Get human-readable location information
   */
  static getLocationInfo(session: DetailedSession): string {
    if (session.countryName && session.countryName !== 'unknown') {
      return session.countryName;
    }
    return 'Unknown Location';
  }

  /**
   * Get relative time string for session creation
   */
  static getRelativeTime(createdAt: string): string {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now.getTime() - created.getTime();
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    }
  }

  /**
   * Check if a session appears suspicious (different country from current)
   */
  static isSuspiciousSession(session: DetailedSession, currentSession: DetailedSession | null): boolean {
    if (!currentSession || session.current) {
      return false;
    }
    
    return session.countryCode !== currentSession.countryCode && 
           session.countryCode !== 'unknown' && 
           currentSession.countryCode !== 'unknown';
  }
}

export default SessionManager;
