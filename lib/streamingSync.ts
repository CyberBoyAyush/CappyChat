/**
 * Real-time Streaming Synchronization
 * 
 * Synchronizes AI response streaming across multiple browser sessions
 * for smooth real-time collaboration experience.
 */

import { dbEvents } from './hybridDB';

interface StreamingState {
  threadId: string;
  messageId: string;
  content: string;
  isStreaming: boolean;
  lastUpdate: number;
  sessionId: string; // Add session identifier
}

class StreamingSyncManager {
  private static instance: StreamingSyncManager;
  private streamingStates = new Map<string, StreamingState>();
  private updateCallbacks = new Map<string, Set<(state: StreamingState) => void>>();
  private debounceTimeouts = new Map<string, NodeJS.Timeout>();
  private sessionId: string;

  constructor() {
    // Generate unique session ID for this browser session
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    // Listen for streaming broadcasts from other sessions
    this.setupCrossSessionListener();
  }
  
  static getInstance(): StreamingSyncManager {
    if (!this.instance) {
      this.instance = new StreamingSyncManager();
    }
    return this.instance;
  }

  // Get current session ID
  getSessionId(): string {
    return this.sessionId;
  }

  // Start streaming for a message
  startStreaming(threadId: string, messageId: string): void {
    const key = `${threadId}_${messageId}`;
    const state: StreamingState = {
      threadId,
      messageId,
      content: '',
      isStreaming: true,
      lastUpdate: Date.now(),
      sessionId: this.sessionId
    };
    
    this.streamingStates.set(key, state);
    this.notifySubscribers(key, state);
    
    // Emit streaming started event
    dbEvents.emit('streaming_started', threadId, messageId);
  }

  // Update streaming content
  updateStreamingContent(threadId: string, messageId: string, content: string): void {
    const key = `${threadId}_${messageId}`;
    const existingState = this.streamingStates.get(key);

    if (!existingState || !existingState.isStreaming) {
      return; // Not streaming or doesn't exist
    }

    const state: StreamingState = {
      ...existingState,
      content,
      lastUpdate: Date.now(),
      sessionId: this.sessionId
    };

    this.streamingStates.set(key, state);

    // Immediately notify local subscribers
    this.notifySubscribers(key, state);

    // Broadcast to other browser sessions via localStorage
    this.broadcastToOtherSessions(state);
  }

  // End streaming for a message
  endStreaming(threadId: string, messageId: string, finalContent?: string): void {
    const key = `${threadId}_${messageId}`;
    const existingState = this.streamingStates.get(key);
    
    if (!existingState) {
      return;
    }

    const state: StreamingState = {
      ...existingState,
      content: finalContent || existingState.content,
      isStreaming: false,
      lastUpdate: Date.now()
    };
    
    this.streamingStates.set(key, state);
    this.notifySubscribers(key, state);
    
    // Clean up after a delay
    setTimeout(() => {
      this.streamingStates.delete(key);
      this.updateCallbacks.delete(key);
      if (this.debounceTimeouts.has(key)) {
        clearTimeout(this.debounceTimeouts.get(key)!);
        this.debounceTimeouts.delete(key);
      }
    }, 5000);
    
    // Emit streaming ended event
    dbEvents.emit('streaming_ended', threadId, messageId, finalContent);
  }

