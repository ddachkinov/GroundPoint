===== BEGIN FILE: PLAN.md =====

# Project Plan — Drone Construction Progress SaaS Platform

## 1. Project Overview

This plan outlines the development roadmap for a multi-tenant SaaS platform serving drone operators who document construction progress. The platform includes core project management, time-series image comparison, and an integrated payment system allowing operators to invoice clients and receive payouts via Stripe Connect.

**Target MVP Launch:** 16 weeks from project start.

**Post-MVP Rollout:** 8-12 weeks for payment system maturation and premium features.

---

## 2. High-Level Milestones

### Milestone 1: Foundation and Authentication (Weeks 1-2)
**Objective:** Establish project infrastructure, database schema, authentication system.

**Deliverables:**
- Development environment setup (local and staging).
- Database schema v1 (core entities: User, Organization, Project, Site).
- User registration and login with JWT authentication.
- Role-based access control middleware.
- CI/CD pipeline configured.

### Milestone 2: Core Project Management (Weeks 3-5)
**Objective:** Operators can create Projects and Sites, invite clients.

**Deliverables:**
- Projects CRUD API and UI.
- Sites CRUD API and UI.
- User invitation flow (email-based).
- ProjectMember management.
- Basic operator dashboard.

### Milestone 3: Image Upload and Storage (Weeks 6-8)
**Objective:** Image upload pipeline with metadata, thumbnail generation.

**Deliverables:**
- Pre-signed S3 upload flow.
- Capture entity with metadata (angle, GPS, date).
- Background thumbnail generation worker.
- Image storage and retrieval API.
- Upload quota enforcement.

### Milestone 4: Timeline and Comparison UI (Weeks 9-11)
**Objective:** Visual timeline, calendar view, side-by-side comparison.

**Deliverables:**
- Timeline calendar component.
- Thumbnail grid with lazy loading.
- Side-by-side comparison view (2-4 images).
- Synchronized zoom/pan.
- Export comparison as PNG.

### Milestone 5: Subscription and Billing (Weeks 12-13)
**Objective:** Tiered subscriptions, quota enforcement, Stripe integration for SaaS billing.

**Deliverables:**
- Subscription tiers configuration.
- Stripe Checkout integration.
- Webhook handling for subscription events.
- Quota enforcement (storage, uploads, projects).
- Upgrade/downgrade flows.

### Milestone 6: MVP Polish and Testing (Week 14)
**Objective:** Bug fixes, performance optimization, security audit, documentation.

**Deliverables:**
- End-to-end testing suite.
- Performance benchmarks met.
- Security vulnerabilities addressed.
- User documentation (help center, onboarding).

### Milestone 7: MVP Launch (Week 15-16)
**Objective:** Deploy to production, launch marketing, onboard first customers.

**Deliverables:**
- Production deployment.
- Monitoring and alerting configured.
- Support workflows established.
- Initial customer acquisition.

### Milestone 8: Invoicing and Payment System (Weeks 17-20)
**Objective:** Operators can invoice clients, clients can pay, platform processes payouts.

**Deliverables:**
- Invoice CRUD API and UI.
- Invoice PDF generation.
- Stripe Payment Intent integration (client payment).
- Stripe Connect onboarding for operators.
- Payout disbursement worker.
- Fee calculation and reconciliation.
- Email notifications (invoice sent, payment received, payout confirmed).

### Milestone 9: Payment System Maturation (Weeks 21-24)
**Objective:** Refunds, overdue management, tax compliance, dashboard enhancements.

**Deliverables:**
- Refund processing (manual and automated).
- Overdue invoice reminders.
- VAT/tax calculation with Stripe Tax.
- Operator payout dashboard.
- Site Owner payment history.
- Accounting export (CSV).

### Milestone 10: Premium Features Rollout (Weeks 25-28)
**Objective:** Layered overlay, video upload, photogrammetry (Enterprise).

**Deliverables:**
- Layered image overlay UI with opacity control.
- Video upload and transcoding pipeline.
- Photogrammetry job submission and 3D viewer.
- Feature gating by subscription tier.

### Milestone 11: Enterprise Readiness (Weeks 29-32)
**Objective:** API access, accounting integrations, advanced reporting.

**Deliverables:**
- Public API with documentation.
- QuickBooks/Xero integration.
- Advanced analytics dashboard.
- Custom branding for Enterprise tier.
- SLA guarantees and priority support.

---

## 3. Sprint Breakdown (MVP Focus: Weeks 1-16)

### Sprint 1 (Week 1): Project Setup and Database

