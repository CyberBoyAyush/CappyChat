/**
 * Project Manager Hook
 *
 * Purpose: Custom hook that manages project operations including creation, deletion, and updates.
 * Provides project data and operations for the sidebar and project management components.
 */

import { useState, useEffect, useCallback } from 'react';
import { Project } from '@/lib/appwriteDB';
import { HybridDB, dbEvents } from '@/lib/hybridDB';

// Project data interface for UI components
export interface ProjectData {
  id: string;
  name: string;
  description?: string;
  prompt?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Project operations interface
export interface ProjectOperations {
  onCreate: (name: string, description?: string, prompt?: string) => Promise<string>;
  onUpdate: (projectId: string, name: string, description?: string, prompt?: string) => Promise<void>;
  onDelete: (projectId: string, reassignThreadsToProjectId?: string) => Promise<void>;
}

export const useProjectManager = () => {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load projects on mount
  useEffect(() => {
    const loadProjects = () => {
      const projectData = HybridDB.getProjects();
      setProjects(projectData);
      setIsLoading(false);
    };

    // Initial load
    loadProjects();

    // Listen for project updates
    const handleProjectsUpdated = (updatedProjects: Project[]) => {
      setProjects(updatedProjects);
      setIsLoading(false);
    };

    dbEvents.on('projects_updated', handleProjectsUpdated);

    return () => {
      dbEvents.off('projects_updated', handleProjectsUpdated);
    };
  }, []);

  // Create project
  const createProject = useCallback(async (name: string, description?: string, prompt?: string): Promise<string> => {
    try {
      const projectId = await HybridDB.createProject(name, description, prompt);
      return projectId;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  }, []);

  // Update project
  const updateProject = useCallback(async (projectId: string, name: string, description?: string, prompt?: string): Promise<void> => {
    try {
      await HybridDB.updateProject(projectId, name, description, prompt);
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  }, []);

  // Delete project
  const deleteProject = useCallback(async (projectId: string, reassignThreadsToProjectId?: string): Promise<void> => {
    try {
      await HybridDB.deleteProject(projectId, reassignThreadsToProjectId);
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  }, []);

  return {
    projects,
    isLoading,
    createProject,
    updateProject,
    deleteProject,
  };
};
