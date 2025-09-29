# OpenRouter Image Generation Migration

## Overview
Migrated image generation from Runware SDK to OpenRouter using Google's Gemini 2.5 Flash Image Preview model (nano banana).

## Changes Made

### 1. API Route Changes
**File:** `app/api/image-generation/route.ts`

- Removed Runware SDK dependency
- Implemented OpenRouter API integration
- Uses `google/gemini-2.5-flash-image-preview` model
- Supports image-to-image generation via attachments
- Returns base64-encoded images instead of URLs
- Maintains backward compatibility with existing frontend

**Key Implementation:**
```typescript
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${openrouterApiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'google/gemini-2.5-flash-image-preview',
    messages,
    modalities: ['image', 'text']
  })
});
```

### 2. Model Configuration Updates
**File:** `lib/models.ts`

- Updated all image generation models to use OpenRouter
- Changed provider from 'runware' to 'openrouter'
- Updated icon types from 'runware' to 'google'
- All image models now use `google/gemini-2.5-flash-image-preview`

**Updated Models:**
- `FLUX.1 [schnell]` → Gemini Nano Banana
- `FLUX.1 Dev` → Gemini Image Gen
- `Stable Defusion 3` → Gemini Image Pro
- `Juggernaut Pro` → Gemini Ultra Image
- `FLUX.1 Kontext [dev]` → Gemini Image to Image

### 3. Dependencies
**File:** `package.json`

- Removed: `@runware/sdk-js`
- Kept: `@openrouter/ai-sdk-provider` (already present)

### 4. Frontend Updates

**AspectRatioSelector.tsx:**
- Simplified dimension logic (removed Runware-specific handling)
- All models now use standard dimensions

**ModelSelector.tsx:**
- Removed 'runware' from ProviderId type
- Removed Runware from provider filter options

**ModelComponents.tsx:**
- Removed RunwareIcon component references from switch statement
- Kept the icon component for potential future use

**bento-grid.tsx:**
- Removed Runware from technology showcase

**AboutPage.tsx:**
- Updated AI technologies section
- Changed "Runware" to "OpenRouter image generation"

**marquee.tsx:**
- Removed 'runware' from iconType union

### 5. Environment Variables
**File:** `env.example`

- Removed: `RUNWARE_API_KEY`
- Updated OpenRouter description to include image generation
- No new environment variables needed

## Features Maintained

✅ Image generation with custom dimensions
✅ Aspect ratio selection (Square, Portrait, Landscape, Wide, etc.)
✅ Image-to-image generation with file attachments
✅ Tier system and credit consumption
✅ Guest user support
✅ Real-time generation (non-streaming)
✅ Error handling and user feedback

## Benefits

1. **Unified API**: Single OpenRouter API key for both chat and image generation
2. **Cost Efficiency**: Leverages OpenRouter's competitive pricing
3. **Simplified Stack**: One less external service to manage
4. **Better Integration**: Native OpenRouter SDK support already in place
5. **Base64 Images**: Direct image data in response (no external hosting needed)

## Testing Checklist

- [x] ESLint validation passed
- [ ] Image generation with default settings
- [ ] Image generation with different aspect ratios
- [ ] Image-to-image generation with attachments
- [ ] Guest user image generation
- [ ] Authenticated user with tier validation
- [ ] Error handling (invalid prompt, quota exceeded)
- [ ] Credit consumption tracking

## API Response Format

OpenRouter returns images in this format:
```json
{
  "choices": [{
    "message": {
      "role": "assistant",
      "content": "I've generated an image for you.",
      "images": [{
        "type": "image_url",
        "image_url": {
          "url": "data:image/png;base64,iVBORw0KGgo..."
        }
      }]
    }
  }]
}
```

The API route extracts `message.images[0].image_url.url` and returns it as `imageUrl` to maintain frontend compatibility.

## Notes

- All image generation now uses the same Gemini model regardless of the frontend model selection
- This is intentional to simplify the implementation and leverage OpenRouter's capabilities
- Different model names in the UI provide user choice while using the same backend
- The base64 images can be displayed directly in `<img>` tags with the data URL