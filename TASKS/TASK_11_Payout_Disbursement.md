===== BEGIN FILE: TASK_11_Payout_Disbursement.md =====

# TASK 11: Payout Disbursement to Operators

## Purpose

Automatically disburse payments to Operators' bank accounts via Stripe Connect after deducting platform fees. Operators onboard Stripe Connected Accounts to receive payouts.

## Priority

Critical for payment system MVP.

## Dependencies

- TASK_10: Payment Processing.
- TASK_13: Fee Calculation.
- Stripe Connect configured with Standard or Express accounts.
- Database schema for Payout entity.
- Background worker for payout processing.

## Acceptance Criteria

1. Operators can onboard Stripe Connect account via Account Links or OAuth.
2. Stripe Connected Account ID stored in Organization record.
3. After invoice payment received, payout automatically scheduled (default T+1, configurable).
4. Platform fee deducted from payment before payout (percentage + fixed fee).
5. Payout record created with gross amount, fees, net amount, Stripe Transfer ID.
6. Payout processed via Stripe Transfers API to Connected Account.
7. Payout status tracked: Pending, InTransit, Paid, Failed.
8. Operators receive email notification when payout arrives.
9. Payout failure handled: Retry with exponential backoff, notify operator if permanently failed.
10. Operators can view payout history and download statements.
11. Payouts batched if below minimum threshold (default $10).

## UI Description

### Setup Payouts Button (Operator Dashboard)

**Location:** Operator dashboard, prominent banner if not yet connected.

**Banner Message:**
- "Setup payouts to receive payments from your clients. Connect your bank account via Stripe."
- "Setup Payouts" button.

**Interactions:**
- Click "Setup Payouts" to initiate Stripe Connect onboarding.

### Stripe Connect Onboarding Flow

**Steps:**
1. Frontend calls POST /api/v1/operators/connect-account.
2. Backend creates Stripe Account (type: Express) and Account Link.
3. User redirected to Stripe-hosted onboarding page.
4. User enters:
   - Business details (name, type, address, tax ID).
   - Identity verification (upload ID document).
   - Bank account details (routing number, account number or IBAN).
5. Stripe verifies information (instant or takes 1-3 days).
6. User redirected back to platform.
7. Backend receives account.updated webhook, stores connected_account_id.
8. Dashboard shows "Payouts connected" with green checkmark.

### Payout Dashboard (Operator)

**URL:** /payouts

**Components:**

**Summary Cards:**
- **Total Lifetime Earnings:** $45,230.
- **This Month:** $8,300.
- **Pending Payouts:** $2,387.
- **Next Payout:** Feb 16, 2025 ($2,387).

**Payout List Table:**
- Columns: Date, Invoice Number, Client, Gross Amount, Fees, Net Amount, Status, Actions.
- Status badges: Pending (yellow), InTransit (blue), Paid (green), Failed (red).
- Actions: View Details, Download Statement.
- Pagination (50 per page).
- Filter by date range, status.

**Connected Account Status:**
- "Bank account: **** 4242 (Wells Fargo)" or "Connect bank account" if not yet connected.
- "Payouts enabled" or "Pending verification" status.

### Payout Detail Modal

**Components:**
- Invoice number, client name, payment date.
- Breakdown:
  - Gross amount: $2,387.00.
  - Platform fee (5% + $0.50): $119.85.
  - Stripe processing fee: $69.82.
  - Net payout: $2,197.33.
- Payout date, Stripe Transfer ID.
- Bank account (last 4 digits).
- Download statement (PDF).

### Payout Failure Notification

**Displayed if payout fails:**
- Email: "Payout failed for invoice OP-2025-0001. Reason: [failure reason]. Please update your bank details."
- Link to Connect Account Dashboard to fix issue.

### Connect Account Dashboard Link

**Location:** Payout dashboard, "Manage Bank Account" button.

