===== BEGIN FILE: TASK_10_Payment_Processing.md =====

# TASK 10: Payment Processing with Stripe

## Purpose

Enable Site Owners to pay invoices online using credit card, SEPA, or bank transfer through Stripe. Platform collects payment, updates invoice status, and triggers payout to Operator.

## Priority

Critical for payment system MVP.

## Dependencies

- TASK_09: Invoice CRUD.
- Stripe account configured with Payment Intents API.
- Database schema for Payment entity.
- Stripe Elements library for frontend payment form.

## Acceptance Criteria

1. Site Owner can click "Pay Invoice" button on invoice detail page.
2. Payment modal displays invoice total and Stripe Elements payment form.
3. Payment form accepts credit cards (Visa, Mastercard, Amex), SEPA Direct Debit, and bank transfer (where available).
4. Payment form handles 3D Secure authentication automatically.
5. On successful payment, invoice status updated to Paid, Payment record created.
6. Payment confirmation emails sent to Site Owner and Operator.
7. On failed payment, user sees error message and can retry.
8. Payment Intent created with invoice metadata for reconciliation.
9. Webhook handles payment_intent.succeeded and payment_intent.payment_failed events.
10. Site Owner can save payment method for future use.
11. Payment records include Stripe payment intent ID, charge ID, amount, status.

## UI Description

### Pay Invoice Button (Invoice Detail Page)

**Location:** Invoice detail page, prominent button below invoice preview.

**Label:** "Pay Invoice - $2,387.00".

**State:** Enabled if status = Sent or Overdue, disabled if Paid or Cancelled.

**Interactions:**
- Click to open payment modal.

### Payment Modal

**Components:**

**Header:**
- Title: "Pay Invoice OP-2025-0001".
- Close button (X).

**Invoice Summary:**
- Operator name.
- Invoice number, due date.
- Subtotal, tax, total amount (bold, large font).

**Payment Form (Stripe Elements):**
- Card element (combined card number, expiry, CVC field).
- Or: Payment method selector (Card, SEPA, Bank Transfer).
- Billing details:
  - Name on card (text input).
  - Email (pre-filled from user account).
  - Billing address (optional, required for some payment methods).
- Save payment method checkbox: "Save for future payments".

**Submit Button:**
- Label: "Pay $2,387.00".
- Disabled while processing.
- Shows spinner during processing: "Processing payment...".

**Security Badges:**
- "Secured by Stripe" logo.
- "256-bit SSL encryption" text.

**Interactions:**
1. User enters payment details.
2. Clicks "Pay $2,387.00".
3. Frontend calls POST /api/v1/invoices/:id/payment-intent to create Payment Intent.
4. Backend returns client_secret.
5. Frontend confirms payment using Stripe.js confirmCardPayment().
6. Stripe handles authentication (3D Secure redirect if needed).
7. On success:
   - Modal shows success message: "Payment successful! Invoice paid."
   - Confetti animation or checkmark icon.
   - Close modal after 2 seconds, refresh invoice page.
8. On failure:
   - Display error message: "Payment failed: [reason]. Please try again."
   - Allow retry.

### Payment Success State (Invoice Detail)

**Changes after payment:**
- "Pay Invoice" button removed.
- Status badge updated to "Paid" (green).
- Payment confirmation section:
  - "Paid on [date]".
  - Payment method: "Visa ending in 4242".
  - "Download Receipt" button.

### Payment History (Site Owner Dashboard)

**Location:** /invoices/history

**Components:**
- Table with columns: Invoice Number, Operator, Amount, Paid Date, Payment Method, Receipt.
- Filter by date range.

### Failed Payment Notification

**Displayed if webhook receives payment_intent.payment_failed:**
- Email sent to Site Owner: "Payment failed for invoice OP-2025-0001. Please try again or update your payment method."
- Link to invoice detail page.

## API Endpoints

### POST /api/v1/invoices/:id/payment-intent

**Request Body:**
```
{
  "payment_method_types": ["card", "sepa_debit"]
}
```

**Response (200 OK):**
```
{
  "client_secret": "pi_xxx_secret_yyy",
  "payment_intent_id": "pi_xxx",
  "amount": 238700, // cents
  "currency": "USD"
}
```

**Validation:**
- Invoice must exist and belong to requester's organization.
- Invoice status must be Sent or Overdue (not Draft, Paid, Cancelled).
- User must be Site Owner Client with access to invoice.

