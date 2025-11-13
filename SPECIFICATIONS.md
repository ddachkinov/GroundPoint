===== BEGIN FILE: SPECIFICATIONS.md =====

# Technical Specifications — Drone Construction Progress SaaS Platform

## Application Context

This SaaS is a project-management and monitoring platform specifically for drone operators who film and document the construction progress of buildings and other built assets. The platform serves the drone operator as the paying customer (the "Operator"), and the operator's clients (the "Site Owners" or "Builders") as the consumers of the delivered visual progress reports.

### Core Concept

An Operator registers and manages multiple Projects.

Each Project belongs to one of the Operator's clients and can contain multiple Sites (distinct physical locations or building sections).

For each Site, Operators capture periodic visuals from pre-defined camera angles (the same angle/position over time).

The platform stores and organizes these time-series photos (and optionally videos/photogrammetry) so Site Owners can quickly compare progress over time.

The UI includes a calendar/timeline view for quick comparison of captures, side-by-side image diffs, and overlaying/layering of images for paid tiers.

MVP scope: user registration, Project/Site creation, image upload with metadata (angle, GPS, timestamp), timeline/calendar view, side-by-side comparison, role-based access, and payment/plan management for feature gating.

Premium tiers unlock layered comparison, video storage, photogrammetry capabilities, and extended retention.

### Integrated Payment System

The platform acts as an intermediary payment processor between Operators (sellers) and Site Owners (buyers).

Operators can generate invoices for each Project or milestone and send them to their client through the platform.

Site Owners can review and pay invoices online using credit card, SEPA, or bank transfer (through Stripe, Paddle, or similar).

The platform automatically:
- Collects payment from the Site Owner.
- Deducts a platform service fee (percentage or flat rate).
- Transfers the remaining funds to the Operator's connected account (Stripe Connect recommended).
- Issues digital receipts to both parties.
- Tracks invoice and payment status (Draft, Sent, Paid, Overdue, Refunded).

Operators can view earnings, outstanding invoices, and payouts in their dashboard.

The platform maintains compliance with tax/VAT regulations (EU-ready), supports PDF invoice downloads, and keeps audit trails.

Future upgrades may include automated milestone billing, subscription-based operator payments, and API integrations with accounting tools (e.g., QuickBooks, Xero).

### Business Goal

To make Operators dependent on the platform for organizing client projects and getting paid, while providing Builders with a simple, transparent experience for tracking progress, approving work, and paying invoices in one place.

### Non-Functional Goals

- Secure multi-tenant SaaS architecture.
- Scalable storage and thumbnail generation pipeline.
- Predictable operational cost model.
- GDPR-friendly data handling for EU customers.
- Strong financial data security and separation of operator/client funds.

---

## 1. User Roles and Permissions

The platform supports six distinct user roles with clearly defined access boundaries and operational permissions.

### 1.1 Role Definitions

#### Operator Admin

**Description:** Owner of an Operator account. Full control over their organization, projects, billing, and team members.

**Allowed Actions:**
- Create, edit, delete Projects and Sites within their organization.
- Upload, edit metadata, delete images/videos for any Project they own.
- Invite and manage Operator Members within their organization.
- Invite Site Owner clients to Projects.
- Generate, send, edit, delete invoices for their Projects.
- View invoice payment status and payout history.
- Onboard Stripe Connect account for receiving payouts.
- Configure organization-level settings (branding, default angles, retention policies).
- Manage subscription and billing for SaaS platform features.
- View all activity logs for their organization.

**Forbidden Operations:**
- Access or modify Projects owned by other Operators.
- View or modify platform-level configuration.
- Access Superadmin tools or support tooling.
- Issue refunds without platform approval (configurable).

**Data Visibility:**
- All Projects, Sites, Images, Invoices, Payments, and Payouts for their organization.
- Aggregate analytics for their organization only.
- Personal billing and subscription information.

#### Operator Member

**Description:** Team member within an Operator organization. Limited permissions assigned by Operator Admin.

**Allowed Actions:**
- View Projects and Sites they are assigned to.
- Upload images/videos to assigned Projects.
- Edit metadata on images they uploaded.
- View invoices related to assigned Projects (read-only).
- Generate draft invoices (requires Operator Admin approval to send).

**Forbidden Operations:**
- Create or delete Projects or Sites.
- Invite new clients or team members.
- Send invoices or manage payments.
- Delete images uploaded by others.
- Modify organization settings or subscription.
- Access financial data (payouts, platform fees).

**Data Visibility:**
- Only Projects and Sites explicitly assigned to them.
- Images and metadata within assigned Projects.
- Invoice drafts they created (view-only after submission).

#### Site Owner Client

**Description:** The Operator's customer. Receives visual progress reports and pays invoices through the platform.

**Allowed Actions:**
- View all Projects and Sites they have been invited to.
- Browse timeline, compare images side-by-side for their Projects.
- Download images and reports (if permitted by Operator).
- View invoices addressed to them.
- Pay invoices using credit card, SEPA, or bank transfer.
- Download invoice PDFs and payment receipts.
- Provide feedback or comments on specific captures (if enabled).
- Update their payment methods and billing information.

**Forbidden Operations:**
- Upload, edit, or delete any images.
- Create or modify Projects or Sites.
- View invoices for other Site Owners.
- Access Operator's payout or earnings data.
- Invite additional users.
- Access advanced features (layered overlay, photogrammetry) unless included in their Project tier.

**Data Visibility:**
- Projects and Sites they have been explicitly invited to.
- Images and timeline data for those Projects.
- Invoices addressed to their organization.
- Payment history for invoices they paid.

#### Project Viewer

**Description:** Read-only stakeholder invited to view specific Project progress. Typically subcontractors, architects, or project managers.

**Allowed Actions:**
- View Projects and Sites they are invited to.
- Browse timeline and image galleries.
- Download images if permitted.
- Export reports if enabled.

**Forbidden Operations:**
- Upload, edit, delete any content.
- Access invoices or payment information.
- Invite additional users.
- Modify Project or Site settings.

**Data Visibility:**
- Projects and Sites they are invited to (read-only).
- Images and metadata within those Projects.

#### Support

**Description:** Platform customer support personnel. Can view user data to resolve issues but cannot modify financial or content data without explicit authorization.

**Allowed Actions:**
- Search and view user accounts, Projects, Sites.
- View (but not edit) invoices, payments, and payout records for troubleshooting.
- Impersonate users (with audit logging) to reproduce issues.
- View activity logs and error reports.
- Reset passwords and unlock accounts.
- Add notes to user accounts for internal tracking.

**Forbidden Operations:**
- Modify or delete user Projects, Sites, or Images.
- Process refunds or payouts without Superadmin approval.
- Change subscription tiers without user consent.
- Export financial data in bulk.

**Data Visibility:**
- All user accounts and Projects (read-only unless escalated).
- Aggregate anonymized analytics.
- Audit logs and support tickets.

#### Superadmin

**Description:** Platform engineering and operations team. Full system access for maintenance, financial reconciliation, and platform configuration.

**Allowed Actions:**
- All actions available to other roles.
- Configure platform-wide settings (fee structure, payment processors, retention policies).
- Manually trigger payouts or refunds.
- Access raw database for reconciliation and migrations.
- Manage feature flags and rollout experiments.
- View and export financial ledgers and audit logs.
- Suspend or delete accounts (with audit trail).

**Forbidden Operations:**
- None. All actions are logged and subject to internal compliance review.

**Data Visibility:**
- Full access to all platform data.

### 1.2 Role Permission Matrix

| Action | Operator Admin | Operator Member | Site Owner | Viewer | Support | Superadmin |
|--------|----------------|-----------------|------------|--------|---------|------------|
| Create Project | Yes | No | No | No | No | Yes |
| Edit Project | Yes (own) | No | No | No | No | Yes (all) |
| Delete Project | Yes (own) | No | No | No | No | Yes (all) |
| Upload Image | Yes | Yes (assigned) | No | No | No | Yes |
| Delete Image | Yes (own org) | No | No | No | No | Yes |
| View Project | Yes (own) | Yes (assigned) | Yes (invited) | Yes (invited) | Yes (all) | Yes (all) |
| Invite Site Owner | Yes | No | No | No | No | Yes |
| Create Invoice | Yes | Draft only | No | No | No | Yes |
| Send Invoice | Yes | No | No | No | No | Yes |
| View Invoice | Yes (own) | Read (assigned) | Yes (received) | No | Yes (all) | Yes (all) |
| Pay Invoice | No | No | Yes (received) | No | No | Yes |
| View Payouts | Yes (own) | No | No | No | Yes (read) | Yes (all) |
| Manage Subscription | Yes (own) | No | No | No | No | Yes (all) |
| Access Platform Config | No | No | No | No | No | Yes |

---

## 2. Feature Specifications

### 2.1 MVP Features (Phase 1)

#### Feature 2.1.1: User Registration and Authentication

**Description:** Secure account creation and login for Operators and Site Owners.

**Requirements:**
- Email and password registration with email verification.
- OAuth2 login via Google and Microsoft (optional for Site Owners).
- Multi-factor authentication (MFA) optional for Operators, required for Superadmin.
- Password reset via email token (expires in 1 hour).
- Session management with JWT tokens (15-minute access token, 7-day refresh token).
- Account types: Operator Organization vs. Site Owner Organization vs. Individual Viewer.
- Terms of Service and Privacy Policy acceptance required on signup.

**Validation:**
- Email format validation (RFC 5322).
- Password minimum 12 characters, must include uppercase, lowercase, number, special character.
- Rate limiting: 5 failed login attempts per email per hour.
- CAPTCHA after 3 failed attempts.

