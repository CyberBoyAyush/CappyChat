# Tier System Implementation

This document describes the robust tier system implemented for AVChat, which manages user access to AI models based on credit limits.

## Overview

The tier system provides three tiers of access:
- **Free Tier**: 200 simple model credits, 20 premium model credits, 2 super premium model credits
- **Premium Tier**: 1500 simple model credits, 600 premium model credits, 30 super premium model credits  
- **Admin Tier**: Unlimited access to all models

## Key Features

### 1. Credit-Based Access Control
- Each AI model is categorized as simple, premium, or super premium
- Users consume credits based on the model type they use
- Credits are tracked in real-time and updated immediately after each API call

### 2. BYOK (Bring Your Own Key) Bypass
- Users with their own API keys bypass all tier restrictions
- No credits are consumed when using personal API keys
- Tier validation is skipped for BYOK users

### 3. Monthly Reset System
- Credits reset automatically on the 1st of each month
- Admin can manually trigger resets for all users or specific users
- Reset dates are tracked to prevent duplicate resets

### 4. Real-time Model Restrictions
- Models are dimmed and disabled when credits are exhausted
- Clear error messages inform users about credit limits
- Model selector shows remaining credits and tier status

## Implementation Details

### Files Modified/Created

#### Core System Files
- `lib/tierSystem.ts` - Main tier management logic
- `lib/appwrite.ts` - User preferences integration
- `app/api/chat-messaging/route.ts` - Credit validation and consumption
- `app/api/ai-text-generation/route.ts` - Credit tracking for title generation

#### UI Components
- `frontend/components/ModelSelector.tsx` - Tier-based model restrictions
- `frontend/routes/SettingsPage.tsx` - Tier display and management
- `frontend/contexts/AuthContext.tsx` - Tier initialization

#### Admin Features
- `app/api/admin/reset-limits/route.ts` - Manual limit reset API
- `app/api/admin/monthly-reset/route.ts` - Monthly reset automation
- `frontend/routes/AdminPage.tsx` - Admin interface

### Environment Variables Required

Add these to your `.env` file:

```env
# Server-side Appwrite API key with admin permissions
APPWRITE_API_KEY=your_appwrite_server_api_key_here

# Secret key for admin operations (generate a secure random string)
ADMIN_SECRET_KEY=your_secure_admin_secret_key_here
```

### User Preferences Structure

The system uses Appwrite user preferences to store tier data:

```json
{
  "tier": "free|premium|admin",
  "freeCredits": 200,
  "premiumCredits": 20,
  "superPremiumCredits": 2,
  "lastResetDate": "2025-01-01T00:00:00.000Z"
}
```

## Model Categories

### Simple Models (Free Credits)
- Gemini 2.5 Flash
- OpenAI 4.1 Mini
- OpenAI o4-mini
- Claude Sonnet 3.5 Haiku
- DeepSeek R1-0528
- DeepSeek V3
- Qwen3 235B A22B

### Premium Models (Premium Credits)
- OpenAI 4.1

### Super Premium Models (Super Premium Credits)
- Gemini 2.5 Flash Search
- OpenAI o3
- Gemini 2.5 Pro

## Usage Flow

1. **User Authentication**: Tier is initialized automatically for new/existing users
2. **Model Selection**: ModelSelector shows available models based on remaining credits
3. **API Call**: Credits are validated and consumed before making AI requests
4. **Real-time Updates**: UI reflects current credit status immediately
5. **Monthly Reset**: Credits are restored based on user's tier

## Admin Operations

### Manual Reset All Users
```bash
curl -X POST /api/admin/reset-limits \
  -H "Content-Type: application/json" \
  -d '{"adminKey": "your_admin_secret_key"}'
```

### Reset Specific User
```bash
curl -X POST /api/admin/reset-limits \
  -H "Content-Type: application/json" \
  -d '{"adminKey": "your_admin_secret_key", "userId": "user_id_here"}'
```

### Monthly Reset (Automated)
```bash
curl -X POST /api/admin/monthly-reset \
  -H "Content-Type: application/json" \
  -d '{"adminKey": "your_admin_secret_key"}'
```

## Security Features

- Admin operations require secret key authentication
- User preferences are validated on every request
- Credit consumption is atomic and immediate
- BYOK users are properly identified and bypassed
- All operations include comprehensive error handling

## User Experience

### Settings Page
- Displays current tier and remaining credits
- Shows usage progress bars for each model type
- Provides upgrade contact information
- Real-time updates when tier changes from admin console

### Model Selector
- Disabled models show "Credits exhausted" message
- Visual indicators for restricted access
- BYOK users see unlimited access
- Smooth transitions and clear feedback

## Monitoring and Maintenance

- All operations are logged for debugging
- Error handling prevents system failures
- Graceful degradation when services are unavailable
- Admin interface provides system status overview

## Future Enhancements

- Payment integration for automatic tier upgrades
- Usage analytics and reporting
- Custom tier configurations
- Bulk user management tools
- API rate limiting integration
