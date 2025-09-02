import { NextRequest, NextResponse } from 'next/server';
import { Client, Users, Query } from 'node-appwrite';
import { TIER_LIMITS } from '@/lib/appwrite';

// Initialize server client
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);

const users = new Users(client);

// Track running executions to prevent overlaps
let isRunning = false;
let currentProgress = {
  checked: 0,
  reset: 0,
  errors: 0,
  startTime: 0
};

/**
 * Check if user needs daily reset (30+ days since last reset)
 */
function shouldResetDaily(lastResetDate?: string): boolean {
  if (!lastResetDate) return true; // New users need reset
  
  const lastReset = new Date(lastResetDate);
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24));
  
  return daysDiff >= 30; // Reset after 30+ days
}

/**
 * Reset users who need daily reset (30+ days since last reset)
 * Optimized for bulk operations with progress tracking and timeout handling
 */
async function resetUsersDaily(maxTimeMs = 50000): Promise<{
  resetCount: number;
  checkedCount: number;
  errorCount: number;
  resetUsers: string[];
  timeoutReached: boolean;
  duration: number;
}> {
  const startTime = Date.now();
  let resetCount = 0;
  let checkedCount = 0;
  let errorCount = 0;
  let offset = 0;
  const limit = 50; // Smaller batches for better performance
  const resetUsers: string[] = [];
  let timeoutReached = false;

  // Reset progress tracking
  currentProgress = {
    checked: 0,
    reset: 0,
    errors: 0,
    startTime
  };

  try {
    console.log('[CronReset] Starting daily user reset check...');
    console.log(`[CronReset] Max execution time: ${maxTimeMs}ms`);

    while (true) {
      // Check timeout
      if (Date.now() - startTime > maxTimeMs) {
        console.log(`[CronReset] Timeout reached after ${Date.now() - startTime}ms`);
        timeoutReached = true;
        break;
      }

      // Get batch of users
      const usersList = await users.list([Query.limit(limit), Query.offset(offset)]);

      if (usersList.users.length === 0) {
        console.log('[CronReset] No more users to process');
        break; // No more users
      }

      console.log(`[CronReset] Processing batch: ${offset + 1}-${offset + usersList.users.length} users`);

      // Process each user in the batch
      const batchPromises = usersList.users.map(async (user) => {
        try {
          checkedCount++;
          currentProgress.checked = checkedCount;

          const prefs = user.prefs as Record<string, unknown>;
          const lastResetDate = prefs.lastResetDate as string | undefined;

          // Check if user needs reset
          if (shouldResetDaily(lastResetDate)) {
            const tier = (prefs.tier as string) || 'free';
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
            currentProgress.reset = resetCount;
            resetUsers.push(user.$id);

            const daysSinceReset = lastResetDate
              ? Math.floor((Date.now() - new Date(lastResetDate).getTime()) / (1000 * 60 * 60 * 24))
              : 'never';

            console.log(`[CronReset] ✅ Reset user ${user.$id} (${tier}) - ${daysSinceReset} days since last reset`);
          }
        } catch (error) {
          errorCount++;
          currentProgress.errors = errorCount;
          console.error(`[CronReset] ❌ Failed to process user ${user.$id}:`, error);
          // Continue with other users
        }
      });

      // Wait for all users in this batch to complete
      await Promise.all(batchPromises);

      // Log progress every 10 batches
      if ((offset / limit) % 10 === 0) {
        const elapsed = Date.now() - startTime;
        console.log(`[CronReset] Progress: ${checkedCount} checked, ${resetCount} reset, ${errorCount} errors (${elapsed}ms)`);
      }

      offset += limit;
    }

    const duration = Date.now() - startTime;
    console.log(`[CronReset] Daily reset completed: ${resetCount}/${checkedCount} users reset, ${errorCount} errors in ${duration}ms`);

    return {
      resetCount,
      checkedCount,
      errorCount,
      resetUsers,
      timeoutReached,
      duration
    };
  } catch (error) {
    console.error('[CronReset] Error during daily reset:', error);
    throw error;
  }
}

export async function GET(req: NextRequest) {
  try {
    // Check if already running
    if (isRunning) {
      const elapsed = Date.now() - currentProgress.startTime;
      return NextResponse.json(
        {
          error: 'Reset already in progress',
          message: 'Another reset operation is currently running',
          progress: {
            ...currentProgress,
            elapsed: `${elapsed}ms`
          }
        },
        { status: 429 }
      );
    }

    // Get auth key and optional timeout from query params
    const { searchParams } = new URL(req.url);
    const authKey = searchParams.get('key');
    const timeoutParam = searchParams.get('timeout');
    const maxTimeMs = timeoutParam ? parseInt(timeoutParam) * 1000 : 50000; // Default 50 seconds

    // Verify authentication
    if (!authKey || authKey !== process.env.ADMIN_SECRET_KEY) {
      console.warn('[CronReset] Unauthorized access attempt from:', req.headers.get('user-agent'));
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Set running flag
    isRunning = true;

    try {
      console.log(`[CronReset] Starting cron job with ${maxTimeMs}ms timeout`);

      // Perform daily reset with timeout
      const result = await resetUsersDaily(maxTimeMs);

      const response = {
        success: true,
        message: result.timeoutReached
          ? `Daily reset partially completed (timeout reached)`
          : `Daily reset completed successfully`,
        data: {
          resetCount: result.resetCount,
          checkedCount: result.checkedCount,
          errorCount: result.errorCount,
          duration: `${result.duration}ms`,
          timeoutReached: result.timeoutReached,
          timestamp: new Date().toISOString(),
          resetUsers: result.resetUsers.slice(0, 20), // Show first 20 reset users
          summary: {
            successRate: result.checkedCount > 0
              ? `${((result.checkedCount - result.errorCount) / result.checkedCount * 100).toFixed(1)}%`
              : '100%',
            resetRate: result.checkedCount > 0
              ? `${(result.resetCount / result.checkedCount * 100).toFixed(1)}%`
              : '0%'
          }
        }
      };

      console.log('[CronReset] ✅ Cron job completed:', {
        resetCount: result.resetCount,
        checkedCount: result.checkedCount,
        errorCount: result.errorCount,
        duration: result.duration,
        timeoutReached: result.timeoutReached
      });

      return NextResponse.json(response);

    } finally {
      // Always clear running flag
      isRunning = false;
    }

  } catch (error) {
    isRunning = false;
    console.error('[CronReset] ❌ Cron job failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString(),
        progress: currentProgress
      },
      { status: 500 }
    );
  }
}
