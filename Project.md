
# AtChat Project Documentation

## 1. Introduction

Welcome to the comprehensive documentation for AtChat, a next-generation AI chat platform built for performance, scalability, and a seamless user experience. This document serves as a guide for developers, contributors, and anyone interested in understanding the inner workings of the application.

AVChat is a feature-rich chat application that integrates multiple AI models, real-time synchronization, and a modern, responsive user interface. It's built with a local-first architecture, ensuring a fast and reliable experience, even in offline scenarios.

## 2. Features

AVChat boasts a wide range of features designed to provide a powerful and intuitive chat experience:

*   **Multi-Model AI Support:** Seamlessly switch between various AI models from providers like OpenAI, Google, Anthropic, and more.
*   **Real-Time Sync:** Instantaneous synchronization of messages and threads across all your devices and browser tabs.
*   **Local-First Architecture:** The application is designed to work offline, with data stored locally in IndexedDB and synchronized with the cloud whenever a connection is available.
*   **Image Generation:** Generate images directly within the chat interface using models like DALL-E 3 and Stable Diffusion.
*   **Voice Input:** Use your voice to interact with the AI, powered by OpenAI's Whisper model for accurate speech-to-text transcription.
*   **Mobile-First Design:** A fully responsive interface that looks and works great on any device, from mobile phones to widescreen monitors.
*   **Project Management:** Organize your chats into projects, each with its own custom prompts and settings.
*   **File Uploads:** Upload files and documents to the chat and have the AI analyze them.
*   **Web Search:** The AI can search the web to provide you with the most up-to-date information.
*   **Markdown and Code Formatting:** Rich text formatting for messages, including support for Markdown, code blocks with syntax highlighting, and LaTeX for mathematical equations.
*   **Guest Mode:** Try out the application without creating an account.
*   **User Authentication:** Secure user authentication with email/password and OAuth providers like Google and GitHub.
*   **Session Management:** Monitor and manage your active sessions from the settings page.
*   **Admin Dashboard:** A dedicated dashboard for administrators to manage users and monitor application usage.

## 3. Tech Stack

AVChat is built with a modern and powerful tech stack, carefully chosen to deliver a high-quality user experience and a robust, scalable backend.

**Frontend:**

*   **Framework:** Next.js 15 with React 19
*   **Language:** TypeScript
*   **Styling:** TailwindCSS with PostCSS
*   **UI Components:** Shadcn UI, Radix UI
*   **State Management:** Zustand
*   **Routing:** React Router
*   **Forms:** React Hook Form with Zod for validation
*   **Markdown Rendering:** `react-markdown` with `remark-gfm` and `rehype-katex`

**Backend:**

*   **Framework:** Next.js API Routes
*   **Language:** TypeScript
*   **Database:** Appwrite (self-hosted or cloud)
*   **Real-time:** Appwrite Realtime
*   **AI Integration:**
    *   OpenRouter for multi-model support
    *   OpenAI for Whisper and DALL-E
    *   Runware for image generation
*   **File Uploads:** Cloudinary

**Local Storage:**

*   **Database:** IndexedDB via `dexie.js`

**Tooling:**

*   **Package Manager:** pnpm
*   **Linting:** ESLint
*   **Formatting:** Prettier
*   **Build Tool:** Next.js with Turbopack

## 4. Getting Started

Follow these instructions to set up and run the AVChat application on your local machine.

### Prerequisites

*   Node.js 18+
*   pnpm
*   An Appwrite instance (you can use the free cloud tier)
*   API keys for the various AI services you want to use (OpenAI, OpenRouter, etc.)

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/cyberboyayush/AVChat.git
    cd AVChat
    ```

2.  **Install dependencies:**

    ```bash
    pnpm install
    ```

3.  **Set up environment variables:**

    Create a `.env.local` file in the root of the project and add the necessary environment variables. You can use the `env.example` file as a template.

    For a detailed guide on all the environment variables, refer to the [README.md](README.md#--complete-environment-variables-guide).

4.  **Set up the Appwrite database:**

    You can either run the provided script to set up the database automatically or do it manually.

    **Automatic Setup:**

    ```bash
    pnpm run setup-appwrite
    ```

    **Manual Setup:**

    Refer to the [README.md](README.md#-step-3-database-setup-where-the-magic-lives) for detailed instructions on how to manually set up the Appwrite database, collections, and indexes.

5.  **Run the development server:**

    ```bash
    pnpm dev
    ```

    The application will be available at `http://localhost:3000`.

## 5. Project Structure

```
AVChat/
├── app/                     # Next.js 15 App Router
│   ├── api/                    # API routes (the server magic)
│   ├── layout.tsx              # Root layout (the foundation)
│   └── static-app-shell/       # SPA shell (for client-side routing)
├── frontend/                # React components & pages
│   ├── components/             # Reusable UI components
│   ├── contexts/               # React contexts (state management)
│   ├── hooks/                  # Custom hooks (the useful bits)
│   ├── routes/                 # Page components
│   └── stores/                 # Zustand stores (simple state)
├── lib/                     # Core utilities & configurations
│   ├── appwrite.ts             # Appwrite client setup
│   ├── hybridDB.ts             # Local-first database magic
│   ├── models.ts               # AI model configurations
│   └── tierSystem.ts           # User tier management
├── public/                  # Static assets
└── ── Various config files     # TypeScript, ESLint, etc.
```

## 6. Core Concepts

### HybridDB: The Local-First Database

