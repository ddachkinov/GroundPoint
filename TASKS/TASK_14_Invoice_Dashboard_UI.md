===== BEGIN FILE: TASK_14_Invoice_Dashboard_UI.md =====

# TASK 14: Invoice and Payment Dashboard UI

## Purpose

Comprehensive dashboard UI for Operators and Site Owners to manage invoices, track payments, view earnings, and monitor payment status. Provides at-a-glance financial overview and quick actions.

## Priority

High. Essential for user experience and financial visibility.

## Dependencies

- TASK_09: Invoice CRUD.
- TASK_10: Payment Processing.
- TASK_11: Payout Disbursement.
- TASK_13: Fee Calculation.
- Frontend charting library (Chart.js, Recharts, or similar).

## Acceptance Criteria

1. Operator Invoice Dashboard displays summary metrics: Total Outstanding, Paid This Month, Overdue Count.
2. Invoice list with filtering (status, project, date range) and search.
3. Quick actions: Create Invoice, Send, Download PDF.
4. Site Owner Invoice Dashboard displays invoices to pay and payment history.
5. Payout Dashboard shows lifetime earnings, monthly breakdown, pending payouts.
6. Visual charts: Revenue over time, invoice status distribution, payout trends.
7. Responsive design (mobile, tablet, desktop).
8. Export functionality (CSV, PDF) for invoices and payouts.
9. Empty states with helpful calls-to-action.
10. Performance: Dashboard loads in < 2 seconds.

## UI Description

### Operator Invoice Dashboard

**URL:** /invoices

**Layout:**

**Section 1: Summary Metrics (Cards)**

Four cards in responsive grid (1 column mobile, 4 columns desktop):

1. **Total Outstanding**
   - Value: $12,450
   - Subtext: "From 8 unpaid invoices"
   - Icon: Dollar sign with clock
   - Color: Orange/Yellow

2. **Paid This Month**
   - Value: $8,300
   - Subtext: "5 invoices paid"
   - Icon: Check mark with dollar
   - Color: Green

3. **Overdue**
   - Value: $3,200
   - Subtext: "3 invoices overdue"
   - Icon: Alert/Warning
   - Color: Red

4. **Average Time to Payment**
   - Value: 18 days
   - Subtext: "From issue to payment"
   - Icon: Calendar
   - Color: Blue

**Section 2: Actions Bar**
- "Create Invoice" button (primary, prominent).
- "Export to CSV" button.
- Date range picker (defaults to "All time").

**Section 3: Filters and Search**
- Status filter tabs: All (badge: 23) | Draft (5) | Sent (8) | Paid (7) | Overdue (3).
- Project dropdown filter.
- Search box: "Search by client name or invoice number".

**Section 4: Invoice Table**

Table with columns:
- **Invoice Number** (link to detail, sortable).
- **Client** (organization name).
- **Project** (name, optional).
- **Issue Date** (sortable).
- **Due Date** (sortable, bold if overdue).
- **Amount** (right-aligned).
- **Status** (badge with color: Draft=gray, Sent=blue, Paid=green, Overdue=red).
- **Actions** (dropdown: View, Send, Edit, Cancel, Download PDF).

**Pagination:** 50 per page, page numbers + next/prev buttons.

**Empty State (no invoices):**
- Illustration (empty clipboard or document).
- Message: "No invoices yet. Create your first invoice to get paid."
- "Create Invoice" button.

**Section 5: Revenue Chart (Optional, toggleable)**
- Line chart: Invoice amounts over time (by issue date).
- X-axis: Months (last 12 months).
- Y-axis: Amount ($).
- Hover tooltip: "Jan 2025: $8,300 (5 invoices)".

### Site Owner Invoice Dashboard

**URL:** /invoices

**Layout:**

**Section 1: Summary Metrics**

Two cards:

1. **Unpaid Invoices**
   - Value: $5,600
   - Subtext: "2 invoices to pay"
   - "Pay Now" button

2. **Paid This Year**
   - Value: $32,400
   - Subtext: "14 invoices paid"

**Section 2: Invoices to Pay (Priority Section)**

List of unpaid invoices (status: Sent or Overdue):
- Large cards with:
  - Invoice number, operator name, project name.
  - Amount (large, bold).
  - Due date (red if overdue).
  - "Pay Invoice" button (green, prominent).

**Section 3: Payment History**

Table with columns:
- **Invoice Number** (link to detail).
- **Operator** (name).
- **Project** (name).
- **Amount**.
- **Paid Date** (sortable).
- **Receipt** (download link).

**Pagination:** 50 per page.

**Empty State (no invoices):**
- Message: "You don't have any invoices yet. Your operator will send invoices for completed work."

### Operator Payout Dashboard

**URL:** /payouts

**Layout:**

**Section 1: Summary Metrics**

Four cards:

1. **Lifetime Earnings**
   - Value: $45,230
   - Subtext: "Net after fees"
   - Icon: Trophy or star

