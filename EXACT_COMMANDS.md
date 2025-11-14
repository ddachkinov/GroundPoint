# Exact Commands to Deploy GroundPoint on groundpoint.net

**Copy and paste these commands in order. No configuration knowledge needed!**

---

## Part 1: DNS Setup (Do This First!)

### In Your Shared Hosting Control Panel:

**Find "DNS Zone Editor" or "DNS Management" and add these 3 A Records:**

| Type | Host | Points To |
|------|------|-----------|
| A | @ | `YOUR_DROPLET_IP` |
| A | www | `YOUR_DROPLET_IP` |
| A | api | `YOUR_DROPLET_IP` |

**Replace `YOUR_DROPLET_IP` with your actual DigitalOcean droplet IP address**

**Wait 10-15 minutes** for DNS to propagate, then verify:

```bash
# Run this on your local computer (not the server)
dig +short groundpoint.net
dig +short www.groundpoint.net
dig +short api.groundpoint.net
```

All three should return your droplet IP address.

---

## Part 2: Create DigitalOcean Droplet

1. Login to DigitalOcean: https://cloud.digitalocean.com
2. Click **"Create"** → **"Droplets"**
3. Choose:
   - **Image**: Ubuntu 22.04 LTS
   - **Size**: Basic - **$24/month** (4 GB RAM / 2 vCPUs)
   - **Region**: Choose closest to you
   - **Authentication**: Add your SSH key (or use password)
   - **Hostname**: groundpoint-server
4. Click **"Create Droplet"**
5. **Note the IP address** (e.g., 143.198.123.45)

---

## Part 3: Connect to Your Droplet

**Open your terminal and run:**

```bash
# Replace YOUR_DROPLET_IP with your actual IP
ssh root@YOUR_DROPLET_IP
```

Type `yes` when asked about fingerprint, then enter password (if using password auth).

You're now connected to your server! 🎉

---

## Part 4: Download and Run Deployment Script

**Copy and paste these commands one by one:**

### Download the script:

```bash
wget https://raw.githubusercontent.com/ddachkinov/GroundPoint/claude/drone-saas-architecture-deliverables-011CV4nFvuXYrHzcVKEzAE9d/deploy-demo.sh
```

### Make it executable:

```bash
chmod +x deploy-demo.sh
```

### Run the deployment:

```bash
./deploy-demo.sh
```

---

## Part 5: Answer the Script Prompts

The script will ask you questions. Here's what to answer:

### 1. Domain Name
```
Enter your domain name: groundpoint.net
```

### 2. Database Password
```
Enter database password: [Press Enter to auto-generate]
```

### 3. Stripe Configuration
```
Do you want to configure Stripe now? (y/n): n
```
*(Skip for now, configure later after viewing the UI)*

### 4. SendGrid Configuration
```
Do you want to configure SendGrid now? (y/n): n
```
*(Skip for now, configure later)*

### 5. AWS S3 Configuration
```
Do you want to configure AWS S3 now? (y/n): n
```
*(Skip for now, configure later)*

### 6. Demo Data
```
Do you want to load sample/demo data? (y/n): y
```
*(Say YES! This loads sample data so you can see the platform immediately)*

