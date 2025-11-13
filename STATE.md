===== BEGIN FILE: STATE.md =====

# Build State Guide — Drone Construction Progress SaaS Platform

## Purpose

This document guides the engineering team through building the platform task-by-task, from initial setup to MVP launch and beyond. Follow this sequentially to ensure dependencies are met and the platform is built systematically.

---

## Phase 0: Project Setup and Environment Configuration

### Step 0.1: Initialize Development Environment

**Duration:** 1 day

**Tasks:**
- Clone repository, create development branch.
- Initialize monorepo structure (frontend/ and backend/ directories).
- Configure Node.js (v18+) for both frontend and backend.
- Install package managers: npm or yarn.
- Setup linting and formatting: ESLint, Prettier, TypeScript.
- Create .gitignore for node_modules, .env, build artifacts.

**Files Created:**
- package.json (workspace root).
- frontend/package.json.
- backend/package.json.
- .eslintrc.json.
- .prettierrc.
- tsconfig.json (both frontend and backend).

**Checklist:**
- [ ] Repository cloned and development branch created.
- [ ] Node.js and npm/yarn installed.
- [ ] ESLint and Prettier configured, runs without errors.
- [ ] TypeScript compiles successfully (empty project).

### Step 0.2: Docker Compose for Local Development

**Duration:** 1 day

**Tasks:**
- Create docker-compose.yml with services: PostgreSQL, Redis, MinIO (S3 alternative).
- Configure PostgreSQL: Database name, user, password.
- Configure Redis: Default port 6379.
- Configure MinIO: Port 9000 (S3 API), 9001 (console), access keys.
- Test all services start successfully: `docker-compose up -d`.

**Files Created:**
- docker-compose.yml.
- .env.example (template for local development).

**Environment Variables Required:**
```
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/groundpoint_dev

# Redis
REDIS_URL=redis://localhost:6379

# MinIO (S3 Alternative)
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET_NAME=groundpoint-dev

# JWT Secrets
JWT_PRIVATE_KEY=<generate RSA private key>
JWT_PUBLIC_KEY=<generate RSA public key>

# Email Service (Postmark or SendGrid)
EMAIL_API_KEY=<your_api_key>
EMAIL_FROM_ADDRESS=noreply@example.com

# Stripe (Test Mode)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CONNECT_CLIENT_ID=ca_...

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Backend URL
BACKEND_URL=http://localhost:4000
```

**Checklist:**
- [ ] Docker Compose services running: `docker-compose ps` shows all healthy.
- [ ] PostgreSQL accessible: `psql -h localhost -U user -d groundpoint_dev` connects.
- [ ] Redis accessible: `redis-cli ping` returns PONG.
- [ ] MinIO console accessible at http://localhost:9001.

### Step 0.3: Database Schema and ORM Setup

**Duration:** 2 days

**Tasks:**
- Install Prisma (recommended ORM for TypeScript).
- Initialize Prisma: `npx prisma init`.
- Define Prisma schema in backend/prisma/schema.prisma:
  - User, Organization, Role enums.
  - Project, Site, Angle, Capture.
  - Invoice, InvoiceLineItem, Payment, Payout, Fee.
  - OperatorSubscription, Notification, ProjectMember, Invitation.
- Run initial migration: `npx prisma migrate dev --name init`.
- Verify tables created in PostgreSQL.

**Files Created:**
- backend/prisma/schema.prisma.
- backend/prisma/migrations/..._init/.

**Checklist:**
- [ ] Prisma schema defined with all entities.
- [ ] Initial migration run successfully.
- [ ] Database tables created: `psql` and `\dt` lists all tables.

### Step 0.4: CI/CD Pipeline Configuration

**Duration:** 1 day

**Tasks:**
- Create .github/workflows/ci.yml for GitHub Actions.
- Pipeline stages:
  - Lint: Run ESLint on frontend and backend.
  - Unit Tests: Run Jest tests (initially none, but setup ready).
  - Integration Tests: Setup test database, run API tests.
  - Build: Compile TypeScript, build frontend (Vite).
- Configure pipeline to run on every push and pull request.

**Files Created:**
- .github/workflows/ci.yml.

**Checklist:**
- [ ] CI pipeline runs successfully on push.
- [ ] Linting passes.
- [ ] Build completes without errors.

---

## Phase 1: MVP Core Features (Weeks 1-16)

### Week 1-2: Authentication System

**Reference:** TASK_01_Authentication_System.md

