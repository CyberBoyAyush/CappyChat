/**
 * Hybrid Database Service
 * 
 * Combines fast local storage with Appwrite backend synchronization.
 * Provides instant UI updates while maintaining data consistency.
 */

import { AppwriteDB, Thread, DBMessage, MessageSummary, AppwriteMessage, FileAttachment, Project } from './appwriteDB';
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

// Debounced event emitter for smooth real-time updates
class DebouncedEventEmitter {
  private static instance: DebouncedEventEmitter;
  private pendingEvents = new Map<string, NodeJS.Timeout>();
  private lastEmittedData = new Map<string, string>();

  static getInstance(): DebouncedEventEmitter {
    if (!this.instance) {
      this.instance = new DebouncedEventEmitter();
    }
    return this.instance;
  }

  emit(eventName: string, ...args: any[]): void {
    const eventKey = `${eventName}_${args[0] || 'global'}`;

    // Clear existing timeout for this event
    if (this.pendingEvents.has(eventKey)) {
      clearTimeout(this.pendingEvents.get(eventKey)!);
    }

    // Quick comparison for messages - use count and last message ID instead of full JSON
    let hasChanged = true;
    if (eventName === 'messages_updated' && args.length >= 2) {
      const threadId = args[0];
      const messages = args[1];
      const quickHash = `${messages.length}_${messages[messages.length - 1]?.id || 'empty'}`;
      const lastHash = this.lastEmittedData.get(eventKey);

      if (quickHash === lastHash) {
        hasChanged = false;
      } else {
        this.lastEmittedData.set(eventKey, quickHash);
      }
    } else {
      // For other events, use JSON comparison but cache it
      const currentData = JSON.stringify(args);
      const lastData = this.lastEmittedData.get(eventKey);

      if (currentData === lastData) {
        hasChanged = false;
      } else {
        this.lastEmittedData.set(eventKey, currentData);
      }
    }

    if (!hasChanged) {
      return; // Skip if data hasn't changed
    }

    // Set new timeout with appropriate delay based on event type
    const delay = this.getDelayForEvent(eventName);
    const timeout = setTimeout(() => {
      dbEvents.emit(eventName, ...args);
      this.pendingEvents.delete(eventKey);
    }, delay);

    this.pendingEvents.set(eventKey, timeout);
  }

  private getDelayForEvent(eventName: string): number {
    switch (eventName) {
      case 'messages_updated':
        return 30; // Very quick updates for messages (smooth streaming)
      case 'threads_updated':
        return 50; // Quick updates for threads
      case 'projects_updated':
        return 20; // Super fast updates for projects (instant sync)
      case 'summaries_updated':
        return 200; // Slower for summaries
      default:
        return 50;
    }
  }

  // Force immediate emission (for critical updates)
  emitImmediate(eventName: string, ...args: any[]): void {
    const eventKey = `${eventName}_${args[0] || 'global'}`;

    // Clear any pending timeout
    if (this.pendingEvents.has(eventKey)) {
      clearTimeout(this.pendingEvents.get(eventKey)!);
      this.pendingEvents.delete(eventKey);
    }

    // Update cache and emit immediately
    if (eventName === 'messages_updated' && args.length >= 2) {
      const messages = args[1];
      const quickHash = `${messages.length}_${messages[messages.length - 1]?.id || 'empty'}`;
      this.lastEmittedData.set(eventKey, quickHash);
    } else {
      this.lastEmittedData.set(eventKey, JSON.stringify(args));
    }

    dbEvents.emit(eventName, ...args);
  }

  // Clear cache for a specific event (useful for force refreshes)
  clearCache(eventName?: string, identifier?: string): void {
    if (eventName && identifier) {
      const eventKey = `${eventName}_${identifier}`;
      this.lastEmittedData.delete(eventKey);
      if (this.pendingEvents.has(eventKey)) {
        clearTimeout(this.pendingEvents.get(eventKey)!);
        this.pendingEvents.delete(eventKey);
      }
    } else if (eventName) {
      // Clear all events of this type
      for (const [key] of this.lastEmittedData) {
        if (key.startsWith(eventName)) {
          this.lastEmittedData.delete(key);
        }
      }
      for (const [key, timeout] of this.pendingEvents) {
        if (key.startsWith(eventName)) {
          clearTimeout(timeout);
          this.pendingEvents.delete(key);
        }
      }
    } else {
      // Clear everything
      this.lastEmittedData.clear();
      for (const timeout of this.pendingEvents.values()) {
        clearTimeout(timeout);
      }
      this.pendingEvents.clear();
    }
  }
}

