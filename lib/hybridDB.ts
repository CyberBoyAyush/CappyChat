/**
 * Hybrid Database Service
 * 
 * Combines fast local storage with Appwrite backend synchronization.
 * Provides instant UI updates while maintaining data consistency.
 */

import { AppwriteDB, Thread, DBMessage, MessageSummary } from './appwriteDB';
import { LocalDB } from './localDB';
import { AppwriteRealtime } from './appwriteRealtime';

// Event emitter for UI updates
type EventCallback = (...args: any[]) => void;
class EventEmitter {
  private events: Map<string, EventCallback[]> = new Map();

  on(event: string, callback: EventCallback): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
  }

  off(event: string, callback: EventCallback): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event: string, ...args: any[]): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(...args));
    }
  }
}

export const dbEvents = new EventEmitter();

export class HybridDB {
  private static isOnline = true;
  private static syncQueue: Array<() => Promise<void>> = [];
  private static isSyncing = false;
  private static initialized = false;
  private static initializationPromise: Promise<void> | null = null;
  private static pendingMessageSyncs = new Set<string>(); // Track ongoing message syncs

  // Initialize the hybrid database
  static async initialize(userId: string): Promise<void> {
    if (this.initialized) return;
    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = this.doInitialize(userId);
    return this.initializationPromise;
  }

  private static async doInitialize(userId: string): Promise<void> {
    LocalDB.setUserId(userId);
    
    // Set up realtime callbacks
    AppwriteRealtime.setCallbacks({
      onThreadCreated: this.handleRemoteThreadCreated.bind(this),
      onThreadUpdated: this.handleRemoteThreadUpdated.bind(this),
      onThreadDeleted: this.handleRemoteThreadDeleted.bind(this),
      onMessageCreated: this.handleRemoteMessageCreated.bind(this),
      onMessageSummaryCreated: this.handleRemoteMessageSummaryCreated.bind(this),
    });

    // Subscribe to realtime updates immediately for better UX
    AppwriteRealtime.subscribeToAll(userId);

    // Non-blocking background sync - instant UI, sync in background
    this.performInitialSyncInBackground();
    this.initialized = true;
  }

  // Perform initial sync from Appwrite - now async in background
  private static performInitialSyncInBackground(): void {
    // Use setTimeout to ensure this runs after the current call stack
    setTimeout(async () => {
      try {
        // Load local data first for instant UI
        const localThreads = LocalDB.getThreads();
        if (localThreads.length > 0) {
          dbEvents.emit('threads_updated', localThreads);
        }

        // Sync threads from remote
        const threads = await AppwriteDB.getThreads();
        LocalDB.replaceAllThreads(threads);
        dbEvents.emit('threads_updated', threads);

        // For messages, only sync when actually needed (lazy loading)
        // This prevents the massive network requests on startup
        this.isOnline = true;
      } catch (error) {
        console.error('Background sync failed:', error);
        this.isOnline = false;
        
        // Use local data if remote fails
        const localThreads = LocalDB.getThreads();
        if (localThreads.length > 0) {
          dbEvents.emit('threads_updated', localThreads);
        }
      }
    }, 0);
  }

  // ============ THREAD OPERATIONS ============

  // Get threads (instant from local storage)
  static getThreads(): Thread[] {
    return LocalDB.getThreads();
  }

  // Create thread (instant local + async remote)
  static async createThread(threadId: string): Promise<string> {
    const now = new Date();
    const thread: Thread = {
      id: threadId,
      title: 'New Chat',
      createdAt: now,
      updatedAt: now,
      lastMessageAt: now
    };

    // Instant local update
    LocalDB.upsertThread(thread);
    dbEvents.emit('threads_updated', LocalDB.getThreads());

    // Async remote update
    this.queueSync(async () => {
      try {
        await AppwriteDB.createThread(threadId);
      } catch (error) {
        console.error('Failed to sync thread creation:', error);
        // On failure, we keep the local version as it will sync later
      }
    });

    return threadId;
  }

