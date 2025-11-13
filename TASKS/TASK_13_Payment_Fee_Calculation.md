===== BEGIN FILE: TASK_13_Payment_Fee_Calculation.md =====

# TASK 13: Payment Fee Calculation and Tracking

## Purpose

Calculate and track platform service fees and Stripe processing fees for each payment. Fees deducted from gross payment amount before disbursing payout to operators. Provides transparency and reconciliation.

## Priority

Critical for payment system revenue model.

## Dependencies

- TASK_10: Payment Processing.
- TASK_11: Payout Disbursement.
- Database schema for Fee entity.
- Platform fee configuration (percentage, fixed fee, configurable).

## Acceptance Criteria

1. Platform fee structure defined: Percentage (default 5%) + fixed fee (default $0.50).
2. Stripe processing fee calculated: 2.9% + $0.30 for cards, varies by payment method.
3. Fees calculated when Payment Intent created.
4. Fee records created and linked to Payment.
5. Fee breakdown displayed to Operator in payout details.
6. Gross amount, fee amount, and net amount tracked separately.
7. Fee configuration editable via admin panel (Superadmin only).
8. Fee reconciliation report available for financial auditing.
9. Operators can view fee breakdown for each payout.
10. Site Owners see total amount only (fees not itemized on their invoice).

## Fee Structure

### Recommended Fee Model: Percentage + Fixed

**Platform Fees:**
- **Percentage:** 5% of invoice total.
- **Fixed:** $0.50 per transaction.

**Rationale:**
- Aligns platform revenue with transaction value.
- Industry-standard for payment platforms (Stripe Connect, PayPal).
- Fixed fee covers operational costs for small transactions.

**Alternatives:**
- **Flat fee per invoice:** Simpler but penalizes small invoices (e.g., $2 fee on $20 invoice = 10%).
- **Tiered pricing:** Lower percentage for high-volume operators (e.g., 3% for >$10k/month). Adds complexity.

### Stripe Processing Fees

**Varies by payment method:**
- **Credit/Debit Cards:** 2.9% + $0.30 (US).
- **SEPA Direct Debit:** 0.8% (capped at €5).
- **ACH Bank Transfer:** 0.8% (capped at $5).
- **International Cards:** 3.9% + $0.30.

**Note:** Stripe fees vary by country and payment method. Fetch actual fees from Stripe Balance Transaction API after charge settles.

## Fee Calculation Logic

### Example Calculation

**Invoice Total:** $2,387.00

**Step 1: Calculate Platform Fees**
- Percentage fee: $2,387.00 × 0.05 = $119.35
- Fixed fee: $0.50
- **Total Platform Fee:** $119.85

**Step 2: Calculate Stripe Fees (Estimated)**
- Stripe percentage: $2,387.00 × 0.029 = $69.22
- Stripe fixed: $0.30
- **Total Stripe Fee:** $69.52

**Step 3: Calculate Net Payout**
- Gross amount: $2,387.00
- Total fees: $119.85 + $69.52 = $189.37
- **Net payout:** $2,387.00 - $189.37 = **$2,197.63**

### Actual Stripe Fee Reconciliation

Stripe fees estimated initially, then reconciled after charge settles using Stripe Balance Transaction API.

**Process:**
1. When Payment Intent created, estimate Stripe fee (2.9% + $0.30).
2. Create Fee record with estimated amount, type "StripeProcessing".
3. After charge succeeds, fetch Balance Transaction from Stripe.
4. Update Fee record with actual Stripe fee.
5. Recalculate net payout if difference significant (>$0.10).

## UI Description

### Fee Configuration (Superadmin)

**Location:** /admin/settings/fees

**Components:**
- Form fields:
  - Platform Percentage Fee (%): Input (default 5.00).
  - Platform Fixed Fee ($): Input (default 0.50).
  - Currency: USD (displayed, not editable in MVP).
- Save button.

**Validation:**
- Percentage: 0-20% (prevent unreasonable fees).
- Fixed fee: $0-$10.

**Interactions:**
- On save: Update platform configuration, applies to new payments only (existing payouts unaffected).

### Fee Breakdown (Operator Payout Detail)

**Location:** /payouts/:id (expanded view)

**Components:**
- Table:

| Fee Type                  | Description                        | Amount    |
|---------------------------|------------------------------------|-----------|
| Gross Amount              | Total payment from client          | $2,387.00 |
| Platform Fee (5%)         | Platform service fee               | -$119.35  |
| Platform Transaction Fee  | Fixed per-transaction fee          | -$0.50    |
| Stripe Processing Fee     | Payment processing (2.9% + $0.30)  | -$69.52   |
| **Net Payout**            | Amount transferred to your bank    | **$2,197.63** |

**Visual:** Bar chart showing fee breakdown as percentage of gross amount.

