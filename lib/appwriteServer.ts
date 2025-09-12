/**
 * Appwrite Server-Side Client
 * 
 * Provides server-side Appwrite client with admin privileges for API routes.
 * This client can access data without user authentication for public operations.
 */

import { Client, Databases, Query, ID } from 'node-appwrite';
import {
  DATABASE_ID,
  THREADS_COLLECTION_ID,
  MESSAGES_COLLECTION_ID,
  AppwriteThread,
  AppwriteMessage,
  DBMessage,
  FileAttachment
} from './appwriteDB';
import { devError } from './logger';

// Create server-side client with admin privileges
const serverClient = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '')
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')
  .setKey(process.env.APPWRITE_API_KEY || ''); // Server-side API key with admin privileges

const serverDatabases = new Databases(serverClient);

export class AppwriteServerDB {
  // Get shared thread by shareId (server-side with admin privileges)
  static async getSharedThread(shareId: string): Promise<AppwriteThread | null> {
    try {
      const response = await serverDatabases.listDocuments(
        DATABASE_ID,
        THREADS_COLLECTION_ID,
        [
          Query.equal('shareId', shareId),
          Query.equal('isShared', true)
        ]
      );

      if (response.documents.length === 0) {
        return null;
      }

      return response.documents[0] as unknown as AppwriteThread;
    } catch (error) {
      devError('Error getting shared thread (server):', error);
      throw error;
    }
  }

  // Get messages for a shared thread (server-side with admin privileges)
  static async getSharedThreadMessages(threadId: string): Promise<DBMessage[]> {
    try {
      const response = await serverDatabases.listDocuments(
        DATABASE_ID,
        MESSAGES_COLLECTION_ID,
        [
          Query.equal('threadId', threadId),
          Query.orderAsc('$createdAt')
        ]
      );

      return response.documents.map((doc) => {
        const messageDoc = doc as unknown as AppwriteMessage;
        
        // Parse attachments from JSON string if present
        let attachments: FileAttachment[] | undefined = undefined;
        if (messageDoc.attachments) {
          try {
            // If it's already an object, use it directly (backward compatibility)
            if (typeof messageDoc.attachments === 'object') {
              attachments = messageDoc.attachments as FileAttachment[];
            } else {
              // If it's a string, parse it
              attachments = JSON.parse(messageDoc.attachments as string);
            }

            // Ensure createdAt is a Date object for each attachment
            if (attachments && Array.isArray(attachments)) {
              attachments = attachments.map(att => ({
                ...att,
                createdAt: typeof att.createdAt === 'string' ? new Date(att.createdAt) : att.createdAt
              }));
            }
          } catch (error) {
            devError('Error parsing attachments:', error);
            attachments = undefined;
          }
        }
        
        return {
          id: messageDoc.messageId,
          threadId: messageDoc.threadId,
          role: messageDoc.role,
          content: messageDoc.content || "",
          createdAt: new Date(doc.$createdAt),
          model: messageDoc.model,
          attachments: attachments,
          imgurl: messageDoc.imgurl
        };
      });
    } catch (error) {
      devError('Error getting shared thread messages (server):', error);
      throw error;
    }
  }

  // Create a new thread for a specific user (server-side with admin privileges)
  static async createThreadForUser(userId: string, threadId: string, title: string): Promise<void> {
    try {
      const now = new Date().toISOString();

      await serverDatabases.createDocument(
        DATABASE_ID,
        THREADS_COLLECTION_ID,
        ID.unique(),
        {
          threadId,
          userId,
          title,
          updatedAt: now,
          lastMessageAt: now,
          isPinned: false,
          tags: [],
          isBranched: true, // Mark as branched since it's created from a shared thread
          projectId: null,
          isShared: false,
          shareId: null,
          sharedAt: null
        }
      );
    } catch (error) {
      devError('Error creating thread for user (server):', error);
      throw error;
    }
  }

  // Create a message for a specific thread (server-side with admin privileges)
  static async createMessageForThread(threadId: string, userId: string, messageData: {
    id: string;
    role: string;
    content: string;
    createdAt?: Date;
    model?: string;
    attachments?: FileAttachment[];
    imgurl?: string;
  }): Promise<void> {
    try {
      const createdAtISO = (messageData.createdAt ?? new Date()).toISOString();

      await serverDatabases.createDocument(
        DATABASE_ID,
        MESSAGES_COLLECTION_ID,
        ID.unique(),
        {
          messageId: messageData.id,
          threadId,
          userId, // required by schema
          content: messageData.content ?? '',
          role: messageData.role,
          createdAt: createdAtISO,
          model: messageData.model || undefined,
          attachments: messageData.attachments ? JSON.stringify(messageData.attachments) : undefined,
          imgurl: messageData.imgurl || undefined
        }
      );
    } catch (error) {
      devError('Error creating message for thread (server):', error);
      throw error;
    }
  }
}
