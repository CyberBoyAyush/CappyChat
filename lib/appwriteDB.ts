/**
 * Appwrite Database Service
 * 
 * Provides a centralized database service using Appwrite entirely.
 * All data is stored directly in Appwrite for better synchronization.
 */

import { Client, Databases, ID, Models, Query } from 'appwrite';
import { account, client } from './appwrite';

// Database and Collection IDs
export const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';
export const THREADS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_THREADS_COLLECTION_ID || 'threads';
export const MESSAGES_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID || 'messages';
export const MESSAGE_SUMMARIES_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_MESSAGE_SUMMARIES_COLLECTION_ID || 'message_summaries';

// Initialize Appwrite databases service
const databases = new Databases(client);

// Interface for Appwrite Thread document
// These interfaces strictly follow the provided schema requirements
export interface AppwriteThread extends Models.Document {
  threadId: string;
  userId: string;
  title: string;
  updatedAt: string; // ISO date string
  lastMessageAt: string; // ISO date string
  isPinned: boolean; // Pin status for thread organization
  tags?: string[]; // Optional tags array for thread categorization
  isBranched?: boolean; // Branch status for thread organization
}

// Define Thread interface for internal use
export interface Thread {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date;
  isPinned: boolean; // Pin status for thread organization
  tags?: string[]; // Optional tags array for thread categorization
  isBranched?: boolean; // Branch status for thread organization
}

// Interface for Appwrite Message document
export interface AppwriteMessage extends Models.Document {
  messageId: string;
  threadId: string;
  userId: string;
  content: string;
  role: 'user' | 'assistant' | 'system' | 'data';
  createdAt: string; // ISO date string
  webSearchResults?: string[]; // URLs from web search results
}

// Define Message interface for internal use
export interface DBMessage {
  id: string;
  threadId: string;
  content: string;
  parts?: any[];
  role: 'user' | 'assistant' | 'system' | 'data';
  createdAt: Date;
  webSearchResults?: string[]; // URLs from web search results
}

// Interface for Appwrite Message Summary document
export interface AppwriteMessageSummary extends Models.Document {
  summaryId: string;
  threadId: string;
  messageId: string;
  userId: string;
  content: string;
  createdAt: string; // ISO date string
}

// Define MessageSummary interface for internal use
export interface MessageSummary {
  id: string;
  threadId: string;
  messageId: string;
  content: string;
  createdAt: Date;
}

// Appwrite database service
export class AppwriteDB {
  static async getCurrentUserId(): Promise<string> {
    try {
      const user = await account.get();
      if (!user || !user.$id) {
        throw new Error('No authenticated user found');
      }
      return user.$id;
    } catch (error) {
      throw new Error('User is not authenticated');
    }
  }

  // -------------- Thread Operations --------------

  // Get all threads for current user
  static async getThreads(): Promise<Thread[]> {
    try {
      const userId = await this.getCurrentUserId();
      
      // Get threads from Appwrite
      const response = await databases.listDocuments(
        DATABASE_ID,
        THREADS_COLLECTION_ID,
        [
          Query.equal('userId', userId),
          Query.orderDesc('lastMessageAt')
        ]
      );
      
      // Map Appwrite threads to Thread format
      const threads = response.documents.map((doc) => {
        const threadDoc = doc as unknown as AppwriteThread;
        return {
          id: threadDoc.threadId,
          title: threadDoc.title,
          createdAt: new Date(doc.$createdAt),
          updatedAt: new Date(threadDoc.updatedAt),
          lastMessageAt: new Date(threadDoc.lastMessageAt),
          isPinned: threadDoc.isPinned || false, // Default to false for existing threads
          tags: threadDoc.tags || [], // Default to empty array for existing threads
          isBranched: threadDoc.isBranched || false // Default to false for existing threads
        };
      });
      
      return threads;
    } catch (error) {
      console.error('Error fetching threads from Appwrite:', error);
      return [];
    }
  }

  // Create a new thread (with duplicate check) - optimized for speed
  static async createThread(threadId: string): Promise<string> {
    try {
      const userId = await this.getCurrentUserId();
      const now = new Date();
      
      const threadData = {
        threadId: threadId,
        userId: userId,
        title: 'New Chat',
        updatedAt: now.toISOString(),
        lastMessageAt: now.toISOString(),
        isPinned: false, // New threads are not pinned by default
        isBranched: false // New threads are not branched by default
      };
      
      // Use upsert-like behavior by trying to create and handling duplicates
      try {
        await databases.createDocument(
          DATABASE_ID,
          THREADS_COLLECTION_ID,
          ID.unique(),
          threadData
        );
      } catch (error: any) {
        // If error is due to duplicate, check if thread exists and return
        if (error.code === 409 || error.message?.includes('already exists')) {
          const existingThreads = await databases.listDocuments(
            DATABASE_ID,
            THREADS_COLLECTION_ID,
            [
              Query.equal('threadId', threadId),
              Query.equal('userId', userId)
            ]
          );
          if (existingThreads.documents.length > 0) {
            return threadId;
          }
        }
        throw error;
      }
      
      return threadId;
    } catch (error) {
      console.error('Error creating thread:', error);
      throw error;
    }
  }