**Security:**
- Passwords hashed using bcrypt (cost factor 12).
- Tokens signed with RS256 algorithm.
- HTTPS required for all authentication endpoints.
- Secure, HttpOnly, SameSite cookies for refresh tokens.

#### Feature 2.1.2: Projects and Sites CRUD

**Description:** Operators create and manage Projects for their clients, each containing one or more Sites.

**Project Entity Fields:**
- Project ID (UUID, primary key).
- Name (string, max 200 characters, required).
- Description (text, max 2000 characters, optional).
- Operator Organization ID (foreign key, required).
- Site Owner Client ID (foreign key, required).
- Status (enum: Active, Paused, Completed, Archived).
- Created At, Updated At (timestamps).
- Retention Days (integer, default based on subscription tier).
- Thumbnail Image ID (foreign key, nullable).

**Site Entity Fields:**
- Site ID (UUID, primary key).
- Project ID (foreign key, required).
- Name (string, max 200 characters, required).
- Address (text, optional).
- GPS Coordinates (latitude, longitude, decimal degrees, optional).
- Description (text, max 1000 characters, optional).
- Created At, Updated At (timestamps).

**Business Rules:**
- One Operator Organization can have unlimited Projects (subject to subscription quota).
- Each Project belongs to exactly one Operator and one Site Owner.
- Each Project can contain 1 to 50 Sites (configurable per tier).
- Deleting a Project requires confirmation and is soft-delete (archived) if it has any invoices.
- Archived Projects are hidden from default views but accessible via Archive tab.

**API Contracts:**
- POST /api/v1/projects (create).
- GET /api/v1/projects (list with pagination, filtering).
- GET /api/v1/projects/:id (retrieve single).
- PATCH /api/v1/projects/:id (update).
- DELETE /api/v1/projects/:id (soft delete).
- POST /api/v1/projects/:id/sites (create Site within Project).
- GET /api/v1/sites/:id (retrieve Site).
- PATCH /api/v1/sites/:id (update Site).
- DELETE /api/v1/sites/:id (delete Site, hard delete if no captures).

**Validation:**
- Project name must be unique within Operator Organization.
- Site name must be unique within Project.
- GPS coordinates must be valid WGS84 decimal degrees.

#### Feature 2.1.3: Image Upload with Metadata

**Description:** Operators upload progress photos with associated metadata for time-series comparison.

**Capture Entity Fields:**
- Capture ID (UUID, primary key).
- Site ID (foreign key, required).
- Angle ID (foreign key, required, references pre-defined or custom angle).
- Uploaded By User ID (foreign key, required).
- Capture Date (date, required, user-specified or defaults to upload time).
- File Path (string, S3 key or equivalent, required).
- Thumbnail Path (string, S3 key, generated).
- File Size (integer, bytes).
- Image Width, Height (integers, pixels).
- GPS Coordinates (latitude, longitude, optional, can differ from Site default).
- Weather Conditions (enum: Sunny, Cloudy, Rainy, Snowy, optional).
- Notes (text, max 500 characters, optional).
- File Type (enum: Image, Video, Photogrammetry).
- Processing Status (enum: Uploaded, Processing, Ready, Failed).
- Created At, Updated At (timestamps).

**Angle Entity Fields:**
- Angle ID (UUID, primary key).
- Site ID (foreign key, required).
- Name (string, max 100 characters, required, e.g., "North Facade", "Aerial Overview").
- Description (text, optional).
- Reference Image ID (foreign key, nullable, first capture from this angle).
- Sort Order (integer, for UI display).

**Upload Process:**
1. Client requests pre-signed S3 upload URL via POST /api/v1/captures/upload-url.
2. Backend validates user permissions, quota, and file type.
3. Backend generates pre-signed URL with expiration (10 minutes) and returns to client.
4. Client uploads file directly to S3 using pre-signed URL.
5. Client calls POST /api/v1/captures/complete with S3 key and metadata.
6. Backend creates Capture record, enqueues thumbnail generation job.
7. Background worker generates thumbnail (max 400px wide, JPEG quality 85).
8. Capture status updated to Ready.

**Supported Formats:**
- Images: JPEG, PNG, TIFF (max 50 MB per file for MVP).
- Videos: MP4, MOV (Premium tier only, max 500 MB).
- Photogrammetry: ZIP containing images and metadata (Premium tier only, max 2 GB).

**Validation:**
- File extension must match MIME type.
- Image resolution minimum 1280x720 pixels.
- Operator must have remaining storage quota.
- Capture Date cannot be in the future.

**Storage Strategy:**
- S3-compatible object storage (AWS S3, Cloudflare R2, Backblaze B2).
- Bucket structure: captures/{operator_id}/{project_id}/{site_id}/{capture_id}.{ext}.
- Thumbnails: thumbnails/{operator_id}/{project_id}/{site_id}/{capture_id}_thumb.jpg.
- Lifecycle policy: Archive to Glacier after retention period expires (tier-dependent).

**Quotas (MVP Tier):**
- 10 GB storage per Operator Organization.
- 500 image uploads per month.
- 5 custom angles per Site.

#### Feature 2.1.4: Timeline and Calendar View

**Description:** Visual timeline interface for browsing captures chronologically and comparing progress.

**UI Components:**
- Calendar grid showing capture dates (bold dates with captures, grey empty dates).
- Timeline slider for scrubbing through time (horizontal axis = date).
- Angle filter dropdown (show captures from selected angle only).
- Site selector (multi-select for Projects with multiple Sites).
- Thumbnail grid view (default 4x4 grid, paginated).
- List view (sortable table with date, angle, uploader, file size).

**Interactions:**
- Click date on calendar to jump to captures from that day.
- Drag timeline slider to scrub through captures chronologically.
- Click thumbnail to open full-size lightbox view.
- Checkbox-select up to 4 images for side-by-side comparison.
- Keyboard shortcuts: arrow keys to navigate, spacebar to select, Enter to open lightbox.

**Data Loading:**
- API returns captures grouped by date with pagination (50 per page).
- Lazy load thumbnails as user scrolls.
- Cache calendar availability (dates with captures) for 5 minutes.

**Performance:**
- Calendar query optimized with index on Site ID + Capture Date.
- Thumbnail CDN caching with 30-day TTL.
- Progressive image loading (low-quality placeholder then full resolution).

#### Feature 2.1.5: Side-by-Side Image Comparison

**Description:** Compare selected images from the same angle to visualize progress over time.

**UI Requirements:**
- Support 2-way, 3-way, or 4-way comparison.
- Images displayed at equal dimensions (fit to viewport).
- Synchronized zoom and pan (zoom on one image zooms all proportionally).
- Date labels below each image.
- Export comparison as single combined image (PNG, 2x2 or 1x4 layout).

**Business Rules:**
- All selected images must be from the same Angle (enforced in UI and API).
- Maximum 4 images per comparison.
- Comparison state shareable via URL (query params encode Capture IDs).

**API Contract:**
- GET /api/v1/captures/compare?ids=uuid1,uuid2,uuid3 (returns metadata for selected captures).

**Performance:**
- Load full-resolution images only when comparison initiated.
- Use requestAnimationFrame for synchronized pan/zoom.

#### Feature 2.1.6: Role-Based Access Control

**Description:** Enforce permissions as defined in Section 1.2.

**Implementation Requirements:**
- Middleware checks JWT claims for User ID and Role.
- Database stores User-Organization relationship and Role.
- Project-level access controlled via ProjectMember table (User ID, Project ID, Role).
- API endpoints return 403 Forbidden if user lacks required permission.
- Frontend hides UI elements for actions user cannot perform (defense in depth, backend still enforces).

**Access Patterns:**
- Operator Admin has implicit access to all Projects in their Organization.
- Operator Member access granted explicitly per Project.
- Site Owner Client access granted when invited to Project (ProjectInvitation table).
- Project Viewer access granted via invitation link with expiration.

**Invitation Flow:**
- Operator Admin sends invitation via email with unique token (expires in 7 days).
- Recipient clicks link, creates account or logs in.
- Token validated and User added to ProjectMember table with appropriate Role.

#### Feature 2.1.7: Subscription and Billing for SaaS Platform

**Description:** Operators subscribe to tiered plans to unlock features and increase quotas.

**Subscription Tiers (MVP):**

**Free Tier:**
- 2 GB storage.
- 100 image uploads/month.
- 3 Projects.
- Side-by-side comparison only.
- 30-day retention.
- Community support.

**Professional Tier (29 USD/month or 290 USD/year):**
- 50 GB storage.
- 1000 image uploads/month.
- Unlimited Projects.
- Layered overlay comparison.
- 1-year retention.
- Email support.

**Business Tier (99 USD/month or 990 USD/year):**
- 500 GB storage.
- Unlimited image uploads.
- Unlimited Projects.
- Video uploads (max 500 MB per file).
- Layered overlay comparison.
- 3-year retention.
- Priority support.
- Custom branding (logo, colors).

**Enterprise Tier (Custom pricing):**
- Unlimited storage.
- Unlimited uploads.
- Photogrammetry processing.
- Lifetime retention.
- Dedicated account manager.
- API access.
- Custom integrations.

**Billing Integration:**
- Use Stripe for subscription management (recommended).
- Alternative: Paddle for simplified EU VAT handling.
- Store subscription state in OperatorSubscription table (Operator ID, Tier, Status, Current Period Start/End).
- Sync subscription events via webhooks (subscription.created, subscription.updated, subscription.deleted, invoice.paid, invoice.payment_failed).
- Enforce quotas in real-time (check before upload, Project creation).
- Grace period: 7 days after payment failure before downgrading to Free tier.

**Quota Enforcement:**
- Storage: Calculate total file size on upload, reject if exceeds quota.
- Uploads: Increment counter monthly, reset on billing cycle start.
- Projects: Count active Projects, prevent creation if at limit.

