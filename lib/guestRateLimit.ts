/**
 * Guest Rate Limiting - IP-based tracking for guest users only
 * Minimal implementation to prevent abuse
 */

import { NextRequest } from 'next/server';

interface GuestUsage {
  count: number;
  resetTime: number;
}

// In-memory store for guest IP tracking
const guestUsageMap = new Map<string, GuestUsage>();

// Cleanup old entries every 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, usage] of guestUsageMap.entries()) {
    if (usage.resetTime < now) {
      guestUsageMap.delete(ip);
    }
  }
}, 30 * 60 * 1000);

// Guest limits: 2 messages per 24 hours per IP
const GUEST_MAX_MESSAGES = 2;
const GUEST_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get client IP from request headers
 */
function getClientIp(req: NextRequest): string {
  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  
  if (cfConnectingIp) return cfConnectingIp;
  if (forwarded) return forwarded.split(',')[0].trim();
  if (realIp) return realIp;
  
  return 'unknown';
}

/**
 * Check and enforce guest rate limit
 * Returns Response if rate limited, null if allowed
 */
export async function checkGuestRateLimit(req: NextRequest): Promise<Response | null> {
  const clientIp = getClientIp(req);
  const now = Date.now();
  const usage = guestUsageMap.get(clientIp);

  // No usage or expired - allow and create new entry
  if (!usage || usage.resetTime < now) {
    guestUsageMap.set(clientIp, {
      count: 1,
      resetTime: now + GUEST_WINDOW_MS,
    });
    return null;
  }

  // Check if limit exceeded
  if (usage.count >= GUEST_MAX_MESSAGES) {
    const hoursRemaining = Math.ceil((usage.resetTime - now) / (60 * 60 * 1000));

    return new Response(
      JSON.stringify({
        error: `You've used all ${GUEST_MAX_MESSAGES} free messages. Sign up for unlimited access or try again in ${hoursRemaining} hour${hoursRemaining > 1 ? 's' : ''}.`,
        code: 'GUEST_RATE_LIMIT_EXCEEDED',
        resetTime: usage.resetTime,
        messagesUsed: usage.count,
        maxMessages: GUEST_MAX_MESSAGES,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil((usage.resetTime - now) / 1000).toString(),
        },
      }
    );
  }

  // Increment count
  usage.count++;
  guestUsageMap.set(clientIp, usage);

  return null;
}

/**
 * Get current guest usage for an IP (for displaying count)
 * Returns { count, maxMessages } or null if no usage
 */
export function getGuestUsage(req: NextRequest): { count: number; maxMessages: number } | null {
  const clientIp = getClientIp(req);
  const now = Date.now();
  const usage = guestUsageMap.get(clientIp);

  if (!usage || usage.resetTime < now) {
    return { count: 0, maxMessages: GUEST_MAX_MESSAGES };
  }

  return { count: usage.count, maxMessages: GUEST_MAX_MESSAGES };
}