**Behavior:**
- Create Stripe Payment Intent with:
  - Amount: Invoice total_amount (convert to cents).
  - Currency: Invoice currency.
  - Payment method types: ["card", "sepa_debit"].
  - Metadata: { invoice_id, operator_org_id, site_owner_org_id, project_id }.
  - Receipt email: Site Owner email.
- Store payment_intent_id in Invoice record (for idempotency).
- Return client_secret to frontend.

### GET /api/v1/payments/:id

**Response (200 OK):**
```
{
  "payment_id": "uuid",
  "invoice_id": "uuid",
  "invoice_number": "OP-2025-0001",
  "amount": 2387.00,
  "currency": "USD",
  "payment_method": "Card",
  "payment_method_details": "Visa ending in 4242",
  "status": "Succeeded",
  "paid_at": "2025-01-15T15:30:00Z",
  "receipt_url": "https://stripe.com/receipts/xxx"
}
```

### POST /api/v1/payments/:id/refund

**Request Body:**
```
{
  "amount": 2387.00, // optional, defaults to full refund
  "reason": "Customer request"
}
```

**Authorization:** Superadmin only.

**Response (200 OK):**
```
{
  "refund_id": "re_xxx",
  "amount": 2387.00,
  "status": "Refunded"
}
```

**Behavior:**
- Call Stripe Refunds API to refund Payment Intent.
- Update Invoice status to Refunded.
- Create refund record.
- Reverse payout to Operator (handled by TASK_11).

### Webhook: POST /webhooks/stripe/payments

**Events Handled:**

**payment_intent.succeeded:**
- Update Invoice status to Paid, set paid_at timestamp.
- Create Payment record:
  - invoice_id, site_owner_user_id, amount, currency.
  - stripe_payment_intent_id, stripe_charge_id.
  - status = Succeeded.
  - payment_method (extract from payment intent).
- Enqueue payout job (TASK_11).
- Send payment confirmation emails (TASK_12).

**payment_intent.payment_failed:**
- Create Payment record with status = Failed, failure_reason.
- Send notification email to Site Owner with retry link.

**charge.refunded:**
- Update Invoice status to Refunded.
- Create refund record.
- Send notification emails to Site Owner and Operator.

**Behavior:**
- Verify webhook signature.
- Use idempotency key (event.id) to prevent duplicate processing.
- Parse event data.
- Update database records.
- Trigger follow-up actions (emails, payouts).

## Test Scenarios

### Test 1: Successful Card Payment

**Steps:**
1. Site Owner opens invoice.
2. Clicks "Pay Invoice".
3. Enters test card 4242 4242 4242 4242.
4. Submits payment.

**Expected:** Payment succeeds, invoice status = Paid, confirmation emails sent, payout enqueued.

### Test 2: Payment Requires 3D Secure

**Steps:**
1. Enter test card 4000 0025 0000 3155 (requires authentication).
2. Submit payment.
3. Redirected to 3D Secure page, completes authentication.

**Expected:** Payment succeeds after authentication.

### Test 3: Card Declined

**Steps:**
1. Enter test card 4000 0000 0000 0002 (generic decline).
2. Submit payment.

**Expected:** Error "Your card was declined. Please try a different payment method."

### Test 4: Insufficient Funds

**Steps:**
1. Enter test card 4000 0000 0000 9995 (insufficient funds).
2. Submit payment.

**Expected:** Error "Insufficient funds. Please use a different card."

### Test 5: Retry After Failure

**Steps:**
1. Payment fails (card declined).
2. User enters different card.
3. Retries payment.

**Expected:** New Payment Intent created, payment succeeds.

### Test 6: Save Payment Method

**Steps:**
1. Check "Save for future payments".
2. Complete payment.
3. Pay another invoice.

**Expected:** Saved payment method pre-filled, user can pay with one click.

### Test 7: SEPA Direct Debit

**Steps:**
1. Select SEPA payment method.
2. Enter IBAN: DE89370400440532013000.
3. Submit payment.

**Expected:** Payment succeeds (debit processed asynchronously, webhook confirms later).

### Test 8: Payment Already Completed

**Steps:**
1. Pay invoice.
2. Attempt to pay same invoice again.

**Expected:** "Pay Invoice" button disabled, message "Invoice already paid".

### Test 9: Concurrent Payment Attempts

