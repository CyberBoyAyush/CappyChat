import { NextRequest, NextResponse } from 'next/server';
import { adminGetUserByEmail, adminUpdateUserTier, adminResetUserCredits, getUserPreferencesServer } from '@/lib/tierSystem';
import { Client, Users } from 'node-appwrite';
import {
  createBetterStackLogger,
  logApiRequestStart,
  logApiRequestSuccess,
  logApiRequestError,
  logAuthEvent,
  flushLogs,
} from '@/lib/betterstack-logger';


// Initialize server client
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);

const users = new Users(client);

export async function POST(req: NextRequest) {
  const logger = createBetterStackLogger('admin-manage-user');
  let action: string | undefined;

  try {
    const body = await req.json();
    const { adminKey, action: requestAction, email, userId, tier, subscriptionOverride } = body;
    action = requestAction;

    await logApiRequestStart(logger, '/api/admin/manage-user', {
      action: action || 'unknown',
    });

    // Verify admin access
    if (!adminKey || adminKey !== process.env.ADMIN_SECRET_KEY) {
      await logAuthEvent(logger, 'admin_access_denied', {
        endpoint: '/api/admin/manage-user',
        action: action || 'unknown',
      });
      await flushLogs(logger);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    switch (action) {
      case 'getUserByEmail':
        if (!email) {
          return NextResponse.json(
            { error: 'Email is required' },
            { status: 400 }
          );
        }
        
        const user = await adminGetUserByEmail(email);
        if (!user) {
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }
        
        // Get user preferences
        const preferences = await getUserPreferencesServer(user.$id);

        await logApiRequestSuccess(logger, '/api/admin/manage-user', {
          action: 'getUserByEmail',
          email,
        });
        await flushLogs(logger);

        return NextResponse.json({
          success: true,
          user: {
            ...user,
            preferences
          }
        });

      case 'updateTier':
        if (!userId || !tier) {
          return NextResponse.json(
            { error: 'User ID and tier are required' },
            { status: 400 }
          );
        }
        
        if (!['free', 'premium', 'admin'].includes(tier)) {
          return NextResponse.json(
            { error: 'Invalid tier. Must be free, premium, or admin' },
            { status: 400 }
          );
        }
        
        await adminUpdateUserTier(userId, tier);
        
        return NextResponse.json({
          success: true,
          message: `User tier updated to ${tier}`
        });

      case 'resetCredits':
        if (!userId) {
          return NextResponse.json(
            { error: 'User ID is required' },
            { status: 400 }
          );
        }

        await adminResetUserCredits(userId);

        return NextResponse.json({
          success: true,
          message: 'User credits reset successfully'
        });

      case 'clearUserSession':
        if (!userId) {
          return NextResponse.json(
            { error: 'User ID is required' },
            { status: 400 }
          );
        }

        const sessionCleared = await clearUserSession(userId);
        return NextResponse.json({
          success: true,
          message: `User session cleared for ${userId}`,
          sessionCleared
        });

      case 'resetUserCredits':
        if (!userId) {
          return NextResponse.json(
            { error: 'User ID is required' },
            { status: 400 }
          );
        }

        await adminResetUserCredits(userId);
        return NextResponse.json({
          success: true,
          message: `Credits reset for user ${userId}`
        });

      case 'setSubscriptionOverride':
        if (!userId) {
          return NextResponse.json(
            { error: 'User ID is required' },
            { status: 400 }
          );
        }

        if (typeof subscriptionOverride !== 'boolean') {
          return NextResponse.json(
            { error: 'subscriptionOverride must be a boolean' },
            { status: 400 }
          );
        }

        // Get current user preferences
        const targetUser = await users.get(userId);
        const currentPrefs = targetUser.prefs as Record<string, unknown>;

        // Update subscription with admin override using flattened fields
        const updatedPrefs = {
          ...currentPrefs,
          adminOverride: subscriptionOverride,
          subscriptionTier: subscriptionOverride ? 'PREMIUM' : 'FREE',
          subscriptionStatus: subscriptionOverride ? 'active' : 'expired',
          subscriptionUpdatedAt: new Date().toISOString(),
        };

        await users.updatePrefs(userId, updatedPrefs);

        return NextResponse.json({
          success: true,
          message: `Subscription override ${subscriptionOverride ? 'enabled' : 'disabled'} for user`
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in admin manage user:', error);
    await logApiRequestError(logger, '/api/admin/manage-user', error, {
      action: action || 'unknown',
    });
    await flushLogs(logger);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}







async function clearUserSession(userId: string): Promise<boolean> {
  try {
    // Get all sessions for the user
    const sessions = await users.listSessions(userId);

    let clearedCount = 0;
    // Delete each session
    for (const session of sessions.sessions) {
      try {
        await users.deleteSession(userId, session.$id);
        clearedCount++;
      } catch (sessionError) {
        console.error(`Failed to delete session ${session.$id} for user ${userId}:`, sessionError);
      }
    }

    console.log(`Cleared ${clearedCount} sessions for user ${userId}`);
    return clearedCount > 0;
  } catch (error) {
    console.error(`Error clearing sessions for user ${userId}:`, error);
    throw error;
  }
}
