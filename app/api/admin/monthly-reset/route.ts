import { NextRequest, NextResponse } from 'next/server';
import { Client, Users, Query } from 'node-appwrite';
import { TIER_LIMITS } from '@/lib/appwrite';
import { shouldResetMonthly } from '@/lib/tierSystem';

// Initialize Appwrite client for server-side operations
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!); // Server-side API key required

const users = new Users(client);

export async function POST(req: NextRequest) {
  try {
    // Verify admin access
    const { adminKey } = await req.json();
    
    if (!adminKey || adminKey !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const resetCount = await performMonthlyReset();
    
    return NextResponse.json({ 
      success: true, 
      message: `Monthly reset completed for ${resetCount} users` 
    });
  } catch (error) {
    console.error('Error performing monthly reset:', error);
    return NextResponse.json(
      { error: 'Failed to perform monthly reset' },
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
      const usersList = await users.list([
        Query.limit(limit),
        Query.offset(offset)
      ]);
      
      if (usersList.users.length === 0) {
        break; // No more users
      }
      
      // Check and reset limits for each user in the batch
      for (const user of usersList.users) {
        try {
          const prefs = user.prefs as Record<string, unknown>;
          
          // Check if user needs monthly reset
          if (shouldResetMonthly(prefs.lastResetDate as string | undefined)) {
            await resetUserLimitsForMonth(user.$id, prefs);
            resetCount++;
          }
        } catch (error) {
          console.error(`Failed to process monthly reset for user ${user.$id}:`, error);
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
    console.error('Error in monthly reset batch processing:', error);
    throw error;
  }
  
  return resetCount;
}

async function resetUserLimitsForMonth(userId: string, currentPrefs: Record<string, unknown>): Promise<void> {
  try {
    // Determine user's tier
    const tier = currentPrefs.tier || 'free';
    const limits = TIER_LIMITS[tier as keyof typeof TIER_LIMITS];
    
    // Update user preferences with reset limits
    const updatedPrefs = {
      ...currentPrefs,
      freeCredits: limits.freeCredits,
      premiumCredits: limits.premiumCredits,
      superPremiumCredits: limits.superPremiumCredits,
      lastResetDate: new Date().toISOString(),
    };
    
    await users.updatePrefs(userId, updatedPrefs);
  } catch (error) {
    console.error(`Error resetting monthly limits for user ${userId}:`, error);
    throw error;
  }
}