**Behavior:**
- Redirects to Stripe Express Dashboard where operator can:
  - View payout schedule.
  - Update bank account.
  - View payout history.
  - Download tax forms (1099-K).

## API Endpoints

### POST /api/v1/operators/connect-account

**Response (200 OK):**
```
{
  "account_link_url": "https://connect.stripe.com/setup/e/...",
  "connected_account_id": "acct_xxx"
}
```

**Behavior:**
- Check if organization already has connected_account_id.
  - If yes, generate Account Link to refresh onboarding (if incomplete).
  - If no, create new Stripe Account (type: Express).
- Store connected_account_id in Organization.
- Generate Account Link:
  - Refresh URL: {frontend_url}/payouts/setup.
  - Return URL: {frontend_url}/payouts/setup/complete.
  - Type: account_onboarding.
- Return account_link_url to frontend.

### GET /api/v1/operators/connect-account/status

**Response (200 OK):**
```
{
  "connected_account_id": "acct_xxx",
  "onboarding_complete": true,
  "payouts_enabled": true,
  "bank_account_last4": "4242",
  "bank_name": "Wells Fargo"
}
```

**Behavior:**
- Fetch Stripe Account details.
- Check requirements (payouts_enabled, charges_enabled).
- Return status to frontend.

### GET /api/v1/payouts

**Query Parameters:**
- status: Pending | InTransit | Paid | Failed (optional).
- date_from: YYYY-MM-DD (optional).
- date_to: YYYY-MM-DD (optional).
- limit: Max 100, default 50.
- offset: Default 0.

**Response (200 OK):**
```
{
  "payouts": [
    {
      "payout_id": "uuid",
      "payment_id": "uuid",
      "invoice_id": "uuid",
      "invoice_number": "OP-2025-0001",
      "site_owner_org_name": "ABC Construction",
      "gross_amount": 2387.00,
      "fee_amount": 189.67,
      "net_amount": 2197.33,
      "currency": "USD",
      "status": "Paid",
      "scheduled_at": "2025-01-16T00:00:00Z",
      "paid_at": "2025-01-18T10:30:00Z",
      "stripe_transfer_id": "tr_xxx"
    }
  ],
  "total": 45,
  "limit": 50,
  "offset": 0
}
```

### GET /api/v1/payouts/:id

**Response (200 OK):**
```
{
  "payout_id": "uuid",
  "operator_org_id": "uuid",
  "payment_id": "uuid",
  "invoice_id": "uuid",
  "invoice_number": "OP-2025-0001",
  "gross_amount": 2387.00,
  "fees": [
    {
      "fee_type": "PlatformPercentage",
      "amount": 119.35,
      "description": "5% platform fee"
    },
    {
      "fee_type": "PlatformFixed",
      "amount": 0.50,
      "description": "Fixed transaction fee"
    },
    {
      "fee_type": "StripeProcessing",
      "amount": 69.82,
      "description": "Stripe payment processing (2.9% + $0.30)"
    }
  ],
  "fee_amount": 189.67,
  "net_amount": 2197.33,
  "currency": "USD",
  "stripe_transfer_id": "tr_xxx",
  "stripe_connected_account_id": "acct_xxx",
  "status": "Paid",
  "scheduled_at": "2025-01-16T00:00:00Z",
  "paid_at": "2025-01-18T10:30:00Z",
  "failure_reason": null
}
```

### GET /api/v1/payouts/dashboard

**Response (200 OK):**
```
{
  "total_lifetime_earnings": 45230.00,
  "total_this_month": 8300.00,
  "total_this_year": 12450.00,
  "pending_payout_amount": 2387.00,
  "next_payout_date": "2025-02-16",
  "connected_account_status": "Active"
}
```

### Webhook: POST /webhooks/stripe/connect

**Events Handled:**

**account.updated:**
- Update Organization connected_account_id.
- Check if onboarding complete (payouts_enabled = true).
- Send confirmation email if onboarding completed.

