# DODO Payments Subscription Integration - Implementation Guide

## Overview

This document outlines the complete implementation of DODO Payments subscription system for AVChat. The implementation provides a production-ready subscription management system with dynamic currency detection, webhook handling, and seamless Appwrite integration.

## Architecture

### Core Components

1. **DODO Client Configuration** (`lib/dodo-client.ts`)
   - Centralized DODO Payments SDK initialization
   - Environment-specific configuration management
   - Product ID management for test/live environments

2. **Subscription Service** (`services/subscription.service.ts`)
   - Currency detection based on user timezone/locale
   - **Checkout session creation** (uses `checkoutSessions.create()` for full checkout experience)
   - Customer portal session management
   - Premium status validation
   - **Billing forms and discount code support** enabled via feature flags

3. **Webhook Handler** (`app/api/webhooks/dodo/route.ts`)
   - Secure webhook signature verification using DODO Next.js adapter
   - Subscription lifecycle event processing
   - Automatic user preference updates

4. **API Routes**
   - `/api/checkout/create` - Creates subscription checkout sessions
   - `/api/checkout/portal` - Generates customer portal URLs

5. **UI Components**
   - `SubscriptionSettings.tsx` - Main subscription management interface
   - `UpgradeButton.tsx` - Premium upgrade component with currency detection

6. **React Hooks**
   - `useSubscription.ts` - Subscription state management
   - `useIsPremium.ts` - Simplified premium status check

## Configuration

### Environment Variables

```env
# DODO Payments Configuration
DODO_PAYMENTS_API_KEY=gcbaon79nS5GMQ-X.USXebfOfFFoFaNt0BegWGXohSgwwlPZVBBIND31k-MGpqvs8
DODO_PAYMENTS_WEBHOOK_SECRET=whsec_Dhd0qFb9GMQ7XFFPvCV/ymjnauuIVGR1
DODO_PAYMENTS_ENVIRONMENT=test
DODO_PAYMENTS_TEST_PRODUCT_ID=pdt_hYSj2ZsKnz9PYPPLclDqr
DODO_PAYMENTS_LIVE_PRODUCT_ID=pdt_yeVZ4uNp4xT6wS6M3aXNV
```

### Pricing Structure

- **India (INR)**: ₹999/month
- **International (USD)**: $12/month

## User Preferences Schema

The subscription data is stored in Appwrite user preferences with the following structure:

```typescript
interface UserSubscription {
  tier: 'FREE' | 'PREMIUM';
  status: 'active' | 'cancelled' | 'expired' | 'on_hold' | 'failed';
  customerId?: string;
  subscriptionId?: string;
  currentPeriodEnd?: string; // ISO8601 timestamp
  cancelAtPeriodEnd?: boolean;
  currency?: 'INR' | 'USD';
  amount?: number;
  adminOverride?: boolean;
  lastPaymentId?: string;
  retryCount?: number;
  createdAt?: string; // ISO8601 timestamp
  updatedAt?: string; // ISO8601 timestamp
}
```

## Currency Detection Logic

The system automatically detects user currency using the following priority:

1. **Timezone Detection**: Checks for Indian timezones (Asia/Kolkata, etc.)
2. **Locale Detection**: Checks browser locale for 'IN' country code
3. **Default**: Falls back to USD for international users

```typescript
export const detectUserCurrency = (): Currency => {
  // Check timezone for India
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (timezone === 'Asia/Kolkata') return 'INR';
  
  // Check browser locale
  const locale = navigator.language;
  if (locale?.includes('IN')) return 'INR';
  
  return 'USD'; // Default
};
```

## Webhook Event Handling

The webhook handler processes the following DODO Payments events:

### Subscription Events

- **`subscription.active`**: New subscription or reactivation
  - Sets tier to PREMIUM
  - Updates subscription details
  - Upgrades user tier system

- **`subscription.renewed`**: Successful recurring payment
  - Extends current period
  - Resets retry count
  - Updates last payment ID

- **`subscription.cancelled`**: User cancellation
  - Marks as cancelled but keeps premium until period end
  - Sets `cancelAtPeriodEnd: true`

- **`subscription.expired`**: Subscription expired
  - Downgrades to FREE tier
  - Updates tier system