**Steps:**
1. Open two browser tabs, same invoice.
2. Submit payment in both tabs simultaneously.

**Expected:** Only one payment succeeds, second fails with "Invoice already paid".

### Test 10: Webhook Idempotency

**Steps:**
1. Send payment_intent.succeeded webhook twice (same event ID).

**Expected:** Processed once, second ignored.

### Test 11: Payment Metadata

**Steps:**
1. Complete payment.
2. Check Stripe dashboard.

**Expected:** Payment Intent contains metadata: invoice_id, operator_org_id, etc.

### Test 12: Refund

**Steps:**
1. Superadmin refunds payment.
2. Check invoice status.

**Expected:** Status = Refunded, Site Owner and Operator notified, payout reversed.

## Caveats and Edge Cases

### Payment Intent Idempotency

If user clicks "Pay" multiple times rapidly, multiple Payment Intents may be created. Store payment_intent_id in Invoice after first creation, reuse existing if present.

### 3D Secure User Experience

Some users may abandon payment during 3D Secure redirect. Display clear instructions: "You will be redirected to your bank to authenticate this payment."

### Payment Method Restrictions

Some payment methods (SEPA, bank transfer) settle asynchronously (days). Update invoice status only after settlement confirmed via webhook.

### Currency Mismatch

Ensure Payment Intent currency matches Invoice currency. Stripe requires amounts in smallest currency unit (cents for USD, no decimals for JPY).

### Payment Failures

Common failure reasons:
- Card declined: Suggest user contact bank.
- Insufficient funds: Suggest different payment method.
- Expired card: Prompt user to update card details.

### Refund Timing

Refunds take 5-10 business days to appear in customer's account. Display expected refund date in confirmation email.

### Partial Refunds

Support partial refunds (e.g., refund $500 of $2387). Update Invoice to show "Partially Refunded" status (post-MVP).

### Multiple Payment Attempts

If user attempts payment multiple times (failures), create new Payment Intent each time. Clean up old unused Payment Intents via cron job (Stripe auto-expires after 24 hours).

### Receipt URLs

Stripe provides receipt URLs for successful payments. Store and display to user for tax/accounting purposes.

### Stripe Fee Transparency

Stripe charges processing fee (2.9% + $0.30). Do not show to Site Owner (Operator absorbs or includes in invoice amount). Platform fee separate (TASK_13).

### Saved Payment Methods Security

Payment methods stored in Stripe (not platform database). Frontend displays last 4 digits only.

### Webhook Retry Logic

If webhook processing fails (database down), Stripe retries. Implement idempotency to handle retries safely.

### Test Mode vs Live Mode

Use Stripe test mode for development/staging. Switch to live mode in production (separate API keys). Clearly indicate environment in UI during testing.

## Performance Considerations

### Payment Intent Creation

Stripe API call typically <500ms. Cache nothing (Payment Intent is single-use).

### Frontend Payment Confirmation

Stripe.js confirmCardPayment() can take 2-10 seconds (includes card network communication, 3D Secure). Display loading spinner.

### Webhook Processing

Enqueue webhook events as background jobs to respond 200 OK quickly (Stripe expects <5s response).

### Database Transactions

Use transactions when updating Invoice status and creating Payment record (ensure atomicity).

## Monitoring and Observability

### Metrics to Track

- Payment success rate (%).
- Average payment processing time (seconds).
- Payment method breakdown (card vs. SEPA vs. other).
- 3D Secure authentication rate (%).
- Payment failure reasons (declined, insufficient funds, etc.).
- Webhook processing latency.

### Alerts

- Payment success rate < 90% (investigate payment failures).
- Webhook endpoint down (Stripe cannot deliver events).
- High rate of declined cards (potential fraud or card database issue).

### Dashboards

- Real-time payment volume chart.
- Success vs. failure rate over time.
- Revenue collected per day/week/month.

## Security Checklist

- [ ] PCI-DSS compliance via Stripe (no raw card data in platform).
- [ ] Stripe Elements used for card input (prevents card data reaching platform).
- [ ] Webhook signature verification required.
- [ ] Payment Intent idempotency to prevent double charges.
- [ ] Authorization: Only Site Owner can pay their invoices.
- [ ] HTTPS required for all payment pages.
- [ ] Stripe API keys stored in secure secrets manager.
- [ ] Logs do not contain card numbers or payment details.

===== END FILE: TASK_10_Payment_Processing.md =====
