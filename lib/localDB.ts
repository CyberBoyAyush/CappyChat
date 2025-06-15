/**
 * Local Database Service
 * 
 * Fast local storage with automatic Appwrite synchronization.
 * Provides instant UI updates while maintaining data consistency.
 */

import { Thread, DBMessage, MessageSummary, Project } from './appwriteDB';

// Local storage keys
const STORAGE_KEYS = {
  THREADS: 'atchat_threads',
  MESSAGES: 'atchat_messages',
  SUMMARIES: 'atchat_summaries',
  PROJECTS: 'atchat_projects',
  USER_ID: 'atchat_user_id'
};

export class LocalDB {
  private static currentUserId: string | null = null;
  private static threadsCache: Thread[] | null = null;
  private static messagesCache: Map<string, DBMessage[]> = new Map();
  private static projectsCache: Project[] | null = null;
  private static lastCacheUpdate = 0;
  private static CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL

  // Set current user ID
  static setUserId(userId: string): void {
    this.currentUserId = userId;
    localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
  }

  // Get current user ID
  static getUserId(): string | null {
    if (!this.currentUserId) {
      this.currentUserId = localStorage.getItem(STORAGE_KEYS.USER_ID);
    }
    return this.currentUserId;
  }

  // Clear all local data
  static clear(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    this.currentUserId = null;
    // Clear caches
    this.threadsCache = null;
    this.messagesCache.clear();
    this.projectsCache = null;
    this.lastCacheUpdate = 0;
  }

  // ============ THREAD OPERATIONS ============

  // Get all threads (instant from local storage with caching)
  static getThreads(): Thread[] {
    try {
      // Use cache if available and not expired
      const now = Date.now();
      if (this.threadsCache && (now - this.lastCacheUpdate) < this.CACHE_TTL) {
        return [...this.threadsCache]; // Return a copy to prevent mutations
      }

      const data = localStorage.getItem(STORAGE_KEYS.THREADS);
      if (!data) {
        this.threadsCache = [];
        this.lastCacheUpdate = now;
        return [];
      }
      
      const threads = JSON.parse(data);
      // Convert date strings back to Date objects and sort by lastMessageAt
      this.threadsCache = threads.map((thread: any) => ({
        ...thread,
        createdAt: new Date(thread.createdAt),
        updatedAt: new Date(thread.updatedAt),
        lastMessageAt: new Date(thread.lastMessageAt)
      })).sort((a: Thread, b: Thread) => 
        new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      );
      
      this.lastCacheUpdate = now;
      return this.threadsCache ? [...this.threadsCache] : [];
    } catch (error) {
      console.error('Error reading threads from local storage:', error);
      return [];
    }
  }

  // Add or update thread (instant local update with cache invalidation)
  static upsertThread(thread: Thread): void {
    try {
      const threads = this.getThreads();
      const existingIndex = threads.findIndex(t => t.id === thread.id);
      
      if (existingIndex >= 0) {
        threads[existingIndex] = thread;
      } else {
        threads.unshift(thread);
      }
      
      // Sort by pin status first, then by lastMessageAt
      threads.sort((a, b) => {
        // Pinned threads come first
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;

        // Within same pin status, sort by lastMessageAt
        return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
      });
      
      localStorage.setItem(STORAGE_KEYS.THREADS, JSON.stringify(threads));
      
      // Update cache
      this.threadsCache = threads;
      this.lastCacheUpdate = Date.now();
    } catch (error) {
      console.error('Error saving thread to local storage:', error);
    }
  }

  // Delete thread (instant local update with cache invalidation)
  static deleteThread(threadId: string): void {
    try {
      const threads = this.getThreads().filter(t => t.id !== threadId);
      localStorage.setItem(STORAGE_KEYS.THREADS, JSON.stringify(threads));
      
      // Update cache
      this.threadsCache = threads;
      this.lastCacheUpdate = Date.now();
      
      // Also delete associated messages and summaries
      this.deleteMessagesByThread(threadId);
      this.deleteSummariesByThread(threadId);
    } catch (error) {
      console.error('Error deleting thread from local storage:', error);
    }
  }