**Goals:**
- Initialize monorepo with frontend and backend.
- Configure PostgreSQL and Redis locally.
- Define initial database schema.
- Set up CI/CD pipeline.

**Tasks:**
- Initialize Git repository with folder structure.
- Configure ESLint, Prettier, TypeScript.
- Create Docker Compose for local development (Postgres, Redis, MinIO).
- Define Prisma schema for User, Organization, Role.
- Run initial database migration.
- Configure GitHub Actions for linting and tests.

**Acceptance:**
- Developers can run `docker-compose up` and access local database.
- CI pipeline runs on every push.

### Sprint 2 (Week 2): Authentication and Authorization

**Goals:**
- Implement user registration and login.
- JWT token generation and validation.
- Role-based middleware.

**Tasks:**
- Build POST /api/v1/auth/register endpoint.
- Build POST /api/v1/auth/login endpoint with JWT issuance.
- Implement password hashing with bcrypt.
- Create authentication middleware.
- Create role-based authorization middleware.
- Write unit tests for auth logic.

**Acceptance:**
- User can register, receive verification email, and log in.
- JWT tokens validated on protected endpoints.
- Unauthorized requests return 401 or 403.

### Sprint 3 (Week 3): Projects and Organizations

**Goals:**
- Operators can create organizations.
- Create and manage Projects.

**Tasks:**
- Extend database schema: Project, Site entities.
- Build POST /api/v1/projects endpoint.
- Build GET /api/v1/projects (list with pagination).
- Build PATCH /api/v1/projects/:id.
- Build DELETE /api/v1/projects/:id (soft delete).
- Create frontend: Project list page, create Project modal.
- Write integration tests for Project CRUD.

**Acceptance:**
- Operator can create, view, edit, archive Projects.
- Projects scoped to Operator's organization.

### Sprint 4 (Week 4): Sites and Invitations

**Goals:**
- Add Sites to Projects.
- Invite Site Owners and team members.

**Tasks:**
- Build POST /api/v1/projects/:id/sites endpoint.
- Build Sites CRUD endpoints.
- Implement invitation system: generate token, send email.
- Build POST /api/v1/projects/:id/invite endpoint.
- Create frontend: Site list within Project, invite modal.
- Write integration tests for invitation flow.

**Acceptance:**
- Operator can add Sites to Project.
- Site Owner receives invitation email, accepts, gains access to Project.

### Sprint 5 (Week 5): Project Dashboard UI

**Goals:**
- Operator dashboard showing Projects overview.
- Site Owner dashboard showing invited Projects.

**Tasks:**
- Create Operator dashboard page (Project cards, quick stats).
- Create Site Owner dashboard (Projects they have access to).
- Implement navigation and routing.
- Add loading states and error handling.

**Acceptance:**
- Operators see their Projects.
- Site Owners see Projects they're invited to.
- Navigation between Projects and Sites works.

### Sprint 6 (Week 6): Image Upload Infrastructure

**Goals:**
- Pre-signed S3 upload flow.
- Capture entity and metadata.

**Tasks:**
- Configure AWS S3 bucket (or MinIO locally).
- Build POST /api/v1/captures/upload-url endpoint (generate pre-signed URL).
- Build POST /api/v1/captures/complete endpoint (finalize upload).
- Extend database schema: Capture, Angle entities.
- Create frontend: Upload button, file picker, progress indicator.
- Write integration tests for upload flow.

**Acceptance:**
- User can upload image via pre-signed URL.
- Capture record created with metadata.

### Sprint 7 (Week 7): Thumbnail Generation Worker

**Goals:**
- Background job for thumbnail generation.
- BullMQ setup with Redis.

**Tasks:**
- Set up BullMQ with Redis.
- Create thumbnail generation worker (download from S3, resize, upload thumbnail).
- Enqueue job after Capture created.
- Update Capture processing_status when complete.
- Handle failure cases (retry, mark as failed).
- Write tests for worker logic.

**Acceptance:**
- Thumbnails generated automatically after upload.
- Failed jobs retried up to 3 times.

### Sprint 8 (Week 8): Angles and Metadata UI

**Goals:**
- Manage camera angles per Site.
- Capture metadata (date, GPS, weather, notes).

**Tasks:**
- Build Angle CRUD endpoints.
- Create frontend: Manage angles within Site settings.
- Add metadata form fields to upload UI.
- Validate metadata (capture date, GPS coordinates).
- Display metadata in Capture detail view.

**Acceptance:**
- Operator can define custom angles.
- Captures tagged with angle, date, GPS, notes.

