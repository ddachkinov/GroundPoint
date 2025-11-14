# GroundPoint Deployment Guide

**Last Updated**: 2025-11-14
**Branch**: `claude/drone-saas-architecture-deliverables-011CV4nFvuXYrHzcVKEzAE9d`

---

## Prerequisites

Before deploying, ensure you have accounts and access to:

- ✅ PostgreSQL database (AWS RDS, Heroku Postgres, or local)
- ✅ Redis instance (AWS ElastiCache, Redis Cloud, or local)
- ✅ AWS S3 bucket (for image/video storage)
- ✅ Stripe account with Connect enabled
- ✅ SendGrid account (or compatible email service)
- ✅ Node.js 18+ installed
- ✅ npm or yarn package manager

---

## Step 1: Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd GroundPoint

# Checkout the feature branch
git checkout claude/drone-saas-architecture-deliverables-011CV4nFvuXYrHzcVKEzAE9d

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

## Step 2: Environment Variables Setup

### Backend Environment Variables

Create `/backend/.env` file with the following variables:

```env
# ============================================
# BASIC CONFIGURATION
# ============================================
NODE_ENV=production
PORT=4000

# ============================================
# DATABASE & REDIS
# ============================================
# PostgreSQL connection string
DATABASE_URL=postgresql://user:password@host:5432/groundpoint?schema=public

# Redis connection string
REDIS_URL=redis://host:6379

# ============================================
# JWT AUTHENTICATION
# ============================================
# Generate with: openssl rand -base64 32
JWT_SECRET=your-jwt-secret-here-32-chars-min
JWT_REFRESH_SECRET=your-refresh-secret-here-32-chars-min
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# ============================================
# AWS S3 STORAGE
# ============================================
S3_ENDPOINT=https://s3.amazonaws.com
S3_BUCKET=groundpoint-uploads
S3_ACCESS_KEY=your-aws-access-key
S3_SECRET_KEY=your-aws-secret-key
S3_REGION=us-east-1

# ============================================
# STRIPE PAYMENT INTEGRATION
# ============================================
# Get from: https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_test_xxxxx  # Use sk_live_xxxxx for production
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx  # Use pk_live_xxxxx for production

# Get from: https://dashboard.stripe.com/webhooks
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Get from: https://dashboard.stripe.com/settings/applications
STRIPE_CONNECT_CLIENT_ID=ca_xxxxx
STRIPE_CONNECT_REDIRECT_URI=https://your-domain.com/payouts/setup/complete

# ============================================
# PLATFORM FEE CONFIGURATION
# ============================================
PLATFORM_FEE_PERCENT=5.0
PLATFORM_FIXED_FEE=0.50

# ============================================
# EMAIL SERVICE (SendGrid)
# ============================================
# Get from: https://app.sendgrid.com/settings/api_keys
EMAIL_API_KEY=SG.xxxxx
EMAIL_FROM_ADDRESS=noreply@groundpoint.com
EMAIL_FROM_NAME=GroundPoint

# ============================================
# APPLICATION URLS
# ============================================
APP_URL=https://api.your-domain.com
FRONTEND_URL=https://your-domain.com

# ============================================
# ADMIN & LOGGING
# ============================================
ADMIN_EMAIL=admin@groundpoint.com
LOG_LEVEL=info

# ============================================
# BACKGROUND JOB QUEUES
# ============================================
THUMBNAIL_QUEUE_NAME=thumbnail-generation
PAYOUT_QUEUE_NAME=payout-processing
EMAIL_QUEUE_NAME=email-notifications
```

### Frontend Environment Variables

Create `/frontend/.env` file:

```env
# Backend API URL
VITE_API_URL=https://api.your-domain.com/api/v1

# Stripe Publishable Key (must match backend)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx  # Use pk_live_xxxxx for production
```

---

## Step 3: Database Setup

### Run Prisma Migrations

```bash
cd backend

# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# (Optional) Seed initial data
npx prisma db seed
```

### Verify Database Schema

```bash
# Open Prisma Studio to inspect database
npx prisma studio
```

