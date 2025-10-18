/**
 * Appwrite Realtime Service
 * 
 * Provides realtime subscriptions to Appwrite events for data synchronization.
 * UI state is updated directly from Appwrite events with no local DB.
 */

import { RealtimeResponseEvent } from 'appwrite';
import { client } from './appwrite';
import {
  DATABASE_ID,
  THREADS_COLLECTION_ID,
  MESSAGES_COLLECTION_ID,
  MESSAGE_SUMMARIES_COLLECTION_ID,
  PROJECTS_COLLECTION_ID,
  PLAN_ARTIFACTS_COLLECTION_ID,
  AppwriteThread,
  AppwriteMessage,
  AppwriteMessageSummary,
  AppwriteProject,
  AppwritePlanArtifact
} from './appwriteDB';

// Object to store callback events for UI updates
type RealtimeCallbacks = {
  onThreadCreated?: (thread: AppwriteThread) => void;
  onThreadUpdated?: (thread: AppwriteThread) => void;
  onThreadDeleted?: (thread: AppwriteThread) => void;
  onMessageCreated?: (message: AppwriteMessage) => void;
  onMessageUpdated?: (message: AppwriteMessage) => void;
  onMessageDeleted?: (message: AppwriteMessage) => void;
  onMessageSummaryCreated?: (summary: AppwriteMessageSummary) => void;
  onMessageSummaryUpdated?: (summary: AppwriteMessageSummary) => void;
  onMessageSummaryDeleted?: (summary: AppwriteMessageSummary) => void;
  onProjectCreated?: (project: AppwriteProject) => void;
  onProjectUpdated?: (project: AppwriteProject) => void;
  onProjectDeleted?: (project: AppwriteProject) => void;
  onPlanArtifactCreated?: (artifact: AppwritePlanArtifact) => void;
  onPlanArtifactUpdated?: (artifact: AppwritePlanArtifact) => void;
  onPlanArtifactDeleted?: (artifact: AppwritePlanArtifact) => void;
};

export class AppwriteRealtime {
  private static subscriptions: Map<string, () => void> = new Map();
  private static callbacks: RealtimeCallbacks = {};
  
  // Set callbacks for UI updates
  static setCallbacks(callbacks: RealtimeCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }
  
  // Subscribe to all collections (threads, messages, message_summaries, projects, plan_artifacts)
  static subscribeToAll(userId: string): void {
    this.subscribeToThreads(userId);
    this.subscribeToMessages(userId);
    this.subscribeToMessageSummaries(userId);
    this.subscribeToProjects(userId);
    this.subscribeToPlanArtifacts(userId);
  }
  
  // Unsubscribe from all collections
  static unsubscribeFromAll(): void {
    for (const unsubscribe of this.subscriptions.values()) {
      unsubscribe();
    }
    this.subscriptions.clear();
  }
  
  // Subscribe to thread collection changes (including collaborative threads)
  static subscribeToThreads(userId: string): void {
    if (this.subscriptions.has('threads')) {
      console.log('[AppwriteRealtime] Already subscribed to threads');
      return; // Already subscribed
    }

    const unsubscribe = client.subscribe(
      `databases.${DATABASE_ID}.collections.${THREADS_COLLECTION_ID}.documents`,
      async (response: RealtimeResponseEvent<AppwriteThread>) => {
        const payload = response.payload;
        if (!payload) return;

        // Always process events for the current user's threads
        const isOwnThread = payload.userId === userId;

        // For threads from other users, check if it's in a collaborative project
        let isCollaborativeThread = false;
        if (!isOwnThread && payload.projectId) {
          isCollaborativeThread = await this.isUserMemberOfProject(userId, payload.projectId);
        }

        // Process the event if it's the user's own thread OR a collaborative thread
        if (isOwnThread || isCollaborativeThread) {
          const eventType = response.events[0];

          if (eventType.includes('.create')) {
            this.handleThreadCreated(payload);
          } else if (eventType.includes('.update')) {
            this.handleThreadUpdated(payload);
          } else if (eventType.includes('.delete')) {
            this.handleThreadDeleted(payload);
          }
        }
      }
    );

    this.subscriptions.set('threads', unsubscribe);
    console.log('[AppwriteRealtime] Successfully subscribed to threads (including collaborative)');
  }

  // Helper method to check if user is a member of a project
  private static async isUserMemberOfProject(userId: string, projectId: string): Promise<boolean> {
    try {
      // Import AppwriteDB here to avoid circular dependency
      const { AppwriteDB } = await import('./appwriteDB');

      // Check if user is project owner
      const isOwner = await AppwriteDB.isProjectOwner(projectId);
      if (isOwner) return true;

      // Check if user is in project members
      const members = await AppwriteDB.getProjectMembers(projectId);
      return members.includes(userId);
    } catch (error) {
      console.error('[AppwriteRealtime] Error checking project membership:', error);
      return false;
    }
  }