**Objectives:**
- User registration with email verification.
- Login with JWT tokens (access + refresh).
- Password reset flow.
- Role-based middleware.

**Implementation Order:**

**Day 1-2: Database and Models**
- Create User, Organization tables (already in schema).
- Implement User model with bcrypt password hashing.

**Day 3-4: Registration Endpoint**
- POST /api/v1/auth/register.
- Validate email and password strength.
- Hash password, create User and Organization records.
- Send verification email via email service.

**Day 5-6: Login and JWT**
- POST /api/v1/auth/login.
- Verify credentials, issue access and refresh tokens.
- Implement JWT signing with RS256.

**Day 7-8: Password Reset**
- POST /api/v1/auth/password-reset.
- Generate token, send email with reset link.
- POST /api/v1/auth/password-reset/confirm to complete reset.

**Day 9-10: Middleware and RBAC**
- Authentication middleware: Validate JWT on protected endpoints.
- RBAC middleware: Check user role and organization.

**Testing:**
- Unit tests for password hashing, JWT generation.
- Integration tests for all auth endpoints.

**Checklist:**
- [ ] User can register and receive verification email.
- [ ] User can log in and receive JWT tokens.
- [ ] Password reset flow works end-to-end.
- [ ] Protected endpoints return 401 without valid token.
- [ ] All tests pass.

### Week 3-5: Projects and Sites CRUD

**Reference:** TASK_02_Projects_Sites_CRUD.md, TASK_03_User_Invitation_System.md

**Objectives:**
- Operators create Projects and Sites.
- Invite Site Owners and team members to Projects.

**Implementation Order:**

**Day 1-3: Projects CRUD API**
- POST /api/v1/projects (create).
- GET /api/v1/projects (list with pagination).
- GET /api/v1/projects/:id (detail).
- PATCH /api/v1/projects/:id (update).
- DELETE /api/v1/projects/:id (soft delete).
- Authorization checks: User must be Operator Admin.

**Day 4-5: Sites CRUD API**
- POST /api/v1/projects/:id/sites (create Site).
- GET /api/v1/sites/:id.
- PATCH /api/v1/sites/:id.
- DELETE /api/v1/sites/:id.

**Day 6-8: Frontend - Projects UI**
- Projects list page with cards.
- Create Project modal.
- Project detail page with Sites list.
- Create Site modal.

**Day 9-12: Invitation System**
- POST /api/v1/projects/:id/invite.
- Invitation email with token.
- POST /api/v1/invitations/accept.
- Frontend: Invite button, accept invitation page.

**Testing:**
- Integration tests for all CRUD endpoints.
- Test invitation flow end-to-end.

**Checklist:**
- [ ] Operator can create, view, edit, delete Projects.
- [ ] Operator can add Sites to Projects.
- [ ] Operator can invite Site Owners to Projects.
- [ ] Site Owner accepts invitation and gains access.
- [ ] All tests pass.

### Week 6-8: Image Upload Infrastructure

**Reference:** TASK_04_Image_Upload_Infrastructure.md, TASK_05_Thumbnail_Generation.md

**Objectives:**
- Operators upload images with metadata.
- Thumbnails generated automatically.

**Implementation Order:**

**Day 1-3: Pre-Signed URL Flow**
- POST /api/v1/captures/upload-url.
- Generate S3 pre-signed URL (or MinIO for local dev).
- POST /api/v1/captures/complete.
- Create Capture record in database.

**Day 4-5: Frontend Upload UI**
- File picker, metadata form (date, angle, GPS, notes).
- Upload to S3 using pre-signed URL.
- Progress bar.
- Call completion endpoint.

**Day 6-7: BullMQ Setup**
- Install BullMQ and Redis client.
- Create thumbnail generation queue.
- Implement thumbnail worker.

**Day 8-10: Thumbnail Worker**
- Download image from S3.
- Resize to 400px wide using Sharp library.
- Upload thumbnail to S3.
- Update Capture record (thumbnail_path, status = Ready).

**Day 11: Quota Enforcement**
- Check storage quota before upload.
- Increment upload counter.
- Reject if quota exceeded.

**Testing:**
- Integration test for full upload flow.
- Unit test for thumbnail generation logic.

**Checklist:**
- [ ] User can upload images with metadata.
- [ ] Thumbnails generated automatically.
- [ ] Quota enforced (reject if exceeded).
- [ ] All tests pass.

### Week 9-11: Timeline and Comparison