**transfer.paid:**
- Update Payout status to Paid, set paid_at timestamp.
- Send payout confirmation email to operator.

**transfer.failed:**
- Update Payout status to Failed, set failure_reason.
- Send notification email with instructions to fix.

**Behavior:**
- Verify webhook signature.
- Use idempotency key (event.id).
- Parse event data.
- Update Payout record.
- Trigger notifications.

## Background Worker: Payout Processing

### Job Queue

**Queue Name:** `payout-processing`

**Job Triggered:** After payment_intent.succeeded webhook received.

**Job Data:**
```
{
  "payment_id": "uuid",
  "invoice_id": "uuid",
  "operator_org_id": "uuid"
}
```

### Processing Steps

1. Fetch Payment record.
2. Calculate fees (TASK_13):
   - Platform percentage fee: gross_amount × 0.05.
   - Platform fixed fee: $0.50.
   - Stripe processing fee: (gross_amount × 0.029) + $0.30.
3. Calculate net payout: gross_amount - total_fees.
4. Check minimum payout threshold ($10). If below, queue for batching.
5. Create Payout record (status: Pending).
6. Schedule payout (default T+1, e.g., next day at midnight).
7. At scheduled time, initiate Stripe Transfer:
   - Destination: connected_account_id.
   - Amount: net_amount (in cents).
   - Currency: invoice currency.
   - Metadata: { payout_id, invoice_id, payment_id }.
   - Transfer group: invoice_id (for reconciliation).
