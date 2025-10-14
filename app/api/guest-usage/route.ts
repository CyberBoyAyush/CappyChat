/**
 * Guest Usage API
 * Returns current message count for guest users
 */

import { NextRequest, NextResponse } from 'next/server';
import { getGuestUsage } from '@/lib/guestRateLimit';
import {
  createBetterStackLogger,
  logApiRequestStart,
  logApiRequestSuccess,
  logApiRequestError,
  flushLogs,
} from '@/lib/betterstack-logger';

export async function GET(req: NextRequest) {
  const logger = createBetterStackLogger('guest-usage');

  try {
    await logApiRequestStart(logger, '/api/guest-usage', {});

    const usage = getGuestUsage(req);

    await logApiRequestSuccess(logger, '/api/guest-usage', {
      messagesUsed: usage?.count || 0,
      maxMessages: usage?.maxMessages || 2,
    });
    await flushLogs(logger);

    return NextResponse.json({
      messagesUsed: usage?.count || 0,
      maxMessages: usage?.maxMessages || 2,
    });
  } catch (error) {
    console.error('[GuestUsage] Error getting usage:', error);
    await logApiRequestError(logger, '/api/guest-usage', error);
    await flushLogs(logger);
    return NextResponse.json(
      { error: 'Failed to get usage' },
      { status: 500 }
    );
  }
}