  // Update thread title and timestamp
  static updateThread(threadId: string, updates: Partial<Thread>): void {
    try {
      console.log('[LocalDB] Updating thread:', { threadId, updates });
      const threads = this.getThreads();
      console.log('[LocalDB] Current threads:', threads.map(t => ({ id: t.id, title: t.title })));
      const index = threads.findIndex(t => t.id === threadId);
      
      if (index >= 0) {
        const oldThread = threads[index];
        threads[index] = { ...threads[index], ...updates };
        console.log('[LocalDB] Thread updated:', { 
          old: { id: oldThread.id, title: oldThread.title }, 
          new: { id: threads[index].id, title: threads[index].title }
        });
        
        // Sort if lastMessageAt or isPinned was updated
        if (updates.lastMessageAt || updates.isPinned !== undefined) {
          threads.sort((a, b) => {
            // Pinned threads come first
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;

            // Within same pin status, sort by lastMessageAt
            return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
          });
        }
        
        localStorage.setItem(STORAGE_KEYS.THREADS, JSON.stringify(threads));
        
        // Update cache for instant UI updates
        this.threadsCache = threads;
        this.lastCacheUpdate = Date.now();
        console.log('[LocalDB] Cache updated with', threads.length, 'threads');
      } else {
        console.warn('[LocalDB] Thread not found:', threadId, 'Available threads:', threads.map(t => t.id));
      }
    } catch (error) {
      console.error('Error updating thread in local storage:', error);
    }
  }

  // ============ MESSAGE OPERATIONS ============

  // Get messages by thread ID
  static getMessagesByThread(threadId: string): DBMessage[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      if (!data) return [];
      
      const allMessages = JSON.parse(data);
      return allMessages
        .filter((msg: any) => msg.threadId === threadId)
        .map((msg: any) => ({
          ...msg,
          createdAt: new Date(msg.createdAt)
        }))
        .sort((a: DBMessage, b: DBMessage) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
    } catch (error) {
      console.error('Error reading messages from local storage:', error);
      return [];
    }
  }

