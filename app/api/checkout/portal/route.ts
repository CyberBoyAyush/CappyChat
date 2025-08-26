/**
 * Customer Portal API Route
 * 
 * Creates DODO Payments customer portal sessions for subscription management.
 * Allows users to manage their subscriptions, update payment methods, and view billing history.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createCustomerPortalSession } from '@/services/subscription.service';
import { UserSubscription } from '@/lib/appwrite';
import { Client, Users } from 'node-appwrite';

// Initialize server client for user verification
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);

const users = new Users(client);

// Server-side function to get user subscription
const getUserSubscriptionServer = async (userId: string): Promise<UserSubscription | null> => {
  try {
    const user = await users.get(userId);
    const prefs = user.prefs as Record<string, unknown>;

    if (prefs && prefs.subscription) {
      return prefs.subscription as UserSubscription;
    }

    return null;
  } catch (error) {
    console.error('Error getting user subscription server-side:', error);
    return null;
  }
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Verify user exists
    try {
      await users.get(userId);
    } catch {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user's subscription to find customer ID
    const subscription = await getUserSubscriptionServer(userId);
    
    if (!subscription || !subscription.customerId) {
      return NextResponse.json(
        { error: 'No active subscription found. Please subscribe first.' },
        { status: 404 }
      );
    }

    console.log('Creating customer portal for user:', {
      userId,
      customerId: subscription.customerId
    });

    // Create customer portal session
    const { portalUrl } = await createCustomerPortalSession(subscription.customerId);

    return NextResponse.json({
      success: true,
      portalUrl,
      customerId: subscription.customerId,
    });

  } catch (error) {
    console.error('Error creating customer portal:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create customer portal session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