  // Update thread title (with existence check)
  static async updateThread(threadId: string, title: string): Promise<void> {
    try {
      const userId = await this.getCurrentUserId();
      const now = new Date();

      // Find the Appwrite document ID by threadId
      const response = await databases.listDocuments(
        DATABASE_ID,
        THREADS_COLLECTION_ID,
        [
          Query.equal('threadId', threadId),
          Query.equal('userId', userId)
        ]
      );

      if (response.documents.length > 0) {
        const doc = response.documents[0] as AppwriteThread;

        // Update in Appwrite - strictly adhering to schema
        await databases.updateDocument(
          DATABASE_ID,
          THREADS_COLLECTION_ID,
          doc.$id,
          {
            title: title,
            updatedAt: now.toISOString(),
            // We maintain lastMessageAt unchanged as this is just a title update
          }
        );
      } else {
        throw new Error(`Thread with ID ${threadId} not found`);
      }
    } catch (error) {
      console.error('Error updating thread:', error);
      throw error;
    }
  }

  // Pin or unpin a thread
  static async updateThreadPinStatus(threadId: string, isPinned: boolean): Promise<void> {
    try {
      const userId = await this.getCurrentUserId();
      const now = new Date();

      // Find the Appwrite document ID by threadId
      const response = await databases.listDocuments(
        DATABASE_ID,
        THREADS_COLLECTION_ID,
        [
          Query.equal('threadId', threadId),
          Query.equal('userId', userId)
        ]
      );

      if (response.documents.length > 0) {
        const doc = response.documents[0] as AppwriteThread;

        // Update pin status in Appwrite
        await databases.updateDocument(
          DATABASE_ID,
          THREADS_COLLECTION_ID,
          doc.$id,
          {
            isPinned: isPinned,
            updatedAt: now.toISOString(),
            // We maintain lastMessageAt unchanged as this is just a pin status update
          }
        );
      } else {
        throw new Error(`Thread with ID ${threadId} not found`);
      }
    } catch (error) {
      console.error('Error updating thread pin status:', error);
      throw error;
    }
  }

  // Update thread tags
  static async updateThreadTags(threadId: string, tags: string[]): Promise<void> {
    try {
      const userId = await this.getCurrentUserId();
      const now = new Date();

      // Find the Appwrite document ID by threadId
      const response = await databases.listDocuments(
        DATABASE_ID,
        THREADS_COLLECTION_ID,
        [
          Query.equal('threadId', threadId),
          Query.equal('userId', userId)
        ]
      );

      if (response.documents.length > 0) {
        const doc = response.documents[0] as AppwriteThread;

        // Update tags in Appwrite
        await databases.updateDocument(
          DATABASE_ID,
          THREADS_COLLECTION_ID,
          doc.$id,
          {
            tags: tags,
            updatedAt: now.toISOString(),
            // We maintain lastMessageAt unchanged as this is just a tags update
          }
        );
      } else {
        throw new Error(`Thread with ID ${threadId} not found`);
      }
    } catch (error) {
      console.error('Error updating thread tags:', error);
      throw error;
    }
  }

  // Delete a thread and all associated messages and summaries
  static async deleteThread(threadId: string): Promise<void> {
    try {
      const userId = await this.getCurrentUserId();
      
      // Find the thread document
      const threadsResponse = await databases.listDocuments(
        DATABASE_ID,
        THREADS_COLLECTION_ID,
        [
          Query.equal('threadId', threadId),
          Query.equal('userId', userId)
        ]
      );
      
      if (threadsResponse.documents.length === 0) {
        console.warn(`Thread ${threadId} not found, may already be deleted`);
        return;
      }
      
      // Find and delete all messages for this thread
      const messagesResponse = await databases.listDocuments(
        DATABASE_ID,
        MESSAGES_COLLECTION_ID,
        [
          Query.equal('threadId', threadId),
          Query.equal('userId', userId)
        ]
      );
      
      for (const doc of messagesResponse.documents) {
        await databases.deleteDocument(
          DATABASE_ID,
          MESSAGES_COLLECTION_ID,
          doc.$id
        );
      }
      
      // Find and delete all message summaries for this thread
      const summariesResponse = await databases.listDocuments(
        DATABASE_ID,
        MESSAGE_SUMMARIES_COLLECTION_ID,
        [
          Query.equal('threadId', threadId),
          Query.equal('userId', userId)
        ]
      );
      
      for (const doc of summariesResponse.documents) {
        await databases.deleteDocument(
          DATABASE_ID,
          MESSAGE_SUMMARIES_COLLECTION_ID,
          doc.$id
        );
      }
      
      // Delete the thread itself
      const threadDoc = threadsResponse.documents[0] as AppwriteThread;
      await databases.deleteDocument(
        DATABASE_ID,
        THREADS_COLLECTION_ID,
        threadDoc.$id
      );
    } catch (error) {
      console.error('Error deleting thread:', error);
      throw error;
    }
  }

