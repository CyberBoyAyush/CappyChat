/**
 * Local Database Service
 * 
 * Fast local storage with automatic Appwrite synchronization.
 * Provides instant UI updates while maintaining data consistency.
 */

import { Thread, DBMessage, MessageSummary, Project, PlanArtifact } from './appwriteDB';
import { devLog, devWarn, devInfo, devError, prodError } from './logger';

// Local storage keys
const STORAGE_KEYS = {
  THREADS: 'atchat_threads',
  MESSAGES: 'atchat_messages',
  SUMMARIES: 'atchat_summaries',
  PROJECTS: 'atchat_projects',
  PLAN_ARTIFACTS: 'atchat_plan_artifacts',
  USER_ID: 'atchat_user_id'
};

export class LocalDB {
  private static currentUserId: string | null = null;
  // Removed caching for real-time sync - always fetch fresh data

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
    // No caches to clear - real-time sync only
  }

  // ============ THREAD OPERATIONS ============

  // Get all threads (real-time, no caching)
  static getThreads(): Thread[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.THREADS);
      if (!data) {
        return [];
      }

      const threads = JSON.parse(data);
      // Convert date strings back to Date objects and sort by lastMessageAt
      return threads.map((thread: any) => ({
        ...thread,
        createdAt: new Date(thread.createdAt),
        updatedAt: new Date(thread.updatedAt),
        lastMessageAt: new Date(thread.lastMessageAt)
      })).sort((a: Thread, b: Thread) => {
        // Pinned threads come first
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        // Within same pin status, sort by lastMessageAt
        return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
      });
    } catch (error) {
      devError('Error reading threads from local storage:', error);
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
      
      // No cache to update - real-time sync only
    } catch (error) {
      devError('Error saving thread to local storage:', error);
    }
  }

  // Delete thread (instant local update with cache invalidation)
  static deleteThread(threadId: string): void {
    try {
      const threads = this.getThreads().filter(t => t.id !== threadId);
      localStorage.setItem(STORAGE_KEYS.THREADS, JSON.stringify(threads));
      
      // No cache to update - real-time sync only
      
      // Also delete associated messages and summaries
      this.deleteMessagesByThread(threadId);
      this.deleteSummariesByThread(threadId);
      this.deletePlanArtifactsByThread(threadId);
    } catch (error) {
      devError('Error deleting thread from local storage:', error);
    }
  }

  // Update thread title and timestamp
  static updateThread(threadId: string, updates: Partial<Thread>): void {
    try {
      devLog('[LocalDB] Updating thread:', { threadId, updates });
      const threads = this.getThreads();
      devLog('[LocalDB] Current threads:', threads.map(t => ({ id: t.id, title: t.title })));
      const index = threads.findIndex(t => t.id === threadId);
      
      if (index >= 0) {
        const oldThread = threads[index];
        threads[index] = { ...threads[index], ...updates };
        devLog('[LocalDB] Thread updated:', { 
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
        
        // No cache to update - real-time sync only
        devLog('[LocalDB] Thread updated with', threads.length, 'threads');
      } else {
        devWarn('[LocalDB] Thread not found:', threadId, 'Available threads:', threads.map(t => t.id));
      }
    } catch (error) {
      devError('Error updating thread in local storage:', error);
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
      devError('Error reading messages from local storage:', error);
      return [];
    }
  }

  // Add message (instant local update with strict duplicate prevention)
  static addMessage(message: DBMessage): void {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      const messages = data ? JSON.parse(data) : [];

      // Strict duplicate check - check both ID and content to prevent any duplicates
      const existingIndex = messages.findIndex((m: any) => {
        // Primary check: same ID
        if (m.id === message.id) return true;

        // Secondary check: same content, role, threadId, and imgurl (potential duplicate with different ID)
        if (m.threadId === message.threadId &&
            m.role === message.role &&
            m.content === message.content &&
            m.imgurl === message.imgurl &&
            Math.abs(new Date(m.createdAt).getTime() - new Date(message.createdAt).getTime()) < 1000) {
          devWarn('[LocalDB] Potential duplicate message detected:', {
            existing: { id: m.id, content: m.content.substring(0, 50), imgurl: m.imgurl },
            new: { id: message.id, content: message.content.substring(0, 50), imgurl: message.imgurl }
          });
          return true;
        }

        return false;
      });

      if (existingIndex >= 0) {
        // Update existing message
        messages[existingIndex] = message;
        devLog('[LocalDB] Updated existing message:', message.id);
      } else {
        // Add new message
        messages.push(message);
        devLog('[LocalDB] Added new message:', message.id);
      }

      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));

      // Update thread's lastMessageAt
      this.updateThread(message.threadId, {
        lastMessageAt: message.createdAt,
        updatedAt: new Date()
      });
    } catch (error) {
      devError('Error saving message to local storage:', error);
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
      devError('Error deleting messages from local storage:', error);
    }
  }

  // Clear messages by thread ID (public method for sync operations)
  static clearMessagesByThread(threadId: string): void {
    this.deleteMessagesByThread(threadId);
  }

  // ============ PLAN ARTIFACT OPERATIONS ============

  private static getAllPlanArtifacts(): PlanArtifact[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PLAN_ARTIFACTS);
      if (!data) return [];

      const artifacts = JSON.parse(data);
      return artifacts.map((artifact: any) => ({
        ...artifact,
        createdAt: new Date(artifact.createdAt),
        updatedAt: new Date(artifact.updatedAt),
      }));
    } catch (error) {
      devError('Error loading plan artifacts from local storage:', error);
      return [];
    }
  }

  private static saveAllPlanArtifacts(artifacts: PlanArtifact[]): void {
    try {
      const serializable = artifacts.map((artifact) => ({
        ...artifact,
        createdAt:
          artifact.createdAt instanceof Date
            ? artifact.createdAt.toISOString()
            : new Date(artifact.createdAt).toISOString(),
        updatedAt:
          artifact.updatedAt instanceof Date
            ? artifact.updatedAt.toISOString()
            : new Date(artifact.updatedAt).toISOString(),
      }));
      localStorage.setItem(
        STORAGE_KEYS.PLAN_ARTIFACTS,
        JSON.stringify(serializable)
      );
    } catch (error) {
      devError('Error saving plan artifacts to local storage:', error);
    }
  }

  static upsertPlanArtifacts(artifacts: PlanArtifact[]): void {
    if (!artifacts || artifacts.length === 0) return;
    try {
      const existing = this.getAllPlanArtifacts();
      const merged = new Map<string, PlanArtifact>();

      for (const item of existing) {
        merged.set(item.id, item);
      }

      for (const artifact of artifacts) {
        merged.set(artifact.id, artifact);
      }

      const ordered = Array.from(merged.values()).sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      );

      this.saveAllPlanArtifacts(ordered);
    } catch (error) {
      devError('Error upserting plan artifacts in local storage:', error);
    }
  }

  static replacePlanArtifactsForThread(
    threadId: string,
    artifacts: PlanArtifact[]
  ): void {
    try {
      const existing = this.getAllPlanArtifacts().filter(
        (artifact) => artifact.threadId !== threadId
      );

      const combined = existing.concat(artifacts);
      combined.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      this.saveAllPlanArtifacts(combined);
    } catch (error) {
      devError('Error replacing plan artifacts for thread:', error);
    }
  }

  static getPlanArtifactsByThread(threadId: string): PlanArtifact[] {
    return this.getAllPlanArtifacts()
      .filter((artifact) => artifact.threadId === threadId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  static getPlanArtifactsByMessage(
    threadId: string,
    messageId: string
  ): PlanArtifact[] {
    return this.getAllPlanArtifacts()
      .filter(
        (artifact) =>
          artifact.threadId === threadId && artifact.messageId === messageId
      )
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  static deletePlanArtifactsByThread(threadId: string): void {
    try {
      const remaining = this.getAllPlanArtifacts().filter(
        (artifact) => artifact.threadId !== threadId
      );
      this.saveAllPlanArtifacts(remaining);
    } catch (error) {
      devError('Error deleting plan artifacts by thread:', error);
    }
  }

  static clearPlanArtifacts(): void {
    localStorage.removeItem(STORAGE_KEYS.PLAN_ARTIFACTS);
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
      devError('Error reading summaries from local storage:', error);
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
      devError('Error saving summary to local storage:', error);
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
      devError('Error deleting summaries from local storage:', error);
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
      devError('Error loading projects from local storage:', error);
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
      devError('Error saving project to local storage:', error);
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
      devError('Error updating project in local storage:', error);
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
      devError('Error deleting project from local storage:', error);
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
      
      // No cache to update - real-time sync only
    } catch (error) {
      devError('Error replacing threads in local storage:', error);
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

      // No cache to update - real-time sync only
    } catch (error) {
      devError('Error replacing projects in local storage:', error);
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
      devError('Error replacing messages in local storage:', error);
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
      devError('Error replacing summaries in local storage:', error);
    }
  }
}
