# GroundPoint - DigitalOcean Droplet Deployment Guide

**Quick and cost-effective deployment on DigitalOcean**

---

## Overview

This guide will deploy GroundPoint on a single DigitalOcean Droplet with:
- Backend API (Node.js/Express)
- Frontend (React SPA)
- PostgreSQL database
- Redis cache
- Nginx reverse proxy
- SSL certificate (Let's Encrypt)

**Estimated Monthly Cost**: $24-48/month (depending on droplet size)

---

## Step 1: Create DigitalOcean Droplet

### 1.1 Sign Up & Create Droplet

1. Sign up at https://www.digitalocean.com
2. Click **Create** → **Droplets**
3. Choose configuration:

**Image**: Ubuntu 22.04 LTS

**Droplet Size**:
- **Development/Testing**: Basic - $12/month (2 GB RAM, 1 vCPU, 50 GB SSD)
- **Production**: Basic - $24/month (4 GB RAM, 2 vCPU, 80 GB SSD) ✅ Recommended
- **High Traffic**: Basic - $48/month (8 GB RAM, 4 vCPU, 160 GB SSD)

**Datacenter Region**: Choose closest to your users (e.g., New York, San Francisco, London)

**Authentication**:
- ✅ **SSH Key** (recommended) - Upload your public key
- Or use Password (less secure)

**Additional Options**:
- ✅ Enable IPv6
- ✅ Enable Monitoring
- Add tags: `groundpoint`, `production`

4. Click **Create Droplet**
5. Wait 1-2 minutes for droplet to be ready
6. Note the IP address (e.g., `143.198.123.45`)

---

## Step 2: Initial Server Setup

### 2.1 Connect to Droplet

```bash
# Replace with your droplet IP
ssh root@143.198.123.45
```

### 2.2 Update System

```bash
# Update package lists
apt update

# Upgrade installed packages
apt upgrade -y

# Install essential packages
apt install -y curl wget git build-essential
```

### 2.3 Create Non-Root User

```bash
# Create user 'groundpoint'
adduser groundpoint

# Add to sudo group
usermod -aG sudo groundpoint

# Switch to new user
su - groundpoint
```

---

## Step 3: Install Node.js 18

```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x
```

---

## Step 4: Install PostgreSQL

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE groundpoint;
CREATE USER groundpoint_user WITH ENCRYPTED PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE groundpoint TO groundpoint_user;
\q
EOF

# Test connection
psql -h localhost -U groundpoint_user -d groundpoint -c "SELECT version();"
```

---

## Step 5: Install Redis

```bash
# Install Redis
sudo apt install -y redis-server

# Start and enable Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Test Redis
redis-cli ping  # Should return PONG
```

---

## Step 6: Install Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Allow Nginx through firewall
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

Test: Visit `http://YOUR_DROPLET_IP` - you should see Nginx welcome page.

---

## Step 7: Configure Domain (Optional but Recommended)

### 7.1 Point Domain to Droplet

In your domain registrar (GoDaddy, Namecheap, etc.):

1. Add **A Record**:
   - Host: `@`
   - Points to: `YOUR_DROPLET_IP`
   - TTL: 3600

2. Add **A Record** for API subdomain:
   - Host: `api`
   - Points to: `YOUR_DROPLET_IP`
   - TTL: 3600

Wait 5-30 minutes for DNS propagation.

Verify:
```bash
dig your-domain.com +short
dig api.your-domain.com +short
# Should return your droplet IP
```

---

## Step 8: Deploy Backend

### 8.1 Clone Repository

```bash
# Navigate to home directory
cd ~

# Clone repository
git clone https://github.com/your-username/GroundPoint.git
cd GroundPoint

# Checkout feature branch
git checkout claude/drone-saas-architecture-deliverables-011CV4nFvuXYrHzcVKEzAE9d

# Navigate to backend
cd backend
```

### 8.2 Create Environment File

```bash
# Create .env file
nano .env
```

Add the following (replace placeholders with your values):

```env
NODE_ENV=production
PORT=4000

# Database (use localhost for same droplet)
DATABASE_URL=postgresql://groundpoint_user:your_secure_password_here@localhost:5432/groundpoint?schema=public

# Redis
REDIS_URL=redis://localhost:6379

# JWT Secrets (generate with: openssl rand -base64 32)
JWT_SECRET=GENERATE_RANDOM_32_CHAR_SECRET_HERE
JWT_REFRESH_SECRET=GENERATE_ANOTHER_RANDOM_SECRET_HERE
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# AWS S3 (get from AWS console)
S3_ENDPOINT=https://s3.amazonaws.com
S3_BUCKET=groundpoint-uploads
S3_ACCESS_KEY=YOUR_AWS_ACCESS_KEY
S3_SECRET_KEY=YOUR_AWS_SECRET_KEY
S3_REGION=us-east-1

# Stripe (get from Stripe dashboard)
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_CONNECT_CLIENT_ID=ca_xxxxx
STRIPE_CONNECT_REDIRECT_URI=https://your-domain.com/payouts/setup/complete

# Platform Fees
PLATFORM_FEE_PERCENT=5.0
PLATFORM_FIXED_FEE=0.50

# SendGrid Email
EMAIL_API_KEY=SG.xxxxx
EMAIL_FROM_ADDRESS=noreply@your-domain.com
EMAIL_FROM_NAME=GroundPoint

# URLs
APP_URL=https://api.your-domain.com
FRONTEND_URL=https://your-domain.com

# Admin
ADMIN_EMAIL=admin@your-domain.com
LOG_LEVEL=info

# Queues
THUMBNAIL_QUEUE_NAME=thumbnail-generation
PAYOUT_QUEUE_NAME=payout-processing
EMAIL_QUEUE_NAME=email-notifications
```

Save with `Ctrl+X`, then `Y`, then `Enter`.

### 8.3 Install Dependencies & Run Migrations

```bash
# Install dependencies
npm ci --production

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# (Optional) Seed initial data
npx prisma db seed
```

### 8.4 Install PM2 (Process Manager)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start backend with PM2
pm2 start npm --name "groundpoint-api" -- start

# Configure PM2 to start on boot
pm2 startup systemd
# Copy and run the command it outputs (sudo env PATH=...)

# Save PM2 process list
pm2 save

# Check status
pm2 status
pm2 logs groundpoint-api
```

---

## Step 9: Deploy Frontend

### 9.1 Build Frontend

```bash
# Navigate to frontend directory
cd ~/GroundPoint/frontend

# Create .env file
nano .env
```

Add:

```env
VITE_API_URL=https://api.your-domain.com/api/v1
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
```

Save and exit.

```bash
# Install dependencies
npm ci

# Build for production
npm run build

# Output is in dist/ directory
```

### 9.2 Copy Build to Nginx Directory

```bash
# Create web directory
sudo mkdir -p /var/www/groundpoint

# Copy build files
sudo cp -r dist/* /var/www/groundpoint/

# Set ownership
sudo chown -R www-data:www-data /var/www/groundpoint
```

---

## Step 10: Configure Nginx

### 10.1 Create Nginx Configuration

```bash
# Remove default config
sudo rm /etc/nginx/sites-enabled/default

# Create GroundPoint config
sudo nano /etc/nginx/sites-available/groundpoint
```

Add the following:

```nginx
# API Backend
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Increase timeout for large file uploads
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}

# Frontend
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    root /var/www/groundpoint;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Save and exit.

### 10.2 Enable Configuration

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/groundpoint /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

Test: Visit `http://api.your-domain.com/health` - should return JSON response.

---

## Step 11: Setup SSL/HTTPS (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificates (interactive)
sudo certbot --nginx -d your-domain.com -d www.your-domain.com -d api.your-domain.com

# Follow prompts:
# - Enter email address
# - Agree to Terms of Service
# - Choose to redirect HTTP to HTTPS (recommended)

# Verify certificates
sudo certbot certificates

# Test auto-renewal
sudo certbot renew --dry-run
```

Certbot will automatically:
- Obtain SSL certificates
- Update Nginx configuration
- Set up auto-renewal (cron job)

Test HTTPS: Visit `https://your-domain.com` and `https://api.your-domain.com`

---

## Step 12: Configure Stripe Webhook

Now that you have a public URL, update Stripe webhook:

1. Go to https://dashboard.stripe.com/webhooks
2. Click your webhook endpoint
3. Update URL to: `https://api.your-domain.com/api/v1/webhooks/stripe`
4. Test webhook with "Send test webhook" button

---

## Step 13: Test the Deployment

### Backend Health Check

```bash
curl https://api.your-domain.com/health
# Expected: {"status":"ok","timestamp":"2025-11-14T..."}
```

### Create Test User

```bash
curl -X POST https://api.your-domain.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!",
    "name": "Test User",
    "organizationType": "OPERATOR"
  }'
```

### Test Frontend

1. Visit `https://your-domain.com`
2. Click "Register" and create account
3. Login with credentials
4. Test uploading an image
5. Test creating an invoice
6. Test subscription upgrade

---

## Step 14: Monitoring & Maintenance

### View Backend Logs

```bash
# Real-time logs
pm2 logs groundpoint-api

# Last 100 lines
pm2 logs groundpoint-api --lines 100

# Error logs only
pm2 logs groundpoint-api --err
```

### Monitor Server Resources

```bash
# Install htop
sudo apt install htop

# Monitor CPU, RAM, processes
htop

# Check disk space
df -h

# Check memory usage
free -h
```

### Database Backups

Create automated backup script:

```bash
# Create backup directory
mkdir -p ~/backups

# Create backup script
nano ~/backup-db.sh
```

Add:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$HOME/backups"
DB_NAME="groundpoint"
DB_USER="groundpoint_user"

# Create backup
PGPASSWORD='your_secure_password_here' pg_dump -U $DB_USER -h localhost $DB_NAME | gzip > "$BACKUP_DIR/groundpoint_$DATE.sql.gz"

# Keep only last 7 days of backups
find $BACKUP_DIR -name "groundpoint_*.sql.gz" -mtime +7 -delete

echo "Backup completed: groundpoint_$DATE.sql.gz"
```

Make executable and schedule:

```bash
# Make executable
chmod +x ~/backup-db.sh

# Add to crontab (daily at 2 AM)
crontab -e

# Add this line:
0 2 * * * /home/groundpoint/backup-db.sh >> /home/groundpoint/backup.log 2>&1
```

### Update Application

```bash
# Navigate to repository
cd ~/GroundPoint

# Pull latest changes
git pull origin claude/drone-saas-architecture-deliverables-011CV4nFvuXYrHzcVKEzAE9d

# Backend updates
cd backend
npm ci --production
npx prisma generate
npx prisma migrate deploy
pm2 restart groundpoint-api

# Frontend updates
cd ../frontend
npm ci
npm run build
sudo rm -rf /var/www/groundpoint/*
sudo cp -r dist/* /var/www/groundpoint/
sudo chown -R www-data:www-data /var/www/groundpoint
```

---

## Step 15: Security Hardening

### Configure Firewall

```bash
# Check UFW status
sudo ufw status

# Should show:
# 80/tcp (Nginx)
# 443/tcp (Nginx)
# 22/tcp (OpenSSH)

# If not, configure:
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### Disable Root SSH Login

```bash
sudo nano /etc/ssh/sshd_config
```

Find and change:
```
PermitRootLogin no
PasswordAuthentication no  # If using SSH keys
```

Restart SSH:
```bash
sudo systemctl restart ssh
```

### Setup Fail2Ban (Prevent Brute Force)

```bash
# Install Fail2Ban
sudo apt install -y fail2ban

# Start and enable
sudo systemctl start fail2ban
sudo systemctl enable fail2ban

# Check status
sudo fail2ban-client status
```

---

## Troubleshooting

### Backend Won't Start

```bash
# Check logs
pm2 logs groundpoint-api --err

# Common issues:
# - Database connection: Verify DATABASE_URL
# - Redis connection: Check Redis is running (sudo systemctl status redis)
# - Port 4000 in use: Change PORT in .env
```

### Frontend Shows 404

```bash
# Check Nginx error log
sudo tail -f /var/log/nginx/error.log

# Verify files exist
ls -la /var/www/groundpoint/

# Rebuild frontend
cd ~/GroundPoint/frontend
npm run build
sudo cp -r dist/* /var/www/groundpoint/
```

### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew manually
sudo certbot renew

# Check Nginx configuration
sudo nginx -t
```

### Database Connection Failed

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -h localhost -U groundpoint_user -d groundpoint

# Check password in .env matches database user
```

---

## Cost Breakdown

**DigitalOcean Droplet**: $24/month (4GB RAM recommended)
**Domain Name**: ~$12/year
**AWS S3**: ~$1-5/month (pay for what you use)
**SendGrid**: Free tier (100 emails/day) or $20/month (40k emails)
**Stripe**: Transaction fees only (2.9% + $0.30 per transaction)

**Total Estimated Monthly Cost**: $25-30/month for low-traffic production site

---

## Next Steps

1. ✅ Deploy to DigitalOcean Droplet
2. ✅ Configure domain and SSL
3. ✅ Test all features thoroughly
4. [ ] Setup monitoring alerts (DigitalOcean Monitoring or UptimeRobot)
5. [ ] Configure automated backups
6. [ ] Setup staging environment (separate droplet)
7. [ ] Load testing
8. [ ] Production launch! 🚀

---

## Additional Resources

- **DigitalOcean Tutorials**: https://www.digitalocean.com/community/tutorials
- **PM2 Documentation**: https://pm2.keymetrics.io/docs/usage/quick-start/
- **Nginx Documentation**: https://nginx.org/en/docs/
- **Let's Encrypt**: https://letsencrypt.org/getting-started/

---

**Ready to deploy!** Follow this guide step-by-step and you'll have GroundPoint running in production within 1-2 hours.

**Questions?** Review DEPLOYMENT.md for detailed service configuration (Stripe, SendGrid, S3).
