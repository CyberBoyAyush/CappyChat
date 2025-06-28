/**
 * File Management API Route
 * 
 * Handles user file management operations:
 * - GET: List all files uploaded by the current user
 * - DELETE: Delete a specific file from Cloudinary
 */

import { NextRequest, NextResponse } from 'next/server';
import { Client, Databases, Query } from 'node-appwrite';
import { CloudinaryService } from '@/lib/cloudinary';
import { FileAttachment } from '@/lib/appwriteDB';

// Initialize server client
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);

const databases = new Databases(client);

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const MESSAGES_COLLECTION_ID = 'messages';

export const maxDuration = 60;

// POST: List all files for current user (changed from GET to POST to receive userId in body)
export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get all messages for the user that have attachments
    const messages = await databases.listDocuments(
      DATABASE_ID,
      MESSAGES_COLLECTION_ID,
      [
        Query.equal('userId', userId),
        Query.isNotNull('attachments'),
        Query.orderDesc('createdAt'),
        Query.limit(1000) // Reasonable limit
      ]
    );

    // Extract all file attachments
    const allFiles: (FileAttachment & { messageId: string; threadId: string; uploadedAt: Date })[] = [];
    
    for (const message of messages.documents) {
      if (message.attachments) {
        try {
          let attachments: FileAttachment[] = [];
          
          // Parse attachments (handle both string and object formats)
          if (typeof message.attachments === 'string') {
            attachments = JSON.parse(message.attachments);
          } else if (Array.isArray(message.attachments)) {
            attachments = message.attachments;
          }

          // Add message context to each attachment
          for (const attachment of attachments) {
            allFiles.push({
              ...attachment,
              messageId: message.messageId,
              threadId: message.threadId,
              uploadedAt: new Date(message.createdAt),
              createdAt: typeof attachment.createdAt === 'string' 
                ? new Date(attachment.createdAt) 
                : attachment.createdAt
            });
          }
        } catch (error) {
          console.error('Error parsing attachments for message:', message.$id, error);
        }
      }
    }

    // Sort by upload date (newest first)
    allFiles.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());

    // Calculate total size
    const totalSize = allFiles.reduce((sum, file) => sum + file.size, 0);

    return NextResponse.json({
      success: true,
      files: allFiles,
      totalFiles: allFiles.length,
      totalSize: totalSize
    });

  } catch (error) {
    console.error('Error fetching user files:', error);
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a specific file
export async function DELETE(req: NextRequest) {
  try {
    const { userId, publicId, resourceType } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    if (!publicId) {
      return NextResponse.json(
        { error: 'Public ID is required' },
        { status: 400 }
      );
    }

    console.log(`🗑️ Starting deletion process for file: ${publicId} (user: ${userId})`);

    // Delete from Cloudinary
    const deleted = await CloudinaryService.deleteFile(
      publicId,
      resourceType === 'image' ? 'image' : 'raw'
    );

    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete file from storage' },
        { status: 500 }
      );
    }

    // Remove the attachment from all messages that contain it
    try {
      console.log(`🗑️ Removing attachment ${publicId} from database messages...`);

      // Find all messages that contain this file
      const messagesWithFile = await databases.listDocuments(
        DATABASE_ID,
        MESSAGES_COLLECTION_ID,
        [
          Query.equal('userId', userId),
          Query.isNotNull('attachments'),
          Query.limit(1000)
        ]
      );

      console.log(`📄 Found ${messagesWithFile.documents.length} messages with attachments to check`);
      let updatedMessageCount = 0;

      // Update each message to remove the deleted attachment
      for (const message of messagesWithFile.documents) {
        if (message.attachments) {
          try {
            let attachments: any[] = [];

            // Parse attachments
            if (typeof message.attachments === 'string') {
              attachments = JSON.parse(message.attachments);
            } else if (Array.isArray(message.attachments)) {
              attachments = message.attachments;
            }

            // Filter out the deleted file
            const updatedAttachments = attachments.filter(att => att.publicId !== publicId);

            // Only update if attachments changed
            if (updatedAttachments.length !== attachments.length) {
              // Update the message with filtered attachments
              await databases.updateDocument(
                DATABASE_ID,
                MESSAGES_COLLECTION_ID,
                message.$id,
                {
                  attachments: updatedAttachments.length > 0 ? JSON.stringify(updatedAttachments) : null
                }
              );
              updatedMessageCount++;
              console.log(`✅ Updated message ${message.$id} - removed attachment ${publicId}`);
            }
          } catch (parseError) {
            console.error('Error parsing attachments for message:', message.$id, parseError);
          }
        }
      }

      console.log(`🎉 Successfully updated ${updatedMessageCount} messages, removed attachment ${publicId}`);
    } catch (dbError) {
      console.error('Error updating message attachments:', dbError);
      // Continue even if database update fails - file is already deleted from storage
    }

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