8. Update Payout with stripe_transfer_id, status: InTransit.
9. Stripe processes transfer (1-3 business days to operator's bank).
10. Webhook transfer.paid received, Payout status updated to Paid.

### Error Handling

**Transient Errors (Retry):**
- Network timeout.
- Stripe API rate limit.
- Temporary Stripe outage.

**Permanent Errors (Fail):**
- Connected account not found or deleted.
- Payouts disabled for account (verification failed).
- Insufficient funds in platform Stripe balance.
- Bank account invalid.

**On Permanent Failure:**
- Update Payout status to Failed.
- Log error with payout_id, operator_org_id, error message.
- Send notification email to operator and platform support.

## Test Scenarios

### Test 1: Stripe Connect Onboarding

**Steps:**
1. Operator clicks "Setup Payouts".
2. Redirected to Stripe onboarding.
3. Completes identity verification and bank account setup.
4. Redirected back to platform.

**Expected:** Connected account ID stored, dashboard shows "Payouts connected".

### Test 2: Automatic Payout After Payment

**Steps:**
1. Site Owner pays invoice.
2. Payment webhook received.
3. Payout job enqueued.
4. Worker processes job, creates payout.

**Expected:** Payout record created with status Pending, scheduled for next day.

### Test 3: Payout Transfer Success

**Steps:**
1. Payout scheduled for today.
2. Worker initiates Stripe Transfer.
3. Transfer succeeds.
4. Webhook transfer.paid received.

**Expected:** Payout status updated to Paid, operator notified.

### Test 4: Payout Transfer Failure

**Steps:**
1. Operator's bank account invalid.
2. Worker initiates transfer, fails.

**Expected:** Payout status Failed, operator receives email with instructions.

### Test 5: Fee Calculation

**Steps:**
1. Invoice total $2,387.
2. Calculate fees: 5% + $0.50 + Stripe fee.
3. Net payout calculated.

**Expected:** Fees correctly calculated and deducted, net payout accurate.

### Test 6: Minimum Payout Threshold

**Steps:**
1. Invoice total $5 (below $10 threshold).
2. Payout job runs.

**Expected:** Payout queued for batching (not immediately transferred).

### Test 7: Payout Batching

**Steps:**
1. Operator has 3 pending payouts below threshold ($8, $7, $5 = $20 total).
2. Batch job runs daily.
3. Single transfer created for $20.

**Expected:** Operator receives one payout for combined amount.

### Test 8: View Payout History

**Steps:**
1. Operator navigates to /payouts.
2. Views payout list.
3. Clicks on payout to view details.

**Expected:** All payouts displayed, detail modal shows fee breakdown.

### Test 9: Onboarding Incomplete

**Steps:**
1. Operator starts onboarding but does not complete.
2. Payment received.
3. Payout job runs.

**Expected:** Payout status Failed, error "Payouts not enabled. Complete onboarding."

### Test 10: Refund Reversal

**Steps:**
1. Payment made, payout processed.
2. Superadmin refunds payment.
3. Reverse payout.

**Expected:** Payout reversed (debited from operator's account or future payouts).

### Test 11: Webhook Idempotency

**Steps:**
1. Send transfer.paid webhook twice (same event ID).

**Expected:** Processed once, second ignored.

### Test 12: Connected Account Status

**Steps:**
1. GET /api/v1/operators/connect-account/status.
2. Check if onboarding complete.

**Expected:** Returns accurate status (payouts enabled, bank account details).

## Caveats and Edge Cases

### Payout Schedule Customization

Allow operators to configure payout schedule (immediate, daily, weekly, monthly). Store preference in Organization. Default: T+1 (next day).

### Stripe Balance Requirements

Platform must maintain sufficient Stripe balance to cover payouts. Monitor balance daily, alert if low (<$10,000).

### Negative Balance Handling

If operator has more refunds than payouts in a period, account may go negative. Deduct from future payouts or request top-up.

### Multi-Currency Payouts

If platform supports multiple currencies, ensure payout currency matches invoice currency. Stripe handles currency conversion if needed.

### Payout Reversals

If refund issued after payout already transferred, reverse via debit from operator's account or hold future payouts. Requires operator consent.

### Tax Reporting

Stripe issues 1099-K forms (US) to operators earning >$600/year. Platform does not need to handle, but inform operators.

### Payout Delays

Stripe transfers take 1-3 business days. Clearly communicate expected arrival date to operators.

### Account Verification Failures

If operator's identity verification fails (e.g., invalid ID), payouts disabled. Notify operator immediately with corrective actions.

### Minimum Payout Batching

Store pending payouts below threshold in database. Daily cron job checks if cumulative amount exceeds threshold, processes batch.

### Operator Disputes

Operator may dispute fees or payout amounts. Provide detailed breakdown in payout statement. Support team can manually adjust if error proven.

## Performance Considerations

### Payout Job Processing

Enqueue payout jobs immediately after payment success. Process jobs sequentially (one at a time per operator) to avoid race conditions.

### Stripe API Rate Limits

Stripe Transfer API: 100 requests/second. Batch payouts if high volume (>100/second).

### Database Transactions

Use transactions when creating Payout and updating Payment records (atomicity).

### Caching

Cache Connected Account status in Redis (5-minute TTL) to reduce Stripe API calls.

## Monitoring and Observability

### Metrics to Track

- Payouts processed per day.
- Average payout amount.
- Payout success rate (%).
- Payout failure reasons breakdown.
- Time from payment to payout (p50, p95).
- Stripe balance.

### Alerts

- Payout failure rate > 2% (investigate).
- Stripe balance < $10,000 (top up needed).
- Payout job processing delay > 24 hours (backlog).
- Operator account verification failures > 5% (onboarding issues).

### Dashboards

- Real-time payout volume.
- Payout status breakdown (Pending, InTransit, Paid, Failed).
- Fee revenue collected (platform fees).

## Security Checklist

- [ ] Connected Account IDs stored securely.
- [ ] Webhook signature verification required.
- [ ] Authorization: Only operator can view their payouts.
- [ ] Payout amounts validated (positive, matches payment).
- [ ] Stripe API calls use restricted API keys (Connect scope only).
- [ ] Logs do not contain bank account numbers (except last 4 digits).
- [ ] Payout failure reasons do not expose sensitive data.

===== END FILE: TASK_11_Payout_Disbursement.md =====