### Sprint 9 (Week 9): Timeline Calendar View

**Goals:**
- Calendar component showing capture dates.
- Filter by Site and Angle.

**Tasks:**
- Build GET /api/v1/captures endpoint with filtering and pagination.
- Create calendar component (date grid, bold dates with captures).
- Implement Site and Angle filter dropdowns.
- Fetch and display captures for selected date.
- Write integration tests for timeline API.

**Acceptance:**
- User sees calendar with dates containing captures highlighted.
- Clicking date shows thumbnails from that day.

### Sprint 10 (Week 10): Thumbnail Grid and Lazy Loading

**Goals:**
- Display captures as thumbnail grid.
- Lazy load images on scroll.

**Tasks:**
- Create thumbnail grid component (responsive, 4x4 default).
- Implement lazy loading with Intersection Observer.
- Add pagination controls.
- Optimize thumbnail loading (CDN, caching).

**Acceptance:**
- Timeline shows paginated thumbnail grid.
- Images load as user scrolls.
- Performance target: 50 thumbnails load in < 2s.

### Sprint 11 (Week 11): Side-by-Side Comparison

**Goals:**
- Select up to 4 images, display side-by-side.
- Synchronized zoom and pan.

**Tasks:**
- Build GET /api/v1/captures/compare endpoint.
- Create comparison view component (2x2 or 1x4 layout).
- Implement checkbox selection on thumbnails.
- Implement synchronized zoom using Canvas or CSS transform.
- Add export as PNG feature.
- Write integration tests for comparison API.

**Acceptance:**
- User selects 2-4 images, views side-by-side.
- Zooming one image zooms all proportionally.
- Export generates single combined PNG.

### Sprint 12 (Week 12): Subscription Tiers and Stripe Setup

**Goals:**
- Define subscription tiers.
- Integrate Stripe Checkout.

**Tasks:**
- Extend database schema: OperatorSubscription entity.
- Create Stripe products and prices for each tier.
- Build POST /api/v1/subscriptions/checkout endpoint (create Checkout session).
- Build webhook handler for subscription events.
- Create frontend: Pricing page, upgrade modal.
- Write integration tests for subscription flow (test mode).

**Acceptance:**
- Operator can upgrade from Free to Professional tier.
- Webhook updates subscription status in database.

### Sprint 13 (Week 13): Quota Enforcement

**Goals:**
- Enforce storage, upload, and project quotas.

**Tasks:**
- Implement quota check middleware.
- Calculate storage usage on upload (aggregate file sizes).
- Increment upload counter monthly (reset on billing cycle).
- Prevent Project creation if quota exceeded.
- Display quota usage in dashboard.
- Write tests for quota enforcement logic.

**Acceptance:**
- Upload rejected if storage quota exceeded.
- Project creation blocked if limit reached.
- User sees quota usage bar in dashboard.

### Sprint 14 (Week 14): Testing and Bug Fixes

**Goals:**
- Comprehensive testing, fix critical bugs.

**Tasks:**
- Write end-to-end tests for all user flows (Playwright).
- Run load testing (k6) to validate performance targets.
- Fix identified bugs and edge cases.
- Security audit (OWASP ZAP scan).
- Code review and refactoring.

**Acceptance:**
- All E2E tests pass.
- No critical or high-severity bugs.
- Performance benchmarks met.

### Sprint 15 (Week 15): Documentation and Deployment Prep

**Goals:**
- Documentation, staging deployment, production readiness.

**Tasks:**
- Write user onboarding guide.
- Document API endpoints (OpenAPI spec).
- Deploy to staging environment.
- Configure production infrastructure (Terraform).
- Set up monitoring (Datadog, Sentry).
- Create runbook for common operations.

**Acceptance:**
- Staging environment mirrors production.
- Documentation complete and accessible.
- Monitoring and alerting configured.

### Sprint 16 (Week 16): MVP Launch

**Goals:**
- Deploy to production, launch.

**Tasks:**
- Final QA on staging.
- Deploy to production (blue-green deployment).
- Announce launch (email, social media, Product Hunt).
- Monitor system health post-launch.
- Respond to initial user feedback.

**Acceptance:**
- Production live and stable.
- First paying customers onboarded.

---

## 4. Payment System Sprints (Weeks 17-24)

### Sprint 17 (Week 17): Invoice CRUD and Database Schema

**Goals:**
- Implement invoice generation.

