/**
 * Hybrid Database Service
 * 
 * Combines fast local storage with Appwrite backend synchronization.
 * Provides instant UI updates while maintaining data consistency.
 */

import { AppwriteDB, Thread, DBMessage, MessageSummary, FileAttachment, Project, PlanArtifact } from './appwriteDB';
import { LocalDB } from './localDB';
import { AppwriteRealtime } from './appwriteRealtime';
import { devLog, prodError, devError, devWarn } from './logger';

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
    // Zero delays for real-time sync experience
    switch (eventName) {
      case 'messages_updated':
        return 0; // Instant updates for messages
      case 'threads_updated':
        return 0; // Instant updates for threads
      case 'projects_updated':
        return 0; // Instant updates for projects
      case 'summaries_updated':
        return 0; // Instant updates for summaries
      default:
        return 0; // All events are instant
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
  private static pendingPlanArtifactSyncs = new Set<string>(); // Track artifact syncs
  private static isGuestMode = false; // Track if we're in guest mode
  private static recentMessageIds = new Set<string>(); // Track recently created message IDs
  private static messageCreationTimestamps = new Map<string, number>(); // Track message creation times

  // Initialize the hybrid database
  static async initialize(userId: string, isGuest: boolean = false): Promise<void> {
    if (this.initialized) {
      // Check if local data exists for authenticated users
      if (!isGuest && userId) {
        await this.checkAndRefreshIfDataMissing(userId);
      }
      return;
    }
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
      onPlanArtifactCreated: this.handleRemotePlanArtifactCreated.bind(this),
      onPlanArtifactUpdated: this.handleRemotePlanArtifactUpdated.bind(this),
      onPlanArtifactDeleted: this.handleRemotePlanArtifactDeleted.bind(this),
    });

    // Subscribe to realtime updates immediately for better UX
    AppwriteRealtime.subscribeToAll(userId);

    // Immediate sync for real-time experience - no background delays
    await this.performImmediateSync();
    this.initialized = true;
  }

  // Perform immediate sync from Appwrite for real-time experience
  private static async performImmediateSync(): Promise<void> {
    // Skip sync for guest users
    if (this.isGuestMode) {
      // Just emit local data for guest users
      const localThreads = LocalDB.getThreads();
      const localProjects = LocalDB.getProjects();
      debouncedEmitter.emitImmediate('threads_updated', localThreads);
      debouncedEmitter.emitImmediate('projects_updated', localProjects);
      return;
    }

    // Immediate sync for real-time experience - no delays
    try {
      // Load local data first for instant UI
      const localThreads = LocalDB.getThreads();
      const localProjects = LocalDB.getProjects();
      if (localThreads.length > 0) {
        debouncedEmitter.emitImmediate('threads_updated', localThreads);
      }
      if (localProjects.length > 0) {
        debouncedEmitter.emitImmediate('projects_updated', localProjects);
      }

      devLog('[HybridDB] Starting immediate sync for real-time experience...');

      // OPTIMIZED: Load only essential data first for faster initial load

      // Phase 1: Load only first 15 recent threads (reduced from 40+ for speed)
      const recentThreadsResult = await AppwriteDB.getThreadsPaginated(15, 0);

      // Update local storage with recent threads immediately
      recentThreadsResult.threads.forEach(thread => LocalDB.upsertThread(thread));
      debouncedEmitter.emitImmediate('threads_updated', LocalDB.getThreads());

      // Phase 2: Load projects and priority threads in background (non-blocking)
      Promise.all([
        this.loadProjectsInBackground(),
        this.loadPriorityThreadsInBackground()
      ]).catch(error => devWarn('Background loading failed:', error));

      devLog('[HybridDB] Immediate sync completed successfully');

      // For messages, only sync when actually needed (lazy loading)
      // This prevents the massive network requests on startup
      this.isOnline = true;
    } catch (error) {
      prodError('Immediate sync failed', error, 'HybridDB');
      this.isOnline = false;

      // Use local data if remote fails
      const localThreads = LocalDB.getThreads();
      const localProjects = LocalDB.getProjects();
      debouncedEmitter.emitImmediate('threads_updated', localThreads);
      debouncedEmitter.emitImmediate('projects_updated', localProjects);
    }
  }

  // Load projects in background (non-blocking)
  static async loadProjectsInBackground(): Promise<void> {
    try {
      const projects = await AppwriteDB.getProjects();
      LocalDB.replaceAllProjects(projects);
      debouncedEmitter.emitImmediate('projects_updated', projects);
      devLog('[HybridDB] Projects loaded in background');
    } catch (error) {
      devWarn('[HybridDB] Background projects loading failed:', error);
    }
  }

  // Load priority threads in background (non-blocking)
  private static async loadPriorityThreadsInBackground(): Promise<void> {
    try {
      // Load priority threads (pinned + project threads)
      const priorityThreads = await AppwriteDB.getPriorityThreads();
      priorityThreads.forEach(thread => LocalDB.upsertThread(thread));

      // Load more regular threads (next 25)
      const moreThreadsResult = await AppwriteDB.getRegularThreadsPaginated(25, 15);
      moreThreadsResult.threads.forEach(thread => LocalDB.upsertThread(thread));

      // Update UI with all loaded threads
      debouncedEmitter.emitImmediate('threads_updated', LocalDB.getThreads());
      devLog('[HybridDB] Priority and additional threads loaded in background');
    } catch (error) {
      devWarn('[HybridDB] Background threads loading failed:', error);
    }
  }

  // ============ THREAD OPERATIONS ============

  // Get threads (instant from local storage)
  static getThreads(): Thread[] {
    return LocalDB.getThreads();
  }

  // Load priority threads (pinned and project threads) from remote
  static async loadPriorityThreadsFromRemote(): Promise<Thread[]> {
    if (this.isGuestMode) {
      return [];
    }

    try {
      const priorityThreads = await AppwriteDB.getPriorityThreads();
      
      // Update local storage with priority threads
      priorityThreads.forEach(thread => {
        LocalDB.upsertThread(thread);
      });

      return priorityThreads;
    } catch (error) {
      devError('Failed to load priority threads from remote:', error);
      return [];
    }
  }

  // Load regular threads with pagination from remote
  static async loadRegularThreadsPaginated(limit: number = 25, offset: number = 0): Promise<{
    threads: Thread[];
    hasMore: boolean;
    total: number;
  }> {
    if (this.isGuestMode) {
      return { threads: [], hasMore: false, total: 0 };
    }

    try {
      const result = await AppwriteDB.getRegularThreadsPaginated(limit, offset);
      
      // Update local storage with new threads (append, don't replace)
      result.threads.forEach(thread => {
        LocalDB.upsertThread(thread);
      });

      return result;
    } catch (error) {
      devError('Failed to load regular threads from remote:', error);
      return { threads: [], hasMore: false, total: 0 };
    }
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
      projectId: projectId, // Optional project ID
      isShared: false, // New threads are not shared by default
      shareId: undefined, // No share ID initially
      sharedAt: undefined // No shared date initially
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
        devError('Failed to sync thread creation:', error);
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

    // Emit immediately for real-time sync
    debouncedEmitter.emitImmediate('threads_updated', updatedThreads);

    // Skip remote sync for guest users
    if (this.isGuestMode) {
      return;
    }

    // Async remote update
    this.queueSync(async () => {
      try {
        await AppwriteDB.updateThread(threadId, title);
      } catch (error) {
        devError('Failed to sync thread update:', error);
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

    // Emit immediately for real-time sync
    debouncedEmitter.emitImmediate('threads_updated', updatedThreads);

    // Skip remote sync for guest users
    if (this.isGuestMode) {
      return;
    }

    // Async remote update
    this.queueSync(async () => {
      try {
        await AppwriteDB.updateThreadPinStatus(threadId, isPinned);
      } catch (error) {
        devError('Failed to sync thread pin status update:', error);
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

    // Emit immediately for real-time sync
    debouncedEmitter.emitImmediate('threads_updated', updatedThreads);

    // Skip remote sync for guest users
    if (this.isGuestMode) {
      return;
    }

    // Async remote update
    this.queueSync(async () => {
      try {
        await AppwriteDB.updateThreadTags(threadId, tags);
      } catch (error) {
        devError('Failed to sync thread tags update:', error);
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
        devError('Failed to sync thread project update:', error);
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
        devError('Failed to sync thread deletion:', error);
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
        devError('Failed to sync thread branching:', error);
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
        devError('Failed to sync project creation:', error);
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
        devError('Failed to sync project update:', error);
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
        devError('Failed to sync project color update:', error);
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
        devError('Failed to sync project deletion:', error);
      }
    });
  }

  // ============ PROJECT MEMBER OPERATIONS ============

  // Add member to project (only for authenticated users)
  static async addProjectMember(projectId: string, email: string): Promise<void> {
    // Skip for guest users
    if (this.isGuestMode) {
      throw new Error('Project collaboration not available for guest users');
    }

    try {
      // First find the user by email using the API
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'findUserByEmail',
          email
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to find user');
      }

      const result = await response.json();
      const userToAdd = result.user;

      // Add member using AppwriteDB directly
      await AppwriteDB.addProjectMember(projectId, userToAdd.id);

      // Refresh projects to get updated member list
      await this.loadProjectsInBackground();
    } catch (error) {
      devError('Failed to add project member:', error);
      throw error;
    }
  }

  // Remove member from project (only for authenticated users)
  static async removeProjectMember(projectId: string, userId: string): Promise<void> {
    // Skip for guest users
    if (this.isGuestMode) {
      throw new Error('Project collaboration not available for guest users');
    }

    try {
      // Remove member using AppwriteDB directly
      await AppwriteDB.removeProjectMember(projectId, userId);

      // Refresh projects to get updated member list
      await this.loadProjectsInBackground();
    } catch (error) {
      devError('Failed to remove project member:', error);
      throw error;
    }
  }

  // Get project members (only for authenticated users)
  static async getProjectMembers(projectId: string): Promise<Array<{id: string, name: string, email: string, isOwner?: boolean}>> {
    // Skip for guest users
    if (this.isGuestMode) {
      throw new Error('Project collaboration not available for guest users');
    }

    try {
      // Get member IDs using AppwriteDB directly
      const memberIds = await AppwriteDB.getProjectMembers(projectId);

      // Get project owner ID
      const ownerId = await AppwriteDB.getProjectOwnerId(projectId);

      // Combine owner and members (avoid duplicates)
      const allUserIds = ownerId ? [ownerId, ...memberIds.filter(id => id !== ownerId)] : memberIds;

      if (allUserIds.length === 0) {
        return [];
      }

      // Get user details from API
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getUserDetails',
          userIds: allUserIds
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get user details');
      }

      const result = await response.json();
      const users = result.users || [];

      // Mark the owner
      return users.map((user: any) => ({
        ...user,
        isOwner: user.id === ownerId
      }));
    } catch (error) {
      devError('Failed to get project members:', error);
      throw error;
    }
  }



  // Check if current user is project owner (only for authenticated users)
  static async isProjectOwner(projectId: string): Promise<boolean> {
    // Skip for guest users
    if (this.isGuestMode) {
      return false;
    }

    try {
      // Check ownership using AppwriteDB directly
      return await AppwriteDB.isProjectOwner(projectId);
    } catch (error) {
      devError('Failed to check project ownership:', error);
      return false;
    }
  }

  // ============ MESSAGE OPERATIONS ============

  // Get messages for thread (instant from local storage)
  static getMessagesByThreadId(threadId: string): DBMessage[] {
    return LocalDB.getMessagesByThread(threadId);
  }

  // Update message (instant local + async remote)
  static async updateMessage(threadId: string, message: any): Promise<void> {
    devLog('[HybridDB] Updating message:', message.id, 'role:', message.role);

    const dbMessage: DBMessage = {
      id: message.id,
      threadId,
      content: message.content,
      role: message.role,
      parts: message.parts || [],
      createdAt: message.createdAt || new Date(),
      webSearchResults: message.webSearchResults || undefined,
      webSearchImgs: message.webSearchImgs || undefined,
      attachments: message.attachments || undefined,
      model: message.model || undefined,
      imgurl: message.imgurl || undefined,
      isPlan: typeof message.isPlan === 'boolean' ? message.isPlan : undefined
    };

    // Instant local update (LocalDB.addMessage handles both create and update)
    LocalDB.addMessage(dbMessage);

    // Emit messages_updated event for real-time sync
    devLog('[HybridDB] ✅ Message updated locally, emitting messages_updated:', message.id, 'role:', message.role);
    debouncedEmitter.emitImmediate('messages_updated', threadId, LocalDB.getMessagesByThread(threadId));
    debouncedEmitter.emitImmediate('threads_updated', LocalDB.getThreads()); // Thread order might change

    // Skip remote sync for guest users
    if (this.isGuestMode) {
      return;
    }

    // Async remote update
    this.queueSync(async () => {
      try {
        await AppwriteDB.updateMessage(threadId, message); // Use updateMessage for proper updates
      } catch (error) {
        devError('Failed to sync message update:', error);
      }
    });
  }

  // Create message (instant local + async remote)
  static async createMessage(threadId: string, message: any): Promise<void> {
    // Prevent duplicate message creation
    if (this.recentMessageIds.has(message.id)) {
      devLog('[HybridDB] Duplicate message creation prevented:', message.id);
      return;
    }

    // Track this message as recently created
    this.recentMessageIds.add(message.id);
    this.messageCreationTimestamps.set(message.id, Date.now());

    // Clean up old message tracking (older than 10 seconds)
    const now = Date.now();
    for (const [msgId, timestamp] of this.messageCreationTimestamps.entries()) {
      if (now - timestamp > 10000) { // 10 seconds
        this.recentMessageIds.delete(msgId);
        this.messageCreationTimestamps.delete(msgId);
      }
    }

    const dbMessage: DBMessage = {
      id: message.id,
      threadId,
      content: message.content,
      role: message.role,
      parts: message.parts || [],
      createdAt: message.createdAt || new Date(),
      webSearchResults: message.webSearchResults || undefined,
      webSearchImgs: message.webSearchImgs || undefined,
      attachments: message.attachments || undefined,
      model: message.model || undefined,
      imgurl: message.imgurl || undefined,
      isPlan: typeof message.isPlan === 'boolean' ? message.isPlan : undefined
    };

    // Instant local update
    LocalDB.addMessage(dbMessage);

    // Emit messages_updated event for real-time sync
    devLog('[HybridDB] ✅ Message stored locally, emitting messages_updated:', message.id, 'role:', message.role);
    debouncedEmitter.emitImmediate('messages_updated', threadId, LocalDB.getMessagesByThread(threadId));
    debouncedEmitter.emitImmediate('threads_updated', LocalDB.getThreads()); // Thread order might change

    // Skip remote sync for guest users
    if (this.isGuestMode) {
      return;
    }

    // Async remote update
    this.queueSync(async () => {
      try {
        await AppwriteDB.createMessage(threadId, message);
      } catch (error) {
        devError('Failed to sync message creation:', error);
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

    // If we have local messages, return them immediately for instant performance
    if (localMessages.length > 0) {
      // Sync immediately in parallel for real-time updates
      this.syncMessagesInBackground(threadId).catch(error =>
        devWarn('Parallel message sync failed:', error)
      );
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
      prodError('Failed to load messages from remote', error, 'HybridDB');
      // Return local messages as fallback (might be empty)
      return localMessages;
    }
  }

  // ============ PLAN ARTIFACT OPERATIONS ============

  static getPlanArtifactsByThread(threadId: string): PlanArtifact[] {
    return LocalDB.getPlanArtifactsByThread(threadId);
  }

  static getPlanArtifactsByMessage(
    threadId: string,
    messageId: string
  ): PlanArtifact[] {
    return LocalDB.getPlanArtifactsByMessage(threadId, messageId);
  }

  static upsertPlanArtifacts(artifacts: PlanArtifact[]): void {
    if (!artifacts || artifacts.length === 0) return;
    LocalDB.upsertPlanArtifacts(artifacts);
    const threadId = artifacts[0]?.threadId;
    if (threadId) {
      debouncedEmitter.emitImmediate(
        'plan_artifacts_updated',
        threadId,
        LocalDB.getPlanArtifactsByThread(threadId)
      );
    }
  }

  static async loadPlanArtifactsFromRemote(
    threadId: string
  ): Promise<PlanArtifact[]> {
    const localArtifacts = LocalDB.getPlanArtifactsByThread(threadId);

    if (this.isGuestMode) {
      return localArtifacts;
    }

    try {
      const remoteArtifacts = await AppwriteDB.getPlanArtifactsByThread(threadId);
      LocalDB.replacePlanArtifactsForThread(threadId, remoteArtifacts);
      debouncedEmitter.emit(
        'plan_artifacts_updated',
        threadId,
        remoteArtifacts
      );

      this.syncPlanArtifactsInBackground(threadId).catch((error) =>
        devWarn('Parallel plan artifact sync failed:', error)
      );

      return remoteArtifacts;
    } catch (error) {
      devWarn('Failed to load plan artifacts from remote:', error);
      return localArtifacts;
    }
  }

  private static async syncPlanArtifactsInBackground(
    threadId: string
  ): Promise<void> {
    if (this.isGuestMode) {
      return;
    }

    if (this.pendingPlanArtifactSyncs.has(threadId)) {
      return;
    }

    this.pendingPlanArtifactSyncs.add(threadId);

    try {
      const remoteArtifacts = await AppwriteDB.getPlanArtifactsByThread(threadId);
      const localArtifacts = LocalDB.getPlanArtifactsByThread(threadId);

      let hasChanges = remoteArtifacts.length !== localArtifacts.length;

      if (!hasChanges) {
        const localMap = new Map(localArtifacts.map((artifact) => [artifact.id, artifact]));
        hasChanges = remoteArtifacts.some((remoteArtifact) => {
          const localArtifact = localMap.get(remoteArtifact.id);
          if (!localArtifact) return true;

          return (
            localArtifact.version !== remoteArtifact.version ||
            localArtifact.updatedAt.getTime() !== remoteArtifact.updatedAt.getTime()
          );
        });
      }

      if (hasChanges) {
        devLog(
          '[HybridDB] Plan artifact sync detected changes, updating local cache for thread:',
          threadId,
          'Remote count:',
          remoteArtifacts.length,
          'Local count:',
          localArtifacts.length
        );

        LocalDB.replacePlanArtifactsForThread(threadId, remoteArtifacts);
        debouncedEmitter.emitImmediate(
          'plan_artifacts_updated',
          threadId,
          remoteArtifacts
        );
      }
    } catch (error) {
      devWarn('Background plan artifact sync failed:', error);
    } finally {
      this.pendingPlanArtifactSyncs.delete(threadId);
    }
  }

  // Immediate sync for messages - real-time with deduplication
  private static async syncMessagesInBackground(threadId: string): Promise<void> {
    // Skip background sync for guest users
    if (this.isGuestMode) {
      return;
    }

    // Prevent duplicate syncs for the same thread
    if (this.pendingMessageSyncs.has(threadId)) {
      return;
    }

    this.pendingMessageSyncs.add(threadId);

    // Immediate sync for real-time experience
    try {
      const remoteMessages = await AppwriteDB.getMessagesByThreadId(threadId);
      const localMessages = LocalDB.getMessagesByThread(threadId);

      // Check if there are differences (count or content changes)
      let hasChanges = remoteMessages.length !== localMessages.length;
      
      if (!hasChanges) {
        // Check for content changes in existing messages (e.g., image generation updates)
        const localMessageMap = new Map(localMessages.map(msg => [msg.id, msg]));
        
        hasChanges = remoteMessages.some(remoteMsg => {
          const localMsg = localMessageMap.get(remoteMsg.id);
          if (!localMsg) return true; // New message
          
          // Check for content, imgurl, model, isPlan, and attachments differences
          const contentDiff = localMsg.content !== remoteMsg.content;
          const imgurlDiff = localMsg.imgurl !== remoteMsg.imgurl;
          const modelDiff = localMsg.model !== remoteMsg.model;
          const isPlanDiff = localMsg.isPlan !== remoteMsg.isPlan;
          
          // Check attachments - compare count and structure
          const localAttachCount = localMsg.attachments?.length || 0;
          const remoteAttachCount = remoteMsg.attachments?.length || 0;
          const attachmentsDiff = localAttachCount !== remoteAttachCount ||
            (localMsg.attachments && remoteMsg.attachments && 
             JSON.stringify(localMsg.attachments) !== JSON.stringify(remoteMsg.attachments));
          
          return contentDiff || imgurlDiff || modelDiff || isPlanDiff || attachmentsDiff;
        });
      }

      // Only update if there's a difference to avoid unnecessary events
      if (hasChanges) {
        devLog('[HybridDB] Background sync detected changes, updating local messages for thread:', threadId, 'Remote count:', remoteMessages.length, 'Local count:', localMessages.length);
        LocalDB.clearMessagesByThread(threadId);
        remoteMessages.forEach(message => {
          LocalDB.addMessage(message);
        });
        // Use emitImmediate for instant cross-session sync
        debouncedEmitter.emitImmediate('messages_updated', threadId, remoteMessages);
        debouncedEmitter.emitImmediate('threads_updated', LocalDB.getThreads());
      }
    } catch (error) {
      devWarn('Immediate message sync failed:', error);
    } finally {
      this.pendingMessageSyncs.delete(threadId);
    }
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
    
    const summariesWithRole = summaries.map(summary => {
      const message = messagesMap.get(summary.messageId);
      return {
        ...summary,
        role: message ? message.role : 'user'
      };
    });
    
    // Ensure robust ordering by message creation time for consistent alternation
    return summariesWithRole.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return timeA - timeB;
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
        devError('Failed to sync summary creation:', error);
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
        devError('Failed to sync trailing message deletion:', error);
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
      projectId: appwriteThread.projectId, // Optional project ID
      isShared: appwriteThread.isShared || false, // Default to false for existing threads
      shareId: appwriteThread.shareId, // Optional share ID
      sharedAt: appwriteThread.sharedAt ? new Date(appwriteThread.sharedAt) : undefined // Optional shared date
    };

    LocalDB.upsertThread(thread);

    // For collaborative threads, also trigger a background sync to ensure we have all collaborative data
    if (appwriteThread.projectId && appwriteThread.userId !== LocalDB.getUserId()) {
      console.log('[HybridDB] Collaborative thread created, triggering background sync');
      this.syncCollaborativeThreadsInBackground();
    }

    debouncedEmitter.emitImmediate('threads_updated', LocalDB.getThreads());
  }

  // Background sync for collaborative threads
  private static async syncCollaborativeThreadsInBackground(): Promise<void> {
    // Skip for guest users
    if (this.isGuestMode) {
      return;
    }

    try {
      // Get fresh collaborative threads from Appwrite
      const remoteThreads = await AppwriteDB.getThreads();

      // Update local storage with fresh data
      LocalDB.replaceAllThreads(remoteThreads);

      // Emit update to refresh UI
      debouncedEmitter.emitImmediate('threads_updated', remoteThreads);

      console.log('[HybridDB] Collaborative threads synced successfully');
    } catch (error) {
      devError('Failed to sync collaborative threads:', error);
    }
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
      projectId: appwriteThread.projectId, // Optional project ID
      isShared: appwriteThread.isShared || false, // Default to false for existing threads
      shareId: appwriteThread.shareId, // Optional share ID
      sharedAt: appwriteThread.sharedAt ? new Date(appwriteThread.sharedAt) : undefined // Optional shared date
    };

    LocalDB.upsertThread(thread);
    debouncedEmitter.emitImmediate('threads_updated', LocalDB.getThreads());
  }

  private static handleRemoteThreadDeleted(appwriteThread: any): void {
    LocalDB.deleteThread(appwriteThread.threadId);
    debouncedEmitter.emitImmediate('threads_updated', LocalDB.getThreads());
  }

  private static handleRemoteMessageCreated(appwriteMessage: any): void {
    // Check if this message was recently created by us
    if (this.recentMessageIds.has(appwriteMessage.messageId)) {
      devLog('[HybridDB] Skipping remote message - recently created locally:', appwriteMessage.messageId);
      return;
    }

    // Check if message already exists locally to avoid duplicates
    const existingMessages = LocalDB.getMessagesByThread(appwriteMessage.threadId);
    const existsLocally = existingMessages.some(m => m.id === appwriteMessage.messageId);

    if (existsLocally) {
      devLog('[HybridDB] Message already exists locally, skipping remote create:', appwriteMessage.messageId);
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
        devError('Error parsing attachments in real-time sync:', error);
        attachments = undefined;
      }
    }

    // Create parts array - include text part if content exists, or empty text part if imgurl exists
    const parts: any[] = [];
    if (appwriteMessage.content) {
      parts.push({ type: "text", text: appwriteMessage.content });
    } else if (appwriteMessage.imgurl) {
      // For image-only messages, create an appropriate parts structure
      parts.push({ type: "text", text: "" });
    }

    const message: DBMessage = {
      id: appwriteMessage.messageId,
      threadId: appwriteMessage.threadId,
      content: appwriteMessage.content || "",
      role: appwriteMessage.role,
      parts: parts,
      createdAt: new Date(appwriteMessage.createdAt),
      webSearchResults: appwriteMessage.webSearchResults || undefined,
      webSearchImgs: (appwriteMessage as any).webSearchImgs || undefined,
      attachments: attachments,
      model: appwriteMessage.model || undefined,
      imgurl: appwriteMessage.imgurl || undefined,
      isPlan: typeof (appwriteMessage as any).isPlan === "boolean" ? (appwriteMessage as any).isPlan : undefined
    };

    LocalDB.addMessage(message);
    const updatedMessages = LocalDB.getMessagesByThread(message.threadId);

    // For collaborative messages, also sync messages in background to ensure we have all data
    if (appwriteMessage.userId !== LocalDB.getUserId()) {
      console.log('[HybridDB] Collaborative message created, triggering message sync');
      this.syncMessagesInBackground(message.threadId);
    }

    debouncedEmitter.emitImmediate('messages_updated', message.threadId, updatedMessages);
    debouncedEmitter.emitImmediate('threads_updated', LocalDB.getThreads());
  }

  private static handleRemoteMessageUpdated(appwriteMessage: any): void {
    // Check if this is a duplicate update by comparing with local message
    const existingMessages = LocalDB.getMessagesByThread(appwriteMessage.threadId);
    const existingMessage = existingMessages.find(m => m.id === appwriteMessage.messageId);

    if (existingMessage) {
      // Check if content, imgurl, model, or isPlan changed
      const contentUnchanged = existingMessage.content === appwriteMessage.content;
      const imgUrlUnchanged = existingMessage.imgurl === appwriteMessage.imgurl;
      const modelUnchanged = existingMessage.model === appwriteMessage.model;
      const isPlanUnchanged = existingMessage.isPlan === (appwriteMessage as any).isPlan;
      
      if (contentUnchanged && imgUrlUnchanged && modelUnchanged && isPlanUnchanged) {
        devLog('[HybridDB] Message content, imgurl, model, and isPlan unchanged, skipping update:', appwriteMessage.messageId);
        return;
      }
      
      devLog('[HybridDB] Message update detected:', appwriteMessage.messageId, {
        contentChanged: !contentUnchanged,
        imgUrlChanged: !imgUrlUnchanged, 
        modelChanged: !modelUnchanged,
        isPlanChanged: !isPlanUnchanged,
        newImgUrl: appwriteMessage.imgurl,
        oldImgUrl: existingMessage.imgurl,
        newIsPlan: (appwriteMessage as any).isPlan,
        oldIsPlan: existingMessage.isPlan
      });
    } else {
      devLog('[HybridDB] New message received via update event:', appwriteMessage.messageId);
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
        devError('Error parsing attachments in real-time message update:', error);
        attachments = undefined;
      }
    }

    // Create parts array - include text part if content exists, or empty text part if imgurl exists
    const parts: any[] = [];
    if (appwriteMessage.content) {
      parts.push({ type: "text", text: appwriteMessage.content });
    } else if (appwriteMessage.imgurl) {
      // For image-only messages, create an appropriate parts structure
      parts.push({ type: "text", text: "" });
    }

    const message: DBMessage = {
      id: appwriteMessage.messageId,
      threadId: appwriteMessage.threadId,
      content: appwriteMessage.content || "",
      role: appwriteMessage.role,
      parts: parts,
      createdAt: new Date(appwriteMessage.createdAt),
      webSearchResults: appwriteMessage.webSearchResults || undefined,
      webSearchImgs: (appwriteMessage as any).webSearchImgs || undefined,
      attachments: attachments,
      model: appwriteMessage.model || undefined,
      imgurl: appwriteMessage.imgurl || undefined,
      isPlan: typeof (appwriteMessage as any).isPlan === "boolean" ? (appwriteMessage as any).isPlan : undefined
    };

    LocalDB.addMessage(message); // addMessage handles both create and update
    const updatedMessages = LocalDB.getMessagesByThread(message.threadId);
    debouncedEmitter.emitImmediate('messages_updated', message.threadId, updatedMessages);
    debouncedEmitter.emitImmediate('threads_updated', LocalDB.getThreads());
  }

  private static handleRemoteMessageDeleted(appwriteMessage: any): void {
    // Remove message from local storage
    const data = localStorage.getItem('atchat_messages');
    if (data) {
      const messages = JSON.parse(data);
      const filteredMessages = messages.filter((msg: any) => msg.id !== appwriteMessage.messageId);
      localStorage.setItem('atchat_messages', JSON.stringify(filteredMessages));

      const updatedMessages = LocalDB.getMessagesByThread(appwriteMessage.threadId);
      debouncedEmitter.emitImmediate('messages_updated', appwriteMessage.threadId, updatedMessages);
      debouncedEmitter.emitImmediate('threads_updated', LocalDB.getThreads());
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
      devLog('[HybridDB] Project already exists locally, skipping remote create:', appwriteProject.projectId);
      return;
    }

    devLog('[HybridDB] Handling remote project created:', appwriteProject.projectId);

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
    devLog('[HybridDB] Handling remote project updated:', appwriteProject.projectId);

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

    // When project is updated (e.g., members added/removed), refresh collaborative threads
    console.log('[HybridDB] Project updated, refreshing collaborative data');
    this.syncCollaborativeThreadsInBackground();

    debouncedEmitter.emitImmediate('projects_updated', LocalDB.getProjects());
  }

  private static handleRemoteProjectDeleted(appwriteProject: any): void {
    devLog('[HybridDB] Handling remote project deleted:', appwriteProject.projectId);

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

  // ============ PLAN ARTIFACT REALTIME HANDLERS ============

  private static handleRemotePlanArtifactCreated(appwriteArtifact: any): void {
    devLog('[HybridDB] Handling remote plan artifact created:', appwriteArtifact.artifactId);
    const artifact: PlanArtifact = {
      id: appwriteArtifact.$id,
      artifactId: appwriteArtifact.artifactId,
      threadId: appwriteArtifact.threadId,
      messageId: appwriteArtifact.messageId,
      userId: appwriteArtifact.userId,
      type: appwriteArtifact.type,
      title: appwriteArtifact.title,
      description: appwriteArtifact.description,
      htmlCode: appwriteArtifact.htmlCode,
      cssCode: appwriteArtifact.cssCode,
      jsCode: appwriteArtifact.jsCode,
      framework: appwriteArtifact.framework,
      theme: appwriteArtifact.theme,
      diagramType: appwriteArtifact.diagramType,
      diagramCode: appwriteArtifact.diagramCode,
      outputFormat: appwriteArtifact.outputFormat,
      sqlSchema: appwriteArtifact.sqlSchema,
      prismaSchema: appwriteArtifact.prismaSchema,
      typeormEntities: appwriteArtifact.typeormEntities,
      diagramSvg: appwriteArtifact.diagramSvg,
      mermaidCode: appwriteArtifact.mermaidCode,
      d3Code: appwriteArtifact.d3Code,
      version: appwriteArtifact.version,
      parentArtifactId: appwriteArtifact.parentArtifactId,
      isPublic: appwriteArtifact.isPublic,
      createdAt: new Date(appwriteArtifact.$createdAt),
      updatedAt: new Date(appwriteArtifact.$updatedAt),
    };
    LocalDB.upsertPlanArtifacts([artifact]);
    debouncedEmitter.emitImmediate('plan_artifacts_updated', appwriteArtifact.threadId, LocalDB.getPlanArtifactsByThread(appwriteArtifact.threadId));
  }

  private static handleRemotePlanArtifactUpdated(appwriteArtifact: any): void {
    devLog('[HybridDB] Handling remote plan artifact updated:', appwriteArtifact.artifactId);
    const artifact: PlanArtifact = {
      id: appwriteArtifact.$id,
      artifactId: appwriteArtifact.artifactId,
      threadId: appwriteArtifact.threadId,
      messageId: appwriteArtifact.messageId,
      userId: appwriteArtifact.userId,
      type: appwriteArtifact.type,
      title: appwriteArtifact.title,
      description: appwriteArtifact.description,
      htmlCode: appwriteArtifact.htmlCode,
      cssCode: appwriteArtifact.cssCode,
      jsCode: appwriteArtifact.jsCode,
      framework: appwriteArtifact.framework,
      theme: appwriteArtifact.theme,
      diagramType: appwriteArtifact.diagramType,
      diagramCode: appwriteArtifact.diagramCode,
      outputFormat: appwriteArtifact.outputFormat,
      sqlSchema: appwriteArtifact.sqlSchema,
      prismaSchema: appwriteArtifact.prismaSchema,
      typeormEntities: appwriteArtifact.typeormEntities,
      diagramSvg: appwriteArtifact.diagramSvg,
      mermaidCode: appwriteArtifact.mermaidCode,
      d3Code: appwriteArtifact.d3Code,
      version: appwriteArtifact.version,
      parentArtifactId: appwriteArtifact.parentArtifactId,
      isPublic: appwriteArtifact.isPublic,
      createdAt: new Date(appwriteArtifact.$createdAt),
      updatedAt: new Date(appwriteArtifact.$updatedAt),
    };
    LocalDB.upsertPlanArtifacts([artifact]);
    debouncedEmitter.emitImmediate('plan_artifacts_updated', appwriteArtifact.threadId, LocalDB.getPlanArtifactsByThread(appwriteArtifact.threadId));
  }

  private static handleRemotePlanArtifactDeleted(appwriteArtifact: any): void {
    devLog('[HybridDB] Handling remote plan artifact deleted:', appwriteArtifact.artifactId);
    LocalDB.deletePlanArtifactsByThread(appwriteArtifact.threadId);
    debouncedEmitter.emitImmediate('plan_artifacts_updated', appwriteArtifact.threadId, LocalDB.getPlanArtifactsByThread(appwriteArtifact.threadId));
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
        devError('Batch sync operation failed:', error);
        this.isOnline = false;
        // Re-queue failed operations for later retry
        this.syncQueue.unshift(...batch);
        break;
      }

      // No delay for real-time sync - process immediately
      // Removed artificial delays for instant cloud synchronization
    }

    this.isSyncing = false;

    // If there are still operations in the queue and we're offline, retry immediately
    if (this.syncQueue.length > 0 && !this.isOnline) {
      setTimeout(() => this.processSyncQueue(), 1000); // Retry in 1 second for faster recovery
    }
  }

  // Clear all local data
  static clearLocalData(): void {
    LocalDB.clear();
    // Reset initialization state so it can be re-initialized
    this.initialized = false;
    this.initializationPromise = null;
    this.pendingMessageSyncs.clear(); // Clear pending syncs
    this.pendingPlanArtifactSyncs.clear();
    this.recentMessageIds.clear(); // Clear message tracking
    this.messageCreationTimestamps.clear(); // Clear timestamp tracking
  }

  // Force clear all local data and refresh from Appwrite (for signin)
  static async forceRefreshOnSignin(userId: string): Promise<void> {
    devLog('[HybridDB] Force refreshing all data on signin for user:', userId);

    try {
      // 1. Clear all local data first
      LocalDB.clear();

      // 2. Reset initialization state
      this.initialized = false;
      this.initializationPromise = null;
      this.pendingMessageSyncs.clear();
      this.pendingPlanArtifactSyncs.clear();
      this.isGuestMode = false;

      // 3. Set the new user ID
      LocalDB.setUserId(userId);

      // 4. Set up realtime callbacks
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
        onPlanArtifactCreated: this.handleRemotePlanArtifactCreated.bind(this),
        onPlanArtifactUpdated: this.handleRemotePlanArtifactUpdated.bind(this),
        onPlanArtifactDeleted: this.handleRemotePlanArtifactDeleted.bind(this),
      });

      // 5. Subscribe to realtime updates
      AppwriteRealtime.subscribeToAll(userId);

      // 6. Force fetch fresh data from Appwrite
      devLog('[HybridDB] Fetching fresh data from Appwrite...');

      const [threads, projects] = await Promise.all([
        AppwriteDB.getThreads(),
        AppwriteDB.getProjects()
      ]);

      // 7. Store fresh data in local storage
      LocalDB.replaceAllThreads(threads);
      LocalDB.replaceAllProjects(projects);

      // 8. Emit immediate updates to refresh UI
      debouncedEmitter.emitImmediate('threads_updated', threads);
      debouncedEmitter.emitImmediate('projects_updated', projects);

      // 9. Mark as initialized
      this.initialized = true;
      this.isOnline = true;

      devLog('[HybridDB] Force refresh completed successfully:', {
        threadsCount: threads.length,
        projectsCount: projects.length
      });

    } catch (error) {
      devError('[HybridDB] Force refresh failed:', error);

      // On failure, still mark as initialized but offline
      this.initialized = true;
      this.isOnline = false;

      // Emit empty arrays to clear UI
      debouncedEmitter.emitImmediate('threads_updated', []);
      debouncedEmitter.emitImmediate('projects_updated', []);

      throw error; // Re-throw to let caller handle
    }
  }

  // Get online status
  static isOnlineStatus(): boolean {
    return this.isOnline;
  }

  // Manual trigger for testing - can be called from browser console
  static async testDataRefresh(): Promise<void> {
    const userId = LocalDB.getUserId();
    if (userId) {
      devLog('[HybridDB] Manual data refresh triggered for user:', userId);
      await this.checkAndRefreshIfDataMissing(userId);
    } else {
      devLog('[HybridDB] No user ID found, cannot refresh data');
    }
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
      devError('Failed to force sync thread:', error);
    } finally {
      this.pendingMessageSyncs.delete(`force_${threadId}`);
    }
  }

  // Check if local data is missing and refresh from remote if needed
  static async checkAndRefreshIfDataMissing(userId: string): Promise<void> {
    if (this.isGuestMode) {
      return;
    }

    try {
      // Check if we have any local data
      const localThreads = LocalDB.getThreads();
      const localProjects = LocalDB.getProjects();
      const storedUserId = LocalDB.getUserId();

      // If no local data exists or user ID doesn't match, refresh from remote
      const shouldRefresh = localThreads.length === 0 && localProjects.length === 0 || storedUserId !== userId;

      if (shouldRefresh) {
        devLog('[HybridDB] Local data missing or user mismatch, refreshing from Appwrite...', {
          localThreadsCount: localThreads.length,
          localProjectsCount: localProjects.length,
          storedUserId,
          currentUserId: userId
        });

        // Set the correct user ID
        LocalDB.setUserId(userId);

        // Fetch fresh data from Appwrite
        const [threads, projects] = await Promise.all([
          AppwriteDB.getThreads(),
          AppwriteDB.getProjects()
        ]);

        // Update local storage with fresh data
        LocalDB.replaceAllThreads(threads);
        LocalDB.replaceAllProjects(projects);

        // Emit immediate updates to refresh UI
        debouncedEmitter.emitImmediate('threads_updated', threads);
        debouncedEmitter.emitImmediate('projects_updated', projects);

        devLog('[HybridDB] Data refresh completed successfully:', {
          threadsCount: threads.length,
          projectsCount: projects.length
        });
      }
    } catch (error) {
      devError('[HybridDB] Failed to check and refresh missing data:', error);
      // Don't throw error to avoid blocking the app
    }
  }

  // Force refresh all data from remote (for admin data deletion scenarios)
  static async forceRefreshAllData(): Promise<void> {
    if (this.isGuestMode) {
      return;
    }

    try {
      devLog('[HybridDB] Force refreshing all data from remote...');

      // Clear all local data first
      LocalDB.clear();

      // Fetch fresh data from remote
      const [threads, projects] = await Promise.all([
        AppwriteDB.getThreads(),
        AppwriteDB.getProjects()
      ]);

      // Update local storage with fresh data
      LocalDB.replaceAllThreads(threads);
      LocalDB.replaceAllProjects(projects);

      // Emit immediate updates to refresh UI
      debouncedEmitter.emitImmediate('threads_updated', threads);
      debouncedEmitter.emitImmediate('projects_updated', projects);

      devLog('[HybridDB] Force refresh completed successfully');
    } catch (error) {
      devError('[HybridDB] Force refresh failed:', error);
      // Emit empty arrays to clear UI if remote fetch fails
      debouncedEmitter.emitImmediate('threads_updated', []);
      debouncedEmitter.emitImmediate('projects_updated', []);
    }
  }

  // ============ THREAD SHARING OPERATIONS ============

  // Share a thread (instant local + async remote)
  static async shareThread(threadId: string): Promise<string> {
    // Skip for guest users
    if (this.isGuestMode) {
      throw new Error('Sharing not available for guest users');
    }

    // Generate unique share ID
    const shareId = `share_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const now = new Date();

    // Instant local update
    LocalDB.updateThread(threadId, {
      isShared: true,
      shareId,
      sharedAt: now,
      updatedAt: now
    });

    // Emit immediate updates
    debouncedEmitter.emitImmediate('threads_updated', LocalDB.getThreads());

    // Async remote update
    this.queueSync(async () => {
      try {
        await AppwriteDB.updateThreadSharing(threadId, {
          isShared: true,
          shareId,
          sharedAt: now.toISOString()
        });
      } catch (error) {
        devError('Failed to sync thread sharing:', error);
      }
    });

    return shareId;
  }

  // Unshare a thread (instant local + async remote)
  static async unshareThread(threadId: string): Promise<void> {
    // Skip for guest users
    if (this.isGuestMode) {
      throw new Error('Unsharing not available for guest users');
    }

    const now = new Date();

    // Instant local update
    LocalDB.updateThread(threadId, {
      isShared: false,
      shareId: undefined,
      sharedAt: undefined,
      updatedAt: now
    });

    // Emit immediate updates
    debouncedEmitter.emitImmediate('threads_updated', LocalDB.getThreads());

    // Async remote update
    this.queueSync(async () => {
      try {
        await AppwriteDB.updateThreadSharing(threadId, {
          isShared: false,
          shareId: undefined,
          sharedAt: undefined
        });
      } catch (error) {
        devError('Failed to sync thread unsharing:', error);
      }
    });
  }
}

// Expose HybridDB globally for testing in browser console
if (typeof window !== 'undefined') {
  (window as any).HybridDB = HybridDB;
}