  // Add message (instant local update)
  static addMessage(message: DBMessage): void {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      const messages = data ? JSON.parse(data) : [];
      
      // Check if message already exists
      const existingIndex = messages.findIndex((m: any) => m.id === message.id);
      if (existingIndex >= 0) {
        messages[existingIndex] = message;
      } else {
        messages.push(message);
      }
      
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
      
      // Update thread's lastMessageAt
      this.updateThread(message.threadId, {
        lastMessageAt: message.createdAt,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error saving message to local storage:', error);
    }
  }

  // Delete messages by thread ID
  private static deleteMessagesByThread(threadId: string): void {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      if (!data) return;
      
      const messages = JSON.parse(data);
      const filteredMessages = messages.filter((msg: any) => msg.threadId !== threadId);
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(filteredMessages));
    } catch (error) {
      console.error('Error deleting messages from local storage:', error);
    }
  }

  // Clear messages by thread ID (public method for sync operations)
  static clearMessagesByThread(threadId: string): void {
    this.deleteMessagesByThread(threadId);
  }

  // ============ MESSAGE SUMMARY OPERATIONS ============

  // Get message summaries by thread ID
  static getSummariesByThread(threadId: string): MessageSummary[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SUMMARIES);
      if (!data) return [];
      
      const allSummaries = JSON.parse(data);
      return allSummaries
        .filter((summary: any) => summary.threadId === threadId)
        .map((summary: any) => ({
          ...summary,
          createdAt: new Date(summary.createdAt)
        }))
        .sort((a: MessageSummary, b: MessageSummary) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
    } catch (error) {
      console.error('Error reading summaries from local storage:', error);
      return [];
    }
  }

  // Add message summary (instant local update)
  static addSummary(summary: MessageSummary): void {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SUMMARIES);
      const summaries = data ? JSON.parse(data) : [];
      
      // Check if summary already exists
      const existingIndex = summaries.findIndex((s: any) => s.id === summary.id);
      if (existingIndex >= 0) {
        summaries[existingIndex] = summary;
      } else {
        summaries.push(summary);
      }
      
      localStorage.setItem(STORAGE_KEYS.SUMMARIES, JSON.stringify(summaries));
    } catch (error) {
      console.error('Error saving summary to local storage:', error);
    }
  }

  // Delete summaries by thread ID
  private static deleteSummariesByThread(threadId: string): void {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SUMMARIES);
      if (!data) return;
      
      const summaries = JSON.parse(data);
      const filteredSummaries = summaries.filter((summary: any) => summary.threadId !== threadId);
      localStorage.setItem(STORAGE_KEYS.SUMMARIES, JSON.stringify(filteredSummaries));
    } catch (error) {
      console.error('Error deleting summaries from local storage:', error);
    }
  }

  // ============ PROJECT OPERATIONS ============

  // Get all projects (instant from local storage)
  static getProjects(): Project[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      if (!data) return [];

      const projects = JSON.parse(data);
      return projects.map((project: any) => ({
        ...project,
        createdAt: new Date(project.createdAt),
        updatedAt: new Date(project.updatedAt)
      }));
    } catch (error) {
      console.error('Error loading projects from local storage:', error);
      return [];
    }
  }

  // Add or update project (instant local update)
  static upsertProject(project: Project): void {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      const projects = data ? JSON.parse(data) : [];

      // Check if project already exists
      const existingIndex = projects.findIndex((p: any) => p.id === project.id);
      if (existingIndex >= 0) {
        projects[existingIndex] = project;
      } else {
        projects.push(project);
      }

      // Sort projects by updatedAt (most recent first)
      projects.sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    } catch (error) {
      console.error('Error saving project to local storage:', error);
    }
  }

  // Update project (instant local update)
  static updateProject(projectId: string, updates: Partial<Project>): void {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      if (!data) return;

      const projects = JSON.parse(data);
      const projectIndex = projects.findIndex((p: any) => p.id === projectId);

      if (projectIndex >= 0) {
        projects[projectIndex] = { ...projects[projectIndex], ...updates };

        // Sort projects by updatedAt (most recent first)
        projects.sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

        localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
      }
    } catch (error) {
      console.error('Error updating project in local storage:', error);
    }
  }

  // Delete project (instant local update)
  static deleteProject(projectId: string): void {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      if (!data) return;

      const projects = JSON.parse(data);
      const filteredProjects = projects.filter((p: any) => p.id !== projectId);

      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(filteredProjects));
    } catch (error) {
      console.error('Error deleting project from local storage:', error);
    }
  }

  // ============ SYNC OPERATIONS ============

  // Replace all threads (used during sync)
  static replaceAllThreads(threads: Thread[]): void {
    try {
      // Sort before storing - pinned threads first, then by lastMessageAt
      const sortedThreads = threads.sort((a, b) => {
        // Pinned threads come first
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;

        // Within same pin status, sort by lastMessageAt
        return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
      });
      
      localStorage.setItem(STORAGE_KEYS.THREADS, JSON.stringify(sortedThreads));
      
      // Update cache
      this.threadsCache = sortedThreads;
      this.lastCacheUpdate = Date.now();
    } catch (error) {
      console.error('Error replacing threads in local storage:', error);
    }
  }

  // Replace all projects (used during sync)
  static replaceAllProjects(projects: Project[]): void {
    try {
      // Sort projects by updatedAt (most recent first)
      const sortedProjects = projects.sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(sortedProjects));

      // Update cache
      this.projectsCache = sortedProjects;
      this.lastCacheUpdate = Date.now();
    } catch (error) {
      console.error('Error replacing projects in local storage:', error);
    }
  }

  // Replace all messages for a thread (used during sync)
  static replaceMessagesForThread(threadId: string, messages: DBMessage[]): void {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      const allMessages = data ? JSON.parse(data) : [];
      
      // Remove existing messages for this thread
      const filteredMessages = allMessages.filter((msg: any) => msg.threadId !== threadId);
      
      // Add new messages
      const updatedMessages = [...filteredMessages, ...messages];
      
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(updatedMessages));
    } catch (error) {
      console.error('Error replacing messages in local storage:', error);
    }
  }

  // Replace all summaries for a thread (used during sync)
  static replaceSummariesForThread(threadId: string, summaries: MessageSummary[]): void {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SUMMARIES);
      const allSummaries = data ? JSON.parse(data) : [];
      
      // Remove existing summaries for this thread
      const filteredSummaries = allSummaries.filter((summary: any) => summary.threadId !== threadId);
      
      // Add new summaries
      const updatedSummaries = [...filteredSummaries, ...summaries];
      
      localStorage.setItem(STORAGE_KEYS.SUMMARIES, JSON.stringify(updatedSummaries));
    } catch (error) {
      console.error('Error replacing summaries in local storage:', error);
    }
  }
}
