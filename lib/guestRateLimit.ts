/**
 * Guest Rate Limiting - IP-based tracking for guest users only
 * Uses Upstash Redis for persistent storage across serverless instances
 */

import { NextRequest } from 'next/server';
import { Redis } from '@upstash/redis';

interface GuestUsage {
  count: number;
  resetTime: number;
}

// Validate required environment variables
if (!process.env.UPSTASH_REDIS_REST_URL) {
  throw new Error('UPSTASH_REDIS_REST_URL environment variable is required');
}

if (!process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error('UPSTASH_REDIS_REST_TOKEN environment variable is required');
}

// Initialize Redis client with validated credentials
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Guest limits: 2 messages per 24 hours per IP
const GUEST_MAX_MESSAGES = 2;
const GUEST_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
const GUEST_WINDOW_SECONDS = 24 * 60 * 60; // 24 hours in seconds for Redis TTL

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
  const key = `guest:ip:${clientIp}`;
  const now = Date.now();

  try {
    // Get current usage from Redis
    const usage = await redis.get<GuestUsage>(key);

    // No usage or expired - allow and create new entry
    if (!usage || usage.resetTime < now) {
      const newUsage: GuestUsage = {
        count: 1,
        resetTime: now + GUEST_WINDOW_MS,
      };
      await redis.set(key, newUsage, { ex: GUEST_WINDOW_SECONDS });
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
    const updatedUsage: GuestUsage = {
      count: usage.count + 1,
      resetTime: usage.resetTime,
    };
    await redis.set(key, updatedUsage, { ex: GUEST_WINDOW_SECONDS });

    return null;
  } catch (error) {
    console.error('[GuestRateLimit] Redis error:', error);
    // Fail open: allow request if Redis is down
    return null;
  }
}

/**
 * Get current guest usage for an IP (for displaying count)
 * Returns { count, maxMessages } or null if no usage
 */
export async function getGuestUsage(req: NextRequest): Promise<{ count: number; maxMessages: number }> {
  const clientIp = getClientIp(req);
  const key = `guest:ip:${clientIp}`;
  const now = Date.now();

  try {
    const usage = await redis.get<GuestUsage>(key);

    if (!usage || usage.resetTime < now) {
      return { count: 0, maxMessages: GUEST_MAX_MESSAGES };
    }

    return { count: usage.count, maxMessages: GUEST_MAX_MESSAGES };
  } catch (error) {
    console.error('[GuestRateLimit] Redis error in getGuestUsage:', error);
    // Return default values if Redis is down
    return { count: 0, maxMessages: GUEST_MAX_MESSAGES };
  }
}