  // Delete all threads and associated data
  static async deleteAllThreads(): Promise<void> {
    try {
      const userId = await this.getCurrentUserId();
      
      // Get all threads for this user
      const threadsResponse = await databases.listDocuments(
        DATABASE_ID,
        THREADS_COLLECTION_ID,
        [Query.equal('userId', userId)]
      );
      
      // Delete each thread, which will cascade to delete messages and summaries
      for (const threadDoc of threadsResponse.documents) {
        await this.deleteThread((threadDoc as AppwriteThread).threadId);
      }
      
      // No need to clear local DB as we're using Appwrite exclusively now
    } catch (error) {
      console.error('Error deleting all threads:', error);
      throw error;
    }
  }

  // -------------- Message Operations --------------

  // Get messages by thread ID
  static async getMessagesByThreadId(threadId: string): Promise<DBMessage[]> {
    try {
      const userId = await this.getCurrentUserId();
      
      // Get messages from Appwrite
      const response = await databases.listDocuments(
        DATABASE_ID,
        MESSAGES_COLLECTION_ID,
        [
          Query.equal('threadId', threadId),
          Query.equal('userId', userId),
          Query.orderAsc('createdAt')
        ]
      );
      
      // Map Appwrite messages to local DBMessage format
      const messages = response.documents.map((doc) => {
        const messageDoc = doc as unknown as AppwriteMessage;
        return {
          id: messageDoc.messageId,
          threadId: messageDoc.threadId,
          content: messageDoc.content,
          role: messageDoc.role,
          parts: messageDoc.content ? [{ type: "text", text: messageDoc.content }] : [],
          createdAt: new Date(messageDoc.createdAt),
          webSearchResults: messageDoc.webSearchResults || undefined
        };
      });
      
      return messages;
    } catch (error) {
      console.error('Error fetching messages from Appwrite:', error);
      return []; // Return empty array instead of using localDb as fallback
    }
  }

  // Create a message (optimized with batch operations and error recovery)
  static async createMessage(threadId: string, message: any): Promise<void> {
    try {
      const userId = await this.getCurrentUserId();
      const now = new Date();
      const messageCreatedAt = message.createdAt || now;

      // Create message first
      const messageData: any = {
        messageId: message.id,
        threadId: threadId,
        userId: userId,
        content: message.content,
        role: message.role,
        createdAt: messageCreatedAt.toISOString()
      };

      // Add webSearchResults if present
      if (message.webSearchResults && message.webSearchResults.length > 0) {
        messageData.webSearchResults = message.webSearchResults;
      }

      const messagePromise = databases.createDocument(
        DATABASE_ID,
        MESSAGES_COLLECTION_ID,
        ID.unique(),
        messageData
      ).catch(async (error) => {
        // If message creation fails, don't automatically create thread
        // Let it fail since HybridDB should have handled thread creation
        throw error;
      });

      // Update thread timestamp in parallel
      const updateThreadPromise = this.updateThreadLastMessage(threadId, messageCreatedAt, now);

      // Execute both operations in parallel
      await Promise.all([messagePromise, updateThreadPromise]);
    } catch (error) {
      console.error('Error creating message:', error);
      throw error;
    }
  }

