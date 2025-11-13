===== BEGIN FILE: TASK_08_Subscription_Billing.md =====

# TASK 08: Subscription and Billing for SaaS Platform

## Purpose

Implement tiered subscription plans with Stripe integration for recurring billing. Operators subscribe to unlock features and increase quotas. System enforces quotas and handles subscription lifecycle.

## Priority

Critical for MVP monetization.

## Dependencies

- TASK_01: Authentication System.
- Stripe account configured with products and prices.
- Database schema for OperatorSubscription entity.

## Acceptance Criteria

1. Four subscription tiers defined: Free, Professional, Business, Enterprise.
2. Pricing page displays tier features and pricing.
3. Operator can upgrade via Stripe Checkout (redirect flow).
4. Subscription status synced via Stripe webhooks (subscription.created, subscription.updated, invoice.paid, invoice.payment_failed).
5. Operator can manage subscription via Stripe Customer Portal (upgrade, downgrade, cancel, update payment method).
6. Quotas enforced in real-time based on subscription tier (storage, uploads/month, projects, sites, features).
7. Downgrade handling: Grace period (7 days) after payment failure before downgrading to Free tier.
8. Proration: Upgrading charges prorated amount immediately, downgrading applies credit to next cycle.
9. Cancellation: Subscription remains active until current period end, then reverts to Free tier.
10. Trial period optional (14-day free trial for Professional tier).

## UI Description

### Pricing Page

**URL:** /pricing

**Components:**
- Hero section: "Choose the plan that fits your needs".
- Billing toggle: Monthly vs. Annual (Annual shows "Save 17%" badge).
- Four pricing cards in grid (1 column mobile, 4 columns desktop):

**Free Tier Card:**
- Title: "Free".
- Price: "$0 / month".
- Features list:
  - 2 GB storage.
  - 100 image uploads/month.
  - 3 Projects.
  - Side-by-side comparison.
  - 30-day retention.
  - Community support.
- CTA button: "Get Started" (signup if not logged in, "Current Plan" if active).

**Professional Tier Card:**
- Title: "Professional" with "Most Popular" badge.
- Price: "$29 / month" or "$290 / year".
- Features list:
  - 50 GB storage.
  - 1,000 image uploads/month.
  - Unlimited Projects.
  - Layered overlay comparison.
  - 1-year retention.
  - Email support.
- CTA button: "Upgrade" (opens Stripe Checkout).

**Business Tier Card:**
- Title: "Business".
- Price: "$99 / month" or "$990 / year".
- Features list:
  - 500 GB storage.
  - Unlimited uploads.
  - Unlimited Projects.
  - Video uploads (500 MB max per file).
  - 3-year retention.
  - Priority support.
  - Custom branding.
- CTA button: "Upgrade".

**Enterprise Tier Card:**
- Title: "Enterprise".
- Price: "Custom".
- Features list:
  - Unlimited storage.
  - Photogrammetry processing.
  - Lifetime retention.
  - Dedicated account manager.
  - API access.
  - Custom integrations.
- CTA button: "Contact Sales".

**FAQ Section:**
- Common questions about billing, cancellation, refunds, proration.

### Upgrade Flow

**Steps:**
1. User clicks "Upgrade" on pricing card.
2. Frontend calls POST /api/v1/subscriptions/checkout with tier.
3. Backend creates Stripe Checkout Session.
4. User redirected to Stripe-hosted checkout page.
5. User enters payment details, confirms.
6. Stripe processes payment and redirects back to success page.
7. Webhook received, subscription status updated.
8. User redirected to dashboard with "Subscription activated!" toast.

### Subscription Management (Settings)

**Location:** /settings/subscription

**Components:**
- Current plan card:
  - Tier name, status (Active, PastDue, Trialing, Cancelled).
  - Current period: "Feb 1 - Mar 1, 2025".
  - Next billing date.
  - Payment method (last 4 digits of card).
- Quota usage section:
  - Storage: "12 GB / 50 GB" with progress bar.
  - Uploads this month: "345 / 1,000".
  - Projects: "12 / Unlimited".
- Actions:
  - "Change Plan" button (opens pricing modal).
  - "Manage Billing" button (opens Stripe Customer Portal).
  - "Cancel Subscription" button (confirmation dialog).

### Stripe Customer Portal

**Access:** Click "Manage Billing" in settings.