const debouncedEmitter = DebouncedEventEmitter.getInstance();

// Export the debounced emitter for external use
export { debouncedEmitter };

export class HybridDB {
  private static isOnline = true;
  private static syncQueue: Array<() => Promise<void>> = [];
  private static isSyncing = false;
  private static initialized = false;
  private static initializationPromise: Promise<void> | null = null;
  private static pendingMessageSyncs = new Set<string>(); // Track ongoing message syncs
  private static isGuestMode = false; // Track if we're in guest mode

  // Initialize the hybrid database
  static async initialize(userId: string, isGuest: boolean = false): Promise<void> {
    if (this.initialized) return;
    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = this.doInitialize(userId, isGuest);
    return this.initializationPromise;
  }

  private static async doInitialize(userId: string, isGuest: boolean = false): Promise<void> {
    this.isGuestMode = isGuest;

    // Skip all database operations for guest users
    if (isGuest) {
      this.initialized = true;
      return;
    }

    LocalDB.setUserId(userId);

    // Set up realtime callbacks
    AppwriteRealtime.setCallbacks({
      onThreadCreated: this.handleRemoteThreadCreated.bind(this),
      onThreadUpdated: this.handleRemoteThreadUpdated.bind(this),
      onThreadDeleted: this.handleRemoteThreadDeleted.bind(this),
      onMessageCreated: this.handleRemoteMessageCreated.bind(this),
      onMessageUpdated: this.handleRemoteMessageUpdated.bind(this),
      onMessageDeleted: this.handleRemoteMessageDeleted.bind(this),
      onMessageSummaryCreated: this.handleRemoteMessageSummaryCreated.bind(this),
      onProjectCreated: this.handleRemoteProjectCreated.bind(this),
      onProjectUpdated: this.handleRemoteProjectUpdated.bind(this),
      onProjectDeleted: this.handleRemoteProjectDeleted.bind(this),
    });

    // Subscribe to realtime updates immediately for better UX
    AppwriteRealtime.subscribeToAll(userId);

    // Non-blocking background sync - instant UI, sync in background
    this.performInitialSyncInBackground();
    this.initialized = true;
  }