**Tasks:**
- TASK_09_Invoice_CRUD.md.
- Extend database schema: Invoice, InvoiceLineItem, Payment, Payout, Fee entities.
- Build POST /api/v1/invoices endpoint.
- Build GET /api/v1/invoices (list and detail).
- Build PATCH /api/v1/invoices/:id (edit draft).
- Build DELETE /api/v1/invoices/:id (delete draft).
- Create frontend: Invoice creation form, line item management.
- Write integration tests.

**Acceptance:**
- Operator can create, edit, delete draft invoices.
- Invoices include multiple line items.
- Subtotal and total calculated correctly.

### Sprint 18 (Week 18): Invoice Sending and PDF Generation

**Goals:**
- Send invoices to clients.
- Generate PDF invoices.

**Tasks:**
- Build POST /api/v1/invoices/:id/send endpoint.
- Implement email notification (invoice sent).
- Build GET /api/v1/invoices/:id/pdf endpoint (generate PDF with Puppeteer).
- Create PDF template (HTML/CSS).
- Update frontend: Send button, PDF download link.

**Acceptance:**
- Operator sends invoice, Site Owner receives email with link.
- PDF invoice generated and downloadable.

### Sprint 19 (Week 19): Payment Processing with Stripe

**Goals:**
- Site Owners can pay invoices.

**Tasks:**
- TASK_10_Payment_Processing.md.
- Build POST /api/v1/invoices/:id/payment-intent endpoint.
- Integrate Stripe Elements in frontend (payment form).
- Build webhook handler POST /webhooks/stripe/payments.
- Update Invoice status to Paid on successful payment.
- Create Payment record.
- Send payment confirmation emails.
- Write integration tests (Stripe test mode).

**Acceptance:**
- Site Owner pays invoice via Stripe.
- Invoice status updated to Paid.
- Confirmation emails sent to both parties.

### Sprint 20 (Week 20): Stripe Connect Onboarding

**Goals:**
- Operators onboard Stripe Connect accounts.

**Tasks:**
- Build POST /api/v1/operators/connect-account endpoint.
- Generate Stripe Account Link for onboarding.
- Store stripe_connected_account_id in Organization.
- Build GET /api/v1/operators/connect-account/status endpoint.
- Create frontend: Setup Payouts button, onboarding flow.
- Handle webhook account.updated.

**Acceptance:**
- Operator completes Stripe Connect onboarding.
- Connected account ID stored.
- Operator can now receive payouts.

### Sprint 21 (Week 21): Payout Disbursement

**Goals:**
- Automatically disburse payouts to Operators.

**Tasks:**
- TASK_11_Payout_Disbursement.md.
- TASK_13_Payment_Fee_Calculation.md.
- Implement fee calculation logic.
- Create Payout record when invoice paid.
- Build background worker for payout processing.
- Initiate Stripe Transfer to Connected Account.
- Handle webhook transfer.paid, transfer.failed.
- Send payout confirmation emails.
- Write tests for payout logic.

**Acceptance:**
- Payout created after payment received.
- Funds transferred to Operator's bank account within configured timeframe.
- Fees deducted correctly.

### Sprint 22 (Week 22): Invoice and Payment Notifications

**Goals:**
- Automated email notifications.

**Tasks:**
- TASK_12_Invoice_Notifications.md.
- Implement overdue invoice detection (cron job).
- Send overdue reminders (Day 1, 7, 14 after due date).
- Implement payout failure notification.
- Create email templates for all notification types.
- Configure email service (Postmark).
- Write tests for notification triggers.

**Acceptance:**
- Emails sent at correct lifecycle events.
- Overdue reminders triggered automatically.

### Sprint 23 (Week 23): Invoice and Payout Dashboards

**Goals:**
- UI for managing invoices and tracking payouts.

**Tasks:**
- TASK_14_Invoice_Dashboard_UI.md.
- Create Operator Invoice Dashboard (list, filters, metrics).
- Create Site Owner Invoice Dashboard (view, pay).
- Create Operator Payout Dashboard (earnings, payout history).
- Implement dashboard metrics API (GET /api/v1/invoices/dashboard, GET /api/v1/payouts/dashboard).
- Write tests for dashboard APIs.

**Acceptance:**
- Operators see invoice list with status filters.
- Site Owners see invoices they need to pay.
- Operators see payout history and earnings summary.

### Sprint 24 (Week 24): Tax and VAT Handling

**Goals:**
- Automatic tax calculation.

**Tasks:**
- Integrate Stripe Tax.
- Build POST /api/v1/tax/calculate endpoint.
- Build POST /api/v1/tax/validate-vat endpoint (VIES API).
- Update invoice creation to include tax calculation.
- Display tax rate and amount on invoice.
- Handle reverse charge for EU B2B transactions.
- Write tests for tax calculation logic.

