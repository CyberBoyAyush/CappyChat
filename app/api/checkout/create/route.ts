/**
 * Checkout Creation API Route
 * 
 * Creates DODO Payments subscription checkout sessions.
 * Handles currency detection and user authentication.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSubscriptionCheckout, Currency } from '@/services/subscription.service';
import { Client, Users } from 'node-appwrite';

// Initialize server client for user verification
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);

const users = new Users(client);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, userEmail, currency } = body;

    // Validate required fields
    if (!userId || !userEmail) {
      return NextResponse.json(
        { error: 'User ID and email are required' },
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

    // Validate currency if provided
    let selectedCurrency: Currency;
    if (currency) {
      if (currency !== 'INR' && currency !== 'USD') {
        return NextResponse.json(
          { error: 'Invalid currency. Must be INR or USD' },
          { status: 400 }
        );
      }
      selectedCurrency = currency;
    } else {
      // Use server-side currency detection as fallback
      selectedCurrency = 'USD'; // Default for server-side
    }

    console.log('Creating checkout for user:', {
      userId,
      userEmail,
      currency: selectedCurrency
    });

    // Create subscription checkout
    const { paymentUrl, customerId } = await createSubscriptionCheckout(
      userEmail,
      userId,
      selectedCurrency
    );

    return NextResponse.json({
      success: true,
      paymentUrl,
      customerId,
      currency: selectedCurrency,
    });

  } catch (error) {
    console.error('Error creating checkout:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create checkout session',
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
