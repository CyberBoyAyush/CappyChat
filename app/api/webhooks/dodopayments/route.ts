/**
 * DODO Payments Webhook Route (Alternative URL)
 * 
 * This route handles webhooks from DODO Payments at the URL:
 * https://test.avchat.xyz/api/webhooks/dodopayments
 * 
 * This is an alias to the main webhook handler to support the URL
 * configured in DODO Payments dashboard.
 */

import { webhookHandler } from '../dodo/route';

// Re-export the webhook handler for the dodopayments URL
export const POST = webhookHandler;

// Handle unsupported methods
export async function GET() {
  return new Response(
    JSON.stringify({ 
      error: 'Method not allowed',
      message: 'This endpoint only accepts POST requests for webhook events'
    }),
    { 
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

export async function PUT() {
  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    { 
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

export async function DELETE() {
  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    { 
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}
