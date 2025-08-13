/**
 * Appwrite Database Service
 * 
 * Provides a centralized database service using Appwrite entirely.
 * All data is stored directly in Appwrite for better synchronization.
 */

import { Databases, ID, Models, Query } from 'appwrite';
import { client } from './appwrite';
import { getCachedAccount } from './accountCache';
import { devLog, devWarn, devInfo, devError, prodError } from './logger';

// Database and Collection IDs
export const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';
export const THREADS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_THREADS_COLLECTION_ID || 'threads';
export const MESSAGES_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID || 'messages';
export const MESSAGE_SUMMARIES_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_MESSAGE_SUMMARIES_COLLECTION_ID || 'message_summaries';
export const PROJECTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECTS_COLLECTION_ID || 'projects';
export const GLOBAL_MEMORY_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_GLOBAL_MEMORY_COLLECTION_ID || 'global_memory';

// Initialize Appwrite databases service
const databases = new Databases(client);

// Interface for Appwrite Project document
export interface AppwriteProject extends Models.Document {
  projectId: string;
  userId: string;
  name: string;
  description?: string;
  prompt?: string;
  colorIndex?: number;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

// Define Project interface for internal use
export interface Project {
  id: string;
  name: string;
  description?: string;
  prompt?: string;
  colorIndex?: number;
  createdAt: Date;
  updatedAt: Date;
}

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
  projectId?: string; // Optional project ID for thread organization
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
  projectId?: string; // Optional project ID for thread organization
}

// Interface for file attachments
export interface FileAttachment {
  id: string;
  filename: string;
  originalName: string;
  fileType: 'image' | 'pdf' | 'text' | 'document';
  mimeType: string;
  size: number;
  url: string;
  publicId: string; // Cloudinary public ID
  createdAt: Date;
  textContent?: string; // For text and document files, store extracted content
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
  attachments?: string | FileAttachment[]; // File attachments (stored as JSON string in Appwrite)
  model?: string; // AI model used to generate the message (for assistant messages)
  imgurl?: string; // URL of generated image (for image generation messages)
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
  attachments?: FileAttachment[]; // File attachments
  model?: string; // AI model used to generate the message (for assistant messages)
  imgurl?: string; // URL of generated image (for image generation messages)
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

// Interface for Appwrite Global Memory document
export interface AppwriteGlobalMemory extends Models.Document {
  userId: string;
  memories: string[];
  enabled: boolean;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

// Define GlobalMemory interface for internal use
export interface GlobalMemory {
  id: string;
  userId: string;
  memories: string[];
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Appwrite database service
export class AppwriteDB {
  static async getCurrentUserId(): Promise<string> {
    try {
      const user = await getCachedAccount();
      if (!user || !user.$id) {
        throw new Error('No authenticated user found');
      }
      return user.$id;
    } catch {
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
          isBranched: threadDoc.isBranched || false, // Default to false for existing threads
          projectId: threadDoc.projectId // Optional project ID
        };
      });
      
      return threads;
    } catch (error) {
      devError('Error fetching threads from Appwrite:', error);
      return [];
    }
  }

