# Tool-Calling System Implementation

## Overview

This document describes the implementation of the intelligent tool-calling system for AVChat's web search functionality. The system automatically routes user queries to the most appropriate tool based on query analysis, providing specialized responses for different types of requests.

## Architecture

### Core Components

1. **Tool Definitions** (`lib/tools/actions.ts`)
   - Centralized tool registry with 4 specialized tools
   - Each tool has its own execution logic
   - Designed for easy extension with new tools

2. **Web Search Route** (`app/api/web-search/route.ts`)
   - Analyzes user queries using pattern matching
   - Routes to appropriate tool based on query intent
   - Maintains existing citation system
   - Preserves backward compatibility

## Available Tools

### 1. Web Search Tool
**Purpose:** Standard web search functionality  
**Use Cases:** General queries, news, articles, current information  
**Providers:** Parallel AI (default) or Tavily  
**Features:**
- Multi-query generation for better coverage (Parallel AI)
- Image search integration via Tavily
- Respects user's web tool preference

**Example Queries:**
- "What are the latest developments in AI?"
- "Tell me about the new iPhone"
- "Current events in technology"

### 2. Retrieval Tool
**Purpose:** Domain/website information retrieval  
**Use Cases:** Getting detailed information about specific websites  
**Provider:** Tavily (advanced search)  
**Features:**
- Deep domain analysis
- Comprehensive website information
- Includes answer summaries

**Example Queries:**
- "What is cappychat.com about?"
- "Tell me about github.com"
- "Information about openai.com"

### 3. Weather Tool
**Purpose:** Current weather information  
**Use Cases:** Weather queries for any location  
**Provider:** OpenWeather API (One Call API 3.0)  
**Features:**
- Geocoding for location resolution
- Temperature in Celsius and Fahrenheit
- Comprehensive weather data (humidity, wind, UV index, etc.)

**Example Queries:**
- "What's the weather in New York?"
- "Temperature in London"
- "Weather forecast for Tokyo"

### 4. Greeting Tool
**Purpose:** Simple greeting responses  
**Use Cases:** Casual greetings without heavy API calls  
**Features:**
- Lightweight processing
- No external API calls
- Fast response time

**Example Queries:**
- "Hello"
- "Hi there"
- "Good morning"

## Query Routing Logic

The system uses pattern matching to determine which tool to use:

```typescript
// 1. Greeting Detection
Pattern: /^(hi|hello|hey|good morning|...)[\s!?.]*$/i
Tool: greeting

// 2. Weather Detection
Keywords: "weather", "temperature", "forecast"
Tool: weather

// 3. Domain Retrieval Detection
Pattern: "what is/tell me about" + domain extensions (.com, .org, etc.)
Tool: retrieval

// 4. Default
All other queries → websearch
```

## Implementation Details

### Tool Execution Functions

Each tool has a dedicated execution function in `lib/tools/actions.ts`:

- `executeWebsearch(params)` - Web search execution
- `executeRetrieval(params)` - Domain retrieval execution
- `executeWeather(params)` - Weather data fetching
- `executeGreeting(params)` - Greeting handling

### Citation System

The citation system remains unchanged and works consistently across all tools:

1. **Search Results** → Extracted URLs
2. **HTML Comments** → `<!-- SEARCH_URLS: url1|url2|url3 -->`
3. **Frontend Parsing** → Clickable citations
4. **Image Gallery** → `<!-- SEARCH_IMAGES: img1|img2|img3 -->`

### Error Handling

The system includes comprehensive error handling:

1. **Tool Execution Errors** → Fallback to default websearch
2. **API Failures** → Graceful degradation
3. **Timeout Protection** → Credit consumption timeouts
4. **Logging** → Detailed debug logs for troubleshooting

## Configuration

### Environment Variables

```bash
# OpenRouter API Key (required)
OPENROUTER_API_KEY=your_key_here

# Tavily API Key (required for web search and retrieval)
TAVILY_API_KEY=your_key_here

# Parallel AI API Key (optional, for Parallel AI search)
PARALLELS_API_KEY=your_key_here

# OpenWeather API Key (required for weather tool)
OPENWEATHER_API_KEY=7165d509e4e248dff530e8458f1d4b96
```

### User Preferences

Users can configure their web search provider preference:
- **Parallel AI** (default) - Advanced multi-query search
- **Tavily** - Fast search with native image support

This preference is stored in user preferences as `webTool` field.

## Benefits

### 1. Intelligent Routing
- Automatic tool selection based on query intent
- No manual tool selection required
- Optimized for each use case

### 2. Specialized Responses
- Weather queries get structured weather data
- Domain queries get comprehensive website information
- Greetings get fast, lightweight responses

### 3. Extensibility
- Easy to add new tools
- Centralized tool registry
- Minimal code changes required

### 4. Backward Compatibility
- Existing citation system preserved
- No breaking changes to frontend
- Same API endpoint (`/api/web-search`)

## Future Enhancements

### Potential Improvements

1. **AI-Powered Tool Selection**
   - Use LLM to determine which tool(s) to call
   - Support multiple tool calls in sequence
   - More sophisticated query understanding

2. **Additional Tools**
   - News search tool
   - Academic paper search
   - Code search tool
   - Calculator/math tool
   - Translation tool

3. **Tool Chaining**
   - Allow tools to call other tools
   - Build complex workflows
   - Multi-step reasoning

4. **Performance Optimization**
   - Parallel tool execution
   - Caching for common queries
   - Faster response times

## Testing

### Manual Testing

Test each tool with appropriate queries:

```bash
# Web Search
"What are the latest AI developments?"

# Retrieval
"What is github.com about?"

# Weather
"What's the weather in New York?"

# Greeting
"Hello"
```

### Expected Behavior

1. **Tool Selection Logs** - Check console for tool selection messages
2. **Correct Tool Used** - Verify the right tool is called
3. **Citations Present** - Ensure citations are clickable
4. **Images Displayed** - Check image gallery for web/retrieval tools
5. **Weather Data** - Verify structured weather information

## Troubleshooting

### Common Issues

1. **Tool Not Detected**
   - Check query pattern matching logic
   - Verify query format
   - Review console logs

2. **API Errors**
   - Verify API keys in `.env.local`
   - Check API rate limits
   - Review error messages

3. **Missing Citations**
   - Ensure search results have URLs
   - Check HTML comment markers
   - Verify frontend parsing

## Code Structure

```
lib/tools/
  └── actions.ts          # Tool definitions and execution functions

app/api/web-search/
  └── route.ts            # Main web search endpoint with tool routing

docs/
  └── tool-calling-system.md  # This documentation
```

## Summary

The tool-calling system provides intelligent query routing with minimal code changes. It maintains backward compatibility while adding powerful new capabilities for specialized queries. The system is designed for easy extension and follows AVChat's principles of minimal, clean implementations.