  // Helper method to check if user is a member of a thread (via project membership)
  private static async isUserMemberOfThread(userId: string, threadId: string): Promise<boolean> {
    try {
      // Import AppwriteDB here to avoid circular dependency
      const { AppwriteDB } = await import('./appwriteDB');

      // Get the thread to find its project ID
      const threads = await AppwriteDB.getThreads();
      const thread = threads.find(t => t.id === threadId);

      if (!thread || !thread.projectId) {
        return false; // Not a collaborative thread
      }

      // Check if user is a member of the thread's project
      return await this.isUserMemberOfProject(userId, thread.projectId);
    } catch (error) {
      console.error('[AppwriteRealtime] Error checking thread membership:', error);
      return false;
    }
  }
  
  // Subscribe to message collection changes (including collaborative messages)
  static subscribeToMessages(userId: string): void {
    if (this.subscriptions.has('messages')) {
      console.log('[AppwriteRealtime] Already subscribed to messages');
      return; // Already subscribed
    }

    const unsubscribe = client.subscribe(
      `databases.${DATABASE_ID}.collections.${MESSAGES_COLLECTION_ID}.documents`,
      async (response: RealtimeResponseEvent<AppwriteMessage>) => {
        const payload = response.payload;
        if (!payload) return;

        // Always process events for the current user's messages
        const isOwnMessage = payload.userId === userId;

        // For messages from other users, check if it's in a collaborative thread
        let isCollaborativeMessage = false;
        if (!isOwnMessage && payload.threadId) {
          isCollaborativeMessage = await this.isUserMemberOfThread(userId, payload.threadId);
        }

        // Process the event if it's the user's own message OR a collaborative message
        if (isOwnMessage || isCollaborativeMessage) {
          const eventType = response.events[0];

          if (eventType.includes('.create')) {
            this.handleMessageCreated(payload);
          } else if (eventType.includes('.update')) {
            this.handleMessageUpdated(payload);
          } else if (eventType.includes('.delete')) {
            this.handleMessageDeleted(payload);
          }
        }
      }
    );

    this.subscriptions.set('messages', unsubscribe);
    console.log('[AppwriteRealtime] Successfully subscribed to messages');
  }
  
  // Subscribe to message summary collection changes
  static subscribeToMessageSummaries(userId: string): void {
    if (this.subscriptions.has('message_summaries')) {
      return; // Already subscribed
    }
    
    const unsubscribe = client.subscribe(
      `databases.${DATABASE_ID}.collections.${MESSAGE_SUMMARIES_COLLECTION_ID}.documents`,
      (response: RealtimeResponseEvent<AppwriteMessageSummary>) => {
        // Process only events for the current user
        if (response.payload?.userId !== userId) {
          return;
        }
        
        // Handle different event types
        switch (response.events[0]) {
          case 'databases.*.collections.*.documents.*.create':
            this.handleMessageSummaryCreated(response.payload);
            break;
          case 'databases.*.collections.*.documents.*.update':
            this.handleMessageSummaryUpdated(response.payload);
            break;
          case 'databases.*.collections.*.documents.*.delete':
            this.handleMessageSummaryDeleted(response.payload);
            break;
        }
      }
    );
    
    this.subscriptions.set('message_summaries', unsubscribe);
  }

  // Subscribe to project collection changes
  static subscribeToProjects(userId: string): void {
    if (this.subscriptions.has('projects')) {
      console.log('[AppwriteRealtime] Already subscribed to projects');
      return; // Already subscribed
    }

    const unsubscribe = client.subscribe(
      `databases.${DATABASE_ID}.collections.${PROJECTS_COLLECTION_ID}.documents`,
      (response: RealtimeResponseEvent<AppwriteProject>) => {
        // Process only events for the current user
        if (response.payload?.userId !== userId) {
          return;
        }

        // Handle different event types - check if event contains the action
        const eventType = response.events[0];

        if (eventType.includes('.create')) {
          this.handleProjectCreated(response.payload);
        } else if (eventType.includes('.update')) {
          this.handleProjectUpdated(response.payload);
        } else if (eventType.includes('.delete')) {
          this.handleProjectDeleted(response.payload);
        }
      }
    );

    this.subscriptions.set('projects', unsubscribe);
    console.log('[AppwriteRealtime] Successfully subscribed to projects');
  }

