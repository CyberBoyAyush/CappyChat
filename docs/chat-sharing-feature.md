# Chat Sharing Feature Documentation

## Overview

The Chat Sharing feature allows users to create public, view-only links for their chat conversations. Anyone with the link can view the chat, and logged-in users can branch the shared chat to continue the conversation in their own account.

## Features

### 1. Public Sharing
- Users can generate a public, view-only link for any chat conversation
- Anyone with the link can view the chat but cannot interact or modify it
- Shared chats are immutable and cannot be edited through the public link

### 2. Branch & Continue
- Logged-in users visiting a shared chat can branch it to create their own copy
- Branching creates a new chat session starting from the history of the shared chat
- Users can then continue the conversation from that point forward

### 3. Security & Privacy
- Only thread owners can share their conversations
- Shared threads are identified by unique, unguessable share IDs
- Authentication is required for branching functionality

## Implementation Details

### Database Schema

The following fields were added to the `threads` collection in Appwrite:

```typescript
interface AppwriteThread {
  // ... existing fields
  isShared?: boolean;     // Share status for thread sharing
  shareId?: string;       // Unique share ID for public access
  sharedAt?: string;      // ISO date string when thread was shared
}
```

### API Endpoints

#### POST `/api/share/create`
Creates a share link for a thread.

**Request:**
```json
{
  "threadId": "thread_123"
}
```

**Response:**
```json
{
  "success": true,
  "shareId": "share_abc123",
  "shareUrl": "https://avchat.xyz/share/share_abc123"
}
```

#### GET `/api/share/[shareId]`
Retrieves a shared thread and its messages (public access).

**Response:**
```json
{
  "success": true,
  "thread": {
    "id": "thread_123",
    "title": "Chat Title",
    "createdAt": "2024-01-01T00:00:00Z",
    "sharedAt": "2024-01-01T12:00:00Z",
    "isShared": true
  },
  "messages": [
    {
      "id": "msg_123",
      "role": "user",
      "content": "Hello",
      "createdAt": "2024-01-01T00:00:00Z",
      "model": "gpt-4",
      "attachments": []
    }
  ]
}
```

#### POST `/api/share/branch`
Branches a shared thread for a logged-in user.

**Request:**
```json
{
  "shareId": "share_abc123",
  "title": "Branched Chat Title"
}
```

**Response:**
```json
{
  "success": true,
  "threadId": "thread_456",
  "title": "Branched Chat Title"
}
```

### Components

#### ShareButton
- Located in `frontend/components/ShareButton.tsx`
- Integrated into the chat header (top-right action buttons)
- Provides one-click sharing with automatic link copying
- Hidden for guest users

#### SharedChatView
- Located in `frontend/components/SharedChatView.tsx`
- Displays shared conversations in view-only mode
- Shows branch button for logged-in users
- Handles error states for invalid/missing shares

#### SharedChatPage
- Located in `frontend/routes/SharedChatPage.tsx`
- Route component for `/share/:shareId`
- Renders the SharedChatView component

### Database Functions

#### HybridDB Functions
- `shareThread(threadId: string): Promise<string>` - Creates a share link
- `unshareThread(threadId: string): Promise<void>` - Removes sharing

#### AppwriteDB Functions
- `updateThreadSharing()` - Updates thread sharing status
- `getSharedThread()` - Retrieves shared thread by shareId
- `getThread()` - Gets thread for ownership verification

## Usage

### For Users

1. **Sharing a Chat:**
   - Click the share button (📤) in the top-right corner of any chat
   - The share link is automatically copied to your clipboard
   - Share the link with anyone you want to view the conversation

2. **Viewing a Shared Chat:**
   - Click on a shared link to view the conversation
   - The chat is displayed in read-only mode
   - You can see all messages but cannot interact

3. **Branching a Shared Chat:**
   - If you're logged in, click "Branch & Continue" on any shared chat
   - This creates a copy of the conversation in your account
   - You can then continue chatting from that point

### For Developers

1. **Adding Share Functionality:**
   ```typescript
   import { HybridDB } from '@/lib/hybridDB';
   
   // Share a thread
   const shareId = await HybridDB.shareThread(threadId);
   const shareUrl = `${window.location.origin}/share/${shareId}`;
   ```

2. **Checking Share Status:**
   ```typescript
   // Thread objects now include sharing fields
   const thread = HybridDB.getThreads().find(t => t.id === threadId);
   if (thread?.isShared) {
     console.log('Thread is shared with ID:', thread.shareId);
   }
   ```

## Backwards Compatibility

- All new database fields are optional with default values
- Existing threads continue to work without modification
- The feature gracefully degrades for guest users
- No breaking changes to existing APIs or components

## Security Considerations

- Share IDs are cryptographically random and unguessable
- Only thread owners can create share links
- Shared threads are immutable (cannot be modified via public access)
- Authentication is required for branching functionality
- No sensitive user information is exposed in shared views

## Future Enhancements

Potential improvements for future versions:

1. **Expiration Dates:** Add optional expiration for share links
2. **Access Control:** Allow password protection for sensitive shares
3. **Analytics:** Track view counts and access patterns
4. **Revocation:** Allow users to revoke existing share links
5. **Selective Sharing:** Share only specific parts of conversations
