# Better Stack Logtail Implementation

## Overview
This document describes the Better Stack Logtail logging implementation for AVChat. The system sends structured logs to Better Stack in both development and production environments for comprehensive monitoring and debugging.

## Implementation Date
October 14, 2025

## ⚠️ Troubleshooting

### Logs Not Appearing in Better Stack?

If logs are only appearing in the console but not in Better Stack, follow these steps:

1. **Verify Environment Variables**:
   - Check that `.env.local` contains the correct Better Stack credentials
   - Restart the development server after adding/modifying environment variables
   - Environment variables must start with `NEXT_PUBLIC_` to be accessible in API routes

2. **Test the Integration**:
   - Visit `/api/test-betterstack` in your browser
   - Check the response to see if environment variables are loaded
   - Look for the test log in Better Stack dashboard

3. **Check Better Stack Dashboard**:
   - Go to https://betterstack.com → Telemetry → Live Tail
   - Filter by source: `chat-messaging`, `ai-text-generation`, or `test-endpoint`
   - Logs should appear within a few seconds of making API requests

4. **Common Issues**:
   - **Environment variables not loaded**: Restart the dev server
   - **Network errors**: Check firewall/proxy settings
   - **Invalid credentials**: Verify the source token and ingesting URL in Better Stack dashboard

## Components

### 1. Package Installation
- **Package**: `@logtail/next` (v0.2.1)
- **Installation**: `pnpm add @logtail/next`

### 2. Configuration

#### Environment Variables (`.env.local`)
```bash
# Better Stack / Logtail Configuration
# Server-side variables (for API routes)
BETTER_STACK_SOURCE_TOKEN=niJq5CKcm9Gux6pLkK4cj8U7
BETTER_STACK_INGESTING_URL=https://s1550272.eu-nbg-2.betterstackdata.com

# Client-side variables (for browser)
NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN=niJq5CKcm9Gux6pLkK4cj8U7
NEXT_PUBLIC_BETTER_STACK_INGESTING_URL=https://s1550272.eu-nbg-2.betterstackdata.com
```

#### Next.js Configuration (`next.config.ts`)
```typescript
import { withBetterStack } from "@logtail/next";

// Wrap config with Better Stack
export default withBundleAnalyzer(withBetterStack(nextConfig));
```

### 3. Logger Utility (`lib/betterstack-logger.ts`)

A centralized logging utility that provides:

#### Functions:
- `createBetterStackLogger(source: string)` - Creates a logger instance with a specific source
- `logToBetterStack(logger, level, message, context)` - Logs a message with context
- `logApiRequestStart(logger, endpoint, context)` - Logs API request start
- `logApiRequestSuccess(logger, endpoint, context)` - Logs API request success
- `logApiRequestError(logger, endpoint, error, context)` - Logs API request errors
- `logValidationError(logger, endpoint, field, message, context)` - Logs validation errors
- `logRateLimit(logger, endpoint, context)` - Logs rate limiting events
- `logCreditConsumption(logger, context)` - Logs credit consumption
- `flushLogs(logger)` - Flushes logs to Better Stack

#### Features:
- Sends logs to Better Stack via HTTP
- Maintains console logging for local development
- Provides structured logging with context
- Handles automatic flushing
- Works in both dev and production environments

### 4. API Route Integration

#### Chat Messaging Route (`app/api/chat-messaging/route.ts`)

**Logging Points:**
1. **Request Start** - Logs when a chat request begins
   - Context: userId, model, isGuest, hasAttachments, messageCount

2. **Validation Errors** - Logs validation failures
   - Missing messages array
   - Missing model
   - Invalid model
   - Tier limit exceeded
   - Insufficient credits

3. **Rate Limiting** - Logs when guest users hit rate limits
   - Context: userId (guest), reason

4. **Credit Consumption** - Logs credit usage
   - Context: userId, model, usingBYOK, creditsConsumed

