import { NextRequest, NextResponse } from 'next/server';
import { AppwriteDB } from '@/lib/appwriteDB';
import { v4 as uuidv4 } from 'uuid';
import {
  createBetterStackLogger,
  logApiRequestStart,
  logApiRequestSuccess,
  logApiRequestError,
  logValidationError,
  flushLogs,
} from '@/lib/betterstack-logger';

export async function POST(request: NextRequest) {
  const logger = createBetterStackLogger('share-create');
  let threadId: string | undefined;
  let userId: string | undefined;

  try {
    const body = await request.json();
    threadId = body.threadId;

    await logApiRequestStart(logger, '/api/share/create', {
      threadId: threadId || 'unknown',
    });

    if (!threadId) {
      await logValidationError(logger, '/api/share/create', 'threadId', 'Thread ID is required');
      await flushLogs(logger);
      return NextResponse.json(
        { error: 'Thread ID is required' },
        { status: 400 }
      );
    }

    // Get current user ID to verify ownership
    userId = await AppwriteDB.getCurrentUserId();
    if (!userId) {
      await logValidationError(logger, '/api/share/create', 'userId', 'Authentication required');
      await flushLogs(logger);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify thread exists and belongs to user
    const thread = await AppwriteDB.getThread(threadId);
    if (!thread) {
      await logValidationError(logger, '/api/share/create', 'thread', 'Thread not found');
      await flushLogs(logger);
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      );
    }

    // Generate unique share ID
    const shareId = `share_${uuidv4().replace(/-/g, '')}`;
    const sharedAt = new Date().toISOString();

    // Update thread with sharing information
    await AppwriteDB.updateThreadSharing(threadId, {
      isShared: true,
      shareId,
      sharedAt
    });

    await logApiRequestSuccess(logger, '/api/share/create', {
      threadId,
      userId,
      shareId,
    });
    await flushLogs(logger);

    return NextResponse.json({
      success: true,
      shareId,
      shareUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/share/${shareId}`
    });

  } catch (error) {
    console.error('Error creating share:', error);
    await logApiRequestError(logger, '/api/share/create', error, {
      threadId: threadId || 'unknown',
      userId: userId || 'unknown',
    });
    await flushLogs(logger);
    return NextResponse.json(
      { error: 'Failed to create share' },
      { status: 500 }
    );
  }
}