### Fee Transparency Banner (Pricing Page)

**Location:** /pricing (for operators)

**Message:**
- "Platform fee: 5% + $0.50 per transaction. This covers platform hosting, support, and payment processing."
- "You keep 95% of every payment (minus payment processing fees)."

### Monthly Fee Report (Operator Dashboard)

**Location:** /payouts/summary

**Components:**
- Month selector (dropdown).
- Summary cards:
  - Gross Revenue: $12,450.
  - Platform Fees: $622.50.
  - Stripe Fees: $361.05.
  - Net Earnings: $11,466.45.
- Downloadable CSV/PDF report.

## API Endpoints

### GET /api/v1/fees

**Query Parameters:**
- payment_id: UUID (optional).
- payout_id: UUID (optional).
- date_from: YYYY-MM-DD (optional).
- date_to: YYYY-MM-DD (optional).

**Authorization:** Operator (own fees only) or Superadmin (all fees).

**Response (200 OK):**
```
{
  "fees": [
    {
      "fee_id": "uuid",
      "payment_id": "uuid",
      "fee_type": "PlatformPercentage",
      "amount": 119.35,
      "currency": "USD",
      "calculated_at": "2025-01-15T15:30:00Z"
    },
    {
      "fee_id": "uuid",
      "payment_id": "uuid",
      "fee_type": "PlatformFixed",
      "amount": 0.50,
      "currency": "USD",
      "calculated_at": "2025-01-15T15:30:00Z"
    },
    {
      "fee_id": "uuid",
      "payment_id": "uuid",
      "fee_type": "StripeProcessing",
      "amount": 69.52,
      "currency": "USD",
      "calculated_at": "2025-01-15T15:30:00Z"
    }
  ]
}
```

### GET /api/v1/fees/summary