At the heart of AVChat's performance and offline capabilities is the `HybridDB`, a custom-built data layer that combines the speed of a local IndexedDB database with the persistence and real-time capabilities of Appwrite.

**How it works:**

1.  **Local-First:** All data operations (create, read, update, delete) are first performed on the local IndexedDB database. This makes the UI incredibly fast and responsive, as there's no need to wait for a network request to complete.
2.  **Optimistic Updates:** The UI is immediately updated with the new data from the local database, providing a seamless user experience.
3.  **Background Sync:** After the local operation is complete, the changes are queued up and sent to the Appwrite backend for synchronization. This ensures that the data is persisted in the cloud and available across all the user's devices.
4.  **Real-time Updates:** The application subscribes to real-time updates from Appwrite. When a change is made on another device, the local database is updated with the new data, and the UI is automatically refreshed.

This architecture provides the best of both worlds: the speed and offline capabilities of a local database, and the persistence and real-time features of a cloud database.

### Real-Time Synchronization

Real-time sync is a critical feature of AVChat, and it's achieved through a combination of Appwrite Realtime and a custom streaming sync solution.

*   **Appwrite Realtime:** Used for synchronizing messages, threads, and projects across devices. The application subscribes to the relevant Appwrite collections, and whenever a change occurs, the local database is updated in real-time.
*   **Streaming Sync:** For AI responses, a custom streaming solution is used to provide a real-time, character-by-character streaming effect. This is achieved using a combination of WebSockets and a custom implementation that broadcasts streaming updates to all connected clients.

For a more detailed explanation of the real-time sync architecture, refer to the [REALTIMESYNC.md](REALTIMESYNC.md) document.

### State Management

AVChat uses a combination of React Context and Zustand for state management.

*   **React Context:** Used for managing global state that doesn't change often, such as the authenticated user, theme, and application settings. The `AuthContext` is a key part of the application, providing authentication state and methods to the rest of the components.
*   **Zustand:** Used for managing state that changes frequently, such as the list of messages in a thread, the current chat input, and the state of the various UI components. Zustand's simplicity and performance make it a great choice for managing the more dynamic parts of the application's state.

## 7. API Routes

The `app/api` directory contains all the backend API routes for the application. These routes are responsible for handling requests from the client, interacting with the Appwrite database, and calling the various AI services.

Here's a breakdown of the most important API routes:

*   **`/api/ai-text-generation`:** Handles requests for text generation from the various AI models.
*   **`/api/chat-messaging`:** Manages the creation and retrieval of chat messages.
*   **`/api/image-generation`:** Handles requests for image generation.
*   **`/api/speech-to-text`:** Processes audio files and returns the transcribed text.
*   **`/api/upload`:** Handles file uploads to Cloudinary.
*   **`/api/web-search`:** Performs web searches and returns the results to the AI.
*   **`/api/admin/*`:** A collection of routes for administrative tasks, such as managing users, resetting limits, and viewing application stats.

## 8. Frontend Components

The `frontend` directory contains all the React components, hooks, contexts, and stores that make up the user interface of the application.

Here are some of the most important components:

*   **`ChatInterface.tsx`:** The main component that renders the chat interface, including the message list, input field, and model selector.
*   **`ChatLayoutWrapper.tsx`:** A wrapper component that provides the basic layout for the chat interface, including the sidebar and main content area.
*   **`AuthContext.tsx`:** The authentication context, which manages the user's authentication state and provides methods for logging in, logging out, and refreshing the session.
*   **`HybridDB.ts`:** The local-first database implementation, which handles all data operations and synchronization with the Appwrite backend.
*   **`ChatAppRouter.tsx`:** The main router for the application, which defines all the client-side routes.
*   **`ChatSidebarPanel.tsx`:** The sidebar component, which displays the list of chat threads and projects.
*   **`ChatMessage.tsx`:** A component that renders a single chat message, including the author's avatar, the message content, and any attachments.

## 9. Contributing

Contributions are welcome! Please follow these guidelines when contributing to the project.

*   **Code Style:** Follow the existing code style. We use ESLint and Prettier to enforce a consistent code style.
*   **Commit Messages:** Use conventional commit messages. This helps us automatically generate changelogs and understand the history of the project.
*   **Pull Requests:** Before creating a pull request, please make sure that your code lints and builds without any errors. Provide a clear description of the changes you've made and why you've made them.

## 10. Deployment

We recommend deploying the application to Vercel. It's the easiest way to get your application up and running in production.

1.  **Fork the repository.**
2.  **Create a new project on Vercel and import your forked repository.**
3.  **Configure the environment variables.** Make sure to add all the environment variables from your `.env.local` file to the Vercel project settings.
4.  **Deploy!** Vercel will automatically build and deploy your application.

## 11. Troubleshooting

Here are some common issues you might encounter and how to solve them:

*   **"It's not working!"**
    *   Check the browser console for errors.
    *   Make sure that all the required environment variables are set correctly.
    *   Try restarting the development server.
    *   Clear your browser cache.
*   **"API calls are failing!"**
    *   Check your API keys.
    *   Verify your Appwrite permissions.
    *   Make sure that your Appwrite instance is running and accessible.
*   **"Styles look weird!"**
    *   Try running `pnpm build` to rebuild the TailwindCSS cache.
    *   Check for conflicting styles.
*   **"Real-time sync isn't working!"**
    *   Make sure that you have enabled real-time in your Appwrite project.
    *   Check the browser console for any WebSocket errors.