5. **Streaming Start** - Logs when streaming begins
   - Context: userId, model, modelId, messageCount, hasCustomProfile, hasProjectPrompt, hasGlobalMemory, filesInContext

6. **Errors** - Logs OpenRouter API errors and internal errors
   - Context: userId, model, modelId, error details

#### AI Text Generation Route (`app/api/ai-text-generation/route.ts`)

**Logging Points:**
1. **Request Start** - Logs when a text generation request begins
   - Context: requestType (title/enhancement/suggestions/query-optimization/multi-query), hasPrompt, hasContext, hasSuggestions

2. **Validation Errors** - Logs validation failures
   - Missing API key
   - Missing prompt
   - Missing messageId
   - Missing threadId

3. **Success** - Logs successful generation for each request type
   - **Enhancement**: originalLength, enhancedLength
   - **Suggestions**: suggestionCount
   - **Query Optimization**: queryLength
   - **Multi-Query**: queryCount
   - **Title**: titleLength

4. **Errors** - Logs generation failures
   - Context: requestType, error details

## Key Features

### 1. Environment-Agnostic Logging
- Logs are sent to Better Stack in **both development and production** environments
- No need to change configuration between environments

### 2. Dual Logging
- **Console Logs**: Preserved for local development visibility
- **Better Stack Logs**: Sent to Better Stack for monitoring and debugging
- Console logs are automatically removed in production by Next.js (via `removeConsole: true`)

### 3. Structured Logging
All logs include:
- **Timestamp**: Automatic ISO timestamp
- **Event Type**: Categorized events (api_request_start, validation_error, etc.)
- **Context**: Relevant data (userId, model, error details, etc.)
- **Source**: Route identifier (chat-messaging, ai-text-generation)

### 4. Automatic Flushing
- Logs are automatically flushed before returning responses
- Ensures all logs reach Better Stack even for streaming responses

## Usage Example

```typescript
import {
  createBetterStackLogger,
  logApiRequestStart,
  logApiRequestSuccess,
  logApiRequestError,
  flushLogs,
} from "@/lib/betterstack-logger";

export async function POST(req: NextRequest) {
  const logger = createBetterStackLogger("my-api-route");
  
  try {
    // Log request start
    await logApiRequestStart(logger, "/api/my-route", {
      userId: "user123",
      action: "create",
    });
    
    // Your API logic here
    const result = await doSomething();
    
    // Log success
    await logApiRequestSuccess(logger, "/api/my-route", {
      resultId: result.id,
    });
    
    // Flush logs before returning
    await flushLogs(logger);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    // Log error
    await logApiRequestError(logger, "/api/my-route", error, {
      userId: "user123",
    });
    
    await flushLogs(logger);
    
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
```

## Viewing Logs

1. Go to Better Stack dashboard: https://betterstack.com
2. Navigate to Telemetry → Live Tail
3. Filter by source:
   - `chat-messaging` - Chat messaging API logs
   - `ai-text-generation` - AI text generation API logs

## Log Structure

Example log entry:
```json
{
  "timestamp": "2025-10-14T10:30:45.123Z",
  "level": "info",
  "message": "API Request: /api/chat-messaging",
  "event": "api_request_start",
  "endpoint": "/api/chat-messaging",
  "userId": "user123",
  "model": "GPT-4o",
  "isGuest": false,
  "hasAttachments": true,
  "messageCount": 5,
  "source": "chat-messaging"
}
```

## Benefits

1. **Real-time Monitoring**: See all API requests and errors in real-time
2. **Debugging**: Detailed context for troubleshooting issues
3. **Performance Tracking**: Monitor request patterns and credit consumption
4. **Error Tracking**: Catch and diagnose errors quickly
5. **User Behavior**: Understand how users interact with the API
6. **Production Visibility**: Full visibility into production without console logs

## Notes

- Logs are sent asynchronously and don't block API responses
- Better Stack Logger uses HTTP to send logs, so it's not affected by Next.js `removeConsole` setting
- All logs include structured context for easy filtering and searching
- The implementation is minimal and doesn't impact performance