  // Update thread (instant local + async remote)
  static async updateThread(threadId: string, title: string): Promise<void> {
    const now = new Date();
    
    // Instant local update
    LocalDB.updateThread(threadId, { title, updatedAt: now });
    dbEvents.emit('threads_updated', LocalDB.getThreads());

    // Async remote update
    this.queueSync(async () => {
      try {
        await AppwriteDB.updateThread(threadId, title);
      } catch (error) {
        console.error('Failed to sync thread update:', error);
      }
    });
  }

  // Delete thread (instant local + async remote)
  static async deleteThread(threadId: string): Promise<void> {
    // Instant local update
    LocalDB.deleteThread(threadId);
    dbEvents.emit('threads_updated', LocalDB.getThreads());

    // Async remote update
    this.queueSync(async () => {
      try {
        await AppwriteDB.deleteThread(threadId);
      } catch (error) {
        console.error('Failed to sync thread deletion:', error);
      }
    });
  }

  // ============ MESSAGE OPERATIONS ============

  // Get messages for thread (instant from local storage)
  static getMessagesByThreadId(threadId: string): DBMessage[] {
    return LocalDB.getMessagesByThread(threadId);
  }

  // Create message (instant local + async remote)
  static async createMessage(threadId: string, message: any): Promise<void> {
    const dbMessage: DBMessage = {
      id: message.id,
      threadId,
      content: message.content,
      role: message.role,
      parts: message.parts || [],
      createdAt: message.createdAt || new Date()
    };

    // Instant local update
    LocalDB.addMessage(dbMessage);
    dbEvents.emit('messages_updated', threadId, LocalDB.getMessagesByThread(threadId));
    dbEvents.emit('threads_updated', LocalDB.getThreads()); // Thread order might change

    // Async remote update
    this.queueSync(async () => {
      try {
        await AppwriteDB.createMessage(threadId, message);
      } catch (error) {
        console.error('Failed to sync message creation:', error);
      }
    });
  }

  // Load messages from remote and sync to local (optimized for performance)
  static async loadMessagesFromRemote(threadId: string): Promise<DBMessage[]> {
    // First check local cache for instant loading
    const localMessages = LocalDB.getMessagesByThread(threadId);
    
    // If we have local messages, return them immediately for better UX
    if (localMessages.length > 0) {
      // Sync in background for next time, but don't block current request
      this.syncMessagesInBackground(threadId);
      return localMessages;
    }

    // If no local messages, fetch from remote
    try {
      const remoteMessages = await AppwriteDB.getMessagesByThreadId(threadId);
      
      // Clear local messages for this thread and replace with remote
      LocalDB.clearMessagesByThread(threadId);
      
      // Add all remote messages to local storage
      remoteMessages.forEach(message => {
        LocalDB.addMessage(message);
      });
      
      // Emit update event
      dbEvents.emit('messages_updated', threadId, remoteMessages);
      
      return remoteMessages;
    } catch (error) {
      console.error('Failed to load messages from remote:', error);
      // Return local messages as fallback (might be empty)
      return localMessages;
    }
  }

  // Background sync for messages - non-blocking with deduplication
  private static syncMessagesInBackground(threadId: string): void {
    // Prevent duplicate syncs for the same thread
    if (this.pendingMessageSyncs.has(threadId)) {
      return;
    }

    this.pendingMessageSyncs.add(threadId);
    
    setTimeout(async () => {
      try {
        const remoteMessages = await AppwriteDB.getMessagesByThreadId(threadId);
        const localMessages = LocalDB.getMessagesByThread(threadId);
        
        // Only update if there's a difference to avoid unnecessary events
        if (remoteMessages.length !== localMessages.length) {
          LocalDB.clearMessagesByThread(threadId);
          remoteMessages.forEach(message => {
            LocalDB.addMessage(message);
          });
          dbEvents.emit('messages_updated', threadId, remoteMessages);
        }
      } catch (error) {
        console.warn('Background message sync failed:', error);
      } finally {
        this.pendingMessageSyncs.delete(threadId);
      }
    }, 100); // Small delay to not interfere with UI
  }

  // ============ MESSAGE SUMMARY OPERATIONS ============

