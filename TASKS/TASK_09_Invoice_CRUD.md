===== BEGIN FILE: TASK_09_Invoice_CRUD.md =====

# TASK 09: Invoice Creation and Management (CRUD)

## Purpose

Enable Operators to create invoices for their Site Owner clients, tracking services rendered and milestones completed. Invoices include line items, tax calculation, and lifecycle management from Draft to Paid.

## Priority

Critical for payment system MVP.

## Dependencies

- TASK_01: Authentication System.
- TASK_02: Projects CRUD.
- Database schema for Invoice, InvoiceLineItem, TaxRate entities.
- Tax service integration (Stripe Tax recommended) or manual tax rate table.

## Acceptance Criteria

1. Operator Admin can create draft invoices with multiple line items.
2. Invoice includes: invoice number (auto-generated), issue date, due date, subtotal, tax rate, tax amount, total, currency, notes, payment terms.
3. Line items include: description, quantity, unit price, amount.
4. Invoice number format: OP-YYYY-#### (e.g., OP-2025-0001), auto-incremented per Operator organization.
5. Tax rate determined by Operator and Site Owner locations (EU VAT, US sales tax, etc.).
6. Subtotal equals sum of line item amounts (validated).
7. Total equals subtotal plus tax amount (validated).
8. Draft invoices can be edited or deleted.
9. Sent invoices locked (no edits, cannot delete).
10. Operator can list all invoices with filtering by status, project, date range.
11. Site Owner can view invoices addressed to them (read-only).
12. Invoice status: Draft, Sent, Viewed, Paid, Overdue, Cancelled, Refunded.

## UI Description

### Invoices List Page (Operator)

**URL:** /invoices

**Components:**
- Header: "Invoices" title, "Create Invoice" button.
- Filter bar: Status dropdown (All, Draft, Sent, Paid, Overdue), Project dropdown, date range picker, search by client name or invoice number.
- Metrics panel (above table):
  - Total Outstanding: $12,450.
  - Paid This Month: $8,300.
  - Overdue Count: 3.
- Table columns:
  - Invoice Number (link to detail).
  - Client Name.
  - Project Name.
  - Issue Date.
  - Due Date.
  - Amount.
  - Status (badge with color-coding).
  - Actions (dropdown: View, Send, Edit, Cancel, Download PDF).
- Pagination controls (50 per page).
- Empty state: "No invoices yet. Create your first invoice to get paid."

### Create Invoice Page

**URL:** /invoices/new

**Components:**
- Header: "Create Invoice", Save Draft and Cancel buttons.
- Form sections:

