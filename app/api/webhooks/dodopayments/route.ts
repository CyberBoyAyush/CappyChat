/**
 * DODO Payments Webhook Route (Alternative URL)
 *
 * This route handles webhooks from DODO Payments at the URL:
 * https://test.avchat.xyz/api/webhooks/dodopayments
 *
 * This is an alias to the main webhook handler to support the URL
 * configured in DODO Payments dashboard.
 */

// Import the POST handler directly from the dodo route
export { POST } from '../dodo/route';
