# Parallel AI Web Search Implementation

## Overview
Implemented Parallel AI as the default web search provider alongside Tavily, with multi-query search support and improved citation system based on Scira AI best practices.

## Key Features

### 1. Dual Provider Support
- **Parallel AI** (Default): Advanced multi-query search with better result quality
- **Tavily**: Traditional search with built-in image support
- User-selectable preference stored in user preferences

### 2. Multi-Query Search
- Generates 3-5 diverse search queries from user input
- Uses free AI text generation endpoint (Gemini 2.5 Flash Lite)
- First query is the main objective, others explore related aspects
- Improves search result comprehensiveness

### 3. Hybrid Image Support
- Parallel AI: Uses Tavily for images (Parallel AI doesn't support images)
- Tavily: Native image support included in search results
- Up to 15 images per search

### 4. Improved Citation System
- Inline citations immediately after facts (Scira AI style)
- Mandatory citation for every factual claim
- Proper markdown formatting with clickable links
- Forbidden: Grouped citations at end of response

## Implementation Details

### Files Modified

#### 1. `lib/appwrite.ts`
- Added `webTool?: 'parallels' | 'tavily'` to `UserTierPreferences` interface
- Updated `getUserPreferences()` to include webTool (defaults to 'parallels')
- Updated `initializeUserTier()` to set webTool: 'parallels' for new users

#### 2. `lib/tierSystem.ts`
- Updated `getUserPreferencesServer()` to include webTool
- Updated `ensureUserTierInitialized()` to set webTool for existing users without it (backward compatibility)

#### 3. `app/api/ai-text-generation/route.ts`
- Added `isMultiQuery` parameter for multi-query generation
- Generates 3-5 search queries using Gemini 2.5 Flash Lite
- Includes language consistency and temporal context
- Returns JSON array of queries

#### 4. `app/api/web-search/route.ts`
**Major refactor with:**
- Added helper functions:
  - `generateMultiQueries()`: Calls AI text generation for multi-query
  - `searchWithParallelAI()`: Performs Parallel AI search
  - `searchImagesWithTavily()`: Fetches images from Tavily
  
- Provider routing logic:
  - Checks user's webTool preference from user prefs
  - Routes to Parallel AI or Tavily based on preference
  - Parallel AI flow: Multi-query → Parallel AI search → Tavily images
  - Tavily flow: Single query → Tavily search (includes images)

- Result formatting:
  - Handles both Parallel AI (excerpts array) and Tavily (content string) formats
  - Unified result structure for LLM consumption

- Improved system prompts (Scira AI-inspired):
  - Mandatory inline citations
  - Proper markdown formatting
  - Forbidden section names (References, Citations, etc.)
  - LaTeX math formatting rules

#### 5. `frontend/routes/SettingsPage.tsx`
- Added webTool state management
- Added `handleSaveWebTool()` function
- Created Web Search Provider Selector UI:
  - Visual card-based selection
  - Parallel AI (Default) and Tavily options
  - Real-time preference saving
  - Success feedback

## API Integration

### Parallel AI Search API
```typescript
POST https://api.parallel.ai/v1beta/search
Headers:
  - Content-Type: application/json
  - x-api-key: PARALLELS_API_KEY

Body:
{
  "objective": "First query (main objective)",
  "search_queries": ["query1", "query2", "query3"],
  "processor": "base",
  "max_results": 10,
  "max_chars_per_result": 6000
}

Response:
{
  "search_id": "search_...",
  "results": [
    {
      "url": "...",
      "title": "...",
      "excerpts": ["...", "..."]
    }
  ]
}
```

### Multi-Query Generation
```typescript
POST /api/ai-text-generation
Body:
{
  "prompt": "User's search query",
  "isMultiQuery": true
}

Response:
{
  "queries": ["query1", "query2", "query3", "query4", "query5"],
  "isMultiQuery": true
}
```

## Environment Variables
- `PARALLELS_API_KEY`: Parallel AI API key (already in .env.local)
- `TAVILY_API_KEY`: Tavily API key (existing)

## User Experience

### Settings UI
1. Navigate to Settings → Application
2. Find "Web Search Provider" card
3. Choose between:
   - **Parallel AI** (Default): Advanced multi-query search
   - **Tavily**: Fast search with images
4. Selection saves automatically
5. Success feedback displayed

### Web Search Flow
1. User enables web search in chat
2. System checks user's webTool preference
3. If Parallel AI:
   - Generates 3-5 queries
   - Searches with Parallel AI
   - Fetches images from Tavily
4. If Tavily:
   - Single query search
   - Includes images natively
5. LLM receives formatted results
6. Response includes inline citations

## Backward Compatibility
- Existing users without webTool preference automatically get 'parallels' set
- No breaking changes to existing functionality
- Tavily remains fully functional as alternative option

## Benefits

### Parallel AI Advantages
- Multi-query approach for comprehensive results
- Better result quality and relevance
- Advanced ranking and compression
- Token-efficient excerpts

### Improved Citation System
- Inline citations improve readability
- Mandatory citations ensure accuracy
- Proper markdown formatting
- Clickable source links

### User Choice
- Flexibility to choose preferred provider
- Easy switching in settings
- Both providers deliver quality results

## Citation Rendering

### How Citations Work
1. **System Prompt** instructs LLM to use markdown format: `[Title](URL)`
2. **LLM generates** response with inline citations
3. **MarkdownRenderer** parses markdown using ReactMarkdown
4. **LinkComponent** renders each citation as clickable link with:
   - Primary color styling
   - Underline decoration
   - External link icon
   - Opens in new tab
   - Hover effects

### Example
**LLM Output:**
```markdown
Large language models (LLMs) are neural networks [LLM Guide](https://example.com/llm).
```

**Rendered:**
- Clickable link with text "LLM Guide"
- External link icon next to text
- Opens https://example.com/llm in new tab
- Styled with primary theme color

### Enhanced Link Styling
Updated `LinkComponent` in `MarkdownRenderer.tsx`:
- `font-medium` for better visibility
- `decoration-primary/60` for subtle underline
- `hover:decoration-primary` for emphasis on hover
- `cursor-pointer` for clear interactivity
- `flex-shrink-0` on icon to prevent squishing

## Testing Checklist
- [ ] New user signup sets webTool to 'parallels'
- [ ] Existing user login sets webTool to 'parallels' if not set
- [ ] Settings UI displays current preference
- [ ] Switching providers saves correctly
- [ ] Parallel AI search generates multi-queries
- [ ] Parallel AI search returns results
- [ ] Parallel AI fetches images from Tavily
- [ ] Tavily search works as before
- [ ] **Citations render as clickable markdown links**
- [ ] **External link icons appear on citations**
- [ ] **Citations open in new tab when clicked**
- [ ] Citation cards display at bottom
- [ ] Images display in gallery
- [ ] Web search works with all models

## Future Enhancements
- Add more search providers (Perplexity, Exa, etc.)
- Implement search quality metrics
- Add search result caching
- Support custom search parameters per provider
- Add search history and analytics