**Behavior:**
- Frontend calls POST /api/v1/subscriptions/portal.
- Backend creates Stripe Customer Portal session.
- User redirected to Stripe portal.
- User can:
  - Update payment method.
  - View invoices and payment history.
  - Upgrade/downgrade plans.
  - Cancel subscription.
- After changes, Stripe sends webhooks to update platform state.

### Quota Warning Banners

**Storage Quota:**
- At 90% usage: Warning banner "You're running low on storage. [Upgrade] to continue uploading."
- At 100% usage: Error banner "Storage quota exceeded. [Upgrade] or [delete old images] to continue."

**Upload Quota:**
- At 80% of monthly limit: Warning toast "You've used 80% of your monthly uploads."
- At 100%: Error on upload attempt "Monthly upload limit reached. Upgrade or wait until [next reset date]."

## API Endpoints

### POST /api/v1/subscriptions/checkout

**Request Body:**
```
{
  "tier": "Professional",
  "billing_period": "monthly" // or "annual"
}
```

**Response (200 OK):**
```
{
  "checkout_url": "https://checkout.stripe.com/c/pay/cs_test_..."
}
```

**Behavior:**
- Create Stripe Checkout Session with:
  - Mode: "subscription".
  - Line items: Selected tier price ID.
  - Customer: Stripe customer ID (create if doesn't exist).
  - Success URL: {frontend_url}/subscription/success?session_id={CHECKOUT_SESSION_ID}.
  - Cancel URL: {frontend_url}/pricing.
  - Allow promotion codes: true.
- Return checkout URL to frontend.

### POST /api/v1/subscriptions/portal

**Response (200 OK):**
```
{
  "portal_url": "https://billing.stripe.com/p/session/..."
}
```

**Behavior:**
- Create Stripe Customer Portal session for current user's customer ID.
- Return portal URL.

### GET /api/v1/subscriptions/current

**Response (200 OK):**
```
{
  "subscription_id": "uuid",
  "tier": "Professional",
  "status": "Active",
  "current_period_start": "2025-02-01T00:00:00Z",
  "current_period_end": "2025-03-01T00:00:00Z",
  "cancel_at_period_end": false,
  "quotas": {
    "storage_gb": 50,
    "storage_used_gb": 12.3,
    "uploads_per_month": 1000,
    "uploads_this_month": 345,
    "projects": "unlimited",
    "projects_used": 12,
    "sites_per_project": 20
  }
}
```

### Webhook: POST /webhooks/stripe/subscriptions

**Events Handled:**
- **checkout.session.completed:** Subscription created, associate with user.
- **customer.subscription.created:** Create OperatorSubscription record.
- **customer.subscription.updated:** Update tier, status, period.
- **customer.subscription.deleted:** Set status to Cancelled.
- **invoice.paid:** Subscription active, reset monthly quotas.
- **invoice.payment_failed:** Set status to PastDue, send notification email, start grace period.

**Behavior:**
- Verify webhook signature using Stripe signing secret.
- Parse event data.
- Update OperatorSubscription record in database.
- Invalidate cached quota data.
- Send notification email if needed (payment failed, subscription cancelled).

## Test Scenarios

### Test 1: Successful Upgrade to Professional

**Steps:**
1. Free tier user clicks "Upgrade" on Professional tier.
2. Redirected to Stripe Checkout.
3. Enters test card (4242 4242 4242 4242).
4. Completes checkout.
5. Webhook received.
6. User redirected back to dashboard.

**Expected:** Subscription status updated to Professional, quotas increased, user sees success message.

### Test 2: Payment Failure

**Steps:**
1. User upgrades with test card that declines (4000 0000 0000 0002).
2. Stripe attempts payment, fails.

**Expected:** User sees error on checkout, no subscription created, remains on Free tier.

### Test 3: Subscription Renewal

**Steps:**
1. User has active Professional subscription.
2. Manually trigger Stripe invoice.payment_succeeded webhook (simulate monthly renewal).

**Expected:** Subscription remains active, upload counter resets to 0.

### Test 4: Payment Failure on Renewal

**Steps:**
1. User has active subscription.
2. Simulate invoice.payment_failed webhook.

**Expected:** Status set to PastDue, user receives email notification, 7-day grace period starts.

### Test 5: Downgrade After Grace Period

**Steps:**
1. Subscription in PastDue status.
2. 7 days pass without payment.
3. Run cron job to downgrade expired subscriptions.

**Expected:** Subscription downgraded to Free tier, quotas enforced.

### Test 6: Cancel Subscription

**Steps:**
1. User clicks "Cancel Subscription" in settings.
2. Confirms cancellation.
3. Stripe subscription cancelled (cancel_at_period_end = true).

**Expected:** Subscription remains active until period end, then reverts to Free tier.

### Test 7: Upgrade Mid-Cycle

**Steps:**
1. User has Professional subscription (started 15 days ago, 30-day cycle).
2. Upgrades to Business.
3. Stripe charges prorated amount for remaining 15 days.

**Expected:** Subscription immediately upgraded, prorated charge applied, new cycle starts.

### Test 8: Downgrade Mid-Cycle

**Steps:**
1. User has Business subscription.
2. Downgrades to Professional mid-cycle.

**Expected:** Subscription remains Business until period end, then downgrades, credit applied to next invoice.

### Test 9: Storage Quota Enforcement

**Steps:**
1. Professional user has 49.5 GB used (50 GB quota).
2. Attempts to upload 1 GB image.

**Expected:** Error "Storage quota exceeded. Upgrade to continue." Upload rejected.

### Test 10: Upload Count Quota Reset

**Steps:**
1. User has 100 / 100 uploads used this month.
2. New billing cycle starts.
3. Check upload counter.

**Expected:** Counter reset to 0 / 1000.

### Test 11: Stripe Customer Portal

**Steps:**
1. User clicks "Manage Billing".
2. Redirected to Stripe Portal.
3. Updates payment method.

**Expected:** Payment method updated in Stripe, reflected in settings.

### Test 12: Webhook Signature Verification

**Steps:**
1. Send webhook with invalid signature.

**Expected:** Webhook rejected (400 or 401), not processed.

## Caveats and Edge Cases

### Multiple Subscriptions

Prevent user from having multiple active subscriptions. Cancel old subscription when creating new one.

### Webhook Idempotency

Stripe may send duplicate webhooks. Use idempotency key (event.id) to prevent double-processing.

### Webhook Delivery Failure

If webhook fails (server down), Stripe retries. Implement idempotent handlers to safely reprocess.

### Quota Calculation Performance

Storage quota: Cache aggregated file sizes in Redis, invalidate on upload/delete. Recalculate daily.

Upload counter: Store in Redis with key "upload_count:{org_id}:{year}-{month}", TTL = 35 days.

### Subscription Status Polling

If webhook delayed, user may not see updated status immediately. Offer "Refresh" button to manually fetch from Stripe.

### Proration Complexity

Stripe handles proration automatically. Ensure correct proration behavior displayed in Stripe Checkout and Customer Portal.

### Annual vs Monthly Pricing

Annual pricing: 10 months for price of 12 (17% discount). Configure separate price IDs in Stripe.

### Trial Period

Offer 14-day trial for Professional tier. Stripe handles trial logic. Quotas active during trial.

### Cancellation UX

Offer "exit survey" on cancellation: Why are you cancelling? Capture feedback for product improvement.

### Downgrade Data Retention

If user downgrades and exceeds new quota (e.g., 100 GB used but downgraded to 2 GB Free tier), do not delete data immediately. Display warning: "You're using 100 GB but your plan allows 2 GB. You cannot upload new images until you upgrade or delete old ones."

## Performance Considerations

### Webhook Processing

Enqueue webhook events as background jobs to avoid blocking Stripe's webhook delivery (respond 200 OK immediately, process asynchronously).

### Quota Checks

Use Redis for fast quota checks (sub-millisecond latency). Fall back to database if Redis unavailable.

### Subscription Data Caching

Cache current subscription data in user session or JWT claims to avoid database query on every request.

## Monitoring and Observability

### Metrics to Track

- New subscriptions per day.
- Churn rate (cancelled subscriptions / total active).
- Monthly Recurring Revenue (MRR).
- Average Revenue Per User (ARPU).
- Failed payments count.
- Upgrade / downgrade rate.

### Alerts

- Failed payment rate > 5% (investigate payment issues).
- Webhook processing failures (Stripe webhook endpoint down).
- Subscription creation errors (Stripe API issues).

## Security Checklist

- [ ] Webhook signature verification using Stripe signing secret.
- [ ] Stripe API keys stored in secure secrets manager.
- [ ] Publishable key safe to expose (frontend), secret key never exposed.
- [ ] Checkout sessions expire after 24 hours.
- [ ] Customer Portal sessions expire after 1 hour.
- [ ] Authorization: Only user can manage their own subscription.
- [ ] Quotas enforced on backend (not just frontend).

===== END FILE: TASK_08_Subscription_Billing.md =====
