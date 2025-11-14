#!/bin/bash

################################################################################
# GroundPoint Auto-Deployment Script for DigitalOcean Ubuntu 22.04
#
# This script automates the complete deployment of GroundPoint platform
# Run as root on a fresh Ubuntu 22.04 droplet
#
# Usage:
#   wget https://raw.githubusercontent.com/your-repo/GroundPoint/main/deploy.sh
#   chmod +x deploy.sh
#   sudo ./deploy.sh
################################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_step() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root (use sudo)"
    exit 1
fi

print_step "GroundPoint Auto-Deployment Starting..."

# Collect configuration
print_step "Configuration Setup"

read -p "Enter your domain name (e.g., groundpoint.com) or press Enter to skip: " DOMAIN_NAME
if [ -z "$DOMAIN_NAME" ]; then
    print_warning "No domain provided. Will use IP address."
    DOMAIN_NAME=$(curl -s ifconfig.me)
    API_DOMAIN="$DOMAIN_NAME:4000"
else
    API_DOMAIN="api.$DOMAIN_NAME"
fi

read -p "Enter database password (will be generated if empty): " DB_PASSWORD
if [ -z "$DB_PASSWORD" ]; then
    DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    print_success "Generated database password: $DB_PASSWORD"
fi

read -p "Enter Stripe Secret Key (sk_test_... or sk_live_...): " STRIPE_SECRET_KEY
read -p "Enter Stripe Publishable Key (pk_test_... or pk_live_...): " STRIPE_PUBLISHABLE_KEY
read -p "Enter Stripe Webhook Secret (whsec_...): " STRIPE_WEBHOOK_SECRET
read -p "Enter Stripe Connect Client ID (ca_...): " STRIPE_CONNECT_CLIENT_ID

read -p "Enter SendGrid API Key (SG....): " EMAIL_API_KEY
read -p "Enter SendGrid From Email: " EMAIL_FROM_ADDRESS

read -p "Enter AWS S3 Bucket Name: " S3_BUCKET
read -p "Enter AWS Access Key ID: " S3_ACCESS_KEY
read -p "Enter AWS Secret Access Key: " S3_SECRET_KEY
read -p "Enter AWS Region (default: us-east-1): " S3_REGION
S3_REGION=${S3_REGION:-us-east-1}

# Generate JWT secrets
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

print_success "Configuration collected!"

################################################################################
# STEP 1: System Update
################################################################################
print_step "Step 1: Updating System Packages"

export DEBIAN_FRONTEND=noninteractive
apt update -qq
apt upgrade -y -qq
apt install -y -qq curl wget git build-essential software-properties-common

print_success "System updated"

################################################################################
# STEP 2: Install Node.js 18
################################################################################
print_step "Step 2: Installing Node.js 18"

curl -fsSL https://deb.nodesource.com/setup_18.x | bash - >/dev/null 2>&1
apt install -y nodejs

NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
print_success "Node.js $NODE_VERSION and npm $NPM_VERSION installed"

################################################################################
# STEP 3: Install PostgreSQL
################################################################################
print_step "Step 3: Installing PostgreSQL"

apt install -y postgresql postgresql-contrib

# Start PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Create database and user
sudo -u postgres psql <<EOF
CREATE DATABASE groundpoint;
CREATE USER groundpoint_user WITH ENCRYPTED PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE groundpoint TO groundpoint_user;
ALTER DATABASE groundpoint OWNER TO groundpoint_user;
\q
EOF

print_success "PostgreSQL installed and configured"

################################################################################
# STEP 4: Install Redis
################################################################################
print_step "Step 4: Installing Redis"

apt install -y redis-server

# Start Redis
systemctl start redis-server
systemctl enable redis-server

print_success "Redis installed and running"

################################################################################
# STEP 5: Install Nginx
################################################################################
print_step "Step 5: Installing Nginx"

apt install -y nginx

# Start Nginx
systemctl start nginx
systemctl enable nginx

print_success "Nginx installed"

