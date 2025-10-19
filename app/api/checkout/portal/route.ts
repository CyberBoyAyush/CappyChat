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
import {
  createBetterStackLogger,
  logApiRequestStart,
  logApiRequestSuccess,
  logApiRequestError,
  logValidationError,
  flushLogs,
} from '@/lib/betterstack-logger';

// Initialize server client for user verification
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);

const users = new Users(client);

// Server-side function to get user subscription (using flattened fields)
const getUserSubscriptionServer = async (userId: string): Promise<UserSubscription | null> => {
  try {
    const user = await users.get(userId);
    const prefs = user.prefs as Record<string, unknown>;

    // Check if user has subscription data in flattened fields
    if (prefs && (prefs.subscriptionTier || prefs.tier === 'premium')) {
      return {
        tier: (prefs.subscriptionTier as 'FREE' | 'PREMIUM') || (prefs.tier === 'premium' ? 'PREMIUM' : 'FREE'),
        status: (prefs.subscriptionStatus as any) || (prefs.tier === 'premium' ? 'active' : 'expired'),
        customerId: prefs.subscriptionCustomerId as string,
        subscriptionId: prefs.subscriptionId as string,
        currentPeriodEnd: prefs.subscriptionPeriodEnd as string,
        cancelAtPeriodEnd: prefs.subscriptionCancelAtEnd as boolean,
        currency: prefs.subscriptionCurrency as 'INR' | 'USD',
        amount: prefs.subscriptionAmount as number,
        adminOverride: prefs.adminOverride as boolean,
        lastPaymentId: prefs.subscriptionLastPayment as string,
        retryCount: (prefs.subscriptionRetryCount as number) || 0,
        createdAt: user.$createdAt,
        updatedAt: prefs.subscriptionUpdatedAt as string,
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting user subscription server-side:', error);
    return null;
  }
};

export async function POST(req: NextRequest) {
  const logger = createBetterStackLogger('checkout-portal');
  let userId: string | undefined;

  try {
    const body = await req.json();
    userId = body.userId;

    await logApiRequestStart(logger, '/api/checkout/portal', {
      userId: userId || 'unknown',
    });

    // Validate required fields
    if (!userId) {
      await logValidationError(logger, '/api/checkout/portal', 'userId', 'User ID is required');
      await flushLogs(logger);
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Verify user exists
    try {
      await users.get(userId);
    } catch {
      await logValidationError(logger, '/api/checkout/portal', 'user', 'User not found');
      await flushLogs(logger);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user's subscription to find customer ID
    const subscription = await getUserSubscriptionServer(userId);

    if (!subscription || !subscription.customerId) {
      await logValidationError(logger, '/api/checkout/portal', 'subscription', 'No active subscription found');
      await flushLogs(logger);
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

    await logApiRequestSuccess(logger, '/api/checkout/portal', {
      userId,
      customerId: subscription.customerId,
    });
    await flushLogs(logger);

    return NextResponse.json({
      success: true,
      portalUrl,
      customerId: subscription.customerId,
    });

  } catch (error) {
    console.error('Error creating customer portal:', error);
    await logApiRequestError(logger, '/api/checkout/portal', error, {
      userId: userId || 'unknown',
    });
    await flushLogs(logger);
    
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