  // Get threads with pagination for current user
  static async getThreadsPaginated(limit: number = 25, offset: number = 0): Promise<{
    threads: Thread[];
    hasMore: boolean;
    total: number;
  }> {
    try {
      const userId = await this.getCurrentUserId();
      
      // Get threads from Appwrite with pagination
      const response = await databases.listDocuments(
        DATABASE_ID,
        THREADS_COLLECTION_ID,
        [
          Query.equal('userId', userId),
          Query.orderDesc('lastMessageAt'),
          Query.limit(limit),
          Query.offset(offset)
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
          isBranched: threadDoc.isBranched || false, // Default to false for existing threads
          projectId: threadDoc.projectId // Optional project ID
        };
      });
      
      return {
        threads,
        hasMore: response.total > offset + limit,
        total: response.total
      };
    } catch (error) {
      devError('Error fetching paginated threads from Appwrite:', error);
      return {
        threads: [],
        hasMore: false,
        total: 0
      };
    }
  }

  // Get priority threads (pinned and project threads) - these load instantly
  static async getPriorityThreads(): Promise<Thread[]> {
    try {
      const userId = await this.getCurrentUserId();
      
      // Optimized approach: Get pinned threads and project threads separately then combine
      // This is faster than filtering all threads
      const [pinnedResponse, projectResponse] = await Promise.all([
        // Get pinned threads
        databases.listDocuments(
          DATABASE_ID,
          THREADS_COLLECTION_ID,
          [
            Query.equal('userId', userId),
            Query.equal('isPinned', true),
            Query.orderDesc('lastMessageAt'),
            Query.limit(100) // Reasonable limit for pinned threads
          ]
        ),
        // Get project threads (we'll need to filter these since isNotNull might not work)
        databases.listDocuments(
          DATABASE_ID,
          THREADS_COLLECTION_ID,
          [
            Query.equal('userId', userId),
            Query.orderDesc('lastMessageAt'),
            Query.limit(200) // Get more to filter for project threads
          ]
        )
      ]);
      
      // Map pinned threads
      const pinnedThreads = pinnedResponse.documents.map((doc: any) => {
        const threadDoc = doc as unknown as AppwriteThread;
        return {
          id: threadDoc.threadId,
          title: threadDoc.title,
          createdAt: new Date(doc.$createdAt),
          updatedAt: new Date(threadDoc.updatedAt),
          lastMessageAt: new Date(threadDoc.lastMessageAt),
          isPinned: threadDoc.isPinned || false,
          tags: threadDoc.tags || [],
          isBranched: threadDoc.isBranched || false,
          projectId: threadDoc.projectId
        };
      });

      // Map and filter project threads (exclude already pinned threads)
      const projectThreads = projectResponse.documents
        .map((doc: any) => {
          const threadDoc = doc as unknown as AppwriteThread;
          return {
            id: threadDoc.threadId,
            title: threadDoc.title,
            createdAt: new Date(doc.$createdAt),
            updatedAt: new Date(threadDoc.updatedAt),
            lastMessageAt: new Date(threadDoc.lastMessageAt),
            isPinned: threadDoc.isPinned || false,
            tags: threadDoc.tags || [],
            isBranched: threadDoc.isBranched || false,
            projectId: threadDoc.projectId
          };
        })
        .filter((thread: any) => 
          // Only include threads with projectId that are not already pinned
          thread.projectId && 
          thread.projectId !== '' && 
          !thread.isPinned
        );

      // Combine pinned and project threads, removing duplicates
      const allPriorityThreads = [...pinnedThreads, ...projectThreads];
      const uniquePriorityThreads = allPriorityThreads.filter(
        (thread: any, index: number, arr: any[]) => 
          arr.findIndex((t: any) => t.id === thread.id) === index
      );
      
      return uniquePriorityThreads;
    } catch (error) {
      devError('Error fetching priority threads from Appwrite:', error);
      return [];
    }
  }

  // Get regular threads (not pinned, not in projects) with pagination
  static async getRegularThreadsPaginated(limit: number = 25, offset: number = 0): Promise<{
    threads: Thread[];
    hasMore: boolean;
    total: number;
  }> {
    try {
      const userId = await this.getCurrentUserId();
      
      // Get regular threads (not pinned and no projectId) - optimized for performance
      // We fetch unpinned threads and filter out project threads for better performance
      const response = await databases.listDocuments(
        DATABASE_ID,
        THREADS_COLLECTION_ID,
        [
          Query.equal('userId', userId),
          Query.equal('isPinned', false), // Only get unpinned threads
          Query.orderDesc('lastMessageAt'),
          Query.limit(limit * 3), // Get more to account for filtering out project threads
          Query.offset(offset)
        ]
      );
      
      // Map Appwrite threads to Thread format and filter out threads with projectId
      const allThreads = response.documents.map((doc) => {
        const threadDoc = doc as unknown as AppwriteThread;
        return {
          id: threadDoc.threadId,
          title: threadDoc.title,
          createdAt: new Date(doc.$createdAt),
          updatedAt: new Date(threadDoc.updatedAt),
          lastMessageAt: new Date(threadDoc.lastMessageAt),
          isPinned: threadDoc.isPinned || false,
          tags: threadDoc.tags || [],
          isBranched: threadDoc.isBranched || false,
          projectId: threadDoc.projectId
        };
      });

      // Filter out threads that have a projectId
      const regularThreads = allThreads
        .filter(thread => !thread.projectId || thread.projectId === '')
        .slice(0, limit); // Only return the requested limit
      
      return {
        threads: regularThreads,
        hasMore: response.total > offset + limit, // Approximate hasMore
        total: response.total
      };
    } catch (error) {
      devError('Error fetching regular threads from Appwrite:', error);
      return {
        threads: [],
        hasMore: false,
        total: 0
      };
    }
  }

  // Create a new thread (with duplicate check) - optimized for speed
  static async createThread(threadId: string, projectId?: string): Promise<string> {
    try {
      const userId = await this.getCurrentUserId();
      const now = new Date();

      const threadData: any = {
        threadId: threadId,
        userId: userId,
        title: 'New Chat',
        updatedAt: now.toISOString(),
        lastMessageAt: now.toISOString(),
        isPinned: false, // New threads are not pinned by default
        isBranched: false // New threads are not branched by default
      };

      // Add projectId if provided
      if (projectId) {
        threadData.projectId = projectId;
      }
      
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
      devError('Error creating thread:', error);
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
        const doc = response.documents[0] as unknown as AppwriteThread;

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
      devError('Error updating thread:', error);
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
        const doc = response.documents[0] as unknown as AppwriteThread;

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
      devError('Error updating thread pin status:', error);
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
        const doc = response.documents[0] as unknown as AppwriteThread;

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
      devError('Error updating thread tags:', error);
      throw error;
    }
  }

  // Update thread project
  static async updateThreadProject(threadId: string, projectId?: string): Promise<void> {
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
        const doc = response.documents[0] as unknown as AppwriteThread;

        // Update project in Appwrite
        const updateData: any = {
          updatedAt: now.toISOString(),
          // We maintain lastMessageAt unchanged as this is just a project update
        };

        if (projectId) {
          updateData.projectId = projectId;
        } else {
          // Remove project association by setting to null
          updateData.projectId = null;
        }

        await databases.updateDocument(
          DATABASE_ID,
          THREADS_COLLECTION_ID,
          doc.$id,
          updateData
        );
      } else {
        throw new Error(`Thread with ID ${threadId} not found`);
      }
    } catch (error) {
      devError('Error updating thread project:', error);
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
        devWarn(`Thread ${threadId} not found, may already be deleted`);
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
      const threadDoc = threadsResponse.documents[0] as unknown as AppwriteThread;
      await databases.deleteDocument(
        DATABASE_ID,
        THREADS_COLLECTION_ID,
        threadDoc.$id
      );
    } catch (error) {
      devError('Error deleting thread:', error);
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
        await this.deleteThread((threadDoc as unknown as AppwriteThread).threadId);
      }
      
      // No need to clear local DB as we're using Appwrite exclusively now
    } catch (error) {
      devError('Error deleting all threads:', error);
      throw error;
    }
  }

  // -------------- Project Operations --------------

  // Get all projects for current user
  static async getProjects(): Promise<Project[]> {
    try {
      const userId = await this.getCurrentUserId();

      // Get projects from Appwrite
      const response = await databases.listDocuments(
        DATABASE_ID,
        PROJECTS_COLLECTION_ID,
        [
          Query.equal('userId', userId),
          Query.orderDesc('updatedAt')
        ]
      );

      // Map Appwrite projects to Project format
      const projects = response.documents.map((doc) => {
        const projectDoc = doc as unknown as AppwriteProject;
        return {
          id: projectDoc.projectId,
          name: projectDoc.name,
          description: projectDoc.description,
          prompt: projectDoc.prompt,
          colorIndex: projectDoc.colorIndex,
          createdAt: new Date(doc.$createdAt),
          updatedAt: new Date(projectDoc.updatedAt)
        };
      });

      return projects;
    } catch (error) {
      devError('Error fetching projects from Appwrite:', error);
      return [];
    }
  }

  // Create a new project
  static async createProject(projectId: string, name: string, description?: string, prompt?: string): Promise<string> {
    try {
      const userId = await this.getCurrentUserId();
      const now = new Date();

      const projectData = {
        projectId: projectId,
        userId: userId,
        name: name,
        description: description || '',
        prompt: prompt || '',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      };

      await databases.createDocument(
        DATABASE_ID,
        PROJECTS_COLLECTION_ID,
        ID.unique(),
        projectData
      );

      return projectId;
    } catch (error) {
      devError('Error creating project:', error);
      throw error;
    }
  }

  // Update project
  static async updateProject(projectId: string, name: string, description?: string, prompt?: string): Promise<void> {
    try {
      const userId = await this.getCurrentUserId();
      const now = new Date();

      // Find the Appwrite document ID by projectId
      const response = await databases.listDocuments(
        DATABASE_ID,
        PROJECTS_COLLECTION_ID,
        [
          Query.equal('projectId', projectId),
          Query.equal('userId', userId)
        ]
      );

      if (response.documents.length > 0) {
        const doc = response.documents[0] as unknown as AppwriteProject;

        // Update project in Appwrite
        await databases.updateDocument(
          DATABASE_ID,
          PROJECTS_COLLECTION_ID,
          doc.$id,
          {
            name: name,
            description: description || '',
            prompt: prompt || '',
            updatedAt: now.toISOString()
          }
        );
      } else {
        throw new Error(`Project with ID ${projectId} not found`);
      }
    } catch (error) {
      devError('Error updating project:', error);
      throw error;
    }
  }

  // Update project color
  static async updateProjectColor(projectId: string, colorIndex: number): Promise<void> {
    try {
      const userId = await this.getCurrentUserId();
      const now = new Date();

      // Find the Appwrite document ID by projectId
      const response = await databases.listDocuments(
        DATABASE_ID,
        PROJECTS_COLLECTION_ID,
        [
          Query.equal('projectId', projectId),
          Query.equal('userId', userId)
        ]
      );

      if (response.documents.length > 0) {
        const doc = response.documents[0] as unknown as AppwriteProject;

        // Update project color in Appwrite
        await databases.updateDocument(
          DATABASE_ID,
          PROJECTS_COLLECTION_ID,
          doc.$id,
          {
            colorIndex: colorIndex,
            updatedAt: now.toISOString()
          }
        );
      } else {
        throw new Error(`Project with ID ${projectId} not found`);
      }
    } catch (error) {
      devError('Error updating project color:', error);
      throw error;
    }
  }

  // Delete project and optionally reassign threads
  static async deleteProject(projectId: string, reassignThreadsToProjectId?: string): Promise<void> {
    try {
      const userId = await this.getCurrentUserId();

      // Find the project document
      const projectsResponse = await databases.listDocuments(
        DATABASE_ID,
        PROJECTS_COLLECTION_ID,
        [
          Query.equal('projectId', projectId),
          Query.equal('userId', userId)
        ]
      );

      if (projectsResponse.documents.length === 0) {
        devWarn(`Project ${projectId} not found, may already be deleted`);
        return;
      }

      // Handle threads in this project
      const threadsResponse = await databases.listDocuments(
        DATABASE_ID,
        THREADS_COLLECTION_ID,
        [
          Query.equal('projectId', projectId),
          Query.equal('userId', userId)
        ]
      );

      // Update threads - either reassign to another project or remove project association
      for (const threadDoc of threadsResponse.documents) {
        const updateData: any = {
          updatedAt: new Date().toISOString()
        };

        if (reassignThreadsToProjectId) {
          updateData.projectId = reassignThreadsToProjectId;
        } else {
          // Remove project association by setting to null/undefined
          updateData.projectId = null;
        }

        await databases.updateDocument(
          DATABASE_ID,
          THREADS_COLLECTION_ID,
          threadDoc.$id,
          updateData
        );
      }

      // Delete the project itself
      const projectDoc = projectsResponse.documents[0] as unknown as AppwriteProject;
      await databases.deleteDocument(
        DATABASE_ID,
        PROJECTS_COLLECTION_ID,
        projectDoc.$id
      );
    } catch (error) {
      devError('Error deleting project:', error);
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

        // Parse attachments from JSON string if present
        let attachments: FileAttachment[] | undefined = undefined;
        if (messageDoc.attachments) {
          devLog('🔍 Raw attachments from Appwrite:', messageDoc.attachments, 'Type:', typeof messageDoc.attachments);
          try {
            // If it's already an object, use it directly (backward compatibility)
            if (typeof messageDoc.attachments === 'object') {
              attachments = messageDoc.attachments as FileAttachment[];
              devLog('✅ Using attachments as object:', attachments);
            } else {
              // If it's a string, parse it
              attachments = JSON.parse(messageDoc.attachments as string);
              devLog('✅ Parsed attachments from JSON string:', attachments);
            }

            // Ensure createdAt is a Date object for each attachment
            if (attachments && Array.isArray(attachments)) {
              attachments = attachments.map(att => ({
                ...att,
                createdAt: typeof att.createdAt === 'string' ? new Date(att.createdAt) : att.createdAt
              }));
              devLog('✅ Final processed attachments:', attachments);
            }
          } catch (error) {
            devError('❌ Error parsing attachments:', error);
            attachments = undefined;
          }
        }

        // Create parts array - include text part if content exists, or image part if imgurl exists
        const parts: any[] = [];
        if (messageDoc.content) {
          parts.push({ type: "text", text: messageDoc.content });
        } else if (messageDoc.imgurl) {
          // For image-only messages, create an appropriate parts structure
          parts.push({ type: "text", text: "" });
        }

        return {
          id: messageDoc.messageId,
          threadId: messageDoc.threadId,
          content: messageDoc.content || "",
          role: messageDoc.role,
          parts: parts,
          createdAt: new Date(messageDoc.createdAt),
          webSearchResults: messageDoc.webSearchResults || undefined,
          attachments: attachments,
          model: messageDoc.model || undefined,
          imgurl: messageDoc.imgurl || undefined
        };
      });
      
      return messages;
    } catch (error) {
      devError('Error fetching messages from Appwrite:', error);
      return []; // Return empty array instead of using localDb as fallback
    }
  }

  // Update an existing message (for image generation updates, etc.)
  static async updateMessage(threadId: string, message: any): Promise<void> {
    try {
      const userId = await this.getCurrentUserId();
      
      // Find the existing message document
      const messagesResponse = await databases.listDocuments(
        DATABASE_ID,
        MESSAGES_COLLECTION_ID,
        [
          Query.equal('messageId', message.id),
          Query.equal('threadId', threadId),
          Query.equal('userId', userId)
        ]
      );

      if (messagesResponse.documents.length === 0) {
        devLog('[AppwriteDB] Message not found for update, creating new one:', message.id);
        // If message doesn't exist, create it
        return this.createMessage(threadId, message);
      }

      const existingDoc = messagesResponse.documents[0];
      devLog('[AppwriteDB] Updating existing message:', message.id);

      // Update message data
      const messageData: any = {
        content: message.content,
        role: message.role,
      };

      // Add webSearchResults if present
      if (message.webSearchResults && message.webSearchResults.length > 0) {
        messageData.webSearchResults = message.webSearchResults;
      }

      // Add attachments if present (serialize to JSON string for Appwrite)
      if (message.attachments && message.attachments.length > 0) {
        devLog('💾 Updating attachments in Appwrite:', message.attachments);
        messageData.attachments = JSON.stringify(message.attachments);
      }

      // Add model if present (for assistant messages)
      if (message.model) {
        messageData.model = message.model;
      }

      // Add imgurl if present (for image generation messages)
      if (message.imgurl) {
        messageData.imgurl = message.imgurl;
      }

      // Update the existing document
      await databases.updateDocument(
        DATABASE_ID,
        MESSAGES_COLLECTION_ID,
        existingDoc.$id,
        messageData
      );

      // Update thread timestamp
      const now = new Date();
      const messageCreatedAt = message.createdAt || now;
      await this.updateThreadLastMessage(threadId, messageCreatedAt, now);
    } catch (error) {
      devError('Error updating message:', error);
      throw error;
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

      // Add attachments if present (serialize to JSON string for Appwrite)
      if (message.attachments && message.attachments.length > 0) {
        devLog('💾 Storing attachments to Appwrite:', message.attachments);
        messageData.attachments = JSON.stringify(message.attachments);
        devLog('💾 Serialized attachments:', messageData.attachments);
      }

      // Add model if present (for assistant messages)
      if (message.model) {
        messageData.model = message.model;
      }

      // Add imgurl if present (for image generation messages)
      if (message.imgurl) {
        messageData.imgurl = message.imgurl;
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
      devError('Error creating message:', error);
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
        const doc = threadsResponse.documents[0] as unknown as AppwriteThread;
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
        devWarn('Thread not found during timestamp update, skipping:', threadId);
      }
    } catch (error) {
      // Silent fail for thread update - the message creation is more important
      devWarn('Failed to update thread timestamp:', error);
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
      const messagesResponse = await databases.listDocuments(
        DATABASE_ID,
        MESSAGES_COLLECTION_ID,
        [
          Query.equal('threadId', threadId),
          Query.equal('userId', userId),
          gte
            ? Query.greaterThanEqual('createdAt', createdAt.toISOString())
            : Query.greaterThan('createdAt', createdAt.toISOString())
        ]
      );
      
      const messageIds = messagesResponse.documents.map(doc => (doc as unknown as AppwriteMessage).messageId);
      
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
      devError('Error deleting messages:', error);
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
      devError('Error creating message summary:', error);
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
      devError('Error fetching message summaries from Appwrite:', error);
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
        const message = doc as unknown as AppwriteMessage;
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
      devError('Error fetching message summaries with role from Appwrite:', error);
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

      const originalThread = originalThreadResponse.documents[0] as unknown as AppwriteThread;

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
        const originalMessage = messageDoc as unknown as AppwriteMessage;
        const newMessageData: any = {
          messageId: ID.unique(), // Generate new message ID
          threadId: newThreadId,
          userId: userId,
          content: originalMessage.content,
          role: originalMessage.role,
          createdAt: originalMessage.createdAt,
          webSearchResults: originalMessage.webSearchResults || undefined
        };

        // Handle attachments properly
        if (originalMessage.attachments) {
          newMessageData.attachments = originalMessage.attachments;
        }

        // Handle model field properly
        if (originalMessage.model) {
          newMessageData.model = originalMessage.model;
        }

        // Handle imgurl field properly
        if (originalMessage.imgurl) {
          newMessageData.imgurl = originalMessage.imgurl;
        }

        await databases.createDocument(
          DATABASE_ID,
          MESSAGES_COLLECTION_ID,
          ID.unique(),
          newMessageData
        );
      }

      return newThreadId;
    } catch (error) {
      devError('Error branching thread:', error);
      throw error;
    }
  }

  // Clear all data when user logs out
  static async clearLocalDatabase(): Promise<void> {
    try {
      // Nothing to clear - Appwrite is the source of truth
    } catch (error) {
      devError('Error in clearLocalDatabase:', error);
      throw error;
    }
  }

  // Check connection with Appwrite (no syncing needed as Appwrite is the source of truth)
  static async syncWithAppwrite(): Promise<void> {
    try {
      const userId = await this.getCurrentUserId();
      
      // Check connection by getting threads from Appwrite
      await databases.listDocuments(
        DATABASE_ID,
        THREADS_COLLECTION_ID,
        [Query.equal('userId', userId)]
      );
      
      // No need to sync with local DB since Appwrite is the source of truth
    } catch (error) {
      devError('Error connecting to Appwrite:', error);
      throw error;
    }
  }

  // Test connection to Appwrite
  static async testConnection(): Promise<boolean> {
    try {
      // Test basic connectivity
      const user = await getCachedAccount();
      if (!user) return false;

      // Test database access
      await databases.listDocuments(
        DATABASE_ID,
        THREADS_COLLECTION_ID,
        [Query.limit(1)]
      );

      return true;
    } catch (err) {
      devError('Appwrite connection test failed:', err);
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
    } catch {
      return false;
    }
  }

  // -------------- Global Memory Operations --------------

  // Get user's global memory settings
  static async getGlobalMemory(userId?: string): Promise<GlobalMemory | null> {
    try {
      const currentUserId = userId || await this.getCurrentUserId();

      const response = await databases.listDocuments(
        DATABASE_ID,
        GLOBAL_MEMORY_COLLECTION_ID,
        [Query.equal('userId', currentUserId)]
      );

      if (response.documents.length === 0) {
        return null;
      }

      const doc = response.documents[0] as unknown as AppwriteGlobalMemory;
      return {
        id: doc.$id,
        userId: doc.userId,
        memories: doc.memories || [],
        enabled: doc.enabled || false,
        createdAt: new Date(doc.createdAt),
        updatedAt: new Date(doc.updatedAt),
      };
    } catch (error) {
      devError('Error getting global memory:', error);
      throw error;
    }
  }

  // Update user's global memory settings
  static async updateGlobalMemory(userId: string, memories: string[], enabled: boolean): Promise<void> {
    try {
      const currentUserId = userId || await this.getCurrentUserId();

      // Check if memory document exists
      const existing = await this.getGlobalMemory(currentUserId);

      const memoryData = {
        userId: currentUserId,
        memories: memories.slice(0, 30), // Ensure max 30 items
        enabled,
        updatedAt: new Date().toISOString(),
      };

      if (existing) {
        // Update existing document
        await databases.updateDocument(
          DATABASE_ID,
          GLOBAL_MEMORY_COLLECTION_ID,
          existing.id,
          memoryData
        );
      } else {
        // Create new document
        await databases.createDocument(
          DATABASE_ID,
          GLOBAL_MEMORY_COLLECTION_ID,
          ID.unique(),
          {
            ...memoryData,
            createdAt: new Date().toISOString(),
          }
        );
      }
    } catch (error) {
      devError('Error updating global memory:', error);
      throw error;
    }
  }

  // Add a new memory (maintains 30 item limit)
  static async addMemory(userId: string, memory: string): Promise<void> {
    try {
      const currentUserId = userId || await this.getCurrentUserId();
      const existing = await this.getGlobalMemory(currentUserId);

      let memories: string[] = [];
      let enabled = false;

      if (existing) {
        memories = [...existing.memories];
        enabled = existing.enabled;
      }

      // Add new memory if it doesn't already exist
      if (!memories.includes(memory)) {
        memories.unshift(memory); // Add to beginning

        // Maintain 30 item limit
        if (memories.length > 30) {
          memories = memories.slice(0, 30);
        }
      }

      await this.updateGlobalMemory(currentUserId, memories, enabled);
    } catch (error) {
      devError('Error adding memory:', error);
      throw error;
    }
  }

  // Delete a specific memory by index
  static async deleteMemory(userId: string, index: number): Promise<void> {
    try {
      const currentUserId = userId || await this.getCurrentUserId();
      const existing = await this.getGlobalMemory(currentUserId);

      if (!existing || index < 0 || index >= existing.memories.length) {
        throw new Error('Invalid memory index');
      }

      const memories = [...existing.memories];
      memories.splice(index, 1);

      await this.updateGlobalMemory(currentUserId, memories, existing.enabled);
    } catch (error) {
      devError('Error deleting memory:', error);
      throw error;
    }
  }

  // Clear all memories
  static async clearAllMemories(userId: string): Promise<void> {
    try {
      const currentUserId = userId || await this.getCurrentUserId();
      const existing = await this.getGlobalMemory(currentUserId);

      if (existing) {
        await this.updateGlobalMemory(currentUserId, [], existing.enabled);
      }
    } catch (error) {
      devError('Error clearing all memories:', error);
      throw error;
    }
  }
}
