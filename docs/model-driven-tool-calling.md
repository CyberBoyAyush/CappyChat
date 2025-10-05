# Model-Driven Tool Calling System

## Overview

AVChat now uses **AI-driven tool calling** where the language model intelligently decides which tools to call based on the user's query. This implementation uses Vercel AI SDK's tool calling feature with OpenRouter models.

## Key Features

✅ **Model Decides Tool Selection** - The AI model analyzes the query and chooses appropriate tools  
✅ **Visible in OpenRouter Logs** - Tool calls are now visible in OpenRouter API logs  
✅ **Multiple Tool Calls** - Model can call multiple tools in sequence (maxSteps: 5)  
✅ **Intelligent Routing** - Better understanding of user intent compared to pattern matching  
✅ **User Preferences** - Tools are configured with user's webTool and Tavily API key preferences  

## Architecture

### Flow Diagram

```
User Query 
  ↓
AI Model (with tools)
  ↓
Model analyzes query
  ↓
Model selects tool(s) to call
  ↓
Tool(s) execute
  ↓
Model receives results
  ↓
Model generates response
  ↓
Stream to user
```

### Previous vs Current Implementation

| Aspect | Previous (Pattern Matching) | Current (Model-Driven) |
|--------|----------------------------|------------------------|
| **Tool Selection** | Regex patterns & keywords | AI model decision |
| **Visibility** | No tool calls in logs | Tool calls visible in OpenRouter |
| **Intelligence** | Fixed patterns | Contextual understanding |
| **Flexibility** | Limited to predefined patterns | Adapts to query nuances |
| **LLM Calls** | 1 call (after tool execution) | 1 call (with tool calling) |
| **Token Usage** | Lower | Similar (optimized with maxSteps) |

## Implementation Details

### 1. Tool Definitions (`lib/tools/actions.ts`)

Four specialized tools are defined:

```typescript
export const websearchTool = tool({
  description: 'Search the web for current information...',
  parameters: z.object({
    query: z.string(),
    webTool: z.enum(['parallels', 'tavily']).optional(),
    tavilyApiKey: z.string().optional(),
  }),
  execute: async ({ query, webTool, tavilyApiKey }) => { ... }
});

export const retrievalTool = tool({ ... });
export const weatherTool = tool({ ... });
export const greetingTool = tool({ ... });
```

### 2. User-Specific Tool Creation (`app/api/web-search/route.ts`)

Tools are created with user preferences baked in:

```typescript
const createUserTools = (webTool: 'parallels' | 'tavily', tavilyApiKey?: string) => ({
  websearch: tool({
    description: 'Search the web...',
    parameters: z.object({
      query: z.string()
    }),
    execute: async ({ query }) => {
      return executeWebsearch({ query, webTool, tavilyApiKey });
    }
  }),
  // ... other tools
});
```

**Why this approach?**
- User preferences (webTool, tavilyApiKey) are not something the model should decide
- They come from user settings/database
- We bind them to tools at runtime, so model only provides query-specific params

### 3. Model-Driven Tool Calling

```typescript
const userTools = createUserTools(webTool, tavilyApiKey);

const toolCallingResult = await generateText({
  model: aiModel,
  messages: processedMessages,
  tools: userTools,
  maxSteps: 5,
  system: `You are a helpful AI assistant with access to tools...
  
Analyze the user's query and intelligently select the appropriate tool(s):
- Use 'websearch' for general web searches, current events, news
- Use 'weather' when user asks about weather, temperature, forecast
- Use 'retrieval' when user asks about a specific website/domain
- Use 'greeting' ONLY for simple greetings without other requests

Call the appropriate tool(s) to gather information.`
});

// Extract tool results from steps
for (const step of toolCallingResult.steps) {
  if (step.toolCalls) {
    for (const toolCall of step.toolCalls) {
      // Process tool results
      const result = toolCall.result;
      toolResults[toolCall.toolName] = result;
    }
  }
}
```

### 4. Response Generation

After tools execute, the system:
1. Extracts search results and images from tool results
2. Formats them into context for the LLM
3. Makes a second `streamText` call to generate the final response
4. Streams the response to the client with citations

## Tool Descriptions

### 1. websearch
**Purpose:** Standard web search for current information, news, articles  
**Provider:** Parallel AI (default) or Tavily (user preference)  
**Parameters:** `query` (string)  
**Returns:** Search results array, images array  

**Example Queries:**
- "What are the latest AI developments?"
- "News about SpaceX"
- "How to make pasta carbonara"

### 2. retrieval
**Purpose:** Retrieve full content from a specific URL/website
**Provider:** Exa (live crawl with AI-powered content extraction)
**Parameters:**
- `url` (string) - The URL to retrieve content from
- `include_summary` (boolean, optional) - Include AI-generated summary (default: true)
- `live_crawl` (enum, optional) - Crawl mode: 'never', 'auto', 'preferred' (default: 'preferred')

**Returns:** Full text content, title, summary, author, published date, images, favicon

**Example Queries:**
- "What is github.com?"
- "Tell me about openai.com"
- "Get content from https://example.com"