**Acceptance:**
- Invoices include correct VAT based on location.
- VAT ID validated for EU businesses.
- Reverse charge applied when applicable.

---

## 5. File Tree Structure

```
/
├── frontend/
│   ├── public/
│   │   ├── index.html
│   │   └── favicon.ico
│   ├── src/
│   │   ├── assets/
│   │   │   ├── images/
│   │   │   └── styles/
│   │   │       └── global.css
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── Spinner.tsx
│   │   │   │   └── Table.tsx
│   │   │   ├── auth/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── RegisterForm.tsx
│   │   │   │   └── PasswordResetForm.tsx
│   │   │   ├── projects/
│   │   │   │   ├── ProjectList.tsx
│   │   │   │   ├── ProjectCard.tsx
│   │   │   │   ├── ProjectForm.tsx
│   │   │   │   └── ProjectDetail.tsx
│   │   │   ├── sites/
│   │   │   │   ├── SiteList.tsx
│   │   │   │   ├── SiteForm.tsx
│   │   │   │   └── SiteDetail.tsx
│   │   │   ├── captures/
│   │   │   │   ├── CaptureUpload.tsx
│   │   │   │   ├── CaptureGrid.tsx
│   │   │   │   ├── CaptureThumbnail.tsx
│   │   │   │   ├── CaptureDetail.tsx
│   │   │   │   ├── TimelineCalendar.tsx
│   │   │   │   ├── ComparisonView.tsx
│   │   │   │   └── LayeredOverlay.tsx (Premium)
│   │   │   ├── invoices/
│   │   │   │   ├── InvoiceList.tsx
│   │   │   │   ├── InvoiceForm.tsx
│   │   │   │   ├── InvoiceDetail.tsx
│   │   │   │   ├── InvoiceLineItems.tsx
│   │   │   │   ├── InvoicePDFViewer.tsx
│   │   │   │   └── PaymentForm.tsx (Stripe Elements)
│   │   │   ├── payments/
│   │   │   │   ├── PaymentHistory.tsx
│   │   │   │   ├── PayoutDashboard.tsx
│   │   │   │   └── ConnectAccountSetup.tsx
│   │   │   ├── subscriptions/
│   │   │   │   ├── PricingTable.tsx
│   │   │   │   ├── UpgradeModal.tsx
│   │   │   │   └── QuotaUsage.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── OperatorDashboard.tsx
│   │   │   │   ├── SiteOwnerDashboard.tsx
│   │   │   │   └── MetricsPanel.tsx
│   │   │   └── layout/
│   │   │       ├── Header.tsx
│   │   │       ├── Sidebar.tsx
│   │   │       └── Footer.tsx
│   │   ├── pages/
│   │   │   ├── HomePage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── ProjectsPage.tsx
│   │   │   ├── ProjectDetailPage.tsx
│   │   │   ├── SiteDetailPage.tsx
│   │   │   ├── TimelinePage.tsx
│   │   │   ├── ComparisonPage.tsx
│   │   │   ├── InvoicesPage.tsx
│   │   │   ├── InvoiceDetailPage.tsx
│   │   │   ├── PayoutsPage.tsx
│   │   │   ├── SettingsPage.tsx
│   │   │   ├── PricingPage.tsx
│   │   │   └── NotFoundPage.tsx
│   │   ├── api/
│   │   │   ├── client.ts (Axios instance)
│   │   │   ├── auth.ts
│   │   │   ├── projects.ts
│   │   │   ├── sites.ts
│   │   │   ├── captures.ts
│   │   │   ├── invoices.ts
│   │   │   ├── payments.ts
│   │   │   ├── payouts.ts
│   │   │   └── subscriptions.ts
│   │   ├── store/
│   │   │   ├── index.ts (Zustand store)
│   │   │   ├── authSlice.ts
│   │   │   ├── projectSlice.ts
│   │   │   ├── captureSlice.ts
│   │   │   └── invoiceSlice.ts
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useProjects.ts
│   │   │   ├── useCaptures.ts
│   │   │   └── useInvoices.ts
│   │   ├── utils/
│   │   │   ├── validators.ts
│   │   │   ├── formatters.ts
│   │   │   ├── constants.ts
│   │   │   └── helpers.ts
│   │   ├── types/
│   │   │   ├── user.ts
│   │   │   ├── project.ts
│   │   │   ├── capture.ts
│   │   │   ├── invoice.ts
│   │   │   └── payment.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── router.tsx
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts
│   │   │   ├── redis.ts
│   │   │   ├── s3.ts
│   │   │   ├── stripe.ts
│   │   │   ├── email.ts
│   │   │   └── env.ts
│   │   ├── models/
│   │   │   ├── User.ts
│   │   │   ├── Organization.ts
│   │   │   ├── Project.ts
│   │   │   ├── Site.ts
│   │   │   ├── Capture.ts
│   │   │   ├── Invoice.ts
│   │   │   ├── Payment.ts
│   │   │   ├── Payout.ts
│   │   │   └── Subscription.ts
│   │   ├── routes/
│   │   │   ├── index.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── projects.routes.ts
│   │   │   ├── sites.routes.ts
│   │   │   ├── captures.routes.ts
│   │   │   ├── invoices.routes.ts
│   │   │   ├── payments.routes.ts
│   │   │   ├── payouts.routes.ts
│   │   │   ├── subscriptions.routes.ts
│   │   │   └── webhooks.routes.ts
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── projects.controller.ts
│   │   │   ├── sites.controller.ts
│   │   │   ├── captures.controller.ts
│   │   │   ├── invoices.controller.ts
│   │   │   ├── payments.controller.ts
│   │   │   ├── payouts.controller.ts
│   │   │   ├── subscriptions.controller.ts
│   │   │   └── webhooks.controller.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── projects.service.ts
│   │   │   ├── sites.service.ts
│   │   │   ├── captures.service.ts
│   │   │   ├── storage.service.ts (S3)
│   │   │   ├── invoices.service.ts
│   │   │   ├── payments.service.ts
│   │   │   ├── payouts.service.ts
│   │   │   ├── fees.service.ts
│   │   │   ├── tax.service.ts
│   │   │   ├── email.service.ts
│   │   │   ├── pdf.service.ts
│   │   │   └── subscriptions.service.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── rbac.middleware.ts
│   │   │   ├── validation.middleware.ts
│   │   │   ├── rateLimit.middleware.ts
│   │   │   ├── error.middleware.ts
│   │   │   └── quota.middleware.ts
│   │   ├── workers/
│   │   │   ├── index.ts
│   │   │   ├── thumbnail.worker.ts
│   │   │   ├── payout.worker.ts
│   │   │   ├── email.worker.ts
│   │   │   ├── overdue.worker.ts (cron)
│   │   │   └── video.worker.ts (Premium)
│   │   ├── validators/
│   │   │   ├── auth.validator.ts
│   │   │   ├── projects.validator.ts
│   │   │   ├── sites.validator.ts
│   │   │   ├── captures.validator.ts
│   │   │   ├── invoices.validator.ts
│   │   │   └── payments.validator.ts
│   │   ├── utils/
│   │   │   ├── jwt.ts
│   │   │   ├── password.ts
│   │   │   ├── validators.ts
│   │   │   ├── formatters.ts
│   │   │   └── errors.ts
│   │   ├── types/
│   │   │   ├── express.d.ts
│   │   │   ├── user.types.ts
│   │   │   ├── project.types.ts
│   │   │   ├── invoice.types.ts
│   │   │   └── payment.types.ts
│   │   ├── app.ts
│   │   └── server.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── tests/
│   │   ├── unit/
│   │   │   ├── services/
│   │   │   ├── utils/
│   │   │   └── validators/
│   │   ├── integration/
│   │   │   ├── auth.test.ts
│   │   │   ├── projects.test.ts
│   │   │   ├── captures.test.ts
│   │   │   ├── invoices.test.ts
│   │   │   └── payments.test.ts
│   │   └── e2e/
│   │       ├── user-flow.test.ts
│   │       ├── invoice-payment-flow.test.ts
│   │       └── subscription-flow.test.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── jest.config.js
│
├── infrastructure/
│   ├── terraform/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   ├── vpc.tf
│   │   ├── rds.tf
│   │   ├── s3.tf
│   │   ├── ecs.tf
│   │   └── cloudfront.tf
│   └── docker/
│       ├── Dockerfile.backend
│       ├── Dockerfile.worker
│       └── docker-compose.yml
│
├── docs/
│   ├── API.md
│   ├── DEPLOYMENT.md
│   ├── USER_GUIDE.md
│   └── CONTRIBUTING.md
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
│
├── .gitignore
├── README.md
└── package.json (workspace root)
```