Expected tables:
- users
- organizations
- projects
- sites
- captures
- invoices
- invoice_line_items
- payments
- fees
- payouts
- subscriptions
- notifications

---

## Step 4: Stripe Configuration

### 1. Create Stripe Account
- Sign up at https://stripe.com
- Verify your business information
- Enable Stripe Connect

### 2. Get API Keys
- Navigate to: https://dashboard.stripe.com/apikeys
- Copy **Secret Key** and **Publishable Key**
- Add to `.env` files (both backend and frontend)

### 3. Create Subscription Products

In Stripe Dashboard:
1. Go to **Products** → **Add product**
2. Create 3 products:

**Starter Plan**:
- Name: Starter
- Monthly Price: $0 (Free)
- Price ID: Save this as `STRIPE_STARTER_PRICE_ID`

**Professional Plan**:
- Name: Professional
- Monthly Price: $49
- Yearly Price: $490 (Save as `STRIPE_PROFESSIONAL_YEARLY_PRICE_ID`)
- Price IDs: Save both monthly and yearly

**Business Plan**:
- Name: Business
- Monthly Price: $149
- Yearly Price: $1,490
- Price IDs: Save both

**Enterprise Plan**:
- Name: Enterprise
- Monthly Price: $499
- Yearly Price: $4,990
- Price IDs: Save both

### 4. Configure Webhooks

1. Go to: https://dashboard.stripe.com/webhooks
2. Click **Add endpoint**
3. Endpoint URL: `https://api.your-domain.com/api/v1/webhooks/stripe`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
   - `transfer.paid`
   - `transfer.failed`
5. Save and copy **Webhook signing secret** to `STRIPE_WEBHOOK_SECRET` in `.env`

### 5. Enable Stripe Connect

1. Go to: https://dashboard.stripe.com/settings/connect
2. Enable **Express accounts**
3. Configure branding (logo, colors)
4. Copy **Connect Client ID** to `.env`

---

## Step 5: Email Service Setup (SendGrid)

### 1. Create SendGrid Account
- Sign up at https://sendgrid.com
- Verify your email
- Complete sender authentication

### 2. Create API Key
1. Go to: https://app.sendgrid.com/settings/api_keys
2. Click **Create API Key**
3. Name: "GroundPoint API"
4. Permissions: **Full Access**
5. Copy API key to `EMAIL_API_KEY` in `.env`

### 3. Verify Sender Email
1. Go to: https://app.sendgrid.com/settings/sender_auth
2. Verify your sending domain or single sender email
3. Use verified email in `EMAIL_FROM_ADDRESS`

### 4. Test Email Sending

```bash
# From backend directory
node -e "
const { emailClient } = require('./src/config/email.config');
emailClient.send({
  to: 'your-email@example.com',
  subject: 'Test Email',
  html: '<p>Hello from GroundPoint!</p>'
}).then(() => console.log('Email sent!')).catch(console.error);
"
```

---

## Step 6: AWS S3 Setup

### 1. Create S3 Bucket
1. Go to AWS S3 Console: https://s3.console.aws.amazon.com
2. Click **Create bucket**
3. Name: `groundpoint-uploads`
4. Region: `us-east-1` (or your preferred region)
5. **Uncheck** "Block all public access" (we use pre-signed URLs)
6. Enable versioning (optional)
7. Create bucket

### 2. Configure CORS Policy