**Key Features:**
- ✅ Live crawling for fresh content
- ✅ AI-generated summaries
- ✅ Full text extraction
- ✅ Metadata (author, publish date)
- ✅ Images and favicon extraction

### 3. weather
**Purpose:** Get current weather information for a location  
**Provider:** OpenWeather API (One Call 3.0 with fallback to Current Weather)  
**Parameters:** `location` (string)  
**Returns:** Temperature, conditions, humidity, wind, UV index, etc.  

**Example Queries:**
- "What's the weather in New York?"
- "Temperature in London"
- "Weather forecast for Tokyo"

### 4. greeting
**Purpose:** Handle simple greetings without external API calls  
**Provider:** None (lightweight response)  
**Parameters:** `greeting` (string)  
**Returns:** Greeting acknowledgment  

**Example Queries:**
- "Hello"
- "Hi there"
- "Good morning"

## Configuration

### Environment Variables

```env
# OpenRouter API
OPENROUTER_API_KEY=your_key_here

# Tavily API (for web search)
TAVILY_API_KEY=your_key_here

# Parallel AI (for web search)
PARALLELS_API_KEY=your_key_here

# Exa API (for content retrieval)
EXA_API_KEY=your_key_here

# OpenWeather API (for weather)
OPENWEATHER_API_KEY=your_key_here
```

### User Preferences

Users can configure:
- **webTool**: 'parallels' (default) or 'tavily'
- **tavilyApiKey**: Optional BYOK (Bring Your Own Key)

## Benefits of Model-Driven Approach

### 1. Better Intent Understanding
The model can understand nuanced queries that pattern matching would miss:
- "I'm planning a trip to Paris next week" → weather tool
- "Check out this cool site: example.com" → retrieval tool

### 2. Multi-Tool Capability
Model can call multiple tools in one query:
- "What's the weather in NYC and what's happening there?" → weather + websearch

### 3. Contextual Awareness
Model considers conversation history when selecting tools:
- User: "Tell me about OpenAI"
- Assistant: [uses retrieval tool]
- User: "What's their latest news?"
- Assistant: [uses websearch tool with context]

### 4. Graceful Degradation
If a tool fails, the model can:
- Try alternative tools
- Provide partial answers
- Explain what went wrong

### 5. Extensibility
Adding new tools is simple:
1. Define tool in `lib/tools/actions.ts`
2. Add to `createUserTools` function
3. Update system prompt with tool description
4. Done! Model automatically learns to use it

## OpenRouter Integration

### Tool Calls in Logs

With model-driven tool calling, OpenRouter logs now show:
- **Tool calls made by the model**
- **Tool parameters**
- **Tool execution results**
- **Token usage for tool calling**

This provides better visibility into:
- Which tools are being used
- How often each tool is called
- Token costs for tool calling
- Debugging tool selection issues

### Supported Models

All OpenRouter models that support function calling work with this system:
- ✅ GPT-4, GPT-4 Turbo, GPT-3.5 Turbo
- ✅ Claude 3 Opus, Sonnet, Haiku
- ✅ Gemini Pro, Gemini Flash
- ✅ Llama 3, Llama 3.1
- ✅ Mistral Large, Mistral Medium

## Testing

### Test Queries

**Web Search:**
```
"What are the latest developments in AI?"
"News about climate change"
```

**Weather:**
```
"What's the weather in New York?"
"Temperature in London today"
```

**Retrieval:**
```
"What is github.com?"
"Tell me about openai.com"
```

**Greeting:**
```
"Hello"
"Hi there"
```

**Multi-Tool:**
```
"What's the weather in Paris and what's happening there?"
```

### Expected Behavior

1. Model analyzes query
2. Selects appropriate tool(s)
3. Tool(s) execute and return results
4. Model generates response with citations
5. Response streams to user

## Troubleshooting

### Tool Not Being Called

**Issue:** Model doesn't call any tools  
**Solution:** Check system prompt, ensure tool descriptions are clear

### Wrong Tool Selected

**Issue:** Model calls wrong tool for query  
**Solution:** Improve tool descriptions, add more examples in system prompt

### Tool Execution Fails

**Issue:** Tool returns error  
**Solution:** Check API keys, network connectivity, fallback to websearch

### No Results in Response

**Issue:** Tool executes but no results shown  
**Solution:** Check result extraction logic, ensure results are passed to LLM

## Future Enhancements

1. **More Tools:**
   - Calculator tool for math queries
   - Code execution tool for programming questions
   - Image generation tool for creative requests

2. **Tool Chaining:**
   - Allow tools to call other tools
   - Build complex workflows

3. **Tool Learning:**
   - Track which tools work best for which queries
   - Optimize tool selection over time

4. **User Feedback:**
   - Allow users to rate tool selections
   - Improve model prompts based on feedback

## Conclusion

The model-driven tool calling system provides intelligent, flexible, and extensible tool selection for AVChat. By letting the AI model decide which tools to use, we achieve better intent understanding, multi-tool capability, and graceful degradation compared to pattern matching.

**Key Takeaway:** The model is now in control of tool selection, making AVChat smarter and more capable of handling diverse user queries.

