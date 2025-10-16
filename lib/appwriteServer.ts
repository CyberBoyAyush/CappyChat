/**
 * Appwrite Server-Side Client
 * 
 * Provides server-side Appwrite client with admin privileges for API routes.
 * This client can access data without user authentication for public operations.
 */

import { Client, Databases, Query, ID } from 'node-appwrite';
import {
  DATABASE_ID,
  THREADS_COLLECTION_ID,
  MESSAGES_COLLECTION_ID,
  PLAN_ARTIFACTS_COLLECTION_ID,
  AppwriteThread,
  AppwriteMessage,
  DBMessage,
  FileAttachment,
  PlanArtifact
} from './appwriteDB';
import { devError } from './logger';

// Create server-side client with admin privileges
const serverClient = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '')
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')
  .setKey(process.env.APPWRITE_API_KEY || ''); // Server-side API key with admin privileges

const serverDatabases = new Databases(serverClient);

export class AppwriteServerDB {
  // Get shared thread by shareId (server-side with admin privileges)
  static async getSharedThread(shareId: string): Promise<AppwriteThread | null> {
    try {
      const response = await serverDatabases.listDocuments(
        DATABASE_ID,
        THREADS_COLLECTION_ID,
        [
          Query.equal('shareId', shareId),
          Query.equal('isShared', true)
        ]
      );

      if (response.documents.length === 0) {
        return null;
      }

      return response.documents[0] as unknown as AppwriteThread;
    } catch (error) {
      devError('Error getting shared thread (server):', error);
      throw error;
    }
  }

  // Get messages for a shared thread (server-side with admin privileges)
  static async getSharedThreadMessages(threadId: string): Promise<DBMessage[]> {
    try {
      const response = await serverDatabases.listDocuments(
        DATABASE_ID,
        MESSAGES_COLLECTION_ID,
        [
          Query.equal('threadId', threadId),
          Query.orderAsc('$createdAt')
        ]
      );

      return response.documents.map((doc) => {
        const messageDoc = doc as unknown as AppwriteMessage;
        
        // Parse attachments from JSON string if present
        let attachments: FileAttachment[] | undefined = undefined;
        if (messageDoc.attachments) {
          try {
            // If it's already an object, use it directly (backward compatibility)
            if (typeof messageDoc.attachments === 'object') {
              attachments = messageDoc.attachments as FileAttachment[];
            } else {
              // If it's a string, parse it
              attachments = JSON.parse(messageDoc.attachments as string);
            }

            // Ensure createdAt is a Date object for each attachment
            if (attachments && Array.isArray(attachments)) {
              attachments = attachments.map(att => ({
                ...att,
                createdAt: typeof att.createdAt === 'string' ? new Date(att.createdAt) : att.createdAt
              }));
            }
          } catch (error) {
            devError('Error parsing attachments:', error);
            attachments = undefined;
          }
        }
        
        return {
          id: messageDoc.messageId,
          threadId: messageDoc.threadId,
          role: messageDoc.role,
          content: messageDoc.content || "",
          createdAt: new Date(doc.$createdAt),
          model: messageDoc.model,
          attachments: attachments,
          imgurl: messageDoc.imgurl,
          webSearchResults: (messageDoc as any).webSearchResults || undefined,
          webSearchImgs: (messageDoc as any).webSearchImgs || undefined,
          isPlan:
            typeof (messageDoc as any).isPlan === "boolean"
              ? (messageDoc as any).isPlan
              : false,
        } as DBMessage;
      });
    } catch (error) {
      devError('Error getting shared thread messages (server):', error);
      throw error;
    }
  }

  // Get plan artifacts for a thread (server-side with admin privileges, no userId filter)
  static async getPlanArtifactsByThread(threadId: string): Promise<PlanArtifact[]> {
    try {
      const response = await serverDatabases.listDocuments(
        DATABASE_ID,
        PLAN_ARTIFACTS_COLLECTION_ID,
        [
          Query.equal('threadId', threadId),
          Query.orderAsc('$createdAt')
        ]
      );

      return response.documents.map((doc) => {
        const artifactDoc = doc as unknown as any;
        return {
          id: artifactDoc.$id,
          artifactId: artifactDoc.artifactId,
          threadId: artifactDoc.threadId,
          messageId: artifactDoc.messageId,
          userId: artifactDoc.userId,
          type: artifactDoc.type,
          title: artifactDoc.title,
          description: artifactDoc.description,
          htmlCode: artifactDoc.htmlCode,
          cssCode: artifactDoc.cssCode,
          jsCode: artifactDoc.jsCode,
          framework: artifactDoc.framework,
          theme: artifactDoc.theme,
          diagramType: artifactDoc.diagramType,
          diagramCode: artifactDoc.diagramCode,
          outputFormat: artifactDoc.outputFormat,
          sqlSchema: artifactDoc.sqlSchema,
          prismaSchema: artifactDoc.prismaSchema,
          typeormEntities: artifactDoc.typeormEntities,
          diagramSvg: artifactDoc.diagramSvg,
          mermaidCode: artifactDoc.mermaidCode,
          d3Code: artifactDoc.d3Code,
          version: artifactDoc.version,
          parentArtifactId: artifactDoc.parentArtifactId,
          isPublic: artifactDoc.isPublic,
          createdAt: new Date(artifactDoc.$createdAt),
          updatedAt: new Date(artifactDoc.$updatedAt),
        } as PlanArtifact;
      });
    } catch (error) {
      devError('Error getting plan artifacts by thread (server):', error);
      throw error;
    }
  }

