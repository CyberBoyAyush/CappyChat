/**
 * File Management API Route
 *
 * Handles user file management operations:
 * - GET: List all files uploaded by the current user
 * - DELETE: Delete a specific file from Cloudinary
 */

import { NextRequest, NextResponse } from "next/server";
import { Client, Databases, Query } from "node-appwrite";
import { CloudinaryService } from "@/lib/cloudinary";
import { FileAttachment } from "@/lib/appwriteDB";
import { devLog } from "@/lib/logger";
import {
  createBetterStackLogger,
  logApiRequestStart,
  logApiRequestSuccess,
  logApiRequestError,
  logValidationError,
  logFileOperation,
  logDatabaseOperation,
  flushLogs,
} from "@/lib/betterstack-logger";

// Initialize server client
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);

const databases = new Databases(client);

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const MESSAGES_COLLECTION_ID = "messages";

export const maxDuration = 60;

// Helper function to handle bulk deletion of images
async function handleBulkDeleteImages(userId: string) {
  try {
    devLog(`🗑️ Starting bulk deletion of images for user: ${userId}`);

    // Get all messages for the user that have attachments
    const messages = await databases.listDocuments(
      DATABASE_ID,
      MESSAGES_COLLECTION_ID,
      [
        Query.equal("userId", userId),
        Query.isNotNull("attachments"),
        Query.limit(1000),
      ]
    );

    console.log(
      `📄 Found ${messages.documents.length} messages with attachments to process`
    );

    const imagesToDelete: Array<{ publicId: string; messageId: string }> = [];
    const messagesToUpdate: Array<{
      messageId: string;
      updatedAttachments: any[];
    }> = [];

    // Process each message to find images
    for (const message of messages.documents) {
      try {
        const attachments = JSON.parse(message.attachments || "[]");
        if (Array.isArray(attachments) && attachments.length > 0) {
          const remainingAttachments: any[] = [];

          for (const attachment of attachments) {
            if (attachment.fileType === "image") {
              // Mark image for deletion
              imagesToDelete.push({
                publicId: attachment.publicId,
                messageId: message.$id,
              });
            } else {
              // Keep non-image attachments
              remainingAttachments.push(attachment);
            }
          }

          // If attachments were removed, mark message for update
          if (remainingAttachments.length !== attachments.length) {
            messagesToUpdate.push({
              messageId: message.$id,
              updatedAttachments: remainingAttachments,
            });
          }
        }
      } catch (error) {
        console.error(
          "Error processing message attachments:",
          message.$id,
          error
        );
      }
    }

    console.log(`🎯 Found ${imagesToDelete.length} images to delete`);
    console.log(`📝 Found ${messagesToUpdate.length} messages to update`);

    if (imagesToDelete.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No images found to delete",
        deletedCount: 0,
      });
    }

    // Delete images from Cloudinary in batches
    const batchSize = 10; // Process in smaller batches to avoid timeouts
    let deletedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < imagesToDelete.length; i += batchSize) {
      const batch = imagesToDelete.slice(i, i + batchSize);
      console.log(
        `🗑️ Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
          imagesToDelete.length / batchSize
        )}`
      );

      const deletePromises = batch.map(async (item) => {
        try {
          const deleted = await CloudinaryService.deleteFile(
            item.publicId,
            "image"
          );
          if (deleted) {
            deletedCount++;
            console.log(`✅ Deleted image: ${item.publicId}`);
          } else {
            failedCount++;
            console.error(`❌ Failed to delete image: ${item.publicId}`);
          }
        } catch (error) {
          failedCount++;
          console.error(`❌ Error deleting image ${item.publicId}:`, error);
        }
      });

      await Promise.all(deletePromises);
    }

    // Update messages in database to remove deleted image attachments
    let updatedMessageCount = 0;
    for (const messageUpdate of messagesToUpdate) {
      try {
        await databases.updateDocument(
          DATABASE_ID,
          MESSAGES_COLLECTION_ID,
          messageUpdate.messageId,
          {
            attachments:
              messageUpdate.updatedAttachments.length > 0
                ? JSON.stringify(messageUpdate.updatedAttachments)
                : null,
          }
        );
        updatedMessageCount++;
      } catch (error) {
        console.error(
          `Error updating message ${messageUpdate.messageId}:`,
          error
        );
      }
    }

    devLog(
      `🎉 Bulk deletion completed: ${deletedCount} images deleted, ${failedCount} failed, ${updatedMessageCount} messages updated`
    );

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${deletedCount} images${
        failedCount > 0 ? ` (${failedCount} failed)` : ""
      }`,
      deletedCount,
      failedCount,
      updatedMessageCount,
    });
  } catch (error) {
    console.error("Error in bulk delete images:", error);
    return NextResponse.json(
      { error: "Failed to delete images" },
      { status: 500 }
    );
  }
}

// POST: List all files for current user (changed from GET to POST to receive userId in body)
export async function POST(req: NextRequest) {
  const logger = createBetterStackLogger('files');

  try {
    const { userId } = await req.json();

    await logApiRequestStart(logger, '/api/files', {
      userId: userId || 'unknown',
      method: 'POST',
    });

    if (!userId) {
      await logValidationError(logger, '/api/files', 'userId', 'User ID is required');
      await flushLogs(logger);
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get all messages for the user that have attachments
    const messages = await databases.listDocuments(
      DATABASE_ID,
      MESSAGES_COLLECTION_ID,
      [
        Query.equal("userId", userId),
        Query.isNotNull("attachments"),
        Query.orderDesc("createdAt"),
        Query.limit(1000), // Reasonable limit
      ]
    );

    // Extract all file attachments
    const allFiles: (FileAttachment & {
      messageId: string;
      threadId: string;
      uploadedAt: Date;
    })[] = [];

    for (const message of messages.documents) {
      if (message.attachments) {
        try {
          let attachments: FileAttachment[] = [];

          // Parse attachments (handle both string and object formats)
          if (typeof message.attachments === "string") {
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
              createdAt:
                typeof attachment.createdAt === "string"
                  ? new Date(attachment.createdAt)
                  : attachment.createdAt,
            });
          }
        } catch (error) {
          console.error(
            "Error parsing attachments for message:",
            message.$id,
            error
          );
        }
      }
    }

    // Deduplicate files by publicId (same file can be in multiple messages)
    const uniqueFiles = allFiles.reduce((acc, file) => {
      const existingFile = acc.find((f) => f.publicId === file.publicId);
      if (!existingFile) {
        acc.push(file);
      } else {
        // Keep the file with the most recent uploadedAt date
        if (file.uploadedAt > existingFile.uploadedAt) {
          const index = acc.indexOf(existingFile);
          acc[index] = file;
        }
      }
      return acc;
    }, [] as typeof allFiles);

    // Sort by upload date (newest first)
    uniqueFiles.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());

    // Calculate total size
    const totalSize = uniqueFiles.reduce((sum, file) => sum + file.size, 0);

    await logApiRequestSuccess(logger, '/api/files', {
      totalFiles: uniqueFiles.length,
      totalSize,
    });
    await flushLogs(logger);

    return NextResponse.json({
      success: true,
      files: uniqueFiles,
      totalFiles: uniqueFiles.length,
      totalSize: totalSize,
    });
  } catch (error) {
    console.error("Error fetching user files:", error);
    await logApiRequestError(logger, '/api/files', error);
    await flushLogs(logger);
    return NextResponse.json(
      { error: "Failed to fetch files" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a specific file or bulk delete images
export async function DELETE(req: NextRequest) {
  const logger = createBetterStackLogger('files');

  try {
    const { userId, publicId, resourceType, bulkDeleteImages } =
      await req.json();

    await logApiRequestStart(logger, '/api/files', {
      userId: userId || 'unknown',
      method: 'DELETE',
      bulkDelete: !!bulkDeleteImages,
    });

    if (!userId) {
      await logValidationError(logger, '/api/files', 'userId', 'User ID is required');
      await flushLogs(logger);
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Handle bulk delete images
    if (bulkDeleteImages) {
      return await handleBulkDeleteImages(userId);
    }

    if (!publicId) {
      return NextResponse.json(
        { error: "Public ID is required" },
        { status: 400 }
      );
    }

    console.log(
      `🗑️ Starting deletion process for file: ${publicId} (user: ${userId})`
    );

    // Delete from Cloudinary
    const deleted = await CloudinaryService.deleteFile(
      publicId,
      resourceType === "image" ? "image" : "raw"
    );

    if (!deleted) {
      return NextResponse.json(
        { error: "Failed to delete file from storage" },
        { status: 500 }
      );
    }

    // Remove the attachment from all messages that contain it
    try {
      console.log(
        `🗑️ Removing attachment ${publicId} from database messages...`
      );

      // Find all messages that contain this file
      const messagesWithFile = await databases.listDocuments(
        DATABASE_ID,
        MESSAGES_COLLECTION_ID,
        [
          Query.equal("userId", userId),
          Query.isNotNull("attachments"),
          Query.limit(1000),
        ]
      );

      console.log(
        `📄 Found ${messagesWithFile.documents.length} messages with attachments to check`
      );
      let updatedMessageCount = 0;

      // Update each message to remove the deleted attachment
      for (const message of messagesWithFile.documents) {
        if (message.attachments) {
          try {
            let attachments: any[] = [];

            // Parse attachments
            if (typeof message.attachments === "string") {
              attachments = JSON.parse(message.attachments);
            } else if (Array.isArray(message.attachments)) {
              attachments = message.attachments;
            }

            // Filter out the deleted file
            const updatedAttachments = attachments.filter(
              (att) => att.publicId !== publicId
            );

            // Only update if attachments changed
            if (updatedAttachments.length !== attachments.length) {
              // Update the message with filtered attachments
              await databases.updateDocument(
                DATABASE_ID,
                MESSAGES_COLLECTION_ID,
                message.$id,
                {
                  attachments:
                    updatedAttachments.length > 0
                      ? JSON.stringify(updatedAttachments)
                      : null,
                }
              );
              updatedMessageCount++;
              console.log(
                `✅ Updated message ${message.$id} - removed attachment ${publicId}`
              );
            }
          } catch (parseError) {
            console.error(
              "Error parsing attachments for message:",
              message.$id,
              parseError
            );
          }
        }
      }

      console.log(
        `🎉 Successfully updated ${updatedMessageCount} messages, removed attachment ${publicId}`
      );
    } catch (dbError) {
      console.error("Error updating message attachments:", dbError);
      // Continue even if database update fails - file is already deleted from storage
    }

    await logFileOperation(logger, 'delete', {
      userId,
      publicId,
      resourceType,
    });
    await logApiRequestSuccess(logger, '/api/files', {
      operation: 'delete',
      publicId,
    });
    await flushLogs(logger);

    return NextResponse.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting file:", error);
    await logApiRequestError(logger, '/api/files', error);
    await flushLogs(logger);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
