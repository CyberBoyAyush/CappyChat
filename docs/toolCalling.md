# Tool Calling System - Simple Implementation Guide

## Overview

AVChat uses an **AI-powered tool calling system** where the AI model intelligently decides which tools to call based on user queries. This is a modern approach that replaces pattern matching with model-driven decision making.

## How It Works

### Simple Flow

```
User Query → AI Model → Decides Tool → Executes Tool → Streams Response
```

**Example:**
```
User: "weather in Tokyo"
  ↓
AI Model: "I should use the weather tool"
  ↓
Weather Tool: Fetches data from OpenWeather API
  ↓
AI Model: Formats response with weather data
  ↓
User: Sees formatted weather information
```

## Available Tools

### 1. 🌐 Web Search Tool
**What it does:** Searches the web for current information

**When AI uses it:**
- General questions about current events
- News queries
- "What is happening with..."
- "Latest information about..."

**How it works:**
- Uses **Parallel AI** for multi-query search (3-5 queries)
- Gets images from **Tavily API**
- Returns search results with URLs and images

**Example:**
```
User: "latest AI developments"
AI: Calls websearch tool → Gets results → Formats with citations
```

### 2. 🔗 Retrieval Tool
**What it does:** Gets detailed information about specific websites

**When AI uses it:**
- "What is github.com?"
- "Tell me about openai.com"
- Queries about specific domains

**How it works:**
- Uses **Exa API** for live website crawling
- Gets title, summary, favicon, banner image
- AI-powered content extraction

**Example:**
```
User: "what is scira.ai"
AI: Calls retrieval tool → Crawls website → Shows card with favicon/banner
```

### 3. 🌧️ Weather Tool
**What it does:** Gets current weather for any location

**When AI uses it:**
- "Weather in [city]"
- "Temperature in [location]"
- "What's the weather like..."

**How it works:**
- Uses **OpenWeather API**
- Geocoding for location resolution
- Returns temperature, humidity, wind, UV index, etc.

**Example:**
```
User: "weather in Tokyo"
AI: Calls weather tool → Gets weather data → Formats nicely
```

### 4. 👋 Greeting Tool
**What it does:** Handles simple greetings efficiently

**When AI uses it:**
- "Hello"
- "Hi"
- "Good morning"

**How it works:**
- No external API calls
- Fast, lightweight response
- Just acknowledges the greeting

## Technical Implementation

### File Structure

```
lib/tools/
  └── actions.ts              # Tool definitions

app/api/web-search/
  └── route.ts                # Main endpoint with AI model

frontend/components/
  ├── WebSearchLoader.tsx     # Loading UI
  ├── RetrievalCard.tsx       # Website preview card
  └── WebSearchCitations.tsx  # Citation display
```

### How Tools Are Defined

Each tool is defined using Vercel AI SDK's `tool()` function:

```typescript
export const weatherTool = tool({
  description: 'Get current weather for a location',
  parameters: z.object({
    location: z.string().describe('City name or location'),
  }),
  execute: async ({ location }) => {
    // Fetch weather data
    return { temperature, humidity, conditions, ... };
  },
});
```

### How AI Decides Which Tool

The AI model reads tool descriptions and decides automatically:

```typescript
const result = streamText({
  model: aiModel,
  messages: userMessages,
  tools: {
    websearch: websearchTool,
    retrieval: retrievalTool,
    weather: weatherTool,
    greeting: greetingTool,
  },
  maxSteps: 5, // Allow up to 5 tool calls
});
```

**The AI model:**
1. Reads user query
2. Looks at available tools and their descriptions
3. Decides which tool(s) to call
4. Executes the tool(s)
5. Uses results to generate response

## User Experience Features

### 1. Loading Indicators

While tools execute, users see a loader that shows which tool is being called:

- 🌐 **Web Search Tool** - "Searching the web..."
- 🔗 **Retrieval Tool** - "Crawling website content..."
- 🌧️ **Weather Tool** - "Fetching current weather data..."
- 👋 **Greeting Tool** - "Preparing response..."

### 2. Retrieval Cards

When the retrieval tool is used, users see a beautiful card with:
- Website favicon
- Banner image (og:image)
- Title
- AI-generated summary
- Link to source

### 3. Citations

Web search results include clickable citations:
- Inline citations: `[1](url)`, `[2](url)`
- Collapsible source list at the bottom
- Direct links to sources

### 4. Image Gallery

Web search and retrieval can show images:
- Up to 15 images per search
- Collapsible gallery
- Full-screen preview on click

## Configuration

### Environment Variables

```bash
# Required for web search
PARALLELS_API_KEY=your_parallel_ai_key
TAVILY_API_KEY=your_tavily_key

# Required for retrieval
EXA_API_KEY=your_exa_key

# Required for weather
OPENWEATHER_API_KEY=your_openweather_key

# Required for AI model
OPENROUTER_API_KEY=your_openrouter_key
```

### User Preferences

Users can configure:
- **Web Tool Preference**: Parallel AI (default) or Tavily
- **BYOK**: Bring Your Own Tavily API Key

## Benefits of This Approach

### ✅ Intelligent
- AI decides the best tool for each query
- No rigid pattern matching
- Handles complex queries naturally

### ✅ Flexible
- Easy to add new tools
- Just define the tool and AI learns to use it
- No need to update routing logic

### ✅ User-Friendly
- Transparent - users see which tool is being used
- Fast - tools execute in parallel when possible
- Reliable - fallback to web search if tool fails

### ✅ Developer-Friendly
- Minimal code - tool definitions are simple
- Centralized - all tools in one file
- Extensible - add new tools easily

## Adding a New Tool

To add a new tool, follow these steps:

1. **Define the tool** in `lib/tools/actions.ts`:

```typescript
export const calculatorTool = tool({
  description: 'Perform mathematical calculations',
  parameters: z.object({
    expression: z.string().describe('Math expression to evaluate'),
  }),
  execute: async ({ expression }) => {
    const result = eval(expression); // Use a safe eval library!
    return { result, expression };
  },
});
```

2. **Add to tool registry** in `app/api/web-search/route.ts`:

```typescript
const userTools = {
  websearch: websearchTool,
  retrieval: retrievalTool,
  weather: weatherTool,
  greeting: greetingTool,
  calculator: calculatorTool, // ← Add here
};
```

3. **Update system prompt** (optional):

```typescript
system: `You have access to these tools:
- websearch: Search the web
- retrieval: Get website info
- weather: Get weather data
- greeting: Respond to greetings
- calculator: Perform math calculations  ← Add description
...`
```

That's it! The AI will automatically learn to use the new tool.

## Troubleshooting

### Tool Not Being Called

**Problem:** AI doesn't call the expected tool

**Solutions:**
- Check tool description - make it clear and specific
- Verify tool parameters are properly defined
- Check console logs for tool selection messages

### API Errors

**Problem:** Tool execution fails

**Solutions:**
- Verify API keys in `.env.local`
- Check API rate limits
- Review error messages in console

### Missing Results

**Problem:** Tool returns but no data shown

**Solutions:**
- Check tool return format
- Verify frontend parsing logic
- Review HTML comment markers for images/citations

## Summary

AVChat's tool calling system is:
- **Simple**: AI decides which tool to use
- **Powerful**: Multiple specialized tools for different tasks
- **Extensible**: Easy to add new tools
- **User-Friendly**: Clear feedback and beautiful UI

The system uses modern AI capabilities to provide intelligent, context-aware responses without complex routing logic.