  // Subscribe to streaming updates for a specific message
  subscribeToStreaming(
    threadId: string, 
    messageId: string, 
    callback: (state: StreamingState) => void
  ): () => void {
    const key = `${threadId}_${messageId}`;
    
    if (!this.updateCallbacks.has(key)) {
      this.updateCallbacks.set(key, new Set());
    }
    
    this.updateCallbacks.get(key)!.add(callback);
    
    // Send current state if available
    const currentState = this.streamingStates.get(key);
    if (currentState) {
      callback(currentState);
    }
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.updateCallbacks.get(key);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.updateCallbacks.delete(key);
        }
      }
    };
  }

  // Subscribe to all streaming updates for a thread
  subscribeToThreadStreaming(
    threadId: string,
    callback: (state: StreamingState) => void
  ): () => void {
    // Listen to streaming events
    const handleStreamingStarted = (tId: string, messageId: string) => {
      if (tId === threadId) {
        const key = `${tId}_${messageId}`;
        const state = this.streamingStates.get(key);
        if (state) {
          callback(state);
        }
      }
    };

    const handleStreamingEnded = (tId: string, messageId: string, content?: string) => {
      if (tId === threadId) {
        const state: StreamingState = {
          threadId: tId,
          messageId,
          content: content || '',
          isStreaming: false,
          lastUpdate: Date.now(),
          sessionId: 'unknown' // For ended streaming events
        };
        callback(state);
      }
    };

    dbEvents.on('streaming_started', handleStreamingStarted);
    dbEvents.on('streaming_ended', handleStreamingEnded);

    // Return unsubscribe function
    return () => {
      dbEvents.off('streaming_started', handleStreamingStarted);
      dbEvents.off('streaming_ended', handleStreamingEnded);
    };
  }

  // Get current streaming state for a message
  getStreamingState(threadId: string, messageId: string): StreamingState | null {
    const key = `${threadId}_${messageId}`;
    return this.streamingStates.get(key) || null;
  }

  // Check if any message in a thread is currently streaming
  isThreadStreaming(threadId: string): boolean {
    for (const [, state] of this.streamingStates) {
      if (state.threadId === threadId && state.isStreaming) {
        return true;
      }
    }
    return false;
  }

  // Get all streaming messages for a thread
  getThreadStreamingStates(threadId: string): StreamingState[] {
    const states: StreamingState[] = [];
    for (const [, state] of this.streamingStates) {
      if (state.threadId === threadId) {
        states.push(state);
      }
    }
    return states;
  }

  private debouncedNotify(key: string, state: StreamingState): void {
    // Clear existing timeout
    if (this.debounceTimeouts.has(key)) {
      clearTimeout(this.debounceTimeouts.get(key)!);
    }

    // Immediate notification for real-time streaming
    const timeout = setTimeout(() => {
      this.notifySubscribers(key, state);
      this.debounceTimeouts.delete(key);
    }, 0); // Zero delay for instant real-time streaming

    this.debounceTimeouts.set(key, timeout);
  }

  private notifySubscribers(key: string, state: StreamingState): void {
    const callbacks = this.updateCallbacks.get(key);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(state);
        } catch (error) {
          console.error('Error in streaming callback:', error);
        }
      });
    }

    // Also emit global streaming update event
    dbEvents.emit('streaming_updated', state.threadId, state.messageId, state);

    // Log for debugging
    console.log('[StreamingSync] Notified subscribers for:', state.messageId, 'session:', state.sessionId, 'content length:', state.content.length);
  }

  // Cross-session communication methods
  private setupCrossSessionListener(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key === 'atchat_streaming_broadcast' && event.newValue) {
          try {
            const broadcastData = JSON.parse(event.newValue);
            const { state, timestamp } = broadcastData;

            // Only process recent broadcasts (within 5 seconds)
            if (Date.now() - timestamp < 5000 && state.sessionId !== this.sessionId) {
              // Emit local event for this session
              dbEvents.emit('streaming_broadcast', state.threadId, state.messageId, state);
            }
          } catch (error) {
            console.error('[StreamingSync] Error parsing cross-session broadcast:', error);
          }
        }
      });
    }
  }

  private broadcastToOtherSessions(state: StreamingState): void {
    if (typeof window !== 'undefined') {
      try {
        const broadcastData = {
          state,
          timestamp: Date.now()
        };

        // Use localStorage to broadcast to other tabs/windows
        localStorage.setItem('atchat_streaming_broadcast', JSON.stringify(broadcastData));

        // Clear the broadcast after a short delay to prevent accumulation
        setTimeout(() => {
          try {
            localStorage.removeItem('atchat_streaming_broadcast');
          } catch {
            // Ignore cleanup errors
          }
        }, 100);
      } catch (err) {
        console.error('[StreamingSync] Error broadcasting to other sessions:', err);
      }
    }
  }
}

export const streamingSync = StreamingSyncManager.getInstance();
export type { StreamingState };