  // Get message summaries with role (instant from local storage)
  static async getMessageSummariesWithRole(threadId: string): Promise<any[]> {
    const summaries = LocalDB.getSummariesByThread(threadId);
    const messages = LocalDB.getMessagesByThread(threadId);
    
    const messagesMap = new Map();
    messages.forEach(message => {
      messagesMap.set(message.id, message);
    });
    
    return summaries.map(summary => {
      const message = messagesMap.get(summary.messageId);
      return {
        ...summary,
        role: message ? message.role : 'user'
      };
    });
  }

  // Create message summary (instant local + async remote)
  static async createMessageSummary(
    threadId: string,
    messageId: string,
    content: string
  ): Promise<string> {
    const now = new Date();
    const summaryId = `summary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const summary: MessageSummary = {
      id: summaryId,
      threadId,
      messageId,
      content,
      createdAt: now
    };

    // Instant local update
    LocalDB.addSummary(summary);
    dbEvents.emit('summaries_updated', threadId);

    // Async remote update
    this.queueSync(async () => {
      try {
        await AppwriteDB.createMessageSummary(threadId, messageId, content);
      } catch (error) {
        console.error('Failed to sync summary creation:', error);
      }
    });

    return summaryId;
  }

  // Delete trailing messages (instant local + async remote)
  static async deleteTrailingMessages(
    threadId: string,
    createdAt: Date,
    gte: boolean = true
  ): Promise<void> {
    // Instant local update for immediate UI feedback
    const localMessages = LocalDB.getMessagesByThread(threadId);
    const filteredMessages = localMessages.filter(message => {
      const messageDate = new Date(message.createdAt);
      return gte ? messageDate < createdAt : messageDate <= createdAt;
    });
    
    // Update local storage immediately
    LocalDB.clearMessagesByThread(threadId);
    filteredMessages.forEach(message => {
      LocalDB.addMessage(message);
    });
    
    // Emit immediate update
    dbEvents.emit('messages_updated', threadId, filteredMessages);

    // Async remote update
    this.queueSync(async () => {
      try {
        await AppwriteDB.deleteTrailingMessages(threadId, createdAt, gte);
      } catch (error) {
        console.error('Failed to sync trailing message deletion:', error);
      }
    });
  }

  // ============ REALTIME HANDLERS ============

  private static handleRemoteThreadCreated(appwriteThread: any): void {
    // Check if thread already exists locally to avoid duplicates
    const existingThreads = LocalDB.getThreads();
    const existsLocally = existingThreads.some(t => t.id === appwriteThread.threadId);
    
    if (existsLocally) {
      // Thread already exists locally, this is likely from our own sync operation
      return;
    }

    const thread: Thread = {
      id: appwriteThread.threadId,
      title: appwriteThread.title,
      createdAt: new Date(appwriteThread.$createdAt),
      updatedAt: new Date(appwriteThread.updatedAt),
      lastMessageAt: new Date(appwriteThread.lastMessageAt)
    };

    LocalDB.upsertThread(thread);
    dbEvents.emit('threads_updated', LocalDB.getThreads());
  }

  private static handleRemoteThreadUpdated(appwriteThread: any): void {
    const thread: Thread = {
      id: appwriteThread.threadId,
      title: appwriteThread.title,
      createdAt: new Date(appwriteThread.$createdAt),
      updatedAt: new Date(appwriteThread.updatedAt),
      lastMessageAt: new Date(appwriteThread.lastMessageAt)
    };

    LocalDB.upsertThread(thread);
    dbEvents.emit('threads_updated', LocalDB.getThreads());
  }

  private static handleRemoteThreadDeleted(appwriteThread: any): void {
    LocalDB.deleteThread(appwriteThread.threadId);
    dbEvents.emit('threads_updated', LocalDB.getThreads());
  }

  private static handleRemoteMessageCreated(appwriteMessage: any): void {
    // Check if message already exists locally to avoid duplicates
    const existingMessages = LocalDB.getMessagesByThread(appwriteMessage.threadId);
    const existsLocally = existingMessages.some(m => m.id === appwriteMessage.messageId);
    
    if (existsLocally) {
      // Message already exists locally, this is likely from our own sync operation
      return;
    }

    const message: DBMessage = {
      id: appwriteMessage.messageId,
      threadId: appwriteMessage.threadId,
      content: appwriteMessage.content,
      role: appwriteMessage.role,
      parts: appwriteMessage.content ? [{ type: "text", text: appwriteMessage.content }] : [],
      createdAt: new Date(appwriteMessage.createdAt)
    };

    LocalDB.addMessage(message);
    dbEvents.emit('messages_updated', message.threadId, LocalDB.getMessagesByThread(message.threadId));
    dbEvents.emit('threads_updated', LocalDB.getThreads());
  }

  private static handleRemoteMessageSummaryCreated(appwriteSummary: any): void {
    // Check if summary already exists locally to avoid duplicates
    const existingSummaries = LocalDB.getSummariesByThread(appwriteSummary.threadId);
    const existsLocally = existingSummaries.some(s => s.id === appwriteSummary.summaryId);
    
    if (existsLocally) {
      // Summary already exists locally, this is likely from our own sync operation
      return;
    }

    const summary: MessageSummary = {
      id: appwriteSummary.summaryId,
      threadId: appwriteSummary.threadId,
      messageId: appwriteSummary.messageId,
      content: appwriteSummary.content,
      createdAt: new Date(appwriteSummary.createdAt)
    };

    LocalDB.addSummary(summary);
    dbEvents.emit('summaries_updated', summary.threadId);
  }

  // ============ SYNC MANAGEMENT ============

  private static queueSync(syncOperation: () => Promise<void>): void {
    this.syncQueue.push(syncOperation);
    this.processSyncQueue();
  }

  private static async processSyncQueue(): Promise<void> {
    if (this.isSyncing || this.syncQueue.length === 0) {
      return;
    }

    this.isSyncing = true;

    // Process operations in batches to reduce network congestion
    const batchSize = 3;
    while (this.syncQueue.length > 0) {
      const batch = this.syncQueue.splice(0, batchSize);
      
      try {
        // Process batch operations in parallel for better performance
        await Promise.all(batch.map(operation => operation()));
        this.isOnline = true;
      } catch (error) {
        console.error('Batch sync operation failed:', error);
        this.isOnline = false;
        // Re-queue failed operations for later retry
        this.syncQueue.unshift(...batch);
        break;
      }

      // Small delay between batches to prevent overwhelming the server
      if (this.syncQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    this.isSyncing = false;

    // If there are still operations in the queue and we're offline, retry later
    if (this.syncQueue.length > 0 && !this.isOnline) {
      setTimeout(() => this.processSyncQueue(), 5000); // Retry in 5 seconds
    }
  }

  // Clear all local data
  static clearLocalData(): void {
    LocalDB.clear();
    // Reset initialization state so it can be re-initialized
    this.initialized = false;
    this.initializationPromise = null;
    this.pendingMessageSyncs.clear(); // Clear pending syncs
  }

  // Get online status
  static isOnlineStatus(): boolean {
    return this.isOnline;
  }

  // Force sync messages for a specific thread (throttled to prevent abuse)
  static async forceSyncThread(threadId: string): Promise<void> {
    // Prevent excessive force syncs
    if (this.pendingMessageSyncs.has(`force_${threadId}`)) {
      return;
    }

    this.pendingMessageSyncs.add(`force_${threadId}`);

    try {
      const remoteMessages = await AppwriteDB.getMessagesByThreadId(threadId);
      
      // Clear local messages for this thread and replace with remote
      LocalDB.clearMessagesByThread(threadId);
      
      // Add all remote messages to local storage
      remoteMessages.forEach(message => {
        LocalDB.addMessage(message);
      });
      
      // Emit update event for immediate UI refresh
      dbEvents.emit('messages_updated', threadId, remoteMessages);
    } catch (error) {
      console.error('Failed to force sync thread:', error);
    } finally {
      this.pendingMessageSyncs.delete(`force_${threadId}`);
    }
  }
}