**Reference:** TASK_06_Timeline_Calendar_View.md, TASK_07_Side_By_Side_Comparison.md

**Objectives:**
- Browse captures chronologically.
- Compare 2-4 images side-by-side.

**Implementation Order:**

**Day 1-3: Calendar API**
- GET /api/v1/captures/calendar (dates with captures).
- GET /api/v1/captures (list with filtering by site, angle, date).

**Day 4-6: Timeline Frontend**
- Calendar component (highlight dates with captures).
- Thumbnail grid with lazy loading.
- Filter by site and angle.

**Day 7-9: Comparison API**
- GET /api/v1/captures/compare (validate all from same angle).

**Day 10-12: Comparison Frontend**
- Select up to 4 images.
- Display side-by-side (2x2 or 1x4 layout).
- Synchronized zoom and pan.
- Export as PNG.

**Testing:**
- Integration tests for calendar and comparison APIs.
- E2E test for full comparison flow.

**Checklist:**
- [ ] Timeline displays captures by date.
- [ ] User can filter by site and angle.
- [ ] User can compare 2-4 images side-by-side.
- [ ] Export comparison as PNG works.
- [ ] All tests pass.

### Week 12-13: Subscription and Billing

**Reference:** TASK_08_Subscription_Billing.md

**Objectives:**
- Operators subscribe to tiered plans.
- Stripe integration for recurring billing.
- Quota enforcement.

**Implementation Order:**

**Day 1-2: Stripe Setup**
- Create Stripe account (test mode).
- Create products and prices for each tier (Free, Professional, Business, Enterprise).
- Store price IDs in configuration.

**Day 3-4: Checkout Flow**
- POST /api/v1/subscriptions/checkout.
- Create Stripe Checkout Session.
- Redirect user to Stripe-hosted checkout.

**Day 5-6: Webhooks**
- POST /webhooks/stripe/subscriptions.
- Handle subscription.created, subscription.updated, invoice.paid, invoice.payment_failed.
- Update OperatorSubscription table.

**Day 7-8: Quota Enforcement**
- Middleware to check quota before uploads, project creation.
- Frontend: Display quota usage in dashboard.

**Day 9-10: Customer Portal**
- POST /api/v1/subscriptions/portal.
- Create Stripe Customer Portal session.
- Operators manage subscription, payment methods.

**Testing:**
- Integration tests for checkout and webhook handling (Stripe test mode).
- Test quota enforcement.

**Checklist:**
- [ ] Operator can upgrade to Professional tier via Stripe Checkout.
- [ ] Webhooks update subscription status.
- [ ] Quotas enforced (storage, uploads, projects).
- [ ] Operator can manage subscription via Customer Portal.
- [ ] All tests pass.

### Week 14: MVP Testing and Bug Fixes

**Objectives:**
- Comprehensive end-to-end testing.
- Fix critical bugs.
- Performance optimization.

**Tasks:**
- Write E2E tests for all user flows (Playwright or Cypress).
- Load testing (k6 or Artillery).
- Security audit (OWASP ZAP scan).
- Fix bugs identified during testing.
- Code review and refactoring.

**Checklist:**
- [ ] All E2E tests pass.
- [ ] Load testing: API response times meet targets (p95 < 500ms).
- [ ] No critical or high-severity security vulnerabilities.

### Week 15-16: Documentation and MVP Launch

**Objectives:**
- Deploy to production.
- Launch marketing.

**Tasks:**
- Write user onboarding guide and help documentation.
- Document API endpoints (OpenAPI/Swagger).
- Deploy to staging, conduct final QA.
- Configure production infrastructure (Terraform).
- Set up monitoring (Datadog, Sentry).
- Deploy to production (blue-green deployment).
- Announce launch (email, social media, Product Hunt).

**Checklist:**
- [ ] Production deployment successful.
- [ ] Monitoring and alerting configured.
- [ ] Documentation live and accessible.
- [ ] First paying customers onboarded.

---

## Phase 2: Payment System (Weeks 17-24)

### Week 17: Invoice CRUD

**Reference:** TASK_09_Invoice_CRUD.md

**Objectives:**
- Operators create invoices for clients.
- Invoice PDF generation.

**Implementation Order:**

**Day 1-3: Invoice API**
- POST /api/v1/invoices (create with line items).
- GET /api/v1/invoices (list, filter by status).
- GET /api/v1/invoices/:id (detail).
- PATCH /api/v1/invoices/:id (edit draft).
- POST /api/v1/invoices/:id/send.
- DELETE /api/v1/invoices/:id (delete draft).

