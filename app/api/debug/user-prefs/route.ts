import { NextRequest, NextResponse } from 'next/server';
import { getUserPreferences } from '@/lib/appwrite';

export async function GET(_req: NextRequest) {
  try {
    console.log('[Debug] Getting user preferences...');
    
    const preferences = await getUserPreferences();
    
    console.log('[Debug] Retrieved preferences:', preferences);
    
    return NextResponse.json({
      success: true,
      preferences,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Debug] Error getting user preferences:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
