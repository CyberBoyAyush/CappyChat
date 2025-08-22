import { NextRequest, NextResponse } from 'next/server';
import { AppwriteServerDB } from '@/lib/appwriteServer';
import { DBMessage } from '@/lib/appwriteDB';

export async function POST(request: NextRequest) {
  try {
    const { shareId, title, userId } = await request.json();

    if (!shareId) {
      return NextResponse.json(
        { error: 'Share ID is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log('🔄 Processing branch request for user:', userId);

    // Get shared thread by shareId using server-side client
    const sharedThread = await AppwriteServerDB.getSharedThread(shareId);
    if (!sharedThread) {
      return NextResponse.json(
        { error: 'Shared thread not found' },
        { status: 404 }
      );
    }

    // Generate new thread ID for the branch
    const newThreadId = `thread_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const branchTitle = title || `${sharedThread.title} (Branched)`;

    console.log('🔄 Creating branched thread:', { newThreadId, branchTitle, userId });

    // Create new thread for the user using server-side method
    await AppwriteServerDB.createThreadForUser(userId, newThreadId, branchTitle);

    // Get all messages from the shared thread using server-side method
    const originalMessages = await AppwriteServerDB.getSharedThreadMessages(sharedThread.threadId);

    console.log(`📝 Copying ${originalMessages.length} messages to new thread`);

    // Copy messages to the new thread using server-side method
    for (const message of originalMessages) {
      await AppwriteServerDB.createMessageForThread(newThreadId, userId, {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        role: message.role,
        content: message.content,
        createdAt: message.createdAt,
        model: message.model,
        attachments: message.attachments,
        imgurl: (message as DBMessage & { imgurl?: string }).imgurl
      });
    }

    console.log('✅ Branch created successfully:', newThreadId);

    return NextResponse.json({
      success: true,
      threadId: newThreadId,
      title: branchTitle
    });

  } catch (error: unknown) {
    console.error('❌ Error branching shared thread:', error);
    return NextResponse.json(
      {
        error: 'Failed to branch shared thread',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