**Day 4-5: Tax Calculation**
- Integrate Stripe Tax API or manual tax rate table.
- Calculate tax based on operator and client locations.

**Day 6-8: Invoice PDF Generation**
- GET /api/v1/invoices/:id/pdf.
- Use Puppeteer to render HTML template to PDF.
- Return PDF file for download.

**Day 9-10: Frontend Invoice UI**
- Invoice creation form with line items.
- Invoice list page with filters.
- Invoice detail page with "Send" button.

**Testing:**
- Integration tests for invoice CRUD.
- Test PDF generation.

**Checklist:**
- [ ] Operator can create, edit, send invoices.
- [ ] Tax calculated correctly.
- [ ] PDF generated and downloadable.
- [ ] All tests pass.

### Week 18-19: Payment Processing

**Reference:** TASK_10_Payment_Processing.md

**Objectives:**
- Site Owners pay invoices via Stripe.
- Payment confirmation.

**Implementation Order:**

**Day 1-2: Payment Intent API**
- POST /api/v1/invoices/:id/payment-intent.
- Create Stripe Payment Intent.
- Return client_secret to frontend.

**Day 3-5: Frontend Payment Form**
- Integrate Stripe Elements.
- Display payment form in modal.
- Handle 3D Secure authentication.

**Day 6-7: Payment Webhooks**
- POST /webhooks/stripe/payments.
- Handle payment_intent.succeeded, payment_intent.payment_failed.
- Update Invoice status to Paid.
- Create Payment record.

**Day 8-10: Payment Confirmation**
- Send emails to Site Owner and Operator on payment success.
- Display payment confirmation in frontend.

**Testing:**
- Integration tests with Stripe test mode.
- Test 3D Secure flow.
- Test payment failures.

**Checklist:**
- [ ] Site Owner can pay invoice via Stripe.
- [ ] Payment confirmed, Invoice status updated.
- [ ] Confirmation emails sent.
- [ ] All tests pass.

### Week 20-21: Payout Disbursement

**Reference:** TASK_11_Payout_Disbursement.md, TASK_13_Payment_Fee_Calculation.md

**Objectives:**
- Stripe Connect onboarding for Operators.
- Automatic payouts after payment received.

**Implementation Order:**

**Day 1-2: Stripe Connect Onboarding**
- POST /api/v1/operators/connect-account.
- Create Stripe Connected Account (Express).
- Generate Account Link, redirect operator to Stripe onboarding.

**Day 3-4: Fee Calculation**
- Calculate platform fees (5% + $0.50).
- Calculate Stripe processing fees (2.9% + $0.30).
- Create Fee records.

**Day 5-7: Payout Worker**
- Background job: Process payout after payment.
- Initiate Stripe Transfer to Connected Account.
- Create Payout record (status: Pending).

**Day 8-9: Payout Webhooks**
- Handle transfer.paid, transfer.failed.
- Update Payout status.
- Send payout confirmation email.

**Day 10: Frontend Payout Dashboard**
- Display payout history, earnings summary.
- "Setup Payouts" button if not connected.

**Testing:**
- Test Stripe Connect onboarding flow.
- Test payout calculation and disbursement (test mode).

**Checklist:**
- [ ] Operator can onboard Stripe Connect account.
- [ ] Payout calculated with fees deducted.
- [ ] Payout transferred to operator's bank.
- [ ] Payout dashboard displays history.
- [ ] All tests pass.

### Week 22: Invoice Notifications

**Reference:** TASK_12_Invoice_Notifications.md

**Objectives:**
- Automated email notifications for invoice lifecycle.
- Overdue reminders.

**Implementation Order:**

**Day 1-3: Email Templates**
- Create HTML email templates:
  - Invoice sent.
  - Payment confirmation (operator and client).
  - Overdue reminders (Day 1, 7, 14).
  - Payout confirmation.
  - Payout failed.

**Day 4-5: Email Sending Worker**
- Background job: Send emails via Postmark or SendGrid.
- Trigger on invoice sent, payment success, payout complete.

**Day 6-7: Overdue Detection Cron**
- Daily cron job: Find invoices where due_date < today and status = Sent.
- Send overdue reminders at Day 1, 7, 14.

**Day 8-9: Notification Preferences**
- Frontend: User settings to enable/disable notifications.

**Testing:**
- Test all email templates render correctly.
- Test overdue cron job.