---

## 6. Contract and Responsibility Mapping

### 6.1 Frontend Responsibilities

**Authentication:**
- Render login, registration, password reset forms.
- Store JWT tokens in memory and refresh tokens in cookies.
- Provide authentication state to components via context or store.

**Projects and Sites:**
- Fetch and display project/site lists.
- Handle project/site creation, editing via forms.
- Validate form inputs before submission.

**Captures:**
- Upload images directly to S3 using pre-signed URLs.
- Display timeline calendar and thumbnail grid.
- Implement side-by-side comparison with zoom/pan.

**Invoices and Payments:**
- Render invoice creation form with line item management.
- Calculate subtotal and total in real-time (client-side preview).
- Integrate Stripe Elements for payment form.
- Handle payment confirmation and errors.

**Subscriptions:**
- Display pricing table.
- Initiate Stripe Checkout for upgrades.
- Show quota usage and limits.

**UI/UX:**
- Responsive design (mobile, tablet, desktop).
- Loading states, error messages, success notifications.
- Accessibility (ARIA labels, keyboard navigation).

### 6.2 Backend Responsibilities

**Authentication:**
- Validate credentials, hash passwords, issue JWT tokens.
- Enforce password policies and rate limiting.
- Handle email verification and password reset flows.

**Authorization:**
- Middleware to validate JWT and extract user claims.
- Enforce role-based access control on all endpoints.
- Verify user has access to requested resources.