################################################################################
# STEP 6: Configure Firewall
################################################################################
print_step "Step 6: Configuring Firewall"

ufw --force enable
ufw allow OpenSSH
ufw allow 'Nginx Full'

print_success "Firewall configured"

################################################################################
# STEP 7: Create Application User
################################################################################
print_step "Step 7: Creating Application User"

if ! id -u groundpoint >/dev/null 2>&1; then
    useradd -m -s /bin/bash groundpoint
    usermod -aG sudo groundpoint
    print_success "User 'groundpoint' created"
else
    print_warning "User 'groundpoint' already exists"
fi

################################################################################
# STEP 8: Clone Repository
################################################################################
print_step "Step 8: Cloning Repository"

# Remove old directory if exists
rm -rf /home/groundpoint/GroundPoint

# Clone as groundpoint user
sudo -u groundpoint git clone https://github.com/ddachkinov/GroundPoint.git /home/groundpoint/GroundPoint

cd /home/groundpoint/GroundPoint

# Checkout feature branch
sudo -u groundpoint git checkout claude/drone-saas-architecture-deliverables-011CV4nFvuXYrHzcVKEzAE9d

print_success "Repository cloned"

################################################################################
# STEP 9: Setup Backend
################################################################################
print_step "Step 9: Setting Up Backend"

cd /home/groundpoint/GroundPoint/backend

# Create .env file
cat > .env <<EOF
NODE_ENV=production
PORT=4000

DATABASE_URL=postgresql://groundpoint_user:$DB_PASSWORD@localhost:5432/groundpoint?schema=public
REDIS_URL=redis://localhost:6379

JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

S3_ENDPOINT=https://s3.amazonaws.com
S3_BUCKET=$S3_BUCKET
S3_ACCESS_KEY=$S3_ACCESS_KEY
S3_SECRET_KEY=$S3_SECRET_KEY
S3_REGION=$S3_REGION

STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=$STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET
STRIPE_CONNECT_CLIENT_ID=$STRIPE_CONNECT_CLIENT_ID
STRIPE_CONNECT_REDIRECT_URI=https://$DOMAIN_NAME/payouts/setup/complete

PLATFORM_FEE_PERCENT=5.0
PLATFORM_FIXED_FEE=0.50

EMAIL_API_KEY=$EMAIL_API_KEY
EMAIL_FROM_ADDRESS=$EMAIL_FROM_ADDRESS
EMAIL_FROM_NAME=GroundPoint

APP_URL=https://$API_DOMAIN
FRONTEND_URL=https://$DOMAIN_NAME

ADMIN_EMAIL=admin@$DOMAIN_NAME
LOG_LEVEL=info

THUMBNAIL_QUEUE_NAME=thumbnail-generation
PAYOUT_QUEUE_NAME=payout-processing
EMAIL_QUEUE_NAME=email-notifications
EOF

chown groundpoint:groundpoint .env
chmod 600 .env

print_success "Backend environment configured"

# Install dependencies
print_step "Installing Backend Dependencies (this may take a few minutes)"
sudo -u groundpoint npm ci --production --quiet

# Generate Prisma Client
print_step "Generating Prisma Client"
sudo -u groundpoint npx prisma generate

# Run migrations
print_step "Running Database Migrations"
sudo -u groundpoint npx prisma migrate deploy

print_success "Backend setup complete"

################################################################################
# STEP 10: Setup Frontend
################################################################################
print_step "Step 10: Setting Up Frontend"

cd /home/groundpoint/GroundPoint/frontend

# Create .env file
cat > .env <<EOF
VITE_API_URL=https://$API_DOMAIN/api/v1
VITE_STRIPE_PUBLISHABLE_KEY=$STRIPE_PUBLISHABLE_KEY
EOF

chown groundpoint:groundpoint .env

# Install dependencies and build
print_step "Building Frontend (this may take a few minutes)"
sudo -u groundpoint npm ci --quiet
sudo -u groundpoint npm run build