2. **This Month**
   - Value: $8,300
   - Subtext: "5 payouts received"
   - Icon: Calendar with dollar

3. **Pending Payouts**
   - Value: $2,387
   - Subtext: "1 payout in transit"
   - Icon: Clock

4. **Next Payout**
   - Value: "Feb 16, 2025"
   - Subtext: "$2,387 expected"
   - Icon: Arrow right

**Section 2: Connected Account Status**

Banner (if connected):
- "Payouts connected: Bank account **** 4242 (Wells Fargo)"
- "Manage Bank Account" button (opens Stripe Express Dashboard).

Banner (if not connected):
- "Setup payouts to receive payments from your clients."
- "Connect Bank Account" button (initiates Stripe Connect onboarding).

**Section 3: Payout List**

Table with columns:
- **Date** (payout scheduled or paid date, sortable).
- **Invoice** (number, link to invoice).
- **Client** (name).
- **Gross** (amount before fees).
- **Fees** (total fees, expandable to show breakdown).
- **Net** (amount transferred, bold).
- **Status** (badge: Pending, InTransit, Paid, Failed).
- **Actions** (dropdown: View Details, Download Statement).

**Row Expansion (on click):**
- Fee breakdown table:
  - Platform Fee (5%): $119.35.
  - Transaction Fee: $0.50.
  - Stripe Fee: $69.52.
  - Total Fees: $189.37.
- Bank account: **** 4242.
- Expected arrival: Jan 18-20, 2025.

**Pagination:** 50 per page.

**Section 4: Earnings Chart**

Bar chart:
- X-axis: Months (last 12 months).
- Y-axis: Net earnings ($).
- Bars: Green for paid, blue for pending.
- Hover tooltip: "Jan 2025: $8,300 (5 payouts)".

**Export Button:** "Export to CSV" (downloads payout history with fees).

### Mobile Responsiveness

**Mobile Layout Changes:**
- Metrics cards stack vertically (1 column).
- Tables convert to card view:
  - Each row becomes card with key fields.
  - Actions accessible via "..." menu button.
- Charts collapse or hide (show "View Chart" button to expand).
- Filters collapse into drawer (hamburger menu).

### Empty States

**Operator No Invoices:**
- Illustration: Clipboard with checkmark.
- Message: "No invoices yet. Create your first invoice to get paid."
- CTA: "Create Invoice" button.

**Operator No Payouts:**
- Illustration: Bank icon.
- Message: "Connect your bank account to receive payouts."
- CTA: "Setup Payouts" button.

**Site Owner No Invoices:**
- Illustration: Document stack.
- Message: "You don't have any invoices yet. Your operator will send invoices for completed work."

## API Endpoints (from TASK_09, summarized here)

### GET /api/v1/invoices/dashboard

