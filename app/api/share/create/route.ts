import { NextRequest, NextResponse } from 'next/server';
import { AppwriteDB } from '@/lib/appwriteDB';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const { threadId } = await request.json();

    if (!threadId) {
      return NextResponse.json(
        { error: 'Thread ID is required' },
        { status: 400 }
      );
    }

    // Get current user ID to verify ownership
    const userId = await AppwriteDB.getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify thread exists and belongs to user
    const thread = await AppwriteDB.getThread(threadId);
    if (!thread) {
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

    return NextResponse.json({
      success: true,
      shareId,
      shareUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/share/${shareId}`
    });

  } catch (error) {
    console.error('Error creating share:', error);
    return NextResponse.json(
      { error: 'Failed to create share' },
      { status: 500 }
    );
  }
}