  // Perform initial sync from Appwrite - now async in background
  private static performInitialSyncInBackground(): void {
    // Skip background sync for guest users
    if (this.isGuestMode) {
      // Just emit local data for guest users
      const localThreads = LocalDB.getThreads();
      const localProjects = LocalDB.getProjects();
      debouncedEmitter.emitImmediate('threads_updated', localThreads);
      debouncedEmitter.emitImmediate('projects_updated', localProjects);
      return;
    }

    // Use setTimeout to ensure this runs after the current call stack
    setTimeout(async () => {
      try {
        // Load local data first for instant UI
        const localThreads = LocalDB.getThreads();
        if (localThreads.length > 0) {
          debouncedEmitter.emitImmediate('threads_updated', localThreads);
        }

        // Sync threads from remote
        const threads = await AppwriteDB.getThreads();
        LocalDB.replaceAllThreads(threads);
        debouncedEmitter.emit('threads_updated', threads);

        // Sync projects from remote
        const projects = await AppwriteDB.getProjects();
        LocalDB.replaceAllProjects(projects);
        debouncedEmitter.emit('projects_updated', projects);

        // For messages, only sync when actually needed (lazy loading)
        // This prevents the massive network requests on startup
        this.isOnline = true;
      } catch (error) {
        console.error('Background sync failed:', error);
        this.isOnline = false;

        // Use local data if remote fails
        const localThreads = LocalDB.getThreads();
        if (localThreads.length > 0) {
          debouncedEmitter.emitImmediate('threads_updated', localThreads);
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
  static async createThread(threadId: string, projectId?: string): Promise<string> {
    const now = new Date();
    const thread: Thread = {
      id: threadId,
      title: 'New Chat',
      createdAt: now,
      updatedAt: now,
      lastMessageAt: now,
      isPinned: false, // New threads are not pinned by default
      tags: [], // New threads have no tags by default
      isBranched: false, // New threads are not branched by default
      projectId: projectId // Optional project ID
    };

    // Instant local update
    LocalDB.upsertThread(thread);
    debouncedEmitter.emitImmediate('threads_updated', LocalDB.getThreads());

    // Skip remote sync for guest users
    if (this.isGuestMode) {
      return threadId;
    }

    // Async remote update
    this.queueSync(async () => {
      try {
        await AppwriteDB.createThread(threadId, projectId);
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

    // Get updated threads and emit event with a small delay to avoid batching issues
    const updatedThreads = LocalDB.getThreads();

    // Use setTimeout to ensure this runs after any pending React updates
    setTimeout(() => {
      debouncedEmitter.emit('threads_updated', updatedThreads);
    }, 0);

    // Skip remote sync for guest users
    if (this.isGuestMode) {
      return;
    }

    // Async remote update
    this.queueSync(async () => {
      try {
        await AppwriteDB.updateThread(threadId, title);
      } catch (error) {
        console.error('Failed to sync thread update:', error);
      }
    });
  }

  // Pin or unpin thread (instant local + async remote)
  static async updateThreadPinStatus(threadId: string, isPinned: boolean): Promise<void> {
    const now = new Date();

    // Instant local update
    LocalDB.updateThread(threadId, { isPinned, updatedAt: now });

    // Get updated threads and emit event
    const updatedThreads = LocalDB.getThreads();

    // Use setTimeout to ensure this runs after any pending React updates
    setTimeout(() => {
      debouncedEmitter.emit('threads_updated', updatedThreads);
    }, 0);

    // Skip remote sync for guest users
    if (this.isGuestMode) {
      return;
    }

    // Async remote update
    this.queueSync(async () => {
      try {
        await AppwriteDB.updateThreadPinStatus(threadId, isPinned);
      } catch (error) {
        console.error('Failed to sync thread pin status update:', error);
      }
    });
  }

  // Update thread tags (instant local + async remote)
  static async updateThreadTags(threadId: string, tags: string[]): Promise<void> {
    const now = new Date();

    // Instant local update
    LocalDB.updateThread(threadId, { tags, updatedAt: now });

    // Get updated threads and emit event
    const updatedThreads = LocalDB.getThreads();

    // Use setTimeout to ensure this runs after any pending React updates
    setTimeout(() => {
      debouncedEmitter.emit('threads_updated', updatedThreads);
    }, 0);

    // Skip remote sync for guest users
    if (this.isGuestMode) {
      return;
    }

    // Async remote update
    this.queueSync(async () => {
      try {
        await AppwriteDB.updateThreadTags(threadId, tags);
      } catch (error) {
        console.error('Failed to sync thread tags update:', error);
      }
    });
  }

  // Update thread project (instant local + async remote)
  static async updateThreadProject(threadId: string, projectId?: string): Promise<void> {
    const now = new Date();

    // Instant local update
    LocalDB.updateThread(threadId, { projectId, updatedAt: now });

    // Get updated threads and emit event immediately for instant sync
    const updatedThreads = LocalDB.getThreads();
    debouncedEmitter.emitImmediate('threads_updated', updatedThreads);

    // Skip remote sync for guest users
    if (this.isGuestMode) {
      return;
    }

    // Async remote update
    this.queueSync(async () => {
      try {
        await AppwriteDB.updateThreadProject(threadId, projectId);
      } catch (error) {
        console.error('Failed to sync thread project update:', error);
      }
    });
  }

  // Delete thread (instant local + async remote)
  static async deleteThread(threadId: string): Promise<void> {
    // Instant local update
    LocalDB.deleteThread(threadId);
    debouncedEmitter.emitImmediate('threads_updated', LocalDB.getThreads());

    // Skip remote sync for guest users
    if (this.isGuestMode) {
      return;
    }

    // Async remote update
    this.queueSync(async () => {
      try {
        await AppwriteDB.deleteThread(threadId);
      } catch (error) {
        console.error('Failed to sync thread deletion:', error);
      }
    });
  }

  // Branch thread (instant local + async remote)
  static async branchThread(originalThreadId: string, newThreadId: string, newTitle?: string): Promise<string> {
    const now = new Date();

    // Get the original thread from local storage
    const originalThread = LocalDB.getThreads().find(t => t.id === originalThreadId);
    if (!originalThread) {
      throw new Error('Original thread not found');
    }

    // Get all messages from the original thread
    const originalMessages = LocalDB.getMessagesByThread(originalThreadId);

    // Create the new branched thread
    const branchedThread: Thread = {
      id: newThreadId,
      title: newTitle || `${originalThread.title} (Branch)`,
      createdAt: now,
      updatedAt: now,
      lastMessageAt: originalMessages.length > 0 ? originalMessages[originalMessages.length - 1].createdAt : now,
      isPinned: false, // Branched threads are not pinned by default
      tags: [...(originalThread.tags || [])], // Copy tags from original thread
      isBranched: true // Mark as branched
    };

    // Instant local update - add the new thread
    LocalDB.upsertThread(branchedThread);

    // Copy all messages to the new thread locally
    originalMessages.forEach(originalMessage => {
      const newMessage: DBMessage = {
        ...originalMessage,
        id: `${originalMessage.id}_branch_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`, // Generate new message ID
        threadId: newThreadId,
        createdAt: originalMessage.createdAt // Keep original timestamps
      };
      LocalDB.addMessage(newMessage);
    });

    // Emit immediate updates
    debouncedEmitter.emitImmediate('threads_updated', LocalDB.getThreads());
    debouncedEmitter.emitImmediate('messages_updated', newThreadId, LocalDB.getMessagesByThread(newThreadId));

    // Skip remote sync for guest users
    if (this.isGuestMode) {
      return newThreadId;
    }

    // Async remote update
    this.queueSync(async () => {
      try {
        await AppwriteDB.branchThread(originalThreadId, newThreadId, newTitle);
      } catch (error) {
        console.error('Failed to sync thread branching:', error);
        // On failure, we keep the local version as it will sync later
      }
    });

    return newThreadId;
  }

  // ============ PROJECT OPERATIONS ============

  // Get projects (instant from local storage)
  static getProjects(): Project[] {
    return LocalDB.getProjects();
  }

  // Create project (instant local + async remote)
  static async createProject(name: string, description?: string, prompt?: string): Promise<string> {
    const projectId = `project_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const now = new Date();
    const project: Project = {
      id: projectId,
      name: name,
      description: description,
      prompt: prompt,
      createdAt: now,
      updatedAt: now
    };

    // Instant local update
    LocalDB.upsertProject(project);
    debouncedEmitter.emitImmediate('projects_updated', LocalDB.getProjects());

    // Skip remote sync for guest users
    if (this.isGuestMode) {
      return projectId;
    }

    // Async remote update
    this.queueSync(async () => {
      try {
        await AppwriteDB.createProject(projectId, name, description, prompt);
      } catch (error) {
        console.error('Failed to sync project creation:', error);
        // On failure, we keep the local version as it will sync later
      }
    });

    return projectId;
  }

  // Update project (instant local + async remote)
  static async updateProject(projectId: string, name: string, description?: string, prompt?: string): Promise<void> {
    const now = new Date();

    // Instant local update
    LocalDB.updateProject(projectId, { name, description, prompt, updatedAt: now });

    // Get updated projects and emit event immediately for instant sync
    const updatedProjects = LocalDB.getProjects();
    debouncedEmitter.emitImmediate('projects_updated', updatedProjects);

    // Skip remote sync for guest users
    if (this.isGuestMode) {
      return;
    }

    // Async remote update
    this.queueSync(async () => {
      try {
        await AppwriteDB.updateProject(projectId, name, description, prompt);
      } catch (error) {
        console.error('Failed to sync project update:', error);
      }
    });
  }

  // Update project color (instant local + async remote)
  static async updateProjectColor(projectId: string, colorIndex: number): Promise<void> {
    const now = new Date();

    // Instant local update
    LocalDB.updateProject(projectId, { colorIndex, updatedAt: now });

    // Get updated projects and emit event immediately for instant sync
    const updatedProjects = LocalDB.getProjects();
    debouncedEmitter.emitImmediate('projects_updated', updatedProjects);

    // Skip remote sync for guest users
    if (this.isGuestMode) {
      return;
    }

    // Async remote update
    this.queueSync(async () => {
      try {
        await AppwriteDB.updateProjectColor(projectId, colorIndex);
      } catch (error) {
        console.error('Failed to sync project color update:', error);
      }
    });
  }

  // Delete project (instant local + async remote)
  static async deleteProject(projectId: string, reassignThreadsToProjectId?: string): Promise<void> {
    // Instant local update
    LocalDB.deleteProject(projectId);

    // Handle threads in this project
    if (reassignThreadsToProjectId) {
      // Reassign threads to another project
      const threads = LocalDB.getThreads();
      threads.forEach(thread => {
        if (thread.projectId === projectId) {
          LocalDB.updateThread(thread.id, { projectId: reassignThreadsToProjectId, updatedAt: new Date() });
        }
      });
    } else {
      // Remove project association from threads
      const threads = LocalDB.getThreads();
      threads.forEach(thread => {
        if (thread.projectId === projectId) {
          LocalDB.updateThread(thread.id, { projectId: undefined, updatedAt: new Date() });
        }
      });
    }

    // Emit immediate updates
    debouncedEmitter.emitImmediate('projects_updated', LocalDB.getProjects());
    debouncedEmitter.emitImmediate('threads_updated', LocalDB.getThreads());

    // Skip remote sync for guest users
    if (this.isGuestMode) {
      return;
    }

    // Async remote update
    this.queueSync(async () => {
      try {
        await AppwriteDB.deleteProject(projectId, reassignThreadsToProjectId);
      } catch (error) {
        console.error('Failed to sync project deletion:', error);
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
      createdAt: message.createdAt || new Date(),
      webSearchResults: message.webSearchResults || undefined,
      attachments: message.attachments || undefined
    };

    // Instant local update
    LocalDB.addMessage(dbMessage);
    debouncedEmitter.emit('messages_updated', threadId, LocalDB.getMessagesByThread(threadId));
    debouncedEmitter.emit('threads_updated', LocalDB.getThreads()); // Thread order might change

    // Skip remote sync for guest users
    if (this.isGuestMode) {
      return;
    }

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

    // For guest users, only return local messages
    if (this.isGuestMode) {
      return localMessages;
    }

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
      debouncedEmitter.emit('messages_updated', threadId, remoteMessages);

      return remoteMessages;
    } catch (error) {
      console.error('Failed to load messages from remote:', error);
      // Return local messages as fallback (might be empty)
      return localMessages;
    }
  }

  // Background sync for messages - non-blocking with deduplication
  private static syncMessagesInBackground(threadId: string): void {
    // Skip background sync for guest users
    if (this.isGuestMode) {
      return;
    }

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
          debouncedEmitter.emit('messages_updated', threadId, remoteMessages);
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
    const summaryId = `summary_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    const summary: MessageSummary = {
      id: summaryId,
      threadId,
      messageId,
      content,
      createdAt: now
    };

    // Instant local update
    LocalDB.addSummary(summary);
    debouncedEmitter.emit('summaries_updated', threadId);

    // Skip remote sync for guest users
    if (this.isGuestMode) {
      return summaryId;
    }

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
    debouncedEmitter.emitImmediate('messages_updated', threadId, filteredMessages);

    // Skip remote sync for guest users
    if (this.isGuestMode) {
      return;
    }

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
      lastMessageAt: new Date(appwriteThread.lastMessageAt),
      isPinned: appwriteThread.isPinned || false, // Default to false for existing threads
      tags: appwriteThread.tags || [], // Default to empty array for existing threads
      isBranched: appwriteThread.isBranched || false, // Default to false for existing threads
      projectId: appwriteThread.projectId // Optional project ID
    };

    LocalDB.upsertThread(thread);
    debouncedEmitter.emit('threads_updated', LocalDB.getThreads());
  }

  private static handleRemoteThreadUpdated(appwriteThread: any): void {
    const thread: Thread = {
      id: appwriteThread.threadId,
      title: appwriteThread.title,
      createdAt: new Date(appwriteThread.$createdAt),
      updatedAt: new Date(appwriteThread.updatedAt),
      lastMessageAt: new Date(appwriteThread.lastMessageAt),
      isPinned: appwriteThread.isPinned || false, // Default to false for existing threads
      tags: appwriteThread.tags || [], // Default to empty array for existing threads
      isBranched: appwriteThread.isBranched || false, // Default to false for existing threads
      projectId: appwriteThread.projectId // Optional project ID
    };

    LocalDB.upsertThread(thread);
    debouncedEmitter.emit('threads_updated', LocalDB.getThreads());
  }

  private static handleRemoteThreadDeleted(appwriteThread: any): void {
    LocalDB.deleteThread(appwriteThread.threadId);
    debouncedEmitter.emit('threads_updated', LocalDB.getThreads());
  }

  private static handleRemoteMessageCreated(appwriteMessage: any): void {
    // Check if message already exists locally to avoid duplicates
    const existingMessages = LocalDB.getMessagesByThread(appwriteMessage.threadId);
    const existsLocally = existingMessages.some(m => m.id === appwriteMessage.messageId);

    if (existsLocally) {
      return;
    }

    // Parse attachments from JSON string if present
    let attachments: FileAttachment[] | undefined = undefined;
    if (appwriteMessage.attachments) {
      try {
        // If it's already an object, use it directly (backward compatibility)
        if (typeof appwriteMessage.attachments === 'object') {
          attachments = appwriteMessage.attachments as FileAttachment[];
        } else {
          // If it's a string, parse it
          attachments = JSON.parse(appwriteMessage.attachments as string);
        }

        // Ensure createdAt is a Date object for each attachment
        if (attachments && Array.isArray(attachments)) {
          attachments = attachments.map(att => ({
            ...att,
            createdAt: typeof att.createdAt === 'string' ? new Date(att.createdAt) : att.createdAt
          }));
        }
      } catch (error) {
        console.error('Error parsing attachments in real-time sync:', error);
        attachments = undefined;
      }
    }

    const message: DBMessage = {
      id: appwriteMessage.messageId,
      threadId: appwriteMessage.threadId,
      content: appwriteMessage.content,
      role: appwriteMessage.role,
      parts: appwriteMessage.content ? [{ type: "text", text: appwriteMessage.content }] : [],
      createdAt: new Date(appwriteMessage.createdAt),
      webSearchResults: appwriteMessage.webSearchResults || undefined,
      attachments: attachments
    };

    LocalDB.addMessage(message);
    const updatedMessages = LocalDB.getMessagesByThread(message.threadId);
    debouncedEmitter.emit('messages_updated', message.threadId, updatedMessages);
    debouncedEmitter.emit('threads_updated', LocalDB.getThreads());
  }

  private static handleRemoteMessageUpdated(appwriteMessage: any): void {

    // Parse attachments from JSON string if present
    let attachments: FileAttachment[] | undefined = undefined;
    if (appwriteMessage.attachments) {
      try {
        // If it's already an object, use it directly (backward compatibility)
        if (typeof appwriteMessage.attachments === 'object') {
          attachments = appwriteMessage.attachments as FileAttachment[];
        } else {
          // If it's a string, parse it
          attachments = JSON.parse(appwriteMessage.attachments as string);
        }

        // Ensure createdAt is a Date object for each attachment
        if (attachments && Array.isArray(attachments)) {
          attachments = attachments.map(att => ({
            ...att,
            createdAt: typeof att.createdAt === 'string' ? new Date(att.createdAt) : att.createdAt
          }));
        }
      } catch (error) {
        console.error('Error parsing attachments in real-time message update:', error);
        attachments = undefined;
      }
    }

    const message: DBMessage = {
      id: appwriteMessage.messageId,
      threadId: appwriteMessage.threadId,
      content: appwriteMessage.content,
      role: appwriteMessage.role,
      parts: appwriteMessage.content ? [{ type: "text", text: appwriteMessage.content }] : [],
      createdAt: new Date(appwriteMessage.createdAt),
      webSearchResults: appwriteMessage.webSearchResults || undefined,
      attachments: attachments
    };

    LocalDB.addMessage(message); // addMessage handles both create and update
    const updatedMessages = LocalDB.getMessagesByThread(message.threadId);
    debouncedEmitter.emit('messages_updated', message.threadId, updatedMessages);
    debouncedEmitter.emit('threads_updated', LocalDB.getThreads());
  }

  private static handleRemoteMessageDeleted(appwriteMessage: any): void {
    // Remove message from local storage
    const data = localStorage.getItem('atchat_messages');
    if (data) {
      const messages = JSON.parse(data);
      const filteredMessages = messages.filter((msg: any) => msg.id !== appwriteMessage.messageId);
      localStorage.setItem('atchat_messages', JSON.stringify(filteredMessages));

      const updatedMessages = LocalDB.getMessagesByThread(appwriteMessage.threadId);
      debouncedEmitter.emit('messages_updated', appwriteMessage.threadId, updatedMessages);
      debouncedEmitter.emit('threads_updated', LocalDB.getThreads());
    }
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
    debouncedEmitter.emit('summaries_updated', summary.threadId);
  }

  // ============ PROJECT REMOTE HANDLERS ============

  private static handleRemoteProjectCreated(appwriteProject: any): void {
    // Check if project already exists locally to avoid duplicates
    const existingProjects = LocalDB.getProjects();
    const existsLocally = existingProjects.some(p => p.id === appwriteProject.projectId);

    if (existsLocally) {
      // Project already exists locally, this is likely from our own sync operation
      console.log('[HybridDB] Project already exists locally, skipping remote create:', appwriteProject.projectId);
      return;
    }

    console.log('[HybridDB] Handling remote project created:', appwriteProject.projectId);

    const project: Project = {
      id: appwriteProject.projectId,
      name: appwriteProject.name,
      description: appwriteProject.description,
      prompt: appwriteProject.prompt,
      colorIndex: appwriteProject.colorIndex,
      createdAt: new Date(appwriteProject.createdAt),
      updatedAt: new Date(appwriteProject.updatedAt)
    };

    LocalDB.upsertProject(project);
    debouncedEmitter.emitImmediate('projects_updated', LocalDB.getProjects());
  }

  private static handleRemoteProjectUpdated(appwriteProject: any): void {
    console.log('[HybridDB] Handling remote project updated:', appwriteProject.projectId);

    const project: Project = {
      id: appwriteProject.projectId,
      name: appwriteProject.name,
      description: appwriteProject.description,
      prompt: appwriteProject.prompt,
      colorIndex: appwriteProject.colorIndex,
      createdAt: new Date(appwriteProject.createdAt),
      updatedAt: new Date(appwriteProject.updatedAt)
    };

    LocalDB.upsertProject(project);
    debouncedEmitter.emitImmediate('projects_updated', LocalDB.getProjects());
  }

  private static handleRemoteProjectDeleted(appwriteProject: any): void {
    console.log('[HybridDB] Handling remote project deleted:', appwriteProject.projectId);

    LocalDB.deleteProject(appwriteProject.projectId);

    // Also update any threads that were in this project to remove the project reference
    const threads = LocalDB.getThreads();
    threads.forEach(thread => {
      if (thread.projectId === appwriteProject.projectId) {
        LocalDB.updateThread(thread.id, { projectId: undefined });
      }
    });

    debouncedEmitter.emitImmediate('projects_updated', LocalDB.getProjects());
    debouncedEmitter.emitImmediate('threads_updated', LocalDB.getThreads());
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
    // Skip force sync for guest users
    if (this.isGuestMode) {
      return;
    }

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
      debouncedEmitter.emitImmediate('messages_updated', threadId, remoteMessages);
    } catch (error) {
      console.error('Failed to force sync thread:', error);
    } finally {
      this.pendingMessageSyncs.delete(`force_${threadId}`);
    }
  }
}
