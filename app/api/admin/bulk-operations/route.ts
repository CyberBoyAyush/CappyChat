import { NextRequest, NextResponse } from 'next/server';
import { Client, Users, Query } from 'node-appwrite';

// Initialize server client
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);

const users = new Users(client);

export async function POST(req: NextRequest) {
  try {
    const { adminKey, action, batchSize = 25, maxTime = 25000 } = await req.json();

    // Verify admin access
    if (!adminKey || adminKey !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate parameters
    const validatedBatchSize = Math.min(Math.max(batchSize, 5), 50); // Between 5-50
    const validatedMaxTime = Math.min(Math.max(maxTime, 10000), 30000); // Between 10-30 seconds

    switch (action) {
      case 'logoutAllUsersChunked':
        const result = await logoutAllUsersChunked(validatedBatchSize, validatedMaxTime);
        return NextResponse.json({
          success: true,
          message: `Processed ${result.processedUsers} users, logged out ${result.loggedOutUsers} users`,
          details: result
        });

      case 'getUserCount':
        const count = await getTotalUserCount();
        return NextResponse.json({
          success: true,
          totalUsers: count
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in bulk operations:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function getTotalUserCount(): Promise<number> {
  try {
    let totalCount = 0;
    let offset = 0;
    const limit = 100;

    while (true) {
      const usersList = await users.list([Query.limit(limit), Query.offset(offset)]);
      
      if (usersList.users.length === 0) {
        break;
      }

      totalCount += usersList.users.length;
      offset += limit;

      if (usersList.users.length < limit) {
        break;
      }
    }

    return totalCount;
  } catch (error) {
    console.error('Error getting user count:', error);
    throw error;
  }
}

async function logoutAllUsersChunked(batchSize: number = 25, maxTime: number = 25000) {
  const startTime = Date.now();
  let processedUsers = 0;
  let loggedOutUsers = 0;
  let offset = 0;
  const errors: string[] = [];

  try {
    while (true) {
      // Check timeout
      if (Date.now() - startTime > maxTime) {
        console.log(`Timeout reached after processing ${processedUsers} users`);
        break;
      }

      // Get batch of users
      const usersList = await users.list([Query.limit(batchSize), Query.offset(offset)]);

      if (usersList.users.length === 0) {
        break; // No more users
      }

      // Process each user with individual timeout protection
      const userPromises = usersList.users.map(async (user) => {
        try {
          // Individual user timeout (3 seconds per user)
          const userTimeout = new Promise<boolean>((_, reject) => 
            setTimeout(() => reject(new Error('User timeout')), 3000)
          );

          const processUser = async (): Promise<boolean> => {
            try {
              const sessions = await users.listSessions(user.$id);
              
              if (sessions.sessions.length === 0) {
                return false; // No sessions to delete
              }

              // Delete all sessions for this user in parallel
              const deletionPromises = sessions.sessions.map(session =>
                users.deleteSession(user.$id, session.$id).catch(error => {
                  console.error(`Failed to delete session ${session.$id}:`, error);
                  return null;
                })
              );

              await Promise.allSettled(deletionPromises);
              return true; // Successfully processed
            } catch (error) {
              console.error(`Error processing user ${user.$id}:`, error);
              return false;
            }
          };

          // Race between processing and timeout
          const success = await Promise.race([processUser(), userTimeout]);
          return { userId: user.$id, success };
        } catch (error) {
          errors.push(`User ${user.$id}: ${error}`);
          return { userId: user.$id, success: false };
        }
      });

      // Wait for all users in this batch to complete
      const results = await Promise.allSettled(userPromises);
      
      results.forEach((result) => {
        processedUsers++;
        if (result.status === 'fulfilled' && result.value.success) {
          loggedOutUsers++;
        }
      });

      offset += batchSize;

      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return {
      processedUsers,
      loggedOutUsers,
      errors,
      timeElapsed: Date.now() - startTime,
      completed: offset === 0 || processedUsers > 0
    };
  } catch (error) {
    console.error('Error in chunked logout:', error);
    throw error;
  }
}