**Query Parameters:**
- operator_org_id: UUID (optional, defaults to current user's org).
- month: YYYY-MM (optional, defaults to current month).

**Response (200 OK):**
```
{
  "month": "2025-01",
  "gross_revenue": 12450.00,
  "platform_fees": 622.50,
  "stripe_fees": 361.05,
  "net_earnings": 11466.45,
  "transaction_count": 23
}
```

### PATCH /api/v1/admin/settings/fees (Superadmin only)

**Request Body:**
```
{
  "platform_percentage": 5.0,
  "platform_fixed_fee": 0.50
}
```

**Response (200 OK):**
```
{
  "platform_percentage": 5.0,
  "platform_fixed_fee": 0.50,
  "updated_at": "2025-01-15T16:00:00Z"
}
```

### GET /api/v1/fees/reconciliation (Superadmin only)

**Purpose:** Reconciliation report for financial auditing.

**Query Parameters:**
- date_from: YYYY-MM-DD (required).
- date_to: YYYY-MM-DD (required).

**Response (200 OK):**
```
{
  "date_from": "2025-01-01",
  "date_to": "2025-01-31",
  "total_payments": 245,
  "total_gross_amount": 124500.00,
  "total_platform_fees": 6225.00,
  "total_stripe_fees": 3610.50,
  "total_net_payouts": 114664.50,
  "discrepancies": [] // Empty if all balanced
}
```

## Database Schema

### Fee Table

**Columns:**
- fee_id (UUID, PK).
- payment_id (UUID, FK, indexed).
- fee_type (enum: PlatformPercentage, PlatformFixed, StripeProcessing).
- amount (decimal(12,2), negative or positive).
- currency (string, ISO 4217).
- calculated_at (timestamp).
- stripe_balance_transaction_id (string, nullable, for reconciliation).

**Indexes:**
- payment_id.
- fee_type.
- calculated_at (for reporting).

### PlatformConfig Table (Superadmin settings)

**Columns:**
- config_key (string, PK, e.g., "platform_percentage_fee").
- config_value (string or JSON, e.g., "5.0").
- updated_at (timestamp).
- updated_by_user_id (UUID, FK).

## Test Scenarios

### Test 1: Calculate Fees for Standard Payment

**Steps:**
1. Invoice total $2,387.
2. Create Payment Intent.
3. Calculate platform and Stripe fees.

**Expected:** Platform fee $119.85, Stripe fee $69.52 (estimated), net payout $2,197.63.

### Test 2: Fee Reconciliation After Settlement

**Steps:**
1. Payment succeeds.
2. Fetch Stripe Balance Transaction.
3. Actual Stripe fee: $70.00 (differs from estimate).
4. Update Fee record.

**Expected:** Fee updated, net payout recalculated if significant difference.

### Test 3: Small Payment (Edge Case)

**Steps:**
1. Invoice total $10.
2. Calculate fees.

**Expected:** Platform fee 5% + $0.50 = $1.00, Stripe fee ~$0.59, net payout ~$8.41 (84% of gross).

### Test 4: Large Payment

**Steps:**
1. Invoice total $50,000.
2. Calculate fees.

**Expected:** Platform fee $2,500.50, Stripe fee ~$1,450.30, net payout ~$46,049.20 (92% of gross).

### Test 5: Update Fee Configuration

**Steps:**
1. Superadmin changes platform fee to 4%.
2. Save.
3. New payment created.

**Expected:** New payment uses 4% fee, old payments unaffected.

### Test 6: Fee Breakdown Display

**Steps:**
1. Operator views payout detail.
2. Check fee breakdown table.

**Expected:** All fees itemized, totals correct.

### Test 7: Monthly Fee Summary

**Steps:**
1. Operator views summary for January 2025.
2. Multiple payments in month.

**Expected:** Gross revenue, total fees, net earnings calculated correctly.

### Test 8: Reconciliation Report

**Steps:**
1. Superadmin generates reconciliation report for January.
2. Compare platform fees + net payouts + Stripe fees = gross payments.

**Expected:** Totals balanced, no discrepancies.

### Test 9: SEPA Payment Fee

**Steps:**
1. Site Owner pays via SEPA Direct Debit.
2. Stripe fee: 0.8% (lower than card).

**Expected:** Stripe fee calculated as 0.8%, net payout higher than card payment.

### Test 10: Refund Fee Handling

**Steps:**
1. Payment made, fees deducted.
2. Superadmin refunds payment.
3. Check if fees refunded.

**Expected:** Stripe fee refunded (Stripe policy), platform fee reversal optional (configurable).

## Caveats and Edge Cases

### Negative Payout (Rare)

If fees exceed gross amount (shouldn't happen with minimum invoice amounts), flag for manual review. Do not process payout.

### Fee Configuration Retroactivity

Changing fee configuration applies only to new payments. Do not retroactively adjust existing payouts (causes confusion and accounting issues).

### Stripe Fee Variance

Estimated Stripe fee may differ from actual due to:
- Payment method type (card vs. SEPA).
- International card fees.
- Currency conversion.
- Stripe promotional discounts.

Reconcile after settlement to ensure accuracy.

### Rounding

Round all fee calculations to 2 decimal places (banker's rounding). Store as decimal(12,2) in database.

### Zero-Fee Payments (Promotional)

Platform may offer zero-fee promotions (e.g., first 10 invoices free). Implement promotional codes that set platform fee to 0% for qualifying payments.

### Fee Transparency to Site Owners

Site Owners see only invoice total. Do not show fee breakdown on their invoice (avoid confusion). Operator absorbs fees or includes in pricing.

### Tax on Fees

In some jurisdictions, platform fees may be subject to VAT/sales tax. Consult tax advisor. For MVP, fees are not taxed (operator pays fee on gross amount before their tax calculation).

### Multi-Currency Fees

If platform supports multiple currencies, configure fees per currency (e.g., 5% + €0.50 for EUR, 5% + £0.50 for GBP). For MVP, single currency (USD).

### Fee Caps

Consider capping fees for very large invoices (e.g., max $500 platform fee). Prevents excessive fees on enterprise contracts. Configurable post-MVP.

## Performance Considerations

### Fee Calculation

Calculation is simple arithmetic (<1ms). No caching needed.

### Stripe Balance Transaction Fetching

Stripe API call to fetch balance transaction (~200ms). Cache balance transaction ID in Fee record to avoid repeated fetches.

### Reporting Queries

Monthly fee summaries aggregate across many payments. Use database indexes on payment.created_at and fee.payment_id. Cache summary results in Redis (5-minute TTL).

### Reconciliation Report

Large date ranges (e.g., full year) may query thousands of payments. Generate report asynchronously (background job), email CSV when ready.

## Monitoring and Observability

### Metrics to Track

- Platform fee revenue per day/month.
- Average fee percentage (should be ~5%).
- Stripe fee as percentage of gross (should be ~3%).
- Discrepancies between estimated and actual Stripe fees.
- Fee configuration changes (audit log).

### Alerts

- Fee calculation error (e.g., negative payout).
- Reconciliation discrepancy >$100.
- Fee configuration changed (notify finance team).

### Dashboards

- Platform fee revenue over time (line chart).
- Fee breakdown as percentage of gross (pie chart).
- Reconciliation status (balanced vs. discrepancies).

## Security Checklist

- [ ] Fee configuration restricted to Superadmin.
- [ ] Operators can view only their own fees.
- [ ] Fee calculations logged for audit trail.
- [ ] Fee records immutable (cannot be edited after creation, only reconciled).
- [ ] Authorization checks on all fee endpoints.
- [ ] Input validation on fee configuration (prevent negative fees, unreasonable percentages).

===== END FILE: TASK_13_Payment_Fee_Calculation.md =====