**Section 1: Client and Project**
- Client (dropdown, searchable list of Site Owner organizations associated with Operator's projects).
- Project (dropdown, filtered by selected client, optional).

**Section 2: Invoice Details**
- Invoice Number (auto-generated, display-only, shown after saving draft).
- Issue Date (date picker, defaults to today).
- Due Date (date picker, defaults to 30 days from issue date).
- Currency (dropdown: USD, EUR, GBP, defaults to Operator's country currency).
- Payment Terms (textarea, optional, e.g., "Net 30", "Due on receipt").
- Notes (textarea, optional, max 1000 chars, e.g., "Thank you for your business!").

**Section 3: Line Items**
- Table with columns: Description, Quantity, Unit Price, Amount.
- Each row editable inline.
- "Add Line Item" button to add new row.
- Delete icon per row.
- Subtotal auto-calculated (sum of amounts).

**Section 4: Tax**
- Tax Rate (auto-calculated based on locations, editable if manual override needed).
- Tax Amount (calculated as Subtotal × Tax Rate, display-only).
- Total (Subtotal + Tax Amount, display-only, bold).

**Validation:**
- Client required.
- Issue Date required, cannot be in future.
- Due Date required, must be after Issue Date.
- At least one line item required.
- Line item description required, max 500 chars.
- Line item quantity and unit price must be positive numbers.

**Interactions:**
- On "Save Draft": POST to /api/v1/invoices, redirect to invoice detail with toast "Invoice saved as draft".
- On "Cancel": Confirm unsaved changes, navigate back to invoices list.

### Edit Invoice Page

**URL:** /invoices/:id/edit

**Components:**
- Same as Create, but pre-populated with existing data.
- Only available if status = Draft.
- Header button: "Update" instead of "Save Draft".

**Interactions:**
- On "Update": PATCH to /api/v1/invoices/:id.
- On success: Redirect to detail with toast "Invoice updated".

### Invoice Detail Page (Operator View)

**URL:** /invoices/:id

**Components:**
- Header: Invoice number, status badge, actions dropdown (Send, Edit, Cancel, Download PDF).
- Invoice preview (styled as printable document):
  - Operator organization name and contact info (top-left).
  - Client organization name and contact info (top-right).
  - Invoice number, issue date, due date, payment terms.
  - Line items table.
  - Subtotal, tax (with rate and jurisdiction), total.
  - Notes section.
- Metadata panel (right sidebar):
  - Project name (if linked).
  - Created by, created date.
  - Sent date (if sent).
  - Viewed date (if client opened).
  - Paid date (if paid).
  - Payment status.

**Actions:**
- **Send Invoice:** Opens confirmation dialog "Send invoice to [client email]?". On confirm, POST to /api/v1/invoices/:id/send. Email sent to client, status changes to Sent.
- **Edit:** Navigate to edit page (only if Draft).
- **Cancel:** Opens confirmation "Cancel this invoice? Client will be notified." POST to /api/v1/invoices/:id/cancel. Status changes to Cancelled.
- **Download PDF:** GET /api/v1/invoices/:id/pdf, downloads PDF file.

### Invoice Detail Page (Site Owner View)

**URL:** /invoices/:id (same URL, different permissions)

**Components:**
- Invoice preview (read-only).
- "Pay Invoice" button (if status = Sent or Overdue).
- Payment history section (if status = Paid).

**Interactions:**
- Click "Pay Invoice" to open payment modal (TASK_10).

### Cancel Invoice Dialog

**Components:**
- Message: "Are you sure you want to cancel this invoice? [Client Name] will be notified."
- Reason textarea (optional).
- Cancel and Confirm buttons.

**Interactions:**
- On Confirm: POST to /api/v1/invoices/:id/cancel.
- On success: Status updated, email sent to client, redirect to list.

## API Endpoints

### POST /api/v1/invoices

**Request Body:**
```
{
  "site_owner_org_id": "uuid",
  "project_id": "uuid", // optional
  "issue_date": "2025-01-15",
  "due_date": "2025-02-14",
  "currency": "USD",
  "notes": "Thank you for your business!",
  "payment_terms": "Net 30",
  "line_items": [
    {
      "description": "Drone photography - January 2025",
      "quantity": 4,
      "unit_price": 500.00
    },
    {
      "description": "Monthly progress report",
      "quantity": 1,
      "unit_price": 200.00
    }
  ]
}
```

**Response (201 Created):**
```
{
  "invoice_id": "uuid",
  "invoice_number": "OP-2025-0001",
  "status": "Draft",
  "subtotal": 2200.00,
  "tax_rate": 8.50,
  "tax_amount": 187.00,
  "total_amount": 2387.00,
  "currency": "USD",
  "created_at": "2025-01-15T10:00:00Z"
}
```

**Validation:**
- Site Owner org must exist and be associated with Operator.
- Issue date cannot be future.
- Due date must be after issue date (minimum 1 day).
- At least one line item required.
- Line item amounts must match quantity × unit price.
- Calculate tax rate based on Operator and Site Owner locations.

**Behavior:**
- Generate invoice number: Query max invoice number for operator org, increment.
- Calculate subtotal: Sum of line item amounts.
- Calculate tax: Apply tax rate to subtotal.
- Create Invoice and InvoiceLineItem records.
- Return invoice with calculations.

### GET /api/v1/invoices

**Query Parameters:**
- status: Draft | Sent | Paid | Overdue | Cancelled (optional).
- project_id: UUID (optional).
- date_from: YYYY-MM-DD (optional, filter by issue_date).
- date_to: YYYY-MM-DD (optional).
- search: String (search by invoice number or client name, optional).
- limit: Max 100, default 50.
- offset: Default 0.

**Response (200 OK):**
```
{
  "invoices": [
    {
      "invoice_id": "uuid",
      "invoice_number": "OP-2025-0001",
      "site_owner_org_name": "ABC Construction",
      "project_name": "Downtown Tower",
      "issue_date": "2025-01-15",
      "due_date": "2025-02-14",
      "total_amount": 2387.00,
      "currency": "USD",
      "status": "Sent"
    }
  ],
  "total": 23,
  "limit": 50,
  "offset": 0
}
```

**Authorization:**
- Operator Admins see all invoices for their organization.
- Site Owners see only invoices addressed to them.

### GET /api/v1/invoices/:id

**Response (200 OK):**
```
{
  "invoice_id": "uuid",
  "invoice_number": "OP-2025-0001",
  "operator_org_id": "uuid",
  "operator_org_name": "Drone Pros LLC",
  "operator_org_address": "123 Main St, City, State",
  "site_owner_org_id": "uuid",
  "site_owner_org_name": "ABC Construction",
  "site_owner_org_address": "456 Builder Ave, City, State",
  "project_id": "uuid",
  "project_name": "Downtown Tower",
  "status": "Sent",
  "issue_date": "2025-01-15",
  "due_date": "2025-02-14",
  "subtotal": 2200.00,
  "tax_rate": 8.50,
  "tax_amount": 187.00,
  "total_amount": 2387.00,
  "currency": "USD",
  "notes": "Thank you for your business!",
  "payment_terms": "Net 30",
  "line_items": [
    {
      "line_item_id": "uuid",
      "description": "Drone photography - January 2025",
      "quantity": 4,
      "unit_price": 500.00,
      "amount": 2000.00,
      "sort_order": 1
    },
    {
      "line_item_id": "uuid",
      "description": "Monthly progress report",
      "quantity": 1,
      "unit_price": 200.00,
      "amount": 200.00,
      "sort_order": 2
    }
  ],
  "created_at": "2025-01-15T10:00:00Z",
  "sent_at": "2025-01-15T14:00:00Z",
  "paid_at": null
}
```

### PATCH /api/v1/invoices/:id

**Request Body:** Same as POST (partial updates allowed).

**Constraints:** Only Draft invoices can be edited.

**Response (200 OK):** Updated invoice object.

### POST /api/v1/invoices/:id/send

**Response (200 OK):**
```
{
  "invoice_id": "uuid",
  "status": "Sent",
  "sent_at": "2025-01-15T14:00:00Z"
}
```

**Behavior:**
- Update status to Sent, set sent_at timestamp.
- Send email to Site Owner with invoice link and PDF attachment.
- Lock invoice (prevent edits).

### POST /api/v1/invoices/:id/cancel

**Request Body:**
```
{
  "reason": "Project cancelled by client" // optional
}
```

**Response (200 OK):**
```
{
  "invoice_id": "uuid",
  "status": "Cancelled"
}
```

**Behavior:**
- Update status to Cancelled.
- Send notification email to Site Owner.

### DELETE /api/v1/invoices/:id

**Constraints:** Only Draft invoices can be deleted.

**Response (200 OK):**
```
{
  "message": "Invoice deleted successfully"
}
```

### GET /api/v1/invoices/:id/pdf

**Response:** Binary PDF file.

**Headers:**
- Content-Type: application/pdf.
- Content-Disposition: attachment; filename="invoice-OP-2025-0001.pdf".

**Behavior:**
- Generate PDF from invoice data using template (Puppeteer, PDFKit, or similar).
- Return PDF file for download.

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

**Behavior:**
- total_outstanding: Sum of Sent + Overdue invoices.
- total_paid_this_month: Sum of invoices paid in current calendar month.
- avg_time_to_payment_days: Average of (paid_at - issue_date) for paid invoices.
- overdue_count: Count of invoices where due_date < today and status != Paid.

## Test Scenarios

### Test 1: Create Draft Invoice

**Steps:**
1. Operator creates invoice with 2 line items.
2. Saves as draft.

**Expected:** Invoice saved with auto-generated number, status = Draft, tax calculated, total correct.

### Test 2: Edit Draft Invoice

**Steps:**
1. Create draft invoice.
2. Edit: Change due date, add line item.
3. Update.

**Expected:** Invoice updated, recalculations correct.

### Test 3: Delete Draft Invoice

**Steps:**
1. Create draft invoice.
2. Delete.

**Expected:** Invoice and line items deleted from database.

### Test 4: Send Invoice

**Steps:**
1. Create draft invoice.
2. Click "Send".
3. Confirm.

**Expected:** Status = Sent, email sent to client, invoice locked (Edit button disabled).

### Test 5: Cannot Edit Sent Invoice

**Steps:**
1. Send invoice.
2. Attempt to edit.

**Expected:** Error "Cannot edit invoice after it has been sent" (400).

### Test 6: Cancel Invoice

**Steps:**
1. Send invoice.
2. Cancel with reason.

**Expected:** Status = Cancelled, client notified.

### Test 7: Invoice Number Auto-Increment

**Steps:**
1. Create invoice (OP-2025-0001).
2. Create another invoice.

**Expected:** Second invoice = OP-2025-0002.

### Test 8: Tax Calculation (EU VAT)

**Steps:**
1. Operator in Germany (19% VAT), Site Owner in France (B2C).
2. Create invoice for 1000 EUR.

**Expected:** Tax rate 19%, tax amount 190 EUR, total 1190 EUR.

### Test 9: Tax Calculation (US Sales Tax)

**Steps:**
1. Operator in California (9.5% sales tax), Site Owner in California.
2. Create invoice for $1000.

**Expected:** Tax rate 9.5%, tax amount $95, total $1095.

### Test 10: Reverse Charge (EU B2B)

**Steps:**
1. Operator in Germany, Site Owner in Netherlands (both have valid VAT IDs).
2. Create invoice.

**Expected:** Tax rate 0%, note "Reverse charge applies" on invoice.

### Test 11: List Invoices with Filter

**Steps:**
1. Create invoices with various statuses.
2. GET /api/v1/invoices?status=Sent.

**Expected:** Only Sent invoices returned.

### Test 12: Site Owner Views Invoice

**Steps:**
1. Send invoice to client.
2. Client logs in, navigates to invoices.

**Expected:** Client sees invoice (read-only), "Pay Invoice" button visible.

### Test 13: Download Invoice PDF

**Steps:**
1. Click "Download PDF" on invoice detail.

**Expected:** PDF downloads with invoice data formatted professionally.

### Test 14: Dashboard Metrics

**Steps:**
1. Create and send multiple invoices (some paid, some overdue).
2. GET /api/v1/invoices/dashboard.

**Expected:** Metrics accurately calculated.

## Caveats and Edge Cases

### Invoice Number Uniqueness

Use database transaction to ensure no duplicate invoice numbers (race condition with concurrent invoice creation). Consider using database sequence or UUID prefix.

### Tax Rate Updates

If tax rates change after invoice created, invoice retains original rate (snapshot at creation time). Do not retroactively update.

### Multi-Currency Invoices

Each invoice has single currency. If operator works with international clients, support multiple currencies. Display amounts in invoice currency throughout.

### Large Line Item Counts

Limit line items per invoice (e.g., max 50) to prevent UI/performance issues. For complex billing, offer line item grouping or summary.

### Deleted Projects

If project linked to invoice is deleted, invoice retains project name snapshot. Do not cascade delete invoices.

### Invoice PDF Generation Performance

PDF generation can be slow (2-5 seconds). Generate asynchronously if needed, or cache generated PDFs.

### Viewing Tracking

Track when Site Owner views invoice (open tracking pixel or log first API fetch). Update status from Sent to Viewed.

### Editing Line Items

When editing draft, allow adding/removing/reordering line items. Recalculate subtotal and total.

### Decimal Precision

Store monetary amounts with 2 decimal precision. Round tax calculations to 2 decimals (banker's rounding).

## Performance Considerations

### Invoice Number Generation

Use database sequence or atomic counter in Redis to avoid contention on high-volume invoice creation.

### Tax Calculation

Cache tax rates by jurisdiction in Redis. For Stripe Tax integration, call API only on invoice creation (not on every draft edit).

### Dashboard Metrics Caching

Calculate metrics asynchronously (cron job every 5 minutes), store in Redis. API returns cached values.

### PDF Generation

Use headless browser (Puppeteer) or template engine (Handlebars + PDFKit). Cache generated PDFs in S3 (invalidate if invoice edited).

### Database Indexes

- invoice.operator_org_id (for listing).
- invoice.site_owner_org_id (for client view).
- invoice.status (for filtering).
- invoice.due_date (for overdue detection).
- invoice.invoice_number (unique index).

## Security Checklist

- [ ] Authorization: Operator can only create invoices for their organization.
- [ ] Site Owner can only view invoices addressed to them.
- [ ] Invoice IDs validated (UUID format).
- [ ] Input validation on all fields (positive amounts, valid dates).
- [ ] SQL injection prevented via ORM.
- [ ] Rate limiting on invoice creation (max 100 per day per org).
- [ ] PDF generation sandboxed (no code execution from invoice data).

===== END FILE: TASK_09_Invoice_CRUD.md =====