In your S3 bucket:
1. Go to **Permissions** → **CORS**
2. Add this configuration:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["https://your-domain.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```

### 3. Create IAM User

1. Go to IAM Console: https://console.aws.amazon.com/iam
2. Create user: `groundpoint-s3-user`
3. Attach policy: `AmazonS3FullAccess` (or create custom policy)
4. Create access key
5. Copy **Access Key ID** and **Secret Access Key** to `.env`

### 4. Test S3 Upload

```bash
# From backend directory
node -e "
const { s3Client } = require('./src/config/s3.config');
const fs = require('fs');
s3Client.upload({
  Key: 'test.txt',
  Body: Buffer.from('Hello S3!'),
  ContentType: 'text/plain'
}).then(url => console.log('Uploaded:', url)).catch(console.error);
"
```

---

## Step 7: Build and Deploy Backend

### Build Backend

```bash
cd backend

# Install production dependencies
npm ci --production

# Build TypeScript (if using build step)
npm run build

# Start server
npm start
```

### Deploy to Production Server

**Option A: Manual Deploy (PM2)**

```bash
# Install PM2 globally
npm install -g pm2

# Start backend with PM2
pm2 start npm --name "groundpoint-api" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to restart on reboot
pm2 startup
```

**Option B: Docker**

Create `backend/Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npx prisma generate
EXPOSE 4000
CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t groundpoint-api .
docker run -d -p 4000:4000 --env-file .env groundpoint-api
```

**Option C: Deploy to Heroku**

```bash
# Login to Heroku
heroku login

# Create app
heroku create groundpoint-api

# Add PostgreSQL and Redis addons
heroku addons:create heroku-postgresql:mini
heroku addons:create heroku-redis:mini

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret

# Deploy
git push heroku claude/drone-saas-architecture-deliverables-011CV4nFvuXYrHzcVKEzAE9d:main

# Run migrations
heroku run npx prisma migrate deploy
```

---

## Step 8: Build and Deploy Frontend

### Build Frontend

```bash
cd frontend

# Install dependencies
npm ci

# Build for production
npm run build

# Output will be in /dist directory
```

### Deploy Frontend

**Option A: Netlify**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod --dir=dist
```

**Option B: Vercel**

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

**Option C: AWS S3 + CloudFront**

```bash
# Upload to S3
aws s3 sync dist/ s3://your-frontend-bucket --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

**Option D: Traditional Server (Nginx)**

```bash
# Copy build files to server
scp -r dist/* user@server:/var/www/groundpoint/

# Configure Nginx
sudo nano /etc/nginx/sites-available/groundpoint
```

Nginx configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/groundpoint;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Step 9: SSL/HTTPS Setup

### Using Certbot (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Generate SSL certificate
sudo certbot --nginx -d your-domain.com -d api.your-domain.com

# Auto-renewal (cron job)
sudo certbot renew --dry-run
```

---

## Step 10: Testing Checklist

### Backend Health Check

```bash
# Test API health endpoint
curl https://api.your-domain.com/health
# Expected: {"status":"ok","timestamp":"..."}
```

### Authentication Testing

```bash
# 1. Register new user
curl -X POST https://api.your-domain.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "name": "Test User",
    "organizationType": "OPERATOR"
  }'

# 2. Login
curl -X POST https://api.your-domain.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
# Save the accessToken from response
```

### Subscription Testing

1. Go to `https://your-domain.com/pricing`
2. Click "Upgrade to Professional"
3. Complete Stripe checkout with test card: `4242 4242 4242 4242`
4. Verify subscription created in Stripe Dashboard
5. Check user's subscription tier in database

### Invoice & Payment Testing

1. Create invoice via API or UI
2. Send invoice to test email
3. Verify email received with payment link
4. Click payment link and pay with test card
5. Verify:
   - Payment succeeded webhook received
   - Invoice status changed to PAID
   - Fee records created
   - Payout created automatically
   - Email confirmations sent

### Stripe Connect Testing (Payout)

1. Login as operator
2. Navigate to `/payouts/setup`
3. Complete Stripe Connect onboarding
4. Verify account connected
5. Make a test payment
6. Check payout created and scheduled

### Email Testing

Check your inbox for:
- [ ] Welcome email (if implemented)
- [ ] Invoice sent notification
- [ ] Payment confirmation (client)
- [ ] Payment confirmation (operator)
- [ ] Payout confirmation

### File Upload Testing

1. Create project and site
2. Upload drone image
3. Verify image appears in S3 bucket
4. Verify pre-signed URL works
5. Check thumbnail generated

---

## Step 11: Monitoring & Logging

### Backend Logs

```bash
# PM2 logs
pm2 logs groundpoint-api

# View error logs
pm2 logs groundpoint-api --err

# Heroku logs
heroku logs --tail --app groundpoint-api
```

### Stripe Dashboard Monitoring

