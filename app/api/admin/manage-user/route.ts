import { NextRequest, NextResponse } from 'next/server';
import { adminGetUserByEmail, adminUpdateUserTier, adminResetUserCredits, getUserPreferencesServer } from '@/lib/tierSystem';
import { Client, Users, Query } from 'node-appwrite';
import { TIER_LIMITS } from '@/lib/appwrite';

// Initialize server client
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);

const users = new Users(client);

export async function POST(req: NextRequest) {
  try {
    const { adminKey, action, email, userId, tier } = await req.json();
    
    // Verify admin access
    if (!adminKey || adminKey !== process.env.ADMIN_SECRET_KEY) {
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

      case 'monthlyReset':
        const resetCount = await performMonthlyReset();

        return NextResponse.json({
          success: true,
          message: `Monthly reset completed for ${resetCount} users`
        });

      case 'logoutAllUsers':
        const logoutCount = await logoutAllUsers();

        return NextResponse.json({
          success: true,
          message: `Successfully logged out ${logoutCount} users`
        });

      case 'getAllUsers':
        const allUsers = await getAllUsers();
        return NextResponse.json({
          success: true,
          users: allUsers
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

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in admin manage user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function performMonthlyReset(): Promise<number> {
  let resetCount = 0;
  let offset = 0;
  const limit = 100; // Process users in batches

  try {
    while (true) {
      // Get batch of users
      const usersList = await users.list([Query.limit(limit), Query.offset(offset)]);

      if (usersList.users.length === 0) {
        break; // No more users
      }

      // Reset limits for each user in the batch
      for (const user of usersList.users) {
        try {
          const prefs = user.prefs as Record<string, unknown>;
          const tier = prefs.tier || 'free';
          const limits = TIER_LIMITS[tier as keyof typeof TIER_LIMITS];

          // Update user preferences with reset limits
          const updatedPrefs = {
            ...prefs,
            freeCredits: limits.freeCredits,
            premiumCredits: limits.premiumCredits,
            superPremiumCredits: limits.superPremiumCredits,
            lastResetDate: new Date().toISOString(),
          };

          await users.updatePrefs(user.$id, updatedPrefs);
          resetCount++;
        } catch (error) {
          console.error(`Failed to reset limits for user ${user.$id}:`, error);
          // Continue with other users
        }
      }

      offset += limit;
    }

    console.log(`Monthly reset completed for ${resetCount} users`);
    return resetCount;
  } catch (error) {
    console.error('Error performing monthly reset:', error);
    throw error;
  }
}

async function logoutAllUsers(): Promise<number> {
  let logoutCount = 0;
  let offset = 0;
  const limit = 50; // Reduced batch size to prevent timeouts
  const maxProcessingTime = 25000; // 25 seconds max (leave 5s buffer for serverless timeout)
  const startTime = Date.now();

  try {
    while (true) {
      // Check if we're approaching timeout
      if (Date.now() - startTime > maxProcessingTime) {
        console.log(`Timeout approaching, processed ${logoutCount} users so far`);
        break;
      }

      // Get batch of users
      const usersList = await users.list([Query.limit(limit), Query.offset(offset)]);

      if (usersList.users.length === 0) {
        break; // No more users
      }

      // Process users in smaller sub-batches to prevent overwhelming the API
      const subBatchSize = 10;
      for (let i = 0; i < usersList.users.length; i += subBatchSize) {
        const subBatch = usersList.users.slice(i, i + subBatchSize);

        // Process sub-batch in parallel with timeout protection
        await Promise.allSettled(
          subBatch.map(async (user) => {
            try {
              // Set a timeout for each user's session deletion
              const userTimeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('User session deletion timeout')), 3000)
              );

              const deleteUserSessions = async () => {
                try {
                  // Get all sessions for the user
                  const sessions = await users.listSessions(user.$id);

                  // Delete sessions in parallel with limited concurrency
                  const sessionDeletions = sessions.sessions.map(session =>
                    users.deleteSession(user.$id, session.$id).catch(error => {
                      console.error(`Failed to delete session ${session.$id} for user ${user.$id}:`, error);
                      return null;
                    })
                  );

                  await Promise.allSettled(sessionDeletions);
                  return true;
                } catch (error) {
                  console.error(`Failed to process sessions for user ${user.$id}:`, error);
                  return false;
                }
              };

              // Race between user session deletion and timeout
              await Promise.race([deleteUserSessions(), userTimeout]);
              logoutCount++;
            } catch (error) {
              console.error(`Failed to logout user ${user.$id}:`, error);
              // Continue with other users
            }
          })
        );

        // Small delay between sub-batches to prevent API rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      offset += limit;

      // Check timeout again after processing batch
      if (Date.now() - startTime > maxProcessingTime) {
        console.log(`Timeout reached, processed ${logoutCount} users total`);
        break;
      }
    }

    console.log(`Logout all users completed for ${logoutCount} users`);
    return logoutCount;
  } catch (error) {
    console.error('Error logging out all users:', error);
    throw error;
  }
}

async function getAllUsers() {
  try {
    const allUsers = [];
    let offset = 0;
    const limit = 100;

    while (true) {
      const usersList = await users.list([Query.limit(limit), Query.offset(offset)]);

      if (usersList.users.length === 0) {
        break;
      }

      // Get user preferences for each user
      for (const user of usersList.users) {
        try {
          const preferences = await getUserPreferencesServer(user.$id);
          allUsers.push({
            $id: user.$id,
            email: user.email,
            name: user.name,
            emailVerification: user.emailVerification,
            status: user.status,
            registration: user.registration,
            preferences
          });
        } catch (error) {
          console.error(`Failed to get preferences for user ${user.$id}:`, error);
          // Add user without preferences
          allUsers.push({
            $id: user.$id,
            email: user.email,
            name: user.name,
            emailVerification: user.emailVerification,
            status: user.status,
            registration: user.registration,
            preferences: null
          });
        }
      }

      offset += limit;

      if (usersList.users.length < limit) {
        break;
      }
    }

    return allUsers;
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
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
