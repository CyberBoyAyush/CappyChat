/**
 * Appwrite Realtime Service
 * 
 * Provides realtime subscriptions to Appwrite events for data synchronization.
 * UI state is updated directly from Appwrite events with no local DB.
 */

import { Client, RealtimeResponseEvent } from 'appwrite';
import { client } from './appwrite';
import {
  DATABASE_ID,
  THREADS_COLLECTION_ID,
  MESSAGES_COLLECTION_ID,
  MESSAGE_SUMMARIES_COLLECTION_ID,
  PROJECTS_COLLECTION_ID,
  AppwriteThread,
  AppwriteMessage,
  AppwriteMessageSummary,
  AppwriteProject
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
};

export class AppwriteRealtime {
  private static subscriptions: Map<string, () => void> = new Map();
  private static callbacks: RealtimeCallbacks = {};
  
  // Set callbacks for UI updates
  static setCallbacks(callbacks: RealtimeCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }
  
  // Subscribe to all collections (threads, messages, message_summaries, projects)
  static subscribeToAll(userId: string): void {
    console.log('[AppwriteRealtime] Subscribing to all collections for user:', userId);
    this.subscribeToThreads(userId);
    this.subscribeToMessages(userId);
    this.subscribeToMessageSummaries(userId);
    this.subscribeToProjects(userId);
  }
  
  // Unsubscribe from all collections
  static unsubscribeFromAll(): void {
    for (const unsubscribe of this.subscriptions.values()) {
      unsubscribe();
    }
    this.subscriptions.clear();
  }
  
  // Subscribe to thread collection changes
  static subscribeToThreads(userId: string): void {
    if (this.subscriptions.has('threads')) {
      console.log('[AppwriteRealtime] Already subscribed to threads');
      return; // Already subscribed
    }

    console.log('[AppwriteRealtime] Subscribing to threads collection');
    const unsubscribe = client.subscribe(
      `databases.${DATABASE_ID}.collections.${THREADS_COLLECTION_ID}.documents`,
      (response: RealtimeResponseEvent<AppwriteThread>) => {
        console.log('[AppwriteRealtime] Thread event received:', response.events[0], response.payload);

        // Process only events for the current user
        if (response.payload?.userId !== userId) {
          console.log('[AppwriteRealtime] Thread event ignored - different user:', response.payload?.userId, 'vs', userId);
          return;
        }

        // Handle different event types - check if event contains the action
        const eventType = response.events[0];
        console.log('[AppwriteRealtime] Thread event type:', eventType);

        if (eventType.includes('.create')) {
          console.log('[AppwriteRealtime] Thread created:', response.payload.threadId);
          this.handleThreadCreated(response.payload);
        } else if (eventType.includes('.update')) {
          console.log('[AppwriteRealtime] Thread updated:', response.payload.threadId);
          this.handleThreadUpdated(response.payload);
        } else if (eventType.includes('.delete')) {
          console.log('[AppwriteRealtime] Thread deleted:', response.payload.threadId);
          this.handleThreadDeleted(response.payload);
        } else {
          console.log('[AppwriteRealtime] Unknown thread event type:', eventType);
        }
      }
    );

    this.subscriptions.set('threads', unsubscribe);
    console.log('[AppwriteRealtime] Successfully subscribed to threads');
  }
  
  // Subscribe to message collection changes
  static subscribeToMessages(userId: string): void {
    if (this.subscriptions.has('messages')) {
      console.log('[AppwriteRealtime] Already subscribed to messages');
      return; // Already subscribed
    }

    console.log('[AppwriteRealtime] Subscribing to messages collection');
    const unsubscribe = client.subscribe(
      `databases.${DATABASE_ID}.collections.${MESSAGES_COLLECTION_ID}.documents`,
      (response: RealtimeResponseEvent<AppwriteMessage>) => {
        console.log('[AppwriteRealtime] Message event received:', response.events[0], response.payload);

        // Process only events for the current user
        if (response.payload?.userId !== userId) {
          console.log('[AppwriteRealtime] Message event ignored - different user:', response.payload?.userId, 'vs', userId);
          return;
        }

        // Handle different event types - check if event contains the action
        const eventType = response.events[0];
        console.log('[AppwriteRealtime] Message event type:', eventType);

        if (eventType.includes('.create')) {
          console.log('[AppwriteRealtime] Message created:', response.payload.messageId, 'in thread:', response.payload.threadId);
          this.handleMessageCreated(response.payload);
        } else if (eventType.includes('.update')) {
          console.log('[AppwriteRealtime] Message updated:', response.payload.messageId, 'in thread:', response.payload.threadId);
          this.handleMessageUpdated(response.payload);
        } else if (eventType.includes('.delete')) {
          console.log('[AppwriteRealtime] Message deleted:', response.payload.messageId, 'in thread:', response.payload.threadId);
          this.handleMessageDeleted(response.payload);
        } else {
          console.log('[AppwriteRealtime] Unknown message event type:', eventType);
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

    console.log('[AppwriteRealtime] Subscribing to projects collection');
    const unsubscribe = client.subscribe(
      `databases.${DATABASE_ID}.collections.${PROJECTS_COLLECTION_ID}.documents`,
      (response: RealtimeResponseEvent<AppwriteProject>) => {
        console.log('[AppwriteRealtime] Project event received:', response.events[0], response.payload);

        // Process only events for the current user
        if (response.payload?.userId !== userId) {
          console.log('[AppwriteRealtime] Project event ignored - different user:', response.payload?.userId, 'vs', userId);
          return;
        }

        // Handle different event types - check if event contains the action
        const eventType = response.events[0];
        console.log('[AppwriteRealtime] Project event type:', eventType);

        if (eventType.includes('.create')) {
          console.log('[AppwriteRealtime] Project created:', response.payload.projectId);
          this.handleProjectCreated(response.payload);
        } else if (eventType.includes('.update')) {
          console.log('[AppwriteRealtime] Project updated:', response.payload.projectId);
          this.handleProjectUpdated(response.payload);
        } else if (eventType.includes('.delete')) {
          console.log('[AppwriteRealtime] Project deleted:', response.payload.projectId);
          this.handleProjectDeleted(response.payload);
        } else {
          console.log('[AppwriteRealtime] Unknown project event type:', eventType);
        }
      }
    );

    this.subscriptions.set('projects', unsubscribe);
    console.log('[AppwriteRealtime] Successfully subscribed to projects');
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
}
