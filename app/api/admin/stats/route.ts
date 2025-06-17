import { NextRequest, NextResponse } from 'next/server';
import { Client, Users, Databases, Query } from 'node-appwrite';

// Initialize Appwrite client for server-side operations
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);

const users = new Users(client);
const databases = new Databases(client);

export async function POST(req: NextRequest) {
  try {
    const { adminKey } = await req.json();
    
    // Verify admin access
    if (!adminKey || adminKey !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all statistics
    const stats = await getAdminStats();
    
    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting admin stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getAdminStats() {
  try {
    // Get user statistics
    const userStats = await getUserStats();
    
    // Get database statistics
    const dbStats = await getDatabaseStats();
    
    // Get tier distribution
    const tierStats = await getTierStats();
    
    return {
      users: userStats,
      database: dbStats,
      tiers: tierStats,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error collecting admin stats:', error);
    throw error;
  }
}

async function getUserStats() {
  try {
    // Get total user count
    const totalUsers = await users.list();
    
    // Get users registered in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentUsers = await users.list([
      Query.greaterThan('registration', thirtyDaysAgo.toISOString())
    ]);
    
    // Get users registered today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayUsers = await users.list([
      Query.greaterThan('registration', today.toISOString())
    ]);
    
    return {
      total: totalUsers.total,
      recentlyRegistered: recentUsers.total,
      registeredToday: todayUsers.total,
      verified: totalUsers.users.filter(user => user.emailVerification).length,
      unverified: totalUsers.users.filter(user => !user.emailVerification).length
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    return {
      total: 0,
      recentlyRegistered: 0,
      registeredToday: 0,
      verified: 0,
      unverified: 0
    };
  }
}

async function getDatabaseStats() {
  try {
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
    
    // Get threads count
    let threadsCount = 0;
    try {
      const threads = await databases.listDocuments(databaseId, 'threads');
      threadsCount = threads.total;
    } catch (error) {
      console.log('Threads collection not found or error:', error);
    }
    
    // Get messages count
    let messagesCount = 0;
    try {
      const messages = await databases.listDocuments(databaseId, 'messages');
      messagesCount = messages.total;
    } catch (error) {
      console.log('Messages collection not found or error:', error);
    }
    
    // Get projects count
    let projectsCount = 0;
    try {
      const projects = await databases.listDocuments(databaseId, 'projects');
      projectsCount = projects.total;
    } catch (error) {
      console.log('Projects collection not found or error:', error);
    }
    
    return {
      threads: threadsCount,
      messages: messagesCount,
      projects: projectsCount
    };
  } catch (error) {
    console.error('Error getting database stats:', error);
    return {
      threads: 0,
      messages: 0,
      projects: 0
    };
  }
}

async function getTierStats() {
  try {
    let allUsers = [];
    let offset = 0;
    const limit = 100;

    // Get all users with pagination
    while (true) {
      const usersList = await users.list([Query.limit(limit), Query.offset(offset)]);

      if (usersList.users.length === 0) {
        break;
      }

      allUsers = allUsers.concat(usersList.users);
      offset += limit;

      if (usersList.users.length < limit) {
        break;
      }
    }

    const tierCounts = {
      free: 0,
      premium: 0,
      admin: 0,
      uninitialized: 0
    };

    const creditStats = {
      totalFreeCredits: 0,
      totalPremiumCredits: 0,
      totalSuperPremiumCredits: 0,
      usedFreeCredits: 0,
      usedPremiumCredits: 0,
      usedSuperPremiumCredits: 0
    };

    const TIER_LIMITS = {
      free: { freeCredits: 200, premiumCredits: 20, superPremiumCredits: 2 },
      premium: { freeCredits: 1000, premiumCredits: 200, superPremiumCredits: 20 },
      admin: { freeCredits: 10000, premiumCredits: 10000, superPremiumCredits: 10000 }
    };

    for (const user of allUsers) {
      const prefs = user.prefs as Record<string, unknown>;
      const tier = prefs.tier as string;

      if (tier === 'free') {
        tierCounts.free++;
      } else if (tier === 'premium') {
        tierCounts.premium++;
      } else if (tier === 'admin') {
        tierCounts.admin++;
      } else {
        tierCounts.uninitialized++;
      }

      // Sum up remaining credits
      if (typeof prefs.freeCredits === 'number') {
        creditStats.totalFreeCredits += prefs.freeCredits;
      }
      if (typeof prefs.premiumCredits === 'number') {
        creditStats.totalPremiumCredits += prefs.premiumCredits;
      }
      if (typeof prefs.superPremiumCredits === 'number') {
        creditStats.totalSuperPremiumCredits += prefs.superPremiumCredits;
      }

      // Calculate used credits (tier limit - remaining credits)
      const userTier = tier || 'free';
      const limits = TIER_LIMITS[userTier as keyof typeof TIER_LIMITS] || TIER_LIMITS.free;

      if (typeof prefs.freeCredits === 'number') {
        creditStats.usedFreeCredits += Math.max(0, limits.freeCredits - prefs.freeCredits);
      }
      if (typeof prefs.premiumCredits === 'number') {
        creditStats.usedPremiumCredits += Math.max(0, limits.premiumCredits - prefs.premiumCredits);
      }
      if (typeof prefs.superPremiumCredits === 'number') {
        creditStats.usedSuperPremiumCredits += Math.max(0, limits.superPremiumCredits - prefs.superPremiumCredits);
      }
    }

    return {
      distribution: tierCounts,
      credits: creditStats,
      totalUsers: allUsers.length
    };
  } catch (error) {
    console.error('Error getting tier stats:', error);
    return {
      distribution: {
        free: 0,
        premium: 0,
        admin: 0,
        uninitialized: 0
      },
      credits: {
        totalFreeCredits: 0,
        totalPremiumCredits: 0,
        totalSuperPremiumCredits: 0,
        usedFreeCredits: 0,
        usedPremiumCredits: 0,
        usedSuperPremiumCredits: 0
      },
      totalUsers: 0
    };
  }
}