**Proration:**
- Upgrading mid-cycle: Prorate remaining days and charge difference immediately.
- Downgrading mid-cycle: Apply credit to next billing cycle.

**API Contracts:**
- GET /api/v1/subscriptions/current (retrieve current subscription).
- POST /api/v1/subscriptions/checkout (create Stripe Checkout session for upgrade).
- POST /api/v1/subscriptions/portal (create Stripe Customer Portal session for management).
- Webhooks: POST /webhooks/stripe (receive subscription events).

### 2.2 MVP Features (Phase 2): Invoicing and Payment System

#### Feature 2.2.1: Invoice Generation and Management

**Description:** Operators create invoices for their clients, tracking work completed and milestones.

**Invoice Entity Fields:**
- Invoice ID (UUID, primary key).
- Invoice Number (string, auto-generated, format: OP-YYYY-####, unique).
- Operator Organization ID (foreign key, required).
- Site Owner Client ID (foreign key, required).
- Project ID (foreign key, optional, can invoice across multiple Projects).
- Status (enum: Draft, Sent, Viewed, Paid, Overdue, Cancelled, Refunded).
- Issue Date (date, required).
- Due Date (date, required, must be after Issue Date).
- Subtotal (decimal, precision 2, sum of line items).
- Tax Rate (decimal, percentage, e.g., 19.00 for 19% VAT).
- Tax Amount (decimal, calculated as Subtotal * Tax Rate).
- Total Amount (decimal, Subtotal + Tax Amount).
- Currency (string, ISO 4217, default EUR or USD based on Operator country).
- Notes (text, max 1000 characters, optional).
- Payment Terms (text, max 500 characters, e.g., "Net 30", optional).
- Stripe Payment Intent ID (string, nullable, populated when payment initiated).
- Paid At (timestamp, nullable).
- Created At, Updated At (timestamps).

**Line Item Entity Fields:**
- Line Item ID (UUID, primary key).
- Invoice ID (foreign key, required).
- Description (string, max 500 characters, required).
- Quantity (decimal, precision 2, default 1.00).
- Unit Price (decimal, precision 2, required).
- Amount (decimal, calculated as Quantity * Unit Price).
- Sort Order (integer).

**Invoice Lifecycle:**

1. **Draft:** Operator creates invoice with line items. Editable. Not visible to Site Owner.

2. **Sent:** Operator sends invoice. Email notification sent to Site Owner. Invoice locked (no edits). Site Owner can view.

3. **Viewed:** Site Owner opened invoice (tracking pixel or API call). Status updated automatically.

4. **Paid:** Payment successfully processed. Status updated via webhook. Payout scheduled.

5. **Overdue:** Due Date passed without payment. Automated reminder emails sent (1 day after, 7 days after, 14 days after).

6. **Cancelled:** Operator cancels invoice before payment. Site Owner notified.

7. **Refunded:** Payment refunded (partial or full). Payout reversed.

**API Contracts:**
- POST /api/v1/invoices (create draft invoice).
- GET /api/v1/invoices (list invoices, filterable by status, Project, date range).
- GET /api/v1/invoices/:id (retrieve single invoice with line items).
- PATCH /api/v1/invoices/:id (update draft invoice).
- POST /api/v1/invoices/:id/send (send invoice to Site Owner, transitions Draft → Sent).
- POST /api/v1/invoices/:id/cancel (cancel invoice, transitions Sent → Cancelled).
- DELETE /api/v1/invoices/:id (delete draft invoice only).
- GET /api/v1/invoices/:id/pdf (generate and download PDF).

**Validation:**
- Invoice must have at least one line item.
- Subtotal must match sum of line item amounts.
- Total Amount must equal Subtotal + Tax Amount.
- Due Date must be at least 1 day after Issue Date.
- Invoice cannot be edited after status is Sent.
- Only Draft invoices can be deleted.

**Business Rules:**
- Invoice Number auto-incremented per Operator Organization.
- Tax Rate defaults to Operator's registered country VAT rate (EU) or 0% (non-EU).
- Site Owner can view invoice without login if accessed via unique token link.
- Invoice PDF generated on-demand using template engine (recommended: Puppeteer rendering HTML to PDF).

#### Feature 2.2.2: Payment Processing

**Description:** Site Owners pay invoices online via Stripe. Platform collects payment and schedules payout to Operator.

**Payment Entity Fields:**
- Payment ID (UUID, primary key).
- Invoice ID (foreign key, required).
- Site Owner User ID (foreign key, required).
- Amount (decimal, must equal Invoice Total Amount for full payment).
- Currency (string, must match Invoice Currency).
- Payment Method (enum: Card, SEPA, BankTransfer).
- Stripe Payment Intent ID (string, required).
- Stripe Charge ID (string, nullable).
- Status (enum: Pending, Succeeded, Failed, Refunded).
- Paid At (timestamp, nullable).
- Failure Reason (text, nullable).
- Created At, Updated At (timestamps).

**Payment Flow:**

1. Site Owner clicks "Pay Invoice" button.

2. Frontend calls POST /api/v1/invoices/:id/payment-intent.

3. Backend creates Stripe Payment Intent with amount, currency, metadata (Invoice ID, Operator ID).

4. Backend returns client_secret to frontend.

5. Frontend loads Stripe.js and displays payment form (Stripe Elements).

6. Site Owner enters payment details and submits.

7. Stripe processes payment asynchronously.

8. Stripe sends webhook to POST /webhooks/stripe/payments.

9. Backend verifies webhook signature, updates Invoice status to Paid, creates Payment record.

10. Backend enqueues payout job for Operator.

11. Backend sends payment confirmation emails to Site Owner and Operator.

**Stripe Configuration:**
- Use Stripe Payment Intents API (supports 3D Secure, strong customer authentication).
- Enable automatic payment methods (card, SEPA Direct Debit, bank transfer where available).
- Capture payments immediately (not authorized-only).
- Store Stripe Customer ID for Site Owner to save payment methods.

**API Contracts:**
- POST /api/v1/invoices/:id/payment-intent (create Stripe Payment Intent).
- GET /api/v1/payments/:id (retrieve payment details).
- POST /api/v1/payments/:id/refund (initiate refund, Superadmin only).

**Security:**
- Never store raw card numbers (Stripe tokenizes via Elements).
- Use Stripe's client-side encryption.
- Validate webhook signatures using signing secret.
- Implement idempotency keys for payment creation.

**Error Handling:**
- Payment failure: Update Invoice status, send notification to Site Owner with retry link.
- Insufficient funds: Provide clear error message, allow retry.
- 3D Secure required: Stripe.js handles redirect flow automatically.

#### Feature 2.2.3: Platform Fee Calculation and Deduction

**Description:** Platform deducts service fee from each payment before disbursing payout to Operator.

**Fee Structure (Configurable):**

**Recommended:** Percentage-based fee.
- 5% of invoice total + 0.50 USD fixed fee per transaction.
- Rationale: Aligns incentives with transaction value, industry-standard for payment platforms.

**Alternatives:**
- Flat fee per invoice (e.g., 2 USD): Simpler but penalizes small invoices.
- Tiered pricing (e.g., 3% for first 10k, 2% above): Rewards high-volume Operators but adds complexity.

**Fee Entity Fields:**
- Fee ID (UUID, primary key).
- Payment ID (foreign key, required).
- Fee Type (enum: PlatformPercentage, PlatformFixed, StripeProcessing).
- Amount (decimal, precision 2).
- Currency (string).
- Calculated At (timestamp).

**Calculation Logic:**

```
Invoice Total: 1000.00 EUR
Platform Percentage Fee: 1000.00 * 0.05 = 50.00 EUR
Platform Fixed Fee: 0.50 EUR
Stripe Processing Fee: ~2.9% + 0.25 EUR = 29.25 EUR (approximate, varies by method)
Total Fees: 50.00 + 0.50 + 29.25 = 79.75 EUR
Operator Payout: 1000.00 - 79.75 = 920.25 EUR
```

**Implementation:**
- Fees calculated when Payment Intent created.
- Stored in Fee table linked to Payment.
- Stripe processing fee estimated initially, adjusted after actual charge using Stripe Balance Transaction API.
- Platform fee deducted from payout (Operator receives net amount).

**Transparency:**
- Operator sees fee breakdown in invoice details and payout dashboard.
- Site Owner sees only total amount (fees not itemized on their receipt).

**API Contracts:**
- GET /api/v1/fees?payment_id=:id (retrieve fees for a payment).

#### Feature 2.2.4: Payout Disbursement to Operators

**Description:** Platform transfers funds to Operator's connected Stripe account after payment received.

**Payout Entity Fields:**
- Payout ID (UUID, primary key).
- Operator Organization ID (foreign key, required).
- Payment ID (foreign key, required).
- Gross Amount (decimal, original payment amount).
- Fee Amount (decimal, total platform fees).
- Net Amount (decimal, amount transferred to Operator).
- Currency (string).
- Stripe Transfer ID (string, nullable).
- Stripe Connected Account ID (string, required).
- Status (enum: Pending, InTransit, Paid, Failed).
- Scheduled At (timestamp, when payout will be initiated).
- Paid At (timestamp, nullable).
- Failure Reason (text, nullable).
- Created At, Updated At (timestamps).

**Payout Flow:**

1. Invoice marked Paid, Payment record created.

2. Backend calculates fees and net payout amount.

3. Payout record created with status Pending.

4. Payout job scheduled (default: 24 hours after payment, configurable).

5. Background worker initiates Stripe Transfer to Operator's Connected Account.

6. Stripe processes transfer (typically 1-3 business days to bank).

7. Stripe sends webhook transfer.paid or transfer.failed.

8. Backend updates Payout status to Paid or Failed.

9. Operator receives email notification when payout arrives.

**Stripe Connect Setup:**

- Use Stripe Connect with Standard Accounts (recommended).
- Alternative: Express Accounts (simpler onboarding but less control).
- Operators onboard via Stripe Connect OAuth flow or Account Links.
- Platform stores stripe_connected_account_id in OperatorOrganization table.
- Operators manage payout schedule and bank details in Stripe Express Dashboard.

**Onboarding Flow:**

1. Operator clicks "Setup Payouts" in dashboard.

2. Frontend calls POST /api/v1/operators/connect-account.

3. Backend creates Stripe Connected Account and returns account_link URL.

4. Operator redirected to Stripe onboarding (identity verification, bank details).

5. Stripe redirects back to platform with success or failure.

6. Backend receives webhook account.updated and stores account ID.

7. Operator can now receive payouts.

**Payout Scheduling:**
- Default: T+1 (1 day after payment).
- Configurable per Operator (immediate, daily, weekly, monthly).
- Minimum payout amount: 10 USD (prevent micro-transfers).
- Accumulated payouts batched if below minimum (transferred when threshold reached).

**API Contracts:**
- POST /api/v1/operators/connect-account (initiate Stripe Connect onboarding).
- GET /api/v1/operators/connect-account/status (check onboarding completion).
- GET /api/v1/payouts (list payouts for Operator, filterable by status, date).
- GET /api/v1/payouts/:id (retrieve single payout details).

**Reconciliation:**
- Daily batch job reconciles Payout records with Stripe Balance Transactions.
- Discrepancies logged and flagged for manual review.
- Superadmin dashboard shows unreconciled payouts.

#### Feature 2.2.5: Invoice Notifications and Reminders

**Description:** Automated email notifications for invoice lifecycle events and payment reminders.

**Notification Events:**

1. **Invoice Sent:** Sent to Site Owner when Operator sends invoice.
   - Subject: "New invoice from [Operator Name]: [Invoice Number]".
   - Body: Invoice details, payment link, due date.
   - CTA: "View and Pay Invoice".

2. **Payment Confirmation:** Sent to Site Owner and Operator when payment succeeds.
   - To Site Owner: Receipt with payment details, PDF attachment.
   - To Operator: Notification of payment received, payout estimate.

3. **Overdue Reminder:** Sent to Site Owner at intervals after due date.
   - Day 1: Friendly reminder.
   - Day 7: Second reminder with urgency.
   - Day 14: Final notice.

4. **Payout Confirmation:** Sent to Operator when payout transferred.
   - Subject: "Payout processed: [Amount] on its way".
   - Body: Net amount, fees breakdown, expected arrival date.

5. **Payout Failed:** Sent to Operator if payout fails.
   - Subject: "Action required: Payout failed".
   - Body: Failure reason, link to update bank details.

**Email Templates:**
- Use transactional email service (Postmark, SendGrid, AWS SES).
- HTML templates with responsive design.
- Plain-text alternative for accessibility.
- Unsubscribe link (except critical transactional emails).

**Configuration:**
- Operators can disable overdue reminders per invoice.
- Site Owners can set notification preferences (email, SMS, none).

**API Contracts:**
- POST /api/v1/notifications/send (internal API for triggering emails from backend).
- GET /api/v1/notifications (list sent notifications, audit trail).

**Deliverability:**
- SPF, DKIM, DMARC configured for sending domain.
- Monitor bounce and complaint rates.
- Suppress emails to bounced addresses.

#### Feature 2.2.6: Tax and VAT Handling

**Description:** Automatically calculate and apply tax to invoices based on Operator and Site Owner locations.

**Requirements:**

- EU VAT compliance: Charge VAT based on Site Owner's country if Operator is EU-based.
- Reverse charge mechanism: If both parties are EU businesses, VAT not charged (B2B).
- VAT ID validation: Validate Site Owner's VAT number using VIES API (EU).
- US Sales Tax: Support state-level sales tax (if Operator subject to nexus).
- Invoice must display tax rate and amount separately.

**Tax Rate Entity Fields:**
- Tax Rate ID (UUID, primary key).
- Country Code (string, ISO 3166-1 alpha-2).
- Region (string, optional, e.g., state/province).
- Rate (decimal, percentage).
- Type (enum: VAT, SalesTax, GST).
- Effective From, Effective To (dates).

**Tax Calculation Logic:**

1. Operator creates invoice.

2. Backend determines Site Owner's country and business status.

3. If EU B2B and VAT IDs valid: Apply 0% VAT with reverse charge note.

4. If EU B2C: Apply Site Owner's country VAT rate.

5. If non-EU: Apply Operator's country rate or 0% depending on registration.

6. Store applied tax rate and amount in Invoice.

**Integration (Recommended):**
- Use Stripe Tax for automatic calculation and compliance.
- Alternative: Manual tax rate table updated quarterly.

**Rationale for Stripe Tax:**
- Handles complex multi-jurisdiction logic.
- Stays updated with rate changes.
- Generates compliant tax reports.
- Reduces engineering and compliance burden.

**Alternative:**
- Manual management: Lower cost but higher compliance risk and maintenance.

**Invoice Display:**
- Line item subtotal.
- Tax line with rate and jurisdiction (e.g., "VAT 19% (Germany)").
- Total amount.

**Compliance:**
- Store VAT ID validation results for audit.
- Generate tax reports per jurisdiction (quarterly, annual).
- Superadmin export for tax filing.

**API Contracts:**
- POST /api/v1/tax/calculate (calculate tax for given amounts and locations).
- POST /api/v1/tax/validate-vat (validate VAT number via VIES).

#### Feature 2.2.7: Invoice and Payment Dashboards

**Description:** Dedicated UI for Operators to manage invoices and track payments; Site Owners to view and pay invoices.

**Operator Invoice Dashboard:**

**Components:**
- Invoice list table (columns: Number, Client, Project, Issue Date, Due Date, Status, Amount, Actions).
- Status filters (All, Draft, Sent, Paid, Overdue).
- Date range picker.
- Search by client name or invoice number.
- Quick actions: Send, View PDF, Cancel.
- Create Invoice button (opens modal or form page).

**Metrics Panel:**
- Total Outstanding (sum of Sent + Overdue invoices).
- Total Paid This Month.
- Average Time to Payment.
- Overdue Count.

**Site Owner Invoice Dashboard:**

**Components:**
- Invoice list (columns: Number, Operator, Project, Issue Date, Due Date, Amount, Status, Actions).
- Pay Now button (opens Stripe payment modal).
- Download PDF link.
- Payment history (invoices paid, receipts).

**Payout Dashboard (Operator):**

**Components:**
- Payout list table (columns: Date, Invoice, Gross, Fees, Net, Status).
- Total Earnings (lifetime, this month, this year).
- Connected Account Status (indicator: Connected, Pending, Not Setup).
- Setup Payouts button (if not connected).
- Export to CSV.

**Performance:**
- Paginate invoice lists (50 per page).
- Use database indexes on Status, Due Date, Operator ID.
- Cache metrics for 5 minutes.

**API Contracts:**
- GET /api/v1/invoices/dashboard (returns summary metrics).
- GET /api/v1/payouts/dashboard (returns payout metrics).

### 2.3 Post-MVP Features (Phase 3)

#### Feature 2.3.1: Layered Overlay Comparison (Premium)

**Description:** Overlay multiple images from the same angle with adjustable transparency to see subtle changes.

**UI Requirements:**
- Slider to adjust opacity of top layer (0-100%).
- Layer order control (drag to reorder stack).
- Toggle individual layers on/off.
- Alignment tools (manual nudge with arrow keys, auto-align using feature detection).
- Export layered view as single composite image.

**Technical:**
- Canvas API for rendering overlays in browser.
- Optional: Backend image registration using OpenCV for auto-alignment (computationally expensive, queue as background job).

**Access Control:**
- Available only to Professional tier and above.
- Watermark images for Free tier if feature is accessed via trial.

#### Feature 2.3.2: Video Upload and Playback (Premium)

**Description:** Upload and play video walkthroughs of construction sites.

**Requirements:**
- Support MP4, MOV formats.
- Maximum file size: 500 MB (Business tier), 2 GB (Enterprise tier).
- Transcode to multiple resolutions (1080p, 720p, 480p) for adaptive streaming.
- Generate video thumbnail at 5-second mark.
- HLS or DASH streaming for browser playback.

**Processing Pipeline:**
1. Upload to S3 (same flow as images).
2. Enqueue transcoding job (use AWS MediaConvert, Mux, or Coconut).
3. Store transcoded variants in S3.
4. Update Capture status to Ready when all variants complete.

**Quotas:**
- Business tier: 100 GB video storage.
- Enterprise tier: Unlimited.

**API Contracts:**
- Same as image upload but with file_type=Video.
- GET /api/v1/captures/:id/playback-url (returns HLS manifest URL).

#### Feature 2.3.3: Photogrammetry Processing (Enterprise)

**Description:** Upload sets of images to generate 3D models of construction sites.

**Requirements:**
- User uploads ZIP file containing 50-200 images captured in overlapping pattern.
- Backend extracts ZIP, validates images, enqueues photogrammetry job.
- Processing uses external service (Pix4D, Agisoft Metashape, OpenDroneMap).
- Output: 3D mesh (OBJ, PLY), orthomosaic (GeoTIFF), point cloud (LAS).
- Web viewer for 3D model (Potree, Cesium, or Three.js).

**Processing Time:**
- Estimated 1-4 hours depending on image count and resolution.
- User receives email when processing completes.

**Quotas:**
- Enterprise tier only.
- Maximum 5 photogrammetry jobs per month.

**API Contracts:**
- POST /api/v1/captures/photogrammetry (upload ZIP and initiate).
- GET /api/v1/captures/:id/model (retrieve 3D model viewer URL).

**Cost Model:**
- Charge per-job fee or include in Enterprise flat rate.
- Compute cost estimated at 5-10 USD per job.

#### Feature 2.3.4: Automated Milestone Billing

**Description:** Automatically generate invoices when predefined project milestones are reached.

**Requirements:**
- Operator defines milestones for Project (e.g., "Foundation Complete", "Framing Done").
- Each milestone has associated amount and capture count threshold.
- When threshold reached (e.g., 20 images uploaded for Foundation), invoice auto-generated as Draft.
- Operator reviews and sends manually, or configures auto-send.

**Milestone Entity Fields:**
- Milestone ID (UUID).
- Project ID (foreign key).
- Name (string).
- Description (text).
- Trigger Type (enum: CaptureCount, DateReached, ManualMark).
- Trigger Value (integer or date).
- Invoice Amount (decimal).
- Status (enum: Pending, Triggered, Invoiced).

**Use Case:**
- Pre-agreed payment schedule between Operator and Site Owner.
- Reduces manual invoicing overhead.

**API Contracts:**
- POST /api/v1/projects/:id/milestones (create milestone).
- GET /api/v1/milestones (list).
- PATCH /api/v1/milestones/:id/trigger (manually mark as complete).

#### Feature 2.3.5: Accounting Integrations

**Description:** Sync invoices and payments with external accounting software.

**Supported Platforms:**
- QuickBooks Online.
- Xero.
- FreshBooks.

**Integration:**
- OAuth2 connection to accounting platform.
- Sync invoices created in platform to accounting software as sales invoices.
- Sync payments as received payments.
- Two-way sync: Invoices created in accounting software can sync back (optional).

**Data Mapping:**
- Platform Invoice → Accounting Sales Invoice.
- Platform Payment → Accounting Payment Received.
- Line Items map to accounting line items with tax codes.

**API Contracts:**
- POST /api/v1/integrations/accounting/connect (initiate OAuth).
- GET /api/v1/integrations/accounting/status (check sync status).
- POST /api/v1/integrations/accounting/sync (manual sync trigger).

**Sync Frequency:**
- Real-time via webhooks (preferred).
- Fallback: Hourly batch sync.

**Error Handling:**
- Log sync failures with detailed error messages.
- Retry failed syncs up to 3 times.
- Notify Operator if manual intervention required.

---

## 3. Data Model

### 3.1 Core Entities

**User**
- user_id (UUID, PK).
- email (string, unique, indexed).
- password_hash (string).
- first_name, last_name (string).
- role (enum: OperatorAdmin, OperatorMember, SiteOwner, Viewer, Support, Superadmin).
- organization_id (UUID, FK to Organization).
- mfa_enabled (boolean).
- mfa_secret (string, encrypted, nullable).
- email_verified (boolean).
- created_at, updated_at (timestamp).

**Organization**
- organization_id (UUID, PK).
- name (string).
- type (enum: Operator, SiteOwner).
- country_code (string, ISO 3166-1).
- vat_id (string, nullable).
- stripe_customer_id (string, nullable, for subscription billing).
- stripe_connected_account_id (string, nullable, for payouts to Operators).
- created_at, updated_at (timestamp).

**OperatorSubscription**
- subscription_id (UUID, PK).
- organization_id (UUID, FK to Organization, unique).
- tier (enum: Free, Professional, Business, Enterprise).
- status (enum: Active, PastDue, Cancelled, Trialing).
- stripe_subscription_id (string, nullable).
- current_period_start, current_period_end (timestamp).
- cancel_at_period_end (boolean).
- created_at, updated_at (timestamp).

**Project**
- project_id (UUID, PK).
- operator_org_id (UUID, FK to Organization, indexed).
- site_owner_org_id (UUID, FK to Organization, indexed).
- name (string).
- description (text, nullable).
- status (enum: Active, Paused, Completed, Archived).
- retention_days (integer).
- thumbnail_capture_id (UUID, FK to Capture, nullable).
- created_at, updated_at (timestamp).

**Site**
- site_id (UUID, PK).
- project_id (UUID, FK to Project, indexed).
- name (string).
- address (text, nullable).
- latitude, longitude (decimal, nullable).
- description (text, nullable).
- created_at, updated_at (timestamp).

**Angle**
- angle_id (UUID, PK).
- site_id (UUID, FK to Site, indexed).
- name (string).
- description (text, nullable).
- reference_capture_id (UUID, FK to Capture, nullable).
- sort_order (integer).
- created_at, updated_at (timestamp).

**Capture**
- capture_id (UUID, PK).
- site_id (UUID, FK to Site, indexed).
- angle_id (UUID, FK to Angle, indexed).
- uploaded_by_user_id (UUID, FK to User).
- capture_date (date, indexed).
- file_path (string).
- thumbnail_path (string, nullable).
- file_size (bigint, bytes).
- image_width, image_height (integer, nullable).
- latitude, longitude (decimal, nullable).
- weather (enum, nullable).
- notes (text, nullable).
- file_type (enum: Image, Video, Photogrammetry).
- processing_status (enum: Uploaded, Processing, Ready, Failed).
- created_at, updated_at (timestamp).

**ProjectMember**
- project_member_id (UUID, PK).
- project_id (UUID, FK to Project, indexed).
- user_id (UUID, FK to User, indexed).
- role (enum: Admin, Member, Viewer).
- invited_by_user_id (UUID, FK to User).
- invited_at, accepted_at (timestamp).

**Invoice**
- invoice_id (UUID, PK).
- invoice_number (string, unique, indexed).
- operator_org_id (UUID, FK to Organization, indexed).
- site_owner_org_id (UUID, FK to Organization, indexed).
- project_id (UUID, FK to Project, nullable, indexed).
- status (enum: Draft, Sent, Viewed, Paid, Overdue, Cancelled, Refunded, indexed).
- issue_date (date, indexed).
- due_date (date, indexed).
- subtotal (decimal(12,2)).
- tax_rate (decimal(5,2)).
- tax_amount (decimal(12,2)).
- total_amount (decimal(12,2)).
- currency (string, ISO 4217).
- notes (text, nullable).
- payment_terms (text, nullable).
- stripe_payment_intent_id (string, nullable, indexed).
- paid_at (timestamp, nullable).
- created_at, updated_at (timestamp).

**InvoiceLineItem**
- line_item_id (UUID, PK).
- invoice_id (UUID, FK to Invoice, indexed).
- description (string).
- quantity (decimal(10,2)).
- unit_price (decimal(12,2)).
- amount (decimal(12,2)).
- sort_order (integer).

**Payment**
- payment_id (UUID, PK).
- invoice_id (UUID, FK to Invoice, indexed).
- site_owner_user_id (UUID, FK to User).
- amount (decimal(12,2)).
- currency (string).
- payment_method (enum: Card, SEPA, BankTransfer).
- stripe_payment_intent_id (string, indexed).
- stripe_charge_id (string, nullable, indexed).
- status (enum: Pending, Succeeded, Failed, Refunded).
- paid_at (timestamp, nullable).
- failure_reason (text, nullable).
- created_at, updated_at (timestamp).

**Fee**
- fee_id (UUID, PK).
- payment_id (UUID, FK to Payment, indexed).
- fee_type (enum: PlatformPercentage, PlatformFixed, StripeProcessing).
- amount (decimal(12,2)).
- currency (string).
- calculated_at (timestamp).

**Payout**
- payout_id (UUID, PK).
- operator_org_id (UUID, FK to Organization, indexed).
- payment_id (UUID, FK to Payment, indexed).
- gross_amount (decimal(12,2)).
- fee_amount (decimal(12,2)).
- net_amount (decimal(12,2)).
- currency (string).
- stripe_transfer_id (string, nullable, indexed).
- stripe_connected_account_id (string, indexed).
- status (enum: Pending, InTransit, Paid, Failed, indexed).
- scheduled_at (timestamp).
- paid_at (timestamp, nullable).
- failure_reason (text, nullable).
- created_at, updated_at (timestamp).

**TaxRate**
- tax_rate_id (UUID, PK).
- country_code (string, indexed).
- region (string, nullable, indexed).
- rate (decimal(5,2)).
- type (enum: VAT, SalesTax, GST).
- effective_from, effective_to (date).

**Notification**
- notification_id (UUID, PK).
- recipient_user_id (UUID, FK to User, indexed).
- type (enum: InvoiceSent, PaymentConfirmation, OverdueReminder, PayoutConfirmation, PayoutFailed).
- subject (string).
- body (text).
- sent_at (timestamp).
- status (enum: Pending, Sent, Failed, Bounced).

### 3.2 Indexes

**Critical indexes for performance:**
- Capture: (site_id, capture_date DESC).
- Capture: (angle_id, capture_date DESC).
- Invoice: (operator_org_id, status, issue_date DESC).
- Invoice: (site_owner_org_id, status, due_date).
- Payment: (invoice_id).
- Payout: (operator_org_id, status, scheduled_at DESC).
- Project: (operator_org_id, status).
- ProjectMember: (user_id, project_id).

### 3.3 Constraints

- Invoice.total_amount = Invoice.subtotal + Invoice.tax_amount (application-level check).
- Invoice.due_date > Invoice.issue_date (database check constraint).
- Payment.amount = Invoice.total_amount (application-level validation).
- Payout.net_amount = Payout.gross_amount - Payout.fee_amount (application-level check).
- InvoiceLineItem.amount = InvoiceLineItem.quantity * InvoiceLineItem.unit_price (application-level check).

---

## 4. API Contracts

### 4.1 REST API Design Principles

- **Versioning:** All endpoints prefixed with /api/v1.
- **Authentication:** Bearer token in Authorization header.
- **Content-Type:** application/json for requests and responses.
- **Error Format:** Consistent JSON structure.
- **Pagination:** Cursor-based for large datasets, offset-based for simple lists.
- **Filtering:** Query parameters (e.g., ?status=Sent&date_from=2025-01-01).
- **Rate Limiting:** 100 requests/minute per user, 1000 requests/minute per organization.

### 4.2 Authentication Endpoints

**POST /api/v1/auth/register**
- Request: { email, password, first_name, last_name, organization_name, organization_type }.
- Response: { user_id, email, organization_id, message: "Verification email sent" }.
- Status: 201 Created.

**POST /api/v1/auth/login**
- Request: { email, password, mfa_code (optional) }.
- Response: { access_token, refresh_token, expires_in }.
- Status: 200 OK.

**POST /api/v1/auth/refresh**
- Request: { refresh_token }.
- Response: { access_token, expires_in }.
- Status: 200 OK.

**POST /api/v1/auth/logout**
- Request: { refresh_token }.
- Response: { message: "Logged out successfully" }.
- Status: 200 OK.

**POST /api/v1/auth/password-reset**
- Request: { email }.
- Response: { message: "Password reset email sent" }.
- Status: 200 OK.

**POST /api/v1/auth/password-reset/confirm**
- Request: { token, new_password }.
- Response: { message: "Password reset successful" }.
- Status: 200 OK.

### 4.3 Project and Site Endpoints

**POST /api/v1/projects**
- Request: { name, description, site_owner_org_id, retention_days }.
- Response: { project_id, name, status, created_at }.
- Status: 201 Created.

**GET /api/v1/projects**
- Query Params: ?status=Active&limit=50&offset=0.
- Response: { projects: [ { project_id, name, site_owner_org_id, status, created_at } ], total, limit, offset }.
- Status: 200 OK.

**GET /api/v1/projects/:id**
- Response: { project_id, name, description, operator_org_id, site_owner_org_id, status, retention_days, sites: [ { site_id, name } ], created_at, updated_at }.
- Status: 200 OK.

**PATCH /api/v1/projects/:id**
- Request: { name, description, status }.
- Response: { project_id, name, status, updated_at }.
- Status: 200 OK.

**DELETE /api/v1/projects/:id**
- Response: { message: "Project archived" }.
- Status: 200 OK.

**POST /api/v1/projects/:id/sites**
- Request: { name, address, latitude, longitude, description }.
- Response: { site_id, project_id, name, created_at }.
- Status: 201 Created.

**GET /api/v1/sites/:id**
- Response: { site_id, project_id, name, address, latitude, longitude, angles: [ { angle_id, name } ], created_at }.
- Status: 200 OK.

**PATCH /api/v1/sites/:id**
- Request: { name, address, latitude, longitude, description }.
- Response: { site_id, name, updated_at }.
- Status: 200 OK.

**DELETE /api/v1/sites/:id**
- Response: { message: "Site deleted" }.
- Status: 200 OK.

### 4.4 Capture Endpoints

**POST /api/v1/captures/upload-url**
- Request: { site_id, angle_id, file_name, file_type, file_size }.
- Response: { upload_url, capture_id, expires_in }.
- Status: 200 OK.

**POST /api/v1/captures/complete**
- Request: { capture_id, s3_key, capture_date, latitude, longitude, weather, notes }.
- Response: { capture_id, processing_status, thumbnail_url (when ready) }.
- Status: 201 Created.

**GET /api/v1/captures**
- Query Params: ?site_id=:id&angle_id=:id&date_from=YYYY-MM-DD&date_to=YYYY-MM-DD&limit=50&offset=0.
- Response: { captures: [ { capture_id, site_id, angle_id, capture_date, thumbnail_url, file_type } ], total, limit, offset }.
- Status: 200 OK.

**GET /api/v1/captures/:id**
- Response: { capture_id, site_id, angle_id, capture_date, file_url, thumbnail_url, file_size, image_width, image_height, latitude, longitude, weather, notes, uploaded_by_user_id, created_at }.
- Status: 200 OK.

**DELETE /api/v1/captures/:id**
- Response: { message: "Capture deleted" }.
- Status: 200 OK.

**GET /api/v1/captures/compare**
- Query Params: ?ids=uuid1,uuid2,uuid3,uuid4.
- Response: { captures: [ { capture_id, site_id, angle_id, capture_date, file_url, thumbnail_url } ] }.
- Status: 200 OK.

### 4.5 Invoice Endpoints

**POST /api/v1/invoices**
- Request: { site_owner_org_id, project_id, issue_date, due_date, currency, notes, payment_terms, line_items: [ { description, quantity, unit_price } ] }.
- Response: { invoice_id, invoice_number, status: "Draft", subtotal, tax_amount, total_amount, created_at }.
- Status: 201 Created.

**GET /api/v1/invoices**
- Query Params: ?status=Sent&project_id=:id&date_from=YYYY-MM-DD&limit=50&offset=0.
- Response: { invoices: [ { invoice_id, invoice_number, site_owner_org_id, project_id, status, issue_date, due_date, total_amount, currency } ], total, limit, offset }.
- Status: 200 OK.

**GET /api/v1/invoices/:id**
- Response: { invoice_id, invoice_number, operator_org_id, site_owner_org_id, project_id, status, issue_date, due_date, subtotal, tax_rate, tax_amount, total_amount, currency, notes, payment_terms, line_items: [ { line_item_id, description, quantity, unit_price, amount } ], created_at, updated_at, paid_at }.
- Status: 200 OK.

**PATCH /api/v1/invoices/:id**
- Request: { notes, payment_terms, line_items }.
- Constraints: Only Draft invoices can be edited.
- Response: { invoice_id, status, updated_at }.
- Status: 200 OK.

**POST /api/v1/invoices/:id/send**
- Response: { invoice_id, status: "Sent", sent_at }.
- Status: 200 OK.

**POST /api/v1/invoices/:id/cancel**
- Response: { invoice_id, status: "Cancelled", updated_at }.
- Status: 200 OK.

**DELETE /api/v1/invoices/:id**
- Constraints: Only Draft invoices can be deleted.
- Response: { message: "Invoice deleted" }.
- Status: 200 OK.

**GET /api/v1/invoices/:id/pdf**
- Response: Binary PDF file.
- Headers: Content-Type: application/pdf, Content-Disposition: attachment; filename="invoice-{number}.pdf".
- Status: 200 OK.

### 4.6 Payment Endpoints

**POST /api/v1/invoices/:id/payment-intent**
- Request: { payment_method_types: ["card", "sepa_debit"] }.
- Response: { client_secret, payment_intent_id, amount, currency }.
- Status: 200 OK.

**GET /api/v1/payments/:id**
- Response: { payment_id, invoice_id, amount, currency, payment_method, status, paid_at, failure_reason }.
- Status: 200 OK.

**POST /api/v1/payments/:id/refund**
- Request: { amount (optional, defaults to full refund), reason }.
- Constraints: Superadmin only.
- Response: { payment_id, refund_id, refunded_amount, status: "Refunded" }.
- Status: 200 OK.

### 4.7 Payout Endpoints

**POST /api/v1/operators/connect-account**
- Response: { account_link_url, connected_account_id }.
- Status: 200 OK.

**GET /api/v1/operators/connect-account/status**
- Response: { connected_account_id, onboarding_complete, payouts_enabled }.
- Status: 200 OK.

**GET /api/v1/payouts**
- Query Params: ?status=Paid&date_from=YYYY-MM-DD&limit=50&offset=0.
- Response: { payouts: [ { payout_id, payment_id, invoice_id, gross_amount, fee_amount, net_amount, currency, status, scheduled_at, paid_at } ], total, limit, offset }.
- Status: 200 OK.

**GET /api/v1/payouts/:id**
- Response: { payout_id, operator_org_id, payment_id, gross_amount, fee_amount, net_amount, currency, stripe_transfer_id, status, scheduled_at, paid_at, failure_reason, created_at }.
- Status: 200 OK.

### 4.8 Subscription Endpoints

**GET /api/v1/subscriptions/current**
- Response: { subscription_id, tier, status, current_period_start, current_period_end, cancel_at_period_end }.
- Status: 200 OK.

**POST /api/v1/subscriptions/checkout**
- Request: { tier: "Professional" }.
- Response: { checkout_url }.
- Status: 200 OK.

**POST /api/v1/subscriptions/portal**
- Response: { portal_url }.
- Status: 200 OK.

### 4.9 Dashboard Endpoints

**GET /api/v1/invoices/dashboard**
- Response: { total_outstanding, total_paid_this_month, avg_time_to_payment_days, overdue_count }.
- Status: 200 OK.

**GET /api/v1/payouts/dashboard**
- Response: { total_lifetime_earnings, total_this_month, total_this_year, pending_payout_amount, connected_account_status }.
- Status: 200 OK.

### 4.10 Webhook Endpoints

**POST /webhooks/stripe/subscriptions**
- Receives: subscription.created, subscription.updated, subscription.deleted, invoice.paid, invoice.payment_failed.
- Validates: Stripe signature.
- Response: { received: true }.
- Status: 200 OK.

**POST /webhooks/stripe/payments**
- Receives: payment_intent.succeeded, payment_intent.payment_failed, charge.refunded.
- Validates: Stripe signature.
- Response: { received: true }.
- Status: 200 OK.

**POST /webhooks/stripe/connect**
- Receives: account.updated, transfer.paid, transfer.failed.
- Validates: Stripe signature.
- Response: { received: true }.
- Status: 200 OK.

### 4.11 Error Response Format

```
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invoice cannot be edited after it has been sent",
    "details": {
      "field": "status",
      "current_value": "Sent",
      "allowed_values": ["Draft"]
    },
    "request_id": "req_abc123"
  }
}
```

**Standard Error Codes:**
- VALIDATION_ERROR (400).
- AUTHENTICATION_REQUIRED (401).
- PERMISSION_DENIED (403).
- RESOURCE_NOT_FOUND (404).
- RATE_LIMIT_EXCEEDED (429).
- INTERNAL_SERVER_ERROR (500).
- SERVICE_UNAVAILABLE (503).

---

## 5. Architecture

### 5.1 Technology Stack Recommendations

**Frontend:**
- Framework: React with TypeScript (recommended).
- Alternative: Vue.js (simpler learning curve but smaller ecosystem).
- Rationale for React: Mature ecosystem, excellent TypeScript support, strong community, extensive component libraries.
- State Management: Zustand (lightweight) or Redux Toolkit (complex apps).
- UI Library: Tailwind CSS + Headless UI or Material-UI.
- Routing: React Router v6.
- HTTP Client: Axios or Fetch API.
- Image Lightbox: react-image-lightbox or PhotoSwipe.
- Payment UI: Stripe Elements (@stripe/react-stripe-js).

**Backend:**
- Framework: Node.js with Express (recommended) or NestJS (enterprise).
- Alternative: Django (Python) for teams with Python expertise.
- Rationale for Node.js: Unified language with frontend, excellent async I/O for file uploads, mature Stripe SDK.
- Database: PostgreSQL 14+ (recommended).
- Alternative: MySQL 8+ (less robust JSONB support).
- Rationale for PostgreSQL: ACID compliance, excellent performance, JSONB for flexible metadata, strong spatial support (PostGIS for GPS).
- ORM: Prisma (recommended) or TypeORM.
- Authentication: Passport.js with JWT strategy.
- File Upload: Multer for multipart handling, AWS SDK for S3.
- Job Queue: BullMQ with Redis (for background processing).
- Email: Postmark SDK or Nodemailer with SMTP.

**Infrastructure:**
- Hosting: AWS, Google Cloud Platform, or DigitalOcean.
- Application Servers: Containerized with Docker, orchestrated with Kubernetes or ECS.
- Storage: AWS S3, Cloudflare R2, or Backblaze B2.
- CDN: CloudFront, Cloudflare, or Fastly.
- Database: Managed PostgreSQL (AWS RDS, Google Cloud SQL, DigitalOcean Managed DB).
- Cache: Redis (for sessions, rate limiting, job queues).
- Monitoring: Datadog, New Relic, or Grafana + Prometheus.
- Logging: CloudWatch, Logtail, or ELK stack.
- Error Tracking: Sentry.

**Payments:**
- Provider: Stripe (recommended).
- Alternative: Paddle (for simplified VAT), PayPal (wider adoption in some regions).
- Rationale for Stripe: Best-in-class developer experience, Stripe Connect for marketplace payouts, excellent documentation, strong fraud prevention, tax automation (Stripe Tax), global coverage.

### 5.2 System Architecture

**Pattern:** Multi-tier architecture with microservices for payment and media processing.

**Tiers:**

1. **Presentation Tier (Frontend):**
   - React SPA served via CDN.
   - Communicates with backend via REST API over HTTPS.
   - Handles user interactions, form validation, state management.

2. **Application Tier (Backend API):**
   - Stateless Node.js servers behind load balancer.
   - Handles authentication, authorization, business logic, API endpoints.
   - Validates requests, queries database, enqueues jobs, triggers webhooks.

3. **Data Tier:**
   - PostgreSQL for relational data (users, projects, invoices, payments).
   - Redis for caching, session storage, rate limiting, job queues.
   - S3 for object storage (images, videos, PDFs).

4. **Processing Tier (Background Workers):**
   - Separate worker processes consume jobs from BullMQ.
   - Tasks: Thumbnail generation, video transcoding, PDF generation, email sending, payout processing.
   - Scalable: Add more workers to handle load spikes.

5. **Integration Tier (External Services):**
   - Stripe: Payments, subscriptions, Connect, Tax.
   - Email: Postmark or SendGrid.
   - Optionally: Photogrammetry service (Pix4D API), Accounting (QuickBooks, Xero).

**Diagram (Text Representation):**

```
[User Browser] <--> [CDN (Frontend SPA)] <--> [Load Balancer] <--> [API Server Pool]
                                                                          |
                                                                          v
                                                    [PostgreSQL] <--> [Redis]
                                                          |
                                                          v
                                                    [S3 Storage]
                                                          ^
                                                          |
                                                  [Background Workers]
                                                          |
                                                          v
                                              [External Services: Stripe, Email, etc.]
```

### 5.3 Data Flow Examples

**Image Upload Flow:**
1. User selects image in frontend, clicks Upload.
2. Frontend calls POST /api/v1/captures/upload-url with metadata.
3. Backend validates user quota, generates pre-signed S3 URL, returns to frontend.
4. Frontend uploads file directly to S3 using pre-signed URL.
5. On success, frontend calls POST /api/v1/captures/complete with S3 key.
6. Backend creates Capture record, enqueues thumbnail generation job.
7. Worker processes job: downloads image, generates thumbnail, uploads to S3, updates Capture status.
8. Frontend polls GET /api/v1/captures/:id until status is Ready.

**Invoice Payment Flow:**
1. Site Owner clicks Pay Invoice.
2. Frontend calls POST /api/v1/invoices/:id/payment-intent.
3. Backend creates Stripe Payment Intent, returns client_secret.
4. Frontend displays Stripe Elements payment form.
5. Site Owner enters payment details, submits.
6. Stripe processes payment asynchronously, sends webhook to POST /webhooks/stripe/payments.
7. Backend verifies webhook, updates Invoice status to Paid, creates Payment record.
8. Backend enqueues payout job.
9. Worker processes payout: creates Stripe Transfer to Operator's Connected Account, creates Payout record.
10. Backend sends payment confirmation emails to Site Owner and Operator.

### 5.4 Security Architecture

**Authentication:**
- JWT access tokens (15-minute expiry, stored in memory).
- Refresh tokens (7-day expiry, stored in HttpOnly, Secure, SameSite cookies).
- Tokens signed with RS256 using private key (stored in environment variable or secrets manager).
- MFA via TOTP (Time-based One-Time Password, RFC 6238).

**Authorization:**
- Role-based access control (RBAC) enforced in middleware.
- Check user role and organization membership before processing requests.
- Project-level permissions checked via ProjectMember table.

**Data Protection:**
- All data in transit encrypted with TLS 1.3.
- Database encrypted at rest (provider-managed encryption).
- S3 buckets private, access via pre-signed URLs only.
- Sensitive fields (passwords, MFA secrets) encrypted before storage.

**Payment Security:**
- PCI-DSS compliance via Stripe (platform never handles raw card data).
- Stripe webhooks verified using signing secret.
- Payment Intent idempotency keys prevent duplicate charges.

**Input Validation:**
- All API inputs validated using schema validation (e.g., Joi, Zod).
- SQL injection prevention via parameterized queries (ORM handles this).
- XSS prevention: Sanitize user-generated content before display, use Content Security Policy headers.
- CSRF protection: SameSite cookies, CSRF tokens for state-changing operations.

**Rate Limiting:**
- API: 100 requests/minute per user, 1000 requests/minute per organization.
- Authentication: 5 failed login attempts per email per hour.
- File uploads: Maximum 10 concurrent uploads per user.

**Audit Logging:**
- Log all authentication events (login, logout, password reset).
- Log all financial transactions (invoice creation, payment, payout).
- Log all data mutations (create, update, delete).
- Store logs in append-only table with user ID, IP address, timestamp, action, resource ID.

### 5.5 Scalability Considerations

**Horizontal Scaling:**
- API servers stateless, scale horizontally by adding instances.
- Background workers scale independently based on queue depth.
- Database: Use read replicas for read-heavy queries (timeline, dashboard).

**Vertical Scaling:**
- Database: Increase instance size if query performance degrades.
- Redis: Increase memory for larger caches.

**Storage Scaling:**
- S3: Unlimited capacity, pay-as-you-go.
- Implement lifecycle policies to archive old captures to Glacier.

**Performance Optimization:**
- Database indexes on frequently queried columns.
- Cache expensive queries (dashboard metrics) in Redis with 5-minute TTL.
- CDN caching for thumbnails and static assets (30-day TTL).
- Lazy load images on timeline (intersection observer).
- Paginate API responses (max 100 items per page).

**Cost Optimization:**
- Use cost-effective storage tier (Cloudflare R2, Backblaze B2) for long-term retention.
- Compress images on upload (lossless or high-quality lossy).
- Archive inactive Projects to reduce hot storage costs.

---

## 6. Testing Strategy

### 6.1 Unit Testing

**Scope:**
- Business logic functions (fee calculation, tax calculation, quota enforcement).
- Utility functions (date formatting, validation helpers).
- Database models and ORM queries.

**Tools:**
- Jest (JavaScript/TypeScript).
- pytest (Python if using Django).

**Coverage Target:**
- Minimum 80% code coverage for core business logic.

**Example Test Cases:**
- Fee calculation: Given invoice total, verify platform fee and net payout amounts.
- Quota enforcement: Given user upload count, verify rejection when quota exceeded.
- Tax calculation: Given operator and client locations, verify correct VAT rate applied.

### 6.2 Integration Testing

**Scope:**
- API endpoints with database interactions.
- Authentication and authorization flows.
- Payment processing with Stripe test mode.
- Email sending (mock email service).

**Tools:**
- Supertest (Node.js API testing).
- Postman/Newman (automated API tests).

**Test Cases:**
- POST /api/v1/invoices creates invoice and line items in database.
- POST /api/v1/invoices/:id/send transitions status and sends email.
- POST /api/v1/invoices/:id/payment-intent creates Stripe Payment Intent and returns client_secret.
- Webhook processing: Mock Stripe webhook, verify invoice status updated.

### 6.3 End-to-End Testing

**Scope:**
- Complete user workflows from frontend to backend.
- Multi-step processes (signup → create project → upload image → generate invoice → pay invoice).

**Tools:**
- Playwright or Cypress (browser automation).

**Test Scenarios:**
- Operator signup: Register account, verify email, create first project, upload image.
- Invoice lifecycle: Create invoice, send to client, client pays, verify payout created.
- Subscription upgrade: Free tier operator upgrades to Professional, verify quota increased.

### 6.4 Performance Testing

**Scope:**
- API response times under load.
- Database query performance.
- File upload throughput.

**Tools:**
- k6 or Artillery (load testing).
- PostgreSQL EXPLAIN ANALYZE (query profiling).

**Benchmarks:**
- API response time: p95 < 200ms for read endpoints, p95 < 500ms for write endpoints.
- Timeline query: Return 50 captures in < 100ms.
- Image upload: Support 100 concurrent uploads without degradation.

### 6.5 Security Testing

**Scope:**
- Authentication bypass attempts.
- Authorization escalation (Operator Member accessing Admin functions).
- SQL injection, XSS, CSRF vulnerabilities.
- Payment webhook tampering.

**Tools:**
- OWASP ZAP (automated vulnerability scanning).
- Manual penetration testing.

**Test Cases:**
- Attempt to access another organization's projects without authorization (expect 403).
- Attempt to modify invoice after it's Sent (expect 400).
- Send webhook with invalid signature (expect 400 or 401).
- Attempt SQL injection in search parameters (expect safe parameterized queries).

---

## 7. Deployment

### 7.1 Environments

**Development:**
- Local developer machines.
- Local PostgreSQL, Redis, MinIO (S3-compatible local storage).
- Stripe test mode.

**Staging:**
- Cloud-hosted environment mirroring production.
- Separate database, S3 bucket, Stripe test mode.
- Used for QA, client demos, integration testing.

**Production:**
- Cloud-hosted environment with high availability.
- Multi-region deployment (optional for MVP, recommended for scale).
- Stripe live mode.

### 7.2 CI/CD Pipeline

**Pipeline Stages:**

1. **Lint:** ESLint (frontend), ESLint (backend), Prettier.
2. **Unit Tests:** Run Jest tests, enforce 80% coverage.
3. **Integration Tests:** Run API tests against ephemeral test database.
4. **Build:** Compile frontend (Vite or Webpack), build backend Docker image.
5. **Deploy to Staging:** Push Docker images to registry, deploy to staging environment.
6. **E2E Tests:** Run Playwright tests against staging.
7. **Deploy to Production:** Manual approval gate, then deploy to production.

**Tools:**
- GitHub Actions, GitLab CI, or CircleCI.

**Deployment Strategy:**
- Blue-Green deployment (zero downtime).
- Database migrations applied before deploying new application version.
- Rollback plan: Revert to previous Docker image tag.

### 7.3 Infrastructure as Code

**Tools:**
- Terraform (multi-cloud support, recommended).
- AWS CloudFormation (AWS-specific).

**Resources to Define:**
- VPC, subnets, security groups.
- ECS or Kubernetes cluster.
- RDS PostgreSQL instance.
- ElastiCache Redis.
- S3 buckets with lifecycle policies.
- CloudFront CDN distribution.
- Application Load Balancer.

**Benefits:**
- Reproducible environments.
- Version-controlled infrastructure.
- Disaster recovery: Rebuild environment from code.

### 7.4 Secrets Management

**Sensitive Data:**
- Database credentials.
- Stripe API keys (secret, publishable, webhook signing secrets).
- JWT signing private key.
- S3 access keys.
- Email service API keys.

**Storage:**
- AWS Secrets Manager or Parameter Store (recommended).
- Environment variables injected at runtime (for containers).
- Never commit secrets to version control.

**Access Control:**
- IAM roles with least-privilege permissions.
- Rotate secrets quarterly or after team member departures.

### 7.5 Monitoring and Observability

**Metrics:**
- Application: Request rate, error rate, response time (p50, p95, p99).
- System: CPU, memory, disk I/O, network throughput.
- Business: Invoices created, payments processed, payouts completed, failed transactions.

**Logging:**
- Structured JSON logs.
- Centralized logging (CloudWatch, Logtail, ELK).
- Log levels: DEBUG (dev), INFO (staging), WARN/ERROR (production).

**Alerting:**
- High error rate (> 5% of requests).
- Payment processing failure.
- Payout failure.
- Database connection pool exhausted.
- Disk usage > 80%.

**Tools:**
- Datadog, New Relic, or Grafana + Prometheus.
- Sentry for error tracking and stack traces.
- Uptime monitoring: Pingdom, UptimeRobot.

**Dashboards:**
- System health: API response times, error rates, server metrics.
- Financial: Daily revenue (invoices paid), payout volume, fee revenue.
- User activity: Signups, active projects, uploads per day.

---

## 8. GDPR and Data Privacy

### 8.1 Data Protection Requirements

**Lawful Basis:**
- Contractual necessity (processing data to provide service).
- Consent (optional features like marketing emails).

**User Rights:**
- Right to access: Users can request copy of their data (export API).
- Right to rectification: Users can update their profile, project data.
- Right to erasure: Users can request account deletion (anonymize or hard delete).
- Right to portability: Users can export Projects, Images, Invoices as JSON or CSV.
- Right to object: Users can opt out of non-essential emails.

**Data Retention:**
- Active accounts: Retain indefinitely while account active.
- Deleted accounts: Retain financial records (invoices, payments) for 7 years (legal requirement), anonymize personal data.
- Archived Projects: Retain per tier retention policy, then delete or move to cold storage.

**Consent Management:**
- Cookie consent banner for non-essential cookies (analytics, marketing).
- Explicit opt-in for marketing emails.
- Granular consent settings in user profile.

### 8.2 Data Processing Agreements

**Third-Party Processors:**
- Stripe (payment processing).
- Email service (transactional emails).
- Cloud provider (hosting, storage).

**Requirements:**
- Ensure all processors have GDPR-compliant Data Processing Agreements (DPAs).
- Verify processors use EU data centers or have Standard Contractual Clauses for transfers.

### 8.3 Security Measures

**Encryption:**
- Data in transit: TLS 1.3.
- Data at rest: AES-256 (database, S3).

**Access Control:**
- Role-based access.
- MFA for Operator Admins and Superadmins.
- Audit logs for data access.

**Breach Notification:**
- Detect breaches within 24 hours (monitoring, alerting).
- Notify supervisory authority within 72 hours.
- Notify affected users without undue delay.

### 8.4 Privacy Policy and Terms

**Privacy Policy:**
- What data is collected (email, name, project data, payment info).
- How data is used (provide service, process payments).
- Who data is shared with (Stripe, email service).
- User rights and how to exercise them.
- Data retention periods.

**Terms of Service:**
- User responsibilities (accurate information, acceptable use).
- Platform responsibilities (uptime SLA, support).
- Payment terms (fees, refunds).
- Liability limitations.
- Termination conditions.

**Acceptance:**
- Checkbox during signup (required).
- Version tracking: Log which version user accepted.

---

## 9. Performance Benchmarks

### 9.1 Response Time Targets

- Homepage load: < 1.5s (First Contentful Paint).
- API GET requests: p95 < 200ms.
- API POST requests: p95 < 500ms.
- Image upload (10 MB): < 30s total (including pre-signed URL generation and S3 upload).
- Timeline query (50 captures): < 100ms.
- Invoice PDF generation: < 3s.

### 9.2 Throughput Targets

- Concurrent users: 1000 (MVP), 10,000 (scale target).
- API requests: 10,000 requests/minute (MVP), 100,000 requests/minute (scale).
- Image uploads: 100 concurrent uploads.
- Payment processing: 1000 payments/hour.

### 9.3 Database Performance

- Query execution time: p95 < 50ms for indexed queries.
- Connection pool: 100 connections (adjust based on load).
- Replication lag: < 1 second for read replicas.

---

## 10. Quotas and Limits

### 10.1 Subscription Tier Quotas

**Free Tier:**
- Storage: 2 GB.
- Uploads/month: 100 images.
- Projects: 3.
- Sites per Project: 5.
- Retention: 30 days.
- API rate limit: 60 requests/minute.

**Professional Tier:**
- Storage: 50 GB.
- Uploads/month: 1000 images.
- Projects: Unlimited.
- Sites per Project: 20.
- Retention: 1 year.
- API rate limit: 120 requests/minute.

**Business Tier:**
- Storage: 500 GB.
- Uploads/month: Unlimited.
- Projects: Unlimited.
- Sites per Project: 50.
- Retention: 3 years.
- Videos: 100 GB.
- API rate limit: 300 requests/minute.

**Enterprise Tier:**
- Storage: Unlimited.
- Uploads: Unlimited.
- Projects, Sites: Unlimited.
- Retention: Lifetime.
- Videos: Unlimited.
- Photogrammetry: 10 jobs/month.
- API rate limit: 1000 requests/minute.

### 10.2 File Size Limits

- Image: 50 MB (MVP), 100 MB (Premium).
- Video: 500 MB (Business), 2 GB (Enterprise).
- Photogrammetry ZIP: 2 GB (Enterprise).

### 10.3 Operational Limits

- Invoices per Operator: Unlimited.
- Line items per Invoice: 50.
- Payment methods per Site Owner: 5.
- Projects per Operator: Unlimited (but subject to tier quotas on active Projects).

---

===== END FILE: SPECIFICATIONS.md =====
