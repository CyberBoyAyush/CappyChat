# Automatic Data Refresh Feature

## Overview

This feature automatically detects when local database data is missing (e.g., when user clears localStorage) and fetches fresh data from Appwrite backend without requiring the user to logout and login again.

## How It Works

### 1. Initialization Check
- When `HybridDB.initialize()` is called, it now checks if local data exists for authenticated users
- If data is missing or user ID doesn't match, it automatically refreshes from Appwrite

### 2. Periodic Monitoring
- Every 30 seconds, the app checks if local data exists for authenticated users
- If missing, it automatically triggers a refresh from Appwrite

### 3. Visibility Change Detection
- When the user switches back to the tab (page becomes visible), the app checks for missing data
- This catches cases where users might have cleared data while the tab was in the background

### 4. Window Focus Detection
- When the window gains focus, the app also checks for missing data
- Provides additional coverage for data loss detection

## Testing the Feature

### Method 1: Clear localStorage manually
1. Open browser DevTools (F12)
2. Go to Application/Storage tab
3. Clear localStorage for the site
4. Switch to another tab and back, or wait up to 30 seconds
5. Data should automatically reload from Appwrite

### Method 2: Using browser console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Run: `HybridDB.testDataRefresh()`
4. This will manually trigger the data refresh check

### Method 3: Clear specific data
1. In browser console, run:
   ```javascript
   localStorage.removeItem('atchat_threads');
   localStorage.removeItem('atchat_projects');
   ```
2. Switch tabs or wait for the periodic check
3. Data should automatically reload

## Implementation Details

### Key Components

1. **HybridDB.checkAndRefreshIfDataMissing(userId)**
   - Checks if local data exists and matches current user
   - Fetches fresh data from Appwrite if needed
   - Updates UI immediately with fresh data

2. **AuthContext periodic checks**
   - 30-second interval check for missing data
   - Window focus and visibility change listeners
   - Automatic refresh without user intervention

3. **Conditions for refresh**
   - No local threads AND no local projects data
   - Stored user ID doesn't match current authenticated user
   - User is authenticated (not guest)

### Benefits

- **Seamless UX**: Users don't need to logout/login when data is missing
- **Automatic Recovery**: App recovers from localStorage clearing automatically
- **Real-time Detection**: Multiple detection methods ensure quick recovery
- **Non-blocking**: Refresh happens in background without disrupting user

### Logging

The feature includes comprehensive logging for debugging:
- `[HybridDB] Local data missing or user mismatch, refreshing from Appwrite...`
- `[HybridDB] Data refresh completed successfully`
- `[AuthContext] Local data missing detected, refreshing from Appwrite...`

## Configuration

The feature is enabled by default for all authenticated users. Key settings:

- **Check interval**: 30 seconds (configurable in AuthContext)
- **Detection methods**: Periodic, visibility change, window focus
- **Scope**: Threads and Projects data (Messages are loaded on-demand)