**Business Logic:**
- Validate all inputs against business rules.
- Enforce quotas (storage, uploads, projects).
- Calculate invoice totals, taxes, fees.
- Orchestrate multi-step processes (invoice send, payment, payout).

**Data Persistence:**
- Read/write to PostgreSQL via ORM.
- Ensure data integrity and constraints.
- Handle database transactions for multi-step operations.

**External Integrations:**
- Generate pre-signed S3 URLs.
- Create Stripe Payment Intents, Checkout Sessions, Transfers.
- Validate webhooks from Stripe.
- Send emails via Postmark.
- Validate VAT numbers via VIES API.

**Background Jobs:**
- Enqueue jobs for thumbnail generation, video transcoding, payouts, emails.
- Workers consume jobs and update database on completion/failure.

### 6.3 Database Responsibilities

**Data Storage:**
- Store all relational data (users, projects, invoices, payments).
- Enforce referential integrity (foreign keys).
- Provide ACID guarantees for transactions.

**Query Performance:**
- Indexes on frequently queried columns.
- Optimized queries for timeline, dashboard metrics.

### 6.4 S3 / Storage Responsibilities

**File Storage:**
- Store original images, thumbnails, videos, PDFs.
- Serve files via pre-signed URLs or CDN.
- Lifecycle policies for archival and deletion.

### 6.5 Stripe Responsibilities

**Payments:**
- Collect and process payments from Site Owners.
- Handle 3D Secure, fraud detection.
- Store payment methods securely.

**Subscriptions:**
- Manage subscription lifecycle (creation, renewal, cancellation).
- Handle proration and upgrades/downgrades.

**Connect:**
- Onboard operators as Connected Accounts.
- Transfer funds to operators.

**Tax:**
- Calculate tax based on location and VAT IDs.

**Webhooks:**
- Notify platform of events asynchronously.

### 6.6 Email Service Responsibilities

**Transactional Emails:**
- Deliver emails reliably.
- Track delivery, opens, bounces.
- Provide templates and dynamic content injection.

---

## 7. Risks and Mitigations

### Risk 1: Payment Delays or Failures

**Description:** Stripe transfers may fail due to incorrect bank details, compliance issues, or insufficient funds.

**Impact:** Operators do not receive payouts, lose trust in platform.

**Mitigation:**
- Validate Stripe Connected Account onboarding thoroughly.
- Send proactive notifications if payout fails.
- Provide clear instructions for resolving issues.
- Implement retry logic for transient failures.
- Monitor payout success rate, alert if drops below 95%.

### Risk 2: Tax Compliance Complexity

**Description:** VAT/tax rules vary by jurisdiction, difficult to implement correctly.

**Impact:** Platform non-compliant with tax regulations, fines, legal issues.

**Mitigation:**
- Use Stripe Tax for automatic calculation (recommended).
- Consult with tax advisor for initial setup.
- Monitor regulatory changes and update rates quarterly.
- Store all tax calculation details for audit trail.

### Risk 3: Quota Enforcement Bypass

**Description:** User finds way to exceed quotas (e.g., concurrent uploads, race conditions).

**Impact:** Unpredictable costs, unfair usage.

**Mitigation:**
- Enforce quotas at API layer with database transactions.
- Use Redis atomic counters for upload tracking.
- Implement idempotency keys for critical operations.
- Monitor usage patterns, alert on anomalies.

