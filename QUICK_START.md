# GroundPoint - Quick Start Guide

**Deploy GroundPoint in 10 minutes using the automated deployment script!**

---

## Prerequisites

Before running the deployment script, have these ready:

### 1. DigitalOcean Droplet
- Create a droplet with **Ubuntu 22.04 LTS**
- Minimum: 4GB RAM, 2 vCPU ($24/month)
- Note the droplet's IP address

### 2. Domain Name (Optional)
- Purchase domain from GoDaddy, Namecheap, etc.
- Point A records to your droplet IP:
  - `@` → Droplet IP
  - `api` → Droplet IP
  - `www` → Droplet IP

### 3. Third-Party Service Credentials

**Stripe** (https://stripe.com):
- Create account and verify business
- Get API keys from: https://dashboard.stripe.com/apikeys
  - Secret Key (sk_test_xxx or sk_live_xxx)
  - Publishable Key (pk_test_xxx or pk_live_xxx)
- Create webhook endpoint (temporarily use `http://your-ip:4000/api/v1/webhooks/stripe`)
  - Copy Webhook Secret (whsec_xxx)
- Enable Stripe Connect: https://dashboard.stripe.com/settings/connect
  - Copy Connect Client ID (ca_xxx)

**SendGrid** (https://sendgrid.com):
- Create free account
- Verify sender email/domain
- Create API key: https://app.sendgrid.com/settings/api_keys
  - Copy API Key (SG.xxx)

**AWS S3** (https://aws.amazon.com/s3):
- Create S3 bucket (e.g., `groundpoint-uploads`)
- Create IAM user with S3 access
- Create access key
  - Copy Access Key ID
  - Copy Secret Access Key

---

## Deployment Steps

### Step 1: Connect to Your Droplet

```bash
ssh root@YOUR_DROPLET_IP
```

### Step 2: Download Deployment Script

```bash
# Download the script
wget https://raw.githubusercontent.com/ddachkinov/GroundPoint/claude/drone-saas-architecture-deliverables-011CV4nFvuXYrHzcVKEzAE9d/deploy.sh

# Make it executable
chmod +x deploy.sh
```

**OR** if you have the repository:

```bash
# Clone repository
git clone https://github.com/ddachkinov/GroundPoint.git
cd GroundPoint
git checkout claude/drone-saas-architecture-deliverables-011CV4nFvuXYrHzcVKEzAE9d

# Make script executable
chmod +x deploy.sh
```

### Step 3: Run Deployment Script

```bash
sudo ./deploy.sh
```

### Step 4: Answer the Prompts

The script will ask you for:

1. **Domain name** (or press Enter to use IP)
2. **Database password** (or press Enter to auto-generate)
3. **Stripe Secret Key** (sk_test_xxx or sk_live_xxx)
4. **Stripe Publishable Key** (pk_test_xxx or pk_live_xxx)
5. **Stripe Webhook Secret** (whsec_xxx)
6. **Stripe Connect Client ID** (ca_xxx)
7. **SendGrid API Key** (SG.xxx)
8. **SendGrid From Email** (noreply@your-domain.com)
9. **AWS S3 Bucket Name**
10. **AWS Access Key ID**
11. **AWS Secret Access Key**
12. **AWS Region** (default: us-east-1)

### Step 5: Wait for Deployment

The script will:
- ✅ Install Node.js, PostgreSQL, Redis, Nginx
- ✅ Clone repository and install dependencies
- ✅ Set up database and run migrations
- ✅ Build frontend and backend
- ✅ Configure Nginx and SSL (if domain provided)
- ✅ Set up automatic backups
- ✅ Apply security hardening

**Time: ~10-15 minutes** (depending on your internet speed)

### Step 6: SSL Certificate (if using domain)

When prompted:
```
Do you want to install SSL now? (y/n):
```

- Type `y` if your DNS is already pointing to the droplet
- Type `n` if you need to wait for DNS propagation (you can run it later)

---

## After Deployment

### 1. Save Your Credentials

The script displays important information:
- Database password
- JWT secrets
- Access URLs

**These are also saved to**: `/root/groundpoint-credentials.txt`

```bash
# View credentials
cat /root/groundpoint-credentials.txt
```

### 2. Update Stripe Webhook URL

1. Go to: https://dashboard.stripe.com/webhooks
2. Click on your webhook endpoint
3. Update URL to: `https://api.your-domain.com/api/v1/webhooks/stripe`
4. Save changes

### 3. Test the Deployment

```bash
# Test backend health
curl https://api.your-domain.com/health
# Expected: {"status":"ok","timestamp":"..."}

# View backend logs
sudo -u groundpoint pm2 logs groundpoint-api

# Check backend status
sudo -u groundpoint pm2 status
```

### 4. Create Your First User

1. Visit `https://your-domain.com`
2. Click **Register**
3. Fill in your details
4. Create account!

---

## What the Script Installs

### Software Installed:
- ✅ Node.js 18.x
- ✅ PostgreSQL 14
- ✅ Redis 6
- ✅ Nginx
- ✅ PM2 (process manager)
- ✅ Certbot (SSL certificates)
- ✅ Fail2Ban (security)

### GroundPoint Components:
- ✅ Backend API (running on PM2)
- ✅ Frontend (served by Nginx)
- ✅ Database (PostgreSQL)
- ✅ Cache (Redis)
- ✅ SSL/HTTPS (Let's Encrypt)
- ✅ Automatic database backups (daily at 2 AM)

---

## Useful Commands

### View Backend Logs
```bash
sudo -u groundpoint pm2 logs groundpoint-api
```

### Restart Backend
```bash
sudo -u groundpoint pm2 restart groundpoint-api
```

### Check Backend Status
```bash
sudo -u groundpoint pm2 status
```

### Monitor Resources
```bash
sudo -u groundpoint pm2 monit
```

### View Nginx Logs
```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

### Database Access
```bash
# Connect to database
sudo -u postgres psql groundpoint

# Inside PostgreSQL:
\dt                    # List tables
SELECT * FROM users;   # Query users
\q                     # Quit
```

### Manual Database Backup
```bash
/home/groundpoint/backup-db.sh
```

### Update Application
```bash
cd /home/groundpoint/GroundPoint

# Pull latest changes
sudo -u groundpoint git pull

# Update backend
cd backend
sudo -u groundpoint npm ci --production
sudo -u groundpoint npx prisma migrate deploy
sudo -u groundpoint pm2 restart groundpoint-api

# Update frontend
cd ../frontend
sudo -u groundpoint npm ci
sudo -u groundpoint npm run build
sudo rm -rf /var/www/groundpoint/*
sudo cp -r dist/* /var/www/groundpoint/
```

### Install SSL Certificate (if skipped during deployment)
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com -d api.your-domain.com
```

---

## Troubleshooting

### Backend Not Starting

```bash
# Check logs for errors
sudo -u groundpoint pm2 logs groundpoint-api --err

# Common issues:
# - Database connection failed: Check DATABASE_URL in .env
# - Redis not running: sudo systemctl status redis
# - Port 4000 in use: Change PORT in .env
```

### Frontend Shows 404

```bash
# Check if files exist
ls -la /var/www/groundpoint/

# Rebuild frontend
cd /home/groundpoint/GroundPoint/frontend
sudo -u groundpoint npm run build
sudo rm -rf /var/www/groundpoint/*
sudo cp -r dist/* /var/www/groundpoint/
```

### SSL Certificate Failed

```bash
# Check DNS is pointing to server
dig +short your-domain.com
# Should return your droplet IP

# Wait 30 minutes for DNS propagation, then retry:
sudo certbot --nginx -d your-domain.com -d www.your-domain.com -d api.your-domain.com
```

### Database Connection Error

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
sudo -u postgres psql -c "SELECT version();"

# Check password in .env matches
cat /home/groundpoint/GroundPoint/backend/.env | grep DATABASE_URL
```

---

## Security Best Practices

After deployment:

1. ✅ Change default SSH port (optional):
   ```bash
   sudo nano /etc/ssh/sshd_config
   # Change Port 22 to Port 2222
   sudo systemctl restart ssh
   ```

2. ✅ Setup SSH key authentication (if not already):
   ```bash
   # On your local machine:
   ssh-copy-id root@your-droplet-ip
   ```

3. ✅ Enable automatic security updates:
   ```bash
   sudo apt install unattended-upgrades
   sudo dpkg-reconfigure -plow unattended-upgrades
   ```

4. ✅ Monitor logs regularly:
   ```bash
   sudo tail -f /var/log/fail2ban.log
   ```

---

## Getting Help

If you encounter issues:

1. Check the logs:
   - Backend: `sudo -u groundpoint pm2 logs groundpoint-api`
   - Nginx: `sudo tail -f /var/log/nginx/error.log`

2. Review the full deployment guides:
   - `DEPLOYMENT.md` - General deployment guide
   - `DIGITALOCEAN_DEPLOYMENT.md` - DigitalOcean specific guide

3. Verify environment variables:
   - Backend: `/home/groundpoint/GroundPoint/backend/.env`
   - Frontend: `/home/groundpoint/GroundPoint/frontend/.env`

---

## Next Steps After Deployment

1. ✅ Create your first user account
2. ✅ Test subscription upgrade with Stripe test card: `4242 4242 4242 4242`
3. ✅ Create a test project and site
4. ✅ Upload your first drone image
5. ✅ Create and send an invoice
6. ✅ Test the complete payment flow
7. ✅ Set up Stripe Connect for payouts

---

## Production Checklist

Before going live with real users:

- [ ] Switch Stripe to **live mode** (change API keys in .env)
- [ ] Update `NODE_ENV=production` in backend .env
- [ ] Verify SSL certificate is working (green padlock in browser)
- [ ] Test all payment flows with real Stripe account
- [ ] Set up monitoring (UptimeRobot, Pingdom, or DigitalOcean Monitoring)
- [ ] Configure email alerts for system issues
- [ ] Test database backups and restoration
- [ ] Review and adjust Nginx rate limiting
- [ ] Set up CDN (CloudFlare) for better performance
- [ ] Configure Stripe webhook monitoring
- [ ] Test all email notifications are being received

---

**Congratulations! Your GroundPoint platform is now deployed and running! 🎉**

Visit your site at: `https://your-domain.com`
