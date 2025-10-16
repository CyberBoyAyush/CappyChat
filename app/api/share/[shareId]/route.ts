import { NextRequest, NextResponse } from 'next/server';
import { AppwriteServerDB } from '@/lib/appwriteServer';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  try {
    const { shareId } = await params;

    if (!shareId) {
      return NextResponse.json(
        { error: 'Share ID is required' },
        { status: 400 }
      );
    }

    // Get shared thread by shareId using server-side client
    const sharedThread = await AppwriteServerDB.getSharedThread(shareId);
    if (!sharedThread) {
      return NextResponse.json(
        { error: 'Shared thread not found' },
        { status: 404 }
      );
    }

    // Get messages for the shared thread using server-side client
    const messages = await AppwriteServerDB.getSharedThreadMessages(sharedThread.threadId);

    // Get all plan artifacts for the thread using server-side client
    const planArtifacts = await AppwriteServerDB.getPlanArtifactsByThread(sharedThread.threadId);

    // Group artifacts by messageId for easy lookup
    const artifactsByMessage = planArtifacts.reduce((acc, artifact) => {
      if (!acc[artifact.messageId]) {
        acc[artifact.messageId] = [];
      }
      acc[artifact.messageId].push(artifact);
      return acc;
    }, {} as Record<string, any[]>);

    return NextResponse.json({
      success: true,
      thread: {
        id: sharedThread.threadId,
        title: sharedThread.title,
        createdAt: sharedThread.$createdAt,
        sharedAt: sharedThread.sharedAt,
        isShared: true
      },
      messages: messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt.toISOString(),
        model: msg.model,
        attachments: msg.attachments || [],
        imgurl: msg.imgurl,
        webSearchResults: (msg as any).webSearchResults || undefined,
        webSearchImgs: (msg as any).webSearchImgs || undefined,
        isPlan: msg.isPlan || false,
        planArtifacts: artifactsByMessage[msg.id] || []
      }))
    });

  } catch (error) {
    console.error('Error retrieving shared thread:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve shared thread' },
      { status: 500 }
    );
  }
}