### Risk 4: Storage Cost Explosion

**Description:** Users upload excessively large files or many files, storage costs skyrocket.

**Impact:** Unprofitable, unsustainable.

**Mitigation:**
- Strictly enforce file size limits.
- Compress images on upload (lossy or lossless).
- Implement lifecycle policies to archive old files to cheaper storage (Glacier).
- Monitor storage costs daily, alert if exceeds budget.
- Consider tiered storage pricing for users.

### Risk 5: Stripe Webhook Delivery Failure

**Description:** Webhooks may be lost due to network issues, server downtime, or Stripe retries exhausted.

**Impact:** Invoice status not updated, payouts not processed, data inconsistency.

**Mitigation:**
- Implement idempotent webhook handlers (check if already processed).
- Log all webhook events for manual reconciliation if needed.
- Use Stripe API to poll for missed events (daily batch job).
- Monitor webhook delivery success rate via Stripe dashboard.
- Set up alerting for webhook failures.

### Risk 6: Photogrammetry Processing Costs

**Description:** Photogrammetry jobs computationally expensive, costs unpredictable.

**Impact:** Losses on Enterprise tier if underpriced.

**Mitigation:**
- Limit photogrammetry jobs per month (5 for Enterprise MVP).
- Use external service with fixed pricing (Pix4D, OpenDroneMap).
- Monitor per-job costs, adjust pricing if needed.
- Charge per-job fee separately from subscription if costs too high.

### Risk 7: Database Performance Degradation

**Description:** As data grows, queries slow down, impacting user experience.

**Impact:** Slow timeline loads, frustrated users, churn.

**Mitigation:**
- Implement database indexes on all query paths.
- Use database query profiling to identify slow queries.
- Implement caching for expensive queries (Redis, 5-minute TTL).
- Scale database vertically (increase instance size) or horizontally (read replicas).
- Archive old data to reduce table sizes.

### Risk 8: Security Breach or Data Leak

**Description:** Unauthorized access to user data, images, financial information.

**Impact:** Loss of customer trust, GDPR fines, legal liability, reputational damage.

**Mitigation:**
- Implement defense-in-depth security (authentication, authorization, input validation, encryption).
- Regular security audits and penetration testing.
- Use secure secrets management (AWS Secrets Manager).
- Monitor for suspicious activity (failed login attempts, unusual API usage).
- Incident response plan with defined roles and communication strategy.
- Encrypt sensitive data at rest and in transit.

### Risk 9: Scope Creep Delaying MVP

**Description:** Team builds features beyond MVP scope, delays launch.

**Impact:** Missed launch date, increased burn rate, competitor advantage.

**Mitigation:**
- Strictly prioritize MVP features, defer nice-to-haves to post-MVP.
- Product owner approves all feature additions.
- Regular sprint reviews to assess progress against roadmap.
- Time-box MVP to 16 weeks, cut features if necessary to meet deadline.

### Risk 10: Third-Party Service Downtime

**Description:** Stripe, S3, email service experiences outage.

**Impact:** Users cannot pay invoices, upload images, or receive emails.

**Mitigation:**
- Design for graceful degradation (display user-friendly error messages).
- Implement retries with exponential backoff for transient failures.
- Monitor third-party service status pages.
- Consider multi-cloud or multi-provider redundancy for critical services (expensive, evaluate trade-offs).
- Communicate proactively with users during outages.

---

## 8. Success Metrics

### MVP Launch (Week 16)

- 50 Operator signups.
- 20 paying subscribers (Professional or Business tier).
- 500 projects created.
- 5,000 images uploaded.
- System uptime: 99.5%.
- Average API response time: p95 < 300ms.
- Customer satisfaction: NPS > 40.

### Payment System Launch (Week 24)

- 50 invoices created.
- 20 invoices paid.
- 10 payouts successfully disbursed.
- Zero payment processing errors requiring manual intervention.
- Invoice-to-payment conversion rate: > 60%.
- Average time from invoice sent to payment: < 14 days.

### Post-MVP (Week 32)

- 200 Operator signups.
- 100 paying subscribers.
- 2,000 projects created.
- 50,000 images uploaded.
- 200 invoices paid.
- 50 operators receiving payouts monthly.
- System uptime: 99.9%.
- Average API response time: p95 < 200ms.
- Customer satisfaction: NPS > 50.
- Monthly Recurring Revenue (MRR): 5,000 USD.
- Platform fee revenue: 1,000 USD/month.

---

===== END FILE: PLAN.md =====