  // Subscribe to plan artifacts collection changes
  static subscribeToPlanArtifacts(userId: string): void {
    if (this.subscriptions.has('plan_artifacts')) {
      console.log('[AppwriteRealtime] Already subscribed to plan artifacts');
      return; // Already subscribed
    }

    const unsubscribe = client.subscribe(
      `databases.${DATABASE_ID}.collections.${PLAN_ARTIFACTS_COLLECTION_ID}.documents`,
      (response: RealtimeResponseEvent<AppwritePlanArtifact>) => {
        // Process only events for the current user
        if (response.payload?.userId !== userId) {
          return;
        }

        // Handle different event types
        const eventType = response.events[0];

        if (eventType.includes('.create')) {
          this.handlePlanArtifactCreated(response.payload);
        } else if (eventType.includes('.update')) {
          this.handlePlanArtifactUpdated(response.payload);
        } else if (eventType.includes('.delete')) {
          this.handlePlanArtifactDeleted(response.payload);
        }
      }
    );

    this.subscriptions.set('plan_artifacts', unsubscribe);
    console.log('[AppwriteRealtime] Successfully subscribed to plan artifacts');
  }

  // --------- Thread Event Handlers ---------
  
  // Handle thread created event
  private static handleThreadCreated(thread: AppwriteThread): void {
    // Trigger UI update callback
    if (this.callbacks.onThreadCreated) {
      this.callbacks.onThreadCreated(thread);
    }
  }
  
  // Handle thread updated event
  private static handleThreadUpdated(thread: AppwriteThread): void {
    // Trigger UI update callback
    if (this.callbacks.onThreadUpdated) {
      this.callbacks.onThreadUpdated(thread);
    }
  }
  
  // Handle thread deleted event
  private static handleThreadDeleted(thread: AppwriteThread): void {
    // Trigger UI update callback
    if (this.callbacks.onThreadDeleted) {
      this.callbacks.onThreadDeleted(thread);
    }
  }
  
  // --------- Message Event Handlers ---------
  
  // Handle message created event
  private static handleMessageCreated(message: AppwriteMessage): void {
    // Trigger UI update callback
    if (this.callbacks.onMessageCreated) {
      this.callbacks.onMessageCreated(message);
    }
  }
  
  // Handle message updated event
  private static handleMessageUpdated(message: AppwriteMessage): void {
    // Trigger UI update callback
    if (this.callbacks.onMessageUpdated) {
      this.callbacks.onMessageUpdated(message);
    }
  }
  
  // Handle message deleted event
  private static handleMessageDeleted(message: AppwriteMessage): void {
    // Trigger UI update callback
    if (this.callbacks.onMessageDeleted) {
      this.callbacks.onMessageDeleted(message);
    }
  }
  
  // --------- Message Summary Event Handlers ---------
  
  // Handle message summary created event
  private static handleMessageSummaryCreated(summary: AppwriteMessageSummary): void {
    // Trigger UI update callback
    if (this.callbacks.onMessageSummaryCreated) {
      this.callbacks.onMessageSummaryCreated(summary);
    }
  }
  
  // Handle message summary updated event
  private static handleMessageSummaryUpdated(summary: AppwriteMessageSummary): void {
    // Trigger UI update callback
    if (this.callbacks.onMessageSummaryUpdated) {
      this.callbacks.onMessageSummaryUpdated(summary);
    }
  }
  
  // Handle message summary deleted event
  private static handleMessageSummaryDeleted(summary: AppwriteMessageSummary): void {
    // Trigger UI update callback
    if (this.callbacks.onMessageSummaryDeleted) {
      this.callbacks.onMessageSummaryDeleted(summary);
    }
  }

  // --------- Project Event Handlers ---------

  // Handle project created event
  private static handleProjectCreated(project: AppwriteProject): void {
    // Trigger UI update callback
    if (this.callbacks.onProjectCreated) {
      this.callbacks.onProjectCreated(project);
    }
  }

  // Handle project updated event
  private static handleProjectUpdated(project: AppwriteProject): void {
    // Trigger UI update callback
    if (this.callbacks.onProjectUpdated) {
      this.callbacks.onProjectUpdated(project);
    }
  }

  // Handle project deleted event
  private static handleProjectDeleted(project: AppwriteProject): void {
    // Trigger UI update callback
    if (this.callbacks.onProjectDeleted) {
      this.callbacks.onProjectDeleted(project);
    }
  }

  // --------- Plan Artifact Event Handlers ---------

  // Handle plan artifact created event
  private static handlePlanArtifactCreated(artifact: AppwritePlanArtifact): void {
    // Trigger UI update callback
    if (this.callbacks.onPlanArtifactCreated) {
      this.callbacks.onPlanArtifactCreated(artifact);
    }
  }

  // Handle plan artifact updated event
  private static handlePlanArtifactUpdated(artifact: AppwritePlanArtifact): void {
    // Trigger UI update callback
    if (this.callbacks.onPlanArtifactUpdated) {
      this.callbacks.onPlanArtifactUpdated(artifact);
    }
  }

  // Handle plan artifact deleted event
  private static handlePlanArtifactDeleted(artifact: AppwritePlanArtifact): void {
    // Trigger UI update callback
    if (this.callbacks.onPlanArtifactDeleted) {
      this.callbacks.onPlanArtifactDeleted(artifact);
    }
  }
}
