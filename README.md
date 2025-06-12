# AtChat

A realtime chat application with AI capabilities, IndexedDB local storage, and Appwrite DB synchronization.

## Features

- Realtime messaging with Appwrite Realtime API
- Local-first architecture using IndexedDB for speed
- Cloud synchronization with Appwrite Database
- User authentication with Appwrite Auth
- AI-powered chat capabilities

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Appwrite account

### Setting up Appwrite

1. Create a new project in Appwrite
2. Set up a database in Appwrite
3. Create API keys with the necessary permissions
4. Set up authentication method (email/password, OAuth, etc.)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/atchat.git
   cd atchat
   ```

2. Install dependencies
   ```bash
   pnpm install
   ```

3. Copy the example environment file and update with your Appwrite credentials
   ```bash
   cp env.example .env.local
   ```

4. Update `.env.local` with your Appwrite credentials:
   ```
   NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id_here
   NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id_here
   NEXT_PUBLIC_APPWRITE_THREADS_COLLECTION_ID=threads
   NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID=messages
   NEXT_PUBLIC_APPWRITE_MESSAGE_SUMMARIES_COLLECTION_ID=message_summaries
   
   # For server-side operations (such as setup scripts)
   APPWRITE_API_KEY=your_api_key_here
   
   # Authentication URLs - Update with your domain in production
   NEXT_PUBLIC_AUTH_SUCCESS_URL=http://localhost:3000/auth/callback
   NEXT_PUBLIC_AUTH_FAILURE_URL=http://localhost:3000/auth/error
   NEXT_PUBLIC_VERIFICATION_URL=http://localhost:3000/auth/verify
   
   # OpenRouter API Key if using AI features
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   ```

5. Set up Appwrite collections
   ```bash
   node scripts/setup-appwrite-db.js
   ```

## Database Schema

### 1. `threads` Collection

| Field           | Type      | Required |
|-----------------|-----------|----------|
| threadId        | String    | ✅       |
| userId          | String    | ✅       |
| title           | String    | ✅       |
| updatedAt       | Datetime  | ✅       |
| lastMessageAt   | Datetime  | ✅       |

### 2. `messages` Collection

| Field     | Type      | Required |
|-----------|-----------|----------|
| messageId | String    | ✅       |
| threadId  | String    | ✅       |
| userId    | String    | ✅       |
| content   | String    | ✅       |
| role      | String    | ✅       |
| createdAt | Datetime  | ✅       |

### 3. `message_summaries` Collection

| Field      | Type      | Required |
|------------|-----------|----------|
| summaryId  | String    | ✅       |
| threadId   | String    | ✅       |
| messageId  | String    | ✅       |
| userId     | String    | ✅       |
| content    | String    | ✅       |
| createdAt  | Datetime  | ✅       |

## Architecture

AtChat uses a local-first architecture:

1. All data is stored locally in IndexedDB (using Dexie.js)
2. Data is synchronized with Appwrite Database for cloud storage
3. Appwrite Realtime API enables realtime updates across devices
4. Authentication is handled by Appwrite Auth
5. All operations are user-scoped for privacy and security

## Development

```bash
pnpm dev
```

## Building for Production

```bash
pnpm build
pnpm start
```

## License

This project is licensed under the MIT License.