  // Helper function to update thread's last message timestamp
  private static async updateThreadLastMessage(threadId: string, messageCreatedAt: Date, now: Date): Promise<void> {
    try {
      const userId = await this.getCurrentUserId();
      
      const threadsResponse = await databases.listDocuments(
        DATABASE_ID,
        THREADS_COLLECTION_ID,
        [
          Query.equal('threadId', threadId),
          Query.equal('userId', userId)
        ]
      );
      
      if (threadsResponse.documents.length > 0) {
        const doc = threadsResponse.documents[0] as AppwriteThread;
        await databases.updateDocument(
          DATABASE_ID,
          THREADS_COLLECTION_ID,
          doc.$id,
          {
            lastMessageAt: messageCreatedAt.toISOString(),
            updatedAt: now.toISOString()
          }
        );
      } else {
        // Thread doesn't exist, this is expected during sync operations
        // Don't create a new thread here as HybridDB handles thread creation
        console.warn('Thread not found during timestamp update, skipping:', threadId);
      }
    } catch (error) {
      // Silent fail for thread update - the message creation is more important
      console.warn('Failed to update thread timestamp:', error);
    }
  }

  // Delete messages after a certain timestamp
  static async deleteTrailingMessages(
    threadId: string,
    createdAt: Date,
    gte: boolean = true
  ): Promise<void> {
    try {
      const userId = await this.getCurrentUserId();
      
      // Find messages to delete in Appwrite
      const comparator = gte ? '>=' : '>';
      const messagesResponse = await databases.listDocuments(
        DATABASE_ID,
        MESSAGES_COLLECTION_ID,
        [
          Query.equal('threadId', threadId),
          Query.equal('userId', userId),
          Query.greaterThanEqual('createdAt', createdAt.toISOString())
        ]
      );
      
      const messageIds = messagesResponse.documents.map(doc => (doc as AppwriteMessage).messageId);
      
      // Delete messages from Appwrite
      for (const doc of messagesResponse.documents) {
        await databases.deleteDocument(
          DATABASE_ID,
          MESSAGES_COLLECTION_ID,
          doc.$id
        );
      }
      
      // Delete associated message summaries from Appwrite
      if (messageIds.length > 0) {
        const summariesResponse = await databases.listDocuments(
          DATABASE_ID,
          MESSAGE_SUMMARIES_COLLECTION_ID,
          [
            Query.equal('threadId', threadId),
            Query.equal('userId', userId),
            Query.equal('messageId', messageIds)
          ]
        );
        
        for (const doc of summariesResponse.documents) {
          await databases.deleteDocument(
            DATABASE_ID,
            MESSAGE_SUMMARIES_COLLECTION_ID,
            doc.$id
          );
        }
      }
      
      // No more LocalDB operations - we're using Appwrite exclusively
    } catch (error) {
      console.error('Error deleting messages:', error);
      throw error;
    }
  }

  // -------------- Message Summary Operations --------------

  // Create message summary (optimized with proper thread handling)
  static async createMessageSummary(
    threadId: string,
    messageId: string,
    content: string
  ): Promise<string> {
    try {
      const userId = await this.getCurrentUserId();
      const now = new Date();
      const summaryId = ID.unique();
      
      // Create summary directly - thread existence is handled by message creation
      await databases.createDocument(
        DATABASE_ID,
        MESSAGE_SUMMARIES_COLLECTION_ID,
        summaryId,
        {
          summaryId: summaryId,
          threadId: threadId,
          messageId: messageId,
          userId: userId,
          content: content,
          createdAt: now.toISOString()
        }
      );
      
      return summaryId;
    } catch (error) {
      console.error('Error creating message summary:', error);
      throw error;
    }
  }

  // Get message summaries by thread ID
  static async getMessageSummaries(threadId: string): Promise<any[]> {
    try {
      const userId = await this.getCurrentUserId();
      
      // Get summaries from Appwrite
      const response = await databases.listDocuments(
        DATABASE_ID,
        MESSAGE_SUMMARIES_COLLECTION_ID,
        [
          Query.equal('threadId', threadId),
          Query.equal('userId', userId),
          Query.orderAsc('createdAt')
        ]
      );
      
      // Map to local format
      const summaries = response.documents.map((doc) => {
        const summaryDoc = doc as unknown as AppwriteMessageSummary;
        return {
          id: summaryDoc.summaryId,
          threadId: summaryDoc.threadId,
          messageId: summaryDoc.messageId,
          content: summaryDoc.content,
          createdAt: new Date(summaryDoc.createdAt)
        };
      });
      
      return summaries;
    } catch (error) {
      console.error('Error fetching message summaries from Appwrite:', error);
      return []; // Return empty array instead of using localDb as fallback
    }
  }