- **`subscription.failed`**: Payment failure
  - Increments retry count
  - Expires after 3 failed attempts

### Payment Events

- **`payment.succeeded`**: Successful payment
  - Updates last payment ID
  - Resets retry count

- **`payment.failed`**: Failed payment
  - Increments retry count

## Tier System Integration

The subscription system integrates with the existing tier system through the `hasSubscriptionPremium()` function:

```typescript
export const hasSubscriptionPremium = async (userId?: string): Promise<boolean> => {
  const subscription = await getUserSubscription();
  
  // Check admin override first
  if (subscription?.adminOverride) return true;
  
  // Check subscription status and expiry
  if (subscription?.status === 'active' && subscription?.tier === 'PREMIUM') {
    if (subscription.currentPeriodEnd) {
      const expiryDate = new Date(subscription.currentPeriodEnd);
      return expiryDate > new Date();
    }
    return true;
  }
  
  return false;
};
```

## Admin Override Functionality

Administrators can manually grant premium access through the admin panel:

```typescript
// Admin API endpoint: /api/admin/manage-user
{
  "action": "setSubscriptionOverride",
  "userId": "user_id",
  "subscriptionOverride": true
}
```

When `adminOverride: true`, the user has premium access regardless of payment status.

## Security Features

1. **Webhook Signature Verification**: Uses DODO's Next.js adapter for automatic signature validation
2. **Server-side Validation**: All subscription operations validated server-side
3. **User Authentication**: All API routes require valid user authentication
4. **Environment Isolation**: Separate test/live configurations

## Error Handling

The implementation includes comprehensive error handling:

- **API Errors**: Proper HTTP status codes and error messages
- **Webhook Failures**: Graceful degradation with logging
- **Payment Failures**: Retry logic with exponential backoff
- **Network Issues**: Timeout handling and retry mechanisms

## Testing Checklist

- [ ] Currency detection for different locales
- [ ] Subscription creation with test cards
- [ ] Webhook signature verification
- [ ] Subscription status updates
- [ ] Customer portal access
- [ ] Admin override functionality
- [ ] Payment failure scenarios
- [ ] Subscription cancellation flow

## Deployment Notes

1. **Webhook URL**: Configure in DODO dashboard as `https://avchat.xyz/api/webhooks/dodo`
2. **Environment Variables**: Ensure all DODO configuration is set in production
3. **SSL Certificate**: Required for webhook signature verification
4. **Database Backup**: Backup user preferences before deployment

## Monitoring and Logging

The system includes comprehensive logging for:

- Subscription creation and updates
- Webhook event processing
- Payment failures and retries
- Admin override actions
- Currency detection results

## Support and Maintenance

- **DODO Documentation**: https://docs.dodopayments.com
- **Webhook Events**: Monitor webhook delivery in DODO dashboard
- **Error Tracking**: Check application logs for subscription-related errors
- **User Support**: Customer portal provides self-service subscription management

## Recent Updates

### December 2024 - Fixed Checkout Experience for Billing Info and Discount Codes

**Problem**: The subscription checkout was using `dodoClient.subscriptions.create()` which created a direct subscription payment link that bypassed the full checkout experience, preventing users from entering billing information and discount codes.

**Solution**: Switched to `dodoClient.checkoutSessions.create()` which provides the proper checkout experience with:
- Full billing address forms
- Discount code input field
- Better user experience with all checkout features

**Key Changes**:
- Updated `createSubscriptionCheckout()` in `services/subscription.service.ts`
- Changed from `subscriptions.create()` to `checkoutSessions.create()`
- Added `feature_flags: { allow_discount_code: true }` to enable discount codes
- Used `product_cart` array instead of direct `product_id`
- Added `subscription_data` object for subscription-specific settings
- Updated response handling from `payment_link` to `checkout_url`
- Made `customerId` optional since it's only available after checkout completion

## Future Enhancements

1. **Multiple Subscription Plans**: Support for different pricing tiers
2. **Annual Billing**: Discount for yearly subscriptions
3. **Usage-based Billing**: Credits-based pricing model
4. **Dunning Management**: Advanced payment retry logic
5. **Analytics Integration**: Subscription metrics and reporting
