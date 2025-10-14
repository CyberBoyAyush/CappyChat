/**
 * Admin Subscription Management API Route
 * 
 * Allows admins to view and manage all premium subscriptions
 * and user preferences.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Client, Users } from 'node-appwrite';
import {
  createBetterStackLogger,
  logApiRequestStart,
  logApiRequestSuccess,
  logApiRequestError,
  logAuthEvent,
  flushLogs,
} from '@/lib/betterstack-logger';

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);

const users = new Users(client);

// GET - Fetch all premium subscriptions
export async function GET(req: NextRequest) {
  const logger = createBetterStackLogger('admin-subscriptions');

  try {
    await logApiRequestStart(logger, '/api/admin/subscriptions', {
      method: 'GET',
    });

    const { searchParams } = new URL(req.url);
    const adminKey = searchParams.get('adminKey');

    // Verify admin access using admin key
    if (!adminKey || adminKey !== process.env.ADMIN_SECRET_KEY) {
      await logAuthEvent(logger, 'admin_access_denied', {
        endpoint: '/api/admin/subscriptions',
        method: 'GET',
      });
      await flushLogs(logger);
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // Get all users to find those with subscriptions
    const allUsers = await users.list();

    // Filter users who have subscription data in their preferences
    const usersWithSubscriptions = [];

    for (const user of allUsers.users) {
      const prefs = user.prefs as Record<string, unknown>;

      // Check if user has subscription data or is premium tier
      if (prefs?.subscriptionTier || prefs?.tier === 'premium') {
        try {
          // Use user preferences from Appwrite user prefs
          const userPreferences = {
            userId: user.$id,
            tier: prefs.tier || 'free',
            freeCredits: prefs.freeCredits || 0,
            premiumCredits: prefs.premiumCredits || 0,
            superPremiumCredits: prefs.superPremiumCredits || 0,
            lastResetDate: prefs.lastResetDate,
          };

          // Get subscription data from flattened fields
          const subscriptionData = {
            tier: prefs.subscriptionTier || (prefs.tier === 'premium' ? 'PREMIUM' : 'FREE'),
            status: prefs.subscriptionStatus || (prefs.tier === 'premium' ? 'active' : 'expired'),
            customerId: prefs.subscriptionCustomerId,
            subscriptionId: prefs.subscriptionId,
            currentPeriodEnd: prefs.subscriptionPeriodEnd,
            cancelAtPeriodEnd: prefs.subscriptionCancelAtEnd,
            next_billing_date: prefs.subscriptionNextBillingDate,
            currency: prefs.subscriptionCurrency,
            amount: prefs.subscriptionAmount,
            lastPaymentId: prefs.subscriptionLastPayment,
            retryCount: prefs.subscriptionRetryCount || 0,
            createdAt: user.$createdAt,
            updatedAt: prefs.subscriptionUpdatedAt,
          };

          usersWithSubscriptions.push({
            subscription: subscriptionData,
            preferences: userPreferences,
            user: {
              $id: user.$id,
              email: user.email,
              name: user.name,
              $createdAt: user.$createdAt,
              status: user.status
            }
          });
        } catch (error) {
          console.error(`Error processing user ${user.$id}:`, error);
        }
      }
    }

    const combinedData = usersWithSubscriptions;

    await logApiRequestSuccess(logger, '/api/admin/subscriptions', {
      method: 'GET',
      subscriptionsCount: combinedData.length,
    });
    await flushLogs(logger);

    return NextResponse.json({
      success: true,
      data: combinedData,
      total: combinedData.length
    });

  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    await logApiRequestError(logger, '/api/admin/subscriptions', error, {
      method: 'GET',
    });
    await flushLogs(logger);
    return NextResponse.json(
      {
        error: 'Failed to fetch subscriptions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Update user preferences or subscription
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { adminKey, targetUserId, action, data } = body;

    // Verify admin access using admin key
    if (!adminKey || adminKey !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    if (!targetUserId || !action) {
      return NextResponse.json(
        { error: 'Target user ID and action are required' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'updatePreferences':
        // Update user preferences in Appwrite user prefs
        try {
          const user = await users.get(targetUserId);
          const currentPrefs = (user.prefs as Record<string, unknown>) || {};

          // Update user preferences
          const updatedPrefs = {
            ...currentPrefs,
            ...data
          };

          await users.updatePrefs(targetUserId, updatedPrefs);
          result = { success: true, preferences: updatedPrefs };
        } catch (error) {
          return NextResponse.json(
            { error: 'Failed to update preferences' },
            { status: 500 }
          );
        }
        break;

      case 'updateSubscription':
        // Update subscription data in user preferences (flattened fields)
        try {
          const user = await users.get(targetUserId);
          const currentPrefs = (user.prefs as Record<string, unknown>) || {};

          // Update flattened subscription fields
          const updatedPrefs = {
            ...currentPrefs,
            subscriptionTier: data.tier ?? currentPrefs.subscriptionTier,
            subscriptionStatus: data.status ?? currentPrefs.subscriptionStatus,
            subscriptionCustomerId: data.customerId ?? currentPrefs.subscriptionCustomerId,
            subscriptionId: data.subscriptionId ?? currentPrefs.subscriptionId,
            subscriptionPeriodEnd: data.currentPeriodEnd ?? currentPrefs.subscriptionPeriodEnd,
            subscriptionCancelAtEnd: data.cancelAtPeriodEnd ?? currentPrefs.subscriptionCancelAtEnd,
            subscriptionCurrency: data.currency ?? currentPrefs.subscriptionCurrency,
            subscriptionAmount: data.amount ?? currentPrefs.subscriptionAmount,
            subscriptionLastPayment: data.lastPaymentId ?? currentPrefs.subscriptionLastPayment,
            subscriptionRetryCount: data.retryCount ?? currentPrefs.subscriptionRetryCount,
            subscriptionUpdatedAt: new Date().toISOString(),
          };

          await users.updatePrefs(targetUserId, updatedPrefs);

          result = { success: true, subscription: data };
        } catch (error) {
          return NextResponse.json(
            { error: 'Failed to update subscription' },
            { status: 500 }
          );
        }
        break;

      case 'cancelSubscription':
        // Cancel subscription in user preferences (flattened fields)
        try {
          const user = await users.get(targetUserId);
          const currentPrefs = (user.prefs as Record<string, unknown>) || {};
          const subscriptionId = String((currentPrefs as any).subscriptionId || '');

          if (subscriptionId) {
            // DODO-backed subscription: cancel at provider (keeps premium until period end)
            const { cancelSubscription } = await import('@/services/subscription.service');
            await cancelSubscription(targetUserId, subscriptionId);
            result = { success: true, subscription: { status: 'cancelled', cancelAtPeriodEnd: true } };
          } else {
            // Manual/override premium: downgrade instantly
            const updatedPrefs = {
              ...currentPrefs,
              tier: 'free',
              subscriptionTier: 'FREE',
              subscriptionStatus: 'expired',
              subscriptionCancelAtEnd: false,
              adminOverride: false,
              subscriptionUpdatedAt: new Date().toISOString(),
            };
            await users.updatePrefs(targetUserId, updatedPrefs);
            result = { success: true, subscription: { status: 'expired', cancelAtPeriodEnd: false } };
          }
        } catch (error) {
          return NextResponse.json(
            { error: 'Failed to cancel subscription' },
            { status: 500 }
          );
        }
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error updating subscription/preferences:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