  // Get message summaries with roles
  static async getMessageSummariesWithRole(threadId: string): Promise<any[]> {
    try {
      const summaries = await this.getMessageSummaries(threadId);
      const userId = await this.getCurrentUserId();
      
      // Get corresponding messages for each summary
      const messagesResponse = await databases.listDocuments(
        DATABASE_ID,
        MESSAGES_COLLECTION_ID,
        [
          Query.equal('threadId', threadId),
          Query.equal('userId', userId)
        ]
      );
      
      const messagesMap = new Map();
      for (const doc of messagesResponse.documents) {
        const message = doc as AppwriteMessage;
        messagesMap.set(message.messageId, message);
      }
      
      // Enhance summaries with role information
      const summariesWithRole = summaries.map(summary => {
        const message = messagesMap.get(summary.messageId);
        return {
          ...summary,
          role: message ? message.role : 'user'
        };
      });
      
      return summariesWithRole;
    } catch (error) {
      console.error('Error fetching message summaries with role from Appwrite:', error);
      return []; // Return empty array instead of using localDb as fallback
    }
  }

  // Branch a thread (copy thread and all its messages)
  static async branchThread(originalThreadId: string, newThreadId: string, newTitle?: string): Promise<string> {
    try {
      const userId = await this.getCurrentUserId();
      const now = new Date();

      // Get the original thread
      const originalThreadResponse = await databases.listDocuments(
        DATABASE_ID,
        THREADS_COLLECTION_ID,
        [
          Query.equal('threadId', originalThreadId),
          Query.equal('userId', userId)
        ]
      );

      if (originalThreadResponse.documents.length === 0) {
        throw new Error('Original thread not found');
      }

      const originalThread = originalThreadResponse.documents[0] as AppwriteThread;

      // Create the new branched thread
      const branchedThreadData = {
        threadId: newThreadId,
        userId: userId,
        title: newTitle || `${originalThread.title} (Branch)`,
        updatedAt: now.toISOString(),
        lastMessageAt: now.toISOString(),
        isPinned: false, // Branched threads are not pinned by default
        isBranched: true, // Mark as branched
        tags: originalThread.tags || [] // Copy tags from original thread
      };

      await databases.createDocument(
        DATABASE_ID,
        THREADS_COLLECTION_ID,
        ID.unique(),
        branchedThreadData
      );

      // Get all messages from the original thread
      const messagesResponse = await databases.listDocuments(
        DATABASE_ID,
        MESSAGES_COLLECTION_ID,
        [
          Query.equal('threadId', originalThreadId),
          Query.equal('userId', userId),
          Query.orderAsc('createdAt')
        ]
      );

      // Copy all messages to the new thread
      for (const messageDoc of messagesResponse.documents) {
        const originalMessage = messageDoc as AppwriteMessage;
        const newMessageData = {
          messageId: ID.unique(), // Generate new message ID
          threadId: newThreadId,
          userId: userId,
          content: originalMessage.content,
          role: originalMessage.role,
          createdAt: originalMessage.createdAt,
          webSearchResults: originalMessage.webSearchResults || undefined
        };

        await databases.createDocument(
          DATABASE_ID,
          MESSAGES_COLLECTION_ID,
          ID.unique(),
          newMessageData
        );
      }

      return newThreadId;
    } catch (error) {
      console.error('Error branching thread:', error);
      throw error;
    }
  }

  // Clear all data when user logs out
  static async clearLocalDatabase(): Promise<void> {
    try {
      // Nothing to clear - Appwrite is the source of truth
    } catch (error) {
      console.error('Error in clearLocalDatabase:', error);
      throw error;
    }
  }

  // Check connection with Appwrite (no syncing needed as Appwrite is the source of truth)
  static async syncWithAppwrite(): Promise<void> {
    try {
      const userId = await this.getCurrentUserId();
      
      // Check connection by getting threads from Appwrite
      const appwriteResponse = await databases.listDocuments(
        DATABASE_ID,
        THREADS_COLLECTION_ID,
        [Query.equal('userId', userId)]
      );
      
      // No need to sync with local DB since Appwrite is the source of truth
    } catch (error) {
      console.error('Error connecting to Appwrite:', error);
      throw error;
    }
  }

  // Test connection to Appwrite
  static async testConnection(): Promise<boolean> {
    try {
      // Test basic connectivity
      const user = await account.get();
      
      // Test database access
      const response = await databases.listDocuments(
        DATABASE_ID,
        THREADS_COLLECTION_ID,
        [Query.limit(1)]
      );
      
      return true;
    } catch (error) {
      console.error('Appwrite connection test failed:', error);
      return false;
    }
  }

  // Helper function to check if thread exists
  static async threadExists(threadId: string): Promise<boolean> {
    try {
      const userId = await this.getCurrentUserId();
      const response = await databases.listDocuments(
        DATABASE_ID,
        THREADS_COLLECTION_ID,
        [
          Query.equal('threadId', threadId),
          Query.equal('userId', userId)
        ]
      );
      return response.documents.length > 0;
    } catch (error) {
      return false;
    }
  }
}