**Checklist:**
- [ ] Emails sent at correct lifecycle events.
- [ ] Overdue reminders triggered automatically.
- [ ] All tests pass.

### Week 23-24: Invoice Dashboards

**Reference:** TASK_14_Invoice_Dashboard_UI.md

**Objectives:**
- Operator invoice dashboard with metrics.
- Site Owner invoice dashboard.
- Payout dashboard.

**Implementation Order:**

**Day 1-3: Dashboard Metrics API**
- GET /api/v1/invoices/dashboard (total outstanding, paid this month, overdue count).
- GET /api/v1/payouts/dashboard (lifetime earnings, this month, pending).

**Day 4-7: Operator Invoice Dashboard UI**
- Summary metric cards.
- Invoice list with filters and search.
- Export to CSV.

**Day 8-10: Site Owner Invoice Dashboard UI**
- Unpaid invoices section.
- Payment history.

**Day 11-14: Payout Dashboard UI**
- Earnings summary.
- Payout list with fee breakdown.
- Export to CSV.

**Testing:**
- Test dashboard API performance (metrics calculated efficiently).
- Test CSV export.

**Checklist:**
- [ ] Operator invoice dashboard displays metrics accurately.
- [ ] Site Owner can view and pay unpaid invoices.
- [ ] Payout dashboard shows earnings and payout history.
- [ ] All tests pass.

---

## Phase 3: Premium Features (Weeks 25-28)

### Week 25-26: Layered Overlay Comparison

**Reference:** TASK_15_Layered_Overlay_Comparison.md

**Objectives:**
- Premium feature for Professional tier and above.
- Overlay images with adjustable opacity.

**Implementation Order:**

**Day 1-2: Feature Gate**
- API: Check subscription tier before allowing access.
- Frontend: Display upgrade prompt for Free tier users.

**Day 3-5: Canvas Overlay Rendering**
- Load multiple images onto HTML Canvas.
- Apply opacity to each layer.
- Support zoom and pan.

**Day 6-7: Layer Controls**
- UI: Opacity sliders, layer reordering (drag-and-drop).
- Toggle layer visibility.

**Day 8-10: Manual Alignment**
- Arrow buttons to nudge layers (1px increments).
- Reset button.

**Testing:**
- Test feature gate (Free tier blocked).
- Test overlay rendering with varying opacities.

**Checklist:**
- [ ] Premium users can access layered overlay.
- [ ] Overlay renders correctly with opacity adjustments.
- [ ] Manual alignment works.
- [ ] All tests pass.

### Week 27-28: Video Upload

**Reference:** TASK_16_Video_Upload_Premium.md

**Objectives:**
- Business tier feature.
- Video transcoding and adaptive streaming.

**Implementation Order:**

**Day 1-2: Video Upload Flow**
- Extend image upload flow to support video (MP4, MOV).
- Validate file size (500 MB Business, 2 GB Enterprise).

**Day 3-5: Transcoding Worker**
- Use AWS MediaConvert or Mux API.
- Transcode to 1080p, 720p, 480p.
- Generate HLS playlist.

**Day 6-7: Thumbnail Generation**
- Extract frame at 5-second mark using FFmpeg.
- Upload thumbnail to S3.

**Day 8-10: Video Player UI**
- Integrate Video.js or Plyr.
- HLS playback with quality selector.

**Testing:**
- Test video upload and transcoding (end-to-end).
- Test video playback.

**Checklist:**
- [ ] Business tier users can upload videos.
- [ ] Videos transcoded to multiple resolutions.
- [ ] Video player works with HLS adaptive streaming.
- [ ] All tests pass.

---

## Phase 4: Production Readiness and Launch

### Infrastructure Setup

**Terraform Configuration:**
- VPC with public and private subnets.
- RDS PostgreSQL (Multi-AZ for production).
- ElastiCache Redis (cluster mode).
- S3 buckets (separate for uploads, thumbnails, videos).
- CloudFront CDN distribution.
- ECS or EKS cluster for backend and workers.
- Application Load Balancer.

**Environment Variables (Production):**
```
DATABASE_URL=<rds_endpoint>
REDIS_URL=<elasticache_endpoint>
S3_BUCKET_NAME=groundpoint-prod
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
EMAIL_API_KEY=<production_key>
FRONTEND_URL=https://app.groundpoint.com
BACKEND_URL=https://api.groundpoint.com
```