**Response (200 OK):**
```
{
  "total_outstanding": 12450.00,
  "total_paid_this_month": 8300.00,
  "avg_time_to_payment_days": 18,
  "overdue_count": 3
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

### GET /api/v1/invoices/export

**Query Parameters:**
- status: Filter (optional).
- date_from: YYYY-MM-DD (optional).
- date_to: YYYY-MM-DD (optional).
- format: csv | pdf (default: csv).

**Response:** File download (CSV or PDF).

**CSV Format:**
```
Invoice Number,Client,Project,Issue Date,Due Date,Amount,Status
OP-2025-0001,ABC Construction,Downtown Tower,2025-01-15,2025-02-14,$2387.00,Paid
...
```

### GET /api/v1/payouts/export

**Query Parameters:**
- date_from: YYYY-MM-DD (optional).
- date_to: YYYY-MM-DD (optional).
- format: csv | pdf (default: csv).

**Response:** File download.

**CSV Format:**
```
Date,Invoice,Client,Gross,Fees,Net,Status
2025-01-16,OP-2025-0001,ABC Construction,$2387.00,$189.37,$2197.63,Paid
...
```

### GET /api/v1/invoices/chart-data

**Query Parameters:**
- range: 6m | 12m | 1y | all (optional, default: 12m).

**Response (200 OK):**
```
{
  "data": [
    { "month": "2024-02", "paid": 5200.00, "pending": 1200.00 },
    { "month": "2024-03", "paid": 7300.00, "pending": 0 },
    ...
  ]
}
```

### GET /api/v1/payouts/chart-data

**Query Parameters:**
- range: 6m | 12m | 1y | all (optional, default: 12m).

**Response (200 OK):**
```
{
  "data": [
    { "month": "2024-02", "net_earnings": 4800.00 },
    { "month": "2024-03", "net_earnings": 6700.00 },
    ...
  ]
}
```

## Test Scenarios

### Test 1: Operator Dashboard Loads

**Steps:**
1. Operator logs in, navigates to /invoices.
2. Check metrics cards.

**Expected:** Dashboard loads < 2s, metrics display correct values.

### Test 2: Filter Invoices by Status

**Steps:**
1. Click "Overdue" tab.
2. Check table.

**Expected:** Only overdue invoices displayed.

### Test 3: Search Invoices

**Steps:**
1. Enter "ABC Construction" in search box.
2. Check results.

**Expected:** Only invoices for ABC Construction displayed.

### Test 4: Export Invoices to CSV

**Steps:**
1. Select date range (Jan 1 - Jan 31).
2. Click "Export to CSV".

**Expected:** CSV file downloads with filtered invoices.

### Test 5: Site Owner Views Unpaid Invoices

**Steps:**
1. Site Owner logs in, navigates to /invoices.
2. Check "Invoices to Pay" section.

**Expected:** Unpaid invoices displayed prominently with "Pay Invoice" buttons.

### Test 6: Payout Dashboard Loads

**Steps:**
1. Operator navigates to /payouts.
2. Check metrics and payout list.

**Expected:** Dashboard loads, shows lifetime earnings, this month, pending payouts.

### Test 7: Expand Payout Row

**Steps:**
1. Click on payout row to expand.
2. View fee breakdown.

**Expected:** Fee details displayed: platform fee, Stripe fee, net amount.

### Test 8: Connected Account Status

**Steps:**
1. Operator with connected account views /payouts.
2. Check status banner.

**Expected:** "Payouts connected: Bank account **** 4242" displayed.

### Test 9: Not Connected Account

**Steps:**
1. Operator without connected account views /payouts.
2. Check status banner.

**Expected:** "Setup payouts to receive payments" banner with "Connect Bank Account" button.

### Test 10: Revenue Chart Displays

**Steps:**
1. View Operator invoice dashboard.
2. Check revenue chart.

**Expected:** Chart shows revenue over last 12 months.

### Test 11: Mobile Responsive

**Steps:**
1. View dashboard on mobile device (375px width).
2. Check layout.

**Expected:** Metrics stack vertically, tables convert to cards, filters collapse.

### Test 12: Empty State

**Steps:**
1. New operator with no invoices views dashboard.

**Expected:** Empty state displayed with "Create Invoice" button.

## Caveats and Edge Cases

### Large Data Sets

If operator has thousands of invoices, pagination required. Limit API to 100 per page, frontend displays 50 per page (2 API calls max).

### Dashboard Metric Caching

Calculate metrics asynchronously (cron job every 5 minutes), cache in Redis. API returns cached values for performance.

### Real-Time Updates

Metrics not real-time (5-minute delay acceptable). For real-time needs, add "Refresh" button.

### Chart Performance

Rendering charts with large datasets (>1000 data points) may be slow. Limit chart data to last 12 months or aggregate by week/month.

### Export Large Files

If exporting thousands of invoices, generate CSV asynchronously (background job), email download link when ready.

### Timezone Handling

Display dates in user's local timezone. Store timestamps in UTC, convert on frontend.

### Access Control

Operators see only their invoices and payouts. Site Owners see only invoices addressed to them. Enforce in API.

### Status Badge Colors

Use color-blind-friendly palette (not just red/green). Add icons or patterns for accessibility.

### Mobile Table Scrolling

On mobile, horizontal scrolling for tables difficult. Convert tables to card view for better UX.

### Dashboard Loading State

Display skeleton loaders for metrics and tables while loading. Prevents layout shift.

## Performance Considerations

### API Response Time

Dashboard metrics query aggregates large data. Optimize:
- Pre-calculate metrics in background job (every 5 minutes).
- Cache in Redis with 5-minute TTL.
- API returns cached values (<50ms).

### Chart Data

Aggregate chart data by month (not day) for performance. Limit to 12 months.

### Invoice List Query

Use database pagination (LIMIT/OFFSET). Index on status, issue_date, operator_org_id.

### Export Generation

Generate exports asynchronously for large datasets (>1000 rows). Enqueue background job, email download link.

### Frontend Rendering

Use React virtualization (react-window) for long invoice/payout lists (>500 rows). Render only visible rows.

### Image and Chart Lazy Loading

Load charts only when visible (Intersection Observer). Reduces initial page load time.

## Accessibility Checklist

- [ ] Metrics cards have aria-labels (e.g., "Total outstanding: $12,450").
- [ ] Status badges have text alternatives (not color-only).
- [ ] Tables have proper headers (th) and scope attributes.
- [ ] Charts have aria-labels and text summaries for screen readers.
- [ ] Filter controls keyboard accessible (Tab to navigate, Enter to activate).
- [ ] Export buttons have clear labels ("Export invoices to CSV").
- [ ] Empty states have descriptive text and accessible CTAs.
- [ ] Mobile menu (hamburger) keyboard accessible and announced by screen readers.

## Security Checklist

- [ ] Authorization: Operators see only their data.
- [ ] Site Owners see only invoices addressed to them.
- [ ] Export files do not include sensitive data of other users.
- [ ] API rate limiting (max 100 requests/minute per user).
- [ ] Chart data aggregated (no individual user data leaked).
- [ ] Download links expire after 1 hour (for CSV/PDF exports).

===== END FILE: TASK_14_Invoice_Dashboard_UI.md =====