  // Create a new thread for a specific user (server-side with admin privileges)
  static async createThreadForUser(userId: string, threadId: string, title: string): Promise<void> {
    try {
      const now = new Date().toISOString();

      await serverDatabases.createDocument(
        DATABASE_ID,
        THREADS_COLLECTION_ID,
        ID.unique(),
        {
          threadId,
          userId,
          title,
          updatedAt: now,
          lastMessageAt: now,
          isPinned: false,
          tags: [],
          isBranched: true, // Mark as branched since it's created from a shared thread
          projectId: null,
          isShared: false,
          shareId: null,
          sharedAt: null
        }
      );
    } catch (error) {
      devError('Error creating thread for user (server):', error);
      throw error;
    }
  }

  // Create a message for a specific thread (server-side with admin privileges)
  static async createMessageForThread(threadId: string, userId: string, messageData: {
    id: string;
    role: string;
    content: string;
    createdAt?: Date;
    model?: string;
    attachments?: FileAttachment[];
    imgurl?: string;
    webSearchResults?: string[];
    webSearchImgs?: string[];
    isPlan?: boolean;
  }): Promise<void> {
    try {
      const createdAtISO = (messageData.createdAt ?? new Date()).toISOString();

      await serverDatabases.createDocument(
        DATABASE_ID,
        MESSAGES_COLLECTION_ID,
        ID.unique(),
        {
          messageId: messageData.id,
          threadId,
          userId, // required by schema
          content: messageData.content ?? '',
          role: messageData.role,
          createdAt: createdAtISO,
          model: messageData.model || undefined,
          attachments: messageData.attachments ? JSON.stringify(messageData.attachments) : undefined,
          imgurl: messageData.imgurl || undefined,
          webSearchResults: messageData.webSearchResults && messageData.webSearchResults.length ? messageData.webSearchResults : undefined,
          webSearchImgs: messageData.webSearchImgs && messageData.webSearchImgs.length ? messageData.webSearchImgs : undefined,
          isPlan: typeof messageData.isPlan === "boolean" ? messageData.isPlan : undefined
        }
      );
    } catch (error) {
      devError('Error creating message for thread (server):', error);
      throw error;
    }
  }

  // Create a plan artifact for a specific thread (server-side with admin privileges)
  static async createPlanArtifactForThread(threadId: string, artifactData: {
    artifactId: string;
    messageId: string;
    userId: string;
    type: "mvp" | "diagram";
    title: string;
    description?: string;
    htmlCode?: string;
    cssCode?: string;
    jsCode?: string;
    framework?: string;
    theme?: string;
    diagramType?: string;
    diagramCode?: string;
    outputFormat?: string;
    sqlSchema?: string;
    prismaSchema?: string;
    typeormEntities?: string;
    diagramSvg?: string;
    mermaidCode?: string;
    d3Code?: string;
    version?: number;
    parentArtifactId?: string;
  }): Promise<PlanArtifact> {
    try {
      const doc = await serverDatabases.createDocument(
        DATABASE_ID,
        PLAN_ARTIFACTS_COLLECTION_ID,
        ID.unique(),
        {
          artifactId: artifactData.artifactId,
          threadId,
          messageId: artifactData.messageId,
          userId: artifactData.userId,
          type: artifactData.type,
          title: artifactData.title,
          description: artifactData.description || undefined,
          htmlCode: artifactData.htmlCode || undefined,
          cssCode: artifactData.cssCode || undefined,
          jsCode: artifactData.jsCode || undefined,
          framework: artifactData.framework || undefined,
          theme: artifactData.theme || undefined,
          diagramType: artifactData.diagramType || undefined,
          diagramCode: artifactData.diagramCode || undefined,
          outputFormat: artifactData.outputFormat || undefined,
          sqlSchema: artifactData.sqlSchema || undefined,
          prismaSchema: artifactData.prismaSchema || undefined,
          typeormEntities: artifactData.typeormEntities || undefined,
          diagramSvg: artifactData.diagramSvg || undefined,
          mermaidCode: artifactData.mermaidCode || undefined,
          d3Code: artifactData.d3Code || undefined,
          version: Math.max(1, Number(artifactData.version || 1)),
          parentArtifactId: artifactData.parentArtifactId || undefined,
          isPublic: false, // New artifacts are private by default
        }
      );

      return {
        id: doc.$id,
        artifactId: artifactData.artifactId,
        threadId,
        messageId: artifactData.messageId,
        userId: artifactData.userId,
        type: artifactData.type,
        title: artifactData.title,
        description: artifactData.description,
        htmlCode: artifactData.htmlCode,
        cssCode: artifactData.cssCode,
        jsCode: artifactData.jsCode,
        framework: artifactData.framework,
        theme: artifactData.theme,
        diagramType: artifactData.diagramType,
        diagramCode: artifactData.diagramCode,
        outputFormat: artifactData.outputFormat,
        sqlSchema: artifactData.sqlSchema,
        prismaSchema: artifactData.prismaSchema,
        typeormEntities: artifactData.typeormEntities,
        diagramSvg: artifactData.diagramSvg,
        mermaidCode: artifactData.mermaidCode,
        d3Code: artifactData.d3Code,
        version: Math.max(1, Number(artifactData.version || 1)),
        parentArtifactId: artifactData.parentArtifactId,
        isPublic: false,
        createdAt: new Date(doc.$createdAt),
        updatedAt: new Date(doc.$updatedAt),
      } as PlanArtifact;
    } catch (error) {
      devError('Error creating plan artifact for thread (server):', error);
      throw error;
    }
  }
}