**Monitoring and Alerting:**
- Application monitoring: Datadog, New Relic.
- Error tracking: Sentry.
- Log aggregation: CloudWatch Logs or Logtail.
- Uptime monitoring: Pingdom, UptimeRobot.
- Alerting: PagerDuty or OpsGenie for critical incidents.

**Metrics to Monitor:**
- API response times (p50, p95, p99).
- Error rates (4xx, 5xx).
- Database connection pool usage.
- Redis memory usage.
- S3 storage usage and bandwidth.
- Job queue depth (thumbnail, video, payout workers).
- Stripe webhook delivery success rate.

**Alerts:**
- API error rate > 5%.
- Database connection pool exhausted.
- Redis memory > 80%.
- Job queue depth > 1000.
- Webhook delivery failure.

### Security Hardening

**Pre-Launch Checklist:**
- [ ] All secrets stored in AWS Secrets Manager or Parameter Store.
- [ ] HTTPS enforced for all endpoints (TLS 1.3).
- [ ] Database encrypted at rest (RDS encryption).
- [ ] S3 buckets private, access via pre-signed URLs.
- [ ] Rate limiting configured (API Gateway or middleware).
- [ ] CORS configured correctly (only allow frontend domain).
- [ ] JWT tokens signed with RS256 (not HS256).
- [ ] Input validation on all API endpoints.
- [ ] SQL injection prevention (Prisma parameterized queries).
- [ ] XSS prevention (React sanitizes by default, verify user-generated content).
- [ ] CSRF protection (SameSite cookies, CSRF tokens).
- [ ] Security headers (Helmet.js): CSP, X-Frame-Options, HSTS.
- [ ] Dependencies audited: `npm audit` (fix critical vulnerabilities).
- [ ] Penetration testing completed (external vendor or internal team).

### Performance Optimization

**Pre-Launch Checklist:**
- [ ] Database indexes on all foreign keys and frequently queried columns.
- [ ] Redis caching for expensive queries (dashboard metrics, quota checks).
- [ ] CDN configured for static assets (frontend) and media (images, videos).
- [ ] Image compression (thumbnails JPEG quality 85).
- [ ] Lazy loading for images in timeline (Intersection Observer).
- [ ] API pagination limits enforced (max 100 items per page).
- [ ] Background jobs for heavy operations (PDF generation, video transcoding, emails).
- [ ] Database connection pooling (Prisma default: 10 connections, adjust if needed).
- [ ] Frontend code splitting and lazy loading (Vite/Webpack).

### Backup and Disaster Recovery

**Backup Strategy:**
- **Database:** RDS automated backups (daily), retention 7 days.
- **S3:** Versioning enabled, lifecycle policy to Glacier after 90 days.
- **Configuration:** Terraform state in S3 with versioning.

**Disaster Recovery:**
- **RTO (Recovery Time Objective):** 4 hours.
- **RPO (Recovery Point Objective):** 1 hour (database snapshots hourly).
- **Runbook:** Document steps to restore from backup, redeploy application.

### Launch Checklist

