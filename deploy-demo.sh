#!/bin/bash

################################################################################
# GroundPoint Demo Deployment Script for DigitalOcean Ubuntu 22.04
#
# This script deploys GroundPoint with OPTIONAL external services
# Perfect for viewing the UI before setting up Stripe/SendGrid/AWS
#
# Usage:
#   wget https://raw.githubusercontent.com/your-repo/GroundPoint/main/deploy-demo.sh
#   chmod +x deploy-demo.sh
#   sudo ./deploy-demo.sh
################################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
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

print_info() {
    echo -e "${CYAN}ℹ $1${NC}"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root (use sudo)"
    exit 1
fi

clear
echo -e "${GREEN}"
cat << "EOF"
  ____                           _ ____       _       _
 / ___|_ __ ___  _   _ _ __   __| |  _ \ ___ (_)_ __ | |_
| |  _| '__/ _ \| | | | '_ \ / _` | |_) / _ \| | '_ \| __|
| |_| | | | (_) | |_| | | | | (_| |  __/ (_) | | | | | |_
 \____|_|  \___/ \__,_|_| |_|\__,_|_|   \___/|_|_| |_|\__|

          Auto-Deployment with Demo Mode
EOF
echo -e "${NC}"

print_step "GroundPoint Demo Deployment Starting..."

# Collect configuration
print_step "Configuration Setup"

read -p "Enter your domain name (e.g., groundpoint.net): " DOMAIN_NAME
if [ -z "$DOMAIN_NAME" ]; then
    print_error "Domain name is required!"
    exit 1
fi

API_DOMAIN="api.$DOMAIN_NAME"

print_info "Domain configured: $DOMAIN_NAME"
print_info "API subdomain: $API_DOMAIN"

read -p "Enter database password (will be generated if empty): " DB_PASSWORD
if [ -z "$DB_PASSWORD" ]; then
    DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    print_success "Generated database password: $DB_PASSWORD"
fi

echo ""
print_step "External Services Configuration (Optional)"
print_warning "You can skip these and configure later"
print_info "The UI will work with demo data without these services"
echo ""

# Stripe Configuration (Optional)
echo "=== STRIPE CONFIGURATION (Optional) ==="
read -p "Do you want to configure Stripe now? (y/n): " CONFIGURE_STRIPE

if [ "$CONFIGURE_STRIPE" = "y" ] || [ "$CONFIGURE_STRIPE" = "Y" ]; then
    read -p "Enter Stripe Secret Key (sk_test_... or sk_live_...): " STRIPE_SECRET_KEY
    read -p "Enter Stripe Publishable Key (pk_test_... or pk_live_...): " STRIPE_PUBLISHABLE_KEY
    read -p "Enter Stripe Webhook Secret (whsec_...): " STRIPE_WEBHOOK_SECRET
    read -p "Enter Stripe Connect Client ID (ca_...): " STRIPE_CONNECT_CLIENT_ID
    print_success "Stripe configured!"
else
    # Use demo values
    STRIPE_SECRET_KEY="sk_test_DEMO_KEY_NOT_CONFIGURED"
    STRIPE_PUBLISHABLE_KEY="pk_test_DEMO_KEY_NOT_CONFIGURED"
    STRIPE_WEBHOOK_SECRET="whsec_DEMO_KEY_NOT_CONFIGURED"
    STRIPE_CONNECT_CLIENT_ID="ca_DEMO_KEY_NOT_CONFIGURED"
    print_info "Stripe skipped - using demo mode"
fi

echo ""
# SendGrid Configuration (Optional)
echo "=== SENDGRID EMAIL CONFIGURATION (Optional) ==="
read -p "Do you want to configure SendGrid now? (y/n): " CONFIGURE_EMAIL

if [ "$CONFIGURE_EMAIL" = "y" ] || [ "$CONFIGURE_EMAIL" = "Y" ]; then
    read -p "Enter SendGrid API Key (SG....): " EMAIL_API_KEY
    read -p "Enter SendGrid From Email: " EMAIL_FROM_ADDRESS
    print_success "SendGrid configured!"
else
    EMAIL_API_KEY="SG.DEMO_KEY_NOT_CONFIGURED"
    EMAIL_FROM_ADDRESS="noreply@$DOMAIN_NAME"
    print_info "SendGrid skipped - emails will be logged but not sent"
fi

echo ""
# AWS S3 Configuration (Optional)
echo "=== AWS S3 STORAGE CONFIGURATION (Optional) ==="
read -p "Do you want to configure AWS S3 now? (y/n): " CONFIGURE_S3

if [ "$CONFIGURE_S3" = "y" ] || [ "$CONFIGURE_S3" = "Y" ]; then
    read -p "Enter AWS S3 Bucket Name: " S3_BUCKET
    read -p "Enter AWS Access Key ID: " S3_ACCESS_KEY
    read -p "Enter AWS Secret Access Key: " S3_SECRET_KEY
    read -p "Enter AWS Region (default: us-east-1): " S3_REGION
    S3_REGION=${S3_REGION:-us-east-1}
    print_success "AWS S3 configured!"
else
    S3_BUCKET="groundpoint-demo-bucket"
    S3_ACCESS_KEY="DEMO_KEY_NOT_CONFIGURED"
    S3_SECRET_KEY="DEMO_KEY_NOT_CONFIGURED"
    S3_REGION="us-east-1"
    print_info "AWS S3 skipped - using local file storage (not recommended for production)"
fi

echo ""
# Demo Data
echo "=== DEMO DATA ==="
read -p "Do you want to load sample/demo data? (Recommended for first-time viewing) (y/n): " LOAD_DEMO_DATA

if [ "$LOAD_DEMO_DATA" = "y" ] || [ "$LOAD_DEMO_DATA" = "Y" ]; then
    DEMO_DATA="true"
    print_success "Demo data will be loaded!"
else
    DEMO_DATA="false"
    print_info "Starting with empty database"
fi

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

systemctl start postgresql
systemctl enable postgresql

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

systemctl start redis-server
systemctl enable redis-server

print_success "Redis installed and running"

################################################################################
# STEP 5: Install Nginx
################################################################################
print_step "Step 5: Installing Nginx"

apt install -y nginx

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

rm -rf /home/groundpoint/GroundPoint

sudo -u groundpoint git clone https://github.com/ddachkinov/GroundPoint.git /home/groundpoint/GroundPoint

cd /home/groundpoint/GroundPoint

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

# Load demo data if requested
if [ "$DEMO_DATA" = "true" ]; then
    print_step "Loading Demo Data"

    # Create demo data script
    cat > seed-demo.js <<'SEEDEOF'
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding demo data...');

  // Create demo operator organization
  const operatorOrg = await prisma.organization.create({
    data: {
      name: 'SkyView Drone Services',
      organizationType: 'OPERATOR',
      contactEmail: 'contact@skyview-demo.com',
      phoneNumber: '+1-555-0123',
      address: '123 Aviation Blvd, San Francisco, CA 94102',
      subscriptionTier: 'PROFESSIONAL',
      subscriptionStatus: 'ACTIVE',
    },
  });

  // Create demo site owner organization
  const siteOwnerOrg = await prisma.organization.create({
    data: {
      name: 'BuildCo Construction',
      organizationType: 'SITE_OWNER',
      contactEmail: 'projects@buildco-demo.com',
      phoneNumber: '+1-555-0456',
      address: '456 Construction Ave, Los Angeles, CA 90001',
    },
  });

  // Create demo operator user
  const hashedPassword = await bcrypt.hash('Demo123!', 10);
  const operatorUser = await prisma.user.create({
    data: {
      email: 'operator@demo.groundpoint.net',
      passwordHash: hashedPassword,
      name: 'John Smith',
      role: 'OPERATOR',
      emailVerified: true,
      operatorOrganizationId: operatorOrg.id,
    },
  });

  // Create demo site owner user
  const siteOwnerUser = await prisma.user.create({
    data: {
      email: 'client@demo.groundpoint.net',
      passwordHash: hashedPassword,
      name: 'Sarah Johnson',
      role: 'SITE_OWNER',
      emailVerified: true,
      siteOwnerOrganizationId: siteOwnerOrg.id,
    },
  });

  // Create demo project
  const project = await prisma.project.create({
    data: {
      name: 'Downtown Office Tower',
      description: 'New 25-story commercial building construction project in downtown area',
      operatorOrgId: operatorOrg.id,
      siteOwnerOrgId: siteOwnerOrg.id,
      location: 'Downtown District, San Francisco, CA',
      status: 'ACTIVE',
      startDate: new Date('2024-01-15'),
      estimatedEndDate: new Date('2025-12-31'),
    },
  });

  // Create demo site
  const site = await prisma.site.create({
    data: {
      name: 'Main Construction Site - East Wing',
      projectId: project.id,
      location: '789 Market Street, San Francisco, CA 94103',
      latitude: 37.7749,
      longitude: -122.4194,
      description: 'Primary construction site for the east wing foundation and ground floor',
      status: 'ACTIVE',
    },
  });

  // Create demo captures (without actual images)
  const captureDate1 = new Date('2024-11-01T10:00:00Z');
  const captureDate2 = new Date('2024-11-08T10:00:00Z');
  const captureDate3 = new Date('2024-11-14T10:00:00Z');

  await prisma.capture.createMany({
    data: [
      {
        siteId: site.id,
        capturedAt: captureDate1,
        capturedBy: operatorUser.id,
        imageUrl: 'demo-capture-1.jpg',
        thumbnailUrl: 'demo-capture-1-thumb.jpg',
        angle: 'OVERHEAD',
        altitude: 120.5,
        latitude: 37.7749,
        longitude: -122.4194,
        fileSize: 2457600,
        mimeType: 'image/jpeg',
        processingStatus: 'COMPLETED',
      },
      {
        siteId: site.id,
        capturedAt: captureDate2,
        capturedBy: operatorUser.id,
        imageUrl: 'demo-capture-2.jpg',
        thumbnailUrl: 'demo-capture-2-thumb.jpg',
        angle: 'OVERHEAD',
        altitude: 120.5,
        latitude: 37.7749,
        longitude: -122.4194,
        fileSize: 2598400,
        mimeType: 'image/jpeg',
        processingStatus: 'COMPLETED',
      },
      {
        siteId: site.id,
        capturedAt: captureDate3,
        capturedBy: operatorUser.id,
        imageUrl: 'demo-capture-3.jpg',
        thumbnailUrl: 'demo-capture-3-thumb.jpg',
        angle: 'OVERHEAD',
        altitude: 120.5,
        latitude: 37.7749,
        longitude: -122.4194,
        fileSize: 2712000,
        mimeType: 'image/jpeg',
        processingStatus: 'COMPLETED',
      },
    ],
  });

  // Create demo invoice
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: 'OP-2024-0001',
      operatorOrgId: operatorOrg.id,
      siteOwnerOrgId: siteOwnerOrg.id,
      projectId: project.id,
      status: 'SENT',
      issueDate: new Date('2024-11-01'),
      dueDate: new Date('2024-12-01'),
      currency: 'USD',
      subtotal: 2500.00,
      taxRate: 8.5,
      taxAmount: 212.50,
      totalAmount: 2712.50,
      notes: 'Monthly aerial survey and progress documentation',
      paymentTerms: 'Net 30',
      lineItems: {
        create: [
          {
            description: 'Weekly aerial survey and photography',
            quantity: 4,
            unitPrice: 500.00,
            totalPrice: 2000.00,
          },
          {
            description: '3D model generation and analysis',
            quantity: 1,
            unitPrice: 500.00,
            totalPrice: 500.00,
          },
        ],
      },
    },
  });

  console.log('✅ Demo data loaded successfully!');
  console.log('');
  console.log('📧 Demo Accounts Created:');
  console.log('');
  console.log('   Operator Account:');
  console.log('   Email: operator@demo.groundpoint.net');
  console.log('   Password: Demo123!');
  console.log('   Organization: SkyView Drone Services');
  console.log('');
  console.log('   Client Account:');
  console.log('   Email: client@demo.groundpoint.net');
  console.log('   Password: Demo123!');
  console.log('   Organization: BuildCo Construction');
  console.log('');
  console.log('📊 Demo Data Includes:');
  console.log('   ✓ 1 Active Project (Downtown Office Tower)');
  console.log('   ✓ 1 Construction Site');
  console.log('   ✓ 3 Drone Captures');
  console.log('   ✓ 1 Invoice (Sent status)');
  console.log('');
}

main()
  .catch((e) => {
    console.error('Error seeding demo data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
SEEDEOF

    sudo -u groundpoint node seed-demo.js
    rm seed-demo.js

    print_success "Demo data loaded!"
fi

print_success "Backend setup complete"

################################################################################
# STEP 10: Setup Frontend
################################################################################
print_step "Step 10: Setting Up Frontend"

cd /home/groundpoint/GroundPoint/frontend

cat > .env <<EOF
VITE_API_URL=https://$API_DOMAIN/api/v1
VITE_STRIPE_PUBLISHABLE_KEY=$STRIPE_PUBLISHABLE_KEY
EOF

chown groundpoint:groundpoint .env

print_step "Building Frontend (this may take a few minutes)"
sudo -u groundpoint npm ci --quiet
sudo -u groundpoint npm run build

mkdir -p /var/www/groundpoint
cp -r dist/* /var/www/groundpoint/
chown -R www-data:www-data /var/www/groundpoint

print_success "Frontend built and deployed"

################################################################################
# STEP 11: Install PM2
################################################################################
print_step "Step 11: Installing PM2 Process Manager"

npm install -g pm2

cd /home/groundpoint/GroundPoint/backend
sudo -u groundpoint pm2 start npm --name "groundpoint-api" -- start

env PATH=$PATH:/usr/bin pm2 startup systemd -u groundpoint --hp /home/groundpoint
sudo -u groundpoint pm2 save

print_success "PM2 installed and backend started"

################################################################################
# STEP 12: Configure Nginx
################################################################################
print_step "Step 12: Configuring Nginx"

rm -f /etc/nginx/sites-enabled/default

cat > /etc/nginx/sites-available/groundpoint <<NGINXCONF
# API Backend
server {
    listen 80;
    server_name $API_DOMAIN;

    client_max_body_size 100M;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}

# Frontend
server {
    listen 80;
    server_name $DOMAIN_NAME www.$DOMAIN_NAME;

    root /var/www/groundpoint;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINXCONF

ln -sf /etc/nginx/sites-available/groundpoint /etc/nginx/sites-enabled/

nginx -t
systemctl reload nginx

print_success "Nginx configured"

################################################################################
# STEP 13: Setup SSL
################################################################################
print_step "Step 13: Installing SSL Certificate"

apt install -y certbot python3-certbot-nginx

print_warning "Attempting to install SSL certificate..."
print_info "Make sure your DNS is pointing to this server!"

read -p "Do you want to install SSL now? (y/n): " INSTALL_SSL

if [ "$INSTALL_SSL" = "y" ] || [ "$INSTALL_SSL" = "Y" ]; then
    certbot --nginx -d $DOMAIN_NAME -d www.$DOMAIN_NAME -d $API_DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN_NAME

    if [ $? -eq 0 ]; then
        print_success "SSL certificate installed!"
    else
        print_error "SSL installation failed. Run manually later with:"
        echo "sudo certbot --nginx -d $DOMAIN_NAME -d www.$DOMAIN_NAME -d $API_DOMAIN"
    fi
else
    print_warning "SSL installation skipped. Access via HTTP for now."
    print_info "Run SSL installation later with:"
    echo "sudo certbot --nginx -d $DOMAIN_NAME -d www.$DOMAIN_NAME -d $API_DOMAIN"
fi

################################################################################
# STEP 14: Setup Database Backup
################################################################################
print_step "Step 14: Setting Up Database Backup"

sudo -u groundpoint mkdir -p /home/groundpoint/backups

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

(sudo -u groundpoint crontab -l 2>/dev/null; echo "0 2 * * * /home/groundpoint/backup-db.sh >> /home/groundpoint/backup.log 2>&1") | sudo -u groundpoint crontab -

print_success "Database backup configured (daily at 2 AM)"

################################################################################
# STEP 15: Security Hardening
################################################################################
print_step "Step 15: Applying Security Hardening"

apt install -y fail2ban
systemctl start fail2ban
systemctl enable fail2ban

sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config

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
if [ "$INSTALL_SSL" = "y" ] || [ "$INSTALL_SSL" = "Y" ]; then
    echo "✓ SSL certificate installed"
fi
if [ "$DEMO_DATA" = "true" ]; then
    echo "✓ Demo data loaded"
fi
echo "✓ Database backups scheduled"
echo "✓ Security hardening applied"
echo ""
echo "=========================================="
echo "          ACCESS INFORMATION"
echo "=========================================="
echo ""
if [ "$INSTALL_SSL" = "y" ] || [ "$INSTALL_SSL" = "Y" ]; then
    echo "Frontend: https://$DOMAIN_NAME"
    echo "Backend API: https://$API_DOMAIN"
    echo "Health Check: https://$API_DOMAIN/health"
else
    echo "Frontend: http://$DOMAIN_NAME"
    echo "Backend API: http://$API_DOMAIN"
    echo "Health Check: http://$API_DOMAIN/health"
fi
echo ""

if [ "$DEMO_DATA" = "true" ]; then
    echo "=========================================="
    echo "          DEMO ACCOUNTS"
    echo "=========================================="
    echo ""
    echo "🎭 OPERATOR ACCOUNT (Drone Service Provider):"
    echo "   Email: operator@demo.groundpoint.net"
    echo "   Password: Demo123!"
    echo "   Organization: SkyView Drone Services"
    echo ""
    echo "👷 CLIENT ACCOUNT (Construction Company):"
    echo "   Email: client@demo.groundpoint.net"
    echo "   Password: Demo123!"
    echo "   Organization: BuildCo Construction"
    echo ""
    echo "📊 Sample Data Includes:"
    echo "   • 1 Active Construction Project"
    echo "   • 1 Site with 3 Drone Captures"
    echo "   • 1 Sample Invoice"
    echo ""
fi

echo "=========================================="
echo "          CREDENTIALS SAVED"
echo "=========================================="
echo ""
echo "Database Password: $DB_PASSWORD"
echo "JWT Secret: $JWT_SECRET"
echo ""
echo "Configuration files:"
echo "  Backend: /home/groundpoint/GroundPoint/backend/.env"
echo "  Frontend: /home/groundpoint/GroundPoint/frontend/.env"
echo ""

if [ "$CONFIGURE_STRIPE" != "y" ] && [ "$CONFIGURE_STRIPE" != "Y" ]; then
    echo "=========================================="
    echo "       SERVICES NOT CONFIGURED"
    echo "=========================================="
    echo ""
    if [ "$CONFIGURE_STRIPE" != "y" ]; then
        echo "⚠️  STRIPE: Not configured (payment features disabled)"
        echo "   Configure later by editing: /home/groundpoint/GroundPoint/backend/.env"
    fi
    if [ "$CONFIGURE_EMAIL" != "y" ]; then
        echo "⚠️  SENDGRID: Not configured (emails will be logged only)"
        echo "   Configure later by editing: /home/groundpoint/GroundPoint/backend/.env"
    fi
    if [ "$CONFIGURE_S3" != "y" ]; then
        echo "⚠️  AWS S3: Not configured (file uploads may not work)"
        echo "   Configure later by editing: /home/groundpoint/GroundPoint/backend/.env"
    fi
    echo ""
    echo "After configuring services, restart backend:"
    echo "   sudo -u groundpoint pm2 restart groundpoint-api"
    echo ""
fi

echo "=========================================="
echo "          NEXT STEPS"
echo "=========================================="
echo ""
echo "1. Test the deployment:"
if [ "$INSTALL_SSL" = "y" ] || [ "$INSTALL_SSL" = "Y" ]; then
    echo "   curl https://$API_DOMAIN/health"
    echo "   Visit: https://$DOMAIN_NAME"
else
    echo "   curl http://$API_DOMAIN/health"
    echo "   Visit: http://$DOMAIN_NAME"
fi
echo ""
if [ "$DEMO_DATA" = "true" ]; then
    echo "2. Login with demo account:"
    echo "   Email: operator@demo.groundpoint.net"
    echo "   Password: Demo123!"
    echo ""
fi
echo "3. View backend logs:"
echo "   sudo -u groundpoint pm2 logs groundpoint-api"
echo ""
echo "4. Monitor the application:"
echo "   sudo -u groundpoint pm2 status"
echo "   sudo -u groundpoint pm2 monit"
echo ""
if [ "$CONFIGURE_STRIPE" = "y" ] || [ "$CONFIGURE_STRIPE" = "Y" ]; then
    echo "5. Update Stripe webhook URL to:"
    if [ "$INSTALL_SSL" = "y" ] || [ "$INSTALL_SSL" = "Y" ]; then
        echo "   https://$API_DOMAIN/api/v1/webhooks/stripe"
    else
        echo "   http://$API_DOMAIN/api/v1/webhooks/stripe"
    fi
    echo ""
fi
echo "=========================================="
echo ""

# Create credentials file
cat > /root/groundpoint-credentials.txt <<EOF
GroundPoint Deployment Credentials
Generated: $(date)

Domain: $DOMAIN_NAME
API Domain: $API_DOMAIN

Database Password: $DB_PASSWORD
JWT Secret: $JWT_SECRET
JWT Refresh Secret: $JWT_REFRESH_SECRET

Demo Accounts (if loaded):
- Operator: operator@demo.groundpoint.net / Demo123!
- Client: client@demo.groundpoint.net / Demo123!

Configuration files:
- Backend: /home/groundpoint/GroundPoint/backend/.env
- Frontend: /home/groundpoint/GroundPoint/frontend/.env

Services Configured:
- Stripe: $([ "$CONFIGURE_STRIPE" = "y" ] && echo "Yes" || echo "No (demo mode)")
- SendGrid: $([ "$CONFIGURE_EMAIL" = "y" ] && echo "Yes" || echo "No (demo mode)")
- AWS S3: $([ "$CONFIGURE_S3" = "y" ] && echo "Yes" || echo "No (demo mode)")

Demo Data: $([ "$DEMO_DATA" = "true" ] && echo "Loaded" || echo "Not loaded")
EOF

chmod 600 /root/groundpoint-credentials.txt

print_success "Credentials saved to /root/groundpoint-credentials.txt"
print_success "Deployment complete! Enjoy your GroundPoint platform! 🚀"

exit 0