### 7. SSL Certificate
```
Do you want to install SSL now? (y/n): y
```
*(Say YES if DNS is already pointing to your server. Say NO if you just updated DNS and it's still propagating)*

---

## Part 6: Wait for Deployment

The script will now automatically:
- Install all software (Node.js, PostgreSQL, Redis, Nginx)
- Set up the database
- Deploy backend and frontend
- Load demo data
- Install SSL certificate
- Configure security

**Time: 10-15 minutes** ☕

You'll see progress messages. Just wait until you see "DEPLOYMENT COMPLETE! 🎉"

---

## Part 7: Access Your Site!

Once deployment completes, the script will show:

```
Frontend: https://groundpoint.net
Backend API: https://api.groundpoint.net
Health Check: https://api.groundpoint.net/health
```

### Test the Backend:

```bash
curl https://api.groundpoint.net/health
```

Should return: `{"status":"ok","timestamp":"..."}`

### Open Your Browser:

Visit: **https://groundpoint.net**

You should see the GroundPoint platform! 🚀

---

## Part 8: Login with Demo Account

The script created demo accounts for you!

### Demo Operator Account (Drone Service Provider):
- **Email**: `operator@demo.groundpoint.net`
- **Password**: `Demo123!`
- Organization: SkyView Drone Services

### Demo Client Account (Construction Company):
- **Email**: `client@demo.groundpoint.net`
- **Password**: `Demo123!`
- Organization: BuildCo Construction

**Login and explore the platform with pre-loaded demo data!**

---

## Troubleshooting

### If SSL Installation Fails:

Your DNS might not be propagated yet. Wait 30 minutes and run:

```bash
sudo certbot --nginx -d groundpoint.net -d www.groundpoint.net -d api.groundpoint.net
```

### If Site Shows "502 Bad Gateway":

Backend might still be starting. Wait 1 minute, then check:

```bash
sudo -u groundpoint pm2 status
sudo -u groundpoint pm2 logs groundpoint-api
```

### If Site Doesn't Load:

Check Nginx is running:

```bash
sudo systemctl status nginx
```

Restart if needed:

```bash
sudo systemctl restart nginx
```

---

## Useful Commands

### View Backend Logs:
```bash
sudo -u groundpoint pm2 logs groundpoint-api
```

### Check Backend Status:
```bash
sudo -u groundpoint pm2 status
```

### Restart Backend:
```bash
sudo -u groundpoint pm2 restart groundpoint-api
```

### View Credentials:
```bash
cat /root/groundpoint-credentials.txt
```

---

## Configure External Services Later

Once you've viewed and approved the UI, configure the external services:

### 1. Edit Backend Configuration:
```bash
nano /home/groundpoint/GroundPoint/backend/.env
```

Update these lines with real values:
- `STRIPE_SECRET_KEY=sk_test_xxxxx` (from Stripe dashboard)
- `STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx`
- `EMAIL_API_KEY=SG.xxxxx` (from SendGrid)
- `S3_BUCKET=your-bucket-name` (from AWS)
- `S3_ACCESS_KEY=your-access-key`
- `S3_SECRET_KEY=your-secret-key`

Save with: `Ctrl+X`, then `Y`, then `Enter`

### 2. Restart Backend:
```bash
sudo -u groundpoint pm2 restart groundpoint-api
```

### 3. Update Frontend:
```bash
nano /home/user/GroundPoint/frontend/.env
```

Update:
- `VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx`

Then rebuild frontend:
```bash
cd /home/groundpoint/GroundPoint/frontend
sudo -u groundpoint npm run build
sudo rm -rf /var/www/groundpoint/*
sudo cp -r dist/* /var/www/groundpoint/
```

---

## Complete Flow (Copy-Paste Ready)

**For quick reference, here's the entire sequence:**

```bash
# 1. Connect to droplet
ssh root@YOUR_DROPLET_IP

# 2. Download script
wget https://raw.githubusercontent.com/ddachkinov/GroundPoint/claude/drone-saas-architecture-deliverables-011CV4nFvuXYrHzcVKEzAE9d/deploy-demo.sh

# 3. Make executable
chmod +x deploy-demo.sh

# 4. Run deployment
./deploy-demo.sh

# Answer prompts:
# - Domain: groundpoint.net
# - Database password: [Press Enter]
# - Stripe: n
# - SendGrid: n
# - AWS S3: n
# - Demo data: y
# - SSL: y

# 5. Wait 10-15 minutes

# 6. Visit https://groundpoint.net

# 7. Login with:
# Email: operator@demo.groundpoint.net
# Password: Demo123!
```

---

## What You'll See

After deployment, you'll have:

✅ **Full working platform** at groundpoint.net
✅ **Demo operator account** with sample projects
✅ **Demo client account** with invoices
✅ **Sample construction project** with drone captures
✅ **Working UI** - all pages functional
✅ **HTTPS enabled** with Let's Encrypt
✅ **Automatic backups** scheduled daily
✅ **Professional deployment** ready for real use

**The platform works immediately with demo data. Add real Stripe/SendGrid/S3 credentials later when ready for production!**

---

## Summary

1. ✅ Setup DNS (5 minutes)
2. ✅ Create DigitalOcean droplet (2 minutes)
3. ✅ Run deployment script (10-15 minutes)
4. ✅ Login and explore demo site
5. ✅ Configure external services when ready

**Total time: ~30 minutes from start to working platform!** 🎉

---

**Need Help?**

View logs:
```bash
sudo -u groundpoint pm2 logs groundpoint-api
```

Check all documentation:
- `DNS_SETUP.md` - Detailed DNS instructions
- `QUICK_START.md` - Full deployment guide
- `DEPLOYMENT.md` - Manual deployment steps
