import { NextRequest, NextResponse } from 'next/server';
import { Client, Users, Query } from 'node-appwrite';
import { adminResetUserCredits } from '@/lib/tierSystem';

// Initialize Appwrite client for server-side operations
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!); // Server-side API key required

const users = new Users(client);

export async function POST(req: NextRequest) {
  try {
    // Verify admin access (you can implement your own admin verification logic)
    const { adminKey, userId } = await req.json();
    
    if (!adminKey || adminKey !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (userId) {
      // Reset specific user using admin function
      await adminResetUserCredits(userId);
      return NextResponse.json({
        success: true,
        message: `Limits reset for user ${userId}`
      });
    } else {
      // Reset all users
      const resetCount = await resetAllUsersLimits();
      return NextResponse.json({
        success: true,
        message: `Limits reset for ${resetCount} users`
      });
    }
  } catch (error) {
    console.error('Error resetting limits:', error);
    return NextResponse.json(
      { error: 'Failed to reset limits' },
      { status: 500 }
    );
  }
}



async function resetAllUsersLimits(): Promise<number> {
  let resetCount = 0;
  let offset = 0;
  const limit = 100; // Process users in batches
  
  try {
    while (true) {
      // Get batch of users
      const usersList = await users.list([
        Query.limit(limit),
        Query.offset(offset)
      ]);
      
      if (usersList.users.length === 0) {
        break; // No more users
      }
      
      // Reset limits for each user in the batch using admin function
      for (const user of usersList.users) {
        try {
          await adminResetUserCredits(user.$id);
          resetCount++;
        } catch (error) {
          console.error(`Failed to reset limits for user ${user.$id}:`, error);
          // Continue with other users
        }
      }
      
      offset += limit;
      
      // Break if we've processed all users
      if (usersList.users.length < limit) {
        break;
      }
    }
  } catch (error) {
    console.error('Error in batch processing:', error);
    throw error;
  }
  
  return resetCount;
}
