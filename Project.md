# AVChat - Complete Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture & Design](#architecture--design)
3. [Technology Stack](#technology-stack)
4. [Environment Configuration](#environment-configuration)
5. [Project Structure](#project-structure)
6. [Core Systems](#core-systems)
7. [API Routes](#api-routes)
8. [Frontend Components](#frontend-components)
9. [State Management](#state-management)
10. [Database Schema](#database-schema)
11. [Real-time Features](#real-time-features)
12. [Authentication & Security](#authentication--security)
13. [File Management](#file-management)
14. [AI Integration](#ai-integration)
15. [Development Workflow](#development-workflow)
16. [Deployment](#deployment)
17. [Contributing Guidelines](#contributing-guidelines)

---

## Project Overview

**AVChat** is a next-generation AI chat platform built with a local-first architecture, providing lightning-fast performance, real-time synchronization, and seamless multi-device experience. The application combines the speed of local storage with the reliability of cloud synchronization, offering users an unparalleled chat experience with multiple AI models.

### Key Features
- **Multi-Model AI Support**: Seamless integration with OpenRouter, OpenAI, Google, Anthropic, and more
- **Local-First Architecture**: Instant UI updates with background cloud synchronization
- **Real-Time Sync**: Live synchronization across all devices and browser tabs
- **Image Generation**: Built-in support for DALL-E 3, Stable Diffusion via Runware
- **Voice Input**: Speech-to-text using OpenAI Whisper
- **File Attachments**: Upload and analyze documents, images via Cloudinary
- **Web Search Integration**: Advanced web search powered by Tavily API with rich citations
- **Project Management**: Organize chats into projects with custom prompts
- **Guest Mode**: Try the app without registration
- **Mobile-First Design**: Fully responsive across all devices
- **Session Management**: Monitor and control active sessions
- **Admin Dashboard**: Comprehensive user and system management

### Recent Updates & Improvements

#### Web Search Enhancement (Latest)
- **Tavily Integration**: Upgraded from basic search to advanced Tavily API
- **Universal Compatibility**: Web search now works with any AI model, not just specific ones
- **Enhanced Citations**: Rich metadata display with clickable links, favicons, and descriptions
- **Improved UX**: Better loading states, expandable citation grids, and responsive design
- **Guest Restrictions**: Web search limited to authenticated users for better resource management

#### Admin System Enhancements
- **Bulk Operations**: New `/api/admin/bulk-operations` endpoint for batch user management
- **Enhanced Data Deletion**: Improved `/api/admin/delete-data` with comprehensive cleanup
- **Better Error Handling**: Robust error handling and rollback capabilities
- **Performance Optimization**: Chunked processing for large-scale operations

#### UI/UX Improvements
- **AspectRatioSelector**: New component for image generation aspect ratio selection
- **WebSearchLoader**: Dedicated loading component for search operations
- **Enhanced Citations**: Rich metadata display with improved visual design
- **Responsive Design**: Better mobile experience across all components

---

## Architecture & Design

### Core Principles
1. **Local-First**: All operations happen locally first, then sync to cloud
2. **Optimistic Updates**: UI updates immediately, handles conflicts gracefully
3. **Real-Time Sync**: Live updates across all connected devices
4. **Progressive Enhancement**: Works offline, enhanced when online
5. **Performance-First**: Sub-100ms response times for all interactions

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   External      │
│   (React SPA)   │    │   (Next.js API) │    │   Services      │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • React Router  │◄──►│ • API Routes    │◄──►│ • OpenRouter    │
│ • Zustand Store │    │ • Appwrite SDK  │    │ • OpenAI        │
│ • IndexedDB     │    │ • Node.js       │    │ • Runware       │
│ • WebSocket     │    │ • TypeScript    │    │ • Cloudinary    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Appwrite      │
                    │   Database      │
                    ├─────────────────┤
                    │ • Collections   │
                    │ • Real-time     │
                    │ • Authentication│
                    │ • File Storage  │
                    └─────────────────┘
```

---

## Technology Stack

### Frontend Stack
- **Framework**: Next.js 15.3 with React 19
- **Language**: TypeScript 5.8
- **Styling**: TailwindCSS 4.1 with PostCSS
- **UI Components**: Shadcn UI + Radix UI primitives
- **State Management**: Zustand 5.0 (lightweight, performant)
- **Routing**: React Router 7.6 (client-side routing)
- **Forms**: React Hook Form + Zod validation
- **Local Database**: Dexie.js (IndexedDB wrapper)
- **Real-time**: WebSocket + Server-Sent Events
- **Animations**: Framer Motion 12.17
- **Icons**: Lucide React
- **Markdown**: react-markdown + remark-gfm + rehype-katex
- **Code Highlighting**: react-shiki
- **Math Rendering**: KaTeX

### Backend Stack
- **Runtime**: Node.js with Next.js API Routes
- **Language**: TypeScript
- **Database**: Appwrite (self-hosted/cloud)
- **Authentication**: Appwrite Auth (email/password + OAuth)
- **Real-time**: Appwrite Realtime WebSocket
- **File Storage**: Cloudinary (images/documents)
- **AI Integration**:
  - OpenRouter (multi-model access)
  - OpenAI (Whisper, DALL-E)
  - Runware (image generation)
  - Tavily (web search)
- **Email**: Appwrite Email Service

### Development Tools
- **Package Manager**: pnpm (fast, efficient)
- **Build Tool**: Next.js with Turbopack
- **Linting**: ESLint 9.28
- **Type Checking**: TypeScript strict mode
- **Git Hooks**: Husky (pre-commit checks)
- **Testing**: Jest + React Testing Library
- **Deployment**: Vercel (recommended)

---

## Environment Configuration

The application requires several environment variables for proper operation. Reference the `env.example` file:

### Required Variables
```bash
# AI Services
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
RUNWARE_API_KEY=your_runware_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here

# Appwrite Configuration
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id_here
NEXT_PUBLIC_APPWRITE_THREADS_COLLECTION_ID=threads
NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID=messages
NEXT_PUBLIC_APPWRITE_MESSAGE_SUMMARIES_COLLECTION_ID=message_summaries
NEXT_PUBLIC_APPWRITE_PROJECTS_COLLECTION_ID=projects
NEXT_PUBLIC_APPWRITE_GLOBAL_MEMORY_COLLECTION_ID=global_memory

# Authentication URLs
NEXT_PUBLIC_AUTH_SUCCESS_URL=http://localhost:3000/auth/callback
NEXT_PUBLIC_AUTH_FAILURE_URL=http://localhost:3000/auth/error
NEXT_PUBLIC_VERIFICATION_URL=http://localhost:3000/auth/verify

# Admin Configuration
APPWRITE_API_KEY=your_appwrite_server_api_key_here
ADMIN_SECRET_KEY=your_secure_admin_secret_key_here
```

### Environment-Specific Notes
- **Development**: Use localhost URLs for auth callbacks
- **Production**: Update URLs to your domain
- **Security**: Never commit actual API keys to version control
- **Admin Keys**: Generate secure random strings for admin operations

---

## Project Structure

```
AVChat/
├── 📁 app/                          # Next.js 15 App Router
│   ├── 📁 api/                      # Backend API routes
│   │   ├── 📁 admin/                # Admin management endpoints
│   │   │   ├── bulk-operations/     # Bulk admin operations
│   │   │   ├── delete-data/         # Comprehensive user data deletion
│   │   │   ├── manage-user/         # User management operations
│   │   │   └── stats/               # System statistics
│   │   ├── ai-text-generation/      # AI text generation endpoint
│   │   ├── chat-messaging/          # Main chat messaging API
│   │   ├── files/                   # File management operations
│   │   ├── image-generation/        # Image generation via Runware
│   │   ├── speech-to-text/          # Voice input processing
│   │   ├── upload/                  # File upload to Cloudinary
│   │   └── web-search/              # Tavily web search integration
│   ├── layout.tsx                   # Root application layout
│   ├── styles.css                   # Global styles and Tailwind
│   └── static-app-shell/            # SPA shell for client routing
│       └── page.tsx                 # Entry point for React app
├── 📁 frontend/                     # React application code
│   ├── 📁 components/               # Reusable UI components
│   │   ├── 📁 auth/                 # Authentication components
│   │   ├── 📁 panel/                # Sidebar panel components
│   │   ├── 📁 projects/             # Project management UI
│   │   ├── 📁 ui/                   # Base UI components (Shadcn)
│   │   ├── ChatInterface.tsx        # Main chat interface
│   │   ├── ChatSidebarPanel.tsx     # Sidebar with threads/projects
│   │   ├── ModelSelector.tsx        # AI model selection UI
│   │   ├── FileUpload.tsx           # File attachment handling
│   │   └── [50+ other components]   # Specialized UI components
│   ├── 📁 contexts/                 # React Context providers
│   │   └── AuthContext.tsx          # Authentication state management
│   ├── 📁 hooks/                    # Custom React hooks
│   │   ├── useAuthDialog.ts         # Authentication dialog logic
│   │   ├── useOptimizedHybridDB.ts  # Database operations hook
│   │   └── [other hooks]            # Specialized hooks
│   ├── 📁 routes/                   # Page components
│   │   ├── 📁 auth/                 # Authentication pages
│   │   ├── ChatHomePage.tsx         # Home/new chat page
│   │   ├── ChatThreadPage.tsx       # Individual thread view
│   │   ├── SettingsPage.tsx         # User settings
│   │   ├── AdminPage.tsx            # Admin dashboard
│   │   ├── AboutPage.tsx            # About page with team and tech info
│   │   └── ChangelogPage.tsx        # Changelog with version history
│   ├── 📁 stores/                   # Zustand state stores
│   │   ├── ChatModelStore.ts        # AI model selection state
│   │   ├── BYOKStore.ts             # Bring Your Own Key state
│   │   └── [other stores]           # Feature-specific stores
│   ├── ChatAppRouter.tsx            # Main application router
│   └── ChatLayoutWrapper.tsx        # Layout wrapper component
├── 📁 lib/                          # Core utilities and services
│   ├── appwrite.ts                  # Appwrite client configuration
│   ├── appwriteDB.ts                # Database operations & types
│   ├── appwriteRealtime.ts          # Real-time sync service
│   ├── hybridDB.ts                  # Local-first database layer
│   ├── localDB.ts                   # IndexedDB operations
│   ├── streamingSync.ts             # Real-time streaming sync
│   ├── models.ts                    # AI model configurations
│   ├── tierSystem.ts                # User tier & credit management
│   ├── sessionManager.ts            # Session management utilities
│   ├── cloudinary.ts                # File upload service
│   ├── cloudinary-client.ts         # Client-side Cloudinary utilities
│   ├── conversationStyles.ts        # Chat conversation styles
│   ├── adminService.ts              # Admin operations service
│   ├── audioRecorder.ts             # Audio recording utilities
│   ├── globalErrorHandler.ts        # Global error handling
│   ├── memoryExtractor.ts           # Memory extraction utilities
│   ├── realtimeConfig.ts            # Real-time configuration
│   ├── utils.ts                     # General utility functions
│   └── [other utilities]            # Helper functions & configs
├── 📁 docs/                         # Documentation files
│   ├── AUTO_DATA_REFRESH.md         # Auto data refresh feature
│   ├── REALTIMESYNC.md              # Real-time sync documentation
│   ├── REALTIME_SYNC_OPTIMIZATION.md # Sync optimization details
│   ├── SESSION_MANAGEMENT_IMPROVEMENTS.md # Session management
│   └── Project.md                   # Original project documentation
├── 📁 public/                       # Static assets
│   ├── logo.png                     # Application logo
│   ├── banner.png                   # Social media banner
│   └── sw.js                        # Service worker
├── 📁 scripts/                      # Build and setup scripts
├── 📁 hooks/                        # Global custom hooks
├── package.json                     # Dependencies and scripts
├── env.example                      # Environment variables template
├── next.config.ts                   # Next.js configuration
├── tailwind.config.js               # Tailwind CSS configuration
├── tsconfig.json                    # TypeScript configuration
└── README.md                        # Project README
```

---

## Core Systems

### 1. HybridDB - Local-First Database System
**File**: `lib/hybridDB.ts`

The HybridDB is the heart of AVChat's performance, combining IndexedDB for local storage with Appwrite for cloud synchronization.

**Key Features**:
- Instant local operations (sub-10ms response times)
- Automatic background synchronization
- Conflict resolution for concurrent edits
- Offline-first functionality
- Real-time updates across devices

**Architecture**:
```typescript
// Example usage
await HybridDB.createMessage(threadId, content, attachments);
// ↓ Immediately updates local UI
// ↓ Queues for cloud sync
// ↓ Broadcasts to other tabs/devices
```

### 2. Real-Time Synchronization
**Files**: `lib/appwriteRealtime.ts`, `lib/streamingSync.ts`

Provides live updates across all connected devices and browser tabs.

**Components**:
- **Appwrite Realtime**: WebSocket connection for database changes
- **Streaming Sync**: Custom solution for AI response streaming
- **Event Broadcasting**: Cross-tab communication via BroadcastChannel

### 3. Authentication System
**Files**: `frontend/contexts/AuthContext.tsx`, `lib/sessionManager.ts`

Comprehensive authentication with multiple providers and session management.

**Features**:
- Email/password authentication
- OAuth (Google, GitHub)
- Email verification requirement
- Session management (3 sessions max per user)
- Guest mode support
- Automatic session refresh

### 4. Tier System & Credit Management
**File**: `lib/tierSystem.ts`

Manages user tiers, credit consumption, and feature access.

**Tiers**:
- **Guest**: 2 free messages
- **Free**: Basic features with limits
- **Pro**: Enhanced features and higher limits
- **Admin**: Full system access

---

## API Routes

The `app/api/` directory contains all backend endpoints that power AVChat's functionality.

### Core API Endpoints

#### `/api/chat-messaging` - Main Chat API
**File**: `app/api/chat-messaging/route.ts`
- **Purpose**: Handles AI text generation and streaming responses
- **Method**: POST
- **Features**:
  - Multi-model AI support via OpenRouter
  - Streaming responses with word-level chunking
  - Credit consumption tracking
  - Project prompt integration
  - File attachment processing
  - Conversation style application

#### `/api/ai-text-generation` - Title Generation
**File**: `app/api/ai-text-generation/route.ts`
- **Purpose**: Generates thread titles from first messages
- **Method**: POST
- **Features**:
  - Free service (no credits consumed)
  - 80-character limit enforcement
  - File attachment consideration
  - Optimized for speed with nano models

#### `/api/image-generation` - Image Creation
**File**: `app/api/image-generation/route.ts`
- **Purpose**: Generates images using Runware API
- **Method**: POST
- **Features**:
  - Multiple model support (DALL-E, Stable Diffusion)
  - Credit consumption (1 premium credit)
  - Real-time sync compatibility
  - Error handling and fallbacks

#### `/api/speech-to-text` - Voice Input
**File**: `app/api/speech-to-text/route.ts`
- **Purpose**: Converts audio to text using OpenAI Whisper
- **Method**: POST
- **Features**:
  - Multiple audio format support
  - High accuracy transcription
  - File size validation
  - Error handling

#### `/api/web-search` - Search Integration
**File**: `app/api/web-search/route.ts`
- **Purpose**: Performs web searches using Tavily API for AI context
- **Method**: POST
- **Features**:
  - Tavily advanced search integration
  - Works with any AI model (not limited to specific models)
  - Credit consumption tracking
  - Search result formatting with citations
  - Real-time integration with streaming responses
  - Guest user restrictions (authenticated users only)
  - Comprehensive error handling and validation

#### `/api/upload` - File Management
**File**: `app/api/upload/route.ts`
- **Purpose**: Handles file uploads to Cloudinary
- **Method**: POST
- **Features**:
  - 5MB file size limit
  - Multiple format support (images, PDFs, documents)
  - Automatic optimization
  - Secure upload handling

#### `/api/files` - File Operations
**File**: `app/api/files/route.ts`
- **Purpose**: Lists and manages user uploaded files
- **Methods**: POST (list), DELETE (remove)
- **Features**:
  - User-specific file listing
  - Cloudinary integration
  - File metadata tracking
  - Bulk operations support

### Admin API Endpoints

#### `/api/admin/stats` - System Statistics
**File**: `app/api/admin/stats/route.ts`
- **Purpose**: Provides comprehensive system statistics
- **Method**: POST
- **Features**:
  - User count and tier distribution
  - Message and thread statistics
  - Credit usage analytics
  - System health metrics

#### `/api/admin/manage-user` - User Management
**File**: `app/api/admin/manage-user/route.ts`
- **Purpose**: Admin user management operations
- **Method**: POST
- **Features**:
  - User lookup by email
  - Tier management
  - Credit reset functionality
  - User preference access

#### `/api/admin/reset-limits` - Limit Management
**File**: `app/api/admin/reset-limits/route.ts`
- **Purpose**: Resets user credit limits
- **Method**: POST
- **Features**:
  - Individual user reset
  - Bulk user reset
  - Monthly limit cycles
  - Admin authentication

#### `/api/admin/delete-data` - Data Management
**File**: `app/api/admin/delete-data/route.ts`
- **Purpose**: Handles comprehensive user data deletion
- **Method**: POST
- **Features**:
  - Complete data removal across all collections
  - GDPR compliance with thorough cleanup
  - User lookup by email or ID
  - Cascade deletion (threads, messages, projects, summaries)
  - Detailed deletion reporting
  - Error handling and rollback capabilities

#### `/api/admin/bulk-operations` - Bulk Admin Operations
**File**: `app/api/admin/bulk-operations/route.ts`
- **Purpose**: Handles bulk administrative operations
- **Method**: POST
- **Features**:
  - Chunked user logout operations
  - User count and listing functionality
  - Batch processing with configurable limits
  - Time-bounded operations (10-30 seconds)
  - Progress tracking and reporting
  - Safe batch sizes (5-50 users per batch)

---

## Frontend Components

The `frontend/components/` directory contains all React components organized by functionality.

### Core Interface Components

#### `ChatInterface.tsx` - Main Chat UI
- **Purpose**: Primary chat interface with message display and input
- **Features**:
  - Real-time message streaming
  - File attachment support
  - Voice input integration
  - Model selection
  - Responsive design
  - Keyboard shortcuts

#### `ChatSidebarPanel.tsx` - Navigation Sidebar
- **Purpose**: Thread and project navigation
- **Features**:
  - Thread listing with search
  - Project organization
  - Drag-and-drop support
  - Context menus
  - Real-time updates

#### `ModelSelector.tsx` - AI Model Selection
- **Purpose**: AI model and feature selection UI
- **Features**:
  - Model categorization
  - Feature toggles (web search, image generation)
  - Credit cost display
  - Tier-based access control
  - Compact responsive design

#### `FileUpload.tsx` - File Attachment Handler
- **Purpose**: Drag-and-drop file upload interface
- **Features**:
  - Multiple file support
  - Progress indicators
  - File type validation
  - Preview generation
  - Error handling

### Authentication Components (`auth/`)

#### `AuthDialog.tsx` - Authentication Modal
- **Purpose**: Login/signup modal interface
- **Features**:
  - Email/password forms
  - OAuth provider buttons
  - Form validation
  - Error handling
  - Responsive design

#### `LoginPage.tsx` & `SignupPage.tsx` - Auth Pages
- **Purpose**: Dedicated authentication pages
- **Features**:
  - Full-page auth forms
  - Social login integration
  - Email verification flow
  - Password reset functionality

### UI Components (`ui/`)

#### Base Components (Shadcn UI)
- **Button.tsx**: Customizable button component
- **Input.tsx**: Form input with validation
- **Dialog.tsx**: Modal dialog system
- **Dropdown.tsx**: Dropdown menu component
- **Tooltip.tsx**: Hover tooltip system
- **ScrollArea.tsx**: Custom scrollbar implementation

#### Theme Components
- **ThemeComponents.tsx**: Dark/light theme toggle
- **ThemeProvider.tsx**: Theme context provider

### Specialized Components

#### `MarkdownRenderer.tsx` - Content Rendering
- **Purpose**: Renders markdown content with syntax highlighting
- **Features**:
  - Code block highlighting
  - Math equation rendering (KaTeX)
  - Link handling
  - Table support
  - Custom styling

#### `MessageAttachments.tsx` - File Display
- **Purpose**: Displays file attachments in messages
- **Features**:
  - Image previews
  - Document icons
  - Download links
  - File metadata display

#### `WebSearchCitations.tsx` - Search Results
- **Purpose**: Displays web search citations with rich metadata
- **Features**:
  - Clickable source links with favicons
  - Citation numbering and domain display
  - Expandable/collapsible citation grid
  - Rich metadata fetching (titles, descriptions, images)
  - Responsive grid layout (2-3 columns)
  - Loading states and error handling
  - Accessibility support with ARIA labels

#### `WebSearchLoader.tsx` - Search Loading State
- **Purpose**: Displays loading animation during web search
- **Features**:
  - Animated search indicator
  - Search query display
  - Smooth transitions
  - Consistent with app design language

#### `AspectRatioSelector.tsx` - Image Generation
- **Purpose**: Aspect ratio selection for image generation
- **Features**:
  - Multiple aspect ratio presets
  - Visual ratio indicators
  - Responsive design
  - Integration with image generation workflow

---

## State Management

AVChat uses a hybrid approach to state management combining React Context and Zustand stores.

### React Context

#### `AuthContext.tsx` - Authentication State
**File**: `frontend/contexts/AuthContext.tsx`
- **Purpose**: Global authentication state management
- **Features**:
  - User session management
  - Login/logout functionality
  - Email verification status
  - Session refresh handling
  - Guest mode support

### Zustand Stores

#### `ChatModelStore.ts` - Model Selection
**File**: `frontend/stores/ChatModelStore.ts`
- **Purpose**: AI model selection and configuration
- **State**:
  - Selected model
  - Model categories
  - Feature toggles
  - User preferences

#### `BYOKStore.ts` - API Key Management
**File**: `frontend/stores/BYOKStore.ts`
- **Purpose**: Bring Your Own Key functionality for multiple providers
- **Supported Keys**:
  - OpenRouter API key (AI models)
  - OpenAI API key (voice input via Whisper)
  - Tavily API key (web search functionality)
- **Features**:
  - Secure browser-only storage with Zustand persistence
  - Key format validation for each provider
  - Individual key management (add/remove per provider)
  - Fallback to system keys when user keys fail

#### `WebSearchStore.ts` - Search Configuration
**File**: `frontend/stores/WebSearchStore.ts`
- **Purpose**: Web search feature state management with Tavily integration
- **State**:
  - Search enabled/disabled toggle
  - Persistent user preferences
  - Guest user restrictions
  - Universal model compatibility (works with any AI model)
- **Features**:
  - Zustand persistence for user preferences
  - Guest mode reset functionality
  - Toggle and direct set methods

#### `ConversationStyleStore.ts` - Chat Styles
**File**: `frontend/stores/ConversationStyleStore.ts`
- **Purpose**: Conversation style management
- **State**:
  - Selected style
  - Style configurations
  - Custom prompts
  - User preferences

#### `FontStore.ts` - Typography Settings
**File**: `frontend/stores/FontStore.ts`
- **Purpose**: Font and typography preferences
- **State**:
  - Font family selection
  - Font size settings
  - Line height preferences
  - Accessibility options

---

## Database Schema

AVChat uses Appwrite as the primary database with the following collections:

### Collections Structure

#### `threads` Collection
```typescript
interface Thread {
  $id: string;              // Unique thread identifier
  userId: string;           // Owner user ID
  title: string;            // Thread title (auto-generated)
  createdAt: string;        // ISO timestamp
  updatedAt: string;        // ISO timestamp
  projectId?: string;       // Optional project association
  isPinned: boolean;        // Pin status
  tags: string[];           // Thread tags
  lastMessageAt: string;    // Last activity timestamp
  messageCount: number;     // Total message count
}
```

#### `messages` Collection
```typescript
interface DBMessage {
  $id: string;              // Unique message identifier
  threadId: string;         // Parent thread ID
  userId: string;           // Message author ID
  content: string;          // Message content
  role: 'user' | 'assistant'; // Message role
  createdAt: string;        // ISO timestamp
  updatedAt: string;        // ISO timestamp
  attachments?: FileAttachment[]; // File attachments
  model?: string;           // AI model used
  reasoning?: string;       // AI reasoning (if available)
  webSearchResults?: any[]; // Web search results
  isStreaming: boolean;     // Streaming status
  streamingCompleted: boolean; // Streaming completion
}
```

#### `message_summaries` Collection
```typescript
interface MessageSummary {
  $id: string;              // Unique summary identifier
  threadId: string;         // Parent thread ID
  userId: string;           // Owner user ID
  summary: string;          // Thread summary
  messageCount: number;     // Messages included in summary
  createdAt: string;        // ISO timestamp
  updatedAt: string;        // ISO timestamp
}
```

#### `projects` Collection
```typescript
interface Project {
  $id: string;              // Unique project identifier
  userId: string;           // Owner user ID
  name: string;             // Project name
  description?: string;     // Project description
  prompt?: string;          // Project-specific prompt (max 500 chars)
  color: string;            // Project color theme
  createdAt: string;        // ISO timestamp
  updatedAt: string;        // ISO timestamp
  threadCount: number;      // Number of threads in project
}
```

#### `global_memory` Collection
```typescript
interface GlobalMemory {
  $id: string;              // Unique memory identifier
  userId: string;           // Owner user ID
  memories: string[];       // Array of memory items
  enabled: boolean;         // Memory enabled status
  createdAt: string;        // ISO timestamp
  updatedAt: string;        // ISO timestamp
}
```

### Indexes and Queries

#### Performance Indexes
- `threads`: `userId`, `createdAt`, `updatedAt`, `projectId`
- `messages`: `threadId`, `userId`, `createdAt`
- `message_summaries`: `threadId`, `userId`
- `projects`: `userId`, `createdAt`
- `global_memory`: `userId`, `createdAt`

#### Common Query Patterns
```typescript
// Get user threads with pagination
Query.equal('userId', userId),
Query.orderDesc('updatedAt'),
Query.limit(30)

// Get thread messages
Query.equal('threadId', threadId),
Query.orderAsc('createdAt')

// Get project threads
Query.equal('userId', userId),
Query.equal('projectId', projectId),
Query.orderDesc('updatedAt')
```

---

## Real-time Features

AVChat's real-time capabilities are powered by multiple synchronization systems working together.

### Real-time Architecture

#### 1. Appwrite Realtime WebSocket
**File**: `lib/appwriteRealtime.ts`
- **Purpose**: Handles database change notifications
- **Features**:
  - Collection-level subscriptions
  - Cross-device synchronization
  - Automatic reconnection
  - Event filtering and routing

#### 2. Streaming Sync System
**File**: `lib/streamingSync.ts`
- **Purpose**: Real-time AI response streaming
- **Features**:
  - Character-by-character streaming
  - Cross-tab broadcasting
  - Stream resumption after page refresh
  - Conflict resolution

#### 3. Local Event Broadcasting
- **Technology**: BroadcastChannel API
- **Purpose**: Cross-tab communication
- **Events**:
  - Message updates
  - Thread changes
  - User actions
  - System notifications

### Synchronization Flow
```
User Action → Local Update → UI Update → Cloud Sync → Broadcast → Other Devices
     ↓              ↓            ↓           ↓           ↓            ↓
   Instant      IndexedDB    React State  Appwrite   WebSocket   Live Updates
```

### Real-time Events
- **Message Creation**: Instant local display, background sync
- **Message Streaming**: Live AI response updates
- **Thread Updates**: Title changes, pin status, project moves
- **User Presence**: Online/offline status (planned feature)
- **Typing Indicators**: Real-time typing status (planned feature)

---

## Authentication & Security

### Authentication Flow

#### 1. Email/Password Authentication
```typescript
// Registration flow
signup(email, password) → email verification → account activation → login
```

#### 2. OAuth Authentication
- **Google OAuth**: Seamless Google account integration
- **GitHub OAuth**: Developer-friendly GitHub login
- **Profile Photos**: Automatic avatar from OAuth providers

#### 3. Guest Mode
- **Features**: 2 free messages without registration
- **Limitations**: No data persistence, limited features
- **Conversion**: Seamless upgrade to full account

### Security Measures

#### 1. Session Management
**File**: `lib/sessionManager.ts`
- **Session Limit**: Maximum 3 active sessions per user
- **Auto-cleanup**: Oldest sessions automatically terminated
- **Device Tracking**: Session metadata (device, location, time)
- **Manual Control**: User can terminate sessions from settings

#### 2. API Security
- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Zod schema validation
- **CORS Configuration**: Restricted cross-origin requests
- **Admin Authentication**: Secure admin key verification

#### 3. Data Protection
- **Encryption**: API keys encrypted in browser storage
- **HTTPS Only**: All communications encrypted
- **GDPR Compliance**: Complete data deletion capabilities
- **Privacy First**: Minimal data collection

### User Tiers & Access Control

#### Tier System
**File**: `lib/tierSystem.ts`

```typescript
interface UserTier {
  name: 'guest' | 'free' | 'pro' | 'admin';
  limits: {
    messagesPerMonth: number;
    webSearchCredits: number;
    imageGenerationCredits: number;
    fileUploads: number;
    projectCount: number;
  };
  features: string[];
}
```

#### Credit System
- **AI Text Generation**: Free (no credits consumed)
- **Web Search**: 1 super premium credit
- **Image Generation**: 1 premium credit
- **File Uploads**: Free within limits
- **Monthly Reset**: Automatic credit refresh

---

## File Management

### File Upload System

#### 1. Cloudinary Integration
**Files**: `lib/cloudinary.ts`, `lib/cloudinary-client.ts`
- **Storage**: Cloudinary cloud storage
- **Optimization**: Automatic image optimization
- **Transformations**: On-the-fly image processing
- **CDN**: Global content delivery network

#### 2. File Types Supported
- **Images**: JPG, PNG, GIF, WebP, SVG
- **Documents**: PDF, DOC, DOCX, TXT, MD
- **Archives**: ZIP, RAR (limited support)
- **Size Limit**: 5MB per file

#### 3. File Management Features
**Component**: `FileManager.tsx`
- **File Listing**: User's uploaded files with metadata
- **Download**: Direct file download links
- **Delete**: Secure file deletion
- **Search**: File search and filtering
- **Bulk Operations**: Multiple file management

### File Processing Pipeline
```
Upload → Validation → Cloudinary → Database → AI Processing → Display
   ↓         ↓           ↓           ↓           ↓            ↓
Security   Size/Type   Storage    Metadata   Analysis    User View
```

---

## AI Integration

### Multi-Model Support

#### 1. OpenRouter Integration
**File**: `lib/models.ts`
- **Purpose**: Primary AI model provider
- **Models**: 50+ models from various providers
- **Features**:
  - Unified API interface
  - Model switching
  - Cost optimization
  - Rate limiting

#### 2. Model Categories
```typescript
interface ModelCategory {
  name: string;
  models: AIModel[];
  description: string;
  costTier: 'free' | 'premium' | 'super-premium';
}
```

**Categories**:
- **Fast Models**: Quick responses, lower cost
- **Smart Models**: Balanced performance and cost
- **Advanced Models**: Highest quality, premium cost
- **Specialized Models**: Task-specific models

#### 3. Conversation Styles
**File**: `lib/conversationStyles.ts`
- **Normal**: Balanced, helpful responses
- **Creative**: More imaginative and creative
- **Precise**: Factual, concise responses
- **Friendly**: Casual, conversational tone
- **Professional**: Formal, business-appropriate

### AI Features

#### 1. Text Generation
- **Streaming**: Real-time response generation
- **Context Awareness**: Full conversation history
- **Project Prompts**: Custom system prompts per project
- **Style Application**: Conversation style integration

#### 2. Image Generation
**Integration**: Runware API
- **Models**: DALL-E 3, Stable Diffusion, Midjourney
- **Features**:
  - High-quality image generation
  - Style customization
  - Aspect ratio control
  - Batch generation

#### 3. Voice Input
**Integration**: OpenAI Whisper
- **Accuracy**: High-precision speech recognition
- **Languages**: Multi-language support
- **Formats**: Multiple audio format support
- **Real-time**: Live transcription

#### 4. Web Search
**Integration**: Tavily Search API
- **Advanced Search**: Deep web search with Tavily's advanced search depth
- **Universal Compatibility**: Works with any AI model via OpenRouter
- **Real-time**: Current information access with live results
- **Smart Citations**: Automatic source attribution with clickable links
- **Context Integration**: Search results seamlessly integrated into AI responses
- **Result Optimization**: Maximum 5 results for optimal performance
- **Guest Restrictions**: Available only to authenticated users

---

## Development Workflow

### Getting Started

#### 1. Prerequisites
```bash
# Required software
Node.js 18+
pnpm (package manager)
Git

# Required accounts
Appwrite account (cloud or self-hosted)
OpenRouter API key
OpenAI API key (optional)
Runware API key (optional)
Cloudinary account (optional)
```

#### 2. Installation
```bash
# Clone repository
git clone https://github.com/cyberboyayush/avchat.git
cd avchat

# Install dependencies
pnpm install

# Setup environment
cp env.example .env.local
# Edit .env.local with your API keys

# Setup database
pnpm run setup-appwrite

# Start development server
pnpm dev
```

#### 3. Development Scripts
```bash
# Development
pnpm dev          # Start dev server with Turbopack
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

### Code Organization

#### 1. File Naming Conventions
- **Components**: PascalCase (e.g., `ChatInterface.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAuthDialog.ts`)
- **Utilities**: camelCase (e.g., `hybridDB.ts`)
- **Types**: PascalCase interfaces (e.g., `interface Thread`)

#### 2. Import Organization
```typescript
// External libraries
import React from 'react';
import { NextRequest } from 'next/server';

// Internal utilities
import { HybridDB } from '@/lib/hybridDB';
import { useAuth } from '@/frontend/contexts/AuthContext';

// Components
import ChatInterface from '@/frontend/components/ChatInterface';
```

---

## Deployment

### Recommended Platform: Vercel

#### 1. Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Configure custom domain (optional)
```

#### 2. Environment Configuration
- **Production URLs**: Update auth callback URLs
- **API Keys**: Set all required environment variables
- **Database**: Ensure Appwrite is accessible
- **CDN**: Configure Cloudinary for production

#### 3. Performance Optimizations
- **Next.js**: Built-in optimizations
- **Turbopack**: Fast build times
- **Image Optimization**: Automatic image optimization
- **Code Splitting**: Automatic bundle splitting
- **Caching**: Aggressive caching strategies

---

## Contributing Guidelines

### How to Contribute

#### 1. Getting Started
```bash
# Fork the repository
# Clone your fork
git clone https://github.com/cyberboyayush/Avchat.git

# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git commit -m "feat: add your feature"

# Push and create PR
git push origin feature/your-feature-name
```

#### 2. Code Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Follow configured rules
- **Prettier**: Code formatting
- **Conventional Commits**: Commit message format

#### 3. Pull Request Process
1. **Description**: Clear description of changes
2. **Testing**: Ensure all tests pass
3. **Documentation**: Update relevant documentation
4. **Review**: Address review feedback
5. **Merge**: Squash and merge when approved

### Development Guidelines

#### 1. Performance First
- **Local-First**: Prioritize local operations
- **Lazy Loading**: Load components on demand
- **Memoization**: Prevent unnecessary re-renders
- **Bundle Size**: Monitor and optimize bundle size

#### 2. User Experience
- **Responsive**: Mobile-first design
- **Accessibility**: WCAG compliance
- **Loading States**: Clear loading indicators
- **Error Handling**: Graceful error recovery

#### 3. Code Quality
- **Type Safety**: Comprehensive TypeScript usage
- **Error Boundaries**: Prevent app crashes
- **Testing**: Unit and integration tests
- **Documentation**: Inline code documentation

---

## Recent Updates & New Features

### Web Search Enhancement (Latest Update)
- **Tavily Integration**: Replaced previous search implementation with Tavily's advanced search API
- **Universal Model Support**: Web search now works with any AI model, not limited to specific search models
- **Enhanced Citations**: Rich citation display with metadata, favicons, and expandable content
- **Improved UX**: Better loading states, error handling, and responsive design
- **Guest Restrictions**: Web search limited to authenticated users only
- **BYOK Support**: Users can now bring their own Tavily API key for web search functionality

### New Components Added
- **WebSearchCitations.tsx**: Rich citation display with metadata fetching
- **WebSearchLoader.tsx**: Animated loading states for search operations
- **AspectRatioSelector.tsx**: Enhanced image generation controls
- **RetryDropdown.tsx**: Improved model retry functionality
- **ChangelogPage.tsx**: Comprehensive changelog with version history and feature highlights

### Enhanced BYOK (Bring Your Own Key) System
- **Tavily API Key Support**: Added support for user's own Tavily API keys for web search
- **Multi-Provider Management**: Comprehensive key management for OpenRouter, OpenAI, and Tavily
- **Enhanced Settings UI**: Improved settings interface with individual key management sections
- **Key Validation**: Robust validation for each provider's key format
- **Secure Storage**: Browser-only storage with automatic fallback to system keys

### Enhanced Admin Features
- **Bulk Operations**: New `/api/admin/bulk-operations` endpoint for batch user management
- **Enhanced Data Deletion**: Improved `/api/admin/delete-data` with comprehensive cleanup
- **Better Error Handling**: Global error handling improvements across the platform

### Performance & UX Improvements
- **Streaming Optimizations**: Enhanced real-time message streaming
- **Citation System**: Automatic URL extraction and citation formatting
- **Mobile Responsiveness**: Improved mobile experience for web search features
- **Error Boundaries**: Better error recovery and user feedback
- **Navigation Enhancement**: Added changelog page accessible from user dropdown and settings
- **Documentation**: Comprehensive changelog with version history and feature highlights

### Security Enhancements
- **Guest Mode Restrictions**: Stricter limitations on guest user capabilities
- **API Validation**: Enhanced input validation across all endpoints
- **Session Management**: Improved session handling and security

---

## Additional Resources

### Documentation
- **README.md**: Quick start guide
- **docs/**: Detailed feature documentation
- **API Documentation**: Endpoint specifications
- **Component Docs**: Component usage guides

### Community
- **GitHub Issues**: Bug reports and feature requests
- **Discussions**: Community discussions
- **Discord**: Real-time community chat (planned)
- **Blog**: Development updates and tutorials

### Support
- **Email**: connect@ayush-sharma.in
- **GitHub**: Issue tracking and support
- **Documentation**: Comprehensive guides
- **Community**: Peer support

---

*This documentation is maintained by the AvChat development team. For the most up-to-date information, please refer to the GitHub repository and official documentation.*