Monitor in Stripe Dashboard:
- Payments: https://dashboard.stripe.com/payments
- Subscriptions: https://dashboard.stripe.com/subscriptions
- Webhooks: https://dashboard.stripe.com/webhooks
- Connect: https://dashboard.stripe.com/connect/accounts

### Database Monitoring

```bash
# Check database connections
npx prisma db execute --sql "SELECT count(*) FROM pg_stat_activity"

# View recent payments
npx prisma db execute --sql "SELECT * FROM payments ORDER BY created_at DESC LIMIT 10"
```

---

## Step 12: Common Issues & Troubleshooting

### Issue: Webhook Signature Verification Failed

**Solution**: Verify `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard webhook secret exactly.

```bash
# Test webhook locally with Stripe CLI
stripe listen --forward-to localhost:4000/api/v1/webhooks/stripe
```

### Issue: Email Not Sending

**Solutions**:
1. Verify SendGrid API key is valid
2. Check sender email is verified
3. Review SendGrid activity logs
4. Check email service rate limits

### Issue: S3 Upload Fails

**Solutions**:
1. Verify AWS credentials are correct
2. Check bucket name matches `.env`
3. Verify IAM user has S3 permissions
4. Check CORS policy allows your domain

### Issue: Database Connection Failed

**Solutions**:
1. Verify `DATABASE_URL` is correct
2. Check PostgreSQL is running
3. Verify database accepts connections from your IP
4. Run `npx prisma db pull` to test connection

### Issue: Payment Intent Creation Fails

**Solutions**:
1. Verify Stripe secret key is for correct environment (test vs live)
2. Check invoice exists and is in SENT or OVERDUE status
3. Verify user has access to invoice
4. Check Stripe Dashboard for error details

---

## Step 13: Production Checklist

Before going live, ensure:

### Security
- [ ] All `.env` files excluded from git (`.gitignore`)
- [ ] Using production Stripe keys (not test keys)
- [ ] JWT secrets are strong (32+ characters)
- [ ] HTTPS enabled on all domains
- [ ] CORS configured with production domains only
- [ ] Database has strong password
- [ ] S3 bucket uses pre-signed URLs (not public)

### Stripe Configuration
- [ ] Test mode disabled (using live keys)
- [ ] Webhook endpoint verified and active
- [ ] Subscription products created with correct prices
- [ ] Connect enabled and configured
- [ ] Payment methods enabled (cards, SEPA, etc.)

### Email Configuration
- [ ] Sender domain verified in SendGrid
- [ ] Email templates tested on mobile devices
- [ ] Unsubscribe links working
- [ ] "From" address matches verified domain

### Database
- [ ] Backups configured
- [ ] Migrations applied
- [ ] Indexes created for performance
- [ ] Connection pooling enabled

### Monitoring
- [ ] Error logging configured
- [ ] Uptime monitoring enabled
- [ ] Stripe webhook monitoring
- [ ] Email delivery monitoring

### Testing
- [ ] Authentication flow tested
- [ ] Subscription upgrade/downgrade tested
- [ ] Invoice creation and payment tested
- [ ] Payout disbursement tested
- [ ] Email notifications tested
- [ ] File uploads tested
- [ ] Mobile responsiveness tested

---

## Environment-Specific Notes

### Development Environment
- Use Stripe test keys
- Use local PostgreSQL and Redis
- Email: Use SendGrid sandbox or MailHog for testing
- S3: Can use MinIO for local S3 emulation

### Staging Environment
- Use Stripe test keys
- Use production-like infrastructure
- Email: Use real SendGrid with test recipients
- S3: Use separate staging bucket

### Production Environment
- Use Stripe live keys
- Fully redundant infrastructure
- Email: Real SendGrid with real recipients
- S3: Production bucket with versioning enabled
- Enable all monitoring and alerting

---

## Support & Resources

- **Stripe Documentation**: https://stripe.com/docs
- **Prisma Documentation**: https://www.prisma.io/docs
- **SendGrid Documentation**: https://docs.sendgrid.com
- **AWS S3 Documentation**: https://docs.aws.amazon.com/s3

---

**Deployment Status**: Ready for testing ✅

**Last Updated**: 2025-11-14
