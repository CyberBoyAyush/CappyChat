import { NextRequest, NextResponse } from 'next/server';
import { AppwriteServerDB } from '@/lib/appwriteServer';
import { DBMessage } from '@/lib/appwriteDB';
import {
  createBetterStackLogger,
  logApiRequestStart,
  logApiRequestSuccess,
  logApiRequestError,
  logValidationError,
  flushLogs,
} from '@/lib/betterstack-logger';

export async function POST(request: NextRequest) {
  const logger = createBetterStackLogger('share-branch');
  let shareId: string | undefined;
  let userId: string | undefined;

  try {
    const body = await request.json();
    shareId = body.shareId;
    const title = body.title;
    userId = body.userId;

    await logApiRequestStart(logger, '/api/share/branch', {
      shareId: shareId || 'unknown',
      userId: userId || 'unknown',
    });

    if (!shareId) {
      await logValidationError(logger, '/api/share/branch', 'shareId', 'Share ID is required');
      await flushLogs(logger);
      return NextResponse.json(
        { error: 'Share ID is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      await logValidationError(logger, '/api/share/branch', 'userId', 'User ID is required');
      await flushLogs(logger);
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

    // Build message ID mapping and copy messages
    const messageIdMap: Record<string, string> = {};

    for (const message of originalMessages) {
      const newMessageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      messageIdMap[message.id] = newMessageId;

      await AppwriteServerDB.createMessageForThread(newThreadId, userId, {
        id: newMessageId,
        role: message.role,
        content: message.content,
        createdAt: message.createdAt,
        model: message.model,
        attachments: message.attachments,
        imgurl: (message as DBMessage & { imgurl?: string }).imgurl,
        webSearchResults: (message as DBMessage & { webSearchResults?: string[] }).webSearchResults,
        webSearchImgs: (message as DBMessage & { webSearchImgs?: string[] }).webSearchImgs,
        isPlan: message.isPlan
      });
    }

    // Get all artifacts from the original shared thread
    const originalArtifacts = await AppwriteServerDB.getPlanArtifactsByThread(sharedThread.threadId);
    console.log(`🎨 Copying ${originalArtifacts.length} plan artifacts to new thread`);

    // Copy artifacts to the new thread with proper ownership and message mapping
    for (const artifact of originalArtifacts) {
      const newMessageId = messageIdMap[artifact.messageId];
      
      if (!newMessageId) {
        console.warn(`⚠️ Skipping artifact ${artifact.id} - could not map messageId ${artifact.messageId}`);
        continue;
      }

      await AppwriteServerDB.createPlanArtifactForThread(newThreadId, {
        artifactId: `artifact_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        messageId: newMessageId,
        userId: userId, // Transfer ownership to branching user
        type: artifact.type,
        title: artifact.title,
        description: artifact.description,
        htmlCode: artifact.htmlCode,
        cssCode: artifact.cssCode,
        jsCode: artifact.jsCode,
        framework: artifact.framework,
        theme: artifact.theme,
        diagramType: artifact.diagramType,
        diagramCode: artifact.diagramCode,
        outputFormat: artifact.outputFormat,
        sqlSchema: artifact.sqlSchema,
        prismaSchema: artifact.prismaSchema,
        typeormEntities: artifact.typeormEntities,
        diagramSvg: artifact.diagramSvg,
        mermaidCode: artifact.mermaidCode,
        d3Code: artifact.d3Code,
        version: artifact.version,
        parentArtifactId: artifact.parentArtifactId || undefined
      });
    }

    console.log('✅ Branch created successfully with messages and artifacts:', newThreadId);

    await logApiRequestSuccess(logger, '/api/share/branch', {
      shareId,
      userId,
      newThreadId,
      messageCount: originalMessages.length,
      artifactCount: originalArtifacts.length,
    });
    await flushLogs(logger);

    return NextResponse.json({
      success: true,
      threadId: newThreadId,
      title: branchTitle
    });

  } catch (error: unknown) {
    console.error('❌ Error branching shared thread:', error);
    await logApiRequestError(logger, '/api/share/branch', error, {
      shareId: shareId || 'unknown',
      userId: userId || 'unknown',
    });
    await flushLogs(logger);
    return NextResponse.json(
      {
        error: 'Failed to branch shared thread',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