# Copy to web directory
mkdir -p /var/www/groundpoint
cp -r dist/* /var/www/groundpoint/
chown -R www-data:www-data /var/www/groundpoint

print_success "Frontend built and deployed"

################################################################################
# STEP 11: Install PM2
################################################################################
print_step "Step 11: Installing PM2 Process Manager"

npm install -g pm2

# Start backend
cd /home/groundpoint/GroundPoint/backend
sudo -u groundpoint pm2 start npm --name "groundpoint-api" -- start

# Configure PM2 startup
env PATH=$PATH:/usr/bin pm2 startup systemd -u groundpoint --hp /home/groundpoint
sudo -u groundpoint pm2 save

print_success "PM2 installed and backend started"

################################################################################
# STEP 12: Configure Nginx
################################################################################
print_step "Step 12: Configuring Nginx"

# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Create GroundPoint site configuration
cat > /etc/nginx/sites-available/groundpoint <<'NGINXCONF'
# API Backend
server {
    listen 80;
    server_name API_DOMAIN_PLACEHOLDER;

    client_max_body_size 100M;

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
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}

# Frontend
server {
    listen 80;
    server_name DOMAIN_NAME_PLACEHOLDER www.DOMAIN_NAME_PLACEHOLDER;

    root /var/www/groundpoint;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINXCONF

# Replace placeholders
sed -i "s/API_DOMAIN_PLACEHOLDER/$API_DOMAIN/g" /etc/nginx/sites-available/groundpoint
sed -i "s/DOMAIN_NAME_PLACEHOLDER/$DOMAIN_NAME/g" /etc/nginx/sites-available/groundpoint

# Enable site
ln -sf /etc/nginx/sites-available/groundpoint /etc/nginx/sites-enabled/

# Test configuration
nginx -t

# Reload Nginx
systemctl reload nginx

print_success "Nginx configured"

################################################################################
# STEP 13: Setup SSL (if domain provided)
################################################################################
if [[ ! "$DOMAIN_NAME" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    print_step "Step 13: Installing SSL Certificate"

    apt install -y certbot python3-certbot-nginx

    print_warning "Attempting to install SSL certificate..."
    print_warning "Make sure your domain DNS is pointing to this server!"

    read -p "Do you want to install SSL now? (y/n): " INSTALL_SSL

    if [ "$INSTALL_SSL" = "y" ]; then
        certbot --nginx -d $DOMAIN_NAME -d www.$DOMAIN_NAME -d $API_DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN_NAME

        if [ $? -eq 0 ]; then
            print_success "SSL certificate installed!"
        else
            print_error "SSL installation failed. You can run it manually later with:"
            echo "sudo certbot --nginx -d $DOMAIN_NAME -d www.$DOMAIN_NAME -d $API_DOMAIN"
        fi
    else
        print_warning "SSL installation skipped. Run later with:"
        echo "sudo certbot --nginx -d $DOMAIN_NAME -d www.$DOMAIN_NAME -d $API_DOMAIN"
    fi
else
    print_warning "Using IP address - skipping SSL setup"
fi

################################################################################
# STEP 14: Setup Database Backup
################################################################################
print_step "Step 14: Setting Up Database Backup"

# Create backup directory
sudo -u groundpoint mkdir -p /home/groundpoint/backups

# Create backup script
cat > /home/groundpoint/backup-db.sh <<EOF
#!/bin/bash
DATE=\$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/groundpoint/backups"
DB_NAME="groundpoint"
DB_USER="groundpoint_user"

PGPASSWORD='$DB_PASSWORD' pg_dump -U \$DB_USER -h localhost \$DB_NAME | gzip > "\$BACKUP_DIR/groundpoint_\$DATE.sql.gz"
find \$BACKUP_DIR -name "groundpoint_*.sql.gz" -mtime +7 -delete
echo "Backup completed: groundpoint_\$DATE.sql.gz"
EOF

chmod +x /home/groundpoint/backup-db.sh
chown groundpoint:groundpoint /home/groundpoint/backup-db.sh

# Add to crontab (daily at 2 AM)
(sudo -u groundpoint crontab -l 2>/dev/null; echo "0 2 * * * /home/groundpoint/backup-db.sh >> /home/groundpoint/backup.log 2>&1") | sudo -u groundpoint crontab -

print_success "Database backup configured (daily at 2 AM)"

################################################################################
# STEP 15: Security Hardening
################################################################################
print_step "Step 15: Applying Security Hardening"

# Install fail2ban
apt install -y fail2ban
systemctl start fail2ban
systemctl enable fail2ban

# Disable root SSH login
sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config

# Restart SSH
systemctl restart ssh

print_success "Security hardening applied"

################################################################################
# Deployment Complete!
################################################################################
print_step "DEPLOYMENT COMPLETE! 🎉"

echo ""
echo "=========================================="
echo "          DEPLOYMENT SUMMARY"
echo "=========================================="
echo ""
echo "✓ Node.js 18 installed"
echo "✓ PostgreSQL database created"
echo "✓ Redis cache installed"
echo "✓ Backend deployed and running on PM2"
echo "✓ Frontend built and deployed"
echo "✓ Nginx configured"
if [[ ! "$DOMAIN_NAME" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "✓ SSL certificate installed (if successful)"
fi
echo "✓ Database backups scheduled"
echo "✓ Security hardening applied"
echo ""
echo "=========================================="
echo "          ACCESS INFORMATION"
echo "=========================================="
echo ""
if [[ "$DOMAIN_NAME" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "Frontend: http://$DOMAIN_NAME"
    echo "Backend API: http://$DOMAIN_NAME:4000"
    echo "Health Check: http://$DOMAIN_NAME:4000/health"
else
    echo "Frontend: https://$DOMAIN_NAME"
    echo "Backend API: https://$API_DOMAIN"
    echo "Health Check: https://$API_DOMAIN/health"
fi
echo ""
echo "=========================================="
echo "          CREDENTIALS SAVED"
echo "=========================================="
echo ""
echo "Database Password: $DB_PASSWORD"
echo "JWT Secret: $JWT_SECRET"
echo ""
echo "These have been saved to:"
echo "  - Backend .env: /home/groundpoint/GroundPoint/backend/.env"
echo "  - Frontend .env: /home/groundpoint/GroundPoint/frontend/.env"
echo ""
echo "=========================================="
echo "          NEXT STEPS"
echo "=========================================="
echo ""
echo "1. Update Stripe webhook URL to: https://$API_DOMAIN/api/v1/webhooks/stripe"
echo "2. Test the deployment:"
echo "   curl https://$API_DOMAIN/health"
echo ""
echo "3. View backend logs:"
echo "   sudo -u groundpoint pm2 logs groundpoint-api"
echo ""
echo "4. Create your first user:"
echo "   Visit https://$DOMAIN_NAME and click 'Register'"
echo ""
echo "5. Monitor the application:"
echo "   sudo -u groundpoint pm2 status"
echo "   sudo -u groundpoint pm2 monit"
echo ""
echo "=========================================="
echo ""

print_success "Deployment script completed successfully!"
print_warning "IMPORTANT: Save the credentials shown above to a secure location!"

# Create credentials file
cat > /root/groundpoint-credentials.txt <<EOF
GroundPoint Deployment Credentials
Generated: $(date)

Database Password: $DB_PASSWORD
JWT Secret: $JWT_SECRET
JWT Refresh Secret: $JWT_REFRESH_SECRET

Frontend URL: https://$DOMAIN_NAME
API URL: https://$API_DOMAIN

Configuration files:
- Backend: /home/groundpoint/GroundPoint/backend/.env
- Frontend: /home/groundpoint/GroundPoint/frontend/.env
EOF

chmod 600 /root/groundpoint-credentials.txt

print_success "Credentials also saved to /root/groundpoint-credentials.txt"

exit 0