**Final Steps Before Launch:**
- [ ] Staging environment fully tested, mirrors production.
- [ ] Production infrastructure deployed via Terraform.
- [ ] Database migrations run successfully in production.
- [ ] Secrets configured in production (Secrets Manager).
- [ ] Monitoring and alerting active.
- [ ] DNS configured (app.groundpoint.com, api.groundpoint.com).
- [ ] SSL certificates installed (Let's Encrypt or AWS Certificate Manager).
- [ ] First operator test account created in production.
- [ ] Payment processing tested end-to-end (Stripe live mode, small amount).
- [ ] Stripe webhooks configured to production endpoint.
- [ ] Email service configured and tested (send test invoice).
- [ ] Terms of Service and Privacy Policy live on website.
- [ ] Support email/chat configured.
- [ ] Launch announcement prepared (blog post, social media, email to waitlist).

**Launch Day:**
- [ ] Deploy to production (blue-green or canary deployment).
- [ ] Monitor logs and error rates closely for first 24 hours.
- [ ] Respond to customer support inquiries promptly.
- [ ] Celebrate with team!

---

## Testing Strategy Workflow

### Local Testing (Developer)

**Daily Workflow:**
- Run linter: `npm run lint` (fix issues before committing).
- Run unit tests: `npm test` (ensure all pass).
- Manual testing: Test feature in browser, verify UI/UX.
- Commit with clear message: `git commit -m "feat: Add invoice PDF generation"`.

### CI Pipeline (Automated)

**On Every Push:**
- Lint: ESLint frontend and backend.
- Unit tests: Jest tests for services, utilities.
- Integration tests: API tests with test database.
- Build: Compile TypeScript, build frontend.
- Report: Test coverage report (aim for 80%+ coverage on critical code).

### Staging Testing (QA)

**Before Production Deployment:**
- Deploy to staging environment.
- Run E2E tests (Playwright): Full user flows.
- Manual QA: Test all features, edge cases.
- Load testing: Simulate 1000 concurrent users (k6).
- Security testing: OWASP ZAP scan.
- Fix bugs, repeat until all tests pass.

### Production Monitoring (Post-Launch)

**Ongoing:**
- Monitor error rates, response times (Datadog dashboard).
- Triage errors (Sentry alerts).
- User feedback: Support tickets, feature requests.
- Weekly review: Metrics, performance, user satisfaction.
- Iterate: Plan next sprint based on data and feedback.

---

## Payment System Testing Workflow

### Stripe Test Mode Setup

**Environment:** Development and Staging

**Steps:**
1. Create Stripe test account at https://dashboard.stripe.com/test.
2. Create test products and prices for subscription tiers.
3. Note test API keys:
   - Secret key: `sk_test_...`
   - Publishable key: `pk_test_...`
   - Webhook signing secret: `whsec_...`
4. Configure webhook endpoints in Stripe Dashboard:
   - Subscriptions: `https://staging.api.groundpoint.com/webhooks/stripe/subscriptions`
   - Payments: `https://staging.api.groundpoint.com/webhooks/stripe/payments`
   - Connect: `https://staging.api.groundpoint.com/webhooks/stripe/connect`
5. Test events: Use Stripe CLI `stripe listen --forward-to localhost:4000/webhooks/stripe/subscriptions`.

**Test Cards:**
- Success: `4242 4242 4242 4242` (any CVC, future expiry).
- Decline: `4000 0000 0000 0002`.
- 3D Secure: `4000 0025 0000 3155`.
- Insufficient funds: `4000 0000 0000 9995`.

### Invoice and Payment Testing Workflow

**Scenario 1: Create and Send Invoice**
1. Operator logs in (test account).
2. Creates invoice for test client ($100, due in 30 days).
3. Saves as draft, verifies calculations (subtotal, tax, total).
4. Sends invoice, verifies email received (check email inbox or logs).
5. Client receives email with invoice link.

**Scenario 2: Client Pays Invoice**
1. Client opens invoice link (unique token).
2. Clicks "Pay Invoice", payment modal opens.
3. Enters test card `4242 4242 4242 4242`.
4. Submits payment.
5. Stripe processes payment (test mode, instant).
6. Webhook received, invoice status updated to Paid.
7. Confirmation emails sent to client and operator.

**Scenario 3: Payout to Operator**
1. After invoice paid, payout job enqueued.
2. Platform calculates fees (5% + $0.50 + Stripe fee).
3. Net payout calculated ($100 - ~$6 = ~$94).
4. Stripe Transfer initiated to operator's Connected Account (test mode, instant).
5. Webhook received, payout status updated to Paid.
6. Operator receives payout confirmation email.

**Scenario 4: Overdue Invoice Reminder**
1. Create invoice with due date yesterday.
2. Run overdue detection cron job (manually trigger or wait for scheduled run).
3. Verify overdue reminder email sent to client.
4. Invoice status updated to Overdue.

**Scenario 5: Refund**
1. Superadmin logs in.
2. Navigates to paid invoice.
3. Clicks "Refund", confirms.
4. Stripe refund processed (test mode).
5. Invoice status updated to Refunded.
6. Payout reversed (deducted from operator's future payouts or held balance).
7. Notifications sent to client and operator.

### Stripe Connect Testing (Operator Onboarding)

**Scenario: Operator Sets Up Payouts**
1. Operator logs in, navigates to Payouts dashboard.
2. Clicks "Setup Payouts".
3. Redirected to Stripe Connect onboarding (test mode).
4. Fills test business details:
   - Business name: "Test Drone Ops".
   - Business type: Individual.
   - Country: United States.
   - Bank account: Use Stripe test routing and account numbers (see Stripe docs).
5. Uploads test ID document (any image file works in test mode).
6. Completes onboarding, redirected back to platform.
7. Backend receives `account.updated` webhook, stores `connected_account_id`.
8. Dashboard shows "Payouts connected" status.

**Verification:**
- GET /api/v1/operators/connect-account/status returns `payouts_enabled: true`.

---

## Deployment Workflow

### Staging Deployment

**Trigger:** Merge to `develop` branch.

**Steps:**
1. CI pipeline builds Docker images (frontend, backend, workers).
2. Push images to container registry (Docker Hub, ECR).
3. Deploy to staging ECS/EKS cluster.
4. Run database migrations (if any).
5. Smoke tests: Health check endpoints return 200.
6. Notify team in Slack: "Staging deployed, version X.Y.Z".

### Production Deployment

**Trigger:** Manual approval after staging testing complete.

**Steps:**
1. Create production release branch: `release/v1.0.0`.
2. Tag release: `git tag v1.0.0`.
3. CI pipeline builds production Docker images.
4. Blue-Green deployment:
   - Deploy to "green" environment (duplicate of production).
   - Run smoke tests on green.
   - If successful, switch traffic to green (update load balancer target group).
   - Keep blue environment running for 1 hour (rollback if issues).
   - If stable, decommission blue.
5. Run database migrations (if any, during low-traffic window).
6. Monitor logs and metrics closely for first 30 minutes.
7. Announce deployment in team chat.

**Rollback Plan:**
- If critical issue detected, switch traffic back to blue environment.
- Investigate issue in green environment.
- Fix and redeploy when ready.

---

## Troubleshooting Common Issues

### Issue: Database Connection Pool Exhausted

**Symptoms:** API responds with "Too many connections" error.

**Solution:**
- Increase Prisma connection pool size: `{ datasources: { db: { connectionLimit: 20 } } }`.
- Scale database instance vertically (more CPU/RAM).
- Review long-running queries, optimize or kill.

### Issue: Redis Out of Memory

**Symptoms:** Redis commands fail with OOM error.

**Solution:**
- Increase Redis instance memory.
- Review cached data, set shorter TTLs.
- Implement LRU eviction policy.

### Issue: Stripe Webhook Delivery Failures

**Symptoms:** Webhooks not received, subscription status not updating.

**Solution:**
- Check webhook endpoint in Stripe Dashboard (correct URL, responds 200 OK).
- Verify webhook signing secret matches environment variable.
- Review webhook logs in Stripe Dashboard (delivery attempts, errors).
- Implement retry logic in webhook handler (idempotency).

### Issue: S3 Upload Failures

**Symptoms:** Pre-signed URL returns 403 Forbidden.

**Solution:**
- Verify S3 bucket policy allows PutObject with pre-signed URL.
- Check IAM role permissions (backend needs s3:PutObject).
- Ensure pre-signed URL not expired (10-minute TTL).

### Issue: Slow API Response Times

**Symptoms:** API p95 response time > 1 second.

**Solution:**
- Review slow query log (PostgreSQL).
- Add database indexes on frequently queried columns.
- Cache expensive queries in Redis.
- Optimize N+1 queries (use Prisma `include` for eager loading).
- Profile backend code (Node.js `--prof` or Clinic.js).

### Issue: Email Delivery Failures

**Symptoms:** Emails not received by users.

**Solution:**
- Check email service dashboard (Postmark, SendGrid) for bounces or complaints.
- Verify SPF, DKIM, DMARC records configured correctly.
- Test with different email providers (Gmail, Outlook, etc.).
- Review email templates for spam triggers (excessive links, ALL CAPS).
- Whitelist platform sending domain if emails going to spam.

---

## Appendix: Key Commands Reference

### Development Commands

```bash
# Start local services
docker-compose up -d

# Run database migrations
cd backend && npx prisma migrate dev

# Start backend
cd backend && npm run dev

# Start frontend
cd frontend && npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Build for production
npm run build
```

### Production Commands

```bash
# Deploy via Terraform
cd infrastructure/terraform
terraform init
terraform plan
terraform apply

# Deploy Docker images
docker build -t groundpoint-backend:v1.0.0 ./backend
docker push groundpoint-backend:v1.0.0

# Run database migrations (production)
kubectl exec -it backend-pod -- npm run migrate:deploy

# View logs
kubectl logs -f deployment/backend
```

### Stripe CLI Commands

```bash
# Listen to webhooks locally
stripe listen --forward-to localhost:4000/webhooks/stripe/subscriptions

# Trigger test webhook
stripe trigger payment_intent.succeeded
```

---

## Final Notes

This STATE.md document is a living guide. Update it as the project evolves, new features are added, and lessons are learned. The goal is to enable any engineer to pick up this document and build the platform systematically without ambiguity.

===== END FILE: STATE.md =====
