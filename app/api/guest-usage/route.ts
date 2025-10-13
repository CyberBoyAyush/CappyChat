/**
 * Guest Usage API
 * Returns current message count for guest users
 */

import { NextRequest, NextResponse } from 'next/server';
import { getGuestUsage } from '@/lib/guestRateLimit';

export async function GET(req: NextRequest) {
  try {
    const usage = getGuestUsage(req);
    
    return NextResponse.json({
      messagesUsed: usage?.count || 0,
      maxMessages: usage?.maxMessages || 2,
    });
  } catch (error) {
    console.error('[GuestUsage] Error getting usage:', error);
    return NextResponse.json(
      { error: 'Failed to get usage' },
      { status: 500 }
    );
  }
}

