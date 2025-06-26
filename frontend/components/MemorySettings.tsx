/**
 * Memory Settings Component
 *
 * Used in: frontend/routes/SettingsPage.tsx
 * Purpose: Manage global memory feature settings including enable/disable toggle,
 * memory list management, and memory counter display.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Switch } from '@/frontend/components/ui/switch';
import { Trash2, Brain, AlertTriangle } from 'lucide-react';
import { AppwriteDB, GlobalMemory } from '@/lib/appwriteDB';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '@/lib/utils';

interface MemorySettingsProps {
  className?: string;
}

export default function MemorySettings({ className }: MemorySettingsProps) {
  const { user } = useAuth();
  const [globalMemory, setGlobalMemory] = useState<GlobalMemory | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load global memory on component mount
  useEffect(() => {
    loadGlobalMemory();
  }, [user]);

  const loadGlobalMemory = async () => {
    if (!user?.$id) return;
    
    try {
      setLoading(true);
      setError(null);
      const memory = await AppwriteDB.getGlobalMemory(user.$id);
      setGlobalMemory(memory);
    } catch (err) {
      console.error('Error loading global memory:', err);
      setError('Failed to load memory settings');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEnabled = async (enabled: boolean) => {
    if (!user?.$id || updating) return;

    try {
      setUpdating(true);
      setError(null);
      
      const memories = globalMemory?.memories || [];
      await AppwriteDB.updateGlobalMemory(user.$id, memories, enabled);
      
      setGlobalMemory(prev => prev ? { ...prev, enabled } : {
        id: '',
        userId: user.$id,
        memories: [],
        enabled,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (err) {
      console.error('Error updating memory enabled state:', err);
      setError('Failed to update memory settings');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteMemory = async (index: number) => {
    if (!user?.$id || updating) return;

    try {
      setUpdating(true);
      setError(null);
      
      await AppwriteDB.deleteMemory(user.$id, index);
      await loadGlobalMemory(); // Reload to get updated state
    } catch (err) {
      console.error('Error deleting memory:', err);
      setError('Failed to delete memory');
    } finally {
      setUpdating(false);
    }
  };

  const handleClearAllMemories = async () => {
    if (!user?.$id || updating) return;

    try {
      setUpdating(true);
      setError(null);
      
      await AppwriteDB.clearAllMemories(user.$id);
      await loadGlobalMemory(); // Reload to get updated state
    } catch (err) {
      console.error('Error clearing all memories:', err);
      setError('Failed to clear memories');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className={cn("p-6 border rounded-xl bg-card shadow-sm", className)}>
        <div className="flex items-center gap-2 mb-4">
          <Brain className="h-5 w-5 text-primary animate-pulse" />
          <h3 className="text-lg font-medium">Global Memory</h3>
        </div>
        <div className="text-sm text-muted-foreground">Loading memory settings...</div>
      </div>
    );
  }

  const memories = globalMemory?.memories || [];
  const enabled = globalMemory?.enabled || false;
  const memoryCount = memories.length;

  return (
    <div className={cn("p-6 border rounded-xl bg-card shadow-sm", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-medium">Global Memory</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Allow AI to remember important information across conversations
          </p>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={handleToggleEnabled}
          disabled={updating}
        />
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Memory Counter */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Memories stored</span>
          <span className="font-medium">
            {memoryCount}/30 used
          </span>
        </div>

        {/* Memory List */}
        {memories.length > 0 ? (
          <div className="space-y-2">
            <div className="text-sm font-medium text-foreground mb-2">
              Current Memories
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {memories.map((memory, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between p-3 rounded-lg bg-muted/30 border"
                >
                  <div className="flex-1 text-sm text-foreground pr-2">
                    {memory}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteMemory(index)}
                    disabled={updating}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            
            {/* Clear All Button */}
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAllMemories}
                disabled={updating}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All Memories
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <div className="text-sm">
              {enabled 
                ? "No memories stored yet. The AI will automatically remember important information from your conversations."
                : "Enable memory to allow the AI to remember important information across conversations."
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
